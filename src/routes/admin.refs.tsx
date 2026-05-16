import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Loader2, Building2, Warehouse, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/refs")({
  head: () => ({ meta: [{ title: "Справочники — Админка" }, { name: "robots", content: "noindex" }] }),
  component: RefsPage,
});

function RefsPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl">Справочники</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Бренды, склады и менеджеры — базовые сущности каталога и кабинета клиента.
        </p>
      </header>

      <Tabs defaultValue="brands">
        <TabsList>
          <TabsTrigger value="brands"><Building2 className="mr-2 h-4 w-4" />Бренды</TabsTrigger>
          <TabsTrigger value="warehouses"><Warehouse className="mr-2 h-4 w-4" />Склады</TabsTrigger>
          <TabsTrigger value="managers"><UserCog className="mr-2 h-4 w-4" />Менеджеры</TabsTrigger>
        </TabsList>
        <TabsContent value="brands" className="mt-6"><BrandsTab /></TabsContent>
        <TabsContent value="warehouses" className="mt-6"><WarehousesTab /></TabsContent>
        <TabsContent value="managers" className="mt-6"><ManagersTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================= BRANDS ============================= */

type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  sort_order: number;
};

function BrandsTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Brand | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("*").order("sort_order").order("name");
      if (error) throw error;
      return data as Brand[];
    },
  });

  const onNew = () => { setEditing({ id: "", name: "", slug: "", description: null, logo_url: null, sort_order: 0 }); setOpen(true); };
  const onEdit = (b: Brand) => { setEditing(b); setOpen(true); };
  const onDelete = async (b: Brand) => {
    if (!confirm(`Удалить бренд «${b.name}»? Связанные товары останутся, но потеряют бренд.`)) return;
    const { error } = await supabase.from("brands").delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["admin-brands"] });
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Всего: {q.data?.length ?? 0}</div>
        <Button size="sm" onClick={onNew}><Plus className="mr-1.5 h-4 w-4" />Новый бренд</Button>
      </div>
      {q.isLoading ? (
        <div className="py-12 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Лого</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-24">Порядок</TableHead>
              <TableHead className="w-24 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.data?.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  {b.logo_url ? <img src={b.logo_url} alt={b.name} className="h-8 w-8 rounded object-contain" /> : <div className="h-8 w-8 rounded bg-muted" />}
                </TableCell>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{b.slug}</TableCell>
                <TableCell>{b.sort_order}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(b)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {q.data?.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Пока пусто</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Редактировать бренд" : "Новый бренд"}</DialogTitle></DialogHeader>
          {editing && <BrandForm value={editing} onChange={setEditing} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={async () => {
              if (!editing) return;
              const payload = {
                name: editing.name.trim(),
                slug: editing.slug.trim().toLowerCase(),
                description: editing.description?.trim() || null,
                logo_url: editing.logo_url?.trim() || null,
                sort_order: Number(editing.sort_order) || 0,
              };
              if (!payload.name || !payload.slug) return toast.error("Название и slug обязательны");
              const res = editing.id
                ? await supabase.from("brands").update(payload).eq("id", editing.id)
                : await supabase.from("brands").insert(payload);
              if (res.error) return toast.error(res.error.message);
              toast.success("Сохранено");
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["admin-brands"] });
            }}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function BrandForm({ value, onChange }: { value: Brand; onChange: (v: Brand) => void }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>Название *</Label>
        <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label>Slug *</Label>
        <Input value={value.slug} onChange={(e) => onChange({ ...value, slug: e.target.value })} placeholder="bosch" />
      </div>
      <div className="grid gap-1.5">
        <Label>URL логотипа</Label>
        <Input value={value.logo_url ?? ""} onChange={(e) => onChange({ ...value, logo_url: e.target.value })} placeholder="https://…" />
      </div>
      <div className="grid gap-1.5">
        <Label>Описание</Label>
        <Textarea rows={3} value={value.description ?? ""} onChange={(e) => onChange({ ...value, description: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label>Порядок сортировки</Label>
        <Input type="number" value={value.sort_order} onChange={(e) => onChange({ ...value, sort_order: Number(e.target.value) })} />
      </div>
    </div>
  );
}

/* =========================== WAREHOUSES =========================== */

type WH = {
  id: string;
  code: string;
  name: string;
  city: string | null;
  address: string | null;
  is_active: boolean;
  sort_order: number;
};

function WarehousesTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<WH | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin-warehouses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("warehouses").select("*").order("sort_order").order("name");
      if (error) throw error;
      return data as WH[];
    },
  });

  const onNew = () => { setEditing({ id: "", code: "", name: "", city: null, address: null, is_active: true, sort_order: 0 }); setOpen(true); };
  const onEdit = (w: WH) => { setEditing(w); setOpen(true); };
  const onDelete = async (w: WH) => {
    if (!confirm(`Удалить склад «${w.name}»? Остатки и позиции заявок с этим складом также будут удалены.`)) return;
    const { error } = await supabase.from("warehouses").delete().eq("id", w.id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["admin-warehouses"] });
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Всего: {q.data?.length ?? 0}</div>
        <Button size="sm" onClick={onNew}><Plus className="mr-1.5 h-4 w-4" />Новый склад</Button>
      </div>
      {q.isLoading ? (
        <div className="py-12 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Код</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Город</TableHead>
              <TableHead>Адрес</TableHead>
              <TableHead className="w-20">Активен</TableHead>
              <TableHead className="w-24">Порядок</TableHead>
              <TableHead className="w-24 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.data?.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-mono text-xs">{w.code}</TableCell>
                <TableCell className="font-medium">{w.name}</TableCell>
                <TableCell>{w.city ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{w.address ?? "—"}</TableCell>
                <TableCell>{w.is_active ? "Да" : "Нет"}</TableCell>
                <TableCell>{w.sort_order}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(w)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(w)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {q.data?.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Пока пусто</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Редактировать склад" : "Новый склад"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Код *</Label>
                  <Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} placeholder="MSK01" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Порядок</Label>
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Название *</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Город</Label>
                <Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Адрес</Label>
                <Input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>Активен (виден клиентам)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={async () => {
              if (!editing) return;
              const payload = {
                code: editing.code.trim().toUpperCase(),
                name: editing.name.trim(),
                city: editing.city?.trim() || null,
                address: editing.address?.trim() || null,
                is_active: editing.is_active,
                sort_order: Number(editing.sort_order) || 0,
              };
              if (!payload.code || !payload.name) return toast.error("Код и название обязательны");
              const res = editing.id
                ? await supabase.from("warehouses").update(payload).eq("id", editing.id)
                : await supabase.from("warehouses").insert(payload);
              if (res.error) return toast.error(res.error.message);
              toast.success("Сохранено");
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["admin-warehouses"] });
            }}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ============================ MANAGERS ============================ */

type Manager = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  is_active: boolean;
};

function ManagersTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Manager | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin-managers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("managers").select("*").order("full_name");
      if (error) throw error;
      return data as Manager[];
    },
  });

  const onNew = () => { setEditing({ id: "", full_name: "", phone: null, email: null, photo_url: null, is_active: true }); setOpen(true); };
  const onEdit = (m: Manager) => { setEditing(m); setOpen(true); };
  const onDelete = async (m: Manager) => {
    if (!confirm(`Удалить менеджера «${m.full_name}»?`)) return;
    const { error } = await supabase.from("managers").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["admin-managers"] });
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Всего: {q.data?.length ?? 0}</div>
        <Button size="sm" onClick={onNew}><Plus className="mr-1.5 h-4 w-4" />Новый менеджер</Button>
      </div>
      {q.isLoading ? (
        <div className="py-12 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Фото</TableHead>
              <TableHead>ФИО</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-20">Активен</TableHead>
              <TableHead className="w-24 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.data?.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  {m.photo_url ? <img src={m.photo_url} alt={m.full_name} className="h-9 w-9 rounded-full object-cover" /> : <div className="h-9 w-9 rounded-full bg-muted" />}
                </TableCell>
                <TableCell className="font-medium">{m.full_name}</TableCell>
                <TableCell>{m.phone ?? "—"}</TableCell>
                <TableCell>{m.email ?? "—"}</TableCell>
                <TableCell>{m.is_active ? "Да" : "Нет"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(m)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <DialogHeader><DialogTitle>{editing?.id ? "Редактировать менеджера" : "Новый менеджер"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>ФИО *</Label>
                <Input value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Телефон</Label>
                  <Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>URL фото</Label>
                <Input value={editing.photo_url ?? ""} onChange={(e) => setEditing({ ...editing, photo_url: e.target.value })} placeholder="https://…" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>Активен (виден клиентам)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={async () => {
              if (!editing) return;
              const payload = {
                full_name: editing.full_name.trim(),
                phone: editing.phone?.trim() || null,
                email: editing.email?.trim() || null,
                photo_url: editing.photo_url?.trim() || null,
                is_active: editing.is_active,
              };
              if (!payload.full_name) return toast.error("ФИО обязательно");
              const res = editing.id
                ? await supabase.from("managers").update(payload).eq("id", editing.id)
                : await supabase.from("managers").insert(payload);
              if (res.error) return toast.error(res.error.message);
              toast.success("Сохранено");
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["admin-managers"] });
            }}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
