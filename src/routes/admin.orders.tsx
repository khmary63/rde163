import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./admin.index";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const STATUSES: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "submitted", label: "Новые" },
  { value: "confirmed", label: "Подтверждены" },
  { value: "processing", label: "В работе" },
  { value: "shipped", label: "Отгружены" },
  { value: "completed", label: "Завершены" },
  { value: "cancelled", label: "Отменены" },
];

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", status, q],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("id, number, status, total_amount, created_at, submitted_at, notes, user_id")
        .neq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status !== "all") query = query.eq("status", status);
      if (q.trim()) query = query.ilike("number", `%${q.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;

      const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      let profiles: Record<string, { full_name: string | null; company_name: string | null; phone: string | null; email: string | null }> = {};
      if (userIds.length) {
        const { data: pr } = await supabase
          .from("profiles")
          .select("id, full_name, company_name, phone, email")
          .in("id", userIds);
        profiles = Object.fromEntries((pr ?? []).map((p) => [p.id, p]));
      }
      return (data ?? []).map((r) => ({ ...r, profile: profiles[r.user_id] ?? null }));
    },
  });

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="font-mono text-[11px] text-brand uppercase tracking-[0.3em]">/ заявки</div>
          <h1 className="font-display text-3xl font-bold mt-1">Все заявки</h1>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Номер заявки…" className="pl-9" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              status === s.value ? "bg-foreground text-background" : "border border-border bg-background hover:bg-surface"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="border border-border rounded-md bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-background">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-normal">Номер</th>
              <th className="px-4 py-2.5 font-normal">Клиент</th>
              <th className="px-4 py-2.5 font-normal">Контакт</th>
              <th className="px-4 py-2.5 font-normal">Статус</th>
              <th className="px-4 py-2.5 font-normal text-right">Сумма</th>
              <th className="px-4 py-2.5 font-normal">Создана</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Загрузка…</td></tr>}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                <Package className="mx-auto h-8 w-8 opacity-40" /><div className="mt-2">Заявок не найдено</div>
              </td></tr>
            )}
            {data?.map((o) => (
              <tr key={o.id} className="hover:bg-background/50">
                <td className="px-4 py-2.5">
                  <Link to="/admin/orders/$id" params={{ id: o.id }} className="font-mono text-xs font-semibold text-brand hover:underline">
                    {o.number}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-medium">{o.profile?.company_name || o.profile?.full_name || "—"}</div>
                  {o.profile?.company_name && o.profile.full_name && <div className="text-xs text-muted-foreground">{o.profile.full_name}</div>}
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">
                  {o.profile?.phone && <div>{o.profile.phone}</div>}
                  {o.profile?.email && <div>{o.profile.email}</div>}
                </td>
                <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-2.5 text-right font-display font-semibold">
                  {Number(o.total_amount).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
