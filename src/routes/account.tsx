import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, User as UserIcon, Building2, Phone, Mail, Percent, ShoppingBag, FileText, Repeat, BarChart3, Headset, ChevronDown, ChevronUp, Package, FileSpreadsheet } from "lucide-react";
import { exportOrderToExcel } from "@/lib/order-excel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Личный кабинет — РДЭ Запчасти" }] }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, manager:managers(*)")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (loading || !user) {
    return <div className="mx-auto max-w-[1400px] px-4 py-20 text-center text-muted-foreground">Загрузка…</div>;
  }

  const isCompany = profile?.customer_type === "company";
  const displayName = profile?.full_name || user.email;

  return (
    <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-10 lg:py-14">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="font-mono text-[11px] text-brand uppercase tracking-[0.3em] mb-2">/ личный кабинет</div>
          <h1 className="font-display text-3xl lg:text-5xl font-bold">{displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        </div>
        <Button variant="outline" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
          <LogOut className="mr-2 h-4 w-4" /> Выйти
        </Button>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* Профиль + меню */}
        <div className="space-y-6">
          {/* Карточка профиля */}
          <div className="border border-border bg-surface p-6 rounded-md">
            <div className="flex items-center gap-3 mb-5">
              {isCompany ? <Building2 className="h-5 w-5 text-brand" /> : <UserIcon className="h-5 w-5 text-brand" />}
              <h2 className="font-display text-xl">{isCompany ? "Юридическое лицо" : "Физическое лицо"}</h2>
            </div>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Row label="ФИО" value={profile?.full_name} />
              <Row label="Телефон" value={profile?.phone} icon={<Phone className="h-3.5 w-3.5" />} />
              <Row label="Email" value={profile?.email ?? user.email} icon={<Mail className="h-3.5 w-3.5" />} />
              {isCompany && (
                <>
                  <Row label="Организация" value={profile?.company_name} />
                  <Row label="ИНН" value={profile?.inn} />
                  <Row label="КПП" value={profile?.kpp} />
                  <Row label="Юр. адрес" value={profile?.legal_address} />
                </>
              )}
            </dl>
            <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              <Percent className="h-5 w-5 text-accent-orange" />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Персональная скидка</div>
                <div className="font-display text-2xl font-bold text-accent-orange">{Number(profile?.discount_percent ?? 0).toFixed(1)} %</div>
              </div>
            </div>
          </div>

          {/* Мои заявки */}
          <OrdersSection userId={user.id} />

          {/* Разделы */}
          <div className="grid sm:grid-cols-2 gap-3">
            <NavTile to="/catalog" icon={ShoppingBag} title="Каталог" desc="40 000+ позиций" />
            <NavTile to="/cart" icon={Repeat} title="Корзина" desc="Активная заявка" />
            <NavTile to="/account" icon={FileText} title="Документы" desc="Скоро" />
            <NavTile to="/account" icon={BarChart3} title="Дашборд" desc="Скоро" />
          </div>
        </div>

        {/* Менеджер */}
        <ManagerCard manager={profile?.manager} />
      </div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">{icon}{label}</dt>
      <dd className="text-foreground mt-0.5">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

function NavTile({ to, icon: Icon, title, desc }: { to: string; icon: typeof ShoppingBag; title: string; desc: string }) {
  return (
    <Link to={to} className="group border border-border bg-background hover:border-brand transition-colors p-4 rounded-md flex gap-3 items-start">
      <div className="h-9 w-9 rounded-md bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </Link>
  );
}

function ManagerCard({ manager }: { manager?: { full_name: string; phone?: string | null; email?: string | null; photo_url?: string | null } | null }) {
  return (
    <div className="border border-border bg-foreground text-background p-6 rounded-md h-fit">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand mb-3">/ ваш менеджер</div>
      {manager ? (
        <>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand/20 overflow-hidden flex items-center justify-center text-brand">
              {manager.photo_url ? <img src={manager.photo_url} alt={manager.full_name} className="h-full w-full object-cover" /> : <UserIcon className="h-7 w-7" />}
            </div>
            <div>
              <div className="font-display text-lg">{manager.full_name}</div>
              <div className="text-xs text-background/60">Закреплён за вашим аккаунтом</div>
            </div>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            {manager.phone && <a href={`tel:${manager.phone}`} className="flex items-center gap-2 hover:text-brand"><Phone className="h-4 w-4" />{manager.phone}</a>}
            {manager.email && <a href={`mailto:${manager.email}`} className="flex items-center gap-2 hover:text-brand"><Mail className="h-4 w-4" />{manager.email}</a>}
          </div>
        </>
      ) : (
        <div className="text-sm text-background/70">
          Менеджер пока не закреплён. Мы свяжемся с вами после первой заявки.
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: "Черновик", cls: "bg-muted text-muted-foreground" },
  submitted: { label: "Отправлена", cls: "bg-brand/15 text-brand" },
  confirmed: { label: "Подтверждена", cls: "bg-brand/15 text-brand" },
  processing: { label: "В работе", cls: "bg-accent-orange/15 text-accent-orange" },
  shipped: { label: "Отгружена", cls: "bg-[oklch(0.70_0.18_145)]/15 text-[oklch(0.55_0.18_145)]" },
  completed: { label: "Завершена", cls: "bg-[oklch(0.70_0.18_145)]/15 text-[oklch(0.55_0.18_145)]" },
  cancelled: { label: "Отменена", cls: "bg-destructive/15 text-destructive" },
};

function OrdersSection({ userId }: { userId: string }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, number, status, total_amount, created_at, submitted_at, notes, invoice_grouping")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="border border-border bg-surface p-6 rounded-md">
      <div className="flex items-center gap-3 mb-5">
        <ShoppingBag className="h-5 w-5 text-brand" />
        <h2 className="font-display text-xl">Мои заявки</h2>
        {orders && orders.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{orders.length}</span>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Загрузка…</div>
      ) : !orders || orders.length === 0 ? (
        <div className="py-8 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">Заявок пока нет</p>
          <Button asChild size="sm" className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90">
            <Link to="/catalog">Перейти в каталог</Link>
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border bg-background">
          {orders.map((o) => {
            const st = STATUS_LABEL[o.status] ?? { label: o.status, cls: "bg-muted" };
            const isOpen = openId === o.id;
            return (
              <div key={o.id}>
                <button
                  onClick={() => setOpenId(isOpen ? null : o.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface/60"
                >
                  <div className="font-mono text-xs sm:text-sm font-semibold">{o.number}</div>
                  <Badge className={`${st.cls} border-0 font-normal`}>{st.label}</Badge>
                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(o.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <div className="font-display text-sm font-semibold whitespace-nowrap">
                      {Number(o.total_amount).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>
                {isOpen && <OrderDetails order={o} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type OrderRow = {
  id: string;
  number: string;
  notes: string | null;
  created_at: string;
  invoice_grouping: "single" | "per_warehouse";
};

function OrderDetails({ order }: { order: OrderRow }) {
  const { data, isLoading } = useQuery({
    queryKey: ["order-items", order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("id, qty, unit_price, line_total, product:products(name, sku, brand:brands(name)), warehouse:warehouses(name, city)")
        .eq("order_id", order.id);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="border-t border-border bg-surface/40 px-4 py-3">
      {isLoading ? (
        <div className="py-4 text-center text-xs text-muted-foreground">Загрузка позиций…</div>
      ) : (
        <>
          <div className="flex items-center justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs"
              disabled={!data || data.length === 0}
              onClick={() => {
                if (!data) return;
                exportOrderToExcel({
                  number: order.number,
                  created_at: order.created_at,
                  notes: order.notes,
                  invoice_grouping: order.invoice_grouping,
                  items: data.map((it) => ({
                    sku: it.product?.sku ?? "",
                    name: it.product?.name ?? "",
                    brand: it.product?.brand?.name ?? null,
                    warehouseName: it.warehouse?.city ?? it.warehouse?.name ?? "—",
                    qty: it.qty,
                    unit_price: Number(it.unit_price),
                    line_total: Number(it.line_total),
                  })),
                });
              }}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Скачать Excel
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="pb-2 pr-3 font-normal">Позиция</th>
                  <th className="pb-2 pr-3 font-normal">Склад</th>
                  <th className="pb-2 pr-3 text-right font-normal">Кол-во</th>
                  <th className="pb-2 pr-3 text-right font-normal">Цена</th>
                  <th className="pb-2 text-right font-normal">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data?.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 pr-3">
                      <div className="font-medium text-foreground">{it.product?.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{it.product?.sku}</div>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{it.warehouse?.city ?? it.warehouse?.name ?? "—"}</td>
                    <td className="py-2 pr-3 text-right">{it.qty}</td>
                    <td className="py-2 pr-3 text-right">{Number(it.unit_price).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽</td>
                    <td className="py-2 text-right font-semibold">{Number(it.line_total).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {order.notes && (
            <div className="mt-3 rounded border border-border/60 bg-background p-2 text-xs">
              <span className="text-muted-foreground">Комментарий:</span> {order.notes}
            </div>
          )}
        </>
      )}
    </div>
  );
}
