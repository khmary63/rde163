import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type BrandCount = { name: string; qty: number };

async function fetchBrandStockCounts(): Promise<BrandCount[]> {
  // Постранично выгружаем все строки с остатком "in_stock" и qty>0 вместе с брендом.
  const seen = new Map<string, Set<string>>(); // brandName -> set of product_id
  const pageSize = 1000;
  let from = 0;
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase
      .from("stock")
      .select("product_id, products!inner(brand_id, brands!inner(name))")
      .eq("status", "in_stock")
      .gt("qty", 0)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as Array<{
      product_id: string;
      products: { brands: { name: string } | null } | null;
    }>;
    for (const r of rows) {
      const name = r.products?.brands?.name;
      if (!name || !r.product_id) continue;
      let set = seen.get(name);
      if (!set) {
        set = new Set<string>();
        seen.set(name, set);
      }
      set.add(r.product_id);
    }
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  const result: BrandCount[] = [];
  seen.forEach((set, name) => result.push({ name, qty: set.size }));
  result.sort((a, b) => b.qty - a.qty);
  return result;
}

const FALLBACK: BrandCount[] = [
  { name: "CNHTC", qty: 2548 },
  { name: "HOWO", qty: 1338 },
  { name: "XGMA", qty: 464 },
  { name: "Shaanxi", qty: 154 },
  { name: "ZF", qty: 136 },
  { name: "Weichai", qty: 117 },
  { name: "XCMG", qty: 80 },
  { name: "Cummins", qty: 51 },
];

export function LiveStockTicker() {
  const { data } = useQuery({
    queryKey: ["live-stock-ticker"],
    queryFn: fetchBrandStockCounts,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const items = (data && data.length > 0 ? data : FALLBACK)
    .filter((b) => b.qty > 0)
    .slice(0, 20);

  const labels = items.map(
    (b) => `${b.name} · в наличии ${b.qty.toLocaleString("ru-RU")} поз.`,
  );

  return (
    <div className="relative border-y-2 border-foreground bg-foreground text-background overflow-hidden">
      <div className="flex items-center">
        <div className="shrink-0 border-r border-background/20 bg-accent-orange text-accent-orange-foreground px-5 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2 font-bold">
          <Radio className="h-3.5 w-3.5 animate-pulse" /> live · stock
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex gap-10 whitespace-nowrap py-3 animate-[ticker_60s_linear_infinite] font-mono text-sm">
            {[...labels, ...labels, ...labels].map((t, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="text-accent-orange">▸</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
