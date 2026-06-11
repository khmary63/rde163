import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Building2, User as UserIcon, Shield, Headset } from "lucide-react";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type AppRole = "admin" | "manager" | "customer_individual" | "customer_company";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const { data: customers, isLoading } = useQuery({
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

  const { data: roles } = useQuery({
    queryKey: ["admin", "all-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data as { user_id: string; role: AppRole }[];
    },
  });

  const rolesByUser = new Map<string, Set<AppRole>>();
  for (const r of roles ?? []) {
    if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, new Set());
    rolesByUser.get(r.user_id)!.add(r.role);
  }

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, on }: { userId: string; role: AppRole; on: boolean }) => {
      if (on) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "all-roles"] });
      toast.success("Роль обновлена");
    },
    onError: (e: Error) => toast.error(e.message || "Недостаточно прав (только администратор)"),
  });

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="font-mono text-[11px] text-brand uppercase tracking-[0.3em]">/ клиенты</div>
          <h1 className="font-display text-3xl font-bold mt-1">База клиентов и роли</h1>
          <p className="text-sm text-muted-foreground mt-1">Назначение ролей <span className="text-brand">admin</span> / <span className="text-brand">manager</span> доступно только администратору.</p>
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
              <th className="px-4 py-2.5 font-normal">Роли сотрудника</th>
              <th className="px-4 py-2.5 font-normal">Регистрация</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Загрузка…</td></tr>}
            {!isLoading && customers?.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Клиентов не найдено</td></tr>}
            {customers?.map((c) => {
              const isCo = c.customer_type === "company";
              const userRoles = rolesByUser.get(c.id) ?? new Set<AppRole>();
              const isAdmin = userRoles.has("admin");
              const isManager = userRoles.has("manager");
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
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <RoleToggle
                        active={isAdmin}
                        icon={Shield}
                        label="admin"
                        disabled={toggleRole.isPending}
                        onClick={() => toggleRole.mutate({ userId: c.id, role: "admin", on: !isAdmin })}
                      />
                      <RoleToggle
                        active={isManager}
                        icon={Headset}
                        label="manager"
                        disabled={toggleRole.isPending}
                        onClick={() => toggleRole.mutate({ userId: c.id, role: "manager", on: !isManager })}
                      />
                    </div>
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
        Базовая роль клиента (физлицо/юрлицо) назначается при регистрации. <Link to="/admin/orders" className="text-brand hover:underline">Перейти к заявкам →</Link>
      </p>
    </div>
  );
}

function RoleToggle({
  active, icon: Icon, label, onClick, disabled,
}: { active: boolean; icon: typeof Shield; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-mono uppercase tracking-wider border transition-colors " +
        (active
          ? "bg-brand text-brand-foreground border-brand"
          : "bg-background text-muted-foreground border-border hover:border-brand/50 hover:text-foreground")
      }
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}
