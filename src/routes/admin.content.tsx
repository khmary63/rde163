import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Phone, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/content")({
  head: () => ({ meta: [{ title: "Контакты и блог — Админка" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl">Контент сайта</h1>
        <p className="mt-1 text-sm text-muted-foreground">Контактные данные и статьи блога.</p>
      </header>
      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts"><Phone className="mr-2 h-4 w-4" />Контакты</TabsTrigger>
          <TabsTrigger value="blog"><FileText className="mr-2 h-4 w-4" />Блог</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="mt-6"><ContactsTab /></TabsContent>
        <TabsContent value="blog" className="mt-6"><BlogTab /></TabsContent>
      </Tabs>
    </div>
  ),
});

type Contact = { id: string; key: string; label: string | null; value: string; sort_order: number };

function ContactsTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Contact | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_contacts").select("*").order("sort_order").order("key");
      if (error) throw error;
      return data as Contact[];
    },
  });

  const onNew = () => { setEditing({ id: "", key: "", label: "", value: "", sort_order: 0 }); setOpen(true); };
  const onDelete = async (c: Contact) => {
    if (!confirm(`Удалить контакт «${c.key}»?`)) return;
    const { error } = await supabase.from("site_contacts").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["admin-contacts"] });
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Всего: {q.data?.length ?? 0}</div>
        <Button size="sm" onClick={onNew}><Plus className="mr-1.5 h-4 w-4" />Новый контакт</Button>
      </div>
      {q.isLoading ? (
        <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ключ</TableHead>
              <TableHead>Подпись</TableHead>
              <TableHead>Значение</TableHead>
              <TableHead className="w-20">Порядок</TableHead>
              <TableHead className="w-24 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.key}</TableCell>
                <TableCell>{c.label ?? "—"}</TableCell>
                <TableCell className="text-sm">{c.value}</TableCell>
                <TableCell>{c.sort_order}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <DialogHeader><DialogTitle>{editing?.id ? "Редактировать контакт" : "Новый контакт"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Ключ *</Label>
                  <Input value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} placeholder="phone, email, address" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Порядок</Label>
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Подпись</Label>
                <Input value={editing.label ?? ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Отдел продаж" />
              </div>
              <div className="grid gap-1.5">
                <Label>Значение *</Label>
                <Textarea rows={2} value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={async () => {
              if (!editing) return;
              const payload = {
                key: editing.key.trim(),
                label: editing.label?.trim() || null,
                value: editing.value.trim(),
                sort_order: Number(editing.sort_order) || 0,
              };
              if (!payload.key || !payload.value) return toast.error("Ключ и значение обязательны");
              const res = editing.id
                ? await supabase.from("site_contacts").update(payload).eq("id", editing.id)
                : await supabase.from("site_contacts").insert(payload);
              if (res.error) return toast.error(res.error.message);
              toast.success("Сохранено");
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["admin-contacts"] });
            }}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  author: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

function BlogTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Post | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  const onNew = () => {
    setEditing({
      id: "", title: "", slug: "", excerpt: "", content: "", cover_url: "",
      author: "Редакция РДЭ", is_published: false, published_at: null, created_at: "",
    });
    setOpen(true);
  };
  const onDelete = async (p: Post) => {
    if (!confirm(`Удалить статью «${p.title}»?`)) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["admin-posts"] });
  };
  const togglePublish = async (p: Post) => {
    const { error } = await supabase.from("blog_posts").update({
      is_published: !p.is_published,
      published_at: !p.is_published ? new Date().toISOString() : p.published_at,
    }).eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-posts"] });
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Всего: {q.data?.length ?? 0}</div>
        <Button size="sm" onClick={onNew}><Plus className="mr-1.5 h-4 w-4" />Новая статья</Button>
      </div>
      {q.isLoading ? (
        <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Заголовок</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Автор</TableHead>
              <TableHead className="w-32">Статус</TableHead>
              <TableHead className="w-24 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.data?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{p.slug}</TableCell>
                <TableCell className="text-sm">{p.author ?? "—"}</TableCell>
                <TableCell>
                  <button onClick={() => togglePublish(p)}>
                    <Badge variant={p.is_published ? "default" : "secondary"}>
                      {p.is_published ? "Опубликовано" : "Черновик"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Редактировать статью" : "Новая статья"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Заголовок *</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Slug *</Label>
                  <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="kak-vybrat-tnvd" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Автор</Label>
                  <Input value={editing.author ?? ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>URL обложки</Label>
                <Input value={editing.cover_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} placeholder="https://…" />
              </div>
              <div className="grid gap-1.5">
                <Label>Краткое описание</Label>
                <Textarea rows={2} value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Содержимое (Markdown) *</Label>
                <Textarea rows={12} className="font-mono text-xs" value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                <Label>Опубликовано</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={async () => {
              if (!editing) return;
              const payload = {
                title: editing.title.trim(),
                slug: editing.slug.trim().toLowerCase(),
                excerpt: editing.excerpt?.trim() || null,
                content: editing.content,
                cover_url: editing.cover_url?.trim() || null,
                author: editing.author?.trim() || null,
                is_published: editing.is_published,
                published_at: editing.is_published ? (editing.published_at || new Date().toISOString()) : editing.published_at,
              };
              if (!payload.title || !payload.slug || !payload.content) return toast.error("Заголовок, slug и содержимое обязательны");
              const res = editing.id
                ? await supabase.from("blog_posts").update(payload).eq("id", editing.id)
                : await supabase.from("blog_posts").insert(payload);
              if (res.error) return toast.error(res.error.message);
              toast.success("Сохранено");
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["admin-posts"] });
            }}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
