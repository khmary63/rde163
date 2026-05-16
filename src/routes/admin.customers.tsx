import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Building2, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers", q],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, customer_type, full_name, company_name, inn, phone, email, discount_percent, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (q.trim()) {
        const s = q.trim();
        query = query.or(`full_name.ilike.%${s}%,company_name.ilike.%${s}%,inn.ilike.%${s}%,email.ilike.%${s}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="font-mono text-[11px] text-brand uppercase tracking-[0.3em]">/ клиенты</div>
          <h1 className="font-display text-3xl font-bold mt-1">База клиентов</h1>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ФИО, компания, ИНН, email…" className="pl-9" />
        </div>
      </div>

      <div className="border border-border rounded-md bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-background">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-normal">Тип</th>
              <th className="px-4 py-2.5 font-normal">Клиент</th>
              <th className="px-4 py-2.5 font-normal">ИНН</th>
              <th className="px-4 py-2.5 font-normal">Контакты</th>
              <th className="px-4 py-2.5 font-normal text-right">Скидка</th>
              <th className="px-4 py-2.5 font-normal">Регистрация</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Загрузка…</td></tr>}
            {!isLoading && data?.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Клиентов не найдено</td></tr>}
            {data?.map((c) => {
              const isCo = c.customer_type === "company";
              return (
                <tr key={c.id} className="hover:bg-background/50">
                  <td className="px-4 py-2.5">
                    {isCo ? <Building2 className="h-4 w-4 text-brand" /> : <UserIcon className="h-4 w-4 text-muted-foreground" />}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{c.company_name || c.full_name || "—"}</div>
                    {isCo && c.full_name && <div className="text-xs text-muted-foreground">{c.full_name}</div>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{c.inn || "—"}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {c.phone && <div>{c.phone}</div>}
                    {c.email && <div className="text-muted-foreground">{c.email}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-display font-semibold text-accent-orange">
                    {Number(c.discount_percent ?? 0).toFixed(1)} %
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Редактирование профилей и назначение менеджера — в следующей итерации. <Link to="/admin/orders" className="text-brand hover:underline">Перейти к заявкам →</Link>
      </p>
    </div>
  );
}
