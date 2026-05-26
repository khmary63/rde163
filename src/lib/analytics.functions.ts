import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({
  from: z.string().optional(), // ISO date YYYY-MM-DD
  to: z.string().optional(),
  status: z.enum(["all", "active", "completed"]).default("active"),
});

export interface CustomerRow {
  user_id: string;
  customer: string;
  email: string | null;
  phone: string | null;
  orders_count: number;
  items_count: number;
  qty_total: number;
  revenue: number;
  last_order_at: string | null;
}

export interface ProductRow {
  product_id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  qty: number;
  orders_count: number;
  revenue: number;
}

export interface AnalyticsResult {
  from: string | null;
  to: string | null;
  totals: {
    orders: number;
    customers: number;
    qty: number;
    revenue: number;
  };
  customers: CustomerRow[];
  top_products: ProductRow[];
}

async function ensureStaff(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const ok = (data ?? []).some((r) => r.role === "admin" || r.role === "manager");
  if (!ok) throw new Error("Доступ только для сотрудников");
}

export const getSalesAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data, context }): Promise<AnalyticsResult> => {
    await ensureStaff(context.userId);

    // ---- Fetch orders in range ---------------------------------------
    let q = supabaseAdmin
      .from("orders")
      .select("id, user_id, total_amount, created_at, status")
      .neq("status", "draft");

    if (data.status === "active") q = q.neq("status", "cancelled");
    else if (data.status === "completed") q = q.eq("status", "completed");

    if (data.from) q = q.gte("created_at", `${data.from}T00:00:00.000Z`);
    if (data.to) q = q.lte("created_at", `${data.to}T23:59:59.999Z`);

    const { data: orders, error } = await q.limit(10000);
    if (error) throw new Error(error.message);

    const orderIds = (orders ?? []).map((o) => o.id);
    if (!orderIds.length) {
      return {
        from: data.from ?? null,
        to: data.to ?? null,
        totals: { orders: 0, customers: 0, qty: 0, revenue: 0 },
        customers: [],
        top_products: [],
      };
    }

    // ---- Fetch order items in chunks ---------------------------------
    type Item = { order_id: string; product_id: string; qty: number; line_total: number };
    const items: Item[] = [];
    const CHUNK = 200;
    for (let i = 0; i < orderIds.length; i += CHUNK) {
      const slice = orderIds.slice(i, i + CHUNK);
      const { data: rows, error: e } = await supabaseAdmin
        .from("order_items")
        .select("order_id, product_id, qty, line_total")
        .in("order_id", slice);
      if (e) throw new Error(e.message);
      items.push(...((rows ?? []) as Item[]));
    }

    // ---- Fetch profiles & products -----------------------------------
    const userIds = Array.from(new Set((orders ?? []).map((o) => o.user_id)));
    const productIds = Array.from(new Set(items.map((it) => it.product_id)));

    const [{ data: profiles }, { data: products }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, company_name, email, phone")
        .in("id", userIds),
      productIds.length
        ? supabaseAdmin
            .from("products")
            .select("id, name, sku, brand:brands(name)")
            .in("id", productIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string; sku: string | null; brand: { name: string } | { name: string }[] | null }> }),
    ]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const productMap = new Map(
      (products ?? []).map((p) => {
        const b = (p as { brand?: { name: string } | { name: string }[] | null }).brand;
        const brandName = Array.isArray(b) ? b[0]?.name ?? null : b?.name ?? null;
        return [p.id, { name: p.name, sku: p.sku, brand: brandName }];
      }),
    );

    // ---- Per-order qty/items count -----------------------------------
    const perOrder = new Map<string, { qty: number; lines: number }>();
    for (const it of items) {
      const prev = perOrder.get(it.order_id) ?? { qty: 0, lines: 0 };
      prev.qty += Number(it.qty);
      prev.lines += 1;
      perOrder.set(it.order_id, prev);
    }

    // ---- Customer rollup ---------------------------------------------
    const custMap = new Map<string, CustomerRow>();
    for (const o of orders ?? []) {
      const p = profileMap.get(o.user_id);
      const name = p?.company_name || p?.full_name || p?.email || "—";
      const row = custMap.get(o.user_id) ?? {
        user_id: o.user_id,
        customer: name,
        email: p?.email ?? null,
        phone: p?.phone ?? null,
        orders_count: 0,
        items_count: 0,
        qty_total: 0,
        revenue: 0,
        last_order_at: null,
      };
      const stats = perOrder.get(o.id) ?? { qty: 0, lines: 0 };
      row.orders_count += 1;
      row.items_count += stats.lines;
      row.qty_total += stats.qty;
      row.revenue += Number(o.total_amount);
      if (!row.last_order_at || o.created_at > row.last_order_at) {
        row.last_order_at = o.created_at;
      }
      custMap.set(o.user_id, row);
    }
    const customers = [...custMap.values()].sort((a, b) => b.revenue - a.revenue);

    // ---- Top products ------------------------------------------------
    const prodMap = new Map<string, ProductRow>();
    const ordersByProduct = new Map<string, Set<string>>();
    for (const it of items) {
      const p = productMap.get(it.product_id);
      const row = prodMap.get(it.product_id) ?? {
        product_id: it.product_id,
        name: p?.name ?? it.product_id,
        sku: p?.sku ?? null,
        brand: p?.brand ?? null,
        qty: 0,
        orders_count: 0,
        revenue: 0,
      };
      row.qty += Number(it.qty);
      row.revenue += Number(it.line_total);
      const oset = ordersByProduct.get(it.product_id) ?? new Set();
      oset.add(it.order_id);
      ordersByProduct.set(it.product_id, oset);
      prodMap.set(it.product_id, row);
    }
    for (const [pid, row] of prodMap) {
      row.orders_count = ordersByProduct.get(pid)?.size ?? 0;
    }
    const top_products = [...prodMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 50);

    const totals = {
      orders: orders?.length ?? 0,
      customers: customers.length,
      qty: customers.reduce((s, c) => s + c.qty_total, 0),
      revenue: +customers.reduce((s, c) => s + c.revenue, 0).toFixed(2),
    };

    return {
      from: data.from ?? null,
      to: data.to ?? null,
      totals,
      customers,
      top_products,
    };
  });

export interface CustomerDetail {
  customer: { user_id: string; name: string; email: string | null; phone: string | null };
  orders: Array<{ id: string; number: string; created_at: string; status: string; total_amount: number; qty: number; lines: number }>;
  products: ProductRow[];
}

const DetailInput = z.object({
  user_id: z.string().uuid(),
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.enum(["all", "active", "completed"]).default("active"),
});

export const getCustomerDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DetailInput.parse(i))
  .handler(async ({ data, context }): Promise<CustomerDetail> => {
    await ensureStaff(context.userId);

    let q = supabaseAdmin
      .from("orders")
      .select("id, number, total_amount, created_at, status")
      .eq("user_id", data.user_id)
      .neq("status", "draft");
    if (data.status === "active") q = q.neq("status", "cancelled");
    else if (data.status === "completed") q = q.eq("status", "completed");
    if (data.from) q = q.gte("created_at", `${data.from}T00:00:00.000Z`);
    if (data.to) q = q.lte("created_at", `${data.to}T23:59:59.999Z`);

    const { data: orders, error } = await q.order("created_at", { ascending: false }).limit(2000);
    if (error) throw new Error(error.message);

    const orderIds = (orders ?? []).map((o) => o.id);
    type Item = { order_id: string; product_id: string; qty: number; line_total: number };
    const items: Item[] = [];
    for (let i = 0; i < orderIds.length; i += 200) {
      const slice = orderIds.slice(i, i + 200);
      const { data: rows } = await supabaseAdmin
        .from("order_items")
        .select("order_id, product_id, qty, line_total")
        .in("order_id", slice);
      items.push(...((rows ?? []) as Item[]));
    }

    const productIds = Array.from(new Set(items.map((it) => it.product_id)));
    const [{ data: profile }, { data: products }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, company_name, email, phone")
        .eq("id", data.user_id)
        .maybeSingle(),
      productIds.length
        ? supabaseAdmin
            .from("products")
            .select("id, name, sku, brand:brands(name)")
            .in("id", productIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string; sku: string | null; brand: { name: string } | { name: string }[] | null }> }),
    ]);

    const productMap = new Map(
      (products ?? []).map((p) => {
        const b = (p as { brand?: { name: string } | { name: string }[] | null }).brand;
        const brandName = Array.isArray(b) ? b[0]?.name ?? null : b?.name ?? null;
        return [p.id, { name: p.name, sku: p.sku, brand: brandName }];
      }),
    );

    const perOrder = new Map<string, { qty: number; lines: number }>();
    for (const it of items) {
      const prev = perOrder.get(it.order_id) ?? { qty: 0, lines: 0 };
      prev.qty += Number(it.qty);
      prev.lines += 1;
      perOrder.set(it.order_id, prev);
    }

    const orderRows = (orders ?? []).map((o) => {
      const s = perOrder.get(o.id) ?? { qty: 0, lines: 0 };
      return {
        id: o.id,
        number: o.number,
        created_at: o.created_at,
        status: o.status,
        total_amount: Number(o.total_amount),
        qty: s.qty,
        lines: s.lines,
      };
    });

    const prodMap = new Map<string, ProductRow>();
    const ordersByProduct = new Map<string, Set<string>>();
    for (const it of items) {
      const p = productMap.get(it.product_id);
      const row = prodMap.get(it.product_id) ?? {
        product_id: it.product_id,
        name: p?.name ?? it.product_id,
        sku: p?.sku ?? null,
        brand: p?.brand ?? null,
        qty: 0,
        orders_count: 0,
        revenue: 0,
      };
      row.qty += Number(it.qty);
      row.revenue += Number(it.line_total);
      const oset = ordersByProduct.get(it.product_id) ?? new Set();
      oset.add(it.order_id);
      ordersByProduct.set(it.product_id, oset);
      prodMap.set(it.product_id, row);
    }
    for (const [pid, row] of prodMap) row.orders_count = ordersByProduct.get(pid)?.size ?? 0;
    const productsAgg = [...prodMap.values()].sort((a, b) => b.revenue - a.revenue);

    const name = profile?.company_name || profile?.full_name || profile?.email || "—";
    return {
      customer: {
        user_id: data.user_id,
        name,
        email: profile?.email ?? null,
        phone: profile?.phone ?? null,
      },
      orders: orderRows,
      products: productsAgg,
    };
  });
