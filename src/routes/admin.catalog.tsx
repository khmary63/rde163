import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { syncCatalogFromSheet } from "@/lib/catalog-sync.functions";
import { importCatalogXlsx } from "@/lib/catalog-import.functions";
import { DISCOUNT_TIERS, type PriceTiers } from "@/lib/pricing";

export const Route = createFileRoute("/admin/catalog")({
  head: () => ({ meta: [{ title: "Прайс — Админка" }, { name: "robots", content: "noindex" }] }),
  component: CatalogUploadPage,
});

// Fixed Excel price-list layout (1-based column indices):
//  1  Бренд
//  4  Артикул
//  9  Номенклатура
// 15  РРЦ со скидкой 5%
// 16  РРЦ со скидкой 10%
// 17  РРЦ со скидкой 15%
// 18  РРЦ РДЭ (retail)
// 19  РРЦ со скидкой 20%
// 20  РРЦ со скидкой 21%
// 21  РРЦ со скидкой 18%
// 22..29  Остатки на 8 складах (см. WAREHOUSE_COL_TO_CODE)
const COL = {
  brand: 0,
  sku: 3,
  name: 8,
  tier5: 14,
  tier10: 15,
  tier15: 16,
  retail: 17,
  tier20: 18,
  tier21: 19,
  tier18: 20,
  whStart: 21, // 22..29
  whEnd: 28,
} as const;

const TIER_COLS: Array<{ tier: number; col: number }> = [
  { tier: 5, col: COL.tier5 },
  { tier: 10, col: COL.tier10 },
  { tier: 15, col: COL.tier15 },
  { tier: 18, col: COL.tier18 },
  { tier: 20, col: COL.tier20 },
  { tier: 21, col: COL.tier21 },
];

// Map exact header text → warehouse code in DB.
const WH_HEADER_TO_CODE: Record<string, string> = {
  "агропарк рдэ(самара)": "AGROPARK",
  "агропарк рдэ (самара)": "AGROPARK",
  "рдэ самара (адресное хранение)": "SAMARA_ADDR",
  "склад рдэ екатеринбург": "EKB",
  "склад рдэ краснодар": "KRD",
  "склад рдэ москва": "MSK",
  "склад рдэ новосибирск": "NSK",
  "склад рдэ санкт-петербург": "SPB",
  "склад рдэ челябинск": "CHEL",
};

const HEADER_ROW = 3; // 1-based
const DATA_START_ROW = 8; // 1-based

type ParsedRow = {
  line: number;
  sku: string;
  name: string;
  brand: string;
  retail: number;
  price_tiers: PriceTiers;
  stocks: Record<string, number>; // warehouse code -> qty
};

function normNum(v: unknown): number {
  if (v == null || v === "") return 0;
  const s = String(v).replace(/\s|\u00A0/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function normInt(v: unknown): number {
  const n = Math.floor(normNum(v));
  return n > 0 ? n : 0;
}

function CatalogUploadPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{
    rows: ParsedRow[];
    errors: string[];
    whCodesFound: string[];
    unknownWh: string[];
  } | null>(null);
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
        supabase.from("sync_logs").select("*").eq("source", "catalog_xlsx").order("started_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return { products: products ?? 0, stockRows: stockRows ?? 0, lastLog: lastLogRes.data };
    },
  });

  const whByCode = useMemo(
    () => new Map((warehousesQ.data ?? []).map((w) => [w.code, w.id])),
    [warehousesQ.data],
  );

  const parseWorkbook = (aoa: unknown[][]) => {
    const errors: string[] = [];
    const headerRow = (aoa[HEADER_ROW - 1] ?? []) as unknown[];
    // Build warehouse column index map (22..29) by header name
    const whColToCode = new Map<number, string>();
    const unknownWh: string[] = [];
    for (let c = COL.whStart; c <= COL.whEnd; c++) {
      const h = String(headerRow[c] ?? "").trim().toLowerCase();
      if (!h) continue;
      const code = WH_HEADER_TO_CODE[h];
      if (code) whColToCode.set(c, code);
      else unknownWh.push(String(headerRow[c] ?? ""));
    }
    const whCodesFound = [...new Set(whColToCode.values())];

    const rows: ParsedRow[] = [];
    for (let r = DATA_START_ROW - 1; r < aoa.length; r++) {
      const row = aoa[r] as unknown[];
      if (!row) continue;
      const brand = String(row[COL.brand] ?? "").trim();
      const sku = String(row[COL.sku] ?? "").trim();
      const name = String(row[COL.name] ?? "").trim();
      if (!brand && !sku && !name) continue; // blank row
      if (!brand || !sku || !name) {
        errors.push(`Строка ${r + 1}: пустой бренд / артикул / наименование`);
        continue;
      }
      const retail = normNum(row[COL.retail]);
      const price_tiers: PriceTiers = {};
      for (const { tier, col } of TIER_COLS) {
        const v = normNum(row[col]);
        if (v > 0) price_tiers[String(tier) as `${(typeof DISCOUNT_TIERS)[number]}`] = v;
      }
      const stocks: Record<string, number> = {};
      whColToCode.forEach((code, col) => {
        const q = normInt(row[col]);
        if (q > 0) stocks[code] = q;
      });
      rows.push({ line: r + 1, sku, name, brand, retail, price_tiers, stocks });
    }
    return { rows, errors, whCodesFound, unknownWh: [...new Set(unknownWh)] };
  };

  const handleFile = async (file: File) => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      toast.error("Принимаются только .xlsx / .xls");
      return;
    }
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) {
      toast.error("Не удалось прочитать первый лист Excel");
      return;
    }
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: "" });
    if (aoa.length < DATA_START_ROW) {
      toast.error("Файл слишком короткий — нет строк данных");
      return;
    }
    const result = parseWorkbook(aoa);
    if (result.rows.length === 0) {
      toast.error("Не найдено ни одной валидной строки данных");
    }
    setParsed(result);
  };

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0) return;
    setBusy(true);
    setProgress({ done: 0, total: parsed.rows.length });
    try {
      const result = await importCatalogXlsx({
        data: {
          rows: parsed.rows.map((r) => ({
            sku: r.sku,
            name: r.name,
            brand: r.brand,
            retail: r.retail,
            price_tiers: r.price_tiers,
            stocks: r.stocks,
          })),
          whCodesFound: parsed.whCodesFound,
        },
      });
      toast.success("Импорт завершён", {
        description: `Товаров: ${result.processed}, остатков: ${result.stockRows}`,
      });
      setParsed(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["catalog-stats"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Ошибка импорта", { description: msg });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight">Прайс / каталог</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            В базе: <strong>{statsQ.data?.products ?? 0}</strong> товаров, <strong>{statsQ.data?.stockRows ?? 0}</strong> остатков по складам.{" "}
            {statsQ.data?.lastLog && (
              <>Последняя загрузка прайса: {new Date(statsQ.data.lastLog.started_at).toLocaleString("ru-RU")} — {statsQ.data.lastLog.status}.</>
            )}
          </p>
        </div>
      </div>

      <GoogleSheetsSyncCard onDone={() => { qc.invalidateQueries({ queryKey: ["catalog-stats"] }); qc.invalidateQueries({ queryKey: ["warehouses-admin"] }); }} />

      {/* Spec */}
      <Card className="p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Формат файла прайса</h2>
        <p className="mt-2 text-sm">
          Принимается стандартный Excel-прайс «по всем складам» (<strong>.xlsx</strong>, .xls). Заголовки — строка 3, данные — с строки 8.
          Структура файла фиксированная; колонки определяются по позиции.
        </p>

        <div className="mt-3 overflow-hidden rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">№ колонки</th>
                <th className="px-3 py-2 text-left">Заголовок</th>
                <th className="px-3 py-2 text-left">Назначение</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              <SpecRow n="1" h="Ценовая группа / Бренд" d="Бренд товара" />
              <SpecRow n="4" h="Артикул" d="Артикул" />
              <SpecRow n="9" h="Номенклатура" d="Наименование" />
              <SpecRow n="15" h="РРЦ со скидкой 5%" d="Цена для покупателей со скидкой 5%" />
              <SpecRow n="16" h="РРЦ со скидкой 10%" d="Скидка 10%" />
              <SpecRow n="17" h="РРЦ со скидкой 15%" d="Скидка 15%" />
              <SpecRow n="18" h="РРЦ РДЭ" d="Базовая розничная цена (без скидки)" highlight />
              <SpecRow n="19" h="РРЦ со скидкой 20%" d="Скидка 20%" />
              <SpecRow n="20" h="РРЦ со скидкой 21%" d="Скидка 21%" />
              <SpecRow n="21" h="РРЦ со скидкой 18%" d="Скидка 18%" />
              <SpecRow n="22–29" h="Остатки по 8 складам" d="Маппинг — по точному названию заголовка склада" />
            </tbody>
          </table>
        </div>

        <h3 className="mt-5 font-display text-sm uppercase tracking-wider text-muted-foreground">Склады</h3>
        <div className="mt-2 overflow-hidden rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Заголовок в Excel</th>
                <th className="px-3 py-2 text-left">Код в БД</th>
                <th className="px-3 py-2 text-left">Склад</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(WH_HEADER_TO_CODE)
                // dedupe duplicate "агропарк" header variants
                .filter(([, c], i, arr) => arr.findIndex(([, c2]) => c2 === c) === i)
                .map(([header, code]) => {
                  const wh = warehousesQ.data?.find((w) => w.code === code);
                  return (
                    <tr key={header}>
                      <td className="px-3 py-2">{header}</td>
                      <td className="px-3 py-2 font-mono">{code}</td>
                      <td className="px-3 py-2">{wh?.name ?? "—"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded border border-brand/30 bg-brand/5 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Поведение импорта:</strong> товары upsert‑ятся по паре (бренд, артикул).
          Базовая цена и все тиеры скидок (5/10/15/18/20/21%) обновляются из файла.
          Остатки по 8 реальным складам полностью перезаписываются. Позиции «Под заказ» из Google Sheets не затрагиваются.
        </div>
      </Card>

      {/* Upload */}
      <Card className="p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Загрузка</h2>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-surface/50 px-6 py-10 hover:border-brand">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm">
            <div className="font-medium">Выберите Excel-прайс (.xlsx, .xls)</div>
            <div className="text-xs text-muted-foreground">Структура файла фиксирована — см. описание выше.</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
                <CheckCircle2 className="h-3.5 w-3.5" /> Складов: {parsed.whCodesFound.length > 0 ? parsed.whCodesFound.join(", ") : "не найдены"}
              </span>
              {parsed.unknownWh.length > 0 && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> Неопознанные склады: {parsed.unknownWh.join(", ")}
                  </span>
                </>
              )}
              {parsed.errors.length > 0 && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> Пропущено строк: <strong>{parsed.errors.length}</strong>
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
                    <th className="px-3 py-2 text-left">Артикул</th>
                    <th className="px-3 py-2 text-left">Бренд</th>
                    <th className="px-3 py-2 text-left">Наименование</th>
                    <th className="px-3 py-2 text-right">РРЦ</th>
                    <th className="px-3 py-2 text-right">Тиеры</th>
                    <th className="px-3 py-2 text-right">Всего шт</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsed.rows.slice(0, 10).map((r) => (
                    <tr key={r.line}>
                      <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                      <td className="px-3 py-2">{r.brand}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2 text-right">{r.retail.toLocaleString("ru-RU")}</td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                        {Object.keys(r.price_tiers).length} / 6
                      </td>
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
      setResult(r as unknown as Record<string, number>);
      toast.success("Синхронизация «под заказ» выполнена", {
        description: `Новых: ${r.products_inserted}, обновлено: ${r.products_updated}, позиций: ${r.stock_rows}`,
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
          <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Позиции «Под заказ» (Google Sheets)</h2>
          <p className="mt-2 text-sm">
            Из таблицы{" "}
            <a
              href="https://docs.google.com/spreadsheets/d/1wqUakDJVX2-dP0gF0VuZhUC61DP5r2mJa38CKFzua6E/edit?gid=1212612956"
              target="_blank" rel="noreferrer"
              className="underline"
            >«Ожидаемые поступления»</a>, лист «Запчасти», подгружаются позиции, которых нет на складах.
            Их розничная цена — колонка J («Цена, РРЦ»), скидки считаются автоматически по формуле от РРЦ.
            Статус — всегда «Под заказ».
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Не затрагивает товары, загруженные через Excel-прайс (их цены и остатки остаются неизменными).
          </p>
          {result && (
            <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
              <div>Строк прочитано: <strong>{result.rows_total}</strong>, пропущено: {result.rows_skipped}</div>
              <div>Новых брендов: {result.brands_added}</div>
              <div>Товаров добавлено: <strong>{result.products_inserted}</strong>, обновлено: {result.products_updated}</div>
              <div>Позиций «под заказ»: <strong>{result.stock_rows}</strong></div>
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

function SpecRow({ n, h, d, highlight }: { n: string; h: string; d: string; highlight?: boolean }) {
  return (
    <tr className={highlight ? "bg-brand/5" : undefined}>
      <td className="px-3 py-2 font-mono">{n}</td>
      <td className="px-3 py-2">{highlight ? <Badge>{h}</Badge> : h}</td>
      <td className="px-3 py-2 text-muted-foreground">{d}</td>
    </tr>
  );
}
