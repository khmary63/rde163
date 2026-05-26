import { createFileRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldAlert, LogOut, LayoutDashboard, Package, Users as UsersIcon, GitFork, FileSpreadsheet, Library, MessageSquare, FileText, Percent, Activity, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useStaffRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Админка — РДЭ Запчасти" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isStaff, loading } = useStaffRole();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.navigate({ to: "/login" });
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Загрузка…</div>;
  }

  if (!user) return null;

  if (!isStaff) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 font-display text-2xl">Доступ запрещён</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Раздел доступен только сотрудникам РДЭ. Если вы менеджер — попросите администратора назначить роль.
          </p>
          <Button asChild className="mt-6"><Link to="/">На главную</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-foreground text-background">
        <div className="mx-auto max-w-[1600px] flex h-14 items-center gap-6 px-6">
          <Link to="/admin" className="font-display text-base font-bold uppercase tracking-wider">
            РДЭ · Админка
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <AdminLink to="/admin" icon={LayoutDashboard} label="Обзор" />
            <AdminLink to="/admin/orders" icon={Package} label="Заявки" />
            <AdminLink to="/admin/analytics" icon={BarChart3} label="Аналитика" />
            <AdminLink to="/admin/catalog" icon={FileSpreadsheet} label="Прайс" />
            <AdminLink to="/admin/customers" icon={UsersIcon} label="Клиенты" />
            <AdminLink to="/admin/crosses" icon={GitFork} label="Кросс-номера" />
            <AdminLink to="/admin/refs" icon={Library} label="Справочники" />
            <AdminLink to="/admin/reviews" icon={MessageSquare} label="Отзывы" />
            <AdminLink to="/admin/content" icon={FileText} label="Контент" />
            <AdminLink to="/admin/discounts" icon={Percent} label="Скидки" />
            <AdminLink to="/admin/logs" icon={Activity} label="Логи" />
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <Link to="/" className="text-background/70 hover:text-background">← Магазин</Link>
            <button onClick={() => signOut()} className="inline-flex items-center gap-1 text-background/70 hover:text-background">
              <LogOut className="h-3.5 w-3.5" /> Выйти
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function AdminLink({ to, icon: Icon, label }: { to: string; icon: typeof Package; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-background/70 hover:bg-background/10 hover:text-background"
      activeProps={{ className: "inline-flex items-center gap-1.5 rounded px-3 py-1.5 bg-brand text-brand-foreground" }}
      activeOptions={{ exact: to === "/admin" }}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </Link>
  );
}
