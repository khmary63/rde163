import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isStaff = (roles ?? []).some((r) => r.role === "admin" || r.role === "manager");
  if (!isStaff) throw new Error("Доступ только для администраторов");
}

/**
 * Kick off catalog sync and return immediately with the sync_logs id.
 * The actual work runs in the background via `waitUntil` so the browser
 * does not need to keep the HTTP connection open for ~30s (Kaspersky/
 * corporate proxies routinely kill long-running responses).
 */
export const startCatalogSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { createCatalogSyncLog, runCatalogSync } = await import("./catalog-sync.server");
    const logId = await createCatalogSyncLog("manual");
    // Run in the background; errors are persisted to sync_logs by runCatalogSync.
    const work = runCatalogSync("manual", logId).catch(() => undefined);
    try {
      // Cloudflare Workers: keep the worker alive until the promise settles.
      (getRequest() as unknown as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil?.(work);
    } catch {
      // ignore — fall back to fire-and-forget
    }
    return { logId };
  });

export const getCatalogSyncStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { logId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("sync_logs")
      .select("status, message, details, rows_processed, rows_failed, finished_at, started_at")
      .eq("id", data.logId)
      .maybeSingle();
    return row;
  });
