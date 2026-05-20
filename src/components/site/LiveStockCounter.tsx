import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function fetchInStockCount(): Promise<number> {
  // Считаем уникальные товары со статусом "в наличии" и положительным остатком.
  const { data, error } = await supabase
    .from("stock")
    .select("product_id")
    .eq("status", "in_stock")
    .gt("qty", 0);
  if (error) throw error;
  const unique = new Set((data ?? []).map((r) => r.product_id));
  return unique.size;
}

function useAnimatedNumber(target: number, durationMs = 800) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === display) return;
    fromRef.current = display;
    startRef.current = null;

    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(fromRef.current + (target - fromRef.current) * eased);
      setDisplay(value);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}

export function LiveStockCounter({ fallback = 5700 }: { fallback?: number }) {
  const { data } = useQuery({
    queryKey: ["live-stock-count"],
    queryFn: fetchInStockCount,
    refetchInterval: 6000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  // Лёгкий "живой" джиттер между настоящими обновлениями, чтобы цифра ощущалась как монитор.
  const base = data ?? fallback;
  const [jitter, setJitter] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      // случайное колебание -2..+2
      setJitter(Math.floor(Math.random() * 5) - 2);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const target = Math.max(0, base + jitter);
  const value = useAnimatedNumber(target, 700);

  return (
    <span className="tabular-nums" aria-live="polite">
      {value.toLocaleString("ru-RU")}
    </span>
  );
}
