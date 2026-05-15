import type { StockStatus } from "@/data/mock";
import { cn } from "@/lib/utils";

const config: Record<StockStatus, { label: string; cls: string }> = {
  in_stock: { label: "В наличии", cls: "bg-status-in-stock/15 text-status-in-stock border-status-in-stock/40" },
  expected: { label: "Ожидается", cls: "bg-status-expected/15 text-status-expected border-status-expected/40" },
  out: { label: "Под заказ", cls: "bg-status-out/15 text-status-out border-status-out/40" },
};

export function StockBadge({ status, qty, expectedQty, className }: {
  status: StockStatus;
  qty?: number;
  expectedQty?: number;
  className?: string;
}) {
  const c = config[status];
  const detail = status === "in_stock" && qty ? ` · ${qty} шт` : status === "expected" && expectedQty ? ` · +${expectedQty} шт` : "";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-mono font-medium uppercase tracking-wider",
      c.cls,
      className,
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {c.label}{detail}
    </span>
  );
}
