import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, User as UserIcon, Building2, Phone, Mail, Percent, ShoppingBag, FileText, Repeat, BarChart3, Headset, ChevronDown, ChevronUp, Package, FileSpreadsheet, Bookmark, Trash2, Plus } from "lucide-react";
import { exportOrderToExcel } from "@/lib/order-excel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/proxy-client";
import { useAuth } from "@/hooks/use-auth";
import { useCart, type CartItem } from "@/hooks/use-cart";
import { toast } from "sonner";
import managerKhabarovPhoto from "@/assets/manager-khabarov.jpg";

const DEFAULT_MANAGER = {
  full_name: "Хабаров Роман",
  phone: "8 937-219-49-26",
  email: "hrs@gross.ru",
  photo_url: managerKhabarovPhoto,
};

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

          {/* Дашборд */}
          <DashboardSection userId={user.id} />

          {/* Мои заявки */}
          <OrdersSection userId={user.id} />

          {/* Шаблоны заявок */}
          <TemplatesSection userId={user.id} />

          {/* Документы заказов */}
          <DocumentsSection userId={user.id} />

          {/* Разделы */}
          <div className="grid sm:grid-cols-2 gap-3">
            <NavTile to="/catalog" icon={ShoppingBag} title="Каталог" desc="5 000+ позиций" />
            <NavTile to="/cart" icon={Repeat} title="Корзина" desc="Активная заявка" />
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
  const m = manager ?? DEFAULT_MANAGER;
  return (
    <div className="border border-border bg-foreground text-background p-6 rounded-md h-fit">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand mb-3">/ ваш персональный менеджер</div>
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-brand/20 overflow-hidden flex items-center justify-center text-brand shrink-0">
          {m.photo_url ? <img src={m.photo_url} alt={m.full_name} className="h-full w-full object-cover" /> : <UserIcon className="h-5 w-5" />}
        </div>
        <div>
          <div className="font-display text-lg">{m.full_name}</div>
          <div className="text-xs text-background/60">Закреплён за вашим аккаунтом</div>
        </div>
      </div>
      <div className="mt-5 space-y-2 text-sm">
        {m.phone && <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-brand"><Phone className="h-4 w-4" />{m.phone}</a>}
        {m.email && <a href={`mailto:${m.email}`} className="flex items-center gap-2 hover:text-brand"><Mail className="h-4 w-4" />{m.email}</a>}
      </div>
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
                  <div className="font-mono text-xs sm:text-sm font-semibold whitespace-pre-line">{o.number.replace("REQ-2647", "\n\n")}</div>
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

function DashboardSection({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", userId],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, status, total_amount, created_at, submitted_at")
        .eq("user_id", userId);
      if (error) throw error;

      const { data: items, error: e2 } = await supabase
        .from("order_items")
        .select("qty, line_total, order:orders!inner(user_id, status, created_at), product:products(name, sku, brand:brands(name))")
        .eq("order.user_id", userId);
      if (e2) throw e2;

      return { orders: orders ?? [], items: items ?? [] };
    },
  });

  if (isLoading) {
    return (
      <div className="border border-border bg-surface p-6 rounded-md">
        <div className="text-sm text-muted-foreground">Загрузка статистики…</div>
      </div>
    );
  }

  const orders = data?.orders ?? [];
  const items = data?.items ?? [];

  const activeStatuses = new Set(["submitted", "confirmed", "processing", "shipped"]);
  const doneStatuses = new Set(["completed", "shipped"]);

  const total = orders.length;
  const active = orders.filter((o) => activeStatuses.has(o.status)).length;
  const drafts = orders.filter((o) => o.status === "draft").length;
  const totalSpent = orders
    .filter((o) => doneStatuses.has(o.status) || o.status === "confirmed" || o.status === "processing" || o.status === "submitted")
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const submittedCount = orders.filter((o) => o.status !== "draft").length;
  const avgCheck = submittedCount ? totalSpent / submittedCount : 0;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last30 = orders.filter((o) => now - new Date(o.created_at).getTime() <= 30 * day);
  const last30Amount = last30.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  // 6 месяцев — гистограмма по сумме
  const months: { label: string; amount: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("ru-RU", { month: "short" });
    const mOrders = orders.filter((o) => {
      const od = new Date(o.created_at);
      return `${od.getFullYear()}-${od.getMonth()}` === key && o.status !== "draft";
    });
    months.push({
      label,
      amount: mOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0),
      count: mOrders.length,
    });
  }
  const maxAmount = Math.max(1, ...months.map((m) => m.amount));

  // Топ брендов
  const brandMap = new Map<string, { qty: number; amount: number }>();
  const productMap = new Map<string, { name: string; sku: string; qty: number; amount: number }>();
  for (const it of items) {
    const brand = it.product?.brand?.name ?? "Без бренда";
    const b = brandMap.get(brand) ?? { qty: 0, amount: 0 };
    b.qty += it.qty;
    b.amount += Number(it.line_total || 0);
    brandMap.set(brand, b);

    const sku = it.product?.sku ?? "—";
    const p = productMap.get(sku) ?? { name: it.product?.name ?? "—", sku, qty: 0, amount: 0 };
    p.qty += it.qty;
    p.amount += Number(it.line_total || 0);
    productMap.set(sku, p);
  }
  const topBrands = [...brandMap.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 5);
  const topProducts = [...productMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);

  const fmt = (n: number) => Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 0 });

  return (
    <div className="border border-border bg-surface p-6 rounded-md">
      <div className="flex items-center gap-3 mb-5">
        <BarChart3 className="h-5 w-5 text-brand" />
        <h2 className="font-display text-xl">Аналитика</h2>
      </div>

      {total === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Здесь появится статистика после первой заявки.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Kpi label="Всего заявок" value={String(total)} sub={`${drafts} черновиков`} />
            <Kpi label="В работе" value={String(active)} sub="подтверждённые и в обработке" />
            <Kpi label="Сумма закупок" value={`${fmt(totalSpent)} ₽`} sub={`за всё время`} />
            <Kpi label="Средний чек" value={`${fmt(avgCheck)} ₽`} sub={`за ${submittedCount || 0} заявок`} accent />
          </div>

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
            {/* Гистограмма по месяцам */}
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                Заявки за 6 месяцев — {fmt(last30Amount)} ₽ за 30 дней
              </div>
              <div className="flex items-end gap-2 h-40 border-b border-border">
                {months.map((m, i) => {
                  const h = Math.round((m.amount / maxAmount) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className="w-full bg-brand/70 hover:bg-brand transition-colors rounded-t"
                          style={{ height: `${Math.max(h, 2)}%` }}
                          title={`${fmt(m.amount)} ₽ · ${m.count} заявок`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-1">
                {months.map((m, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground uppercase">{m.label}</div>
                ))}
              </div>
            </div>

            {/* Топ брендов */}
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Топ брендов</div>
              {topBrands.length === 0 ? (
                <div className="text-xs text-muted-foreground">Нет данных</div>
              ) : (
                <div className="space-y-2">
                  {topBrands.map(([name, b]) => {
                    const max = topBrands[0][1].amount || 1;
                    const w = Math.round((b.amount / max) * 100);
                    return (
                      <div key={name}>
                        <div className="flex items-baseline justify-between text-xs mb-1">
                          <span className="font-medium">{name}</span>
                          <span className="text-muted-foreground">{fmt(b.amount)} ₽ · {b.qty} шт</span>
                        </div>
                        <div className="h-1.5 bg-border rounded">
                          <div className="h-full bg-accent-orange rounded" style={{ width: `${w}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Топ позиций */}
          {topProducts.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Топ позиций</div>
              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-background text-muted-foreground">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-normal">Артикул</th>
                      <th className="px-3 py-2 font-normal">Наименование</th>
                      <th className="px-3 py-2 text-right font-normal">Кол-во</th>
                      <th className="px-3 py-2 text-right font-normal">Сумма</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topProducts.map((p) => (
                      <tr key={p.sku}>
                        <td className="px-3 py-2 font-mono">{p.sku}</td>
                        <td className="px-3 py-2">{p.name}</td>
                        <td className="px-3 py-2 text-right">{p.qty}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmt(p.amount)} ₽</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="border border-border bg-background rounded-md p-4">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`font-display text-xl lg:text-2xl font-bold mt-1 ${accent ? "text-accent-orange" : ""}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function TemplatesSection({ userId }: { userId: string }) {
  const { items, clear, add } = useCart();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ["order-templates", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_templates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as { id: string; name: string; items: CartItem[]; created_at: string }[];
    },
  });

  const saveCurrent = async () => {
    if (!name.trim()) return toast.error("Введите название шаблона");
    if (items.length === 0) return toast.error("Корзина пуста");
    setSaving(true);
    const { error } = await supabase.from("order_templates").insert({
      user_id: userId,
      name: name.trim(),
      items: items as unknown as never,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Шаблон сохранён");
    setName("");
    refetch();
  };

  const applyTemplate = (tpl: { name: string; items: CartItem[] }) => {
    if (!Array.isArray(tpl.items) || tpl.items.length === 0) return toast.error("Шаблон пуст");
    tpl.items.forEach((it) => add({ ...it, qty: it.qty }));
    toast.success(`Добавлено ${tpl.items.length} поз. из «${tpl.name}»`);
  };

  const removeTpl = async (id: string) => {
    if (!confirm("Удалить шаблон?")) return;
    const { error } = await supabase.from("order_templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  };

  return (
    <div className="border border-border bg-surface p-6 rounded-md">
      <div className="flex items-center gap-3 mb-5">
        <Bookmark className="h-5 w-5 text-brand" />
        <h2 className="font-display text-xl">Шаблоны заявок</h2>
        <span className="ml-auto text-xs text-muted-foreground">{templates?.length ?? 0} сохранено</span>
      </div>

      <div className="flex gap-2 mb-5">
        <Input
          placeholder={items.length > 0 ? `Назвать шаблон из ${items.length} поз.` : "Сначала добавьте товары в корзину"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={items.length === 0}
        />
        <Button onClick={saveCurrent} disabled={saving || items.length === 0}>
          <Plus className="mr-1.5 h-4 w-4" />Сохранить
        </Button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-sm text-muted-foreground">Загрузка…</div>
      ) : templates?.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Сохраняйте корзину как шаблон — например, регулярный пополняющий заказ — и применяйте его в один клик.
        </p>
      ) : (
        <div className="space-y-2">
          {templates?.map((t) => {
            const total = (t.items ?? []).reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0);
            return (
              <div key={t.id} className="flex items-center gap-3 border border-border rounded-md p-3 bg-background">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(t.items ?? []).length} поз. · {total.toLocaleString("ru-RU")} ₽ · {new Date(t.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => applyTemplate(t)}>
                  <Repeat className="mr-1 h-3.5 w-3.5" />Применить
                </Button>
                <Button size="icon" variant="ghost" onClick={() => removeTpl(t.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <button onClick={() => { if (confirm("Очистить корзину?")) clear(); }} className="mt-4 text-xs text-muted-foreground hover:text-destructive">
          Очистить текущую корзину
        </button>
      )}
    </div>
  );
}

function DocumentsSection({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["my-documents", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_documents")
        .select("id, doc_type, file_name, file_path, created_at, order:orders!inner(id, number, user_id)")
        .eq("order.user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function download(path: string, fileName: string) {
    const { data, error } = await supabase.storage.from("order-docs").createSignedUrl(path, 60);
    if (error || !data) {
      toast.error("Не удалось получить ссылку на файл");
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const docTypeLabel: Record<string, string> = {
    invoice: "Счёт",
    invoice_pdf: "Счёт PDF",
    invoice_xml: "Счёт-фактура",
    receipt: "Квитанция",
    other: "Документ",
  };

  return (
    <div className="border border-border bg-surface p-6 rounded-md">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-brand" />
        <h2 className="font-display text-xl">Документы заказов</h2>
      </div>
      {isLoading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
      {!isLoading && (!data || data.length === 0) && (
        <div className="text-sm text-muted-foreground">Менеджер ещё не прикреплял документы к вашим заказам.</div>
      )}
      {!isLoading && data && data.length > 0 && (
        <div className="divide-y divide-border -mx-2">
          {data.map((d) => (
            <button
              key={d.id}
              onClick={() => download(d.file_path, d.file_name)}
              className="w-full flex items-center gap-3 px-2 py-3 hover:bg-background/50 text-left transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-brand shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{d.file_name}</div>
                <div className="text-xs text-muted-foreground">
                  {docTypeLabel[d.doc_type] ?? d.doc_type} · заказ {(d.order as { number: string } | null)?.number ?? "—"} · {new Date(d.created_at).toLocaleDateString("ru-RU")}
                </div>
              </div>
              <span className="text-xs text-brand">Скачать ↓</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
