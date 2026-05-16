import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, User as UserIcon, Building2, Phone, Mail, Percent, ShoppingBag, FileText, Repeat, BarChart3, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
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

          {/* Разделы */}
          <div className="grid sm:grid-cols-2 gap-3">
            <NavTile to="/account" icon={ShoppingBag} title="Текущие заказы" desc="Активные заявки и статусы" />
            <NavTile to="/account" icon={Repeat} title="Покупки" desc="История заказов" />
            <NavTile to="/account" icon={FileText} title="Документы" desc="Счета и счёт-фактуры" />
            <NavTile to="/account" icon={Repeat} title="Шаблоны" desc="Повторные заказы в один клик" />
            <NavTile to="/account" icon={BarChart3} title="Дашборд" desc="Статистика и аналитика" />
            <NavTile to="/account" icon={Headset} title="Личный менеджер" desc="Связь и запросы" />
          </div>
          <p className="text-xs text-muted-foreground">Разделы наполняются на следующем этапе.</p>
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
