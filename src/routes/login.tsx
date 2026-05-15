import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Вход — ГРОСС Запчасти" }] }),
  component: () => (
    <div className="min-h-screen flex items-center justify-center bg-background grid-bg p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-surface p-8">
        <Link to="/" className="block text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center bg-brand text-brand-foreground font-display font-bold text-lg">Г</div>
            <span className="font-display font-bold text-xl tracking-wide">ГРОСС ЗАПЧАСТИ</span>
          </div>
        </Link>
        <h1 className="font-display text-2xl text-center">Вход в личный кабинет</h1>
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Логин или email" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <input type="password" placeholder="Пароль" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <Button className="w-full bg-brand text-brand-foreground hover:bg-brand/90">Войти</Button>
        </form>
        <div className="text-sm text-center text-muted-foreground">
          Нет аккаунта? <Link to="/register" className="text-brand hover:underline">Зарегистрироваться</Link>
        </div>
        <Link to="/" className="block text-xs text-center text-muted-foreground hover:text-foreground">← На главную</Link>
      </div>
    </div>
  ),
});
