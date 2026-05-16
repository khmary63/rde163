import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, Trash2, Loader2, Download, FileSpreadsheet } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "./admin.index";
import { exportOrderToExcel } from "@/lib/order-excel";
import { toast } from "sonner";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export const Route = createFileRoute("/admin/orders/$id")({
  component: AdminOrderDetail,
});

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "submitted", label: "Новая" },
  { value: "confirmed", label: "Подтверждена" },
  { value: "processing", label: "В работе" },
  { value: "shipped", label: "Отгружена" },
  { value: "completed", label: "Завершена" },
  { value: "cancelled", label: "Отменена" },
];

const DOC_TYPES = [
  { value: "invoice", label: "Счёт" },
  { value: "invoice_factura", label: "Счёт-фактура" },
  { value: "waybill", label: "ТТН" },
  { value: "act", label: "Акт" },
  { value: "other", label: "Прочее" },
];

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [docType, setDocType] = useState("invoice");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const orderQ = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, number, status, total_amount, created_at, submitted_at, notes, invoice_grouping, user_id")
        .eq("id", id)
        .single();
      if (error) throw error;

      const [items, docs, profile] = await Promise.all([
        supabase.from("order_items")
          .select("id, qty, unit_price, line_total, product:products(name, sku, brand:brands(name)), warehouse:warehouses(name, city)")
          .eq("order_id", id),
        supabase.from("order_documents")
          .select("id, doc_type, file_path, file_name, created_at")
          .eq("order_id", id)
          .order("created_at", { ascending: false }),
        supabase.from("profiles")
          .select("full_name, company_name, inn, kpp, legal_address, phone, email, discount_percent")
          .eq("id", order.user_id)
          .maybeSingle(),
      ]);

      return {
        ...order,
        items: items.data ?? [],
        documents: docs.data ?? [],
        profile: profile.data ?? null,
      };
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: OrderStatus) => {
      const patch: Database["public"]["Tables"]["orders"]["Update"] = { status: newStatus };
      if (newStatus === "completed") patch.completed_at = new Date().toISOString();
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "order", id] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Статус обновлён");
    },
    onError: (e) => toast.error("Ошибка", { description: e instanceof Error ? e.message : "" }),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]/g, "_");
      const path = `${id}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from("order-docs").upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("order_documents").insert({
        order_id: id,
        doc_type: docType,
        file_path: path,
        file_name: file.name,
        uploaded_by: user?.id ?? null,
      });
      if (dbErr) throw dbErr;
      qc.invalidateQueries({ queryKey: ["admin", "order", id] });
      toast.success("Документ загружен");
    } catch (e) {
      toast.error("Не удалось загрузить", { description: e instanceof Error ? e.message : "" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteDoc = async (docId: string, path: string) => {
    if (!confirm("Удалить документ?")) return;
    const { error: sErr } = await supabase.storage.from("order-docs").remove([path]);
    if (sErr) toast.error(sErr.message);
    const { error } = await supabase.from("order_documents").delete().eq("id", docId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "order", id] });
    toast.success("Удалено");
  };

  const downloadDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("order-docs").createSignedUrl(path, 60);
    if (error || !data) return toast.error(error?.message ?? "Ошибка");
    window.open(data.signedUrl, "_blank");
  };

  if (orderQ.isLoading) {
    return <div className="mx-auto max-w-[1600px] px-6 py-10 text-center text-muted-foreground">Загрузка…</div>;
  }
  if (!orderQ.data) {
    return <div className="mx-auto max-w-[1600px] px-6 py-10 text-center">Заявка не найдена</div>;
  }
  const o = orderQ.data;
  const p = o.profile;

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> К списку заявок
      </Link>

      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="font-mono text-[11px] text-brand uppercase tracking-[0.3em]">/ заявка</div>
          <h1 className="font-display text-3xl font-bold mt-1">{o.number}</h1>
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={o.status} />
            <span className="text-xs text-muted-foreground">
              Создана {new Date(o.created_at).toLocaleString("ru-RU")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Статус:</span>
          <Select value={o.status} onValueChange={(v) => statusMutation.mutate(v as OrderStatus)}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {/* Items */}
          <section className="border border-border rounded-md bg-surface overflow-hidden">
            <h2 className="font-display text-lg px-5 py-3 border-b border-border">Позиции ({o.items.length})</h2>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-background">
                <tr className="text-left">
                  <th className="px-4 py-2 font-normal">Товар</th>
                  <th className="px-4 py-2 font-normal">Склад</th>
                  <th className="px-4 py-2 font-normal text-right">Кол-во</th>
                  <th className="px-4 py-2 font-normal text-right">Цена</th>
                  <th className="px-4 py-2 font-normal text-right">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {o.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{it.product?.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{it.product?.sku}</div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{it.warehouse?.city ?? it.warehouse?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right">{it.qty}</td>
                    <td className="px-4 py-2.5 text-right">{Number(it.unit_price).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{Number(it.line_total).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-background">
                  <td colSpan={4} className="px-4 py-3 text-right text-xs uppercase tracking-wide text-muted-foreground">Итого</td>
                  <td className="px-4 py-3 text-right font-display text-lg font-bold">
                    {Number(o.total_amount).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Documents */}
          <section className="border border-border rounded-md bg-surface">
            <h2 className="font-display text-lg px-5 py-3 border-b border-border">Документы</h2>
            <div className="p-5 space-y-3">
              {o.documents.length === 0 && (
                <p className="text-sm text-muted-foreground">Документов пока нет.</p>
              )}
              {o.documents.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
                  <FileText className="h-4 w-4 text-brand shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.file_name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {DOC_TYPES.find((t) => t.value === d.doc_type)?.label ?? d.doc_type}
                      {" · "}
                      {new Date(d.created_at).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <button onClick={() => downloadDoc(d.file_path)} className="text-muted-foreground hover:text-foreground p-1" title="Скачать">
                    <Download className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteDoc(d.id, d.file_path)} className="text-muted-foreground hover:text-destructive p-1" title="Удалить">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="gap-1.5"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploading ? "Загрузка…" : "Загрузить файл"}
                </Button>
                <span className="text-[11px] text-muted-foreground">PDF, JPG, XLSX до 20 MB</span>
              </div>
            </div>
          </section>

          {o.notes && (
            <section className="border border-border rounded-md bg-surface p-5">
              <h2 className="font-display text-base mb-2">Комментарий клиента</h2>
              <p className="text-sm whitespace-pre-wrap">{o.notes}</p>
            </section>
          )}
        </div>

        {/* Customer card */}
        <aside className="border border-border rounded-md bg-surface p-5 h-fit space-y-4">
          <h2 className="font-display text-lg">Клиент</h2>
          {p?.company_name ? (
            <div>
              <div className="font-medium">{p.company_name}</div>
              {p.full_name && <div className="text-xs text-muted-foreground">{p.full_name}</div>}
            </div>
          ) : (
            <div className="font-medium">{p?.full_name ?? "—"}</div>
          )}
          <dl className="text-sm space-y-2">
            {p?.phone && <Field label="Телефон"><a href={`tel:${p.phone}`} className="hover:text-brand">{p.phone}</a></Field>}
            {p?.email && <Field label="Email"><a href={`mailto:${p.email}`} className="hover:text-brand">{p.email}</a></Field>}
            {p?.inn && <Field label="ИНН">{p.inn}</Field>}
            {p?.kpp && <Field label="КПП">{p.kpp}</Field>}
            {p?.legal_address && <Field label="Юр. адрес">{p.legal_address}</Field>}
            <Field label="Скидка">{Number(p?.discount_percent ?? 0).toFixed(1)} %</Field>
            <Field label="Тип счёта">{o.invoice_grouping === "per_warehouse" ? "По складам" : "Единый"}</Field>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
