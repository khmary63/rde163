import { createFileRoute, Outlet, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { chapters } from "@/demo/chapters";
import { ChevronLeft, ChevronRight, Play, Pause, Maximize2, Monitor, Smartphone, Printer, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Демо — РДЭ · кейс в портфолио" },
      { name: "description", content: "Интерактивная презентация B2B-каталога РДЭ: главная, каталог, корзина, личный кабинет, админка, аналитика." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DemoLayout,
});

function DemoLayout() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[oklch(0.12_0.01_250)] text-foreground">
      <DemoChrome />
      <div className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[260px_1fr]">
        <DemoSidebar />
        <div className="min-h-0 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function DemoChrome() {
  const params = useParams({ strict: false }) as { chapter?: string };
  const slug = params.chapter;
  const idx = Math.max(0, chapters.findIndex((c) => c.slug === slug));
  const navigate = useNavigate();

  const go = useCallback(
    (delta: number) => {
      const next = (idx + delta + chapters.length) % chapters.length;
      navigate({ to: "/demo/$chapter", params: { chapter: chapters[next].slug } });
    },
    [idx, navigate],
  );

  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => go(1), chapters[idx].duration);
    return () => clearTimeout(t);
  }, [playing, idx, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key.toLowerCase() === "f") document.documentElement.requestFullscreen?.();
      if (e.key.toLowerCase() === "p") setPlaying((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const ch = chapters[idx];

  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[oklch(0.16_0.01_250)] px-4 text-white">
      <div className="flex items-center gap-3">
        <Link to="/portfolio/rde163" className="font-display text-sm uppercase tracking-[0.2em] text-white/80 hover:text-accent-orange">
          ← к кейсу
        </Link>
        <span className="hidden h-4 w-px bg-white/20 sm:block" />
        <span className="hidden sm:block font-mono text-[11px] uppercase tracking-[0.25em] text-accent-orange">
          demo · rde163
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => go(-1)} className="rounded p-2 hover:bg-white/10" aria-label="Назад">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-mono text-xs tabular-nums text-white/80">
          {String(idx + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
        </div>
        <button onClick={() => go(1)} className="rounded p-2 hover:bg-white/10" aria-label="Вперёд">
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="mx-1 h-4 w-px bg-white/20" />
        <button
          onClick={() => setPlaying((p) => !p)}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium ${playing ? "bg-accent-orange text-white" : "hover:bg-white/10"}`}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {playing ? "Стоп" : "Авто-тур"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <ViewportToggle viewport={ch.viewport} />
        <button
          onClick={() => document.documentElement.requestFullscreen?.()}
          className="rounded p-2 hover:bg-white/10"
          aria-label="Полный экран"
          title="Полный экран (F)"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <Link to="/demo/print" className="rounded p-2 hover:bg-white/10" title="Печать / PDF">
          <Printer className="h-4 w-4" />
        </Link>
        <a
          href={ch.path}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1 rounded px-3 py-1.5 text-xs hover:bg-white/10"
          title="Открыть страницу в новой вкладке"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {ch.path}
        </a>
      </div>
    </div>
  );
}

function ViewportToggle({ viewport }: { viewport: "desktop" | "mobile" }) {
  return (
    <div className="hidden md:flex items-center gap-1 rounded border border-white/10 p-0.5">
      <span className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${viewport === "desktop" ? "bg-white/15 text-white" : "text-white/50"}`}>
        <Monitor className="h-3 w-3" /> Desktop
      </span>
      <span className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${viewport === "mobile" ? "bg-white/15 text-white" : "text-white/50"}`}>
        <Smartphone className="h-3 w-3" /> Mobile
      </span>
    </div>
  );
}

function DemoSidebar() {
  const params = useParams({ strict: false }) as { chapter?: string };
  const active = params.chapter;
  return (
    <aside className="hidden overflow-y-auto border-r border-white/10 bg-[oklch(0.14_0.01_250)] text-white/80 lg:block">
      <div className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
        / главы
      </div>
      <ol className="space-y-px px-2 pb-6">
        {chapters.map((c, i) => {
          const isActive = c.slug === active;
          return (
            <li key={c.slug}>
              <Link
                to="/demo/$chapter"
                params={{ chapter: c.slug }}
                className={`flex items-start gap-3 rounded px-3 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-accent-orange/15 text-white" : "hover:bg-white/5"
                }`}
              >
                <span className={`mt-0.5 font-mono text-[10px] tabular-nums ${isActive ? "text-accent-orange" : "text-white/40"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 leading-tight">
                  <span className="block font-medium">{c.title}</span>
                  <span className="block text-[11px] text-white/40">{c.subtitle}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
