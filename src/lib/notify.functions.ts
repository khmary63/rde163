import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendMaxMessage } from "./max.server";
import { sendInternalTransactionalEmail } from "./email/send.server";

const FeedbackInput = z.object({
  name: z.string().max(200).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  message: z.string().min(1).max(4000),
});

export const notifyNewFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FeedbackInput.parse(input))
  .handler(async ({ data }) => {
    const lines = [
      "🔔 Новое сообщение из виджета РДЭ",
      data.name ? `Имя: ${data.name}` : null,
      data.phone ? `Телефон: ${data.phone}` : null,
      data.email ? `Email: ${data.email}` : null,
      "",
      data.message,
    ].filter(Boolean) as string[];

    await Promise.allSettled([
      sendMaxMessage(lines.join("\n")),
      sendInternalTransactionalEmail({
        templateName: "new-feedback",
        templateData: {
          name: data.name ?? undefined,
          phone: data.phone ?? undefined,
          email: data.email ?? undefined,
          message: data.message,
        },
      }),
    ]);
    return { ok: true };
  });

const OrderNotifyInput = z.object({
  number: z.string().max(64),
  total: z.number(),
  itemsCount: z.number().int(),
  notes: z.string().max(2000).optional().nullable(),
  customer: z.string().max(200).optional().nullable(),
});

export const notifyNewOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => OrderNotifyInput.parse(input))
  .handler(async ({ data }) => {
    const lines = [
      "📦 Новая заявка РДЭ",
      `№ ${data.number}`,
      data.customer ? `Клиент: ${data.customer}` : null,
      `Позиций: ${data.itemsCount}`,
      `Сумма: ${data.total.toLocaleString("ru-RU")} ₽`,
      data.notes ? `\nКомментарий: ${data.notes}` : null,
    ].filter(Boolean) as string[];

    await Promise.allSettled([
      sendMaxMessage(lines.join("\n")),
      sendInternalTransactionalEmail({
        templateName: "new-order",
        idempotencyKey: `new-order-${data.number}`,
        templateData: {
          number: data.number,
          customer: data.customer ?? "—",
          itemsCount: data.itemsCount,
          total: data.total,
          notes: data.notes ?? undefined,
        },
      }),
    ]);
    return { ok: true };
  });
