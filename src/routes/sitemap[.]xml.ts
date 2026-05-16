import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE = "https://rde163.ru";

const STATIC: { path: string; changefreq?: string; priority?: string }[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/catalog", changefreq: "daily", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/reviews", changefreq: "monthly", priority: "0.6" },
  { path: "/contacts", changefreq: "monthly", priority: "0.6" },
  { path: "/login", priority: "0.3" },
  { path: "/register", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data: posts } = await supabaseAdmin
          .from("blog_posts")
          .select("slug, updated_at")
          .eq("is_published", true);

        const urls: string[] = [];
        for (const s of STATIC) {
          urls.push(
            [
              `  <url>`,
              `    <loc>${BASE}${s.path}</loc>`,
              s.changefreq ? `    <changefreq>${s.changefreq}</changefreq>` : null,
              s.priority ? `    <priority>${s.priority}</priority>` : null,
              `  </url>`,
            ].filter(Boolean).join("\n"),
          );
        }
        for (const p of posts ?? []) {
          urls.push(
            [
              `  <url>`,
              `    <loc>${BASE}/blog/${p.slug}</loc>`,
              `    <lastmod>${new Date(p.updated_at as string).toISOString()}</lastmod>`,
              `    <changefreq>monthly</changefreq>`,
              `    <priority>0.6</priority>`,
              `  </url>`,
            ].join("\n"),
          );
        }
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
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
