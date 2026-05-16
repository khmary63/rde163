import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star, Trash2, Check, X, MessageSquare, Send, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Отзывы и обращения — Админка" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl">Отзывы и обращения</h1>
        <p className="mt-1 text-sm text-muted-foreground">Модерация отзывов клиентов и входящих сообщений с сайта.</p>
      </header>
      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews"><MessageSquare className="mr-2 h-4 w-4" />Отзывы</TabsTrigger>
          <TabsTrigger value="feedback"><Inbox className="mr-2 h-4 w-4" />Обращения</TabsTrigger>
        </TabsList>
        <TabsContent value="reviews" className="mt-6"><ReviewsTab /></TabsContent>
        <TabsContent value="feedback" className="mt-6"><FeedbackTab /></TabsContent>
      </Tabs>
    </div>
  ),
});

type Review = {
  id: string;
  author_name: string;
  company: string | null;
  rating: number;
  text: string;
  source: string | null;
  is_published: boolean;
  created_at: string;
};

function ReviewsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "published">("pending");
  const [replyFor, setReplyFor] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("РДЭ Запчасти");

  const q = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: async () => {
      let qb = supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (filter === "pending") qb = qb.eq("is_published", false);
      if (filter === "published") qb = qb.eq("is_published", true);
      const { data, error } = await qb;
      if (error) throw error;
      return data as Review[];
    },
  });

  const togglePublish = async (r: Review) => {
    const { error } = await supabase.from("reviews").update({ is_published: !r.is_published }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(r.is_published ? "Снят с публикации" : "Опубликовано");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  const remove = async (r: Review) => {
    if (!confirm("Удалить отзыв?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  const sendReply = async () => {
    if (!replyFor || !replyText.trim()) return;
    const { error } = await supabase.from("review_replies").insert({
      review_id: replyFor.id,
      author_name: replyAuthor.trim() || "РДЭ Запчасти",
      text: replyText.trim(),
    });
    if (error) return toast.error(error.message);
    toast.success("Ответ опубликован");
    setReplyFor(null);
    setReplyText("");
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        {(["pending", "published", "all"] as const).map((k) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
            {k === "pending" ? "На модерации" : k === "published" ? "Опубликованные" : "Все"}
          </Button>
        ))}
        <div className="ml-auto text-sm text-muted-foreground">Всего: {q.data?.length ?? 0}</div>
      </div>

      {q.isLoading ? (
        <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : q.data?.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Пусто</div>
      ) : (
        <div className="space-y-3">
          {q.data?.map((r) => (
            <div key={r.id} className="rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.author_name}</span>
                    {r.company && <span className="text-sm text-muted-foreground">· {r.company}</span>}
                    <div className="flex items-center gap-0.5 ml-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent-orange text-accent-orange" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    {r.is_published ? <Badge variant="default">Опубликован</Badge> : <Badge variant="secondary">На модерации</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("ru-RU")} · источник: {r.source ?? "site"}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant={r.is_published ? "outline" : "default"} onClick={() => togglePublish(r)}>
                    {r.is_published ? <><X className="mr-1 h-3.5 w-3.5" />Скрыть</> : <><Check className="mr-1 h-3.5 w-3.5" />Опубликовать</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setReplyFor(r); setReplyText(""); }}>
                    <Send className="mr-1 h-3.5 w-3.5" />Ответить
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap">{r.text}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!replyFor} onOpenChange={(o) => !o && setReplyFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ответ на отзыв</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Автор ответа</Label>
              <Input value={replyAuthor} onChange={(e) => setReplyAuthor(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Текст ответа</Label>
              <Textarea rows={5} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyFor(null)}>Отмена</Button>
            <Button onClick={sendReply}>Опубликовать ответ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

type Feedback = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string;
  status: string;
  created_at: string;
};

function FeedbackTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "new" | "done">("new");

  const q = useQuery({
    queryKey: ["admin-feedback", filter],
    queryFn: async () => {
      let qb = supabase.from("feedback_messages").select("*").order("created_at", { ascending: false });
      if (filter !== "all") qb = qb.eq("status", filter);
      const { data, error } = await qb;
      if (error) throw error;
      return data as Feedback[];
    },
  });

  const setStatus = async (f: Feedback, status: string) => {
    const { error } = await supabase.from("feedback_messages").update({ status }).eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Статус обновлён");
    qc.invalidateQueries({ queryKey: ["admin-feedback"] });
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        {(["new", "done", "all"] as const).map((k) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
            {k === "new" ? "Новые" : k === "done" ? "Обработанные" : "Все"}
          </Button>
        ))}
        <div className="ml-auto text-sm text-muted-foreground">Всего: {q.data?.length ?? 0}</div>
      </div>

      {q.isLoading ? (
        <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : q.data?.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Пусто</div>
      ) : (
        <div className="space-y-3">
          {q.data?.map((f) => (
            <div key={f.id} className="rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{f.name || "Без имени"}</span>
                    {f.phone && <a href={`tel:${f.phone}`} className="text-sm text-brand hover:underline">{f.phone}</a>}
                    {f.email && <a href={`mailto:${f.email}`} className="text-sm text-brand hover:underline">{f.email}</a>}
                    <Badge variant={f.status === "new" ? "default" : "secondary"}>{f.status}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString("ru-RU")}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {f.status !== "done" && <Button size="sm" onClick={() => setStatus(f, "done")}><Check className="mr-1 h-3.5 w-3.5" />Обработано</Button>}
                  {f.status !== "new" && <Button size="sm" variant="outline" onClick={() => setStatus(f, "new")}>В новые</Button>}
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap">{f.message}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
