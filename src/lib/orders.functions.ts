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
  unit_price: z.number().min(0),
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

    const total = data.items.reduce((s, it) => s + it.qty * it.unit_price, 0);

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

    const rows = data.items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      warehouse_id: it.warehouse_id,
      qty: it.qty,
      unit_price: it.unit_price,
      discount_percent: 0,
      line_total: it.qty * it.unit_price,
      action: "buy" as const,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) {
      throw new Error(itemsErr.message);
    }

    // Уведомление менеджеру в MAX (не блокирует ответ)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name, phone, email")
      .eq("id", userId)
      .maybeSingle();
    const customer = profile?.company_name || profile?.full_name || profile?.email || "—";

    // Соберём названия товаров/складов для Excel-выгрузки
    const productIds = Array.from(new Set(data.items.map((it) => it.product_id)));
    const warehouseIds = Array.from(new Set(data.items.map((it) => it.warehouse_id)));
    const [{ data: products }, { data: warehouses }] = await Promise.all([
      supabase.from("products").select("id, name, sku").in("id", productIds),
      supabase.from("warehouses").select("id, name").in("id", warehouseIds),
    ]);
    const productMap = new Map((products ?? []).map((p) => [p.id, p]));
    const warehouseMap = new Map((warehouses ?? []).map((w) => [w.id, w]));
    const exportItems: OrderExportItem[] = data.items.map((it) => {
      const p = productMap.get(it.product_id);
      const w = warehouseMap.get(it.warehouse_id);
      return {
        product_name: p?.name ?? it.product_id,
        product_sku: p?.sku ?? null,
        warehouse_name: w?.name ?? it.warehouse_id,
        qty: it.qty,
        unit_price: it.unit_price,
        line_total: it.qty * it.unit_price,
      };
    });

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
