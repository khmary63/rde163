import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Download, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { syncCatalogFromSheet } from "@/lib/catalog-sync.functions";


export const Route = createFileRoute("/admin/catalog")({
  head: () => ({ meta: [{ title: "Прайс — Админка" }, { name: "robots", content: "noindex" }] }),
  component: CatalogUploadPage,
});

type ParsedRow = {
  line: number;
  sku: string;
  name: string;
  brand: string;
  is_original: boolean;
  base_price: number;
  oem: string | null;
  category: string | null;
  description: string | null;
  stocks: Record<string, number>; // warehouse code -> qty
};

function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === delim && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function normNum(v: string): number {
  if (!v) return 0;
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return isFinite(n) ? n : 0;
}

function CatalogUploadPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ rows: ParsedRow[]; errors: string[]; whCodes: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const warehousesQ = useQuery({
    queryKey: ["warehouses-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("warehouses").select("id, code, name").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const statsQ = useQuery({
    queryKey: ["catalog-stats"],
    queryFn: async () => {
      const [{ count: products }, { count: stockRows }, lastLogRes] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("stock").select("*", { count: "exact", head: true }),
        supabase.from("sync_logs").select("*").eq("source", "catalog_csv").order("started_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return { products: products ?? 0, stockRows: stockRows ?? 0, lastLog: lastLogRes.data };
    },
  });

  const warehouseCodes = useMemo(() => (warehousesQ.data ?? []).map((w) => w.code), [warehousesQ.data]);

  const parseRows = (header: string[], dataRows: string[][]) => {
    const errors: string[] = [];
    const idx = (names: string[]) =>
      header.findIndex((h) => names.includes(h.toLowerCase().replace(/^\ufeff/, "").trim()));

    const skuI = idx(["sku", "артикул"]);
    const nameI = idx(["name", "наименование", "название"]);
    const brandI = idx(["brand", "бренд", "производитель"]);
    const priceI = idx(["price", "base_price", "цена"]);
    const origI = idx(["is_original", "original", "оригинал", "тип"]);
    const oemI = idx(["oem", "oem_number"]);
    const catI = idx(["category", "категория"]);
    const descI = idx(["description", "описание"]);

    const lowerHeader = header.map((h) => h.toLowerCase().replace(/^\ufeff/, "").trim());
    const whIndexMap = new Map<string, number>();
    for (const code of warehouseCodes) {
      const i = lowerHeader.findIndex((h) => h === `qty_${code}` || h === code);
      if (i >= 0) whIndexMap.set(code, i);
    }

    if (skuI === -1 || nameI === -1 || brandI === -1 || priceI === -1) {
      toast.error("Не найдены обязательные колонки", { description: "Нужны: sku, name, brand, price" });
      return null;
    }

    const rows: ParsedRow[] = [];
    for (let li = 0; li < dataRows.length; li++) {
      const cols = dataRows[li];
      const sku = (cols[skuI] ?? "").toString().trim();
      const name = (cols[nameI] ?? "").toString().trim();
      const brand = (cols[brandI] ?? "").toString().trim();
      const price = normNum((cols[priceI] ?? "0").toString());
      if (!sku || !name || !brand) {
        errors.push(`Строка ${li + 2}: пустой sku / name / brand`);
        continue;
      }
      const origRaw = origI >= 0 ? (cols[origI] ?? "").toString().trim().toLowerCase() : "original";
      const isOriginal = !["analog", "аналог", "false", "0", "no", "нет"].includes(origRaw);
      const stocks: Record<string, number> = {};
      whIndexMap.forEach((colIdx, code) => {
        const q = normNum((cols[colIdx] ?? "0").toString());
        if (q > 0) stocks[code] = Math.floor(q);
      });
      rows.push({
        line: li + 2,
        sku,
        name,
        brand,
        is_original: isOriginal,
        base_price: price,
        oem: oemI >= 0 ? (cols[oemI] ?? "").toString().trim() || null : null,
        category: catI >= 0 ? (cols[catI] ?? "").toString().trim() || null : null,
        description: descI >= 0 ? (cols[descI] ?? "").toString().trim() || null : null,
        stocks,
      });
    }

    return { rows, errors, whCodes: Array.from(whIndexMap.keys()) };
  };

  const handleFile = async (file: File) => {
    const lower = file.name.toLowerCase();
    const isExcel = lower.endsWith(".xlsx") || lower.endsWith(".xls");

    let header: string[] = [];
    let dataRows: string[][] = [];

    if (isExcel) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        toast.error("Не удалось прочитать первый лист Excel");
        return;
      }
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: "" });
      if (aoa.length < 2) {
        toast.error("Файл пустой или только заголовок");
        return;
      }
      header = (aoa[0] as unknown[]).map((c) => (c ?? "").toString());
      dataRows = aoa.slice(1).map((row) => (row as unknown[]).map((c) => (c ?? "").toString()));
    } else {
      const text = await file.text();
      const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
      const delim = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        toast.error("Файл пустой или только заголовок");
        return;
      }
      header = splitLine(lines[0], delim);
      dataRows = lines.slice(1).map((l) => splitLine(l, delim));
    }

    const result = parseRows(header, dataRows);
    if (result) setParsed(result);
  };

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0 || !warehousesQ.data) return;
    setBusy(true);
    setProgress({ done: 0, total: parsed.rows.length });
    const logStart = await supabase.from("sync_logs").insert({
      source: "catalog_csv",
      status: "running",
      message: `Импорт ${parsed.rows.length} строк`,
    }).select("id").single();
    const logId = logStart.data?.id;

    try {
      // 1. Upsert brands (unique by slug)
      const brandNames = Array.from(new Set(parsed.rows.map((r) => r.brand)));
      const brandRows = brandNames.map((n) => ({
        name: n,
        slug: n.toLowerCase().replace(/[^a-z0-9а-я]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "brand",
      }));
      const { error: brandErr } = await supabase
        .from("brands")
        .upsert(brandRows, { onConflict: "slug", ignoreDuplicates: true });
      if (brandErr) throw new Error(`Бренды: ${brandErr.message}`);
      const { data: brandsAll } = await supabase.from("brands").select("id, name").in("name", brandNames);
      const brandMap = new Map((brandsAll ?? []).map((b) => [b.name, b.id]));

      // 2. Upsert products by sku
      const productRows = parsed.rows.map((r) => ({
        sku: r.sku,
        name: r.name,
        brand_id: brandMap.get(r.brand) ?? null,
        is_original: r.is_original,
        base_price: r.base_price,
        oem: r.oem,
        category: r.category,
        description: r.description,
      }));

      let processed = 0;
      let failed = 0;
      for (let i = 0; i < productRows.length; i += 500) {
        const chunk = productRows.slice(i, i + 500);
        const { error } = await supabase.from("products").upsert(chunk, { onConflict: "sku" });
        if (error) {
          failed += chunk.length;
        } else {
          processed += chunk.length;
        }
        setProgress({ done: i + chunk.length, total: productRows.length });
      }

      // 3. Get product ids
      const allSkus = parsed.rows.map((r) => r.sku);
      const productMap = new Map<string, string>();
      for (let i = 0; i < allSkus.length; i += 500) {
        const { data } = await supabase.from("products").select("id, sku").in("sku", allSkus.slice(i, i + 500));
        (data ?? []).forEach((p) => productMap.set(p.sku, p.id));
      }

      // 4. Upsert stock
      const whByCode = new Map(warehousesQ.data.map((w) => [w.code, w.id]));
      const stockRows: Array<{ product_id: string; warehouse_id: string; qty: number; status: "in_stock" | "out" }> = [];
      for (const r of parsed.rows) {
        const pid = productMap.get(r.sku);
        if (!pid) continue;
        for (const [code, qty] of Object.entries(r.stocks)) {
          const wid = whByCode.get(code);
          if (!wid) continue;
          stockRows.push({ product_id: pid, warehouse_id: wid, qty, status: qty > 0 ? "in_stock" : "out" });
        }
      }
      for (let i = 0; i < stockRows.length; i += 500) {
        const chunk = stockRows.slice(i, i + 500);
        await supabase.from("stock").upsert(chunk, { onConflict: "product_id,warehouse_id" });
      }

      await supabase.from("sync_logs").update({
        status: failed > 0 ? "partial" : "success",
        rows_processed: processed,
        rows_failed: failed,
        finished_at: new Date().toISOString(),
        message: `Товаров: ${processed}, строк остатков: ${stockRows.length}`,
      }).eq("id", logId!);

      toast.success(`Импорт завершён`, { description: `Товаров: ${processed}, остатков: ${stockRows.length}` });
      setParsed(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["catalog-stats"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Ошибка импорта", { description: msg });
      if (logId) {
        await supabase.from("sync_logs").update({
          status: "error",
          finished_at: new Date().toISOString(),
          message: msg,
        }).eq("id", logId);
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const buildTemplateRows = () => {
    const header = ["sku", "name", "brand", "is_original", "price", "oem", "category", "description", ...warehouseCodes.map((c) => `qty_${c}`)];
    const samples = [
      ["VG1540080110", "Фильтр топливный WD615", "CNHTC", "original", "1850", "VG1540080110", "Фильтры", "Оригинал. фильтр для двигателя WD615", ...warehouseCodes.map((c) => (c === "msk" ? "12" : c === "samara_addr" ? "8" : "0"))],
      ["WG9112550110", "Фильтр воздушный HOWO", "HOWO", "original", "2400", "WG9112550110", "Фильтры", "", ...warehouseCodes.map(() => "5")],
      ["MANN-WK9165", "Фильтр аналог Mann WK9165", "Mann", "analog", "1200", "", "Фильтры", "Аналог", ...warehouseCodes.map((_c, i) => (i < 2 ? "3" : "0"))],
    ];
    return { header, samples };
  };

  const downloadTemplateCsv = () => {
    const { header, samples } = buildTemplateRows();
    const csv = [header.join(","), ...samples.map((r) => r.join(","))].join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "price-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplateXlsx = () => {
    const { header, samples } = buildTemplateRows();
    const aoa = [header, ...samples];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Прайс");
    XLSX.writeFile(wb, "price-template.xlsx");
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight">Прайс / каталог</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            В базе: <strong>{statsQ.data?.products ?? 0}</strong> товаров, <strong>{statsQ.data?.stockRows ?? 0}</strong> остатков по складам.{" "}
            {statsQ.data?.lastLog && (
              <>Последняя загрузка: {new Date(statsQ.data.lastLog.started_at).toLocaleString("ru-RU")} — {statsQ.data.lastLog.status}.</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplateXlsx} className="gap-1.5" disabled={!warehousesQ.data}>
            <Download className="h-3.5 w-3.5" /> Шаблон .xlsx
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplateCsv} className="gap-1.5" disabled={!warehousesQ.data}>
            <Download className="h-3.5 w-3.5" /> Шаблон .csv
          </Button>
        </div>
      </div>

      <GoogleSheetsSyncCard onDone={() => { qc.invalidateQueries({ queryKey: ["catalog-stats"] }); qc.invalidateQueries({ queryKey: ["warehouses-admin"] }); }} />

      {/* Spec */}

      <Card className="p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Формат файла</h2>
        <p className="mt-2 text-sm">Принимаются файлы <strong>Excel (.xlsx, .xls)</strong> и <strong>CSV</strong> (UTF-8, разделитель — запятая или точка с запятой). Первая строка — заголовки.</p>

        <div className="mt-3 overflow-hidden rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Колонка</th>
                <th className="px-3 py-2 text-left">Обяз.</th>
                <th className="px-3 py-2 text-left">Описание</th>
                <th className="px-3 py-2 text-left">Пример</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              <Row col="sku" required label="да" desc="Артикул товара. Уникален. По нему обновляются существующие позиции." ex="VG1540080110" />
              <Row col="name" required label="да" desc="Название товара." ex="Фильтр топливный WD615" />
              <Row col="brand" required label="да" desc="Бренд. Новые бренды создаются автоматически." ex="CNHTC" />
              <Row col="price" required label="да" desc="Базовая цена в рублях. Допускается «1 850,00» или «1850.00»." ex="1850" />
              <Row col="is_original" required={false} label="нет" desc='"original" / "analog" (по умолчанию — original). Также: "аналог", "true/false".' ex="original" />
              <Row col="oem" required={false} label="нет" desc="OEM-номер производителя техники." ex="VG1540080110" />
              <Row col="category" required={false} label="нет" desc="Категория." ex="Фильтры" />
              <Row col="description" required={false} label="нет" desc="Краткое описание." ex="Оригинал для WD615" />
            </tbody>
          </table>
        </div>

        <h3 className="mt-5 font-display text-sm uppercase tracking-wider text-muted-foreground">Колонки остатков по складам</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          По одной колонке на склад: <code>qty_&lt;код_склада&gt;</code> (или просто <code>&lt;код&gt;</code>). Количество — целое число, 0 или пусто = «не на складе».
        </p>
        <div className="mt-2 overflow-hidden rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Код склада</th>
                <th className="px-3 py-2 text-left">Колонка в CSV</th>
                <th className="px-3 py-2 text-left">Склад</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {warehousesQ.data?.map((w) => (
                <tr key={w.id}>
                  <td className="px-3 py-2 font-mono">{w.code}</td>
                  <td className="px-3 py-2 font-mono">qty_{w.code}</td>
                  <td className="px-3 py-2">{w.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded border border-brand/30 bg-brand/5 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Поведение импорта:</strong> существующие товары обновляются по <code>sku</code> (цена, наличие, описание). Новые — создаются.
          Остатки полностью перезаписываются для складов, указанных в файле; для не указанных в файле — остаются без изменений.
        </div>
      </Card>

      {/* Upload */}
      <Card className="p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Загрузка</h2>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-surface/50 px-6 py-10 hover:border-brand">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm">
            <div className="font-medium">Выберите файл прайса (.xlsx, .xls или .csv)</div>
            <div className="text-xs text-muted-foreground">Рекомендуется до 50 000 строк за раз.</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
              <span>Строк: <strong>{parsed.rows.length}</strong></span>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Колонки складов: {parsed.whCodes.length > 0 ? parsed.whCodes.join(", ") : "не найдены"}
              </span>
              {parsed.errors.length > 0 && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> Предупреждений: <strong>{parsed.errors.length}</strong>
                  </span>
                </>
              )}
            </div>

            {parsed.errors.length > 0 && (
              <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                <ul className="max-h-24 list-disc space-y-0.5 overflow-y-auto pl-5 text-amber-700/80">
                  {parsed.errors.slice(0, 20).map((e, i) => (<li key={i}>{e}</li>))}
                </ul>
              </div>
            )}

            <div className="overflow-hidden rounded border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Название</th>
                    <th className="px-3 py-2 text-left">Бренд</th>
                    <th className="px-3 py-2 text-right">Цена</th>
                    <th className="px-3 py-2 text-left">Тип</th>
                    <th className="px-3 py-2 text-right">Всего шт</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsed.rows.slice(0, 10).map((r) => (
                    <tr key={r.line}>
                      <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.brand}</td>
                      <td className="px-3 py-2 text-right">{r.base_price.toLocaleString("ru-RU")}</td>
                      <td className="px-3 py-2">{r.is_original ? <Badge variant="default">ориг.</Badge> : <Badge variant="outline">аналог</Badge>}</td>
                      <td className="px-3 py-2 text-right">{Object.values(r.stocks).reduce((s, n) => s + n, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.rows.length > 10 && (
                <div className="border-t border-border bg-surface/30 px-3 py-2 text-xs text-muted-foreground">
                  …и ещё {parsed.rows.length - 10} строк
                </div>
              )}
            </div>

            {progress && (
              <div className="text-xs text-muted-foreground">
                Загрузка: {progress.done} из {progress.total}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={busy || parsed.rows.length === 0}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Импортировать {parsed.rows.length} товаров
              </Button>
              <Button variant="outline" onClick={() => { setParsed(null); if (fileRef.current) fileRef.current.value = ""; }}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function GoogleSheetsSyncCard({ onDone }: { onDone: () => void }) {
  const sync = useServerFn(syncCatalogFromSheet);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | Record<string, number>>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await sync();
      setResult(r as Record<string, number>);
      toast.success("Синхронизация выполнена", {
        description: `Товаров: +${r.products_inserted}, обновлено: ${r.products_updated}, остатков: ${r.stock_rows}`,
      });
      onDone();
    } catch (e) {
      toast.error("Ошибка синхронизации", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 border-primary/40">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Синхронизация с Google Sheets</h2>
          <p className="mt-2 text-sm">
            Каталог и остатки подтягиваются из таблицы{" "}
            <a
              href="https://docs.google.com/spreadsheets/d/1wqUakDJVX2-dP0gF0VuZhUC61DP5r2mJa38CKFzua6E/edit?gid=1212612956"
              target="_blank" rel="noreferrer"
              className="underline"
            >«Ожидаемые поступления Контейнеры»</a>, лист «Запчасти».
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Колонки: B — Производитель, C — артикул, D — наименование, F — локация (склад), G — статус, J — цена, K — свободно. Существующие товары обновляются, остатки полностью пересчитываются.
          </p>
          {result && (
            <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
              <div>Строк прочитано: <strong>{result.rows_total}</strong>, пропущено: {result.rows_skipped}</div>
              <div>Новых брендов: {result.brands_added}, новых складов: {result.warehouses_added}</div>
              <div>Товаров добавлено: <strong>{result.products_inserted}</strong>, обновлено: {result.products_updated}</div>
              <div>Записей об остатках: <strong>{result.stock_rows}</strong></div>
            </div>
          )}
        </div>
        <Button onClick={run} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {busy ? "Синхронизация…" : "Синхронизировать сейчас"}
        </Button>
      </div>
    </Card>
  );
}


function Row({ col, required, label, desc, ex }: { col: string; required: boolean; label: string; desc: string; ex: string }) {
  return (
    <tr>
      <td className="px-3 py-2 font-mono">{col}</td>
      <td className="px-3 py-2">{required ? <Badge variant="default">{label}</Badge> : <Badge variant="secondary">{label}</Badge>}</td>
      <td className="px-3 py-2">{desc}</td>
      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{ex}</td>
    </tr>
  );
}
