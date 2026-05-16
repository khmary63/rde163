import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Inbox, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [all, sub, prog, done, recent] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["in_progress", "invoiced", "paid"]),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("orders")
          .select("id, number, status, total_amount, created_at, profile:profiles(full_name, company_name)")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      return {
        total: all.count ?? 0,
        new: sub.count ?? 0,
        inWork: prog.count ?? 0,
        done: done.count ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="font-mono text-[11px] text-brand uppercase tracking-[0.3em]">/ обзор</div>
          <h1 className="font-display text-3xl font-bold mt-1">Сводка</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={Inbox} label="Новые" value={stats?.new ?? 0} tone="brand" />
        <Stat icon={Clock} label="В работе" value={stats?.inWork ?? 0} tone="orange" />
        <Stat icon={CheckCircle2} label="Завершённые" value={stats?.done ?? 0} tone="green" />
        <Stat icon={TrendingUp} label="Всего заявок" value={stats?.total ?? 0} tone="muted" />
      </div>

      <div className="border border-border rounded-md bg-surface">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="font-display text-lg">Последние заявки</h2>
          <Link to="/admin/orders" className="text-xs text-brand hover:underline">Все заявки →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="text-left">
              <th className="px-5 py-2 font-normal">Номер</th>
              <th className="px-5 py-2 font-normal">Клиент</th>
              <th className="px-5 py-2 font-normal">Статус</th>
              <th className="px-5 py-2 font-normal text-right">Сумма</th>
              <th className="px-5 py-2 font-normal">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats?.recent.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground"><Package className="mx-auto h-8 w-8 opacity-40" /><div className="mt-2">Заявок пока нет</div></td></tr>
            )}
            {stats?.recent.map((o) => {
              const p = o.profile as { full_name: string | null; company_name: string | null } | null;
              return (
                <tr key={o.id} className="hover:bg-background/50">
                  <td className="px-5 py-2.5">
                    <Link to="/admin/orders/$id" params={{ id: o.id }} className="font-mono text-xs font-semibold text-brand hover:underline">{o.number}</Link>
                  </td>
                  <td className="px-5 py-2.5">{p?.company_name || p?.full_name || "—"}</td>
                  <td className="px-5 py-2.5"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-2.5 text-right font-display font-semibold">{Number(o.total_amount).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽</td>
                  <td className="px-5 py-2.5 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Package; label: string; value: number; tone: "brand" | "orange" | "green" | "muted" }) {
  const toneCls = {
    brand: "text-brand bg-brand/10",
    orange: "text-accent-orange bg-accent-orange/10",
    green: "text-[oklch(0.55_0.18_145)] bg-[oklch(0.70_0.18_145)]/15",
    muted: "text-muted-foreground bg-muted",
  }[tone];
  return (
    <div className="border border-border bg-surface rounded-md p-5">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-md grid place-items-center ${toneCls}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="font-display text-3xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Черновик", cls: "bg-muted text-muted-foreground" },
    submitted: { label: "Новая", cls: "bg-brand/15 text-brand" },
    in_progress: { label: "В работе", cls: "bg-accent-orange/15 text-accent-orange" },
    invoiced: { label: "Счёт выставлен", cls: "bg-accent-orange/15 text-accent-orange" },
    paid: { label: "Оплачена", cls: "bg-[oklch(0.70_0.18_145)]/15 text-[oklch(0.55_0.18_145)]" },
    shipped: { label: "Отгружена", cls: "bg-[oklch(0.70_0.18_145)]/15 text-[oklch(0.55_0.18_145)]" },
    completed: { label: "Завершена", cls: "bg-[oklch(0.70_0.18_145)]/15 text-[oklch(0.55_0.18_145)]" },
    cancelled: { label: "Отменена", cls: "bg-destructive/15 text-destructive" },
  };
  const m = map[status] ?? { label: status, cls: "bg-muted" };
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${m.cls}`}>{m.label}</span>;
}
