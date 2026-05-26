import { createFileRoute } from "@tanstack/react-router";
import { runCatalogSync } from "@/lib/catalog-sync.server";

export const Route = createFileRoute("/api/public/hooks/sync-catalog")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const summary = await runCatalogSync("cron");
          return Response.json({ ok: true, summary });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
      GET: async () => {
        // allow GET as a health check / manual ping
        try {
          const summary = await runCatalogSync("cron");
          return Response.json({ ok: true, summary });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
    },
  },
});
