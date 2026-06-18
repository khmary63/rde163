import { createFileRoute, notFound } from "@tanstack/react-router";
import { chapters } from "@/demo/chapters";
import { DemoFrame } from "@/demo/DemoFrame";

export const Route = createFileRoute("/demo/$chapter")({
  loader: ({ params }) => {
    const ch = chapters.find((c) => c.slug === params.chapter);
    if (!ch) throw notFound();
    return ch;
  },
  component: ChapterView,
  notFoundComponent: () => (
    <div className="flex h-full items-center justify-center text-white/60">Глава не найдена</div>
  ),
});

function ChapterView() {
  const ch = Route.useLoaderData();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        <DemoFrame path={ch.path} viewport={ch.viewport} annotations={ch.annotations} />
      </div>
      <div className="shrink-0 border-t border-white/10 bg-[oklch(0.16_0.01_250)] px-6 py-4 text-white">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="font-display text-xl font-bold tracking-tight">{ch.title}</h2>
          <p className="text-sm text-white/60">{ch.subtitle}</p>
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-white/75">
          {ch.highlights.map((h: string) => (
            <li key={h} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-accent-orange" />
              {h}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
