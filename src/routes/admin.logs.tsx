import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, FileText, MessageSquare, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "Логи — Админка" }, { name: "robots", content: "noindex" }] }),
  component: LogsPage,
});

function LogsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl">Логи и обращения</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Журнал загрузок прайса, импортов и сообщения с виджета обратной связи.
        </p>
      </header>
      <Tabs defaultValue="sync">
        <TabsList>
          <TabsTrigger value="sync"><FileText className="mr-2 h-4 w-4" />Импорты прайса</TabsTrigger>
          <TabsTrigger value="feedback"><MessageSquare className="mr-2 h-4 w-4" />Виджет связи</TabsTrigger>
        </TabsList>
        <TabsContent value="sync" className="mt-6"><SyncLogsTab /></TabsContent>
        <TabsContent value="feedback" className="mt-6"><FeedbackTab /></TabsContent>
      </Tabs>
    </div>
  );
}

type SyncLog = {
  id: string;
  source: string;
  status: string;
  message: string | null;
  rows_processed: number | null;
  rows_failed: number | null;
  started_at: string;
  finished_at: string | null;
};

function statusIcon(status: string) {
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.18_145)]" />;
  if (status === "partial") return <AlertTriangle className="h-4 w-4 text-accent-orange" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />;
}

function SyncLogsTab() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-sync-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as SyncLog[];
    },
  });

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Последние 100 записей</div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin-sync-logs"] })}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Обновить
        </Button>
      </div>
      {q.isLoading ? (
        <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Импортов пока не было</div>
      ) : (
        <div className="divide-y divide-border rounded border border-border">
          {q.data?.map((log) => {
            const dur = log.finished_at
              ? Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)
              : null;
            return (
              <div key={log.id} className="grid grid-cols-[auto_1fr_auto] gap-3 items-start p-3">
                <div className="pt-0.5">{statusIcon(log.status)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs uppercase tracking-wider">{log.source}</span>
                    <Badge variant="outline" className="text-[10px]">{log.status}</Badge>
                    {log.rows_processed != null && (
                      <span className="text-xs text-muted-foreground">обработано: <strong className="text-foreground">{log.rows_processed}</strong></span>
                    )}
                    {log.rows_failed != null && log.rows_failed > 0 && (
                      <span className="text-xs text-destructive">ошибок: {log.rows_failed}</span>
                    )}
                  </div>
                  {log.message && <div className="mt-1 text-sm text-muted-foreground break-words">{log.message}</div>}
                </div>
                <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                  <div>{new Date(log.started_at).toLocaleString("ru-RU")}</div>
                  {dur != null && <div className="mt-0.5">{dur < 60 ? `${dur} c` : `${Math.round(dur / 60)} мин`}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  const q = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Feedback[];
    },
  });

  const setStatus = async (m: Feedback, next: string) => {
    const { error } = await supabase.from("feedback_messages").update({ status: next }).eq("id", m.id);
    if (!error) qc.invalidateQueries({ queryKey: ["admin-feedback"] });
  };

  const isOpen = (m: Feedback) => m.status === "new" || m.status === "open";

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Всего: {q.data?.length ?? 0} · новых: {(q.data ?? []).filter(isOpen).length}
        </div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin-feedback"] })}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Обновить
        </Button>
      </div>
      {q.isLoading ? (
        <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Сообщений пока нет</div>
      ) : (
        <div className="space-y-3">
          {q.data?.map((m) => {
            const open = isOpen(m);
            return (
              <div
                key={m.id}
                className={`rounded border p-4 ${open ? "border-brand/40 bg-brand/5" : "border-border bg-surface/40"}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <div className="font-medium flex items-center gap-2">
                      {m.name || "Без имени"}
                      <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-x-3">
                      {m.phone && <span>{m.phone}</span>}
                      {m.email && <span>{m.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString("ru-RU")}
                    </div>
                    <button
                      onClick={() => setStatus(m, open ? "done" : "new")}
                      className={`text-xs rounded border px-2 py-1 transition-colors ${
                        open
                          ? "border-brand text-brand hover:bg-brand hover:text-brand-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {open ? "Отметить обработанным" : "Вернуть в работу"}
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-sm whitespace-pre-wrap break-words">{m.message}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
