import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { PriceTiers } from "@/lib/pricing";

const PAGE_SIZE = 50;

const CatalogFiltersInput = z.object({
  search: z.string().max(200).default(""),
  brandIds: z.array(z.string().uuid()).default([]),
  warehouseIds: z.array(z.string().uuid()).default([]),
  originality: z.enum(["all", "original", "analog"]).default("all"),
  inStockOnly: z.boolean().default(false),
  page: z.number().int().min(0).default(0),
});

export type CatalogFilters = z.infer<typeof CatalogFiltersInput>;
export type CatalogBrand = { id: string; slug: string; name: string };
export type CatalogWarehouse = { id: string; code: string; name: string; city: string | null; sort_order: number };
export type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  base_price: number;
  price_retail: number;
  price_tiers: PriceTiers | null;
  source: "price_list" | "on_order";
  is_original: boolean;
  brand: CatalogBrand | null;
  stock: { warehouse_id: string; qty: number }[];
};

type CatalogClient = SupabaseClient<Database>;

async function fetchCatalogProducts(
  supabase: CatalogClient,
  filters: CatalogFilters,
  includeWholesale: boolean,
): Promise<{ rows: CatalogProduct[]; total: number }> {
  const from = filters.page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const stockJoin = filters.warehouseIds.length > 0 || filters.inStockOnly ? "stock!inner" : "stock";
  const priceCols = includeWholesale ? "base_price, price_retail, price_tiers" : "price_retail";

  let q = supabase
    .from("products")
    .select(
      `id, sku, name, ${priceCols}, source, is_original, brand:brands(id, slug, name), stock:${stockJoin}(warehouse_id, qty)`,
      { count: "exact" },
    );

  if (filters.search.trim()) {
    const s = filters.search.trim().replace(/[%_(),]/g, " ");
    const { data: crossMatches } = await supabase
      .from("product_crosses")
      .select("product_id")
      .ilike("cross_number", `%${s}%`)
      .limit(500);
    const crossIds = (crossMatches ?? []).map((r) => r.product_id).filter(Boolean);
    const orParts = [`name.ilike.%${s}%`, `sku.ilike.%${s}%`, `oem.ilike.%${s}%`];
    if (crossIds.length > 0) orParts.push(`id.in.(${crossIds.join(",")})`);
    q = q.or(orParts.join(","));
  }

  if (filters.brandIds.length > 0) q = q.in("brand_id", filters.brandIds);

  if (filters.originality === "original" || filters.originality === "analog") {
    const { data: cnhtc } = await supabase
      .from("brands")
      .select("id")
      .ilike("name", "CNHTC")
      .maybeSingle();
    if (cnhtc?.id) {
      q = filters.originality === "original" ? q.eq("brand_id", cnhtc.id) : q.neq("brand_id", cnhtc.id);
    }
  }

  if (filters.warehouseIds.length > 0) q = q.in("stock.warehouse_id", filters.warehouseIds);
  if (filters.inStockOnly) q = q.gt("stock.qty", 0);

  const { data, error, count } = await q.order("name").range(from, to);
  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as any[]).map((p): CatalogProduct => {
    const brand = Array.isArray(p.brand) ? (p.brand[0] ?? null) : (p.brand ?? null);
    const retail = Number(p.price_retail ?? 0);
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      base_price: includeWholesale ? Number(p.base_price ?? retail) : retail,
      price_retail: retail,
      price_tiers: includeWholesale ? (p.price_tiers as PriceTiers | null) : null,
      source: p.source === "on_order" ? "on_order" : "price_list",
      is_original: Boolean(p.is_original),
      brand,
      stock: Array.isArray(p.stock)
        ? p.stock.map((s) => ({ warehouse_id: s.warehouse_id, qty: Number(s.qty ?? 0) }))
        : [],
    };
  });

  return { rows, total: count ?? 0 };
}

export const getCatalogBrands = createServerFn({ method: "GET" }).handler(async (): Promise<CatalogBrand[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("brands").select("id, slug, name").order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getCatalogWarehouses = createServerFn({ method: "GET" }).handler(async (): Promise<CatalogWarehouse[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("warehouses")
    .select("id, code, name, city, sort_order")
    .eq("is_active", true)
    .eq("is_public", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getCatalogProducts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CatalogFiltersInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return fetchCatalogProducts(supabaseAdmin, data, false);
  });

export const getCatalogProductsForUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CatalogFiltersInput.parse(input))
  .handler(async ({ data, context }) => fetchCatalogProducts(context.supabase, data, true));

export const getUserDiscount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    const { data } = await context.supabase
      .from("profiles")
      .select("discount_percent")
      .eq("id", context.userId)
      .maybeSingle();
    return Number(data?.discount_percent ?? 0);
  });