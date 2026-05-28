import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Регистрация — РДЭ Запчасти" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [type, setType] = useState<"individual" | "company">("company");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    company_name: "",
    inn: "",
  });

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Пароль не короче 6 символов");
      return;
    }
    if (type === "company" && (!form.company_name || !form.inn)) {
      toast.error("Заполните название организации и ИНН");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: {
          customer_type: type,
          full_name: form.full_name,
          phone: form.phone,
          company_name: type === "company" ? form.company_name : null,
          inn: type === "company" ? form.inn : null,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Подтвердите регистрацию по ссылке в письме");
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-bg p-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-surface p-8">
        <Link to="/" className="block text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center bg-brand text-brand-foreground font-display font-bold text-lg">Р</div>
            <span className="font-display font-bold text-xl tracking-wide">РДЭ ЗАПЧАСТИ</span>
          </div>
        </Link>
        <h1 className="font-display text-2xl text-center">Регистрация</h1>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-md bg-background border border-border">
          {(["company", "individual"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`h-10 rounded text-sm font-medium transition-colors ${type === t ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "company" ? "Юридическое лицо" : "Физическое лицо"}
            </button>
          ))}
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          {type === "company" && (
            <>
              <input required value={form.company_name} onChange={set("company_name")} placeholder="Наименование организации" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
              <input required value={form.inn} onChange={set("inn")} placeholder="ИНН" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
            </>
          )}
          <input required value={form.full_name} onChange={set("full_name")} placeholder={type === "company" ? "ФИО контактного лица" : "ФИО"} className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <input required type="tel" value={form.phone} onChange={set("phone")} placeholder="Телефон" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <input required type="email" value={form.email} onChange={set("email")} placeholder="Email" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <input required type="password" value={form.password} onChange={set("password")} placeholder="Пароль (мин. 6 символов)" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">После регистрации потребуется подтверждение email.</p>
        </form>
        <div className="text-sm text-center text-muted-foreground">
          Уже есть аккаунт? <Link to="/login" className="text-brand hover:underline">Войти</Link>
        </div>
      </div>
    </div>
  );
}
