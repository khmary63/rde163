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
    const lines = [
      "📦 Новая заявка РДЭ",
      `№ ${order.number}`,
      `Клиент: ${customer}`,
      profile?.phone ? `Телефон: ${profile.phone}` : null,
      `Позиций: ${data.items.length}`,
      `Сумма: ${total.toLocaleString("ru-RU")} ₽`,
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
        },
      }),
    ]);

    return { id: order.id, number: order.number };
  });
