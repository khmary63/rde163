import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Вход — РДЭ Запчасти" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Добро пожаловать!");
    navigate({ to: "/account" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-bg p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-surface p-8">
        <Link to="/" className="block text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center bg-brand text-brand-foreground font-display font-bold text-lg">Р</div>
            <span className="font-display font-bold text-xl tracking-wide">РДЭ ЗАПЧАСТИ</span>
          </div>
        </Link>
        <h1 className="font-display text-2xl text-center">Вход в личный кабинет</h1>
        <form className="space-y-3" onSubmit={onSubmit}>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
          <div className="relative">
            <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="w-full h-11 rounded-md border border-input bg-background px-3 pr-10 text-sm focus:outline-none focus:border-brand" />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? "Входим…" : "Войти"}
          </Button>
        </form>
        <div className="text-sm text-center text-muted-foreground">
          Нет аккаунта? <Link to="/register" className="text-brand hover:underline">Зарегистрироваться</Link>
        </div>
        <Link to="/" className="block text-xs text-center text-muted-foreground hover:text-foreground">← На главную</Link>
      </div>
    </div>
  );
}
