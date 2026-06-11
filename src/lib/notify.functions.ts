import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendMaxMessage } from "./max.server";
import { sendInternalTransactionalEmail } from "./email/send.server";


const FeedbackInput = z.object({
  feedback_id: z.string().uuid(),
});

export const notifyNewFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FeedbackInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Look up the feedback row to ensure it exists in the DB.
    // This ties every notification to a real, RLS-validated row and prevents
    // attackers from spamming managers by hitting this endpoint directly.
    const { data: row, error } = await supabaseAdmin
      .from("feedback_messages")
      .select("id, name, phone, email, message, created_at")
      .eq("id", data.feedback_id)
      .maybeSingle();

    if (error || !row) {
      // Don't reveal details; just no-op.
      return { ok: false };
    }

    const lines = [
      "🔔 Новое сообщение из виджета РДЭ",
      row.name ? `Имя: ${row.name}` : null,
      row.phone ? `Телефон: ${row.phone}` : null,
      row.email ? `Email: ${row.email}` : null,
      "",
      row.message,
    ].filter(Boolean) as string[];

    await Promise.allSettled([
      sendMaxMessage(lines.join("\n")),
      sendInternalTransactionalEmail({
        templateName: "new-feedback",
        templateData: {
          name: row.name ?? undefined,
          phone: row.phone ?? undefined,
          email: row.email ?? undefined,
          message: row.message,
        },
      }),
    ]);
    return { ok: true };
  });

// notifyNewOrder removed for security: order notifications are now sent only
// from submitOrder (auth-protected) to prevent unauthenticated spam.
