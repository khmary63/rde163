import { createFileRoute, Link } from "@tanstack/react-router";
import { blogPosts } from "@/data/mock";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/blog/")({
  head: () => ({ meta: [{ title: "Блог — ГРОСС Запчасти" }] }),
  component: () => (
    <div className="mx-auto max-w-[1400px] px-4 py-16">
      <h1 className="font-display text-4xl mb-8">Блог</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {blogPosts.map((p) => (
          <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }} className="group rounded-lg border border-border bg-surface/60 overflow-hidden hover:border-brand/60 transition-colors">
            <div className="aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `url(${p.cover})` }} />
            <div className="p-5 space-y-2">
              <div className="text-xs font-mono text-brand uppercase tracking-wider">{p.category}</div>
              <h4 className="font-display text-lg leading-tight group-hover:text-brand transition-colors">{p.title}</h4>
              <p className="text-sm text-muted-foreground">{p.excerpt}</p>
              <div className="text-xs font-mono text-muted-foreground pt-2">{formatDate(p.date)} · {p.readTime} мин</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  ),
});
