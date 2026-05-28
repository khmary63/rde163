import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Восстановление пароля — РДЭ Запчасти" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Письмо отправлено");
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
        <h1 className="font-display text-2xl text-center">Восстановление пароля</h1>
        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Мы отправили ссылку для восстановления пароля на <span className="text-foreground">{email}</span>. Проверьте входящие и папку «Спам».
            </p>
            <Link to="/login" className="inline-block text-sm text-brand hover:underline">← Вернуться ко входу</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Введите email — мы пришлём ссылку для установки нового пароля.
            </p>
            <form className="space-y-3" onSubmit={onSubmit}>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-brand" />
              <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
                {loading ? "Отправляем…" : "Отправить ссылку"}
              </Button>
            </form>
            <div className="text-sm text-center">
              <Link to="/login" className="text-muted-foreground hover:text-brand hover:underline">← Вернуться ко входу</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
