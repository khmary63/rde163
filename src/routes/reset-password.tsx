import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/proxy-client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Новый пароль — РДЭ Запчасти" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the recovery link is opened
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // If user already has a session from the recovery link
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Пароль должен быть не короче 6 символов");
      return;
    }
    if (password !== confirm) {
      toast.error("Пароли не совпадают");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Пароль обновлён");
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
        <h1 className="font-display text-2xl text-center">Новый пароль</h1>
        {!ready ? (
          <p className="text-sm text-muted-foreground text-center">
            Откройте эту страницу по ссылке из письма для восстановления пароля.
            <br />
            <Link to="/forgot-password" className="text-brand hover:underline">Запросить ссылку ещё раз</Link>
          </p>
        ) : (
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Новый пароль" className="w-full h-11 rounded-md border border-input bg-background px-3 pr-10 text-sm focus:outline-none focus:border-brand" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <input required type={showPassword ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Повторите пароль" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
            <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
              {loading ? "Сохраняем…" : "Сохранить пароль"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
