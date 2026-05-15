import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Регистрация — ГРОСС Запчасти" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const [type, setType] = useState<"individual" | "company">("company");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-bg p-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-surface p-8">
        <Link to="/" className="block text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center bg-brand text-brand-foreground font-display font-bold text-lg">Г</div>
            <span className="font-display font-bold text-xl tracking-wide">ГРОСС ЗАПЧАСТИ</span>
          </div>
        </Link>
        <h1 className="font-display text-2xl text-center">Регистрация</h1>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-md bg-background border border-border">
          {(["company", "individual"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`h-10 rounded text-sm font-medium transition-colors ${type === t ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "company" ? "Юридическое лицо" : "Физическое лицо"}
            </button>
          ))}
        </div>

        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          {type === "company" && (
            <>
              <input placeholder="Наименование организации" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
              <input placeholder="ИНН" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
            </>
          )}
          <input placeholder={type === "company" ? "ФИО контактного лица" : "ФИО"} className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <input type="tel" placeholder="Телефон" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <input placeholder="Логин" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <input type="email" placeholder="Email для подтверждения" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <input type="password" placeholder="Пароль" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <Button className="w-full bg-brand text-brand-foreground hover:bg-brand/90">Зарегистрироваться</Button>
          <p className="text-xs text-muted-foreground text-center">После регистрации потребуется подтверждение email.</p>
        </form>
        <div className="text-sm text-center text-muted-foreground">
          Уже есть аккаунт? <Link to="/login" className="text-brand hover:underline">Войти</Link>
        </div>
      </div>
    </div>
  );
}
