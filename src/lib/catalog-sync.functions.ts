import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SPREADSHEET_ID = "1wqUakDJVX2-dP0gF0VuZhUC61DP5r2mJa38CKFzua6E";
const SHEET_NAME = "Запчасти";
const SHEET_GID = "1212612956";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
const OFFER_WAREHOUSE_CODE = "OFFER";
const DISCOUNT_TIERS = [5, 10, 15, 18, 20, 21] as const;

type SheetRow = (string | number | undefined)[];
type CatalogSyncRow = { line: number; brand: string; sku: string; name: string; retail: number; free: number };
type CatalogSyncChunkResult = {
  rows_processed: number;
  rows_skipped: number;
  brands_added: number;
  products_inserted: number;
  products_updated: number;
  stock_rows: number;
  offer_qty_sum: number;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "x";
}

function parseNumber(v: unknown): number {
  if (v == null) return 0;
  const s = String(v).replace(/\s|\u00A0/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseInt0(v: unknown): number {
  const n = Math.floor(parseNumber(v));
  return n > 0 ? n : 0;
}

function buildTiers(retail: number): Record<string, number> {
  if (!retail || retail <= 0) return {};
  const out: Record<string, number> = {};
  for (const t of DISCOUNT_TIERS) out[String(t)] = Math.round(retail * (1 - t / 100) * 100) / 100;
  return out;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function fetchSheetRows(): Promise<SheetRow[]> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY не настроен");
  if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY не настроен (подключите Google Sheets)");

  const encodedRange = `${encodeURIComponent(SHEET_NAME)}!A2:K`;
  const url = `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${encodedRange}?valueRenderOption=UNFORMATTED_VALUE`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY,
    },
  });
  if (resp.ok) {
    const json = (await resp.json()) as { values?: SheetRow[] };
    return json.values ?? [];
  }

  const errorText = await resp.text();
  if (resp.status !== 403) throw new Error(`Google Sheets API ${resp.status}: ${errorText.slice(0, 300)}`);

  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}&range=A2:K`;
  const csvResp = await fetch(csvUrl, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!csvResp.ok) {
    const csvText = await csvResp.text();
    throw new Error(`Google Sheets API 403; CSV fallback ${csvResp.status}: ${csvText.slice(0, 300)}`);
  }
  return parseCsv(await csvResp.text());
}

async function assertStaff(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isStaff = (roles ?? []).some((r) => r.role === "admin" || r.role === "manager");
  if (!isStaff) throw new Error("Доступ только для администраторов");
}

export const startCatalogSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: log, error } = await supabaseAdmin
      .from("sync_logs")
      .insert({
        source: "google_sheets_catalog",
        status: "running",
        message: "Старт синхронизации «под заказ» (manual, по частям)",
      })
      .select("id")
      .single();
    if (error || !log?.id) throw new Error(`sync_logs insert: ${error?.message ?? "no id"}`);

    try {
      const sheetRows = await fetchSheetRows();
      const rows = sheetRows.map((r, index) => ({
        line: index + 2,
        brand: String(r[1] ?? "").trim(),
        sku: String(r[2] ?? "").trim(),
        name: String(r[3] ?? "").trim(),
        retail: parseNumber(r[9]),
        free: parseInt0(r[10]),
      }));
      return { logId: log.id as string, rows };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabaseAdmin
        .from("sync_logs")
        .update({ status: "error", finished_at: new Date().toISOString(), message: msg })
        .eq("id", log.id);
      throw e;
    }
  });

export const processCatalogSyncChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { logId: string; rows: CatalogSyncRow[] }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result: CatalogSyncChunkResult = {
      rows_processed: data.rows.length,
      rows_skipped: 0,
      brands_added: 0,
      products_inserted: 0,
      products_updated: 0,
      stock_rows: 0,
      offer_qty_sum: 0,
    };
    const validRows = data.rows.filter((r) => r.brand && r.sku && r.name);
    result.rows_skipped = data.rows.length - validRows.length;
    if (!validRows.length) return result;

    const { data: offerWh } = await supabaseAdmin
      .from("warehouses")
      .select("id")
      .eq("code", OFFER_WAREHOUSE_CODE)
      .maybeSingle();
    if (!offerWh?.id) throw new Error(`Виртуальный склад «${OFFER_WAREHOUSE_CODE}» не найден — добавьте его в админке`);

    const brandNames = [...new Set(validRows.map((r) => r.brand))];
    const { data: existingBrands } = await supabaseAdmin.from("brands").select("id, name");
    const brandMap = new Map<string, string>((existingBrands ?? []).map((b: { id: string; name: string }) => [b.name.toLowerCase(), b.id]));
    const newBrands = brandNames
      .filter((n) => !brandMap.has(n.toLowerCase()))
      .map((n) => ({ name: n, slug: slugify(n) }));
    if (newBrands.length) {
      const { data: ins, error } = await supabaseAdmin.from("brands").insert(newBrands).select("id, name");
      if (error) throw new Error(`brands insert: ${error.message}`);
      result.brands_added = ins?.length ?? 0;
      for (const b of ins ?? []) brandMap.set(b.name.toLowerCase(), b.id);
    }

    const products = new Map<string, { brand_id: string; sku: string; name: string; retail: number; free: number }>();
    for (const r of validRows) {
      const brandId = brandMap.get(r.brand.toLowerCase());
      if (!brandId) { result.rows_skipped++; continue; }
      const key = `${brandId}::${r.sku}`;
      const prev = products.get(key);
      if (!prev) products.set(key, { brand_id: brandId, sku: r.sku, name: r.name, retail: r.retail, free: r.free });
      else {
        if (!prev.retail && r.retail) prev.retail = r.retail;
        prev.free += r.free;
      }
    }

    const skuList = [...new Set([...products.values()].map((p) => p.sku))];
    const existingMap = new Map<string, { id: string; source: string; base_price: number; price_retail: number; price_tiers: unknown }>();
    for (let i = 0; i < skuList.length; i += 300) {
      const { data: found, error } = await supabaseAdmin
        .from("products")
        .select("id, sku, brand_id, source, base_price, price_retail, price_tiers")
        .in("sku", skuList.slice(i, i + 300));
      if (error) throw new Error(`products fetch: ${error.message}`);
      for (const p of found ?? []) existingMap.set(`${p.brand_id}::${p.sku}`, p);
    }

    const priceListNameRows: Array<{ brand_id: string; sku: string; name: string }> = [];
    const productRows: Array<{
      brand_id: string; sku: string; name: string; oem: string;
      base_price: number; price_retail: number; price_tiers: unknown;
      source: string; category: null; is_original: boolean;
    }> = [];
    for (const [key, p] of products.entries()) {
      const ex = existingMap.get(key);
      const keepPriceListPrice = ex?.source === "price_list";
      if (ex) result.products_updated++;
      else result.products_inserted++;
      if (keepPriceListPrice) {
        priceListNameRows.push({ brand_id: p.brand_id, sku: p.sku, name: p.name });
        continue;
      }
      productRows.push({
        brand_id: p.brand_id,
        sku: p.sku,
        name: p.name,
        oem: p.sku,
        base_price: p.retail,
        price_retail: p.retail,
        price_tiers: buildTiers(p.retail),
        source: ex?.source ?? "on_order",
        category: null,
        is_original: true,
      });
    }

    for (let i = 0; i < priceListNameRows.length; i += 150) {
      const { error } = await supabaseAdmin
        .from("products")
        .upsert(priceListNameRows.slice(i, i + 150) as any, { onConflict: "brand_id,sku", ignoreDuplicates: false });
      if (error) throw new Error(`products name upsert: ${error.message}`);
    }

    for (let i = 0; i < productRows.length; i += 150) {
      const { error } = await supabaseAdmin
        .from("products")
        .upsert(productRows.slice(i, i + 150) as any, { onConflict: "brand_id,sku", ignoreDuplicates: false });
      if (error) throw new Error(`products upsert: ${error.message}`);
    }

    const productIdMap = new Map<string, string>();
    for (let i = 0; i < skuList.length; i += 300) {
      const { data: found, error } = await supabaseAdmin
        .from("products")
        .select("id, sku, brand_id")
        .in("sku", skuList.slice(i, i + 300));
      if (error) throw new Error(`products ids fetch: ${error.message}`);
      for (const p of found ?? []) productIdMap.set(`${p.brand_id}::${p.sku}`, p.id);
    }

    const productIds = [...new Set([...products.keys()].map((k) => productIdMap.get(k)).filter((v): v is string => Boolean(v)))];
    for (let i = 0; i < productIds.length; i += 300) {
      await supabaseAdmin.from("stock").delete().eq("warehouse_id", offerWh.id).in("product_id", productIds.slice(i, i + 300));
    }
    const stockRows = productIds.map((product_id) => ({ product_id, warehouse_id: offerWh.id, qty: 0, status: "expected" as const }));
    for (let i = 0; i < stockRows.length; i += 300) {
      const { error } = await supabaseAdmin.from("stock").upsert(stockRows.slice(i, i + 300), { onConflict: "product_id,warehouse_id" });
      if (error) throw new Error(`stock upsert: ${error.message}`);
    }
    result.stock_rows = stockRows.length;
    result.offer_qty_sum = [...products.values()].reduce((sum, p) => sum + p.free, 0);
    return result;
  });

export const finishCatalogSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { logId: string; summary: CatalogSyncChunkResult; error?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("sync_logs")
      .update({
        status: data.error ? "error" : "ok",
        finished_at: new Date().toISOString(),
        rows_processed: data.summary.rows_processed,
        rows_failed: data.summary.rows_skipped,
        message: data.error ?? `OK (manual): «под заказ» — ${data.summary.products_inserted} новых, ${data.summary.products_updated} обновлено, ${data.summary.stock_rows} позиций`,
        details: { ...data.summary, rows_total: data.summary.rows_processed, warehouses_added: 0 },
      })
      .eq("id", data.logId);
    return { ok: true };
  });

export const getCatalogSyncStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { logId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("sync_logs")
      .select("status, message, details, rows_processed, rows_failed, finished_at, started_at")
      .eq("id", data.logId)
      .maybeSingle();
    return row;
  });
