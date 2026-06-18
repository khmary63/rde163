import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Play, Printer, ExternalLink, Code2, Database, Palette, Zap } from "lucide-react";
import { chapters } from "@/demo/chapters";

export const Route = createFileRoute("/portfolio/rde163")({
  head: () => ({
    meta: [
      { title: "РДЭ — кейс портфолио · B2B-каталог запчастей" },
      { name: "description", content: "Кейс портфолио: B2B-каталог запчастей для китайской спецтехники. TanStack Start, Postgres, ролевая админка, импорт прайса, аналитика." },
      { property: "og:title", content: "РДЭ — кейс портфолио" },
      { property: "og:description", content: "B2B-платформа: 40k SKU, персональные цены, админка, аналитика." },
      { property: "og:type", content: "article" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-[oklch(0.14_0.01_250)] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.7_0.02_250)_1px,transparent_1px),linear-gradient(90deg,oklch(0.7_0.02_250)_1px,transparent_1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative mx-auto max-w-[1200px] px-6 py-20 lg:py-28">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-orange">
            / кейс · 2024–2026
          </div>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[0.9] lg:text-7xl">
            РДЭ — B2B-каталог<br />
            <span className="text-white/50">запчастей для спецтехники</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base text-white/70 lg:text-lg">
            Полная платформа: каталог из 40 000+ SKU с фильтрами и поиском по OEM-номерам,
            персональные цены для юрлиц, ролевая админка с импортом прайса, аналитика,
            транзакционные письма. Mobile-first, SSR, типобезопасные server functions.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/demo/$chapter"
              params={{ chapter: chapters[0].slug }}
              className="group inline-flex items-center gap-2 rounded-none bg-accent-orange px-6 py-4 font-display text-sm font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black"
            >
              <Play className="h-4 w-4" />
              Открыть интерактивное демо
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/demo/print"
              className="inline-flex items-center gap-2 rounded-none border border-white/30 px-6 py-4 text-sm font-medium hover:bg-white/10"
            >
              <Printer className="h-4 w-4" />
              PDF-версия
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-none border border-white/30 px-6 py-4 text-sm font-medium hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              Открыть сайт
            </a>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-4">
            <Metric n="40k+" l="SKU в каталоге" />
            <Metric n="8" l="складов по РФ" />
            <Metric n="~30 сек" l="на оформление" />
            <Metric n="100%" l="type-safe" />
          </div>
        </div>
      </section>

      {/* SCREENS */}
      <section className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-orange">
              / экраны
            </div>
            <h2 className="mt-3 font-display text-4xl font-bold lg:text-5xl">
              10 глав · от витрины до админки
            </h2>
          </div>
          <Link
            to="/demo/$chapter"
            params={{ chapter: chapters[0].slug }}
            className="inline-flex items-center gap-1.5 border-b border-foreground pb-0.5 font-display text-sm uppercase tracking-wider hover:text-accent-orange hover:border-accent-orange"
          >
            прокликать всё <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((c, i) => (
            <Link
              key={c.slug}
              to="/demo/$chapter"
              params={{ chapter: c.slug }}
              className="group block border border-border bg-surface transition-colors hover:border-accent-orange"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[oklch(0.18_0.01_250)]">
                <iframe
                  src={`${c.path}?demo=1`}
                  title={c.title}
                  loading="lazy"
                  className="pointer-events-none absolute inset-0 origin-top-left border-0"
                  style={{
                    width: c.viewport === "mobile" ? "390px" : "1440px",
                    height: c.viewport === "mobile" ? "844px" : "900px",
                    transform: c.viewport === "mobile" ? "scale(0.45)" : "scale(0.32)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="border-t border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")} · {c.viewport}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-accent-orange" />
                </div>
                <div className="mt-1 font-display text-base font-bold leading-tight">{c.title}</div>
                <div className="text-xs text-muted-foreground">{c.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* STACK */}
      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-orange">
            / стек и архитектура
          </div>
          <h2 className="mt-3 font-display text-4xl font-bold lg:text-5xl">
            Что под капотом
          </h2>
          <div className="mt-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            <Tech
              icon={Code2}
              title="Фронт"
              items={["TanStack Start v1", "React 19 + SSR", "TypeScript strict", "Vite 7"]}
            />
            <Tech
              icon={Database}
              title="Бэкенд"
              items={["Postgres + RLS", "Server Functions", "Edge runtime", "Транзакционный email"]}
            />
            <Tech
              icon={Palette}
              title="Дизайн"
              items={["Tailwind v4", "Oklch-токены", "shadcn/ui", "Brutalist hi-tech"]}
            />
            <Tech
              icon={Zap}
              title="Фичи"
              items={["Импорт прайса 1С", "Персональные скидки", "Live-остатки", "Excel-выгрузка"]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 text-center">
        <h2 className="font-display text-4xl font-bold lg:text-5xl">
          Хочется увидеть в деталях?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Прокликайте 10 экранов или скачайте PDF — без регистрации, без ограничений.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/demo/$chapter"
            params={{ chapter: chapters[0].slug }}
            className="inline-flex items-center gap-2 bg-accent-orange px-6 py-4 font-display text-sm font-bold uppercase tracking-wider text-white hover:bg-foreground"
          >
            <Play className="h-4 w-4" /> Запустить демо
          </Link>
          <Link
            to="/demo/print"
            className="inline-flex items-center gap-2 border border-foreground px-6 py-4 text-sm font-medium hover:bg-foreground hover:text-background"
          >
            <Printer className="h-4 w-4" /> PDF
          </Link>
        </div>
      </section>
    </div>
  );
}

function Metric({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-4xl font-bold text-accent-orange tabular-nums">{n}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-white/50">{l}</div>
    </div>
  );
}

function Tech({ icon: Icon, title, items }: { icon: typeof Code2; title: string; items: string[] }) {
  return (
    <div className="bg-background p-6">
      <Icon className="h-6 w-6 text-accent-orange" strokeWidth={1.5} />
      <div className="mt-4 font-display text-lg font-bold uppercase tracking-wider">{title}</div>
      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-accent-orange" /> {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
