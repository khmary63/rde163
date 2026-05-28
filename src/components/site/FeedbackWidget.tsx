import { useState } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { notifyNewFeedback } from "@/lib/notify.functions";
import { toast } from "sonner";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const notify = useServerFn(notifyNewFeedback);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      name: form.name,
      phone: form.phone,
      message: form.message,
      user_id: user?.id ?? null,
      email: user?.email ?? null,
    };
    const { data: inserted, error } = await supabase
      .from("feedback_messages")
      .insert(payload)
      .select("id")
      .single();
    if (error || !inserted) {
      setLoading(false);
      toast.error("Не удалось отправить сообщение");
      return;
    }
    // Параллельно уведомим менеджера в MAX (ошибка не блокирует UX)
    notify({ data: { feedback_id: inserted.id } }).catch(() => {});
    setLoading(false);
    setSent(true);
    setForm({ name: "", phone: "", message: "" });
  }

  return (
    <>
      <a
        href="https://max.ru/u/f9LHodD0cOLtOegQuRGbTfeI0oQqDRMHqPnuwG3FVK8EO9mm8Mgn5nncB-k"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/30 hover:bg-brand/90 transition-all"
        aria-label="Связаться с менеджером в Max"
      >
        <MessageSquare className="h-4 w-4" />
        <span className="hidden sm:inline">Связаться</span>
      </a>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end bg-background/60 backdrop-blur-sm p-0 sm:p-6">
          <div className="w-full sm:w-96 bg-surface border border-border rounded-t-xl sm:rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <div>
                <div className="font-display text-lg">Связь с менеджером</div>
                <div className="text-xs text-muted-foreground">Ответим в течение рабочего дня</div>
              </div>
              <button onClick={() => { setOpen(false); setSent(false); }} aria-label="Закрыть" className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {sent ? (
              <div className="p-8 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-status-in-stock/20 flex items-center justify-center">
                  <Send className="h-5 w-5 text-status-in-stock" />
                </div>
                <div className="font-display text-lg">Сообщение отправлено</div>
                <p className="text-sm text-muted-foreground">Менеджер свяжется с вами по указанному телефону.</p>
                <Button variant="outline" onClick={() => { setSent(false); setOpen(false); }}>Закрыть</Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4">
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ваше имя"
                  className="w-full rounded-md bg-background border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Телефон"
                  className="w-full rounded-md bg-background border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Опишите задачу: артикул, бренд техники, что нужно подобрать"
                  className="w-full rounded-md bg-background border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
                <p className="text-xs text-muted-foreground">
                  Нажимая «Отправить», вы соглашаетесь на обработку персональных данных.
                </p>
                <Button type="submit" disabled={loading} className="bg-brand text-brand-foreground hover:bg-brand/90">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Отправить
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
