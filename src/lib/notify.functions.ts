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

// notifyNewOrder removed for security: order notifications are now sent only
// from submitOrder (auth-protected) to prevent unauthenticated spam.
