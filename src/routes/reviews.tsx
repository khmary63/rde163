import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { reviews } from "@/data/mock";
import { formatDate } from "@/lib/format";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  component: ReviewsPage,
});

function ReviewsPage() {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [author, setAuthor] = useState("");
  const [company, setCompany] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (author.trim().length < 2) return toast.error("Укажите ваше имя");
    if (text.trim().length < 10) return toast.error("Отзыв должен быть не короче 10 символов");
    if (rating < 1 || rating > 5) return toast.error("Поставьте оценку от 1 до 5");

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      author_name: author.trim(),
      company: company.trim() || null,
      text: text.trim(),
      rating,
      source: "site",
      is_published: false,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Не удалось отправить отзыв. Попробуйте ещё раз.");
      return;
    }
    toast.success("Спасибо! Отзыв отправлен на модерацию.");
    setAuthor("");
    setCompany("");
    setText("");
    setRating(5);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-16">
      <h1 className="font-display text-4xl mb-8">Отзывы клиентов</h1>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8 mb-12">
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
                </div>

                <span className="text-xs font-mono text-muted-foreground">{formatDate(r.date)}</span>
              </div>
              {r.reply && <div className="rounded-md bg-background border-l-2 border-brand p-3 text-xs"><span className="font-semibold text-brand">Ответ магазина: </span>{r.reply}</div>}
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 h-fit rounded-lg border border-border bg-surface/60 p-6">
          <h2 className="font-display text-2xl mb-2">Оставить отзыв</h2>
          <p className="text-sm text-muted-foreground mb-5">Ваш отзыв будет опубликован после модерации.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-2 block">Оценка</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className="text-3xl leading-none transition-colors"
                    aria-label={`Оценка ${n}`}
                  >
                    <span className={(hover || rating) >= n ? "text-brand" : "text-muted-foreground/40"}>★</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="author" className="mb-2 block">Имя *</Label>
              <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={200} required />
            </div>
            <div>
              <Label htmlFor="company" className="mb-2 block">Компания</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={200} />
            </div>
            <div>
              <Label htmlFor="text" className="mb-2 block">Отзыв *</Label>
              <Textarea id="text" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} rows={5} required />
              <div className="text-xs text-muted-foreground mt-1">{text.length}/4000</div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Отправка…" : "Отправить отзыв"}
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
