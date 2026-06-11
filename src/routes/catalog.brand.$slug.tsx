import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShoppingCart, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/proxy-client";

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

const getBrandBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: brand } = await supabaseAdmin
      .from("brands")
      .select("id, slug, name, description, logo_url")
      .eq("slug", data.slug)
      .maybeSingle();
    return brand;
  });

export const Route = createFileRoute("/catalog/brand/$slug")({
  loader: async ({ params }) => {
    const brand = await getBrandBySlug({ data: { slug: params.slug } });
    if (!brand) throw notFound();
    return { brand };
  },
  head: ({ loaderData, params }) => {
    const name = loaderData?.brand.name ?? params.slug;
    const url = `https://rde163.ru/catalog/brand/${params.slug}`;
    const title = `Запчасти ${name} — оригинал и аналоги | РДЭ`;
    const desc = `Запчасти ${name} в наличии на 8 складах по России. Оригинальные детали, персональные цены для юрлиц, доставка по РФ.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "product.group" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `Запчасти ${name}`,
            description: desc,
            url,
            about: { "@type": "Brand", name },
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
              { "@type": "ListItem", position: 3, name: name, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: BrandPage,
});

type Product = {
  id: string;
  sku: string;
  name: string;
  price_retail: number;
  is_original: boolean;
  stock: { warehouse_id: string; qty: number }[];
};

function BrandPage() {
  const { brand } = Route.useLoaderData();
  const cart = useCart();

  const q = useQuery({
    queryKey: ["brand-products", brand.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, sku, name, price_retail, is_original, stock(warehouse_id, qty)")
        .eq("brand_id", brand.id)
        .order("name")
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Главная</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/catalog" className="hover:text-foreground">Каталог</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{brand.name}</span>
      </nav>

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {brand.logo_url && (
            <img src={brand.logo_url} alt={brand.name} className="h-16 w-16 rounded-lg border border-border bg-card object-contain p-2" />
          )}
          <div>
            <h1 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">Запчасти {brand.name}</h1>
            {brand.description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{brand.description}</p>}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/catalog">Весь каталог</Link>
        </Button>
      </header>

      {q.isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Загрузка…
        </div>
      ) : (q.data?.length ?? 0) === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-lg font-medium">Пока нет товаров этого бренда</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/catalog">Перейти в каталог</Link>
          </Button>
        </Card>
      ) : (
        <div>
        <div className="hidden md:block overflow-hidden rounded-lg border border-border bg-card">

          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Наименование / артикул</th>
                <th className="px-4 py-3 text-left">Наличие</th>
                <th className="px-4 py-3 text-right">Цена</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {q.data?.map((p) => {
                const totalQty = p.stock.reduce((s, r) => s + (r.qty || 0), 0);
                return (
                  <tr key={p.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium leading-tight">{p.name}</div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">{p.sku}</div>
                      {!p.is_original && <Badge variant="outline" className="mt-1 font-normal">аналог</Badge>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {totalQty > 0 ? <span className="text-foreground">{totalQty} шт.</span> : <span className="text-muted-foreground">Под заказ</span>}
                    </td>
                    <td className="px-4 py-3 text-right align-top font-display font-semibold">
                      {Number(p.price_retail).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={totalQty === 0}
                        onClick={() => {
                          const best = [...p.stock].filter((s) => s.qty > 0).sort((a, b) => b.qty - a.qty)[0];
                          if (!best) return;
                          cart.add({
                            productId: p.id,
                            sku: p.sku,
                            name: p.name,
                            brand: brand.name,
                            price: Number(p.price_retail),
                            warehouseId: best.warehouse_id,
                            warehouseName: "—",
                            maxQty: best.qty,
                          });
                          toast.success("Добавлено в корзину", { description: p.name });
                        }}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> В корзину
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Мобильные карточки */}
        <div className="md:hidden flex flex-col gap-3">
          {q.data?.map((p) => {
            const totalQty = p.stock.reduce((s, r) => s + (r.qty || 0), 0);
            return (
              <Card key={p.id} className="p-4 flex flex-col gap-3">
                <div>
                  <div className="font-medium leading-tight">{p.name}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{p.sku}</div>
                  {!p.is_original && <Badge variant="outline" className="mt-1 font-normal">аналог</Badge>}
                </div>
                <div className="text-sm">
                  {totalQty > 0 ? <span className="text-foreground">{totalQty} шт.</span> : <span className="text-muted-foreground">Под заказ</span>}
                </div>
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
                  <div className="font-display text-lg font-semibold whitespace-nowrap">
                    {Number(p.price_retail).toLocaleString("ru-RU", { maximumFractionDigits: 0 })}&nbsp;₽
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={totalQty === 0}
                    onClick={() => {
                      const best = [...p.stock].filter((s) => s.qty > 0).sort((a, b) => b.qty - a.qty)[0];
                      if (!best) return;
                      cart.add({
                        productId: p.id, sku: p.sku, name: p.name,
                        brand: brand.name, price: Number(p.price_retail),
                        warehouseId: best.warehouse_id, warehouseName: "—",
                        maxQty: best.qty,
                      });
                      toast.success("Добавлено в корзину", { description: p.name });
                    }}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> В корзину
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        </div>
      )}


      <section className="mt-10 rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-xl uppercase tracking-tight">О бренде {brand.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {brand.description ?? `Оригинальные запчасти ${brand.name} в наличии на складах РДЭ в России. Доставка по всей стране, персональные цены для юридических лиц, гарантия от производителя.`}
        </p>
      </section>
    </div>
  );
}
