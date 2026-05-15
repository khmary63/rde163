import { createFileRoute } from "@tanstack/react-router";
import { reviews } from "@/data/mock";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/reviews")({
  head: () => ({ meta: [{ title: "Отзывы — ГРОСС Запчасти" }] }),
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
