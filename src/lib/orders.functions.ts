import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendMaxMessage } from "./max.server";
import { sendInternalTransactionalEmail } from "./email/send.server";
import { buildAndUploadOrderXlsx, type OrderExportItem } from "./orders-export.server";

const OrderItemInput = z.object({
  product_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  qty: z.number().int().min(1).max(10000),
});

const SubmitInput = z.object({
  items: z.array(OrderItemInput).min(1).max(500),
  notes: z.string().max(2000).optional(),
  invoice_grouping: z.enum(["single", "per_warehouse"]).default("single"),
});

export const submitOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // SECURITY: prices must be computed server-side, never trusted from the client.
    // Fetch authoritative base prices and product info for all requested products.
    const productIds = Array.from(new Set(data.items.map((it) => it.product_id)));
    const warehouseIds = Array.from(new Set(data.items.map((it) => it.warehouse_id)));

    const [{ data: products, error: productsErr }, { data: warehouses }, { data: profile }] =
      await Promise.all([
        supabase
          .from("products")
          .select("id, name, sku, base_price, brand:brands(name)")
          .in("id", productIds),
        supabase.from("warehouses").select("id, name").in("id", warehouseIds),
        supabase
          .from("profiles")
          .select("full_name, company_name, phone, email, discount_percent")
          .eq("id", userId)
          .maybeSingle(),
      ]);

    if (productsErr) throw new Error(productsErr.message);
    if (!products || products.length !== productIds.length) {
      throw new Error("Некоторые товары недоступны");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const warehouseMap = new Map((warehouses ?? []).map((w) => [w.id, w]));

    // Per-user discount: take the higher of profile.discount_percent or a row in discounts
    const { data: discountRow } = await supabase
      .from("discounts")
      .select("percent")
      .eq("user_id", userId)
      .maybeSingle();
    const profileDiscount = Number(profile?.discount_percent ?? 0);
    const rowDiscount = Number(discountRow?.percent ?? 0);
    const discountPercent = Math.max(0, Math.min(100, Math.max(profileDiscount, rowDiscount)));

    // Build priced rows server-side
    const priced = data.items.map((it) => {
      const p = productMap.get(it.product_id)!;
      const basePrice = Number(p.base_price);
      const unitPrice = +(basePrice * (1 - discountPercent / 100)).toFixed(2);
      const lineTotal = +(unitPrice * it.qty).toFixed(2);
      return {
        product_id: it.product_id,
        warehouse_id: it.warehouse_id,
        qty: it.qty,
        unit_price: unitPrice,
        discount_percent: discountPercent,
        line_total: lineTotal,
        product_name: p.name,
        product_sku: p.sku as string | null,
      };
    });

    const total = +priced.reduce((s, r) => s + r.line_total, 0).toFixed(2);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "submitted",
        invoice_grouping: data.invoice_grouping,
        notes: data.notes ?? null,
        total_amount: total,
        submitted_at: new Date().toISOString(),
      })
      .select("id, number")
      .single();

    if (orderErr || !order) {
      throw new Error(orderErr?.message ?? "Не удалось создать заявку");
    }

    const rows = priced.map((r) => ({
      order_id: order.id,
      product_id: r.product_id,
      warehouse_id: r.warehouse_id,
      qty: r.qty,
      unit_price: r.unit_price,
      discount_percent: r.discount_percent,
      line_total: r.line_total,
      action: "buy" as const,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) {
      throw new Error(itemsErr.message);
    }

    const customer = profile?.company_name || profile?.full_name || profile?.email || "—";

    const exportItems: OrderExportItem[] = priced.map((r) => ({
      product_name: r.product_name,
      product_sku: r.product_sku,
      warehouse_name: warehouseMap.get(r.warehouse_id)?.name ?? r.warehouse_id,
      qty: r.qty,
      unit_price: r.unit_price,
      line_total: r.line_total,
    }));

    const xlsx = await buildAndUploadOrderXlsx({
      number: String(order.number),
      customer,
      phone: profile?.phone ?? null,
      email: profile?.email ?? null,
      notes: data.notes ?? null,
      total,
      invoice_grouping: data.invoice_grouping,
      items: exportItems,
    });

    const lines = [
      "📦 Новая заявка РДЭ",
      `№ ${order.number}`,
      `Клиент: ${customer}`,
      profile?.phone ? `Телефон: ${profile.phone}` : null,
      `Позиций: ${data.items.length}`,
      `Сумма: ${total.toLocaleString("ru-RU")} ₽`,
      xlsx ? `\nExcel: ${xlsx.url}` : null,
      data.notes ? `\nКомментарий: ${data.notes}` : null,
    ].filter(Boolean) as string[];
    await Promise.allSettled([
      sendMaxMessage(lines.join("\n")),
      sendInternalTransactionalEmail({
        templateName: "new-order",
        idempotencyKey: `new-order-${order.number}`,
        templateData: {
          number: order.number,
          customer,
          phone: profile?.phone ?? undefined,
          itemsCount: data.items.length,
          total,
          notes: data.notes ?? undefined,
          xlsxUrl: xlsx?.url,
        },
      }),
    ]);

    return { id: order.id, number: order.number };
  });
