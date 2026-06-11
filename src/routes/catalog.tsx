import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, ShoppingCart, ChevronLeft, ChevronRight, X, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { pickPriceForDiscount, type PriceTiers } from "@/lib/pricing";
import {
  getCatalogBrands,
  getCatalogProducts,
  getCatalogProductsForUser,
  getCatalogWarehouses,
  getUserDiscount,
  type CatalogBrand as Brand,
  type CatalogProduct as Product,
  type CatalogWarehouse as Warehouse,
} from "@/lib/catalog.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/catalog")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Каталог запчастей для китайской спецтехники — РДЭ" },
      { name: "description", content: "Каталог из 40 000+ оригинальных запчастей CNHTC, HOWO, XGMA, Shacman, Sitrak. 8 складов по России, наличие в реальном времени, персональные цены." },
      { property: "og:title", content: "Каталог запчастей — РДЭ" },
      { property: "og:description", content: "5 000+ позиций, наличие на 8 складах, персональные цены для юрлиц." },
      { property: "og:url", content: "https://rde163.ru/catalog" },
    ],
    links: [{ rel: "canonical", href: "https://rde163.ru/catalog" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Каталог запчастей РДЭ",
          description: "Каталог оригинальных запчастей для китайской спецтехники и грузовиков.",
          url: "https://rde163.ru/catalog",
          isPartOf: { "@type": "WebSite", name: "Русский Дом Экспорта", url: "https://rde163.ru" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "https://rde163.ru" },
            { "@type": "ListItem", position: 2, name: "Каталог", item: "https://rde163.ru/catalog" },
          ],
        }),
      },
    ],
  }),
  component: CatalogPage,
});

const PAGE_SIZE = 50;

function useUserDiscount() {
  const { user } = useAuth();
  const fetchDiscount = useServerFn(getUserDiscount);
  return useQuery({
    queryKey: ["user-discount", user?.id ?? "guest"],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      return fetchDiscount();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

function useBrands() {
  const fetchBrands = useServerFn(getCatalogBrands);
  return useQuery({
    queryKey: ["brands"],
    queryFn: () => fetchBrands(),
    staleTime: 5 * 60 * 1000,
  });
}

function useWarehouses() {
  const fetchWarehouses = useServerFn(getCatalogWarehouses);
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: () => fetchWarehouses(),
    staleTime: 5 * 60 * 1000,
  });
}

type Filters = {
  search: string;
  brandIds: string[];
  warehouseIds: string[];
  originality: "all" | "original" | "analog";
  inStockOnly: boolean;
  page: number;
};

function useProducts(filters: Filters, isAuthed: boolean) {
  const fetchPublicProducts = useServerFn(getCatalogProducts);
  const fetchUserProducts = useServerFn(getCatalogProductsForUser);
  return useQuery({
    queryKey: ["products", filters, isAuthed],
    queryFn: () => (isAuthed ? fetchUserProducts({ data: filters }) : fetchPublicProducts({ data: filters })),
    placeholderData: (prev) => prev,
  });
}

function CatalogPage() {
  const { q } = Route.useSearch();
  const [search, setSearch] = useState(q ?? "");

  useEffect(() => {
    if (q !== undefined) setSearch(q);
  }, [q]);

  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [warehouseIds, setWarehouseIds] = useState<string[]>([]);
  const [originality, setOriginality] = useState<Filters["originality"]>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(0);
  const cart = useCart();

  const filters: Filters = { search, brandIds, warehouseIds, originality, inStockOnly, page };

  const { user } = useAuth();
  const brandsQ = useBrands();
  const whQ = useWarehouses();
  const productsQ = useProducts(filters, !!user);
  const discountQ = useUserDiscount();
  const discount = discountQ.data ?? 0;

  const totalPages = Math.max(1, Math.ceil((productsQ.data?.total ?? 0) / PAGE_SIZE));
  const wareById = useMemo(() => new Map((whQ.data ?? []).map((w) => [w.id, w])), [whQ.data]);

  const toggleId = (arr: string[], id: string, setter: (v: string[]) => void) => {
    setter(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
    setPage(0);
  };

  const resetFilters = () => {
    setSearch("");
    setBrandIds([]);
    setWarehouseIds([]);
    setOriginality("all");
    setInStockOnly(false);
    setPage(0);
  };

  const activeCount = (search ? 1 : 0) + brandIds.length + warehouseIds.length + (originality !== "all" ? 1 : 0) + (inStockOnly ? 1 : 0);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">Каталог запчастей</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {productsQ.isLoading ? "Загрузка…" : `${(productsQ.data?.total ?? 0).toLocaleString("ru-RU")} позиций · 8 складов по России`}
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Артикул, OEM, кросс-номер или название"
            className="pl-9"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Фильтры</h2>
            {activeCount > 0 && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-brand hover:underline">
                <X className="h-3 w-3" /> сбросить ({activeCount})
              </button>
            )}
          </div>

          <FilterSection title="Тип">
            {(["original", "analog", "all"] as const).map((v) => (
              <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="orig"
                  className="h-3.5 w-3.5 accent-brand"
                  checked={originality === v}
                  onChange={() => {
                    setOriginality(v);
                    setPage(0);
                  }}
                />
                {v === "original" ? "Оригинал" : v === "analog" ? "Аналог" : "Все"}
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Наличие">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={inStockOnly}
                onCheckedChange={(c) => {
                  setInStockOnly(!!c);
                  setPage(0);
                }}
              />
              Только в наличии
            </label>
          </FilterSection>

          <FilterSection title="Склады">
            {whQ.data?.map((w) => (
              <label key={w.id} className="flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={warehouseIds.includes(w.id)}
                  onCheckedChange={() => toggleId(warehouseIds, w.id, setWarehouseIds)}
                />
                <span>
                  <span className="block">{w.city ?? w.name}</span>
                  <span className="block text-xs text-muted-foreground">{w.name}</span>
                </span>
              </label>
            ))}
          </FilterSection>

          <FilterSection title={`Бренд${brandIds.length ? ` · ${brandIds.length}` : ""}`}>
            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-2">
              {brandsQ.data?.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                  <label className="flex flex-1 cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={brandIds.includes(b.id)}
                      onCheckedChange={() => toggleId(brandIds, b.id, setBrandIds)}
                    />
                    {b.name}
                  </label>
                  <Link
                    to="/catalog/brand/$slug"
                    params={{ slug: b.slug }}
                    className="text-[11px] text-muted-foreground hover:text-brand hover:underline"
                    title={`SEO-страница бренда ${b.name}`}
                  >
                    →
                  </Link>
                </div>
              ))}
            </div>
          </FilterSection>
        </aside>

        {/* Table */}
        <div className="min-w-0 space-y-4">
          {productsQ.isLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Загрузка каталога…
            </div>
          ) : productsQ.data?.rows.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-lg font-medium">Ничего не найдено</p>
              <p className="mt-1 text-sm text-muted-foreground">Попробуйте сбросить фильтры или изменить запрос.</p>
              {activeCount > 0 && (
                <Button variant="outline" className="mt-4" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              )}
            </Card>
          ) : (
            <>
              <div className="hidden md:block overflow-hidden rounded-lg border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Наименование / артикул</th>
                      <th className="px-4 py-3 text-left">Бренд</th>
                      <th className="px-4 py-3 text-left">Наличие · склады</th>
                      <th className="px-4 py-3 text-right">Цена</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {productsQ.data?.rows.map((p) => {
                      // OFFER warehouse stock rows are kept at qty=0; real warehouses drive availability.
                      const totalQty = p.stock.reduce((s, r) => s + (r.qty || 0), 0);
                      const isOnOrder = p.source === "on_order" || totalQty === 0;
                      const status: "in" | "low" | "out" = totalQty === 0 ? "out" : totalQty < 5 ? "low" : "in";
                      const retail = Number(p.price_retail || p.base_price || 0);
                      const userPrice = pickPriceForDiscount(retail, p.price_tiers, discount);
                      const hasDiscount = discount > 0 && userPrice < retail;
                      return (
                        <tr key={p.id} className="hover:bg-surface/50">
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium leading-tight">{p.name}</div>
                            <div className="mt-1 font-mono text-xs text-muted-foreground">{p.sku}</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <Badge variant="secondary" className="font-normal">
                              {p.brand?.name ?? "—"}
                            </Badge>
                            {p.brand?.name && p.brand.name.toUpperCase() !== "CNHTC" && (
                              <Badge variant="outline" className="ml-1 font-normal">аналог</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex h-2 w-2 rounded-full",
                                  status === "in" && "bg-[oklch(0.70_0.18_145)]",
                                  status === "low" && "bg-[oklch(0.78_0.16_75)]",
                                  status === "out" && "bg-[oklch(0.62_0.20_25)]",
                                )}
                              />
                              <span className="font-medium">
                                {status === "in" && `${totalQty} шт.`}
                                {status === "low" && `${totalQty} шт. · мало`}
                                {status === "out" && (isOnOrder ? "Под заказ" : "Нет в наличии")}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {p.stock
                                .filter((s) => s.qty > 0)
                                .map((s) => {
                                  const w = wareById.get(s.warehouse_id);
                                  return (
                                    <span key={s.warehouse_id} className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                      {w?.city ?? w?.name ?? "—"}: {s.qty}
                                    </span>
                                  );
                                })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <div className="font-display text-base font-semibold whitespace-nowrap">
                              {userPrice.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}&nbsp;₽
                            </div>
                            {hasDiscount && (
                              <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                                с учётом скидки {discount}%
                                <span className="ml-1 line-through opacity-70">
                                  {retail.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}&nbsp;₽
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            {status === "out" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => {
                                  const fallbackWh = whQ.data?.[0];
                                  if (!fallbackWh) {
                                    toast.error("Не удалось добавить под заказ");
                                    return;
                                  }
                                  cart.add({
                                    productId: p.id,
                                    sku: p.sku,
                                    name: p.name,
                                    brand: p.brand?.name ?? "",
                                    price: userPrice,
                                    warehouseId: fallbackWh.id,
                                    warehouseName: "Под заказ",
                                    maxQty: Number.MAX_SAFE_INTEGER,
                                    backorder: true,
                                  });
                                  toast.success("Добавлено в корзину", {
                                    description: `${p.name} — менеджер свяжется при поступлении`,
                                  });
                                }}
                              >
                                <Send className="h-3.5 w-3.5" /> Заказать
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => {
                                  const best = [...p.stock]
                                    .filter((s) => s.qty > 0)
                                    .sort((a, b) => b.qty - a.qty)[0];
                                  if (!best) return;
                                  const w = wareById.get(best.warehouse_id);
                                  cart.add({
                                    productId: p.id,
                                    sku: p.sku,
                                    name: p.name,
                                    brand: p.brand?.name ?? "",
                                    price: userPrice,
                                    warehouseId: best.warehouse_id,
                                    warehouseName: w?.city ?? w?.name ?? "—",
                                    maxQty: best.qty,
                                  });
                                  toast.success("Добавлено в корзину", { description: p.name });
                                }}
                              >
                                <ShoppingCart className="h-3.5 w-3.5" /> В корзину
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Мобильные карточки */}
              <div className="md:hidden flex flex-col gap-3">
                {productsQ.data?.rows.map((p) => {
                  const totalQty = p.stock.reduce((s, r) => s + (r.qty || 0), 0);
                  const isOnOrder = p.source === "on_order" || totalQty === 0;
                  const status: "in" | "low" | "out" = totalQty === 0 ? "out" : totalQty < 5 ? "low" : "in";
                  const retail = Number(p.price_retail || p.base_price || 0);
                  const userPrice = pickPriceForDiscount(retail, p.price_tiers, discount);
                  const hasDiscount = discount > 0 && userPrice < retail;
                  return (
                    <Card key={p.id} className="p-4 flex flex-col gap-3">
                      <div>
                        <div className="font-medium leading-tight">{p.name}</div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground">{p.sku}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="font-normal">{p.brand?.name ?? "—"}</Badge>
                        {p.brand?.name && p.brand.name.toUpperCase() !== "CNHTC" && (
                          <Badge variant="outline" className="font-normal">аналог</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={cn(
                            "inline-flex h-2 w-2 rounded-full",
                            status === "in" && "bg-[oklch(0.70_0.18_145)]",
                            status === "low" && "bg-[oklch(0.78_0.16_75)]",
                            status === "out" && "bg-[oklch(0.62_0.20_25)]",
                          )}
                        />
                        <span className="font-medium">
                          {status === "in" && `${totalQty} шт.`}
                          {status === "low" && `${totalQty} шт. · мало`}
                          {status === "out" && (isOnOrder ? "Под заказ" : "Нет в наличии")}
                        </span>
                      </div>
                      {p.stock.filter((s) => s.qty > 0).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.stock.filter((s) => s.qty > 0).map((s) => {
                            const w = wareById.get(s.warehouse_id);
                            return (
                              <span key={s.warehouse_id} className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                {w?.city ?? w?.name ?? "—"}: {s.qty}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex items-end justify-between gap-3 pt-1 border-t border-border">
                        <div>
                          <div className="font-display text-lg font-semibold whitespace-nowrap">
                            {userPrice.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}&nbsp;₽
                          </div>
                          {hasDiscount && (
                            <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                              скидка {discount}%
                              <span className="ml-1 line-through opacity-70">
                                {retail.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}&nbsp;₽
                              </span>
                            </div>
                          )}
                        </div>
                        {status === "out" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => {
                              const fallbackWh = whQ.data?.[0];
                              if (!fallbackWh) { toast.error("Не удалось добавить под заказ"); return; }
                              cart.add({
                                productId: p.id, sku: p.sku, name: p.name,
                                brand: p.brand?.name ?? "", price: userPrice,
                                warehouseId: fallbackWh.id, warehouseName: "Под заказ",
                                maxQty: Number.MAX_SAFE_INTEGER, backorder: true,
                              });
                              toast.success("Добавлено в корзину", { description: `${p.name} — менеджер свяжется при поступлении` });
                            }}
                          >
                            <Send className="h-3.5 w-3.5" /> Заказать
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => {
                              const best = [...p.stock].filter((s) => s.qty > 0).sort((a, b) => b.qty - a.qty)[0];
                              if (!best) return;
                              const w = wareById.get(best.warehouse_id);
                              cart.add({
                                productId: p.id, sku: p.sku, name: p.name,
                                brand: p.brand?.name ?? "", price: userPrice,
                                warehouseId: best.warehouse_id,
                                warehouseName: w?.city ?? w?.name ?? "—",
                                maxQty: best.qty,
                              });
                              toast.success("Добавлено в корзину", { description: p.name });
                            }}
                          >
                            <ShoppingCart className="h-3.5 w-3.5" /> В корзину
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>


              {/* Pagination */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Страница {page + 1} из {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                    <ChevronLeft className="h-4 w-4" /> Назад
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Вперёд <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</Label>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
