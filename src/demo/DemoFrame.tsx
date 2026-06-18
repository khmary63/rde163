import { useEffect, useRef, useState } from "react";
import type { Annotation } from "./chapters";

type Props = {
  path: string;
  viewport: "desktop" | "mobile";
  annotations?: Annotation[];
};

const VIEWPORTS = {
  desktop: { w: 1440, h: 900 },
  mobile: { w: 390, h: 844 },
};

export function DemoFrame({ path, viewport, annotations = [] }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const { w, h } = VIEWPORTS[viewport];

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      const s = Math.min(width / w, height / h);
      setScale(s > 0 ? s : 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  useEffect(() => {
    setLoaded(false);
  }, [path, viewport]);

  const src = `${path}${path.includes("?") ? "&" : "?"}demo=1`;

  return (
    <div
      ref={wrapRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[oklch(0.18_0.01_250)]"
    >
      {/* grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.7_0.02_250)_1px,transparent_1px),linear-gradient(90deg,oklch(0.7_0.02_250)_1px,transparent_1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div
        className="relative shrink-0 origin-center bg-background shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
        style={{
          width: w,
          height: h,
          transform: `scale(${scale})`,
          borderRadius: viewport === "mobile" ? 36 : 10,
          overflow: "hidden",
        }}
      >
        {/* device chrome */}
        {viewport === "mobile" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-7 items-center justify-center bg-black">
            <div className="h-5 w-32 rounded-full bg-black ring-1 ring-white/10" />
          </div>
        )}

        <iframe
          key={`${path}-${viewport}`}
          src={src}
          title={`Demo: ${path}`}
          className="absolute inset-0 h-full w-full border-0 bg-background"
          onLoad={() => setLoaded(true)}
        />

        {/* loading veil */}
        {!loaded && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              loading {path}
            </div>
          </div>
        )}

        {/* annotations */}
        {loaded &&
          annotations.map((a, i) => {
            const side = a.side ?? "right";
            return (
              <div
                key={i}
                className="pointer-events-none absolute z-40"
                style={{ left: `${a.x}%`, top: `${a.y}%` }}
              >
                <div className="relative">
                  <span className="absolute -left-2 -top-2 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-orange opacity-75" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-accent-orange ring-2 ring-background" />
                  </span>
                  <div
                    className={`absolute top-3 ${side === "left" ? "right-4" : "left-4"} w-56 border-l-2 border-accent-orange bg-background/95 p-3 shadow-xl backdrop-blur`}
                  >
                    <div className="font-display text-sm font-bold leading-tight">
                      {a.title}
                    </div>
                    {a.text && (
                      <div className="mt-1 text-xs text-muted-foreground leading-snug">
                        {a.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
