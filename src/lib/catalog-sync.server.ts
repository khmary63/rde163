import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SPREADSHEET_ID = "1wqUakDJVX2-dP0gF0VuZhUC61DP5r2mJa38CKFzua6E";
const SHEET_NAME = "Запчасти";
const RANGE = `${SHEET_NAME}!A2:K`;
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

type Row = (string | undefined)[];

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

export interface CatalogSyncSummary {
  rows_total: number;
  rows_skipped: number;
  brands_added: number;
  warehouses_added: number;
  products_inserted: number;
  products_updated: number;
  stock_rows: number;
}

/** Run the Google Sheets → catalog sync. Uses admin client; caller is responsible for auth. */
export async function runCatalogSync(trigger: "manual" | "cron" = "manual"): Promise<CatalogSyncSummary> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY не настроен");
  if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY не настроен (подключите Google Sheets)");

  const { data: logIns } = await supabaseAdmin
    .from("sync_logs")
    .insert({
      source: "google_sheets_catalog",
      status: "running",
      message: `Старт синхронизации (${trigger})`,
    })
    .select("id")
    .single();
  const logId = logIns?.id;

  try {
    const url = `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?valueRenderOption=UNFORMATTED_VALUE`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY,
      },
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Google Sheets API ${resp.status}: ${t.slice(0, 300)}`);
    }
    const json = (await resp.json()) as { values?: Row[] };
    const rows = json.values ?? [];

    // ---- 1. Brands -----------------------------------------------------
    const brandNames = new Set<string>();
    for (const r of rows) {
      const b = String(r[1] ?? "").trim();
      if (b) brandNames.add(b);
    }
    const { data: existingBrands } = await supabaseAdmin.from("brands").select("id, name");
    const brandMap = new Map<string, string>(
      (existingBrands ?? []).map((b) => [b.name.toLowerCase(), b.id]),
    );
    const newBrands = [...brandNames]
      .filter((n) => !brandMap.has(n.toLowerCase()))
      .map((n) => ({ name: n, slug: slugify(n) }));
    if (newBrands.length) {
      const { data: ins, error } = await supabaseAdmin.from("brands").insert(newBrands).select("id, name");
      if (error) throw new Error(`brands insert: ${error.message}`);
      for (const b of ins ?? []) brandMap.set(b.name.toLowerCase(), b.id);
    }

    // ---- 2. Warehouses -------------------------------------------------
    const whNames = new Set<string>();
    for (const r of rows) {
      const w = String(r[5] ?? "").trim();
      if (w) whNames.add(w);
    }
    const { data: existingWh } = await supabaseAdmin.from("warehouses").select("id, name, code");
    const whMap = new Map<string, string>(
      (existingWh ?? []).map((w) => [w.name.toLowerCase(), w.id]),
    );
    const newWh = [...whNames]
      .filter((n) => !whMap.has(n.toLowerCase()))
      .map((n, i) => ({
        name: n,
        code: `gs-${slugify(n)}-${Date.now().toString(36).slice(-4)}-${i}`,
        is_active: true,
      }));
    if (newWh.length) {
      const { data: ins, error } = await supabaseAdmin.from("warehouses").insert(newWh).select("id, name");
      if (error) throw new Error(`warehouses insert: ${error.message}`);
      for (const w of ins ?? []) whMap.set(w.name.toLowerCase(), w.id);
    }

    // ---- 3. Aggregate --------------------------------------------------
    const products = new Map<string, {
      brand_id: string; sku: string; name: string; oem: string;
      base_price: number; category: string | null;
    }>();
    const stockAgg = new Map<string, number>();
    let skipped = 0;

    for (const r of rows) {
      const brand = String(r[1] ?? "").trim();
      const sku = String(r[2] ?? "").trim();
      const name = String(r[3] ?? "").trim();
      const whName = String(r[5] ?? "").trim();
      const status = String(r[6] ?? "").trim() || null;
      const price = parseNumber(r[9]);
      const free = parseInt0(r[10]);
      if (!brand || !sku || !name) { skipped++; continue; }
      const brandId = brandMap.get(brand.toLowerCase());
      if (!brandId) { skipped++; continue; }
      const key = `${brandId}::${sku}`;
      const prev = products.get(key);
      if (!prev) {
        products.set(key, { brand_id: brandId, sku, name, oem: sku, base_price: price, category: status });
      } else if (!prev.base_price && price) {
        prev.base_price = price;
      }
      if (whName && free > 0) {
        const whId = whMap.get(whName.toLowerCase());
        if (whId) {
          const k2 = `${key}::${whId}`;
          stockAgg.set(k2, (stockAgg.get(k2) ?? 0) + free);
        }
      }
    }

    // ---- 4. Products upsert -------------------------------------------
    const skuList = [...new Set([...products.values()].map((p) => p.sku))];
    const { data: existingProds } = await supabaseAdmin
      .from("products")
      .select("id, sku, brand_id, base_price, name")
      .in("sku", skuList);
    const prodIdMap = new Map<string, string>();
    const toInsert: Array<{ brand_id: string; sku: string; name: string; oem: string; base_price: number; category: string | null; is_original: boolean }> = [];
    const toUpdate: Array<{ id: string; name: string; base_price: number; category: string | null }> = [];

    const existingMap = new Map<string, { id: string; base_price: number }>();
    for (const p of existingProds ?? []) {
      existingMap.set(`${p.brand_id}::${p.sku}`, { id: p.id, base_price: Number(p.base_price) });
    }
    for (const [key, p] of products) {
      const ex = existingMap.get(key);
      if (ex) {
        prodIdMap.set(key, ex.id);
        toUpdate.push({ id: ex.id, name: p.name, base_price: p.base_price || ex.base_price, category: p.category });
      } else {
        toInsert.push({ ...p, is_original: true });
      }
    }

    let inserted = 0;
    const CHUNK = 200;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const slice = toInsert.slice(i, i + CHUNK);
      const { data, error } = await supabaseAdmin.from("products").insert(slice).select("id, sku, brand_id");
      if (error) throw new Error(`products insert: ${error.message}`);
      for (const p of data ?? []) {
        prodIdMap.set(`${p.brand_id}::${p.sku}`, p.id);
        inserted++;
      }
    }

    let updated = 0;
    for (const u of toUpdate) {
      const { error } = await supabaseAdmin
        .from("products")
        .update({ name: u.name, base_price: u.base_price, category: u.category })
        .eq("id", u.id);
      if (!error) updated++;
    }

    // ---- 5. Stock replace ---------------------------------------------
    const allProductIds = [...prodIdMap.values()];
    let stockReplaced = 0;
    if (allProductIds.length) {
      for (let i = 0; i < allProductIds.length; i += 200) {
        const slice = allProductIds.slice(i, i + 200);
        await supabaseAdmin.from("stock").delete().in("product_id", slice);
      }
      const stockRows: Array<{ product_id: string; warehouse_id: string; qty: number; status: "in_stock" | "out" | "expected" }> = [];
      for (const [k, qty] of stockAgg) {
        const [brandId, sku, whId] = k.split("::");
        const pid = prodIdMap.get(`${brandId}::${sku}`);
        if (!pid) continue;
        stockRows.push({ product_id: pid, warehouse_id: whId, qty, status: qty > 0 ? "in_stock" : "out" });
      }
      for (let i = 0; i < stockRows.length; i += CHUNK) {
        const slice = stockRows.slice(i, i + CHUNK);
        const { error } = await supabaseAdmin.from("stock").insert(slice);
        if (error) throw new Error(`stock insert: ${error.message}`);
        stockReplaced += slice.length;
      }
    }

    const summary: CatalogSyncSummary = {
      rows_total: rows.length,
      rows_skipped: skipped,
      brands_added: newBrands.length,
      warehouses_added: newWh.length,
      products_inserted: inserted,
      products_updated: updated,
      stock_rows: stockReplaced,
    };

    if (logId) {
      await supabaseAdmin
        .from("sync_logs")
        .update({
          status: "ok",
          finished_at: new Date().toISOString(),
          rows_processed: rows.length,
          rows_failed: skipped,
          message: `OK (${trigger}): ${inserted} новых, ${updated} обновлено, ${stockReplaced} остатков`,
          details: summary,
        })
        .eq("id", logId);
    }
    return summary;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (logId) {
      await supabaseAdmin
        .from("sync_logs")
        .update({ status: "error", finished_at: new Date().toISOString(), message: msg })
        .eq("id", logId);
    }
    throw e;
  }
}
