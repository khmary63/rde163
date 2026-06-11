import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PriceTiers } from "./pricing";

type ImportRow = {
  sku: string;
  name: string;
  brand: string;
  retail: number;
  price_tiers: PriceTiers;
  stocks: Record<string, number>; // wh code -> qty
};

type ImportPayload = {
  rows: ImportRow[];
  whCodesFound: string[];
};

export const importCatalogXlsx = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ImportPayload) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isStaff = (roles ?? []).some((r) => r.role === "admin" || r.role === "manager");
    if (!isStaff) throw new Error("Доступ только для администраторов");

    const { rows, whCodesFound } = data;

    const logStart = await supabaseAdmin
      .from("sync_logs")
      .insert({
        source: "catalog_xlsx",
        status: "running",
        message: `Импорт ${rows.length} строк из Excel-прайса`,
      })
      .select("id")
      .single();
    const logId = logStart.data?.id;

    try {
      // Warehouses lookup
      const { data: whAll } = await supabaseAdmin.from("warehouses").select("id, code");
      const whByCode = new Map((whAll ?? []).map((w) => [w.code, w.id]));

      // 1) Upsert brands
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
      const brandMap = new Map((brandsAll ?? []).map((b) => [b.name, b.id]));

      // 2) Upsert products in chunks
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
        const chunk = productRows.slice(i, i + CHUNK);
        const { error } = await supabaseAdmin
          .from("products")
          .upsert(chunk, { onConflict: "brand_id,sku" });
        if (error) failed += chunk.length;
        else processed += chunk.length;
      }

      // 3) Fetch ids
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

      // 4) Replace stock for real warehouses found in file
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

      await supabaseAdmin
        .from("sync_logs")
        .update({
          status: failed > 0 ? "partial" : "success",
          rows_processed: processed,
          rows_failed: failed,
          finished_at: new Date().toISOString(),
          message: `Прайс: товаров ${processed}, остатков ${stockRows.length}, складов в файле ${whCodesFound.length}`,
        })
        .eq("id", logId!);

      return { processed, failed, stockRows: stockRows.length };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (logId) {
        await supabaseAdmin
          .from("sync_logs")
          .update({
            status: "error",
            finished_at: new Date().toISOString(),
            message: msg,
          })
          .eq("id", logId);
      }
      throw new Error(msg);
    }
  });
