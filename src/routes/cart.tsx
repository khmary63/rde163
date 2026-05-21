import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Minus, Plus, Trash2, ShoppingCart, Loader2, CheckCircle2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { submitOrder } from "@/lib/orders.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Корзина — РДЭ Запчасти" },
      { name: "description", content: "Оформление заявки менеджеру: товары сгруппированы по складам, расчёт за 30 секунд." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, total, setQty, remove, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const submit = useServerFn(submitOrder);

  const [notes, setNotes] = useState("");
  const [grouping, setGrouping] = useState<"single" | "per_warehouse">("single");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ number: string } | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, { warehouseName: string; items: typeof items }>();
    for (const it of items) {
      const g = map.get(it.warehouseId) ?? { warehouseName: it.warehouseName, items: [] };
      g.items.push(it);
      map.set(it.warehouseId, g);
    }
    return Array.from(map.entries()).map(([warehouseId, v]) => ({ warehouseId, ...v }));
  }, [items]);

  const onSubmit = async () => {
    if (!user) {
      toast.info("Войдите, чтобы оформить заявку");
      navigate({ to: "/login" });
      return;
    }
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const res = await submit({
        data: {
          items: items.map((it) => ({
            product_id: it.productId,
            warehouse_id: it.warehouseId,
            qty: it.qty,
            unit_price: it.price,
          })),
          notes: notes.trim() || undefined,
          invoice_grouping: grouping,
        },
      });
      clear();
      setDone({ number: res.number });
    } catch (e) {
      toast.error("Не удалось отправить заявку", { description: e instanceof Error ? e.message : "Попробуйте ещё раз" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-brand" />
        <h1 className="mt-6 font-display text-3xl uppercase">Заявка отправлена</h1>
        <p className="mt-3 text-muted-foreground">
          Номер заявки <span className="font-mono font-semibold text-foreground">{done.number}</span>. Менеджер свяжется с вами в течение 30 минут в рабочее время.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline"><Link to="/catalog">Продолжить покупки</Link></Button>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90"><Link to="/account">Мои заявки</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8">
      <h1 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">Корзина</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {items.length === 0 ? "Корзина пуста" : `${items.length} позиций · ${groups.length} склад(ов)`}
      </p>

      {items.length === 0 ? (
        <Card className="mt-8 p-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">В корзине пока ничего нет</p>
          <p className="mt-1 text-sm text-muted-foreground">Перейдите в каталог и добавьте позиции для заявки.</p>
          <Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
            <Link to="/catalog">В каталог</Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {groups.map((g) => (
              <Card key={g.warehouseId} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Склад:</span>{" "}
                    <span className="font-medium">{g.warehouseName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{g.items.length} поз.</span>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {g.items.map((it) => (
                      <tr key={`${it.productId}-${it.warehouseId}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium leading-tight">{it.name}</div>
                          <div className="mt-0.5 font-mono text-xs text-muted-foreground">{it.sku} · {it.brand}</div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="inline-flex items-center rounded-md border border-border">
                            <button
                              className="px-2 py-1.5 hover:bg-surface"
                              onClick={() => setQty(it.productId, it.warehouseId, it.qty - 1)}
                              aria-label="Уменьшить"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={it.maxQty}
                              value={it.qty}
                              onChange={(e) => setQty(it.productId, it.warehouseId, Number(e.target.value) || 1)}
                              className="w-14 border-x border-border bg-transparent py-1 text-center text-sm focus:outline-none"
                            />
                            <button
                              className="px-2 py-1.5 hover:bg-surface disabled:opacity-40"
                              onClick={() => setQty(it.productId, it.warehouseId, it.qty + 1)}
                              disabled={it.qty >= it.maxQty}
                              aria-label="Увеличить"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">макс. {it.maxQty}</div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="font-display text-base font-semibold">
                            {(it.qty * it.price).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {it.price.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽/шт.
                          </div>
                        </td>
                        <td className="pr-3 text-right">
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-destructive"
                            onClick={() => remove(it.productId, it.warehouseId)}
                            aria-label="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ))}

            <button
              onClick={clear}
              className="text-xs text-muted-foreground hover:text-destructive hover:underline"
            >
              Очистить корзину
            </button>
          </div>

          <aside className="space-y-4">
            <Card className="p-5">
              <h2 className="font-display text-lg uppercase">Итого</h2>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Сумма заявки</span>
                <span className="font-display text-2xl font-semibold">
                  {total.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">с учётом персональной скидки. НДС включён.</p>

              {groups.length > 1 && (
                <div className="mt-5 space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Счёт</Label>
                  <RadioGroup value={grouping} onValueChange={(v) => setGrouping(v as typeof grouping)} className="space-y-1.5">
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <RadioGroupItem value="single" className="mt-0.5" />
                      <span>
                        Один общий счёт
                        <span className="block text-[11px] text-muted-foreground">все склады в одном документе</span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <RadioGroupItem value="per_warehouse" className="mt-0.5" />
                      <span>
                        Отдельно по складам
                        <span className="block text-[11px] text-muted-foreground">{groups.length} счёт(ов)</span>
                      </span>
                    </label>
                  </RadioGroup>
                </div>
              )}

              <div className="mt-5 space-y-2">
                <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-muted-foreground">Комментарий</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Сроки, способ доставки, доп. требования…"
                  rows={3}
                />
              </div>

              <Button
                onClick={onSubmit}
                disabled={submitting || loading}
                className="mt-5 w-full bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
                size="lg"
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Отправляем…</>
                ) : user ? (
                  "Купить"
                ) : (
                  "Войти и оформить"
                )}
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                <br />
              </p>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
