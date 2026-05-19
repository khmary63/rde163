import { createFileRoute } from "@tanstack/react-router";
import { reviews } from "@/data/mock";
import { formatDate } from "@/lib/format";

const BASE = "https://rde163.ru";

export const Route = createFileRoute("/reviews")({
  head: () => {
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    const aggregate = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Русский Дом Экспорта",
      url: BASE,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avg.toFixed(2),
        reviewCount: count,
        bestRating: "5",
        worstRating: "1",
      },
      review: reviews.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.author },
        datePublished: r.date,
        reviewBody: r.text,
        reviewRating: {
          "@type": "Rating",
          ratingValue: String(r.rating),
          bestRating: "5",
          worstRating: "1",
        },
      })),
    };
    return {
      meta: [
        { title: "Отзывы клиентов — РДЭ Запчасти" },
        { name: "description", content: "Реальные отзывы B2B-клиентов РДЭ о поставках запчастей для китайской спецтехники и грузовиков." },
        { property: "og:title", content: "Отзывы клиентов РДЭ" },
        { property: "og:description", content: "Что говорят B2B-клиенты о работе с РДЭ." },
        { property: "og:url", content: `${BASE}/reviews` },
      ],
      links: [{ rel: "canonical", href: `${BASE}/reviews` }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(aggregate) },
      ],
    };
  },
  component: () => (
    <div className="mx-auto max-w-[1400px] px-4 py-16">
      <h1 className="font-display text-4xl mb-8">Отзывы клиентов</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-surface/60 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <span key={i} className="text-brand">★</span>)}</div>
              <span className="text-xs font-mono text-muted-foreground uppercase">{r.source === "yandex" ? "Яндекс.Карты" : "Сайт"}</span>
            </div>
            <p className="text-sm leading-relaxed">«{r.text}»</p>
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div>
                <div className="font-medium text-sm">{r.author}</div>
                {r.company && <div className="text-xs text-muted-foreground">{r.company}</div>}
              </div>
              <span className="text-xs font-mono text-muted-foreground">{formatDate(r.date)}</span>
            </div>
            {r.reply && <div className="rounded-md bg-background border-l-2 border-brand p-3 text-xs"><span className="font-semibold text-brand">Ответ магазина: </span>{r.reply}</div>}
          </div>
        ))}
      </div>
    </div>
  ),
});
