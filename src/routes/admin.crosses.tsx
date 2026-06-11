import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/crosses")({
  head: () => ({ meta: [{ title: "Кросс-номера — Админка" }, { name: "robots", content: "noindex" }] }),
  component: CrossesPage,
});

type ParsedRow = {
  sku: string;
  cross_number: string;
  note: string | null;
  line: number;
};

type ResolveResult = {
  ok: Array<ParsedRow & { product_id: string }>;
  missing: ParsedRow[];
};

function parseCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: ParsedRow[] = [];

  // Detect delimiter
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delim = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    errors.push("Файл пустой");
    return { rows, errors };
  }

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === delim && !inQ) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((c) => c.trim());
  };

  const header = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/^\ufeff/, ""));
  const skuIdx = header.findIndex((h) => ["sku", "артикул", "article"].includes(h));
  const crossIdx = header.findIndex((h) => ["cross_number", "cross", "кросс", "кросс-номер", "кросс_номер", "analog"].includes(h));
  const noteIdx = header.findIndex((h) => ["note", "примечание", "производитель", "brand", "manufacturer", "comment"].includes(h));

  if (skuIdx === -1 || crossIdx === -1) {
    errors.push(`Не найдены обязательные колонки. Заголовки должны включать "sku" и "cross_number". Найдено: ${header.join(", ")}`);
    return { rows, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    const sku = (cols[skuIdx] ?? "").trim();
    const cross = (cols[crossIdx] ?? "").trim();
    const note = noteIdx >= 0 ? (cols[noteIdx] ?? "").trim() : "";
    if (!sku || !cross) {
      errors.push(`Строка ${i + 1}: пустой sku или cross_number`);
      continue;
    }
    if (sku.length > 100 || cross.length > 100 || note.length > 500) {
      errors.push(`Строка ${i + 1}: слишком длинное значение`);
      continue;
    }
    rows.push({ sku, cross_number: cross, note: note || null, line: i + 1 });
  }

  return { rows, errors };
}

function CrossesPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ rows: ParsedRow[]; errors: string[] } | null>(null);
  const [resolved, setResolved] = useState<ResolveResult | null>(null);
  const [busy, setBusy] = useState(false);

  const statsQ = useQuery({
    queryKey: ["crosses-stats"],
    queryFn: async () => {
      const [{ count: total }, { data: recent }] = await Promise.all([
        supabase.from("product_crosses").select("*", { count: "exact", head: true }),
        supabase
          .from("product_crosses")
          .select("id, cross_number, note, created_at, products(sku, name)")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      return { total: total ?? 0, recent: recent ?? [] };
    },
  });

  const handleFile = async (file: File) => {
    setResolved(null);
    const text = await file.text();
    const result = parseCSV(text);
    setParsed(result);
    if (result.rows.length === 0) {
      toast.error("Не удалось распарсить файл", { description: result.errors[0] });
      return;
    }
    // Resolve SKU → product_id
    const skus = Array.from(new Set(result.rows.map((r) => r.sku)));
    const { data: products, error } = await supabase
      .from("products")
      .select("id, sku")
      .in("sku", skus);
    if (error) {
      toast.error("Ошибка поиска товаров", { description: error.message });
      return;
    }
    const skuMap = new Map((products ?? []).map((p) => [p.sku, p.id]));
    const ok: ResolveResult["ok"] = [];
    const missing: ParsedRow[] = [];
    for (const r of result.rows) {
      const pid = skuMap.get(r.sku);
      if (pid) ok.push({ ...r, product_id: pid });
      else missing.push(r);
    }
    setResolved({ ok, missing });
  };

  const handleImport = async () => {
    if (!resolved || resolved.ok.length === 0) return;
    setBusy(true);
    try {
      // Batch insert in chunks of 500
      const rows = resolved.ok.map((r) => ({
        product_id: r.product_id,
        cross_number: r.cross_number,
        note: r.note,
      }));
      let inserted = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await supabase
          .from("product_crosses")
          .upsert(chunk, { onConflict: "product_id,cross_number", ignoreDuplicates: true });
        if (error) throw error;
        inserted += chunk.length;
      }
      toast.success(`Загружено ${inserted} строк`);
      setParsed(null);
      setResolved(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["crosses-stats"] });
    } catch (e: unknown) {
      toast.error("Ошибка импорта", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "sku,cross_number,note\nVG1540080110,WK 9165,Mann-Filter\nVG1540080110,FF5485,Fleetguard\nVG1540080110,1457434440,Bosch\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crosses-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteRow = async (id: string) => {
    const { error } = await supabase.from("product_crosses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["crosses-stats"] });
  };

  const previewRows = useMemo(() => resolved?.ok.slice(0, 10) ?? [], [resolved]);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight">Кросс-номера</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Всего в базе: <strong>{statsQ.data?.total ?? 0}</strong> записей
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Скачать шаблон CSV
        </Button>
      </div>

      {/* Format spec */}
      <Card className="p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Формат файла</h2>
        <p className="mt-2 text-sm">CSV (UTF-8, разделитель — запятая или точка с запятой). Первая строка — заголовки колонок.</p>
        <div className="mt-3 overflow-hidden rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Колонка</th>
                <th className="px-3 py-2 text-left">Обязательная</th>
                <th className="px-3 py-2 text-left">Описание</th>
                <th className="px-3 py-2 text-left">Пример</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-3 py-2 font-mono">sku</td>
                <td className="px-3 py-2"><Badge variant="default">да</Badge></td>
                <td className="px-3 py-2">Артикул вашего товара (поле <code>products.sku</code>). По нему ищется привязка.</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">VG1540080110</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">cross_number</td>
                <td className="px-3 py-2"><Badge variant="default">да</Badge></td>
                <td className="px-3 py-2">Кросс-номер аналога. Одна строка = один кросс. Для нескольких кроссов — несколько строк с одним <code>sku</code>.</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">WK 9165</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">note</td>
                <td className="px-3 py-2"><Badge variant="secondary">нет</Badge></td>
                <td className="px-3 py-2">Производитель аналога или комментарий.</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">Mann-Filter</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Допустимые синонимы заголовков: <code>sku</code> = «артикул», <code>cross_number</code> = «кросс» / «cross» / «analog», <code>note</code> = «примечание» / «производитель» / «brand».
          Дубликаты (один sku + один cross) пропускаются автоматически.
        </p>
      </Card>

      {/* Upload */}
      <Card className="p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Загрузка</h2>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-surface/50 px-6 py-10 hover:border-brand">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm">
            <div className="font-medium">Выберите CSV-файл</div>
            <div className="text-xs text-muted-foreground">или перетащите сюда. Максимум — 50 000 строк.</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>

        {parsed && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span>Распознано строк: <strong>{parsed.rows.length}</strong></span>
              {resolved && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Сопоставлено: <strong>{resolved.ok.length}</strong>
                  </span>
                  {resolved.missing.length > 0 && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" /> Не найдено: <strong>{resolved.missing.length}</strong>
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            {parsed.errors.length > 0 && (
              <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                <div className="font-medium text-amber-700">Предупреждения ({parsed.errors.length}):</div>
                <ul className="mt-1 max-h-24 list-disc space-y-0.5 overflow-y-auto pl-5 text-amber-700/80">
                  {parsed.errors.slice(0, 20).map((e, i) => (<li key={i}>{e}</li>))}
                </ul>
              </div>
            )}

            {resolved && resolved.missing.length > 0 && (
              <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                <div className="font-medium text-amber-700">SKU без товара в базе (будут пропущены):</div>
                <div className="mt-1 max-h-24 overflow-y-auto font-mono text-amber-700/80">
                  {Array.from(new Set(resolved.missing.map((m) => m.sku))).slice(0, 30).join(", ")}
                </div>
              </div>
            )}

            {previewRows.length > 0 && (
              <div className="overflow-hidden rounded border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">Кросс-номер</th>
                      <th className="px-3 py-2 text-left">Примечание</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewRows.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono">{r.sku}</td>
                        <td className="px-3 py-2 font-mono">{r.cross_number}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {resolved && resolved.ok.length > 10 && (
                  <div className="border-t border-border bg-surface/30 px-3 py-2 text-xs text-muted-foreground">
                    …и ещё {resolved.ok.length - 10} строк
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={busy || !resolved || resolved.ok.length === 0}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Импортировать {resolved?.ok.length ?? 0} записей
              </Button>
              <Button variant="outline" onClick={() => { setParsed(null); setResolved(null); if (fileRef.current) fileRef.current.value = ""; }}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Recent */}
      <Card className="p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Последние добавленные</h2>
        {statsQ.isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Загрузка…</div>
        ) : statsQ.data?.recent.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Пока пусто</div>
        ) : (
          <div className="mt-3 overflow-hidden rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Товар</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">Кросс-номер</th>
                  <th className="px-3 py-2 text-left">Примечание</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {statsQ.data?.recent.map((r) => {
                  const p = r.products as { sku: string; name: string } | null;
                  return (
                    <tr key={r.id}>
                      <td className="px-3 py-2">{p?.name ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{p?.sku ?? "—"}</td>
                      <td className="px-3 py-2 font-mono">{r.cross_number}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.note ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="ghost" onClick={() => deleteRow(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
