import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/discounts")({
  head: () => ({ meta: [{ title: "Скидки клиентов — Админка" }, { name: "robots", content: "noindex" }] }),
  component: DiscountsPage,
});

type Discount = {
  id: string;
  name: string | null;
  user_id: string | null;
  inn: string | null;
  percent: number;
  created_at: string;
};

function DiscountsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Discount | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin-discounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("discounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Discount[];
    },
  });

  const onNew = () => { setEditing({ id: "", name: "", user_id: null, inn: null, percent: 0, created_at: "" }); setOpen(true); };
  const onDelete = async (d: Discount) => {
    if (!confirm(`Удалить скидку «${d.name || d.inn || d.user_id}»?`)) return;
    const { error } = await supabase.from("discounts").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["admin-discounts"] });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Персональные скидки</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Назначение процента скидки конкретному клиенту по user_id или ИНН организации.
            Базовая скидка профиля задаётся в карточке клиента.
          </p>
        </div>
      </header>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Всего: {q.data?.length ?? 0}</div>
          <Button size="sm" onClick={onNew}><Plus className="mr-1.5 h-4 w-4" />Новая скидка</Button>
        </div>
        {q.isLoading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>ИНН</TableHead>
                <TableHead className="w-32">Процент</TableHead>
                <TableHead className="w-32">Создано</TableHead>
                <TableHead className="w-24 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.user_id ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{d.inn ?? "—"}</TableCell>
                  <TableCell><span className="inline-flex items-center gap-1 font-semibold text-accent-orange"><Percent className="h-3.5 w-3.5" />{Number(d.percent).toFixed(1)}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("ru-RU")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(d); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(d)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {q.data?.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Пока пусто</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Редактировать скидку" : "Новая скидка"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Название / комментарий</Label>
                  <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="ООО «Партнёр» — оптовая скидка" />
                </div>
                <div className="grid gap-1.5">
                  <Label>User ID клиента</Label>
                  <Input value={editing.user_id ?? ""} onChange={(e) => setEditing({ ...editing, user_id: e.target.value })} placeholder="uuid" />
                </div>
                <div className="grid gap-1.5">
                  <Label>ИНН организации</Label>
                  <Input value={editing.inn ?? ""} onChange={(e) => setEditing({ ...editing, inn: e.target.value })} placeholder="7701234567" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Процент скидки *</Label>
                  <Input type="number" step="0.1" min="0" max="100" value={editing.percent} onChange={(e) => setEditing({ ...editing, percent: Number(e.target.value) })} />
                </div>
                <p className="text-xs text-muted-foreground">Укажите user_id или ИНН — хотя бы одно поле.</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
              <Button onClick={async () => {
                if (!editing) return;
                const payload = {
                  name: editing.name?.trim() || null,
                  user_id: editing.user_id?.trim() || null,
                  inn: editing.inn?.trim() || null,
                  percent: Number(editing.percent) || 0,
                };
                if (!payload.user_id && !payload.inn) return toast.error("Укажите User ID или ИНН");
                if (payload.percent < 0 || payload.percent > 100) return toast.error("Процент должен быть 0–100");
                const res = editing.id
                  ? await supabase.from("discounts").update(payload).eq("id", editing.id)
                  : await supabase.from("discounts").insert(payload);
                if (res.error) return toast.error(res.error.message);
                toast.success("Сохранено");
                setOpen(false);
                qc.invalidateQueries({ queryKey: ["admin-discounts"] });
              }}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}
