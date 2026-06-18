import { createFileRoute } from "@tanstack/react-router";
import { chapters } from "@/demo/chapters";

export const Route = createFileRoute("/demo/print")({
  head: () => ({
    meta: [
      { title: "РДЭ — печатная версия демо" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PrintPage,
});

function PrintPage() {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-white text-black">
      <style>{`
        @page { size: A4 landscape; margin: 12mm }
        @media print {
          .no-print { display: none !important }
          .page { page-break-after: always; break-after: page }
        }
      `}</style>
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-500">rde163 · print</div>
        <button
          onClick={() => window.print()}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Скачать PDF / Печать
        </button>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-10">
        <div className="page mb-16 border-b pb-10">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-orange-600">/ кейс портфолио</div>
          <h1 className="mt-3 font-display text-5xl font-bold leading-[0.95]">
            РДЭ — B2B-каталог запчастей<br />
            <span className="text-neutral-500">для китайской спецтехники</span>
          </h1>
          <p className="mt-6 max-w-3xl text-base text-neutral-700 leading-relaxed">
            Полнофункциональная B2B-платформа: каталог из 40 000+ SKU, персональные цены,
            ролевая админка, импорт прайса, транзакционные письма, аналитика. TanStack Start (React + SSR),
            Tailwind, Postgres + RLS, server functions.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6 border-t pt-6">
            <Stat n="40 000+" l="SKU в каталоге" />
            <Stat n="8" l="складов по РФ" />
            <Stat n="~30 сек" l="на оформление заявки" />
          </div>
        </div>

        {chapters.map((c, i) => (
          <section key={c.slug} className="page mb-16">
            <div className="mb-4 flex items-baseline justify-between border-b pb-2">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-600">
                  глава {String(i + 1).padStart(2, "0")}
                </div>
                <h2 className="font-display text-3xl font-bold">{c.title}</h2>
                <p className="text-sm text-neutral-600">{c.subtitle}</p>
              </div>
              <div className="font-mono text-xs text-neutral-500">{c.path}</div>
            </div>
            <div className="aspect-[16/9] w-full overflow-hidden border bg-neutral-50">
              <iframe
                src={`${c.path}?demo=1`}
                title={c.title}
                className="h-full w-full border-0"
                style={{
                  transform: "scale(0.62)",
                  transformOrigin: "top left",
                  width: "161%",
                  height: "161%",
                }}
              />
            </div>
            <ul className="mt-3 grid grid-cols-3 gap-3 text-sm text-neutral-700">
              {c.highlights.map((h) => (
                <li key={h} className="border-l-2 border-orange-500 pl-3">{h}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold text-orange-600 tabular-nums">{n}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-neutral-500">{l}</div>
    </div>
  );
}
