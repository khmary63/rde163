import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/30 hover:bg-brand/90 transition-all"
        aria-label="Связаться с менеджером"
      >
        <MessageSquare className="h-4 w-4" />
        <span className="hidden sm:inline">Связаться</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end bg-background/60 backdrop-blur-sm p-0 sm:p-6">
          <div className="w-full sm:w-96 bg-surface border border-border rounded-t-xl sm:rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <div>
                <div className="font-display text-lg">Связь с менеджером</div>
                <div className="text-xs text-muted-foreground">Ответим в течение рабочего дня</div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Закрыть" className="text-muted-foreground hover:text-foreground">
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
              <form
                onSubmit={(e) => { e.preventDefault(); setSent(true); }}
                className="flex flex-col gap-3 p-4"
              >
                <input
                  required
                  type="text"
                  placeholder="Ваше имя"
                  className="w-full rounded-md bg-background border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
                <input
                  required
                  type="tel"
                  placeholder="Телефон"
                  className="w-full rounded-md bg-background border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
                <textarea
                  required
                  rows={4}
                  placeholder="Опишите задачу: артикул, бренд техники, что нужно подобрать"
                  className="w-full rounded-md bg-background border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
                <p className="text-xs text-muted-foreground">
                  Нажимая «Отправить», вы соглашаетесь на обработку персональных данных.
                </p>
                <Button type="submit" className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Send className="h-4 w-4 mr-2" /> Отправить
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
