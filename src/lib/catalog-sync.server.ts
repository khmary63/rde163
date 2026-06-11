import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SPREADSHEET_ID = "1wqUakDJVX2-dP0gF0VuZhUC61DP5r2mJa38CKFzua6E";
const SHEET_NAME = "Запчасти";
const SHEET_GID = "1212612956";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

const OFFER_WAREHOUSE_CODE = "OFFER";
const DISCOUNT_TIERS = [5, 10, 15, 18, 20, 21] as const;

type Row = (string | number | undefined)[];

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
  for (const t of DISCOUNT_TIERS) {
    out[String(t)] = Math.round(retail * (1 - t / 100) * 100) / 100;
  }
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

async function fetchSheetRows(): Promise<Row[]> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY не настроен");
  if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY не настроен (подключите Google Sheets)");

  const batchUrl = new URL(`${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values:batchGet`);
  batchUrl.searchParams.set("ranges", `${SHEET_NAME}!A2:K`);
  batchUrl.searchParams.set("valueRenderOption", "UNFORMATTED_VALUE");
  const batchResp = await fetch(batchUrl.toString(), {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY,
    },
  });
  if (batchResp.ok) {
    const json = (await batchResp.json()) as { valueRanges?: Array<{ values?: Row[] }> };
    return json.valueRanges?.[0]?.values ?? [];
  }
  const batchErrorText = await batchResp.text();

  const encodedRange = `${encodeURIComponent(SHEET_NAME)}!A2:K`;
  const url = `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${encodedRange}?valueRenderOption=UNFORMATTED_VALUE`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY,
    },
  });
  if (resp.ok) {
    const json = (await resp.json()) as { values?: Row[] };
    return json.values ?? [];
  }

  const errorText = await resp.text();
  if (resp.status !== 403) throw new Error(`Google Sheets API ${resp.status}: ${errorText.slice(0, 300)}; batchGet ${batchResp.status}: ${batchErrorText.slice(0, 160)}`);

  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}&range=A2:K`;
  const csvResp = await fetch(csvUrl, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!csvResp.ok) {
    const csvText = await csvResp.text();
    throw new Error(`Google Sheets API 403; CSV fallback ${csvResp.status}: ${csvText.slice(0, 300)}`);
  }
  return parseCsv(await csvResp.text());
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

/** Insert a `running` sync_logs row and return its id. */
export async function createCatalogSyncLog(trigger: "manual" | "cron" = "manual"): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("sync_logs")
    .insert({
      source: "google_sheets_catalog",
      status: "running",
      message: `Старт синхронизации «под заказ» (${trigger})`,
    })
    .select("id")
    .single();
  if (error || !data?.id) throw new Error(`sync_logs insert: ${error?.message ?? "no id"}`);
  return data.id;
}

/** Sync Google Sheets «Запчасти» → товары «под заказ» (source='on_order'). */
export async function runCatalogSync(
  trigger: "manual" | "cron" = "manual",
  existingLogId?: string,
): Promise<CatalogSyncSummary> {
  const logId = existingLogId ?? (await createCatalogSyncLog(trigger));


  try {
    const rows = await fetchSheetRows();

    // ---- 1. OFFER warehouse (target for all rows) --------------------
    const { data: offerWh } = await supabaseAdmin
      .from("warehouses")
      .select("id")
      .eq("code", OFFER_WAREHOUSE_CODE)
      .maybeSingle();
    if (!offerWh?.id) {
      throw new Error(`Виртуальный склад «${OFFER_WAREHOUSE_CODE}» не найден — добавьте его в админке`);
    }
    const offerWhId = offerWh.id;

    // ---- 2. Brands ----------------------------------------------------
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

    // ---- 3. Aggregate ------------------------------------------------
    // sheet cols (0-based from A): A=0 …, B=1 brand, C=2 sku, D=3 name,
    // F=5 location, G=6 status, J=9 «Цена, РРЦ», K=10 свободно
    const products = new Map<string, {
      brand_id: string; sku: string; name: string; retail: number;
    }>();
    const offerQty = new Map<string, number>(); // key brandId::sku -> qty
    let skipped = 0;

    for (const r of rows) {
      const brand = String(r[1] ?? "").trim();
      const sku = String(r[2] ?? "").trim();
      const name = String(r[3] ?? "").trim();
      const retail = parseNumber(r[9]);
      const free = parseInt0(r[10]);
      if (!brand || !sku || !name) { skipped++; continue; }
      const brandId = brandMap.get(brand.toLowerCase());
      if (!brandId) { skipped++; continue; }
      const key = `${brandId}::${sku}`;
      const prev = products.get(key);
      if (!prev) {
        products.set(key, { brand_id: brandId, sku, name, retail });
      } else if (!prev.retail && retail) {
        prev.retail = retail;
      }
      offerQty.set(key, (offerQty.get(key) ?? 0) + free);
    }

    // ---- 4. Existing products lookup ---------------------------------
    const skuList = [...new Set([...products.values()].map((p) => p.sku))];
    const existingMap = new Map<string, { id: string; source: string; price_retail: number }>();
    const SKU_CHUNK = 300;
    for (let i = 0; i < skuList.length; i += SKU_CHUNK) {
      const skuSlice = skuList.slice(i, i + SKU_CHUNK);
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("id, sku, brand_id, source, price_retail")
        .in("sku", skuSlice);
      if (error) throw new Error(`products fetch: ${error.message}`);
      for (const p of data ?? []) {
        existingMap.set(`${p.brand_id}::${p.sku}`, {
          id: p.id,
          source: p.source ?? "price_list",
          price_retail: Number(p.price_retail ?? 0),
        });
      }
    }

    // ---- 5. Upsert products ------------------------------------------
    const prodIdMap = new Map<string, string>();
    const toInsert: Array<{
      brand_id: string; sku: string; name: string; oem: string;
      base_price: number; price_retail: number; price_tiers: Record<string, number>;
      source: string; category: string | null; is_original: boolean;
    }> = [];
    type UpdRow = { id: string; name: string; base_price?: number; price_retail?: number; price_tiers?: Record<string, number> };
    const toUpdate: UpdRow[] = [];

    for (const [key, p] of products) {
      const tiers = buildTiers(p.retail);
      const ex = existingMap.get(key);
      if (ex) {
        prodIdMap.set(key, ex.id);
        // If product already comes from price_list — only refresh the name,
        // never overwrite prices (price list wins).
        if (ex.source === "price_list") {
          toUpdate.push({ id: ex.id, name: p.name });
        } else {
          toUpdate.push({
            id: ex.id,
            name: p.name,
            base_price: p.retail,
            price_retail: p.retail,
            price_tiers: tiers,
          });
        }
      } else {
        toInsert.push({
          brand_id: p.brand_id,
          sku: p.sku,
          name: p.name,
          oem: p.sku,
          base_price: p.retail,
          price_retail: p.retail,
          price_tiers: tiers,
          source: "on_order",
          category: null,
          is_original: true,
        });
      }
    }

    let inserted = 0;
    const CHUNK = 200;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const slice = toInsert.slice(i, i + CHUNK);
      const { data, error } = await supabaseAdmin
        .from("products")
        .upsert(slice, { onConflict: "brand_id,sku", ignoreDuplicates: false })
        .select("id, sku, brand_id");
      if (error) throw new Error(`products upsert: ${error.message}`);
      for (const p of data ?? []) {
        const key = `${p.brand_id}::${p.sku}`;
        if (!prodIdMap.has(key)) inserted++;
        prodIdMap.set(key, p.id);
      }
    }

    let updated = 0;
    for (const u of toUpdate) {
      const { id, ...patch } = u;
      const { error } = await supabaseAdmin.from("products").update(patch).eq("id", id);
      if (!error) updated++;
    }

    // ---- 6. OFFER stock (replace, only OFFER warehouse) --------------
    const allProductIds = [...prodIdMap.values()];
    let stockReplaced = 0;
    if (allProductIds.length) {
      for (let i = 0; i < allProductIds.length; i += 200) {
        const slice = allProductIds.slice(i, i + 200);
        // Only wipe rows in the OFFER warehouse — do not touch real warehouses.
        await supabaseAdmin
          .from("stock")
          .delete()
          .eq("warehouse_id", offerWhId)
          .in("product_id", slice);
      }
      const stockRows: Array<{ product_id: string; warehouse_id: string; qty: number; status: "expected" }> = [];
      for (const [k] of products) {
        const pid = prodIdMap.get(k);
        if (!pid) continue;
        // qty is informational; status='expected' marks it as «Под заказ».
        // Keep qty = 0 so it does not appear as "in stock" in the catalog.
        stockRows.push({
          product_id: pid,
          warehouse_id: offerWhId,
          qty: 0,
          status: "expected",
        });
      }
      for (let i = 0; i < stockRows.length; i += CHUNK) {
        const slice = stockRows.slice(i, i + CHUNK);
        const { error } = await supabaseAdmin
          .from("stock")
          .upsert(slice, { onConflict: "product_id,warehouse_id" });
        if (error) throw new Error(`stock upsert: ${error.message}`);
        stockReplaced += slice.length;
      }
    }

    const summary: CatalogSyncSummary = {
      rows_total: rows.length,
      rows_skipped: skipped,
      brands_added: newBrands.length,
      warehouses_added: 0,
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
          message: `OK (${trigger}): «под заказ» — ${inserted} новых, ${updated} обновлено, ${stockReplaced} позиций`,
          details: { ...summary, offer_qty_sum: [...offerQty.values()].reduce((a, b) => a + b, 0) },
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
