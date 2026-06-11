import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PriceTiers } from "./pricing";

type ImportRow = {
  sku: string;
  name: string;
  brand: string;
  retail: number;
  price_tiers: PriceTiers;
  stocks: Record<string, number>; // wh code -> qty
};

async function assertStaff(supabaseAdmin: any, userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isStaff = (roles ?? []).some(
    (r: { role: string }) => r.role === "admin" || r.role === "manager",
  );
  if (!isStaff) throw new Error("Доступ только для администраторов");
}

export const importStart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { totalRows: number; whCodesFound: string[] }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertStaff(supabaseAdmin, context.userId);
    const { data: log, error } = await supabaseAdmin
      .from("sync_logs")
      .insert({
        source: "catalog_xlsx",
        status: "running",
        message: `Импорт ${data.totalRows} строк из Excel-прайса (по частям)`,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { logId: log!.id as string };
  });

export const importChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { logId: string; rows: ImportRow[]; whCodesFound: string[] }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertStaff(supabaseAdmin, context.userId);
    const { rows, whCodesFound } = data;
    if (rows.length === 0) return { processed: 0, failed: 0, stockRows: 0 };

    // Warehouses lookup
    const { data: whAll } = await supabaseAdmin.from("warehouses").select("id, code");
    const whByCode = new Map((whAll ?? []).map((w: { id: string; code: string }) => [w.code, w.id]));

    // 1) Upsert brands (only those present in this chunk)
    const brandNames = Array.from(new Set(rows.map((r) => r.brand)));
    const brandRows = brandNames.map((n) => ({
      name: n,
      slug:
        n
          .toLowerCase()
          .replace(/[^a-z0-9а-я]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 60) || "brand",
    }));
    const { error: brandErr } = await supabaseAdmin
      .from("brands")
      .upsert(brandRows, { onConflict: "slug", ignoreDuplicates: true });
    if (brandErr) throw new Error(`Бренды: ${brandErr.message}`);
    const { data: brandsAll } = await supabaseAdmin
      .from("brands")
      .select("id, name")
      .in("name", brandNames);
    const brandMap = new Map(
      (brandsAll ?? []).map((b: { id: string; name: string }) => [b.name, b.id]),
    );

    // 2) Upsert products
    const productRows = rows
      .filter((r) => brandMap.get(r.brand))
      .map((r) => ({
        sku: r.sku,
        name: r.name,
        brand_id: brandMap.get(r.brand)!,
        is_original: (r.brand || "").toUpperCase() === "CNHTC",
        base_price: r.retail,
        price_retail: r.retail,
        price_tiers: r.price_tiers,
        oem: r.sku,
        source: "price_list",
      }));

    let processed = 0;
    let failed = 0;
    const CHUNK = 500;
    for (let i = 0; i < productRows.length; i += CHUNK) {
      const slice = productRows.slice(i, i + CHUNK);
      const { error } = await supabaseAdmin
        .from("products")
        .upsert(slice, { onConflict: "brand_id,sku" });
      if (error) failed += slice.length;
      else processed += slice.length;
    }

    // 3) Fetch ids for this chunk
    const productMap = new Map<string, string>();
    const skuList = rows.map((r) => r.sku);
    for (let i = 0; i < skuList.length; i += 500) {
      const slice = skuList.slice(i, i + 500);
      const { data: ps } = await supabaseAdmin
        .from("products")
        .select("id, sku, brand_id")
        .in("sku", slice);
      for (const p of ps ?? []) productMap.set(`${p.brand_id}::${p.sku}`, p.id);
    }

    // 4) Replace stock for warehouses found in file, scoped to this chunk's products
    const realWhIds = whCodesFound
      .map((c) => whByCode.get(c))
      .filter((v): v is string => Boolean(v));
    const allPids = rows
      .map((r) => productMap.get(`${brandMap.get(r.brand)}::${r.sku}`))
      .filter((v): v is string => Boolean(v));

    if (realWhIds.length && allPids.length) {
      for (let i = 0; i < allPids.length; i += 500) {
        const slice = allPids.slice(i, i + 500);
        await supabaseAdmin
          .from("stock")
          .delete()
          .in("warehouse_id", realWhIds)
          .in("product_id", slice);
      }
    }

    const stockRows: Array<{
      product_id: string;
      warehouse_id: string;
      qty: number;
      status: "in_stock" | "out";
    }> = [];
    for (const r of rows) {
      const bid = brandMap.get(r.brand);
      if (!bid) continue;
      const pid = productMap.get(`${bid}::${r.sku}`);
      if (!pid) continue;
      for (const [code, qty] of Object.entries(r.stocks)) {
        const wid = whByCode.get(code);
        if (!wid) continue;
        stockRows.push({
          product_id: pid,
          warehouse_id: wid,
          qty,
          status: qty > 0 ? "in_stock" : "out",
        });
      }
    }
    for (let i = 0; i < stockRows.length; i += 1000) {
      const chunk = stockRows.slice(i, i + 1000);
      const { error } = await supabaseAdmin
        .from("stock")
        .upsert(chunk, { onConflict: "product_id,warehouse_id" });
      if (error) throw new Error(`Остатки: ${error.message}`);
    }

    return { processed, failed, stockRows: stockRows.length };
  });

export const importFinish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      logId: string;
      processed: number;
      failed: number;
      stockRows: number;
      whCodesFound: string[];
      error?: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertStaff(supabaseAdmin, context.userId);
    const { logId, processed, failed, stockRows, whCodesFound, error } = data;
    await supabaseAdmin
      .from("sync_logs")
      .update({
        status: error ? "error" : failed > 0 ? "partial" : "success",
        rows_processed: processed,
        rows_failed: failed,
        finished_at: new Date().toISOString(),
        message:
          error ??
          `Прайс: товаров ${processed}, остатков ${stockRows}, складов в файле ${whCodesFound.length}`,
      })
      .eq("id", logId);
    return { ok: true };
  });
