import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE = "https://rde163.lovable.app";

const STATIC_PATHS = ["/", "/catalog", "/reviews", "/contacts", "/blog", "/login", "/register"];

export const Route = createFileRoute("/api/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data: posts } = await supabaseAdmin
          .from("blog_posts")
          .select("slug, updated_at")
          .eq("is_published", true);

        const urls: string[] = [];
        for (const p of STATIC_PATHS) {
          urls.push(`<url><loc>${BASE}${p}</loc></url>`);
        }
        for (const post of posts ?? []) {
          urls.push(
            `<url><loc>${BASE}/blog/${post.slug}</loc><lastmod>${new Date(post.updated_at).toISOString()}</lastmod></url>`,
          );
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
