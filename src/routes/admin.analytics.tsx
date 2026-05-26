import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Download, ChevronDown, ChevronRight, Users, Package, ShoppingCart, Wallet } from "lucide-react";
import { getSalesAnalytics, getCustomerDetail, type AnalyticsResult, type CustomerDetail } from "@/lib/analytics.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRub } from "@/lib/format";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsPage,
});

type StatusFilter = "all" | "active" | "completed";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function AdminAnalyticsPage() {
  const [from, setFrom] = useState<string>(daysAgoISO(30));
  const [to, setTo] = useState<string>(todayISO());
  const [status, setStatus] = useState<StatusFilter>("active");
  const [openCustomer, setOpenCustomer] = useState<string | null>(null);

  const fetchAnalytics = useServerFn(getSalesAnalytics);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "analytics", from, to, status],
    queryFn: () => fetchAnalytics({ data: { from, to, status } }),
    staleTime: 30_000,
  });

  const applyPreset = (preset: "7" | "30" | "90" | "ytd" | "all") => {
    if (preset === "all") {
      setFrom("");
      setTo("");
      return;
    }
    if (preset === "ytd") {
      const y = new Date().getFullYear();
      setFrom(`${y}-01-01`);
      setTo(todayISO());
      return;
    }
    setFrom(daysAgoISO(Number(preset)));
    setTo(todayISO());
  };

  const totals = data?.totals ?? { orders: 0, customers: 0, qty: 0, revenue: 0 };

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="font-mono text-[11px] text-brand uppercase tracking-[0.3em]">/ аналитика</div>
          <h1 className="font-display text-3xl font-bold mt-1 flex items-center gap-2">
            <BarChart3 className="h-7 w-7" /> Продажи и клиенты
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Кто купил, сколько позиций и на какую сумму за выбранный период.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => data && downloadCustomersCsv(data)}>
          <Download className="h-4 w-4 mr-1.5" /> Экспорт CSV
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">С даты</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">По дату</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Статус заявок</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="active">Активные (без отмены)</option>
            <option value="completed">Только завершённые</option>
            <option value="all">Все (включая отмены)</option>
          </select>
        </div>
        <div className="flex gap-1.5 ml-auto">
          {[
            { k: "7" as const, l: "7 дн." },
            { k: "30" as const, l: "30 дн." },
            { k: "90" as const, l: "90 дн." },
            { k: "ytd" as const, l: "С начала года" },
            { k: "all" as const, l: "Всё время" },
          ].map((p) => (
            <button
              key={p.k}
              onClick={() => applyPreset(p.k)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-surface"
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard icon={Wallet} label="Выручка" value={formatRub(totals.revenue)} loading={isLoading} />
        <KpiCard icon={ShoppingCart} label="Заявок" value={totals.orders.toLocaleString("ru-RU")} loading={isLoading} />
        <KpiCard icon={Users} label="Клиентов" value={totals.customers.toLocaleString("ru-RU")} loading={isLoading} />
        <KpiCard icon={Package} label="Шт. товара" value={totals.qty.toLocaleString("ru-RU")} loading={isLoading} />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Клиенты по выручке</h2>
          {isFetching && <span className="text-xs text-muted-foreground">Обновление…</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 w-8" />
                <th className="text-left px-4 py-2">Клиент</th>
                <th className="text-left px-4 py-2">Контакты</th>
                <th className="text-right px-4 py-2">Заявок</th>
                <th className="text-right px-4 py-2">Позиций</th>
                <th className="text-right px-4 py-2">Шт.</th>
                <th className="text-right px-4 py-2">Сумма</th>
                <th className="text-left px-4 py-2">Последняя</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Загрузка…</td></tr>
              )}
              {!isLoading && data && data.customers.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Нет заявок в выбранном периоде</td></tr>
              )}
              {data?.customers.map((c) => {
                const isOpen = openCustomer === c.user_id;
                return (
                  <ExpandableRow
                    key={c.user_id}
                    customer={c}
                    isOpen={isOpen}
                    onToggle={() => setOpenCustomer(isOpen ? null : c.user_id)}
                    from={from}
                    to={to}
                    status={status}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-display text-base font-bold">Топ запчастей (по выручке)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 w-10">#</th>
                <th className="text-left px-4 py-2">Бренд</th>
                <th className="text-left px-4 py-2">Артикул</th>
                <th className="text-left px-4 py-2">Наименование</th>
                <th className="text-right px-4 py-2">Заявок</th>
                <th className="text-right px-4 py-2">Шт.</th>
                <th className="text-right px-4 py-2">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {data?.top_products.map((p, i) => (
                <tr key={p.product_id} className="border-t border-border">
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.brand ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.sku ?? "—"}</td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.orders_count}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.qty}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">{formatRub(p.revenue)}</td>
                </tr>
              ))}
              {!isLoading && data && data.top_products.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Нет данных</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, loading }: { icon: typeof Users; label: string; value: string; loading: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold tabular-nums">
        {loading ? "…" : value}
      </div>
    </div>
  );
}

function ExpandableRow({
  customer,
  isOpen,
  onToggle,
  from,
  to,
  status,
}: {
  customer: AnalyticsResult["customers"][number];
  isOpen: boolean;
  onToggle: () => void;
  from: string;
  to: string;
  status: StatusFilter;
}) {
  const fetchDetail = useServerFn(getCustomerDetail);
  const { data: detail, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "detail", customer.user_id, from, to, status],
    queryFn: () => fetchDetail({ data: { user_id: customer.user_id, from, to, status } }),
    enabled: isOpen,
    staleTime: 30_000,
  });

  return (
    <>
      <tr className="border-t border-border hover:bg-surface/50">
        <td className="px-4 py-2">
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-4 py-2 font-medium">{customer.customer}</td>
        <td className="px-4 py-2 text-xs text-muted-foreground">
          {customer.email ?? "—"}{customer.phone ? ` · ${customer.phone}` : ""}
        </td>
        <td className="px-4 py-2 text-right tabular-nums">{customer.orders_count}</td>
        <td className="px-4 py-2 text-right tabular-nums">{customer.items_count}</td>
        <td className="px-4 py-2 text-right tabular-nums">{customer.qty_total}</td>
        <td className="px-4 py-2 text-right tabular-nums font-semibold">{formatRub(customer.revenue)}</td>
        <td className="px-4 py-2 text-xs text-muted-foreground">
          {customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString("ru-RU") : "—"}
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-surface/40">
          <td colSpan={8} className="px-4 py-3">
            {isLoading && <div className="text-sm text-muted-foreground">Загрузка деталей…</div>}
            {detail && <CustomerDrillDown detail={detail} />}
          </td>
        </tr>
      )}
    </>
  );
}

function CustomerDrillDown({ detail }: { detail: CustomerDetail }) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded border border-border bg-background">
        <div className="px-3 py-2 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
          Заявки ({detail.orders.length})
        </div>
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface sticky top-0">
              <tr>
                <th className="text-left px-3 py-1.5">№</th>
                <th className="text-left px-3 py-1.5">Дата</th>
                <th className="text-left px-3 py-1.5">Статус</th>
                <th className="text-right px-3 py-1.5">Поз.</th>
                <th className="text-right px-3 py-1.5">Шт.</th>
                <th className="text-right px-3 py-1.5">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {detail.orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-3 py-1.5 font-mono">{o.number}</td>
                  <td className="px-3 py-1.5">{new Date(o.created_at).toLocaleDateString("ru-RU")}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{o.status}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{o.lines}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{o.qty}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatRub(o.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded border border-border bg-background">
        <div className="px-3 py-2 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
          Купленные запчасти ({detail.products.length})
        </div>
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface sticky top-0">
              <tr>
                <th className="text-left px-3 py-1.5">Бренд</th>
                <th className="text-left px-3 py-1.5">Артикул</th>
                <th className="text-left px-3 py-1.5">Наименование</th>
                <th className="text-right px-3 py-1.5">Шт.</th>
                <th className="text-right px-3 py-1.5">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {detail.products.map((p) => (
                <tr key={p.product_id} className="border-t border-border">
                  <td className="px-3 py-1.5 text-muted-foreground">{p.brand ?? "—"}</td>
                  <td className="px-3 py-1.5 font-mono">{p.sku ?? "—"}</td>
                  <td className="px-3 py-1.5">{p.name}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.qty}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatRub(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function downloadCustomersCsv(data: AnalyticsResult) {
  const header = ["Клиент", "Email", "Телефон", "Заявок", "Позиций", "Штук", "Сумма, ₽", "Последняя заявка"];
  const lines = [header.join(";")];
  for (const c of data.customers) {
    lines.push([
      csv(c.customer),
      csv(c.email ?? ""),
      csv(c.phone ?? ""),
      c.orders_count,
      c.items_count,
      c.qty_total,
      c.revenue.toFixed(2).replace(".", ","),
      c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("ru-RU") : "",
    ].join(";"));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${data.from ?? "all"}_${data.to ?? "all"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csv(v: string) {
  if (/[";\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
