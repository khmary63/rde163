import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Truck, Shield, Users, FileText, RotateCw, MapPin, ArrowRight, Zap, Package, Headphones, Upload, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { warehouses, brands, reviews, blogPosts } from "@/data/mock";
import { formatNumber, formatDate } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ГРОСС Запчасти — B2B каталог запчастей для китайской спецтехники" },
      { name: "description", content: "40 000+ позиций в наличии на 8 складах по РФ. Персональные цены для юрлиц, заявка менеджеру за 30 секунд." },
    ],
  }),
  component: HomePage,
});

const trustItems = [
  { icon: Package, title: "40 000+ позиций", text: "Прямые поставки от производителей Китая" },
  { icon: Truck, title: "8 складов по РФ", text: "Самара, Москва, СПб, Новосибирск, Екатеринбург, Челябинск, Краснодар" },
  { icon: Shield, title: "Персональные скидки", text: "По договору для юрлиц — цены в кабинете" },
  { icon: Users, title: "Закреплённый менеджер", text: "Один контакт по всем вопросам" },
  { icon: FileText, title: "Документы в кабинете", text: "Счёт, счёт-фактура — в день заказа" },
  { icon: RotateCw, title: "Повтор заказа в 1 клик", text: "Шаблоны для регулярных закупок" },
];

const quickButtons = [
  { icon: Search, label: "Ищу по артикулу", to: "/catalog" },
  { icon: Layers, label: "Подобрать по бренду", to: "/catalog" },
  { icon: Headphones, label: "Помощь менеджера", to: "/contacts" },
  { icon: Upload, label: "Загрузить список", to: "/catalog" },
  { icon: Truck, label: "Под заказ из другого склада", to: "/catalog" },
];

const ctaCards = [
  { title: "Оформи договор сегодня", text: "Получи персональную скидку до 18% уже на первом заказе.", action: "Стать клиентом" },
  { title: "Стать партнёром", text: "Опт от 500 000 ₽ — индивидуальные условия и приоритетная отгрузка.", action: "Узнать детали" },
  { title: "Нужна консультация", text: "Подберём аналог или оригинал по фото / артикулу / VIN.", action: "Связаться" },
];

function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative border-b border-border/60 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand/10 blur-3xl" />

        <div className="relative mx-auto max-w-[1400px] px-4 py-20 lg:py-28 grid lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-status-in-stock animate-pulse" />
              СИСТЕМА ОНЛАЙН · 8 СКЛАДОВ
            </div>

            <h1 className="font-display text-5xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
              Запчасти для<br />
              <span className="text-brand">китайской спецтехники</span><br />
              без ручного поиска
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              SDLG, XCMG, Shantui, Shacman, HOWO, LiuGong. Введите артикул — увидите наличие, склад и цену с вашей скидкой. Заявка менеджеру за 30 секунд.
            </p>

            {/* Поисковая строка */}
            <div className="flex flex-col sm:flex-row gap-2 max-w-2xl">
              <div className="flex-1 flex items-center gap-2 rounded-md border-2 border-border bg-surface px-4 h-14 focus-within:border-brand transition-colors">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Артикул или наименование детали"
                  className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
                />
              </div>
              <Button asChild size="lg" className="h-14 px-8 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold text-base">
                <Link to="/catalog">Найти<ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickButtons.map((b) => (
                <Link key={b.label} to={b.to} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm hover:border-brand/60 hover:bg-surface transition-colors">
                  <b.icon className="h-4 w-4 text-brand" />
                  {b.label}
                </Link>
              ))}
            </div>
          </div>

          {/* «Нашёл за 30 секунд» */}
          <div className="rounded-lg border border-border bg-surface/80 p-6 lg:p-8 backdrop-blur shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="h-5 w-5 text-brand" />
              <span className="font-display tracking-wide uppercase text-sm">Нашёл за 30 секунд</span>
            </div>
            <ol className="space-y-5">
              {[
                { n: "01", t: "Введите артикул или название", d: "Каталог 40 000+ позиций, поиск по любому фрагменту" },
                { n: "02", t: "Сразу увидьте наличие и цену", d: "Со склада, с вашей персональной скидкой по договору" },
                { n: "03", t: "Отправьте заказ менеджеру", d: "Заявка уходит в CRM, документы — в личный кабинет" },
              ].map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="font-display text-2xl text-brand font-bold w-10 shrink-0">{s.n}</span>
                  <div>
                    <div className="font-semibold">{s.t}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section className="border-b border-border/60 bg-surface/30">
        <div className="mx-auto max-w-[1400px] px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { v: "40 000+", l: "позиций в каталоге" },
            { v: "8", l: "собственных складов" },
            { v: "10 000", l: "м² складских площадей" },
            { v: "10+", l: "брендов спецтехники" },
          ].map((s) => (
            <div key={s.l} className="text-center md:text-left">
              <div className="font-display text-4xl lg:text-5xl text-brand font-bold tabular-nums">{s.v}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Почему нам доверяют */}
      <section className="mx-auto max-w-[1400px] px-4 py-20">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <div className="font-mono text-xs text-brand uppercase tracking-widest mb-2">// почему нам доверяют</div>
            <h2 className="font-display text-3xl lg:text-5xl font-bold">Конкретика, а не обещания</h2>
          </div>
          <Button asChild variant="outline"><Link to="/contacts">Связаться<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-lg overflow-hidden">
          {trustItems.map((t) => (
            <div key={t.title} className="bg-surface/60 p-6 hover:bg-surface transition-colors">
              <t.icon className="h-7 w-7 text-brand mb-4" />
              <div className="font-display text-lg mb-1">{t.title}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{t.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Бренды */}
      <section className="border-y border-border/60 bg-surface/30">
        <div className="mx-auto max-w-[1400px] px-4 py-12">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6 text-center">
            Работаем с производителями
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {brands.map((b) => (
              <span key={b.id} className="font-display text-2xl text-muted-foreground/70 hover:text-foreground transition-colors">
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* «Не нашли деталь?» */}
      <section className="mx-auto max-w-[1400px] px-4 py-20">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center rounded-xl border border-brand/30 bg-gradient-to-br from-surface to-surface-2 p-8 lg:p-12">
          <div className="space-y-5">
            <div className="font-mono text-xs text-brand uppercase tracking-widest">// конверсионный блок</div>
            <h3 className="font-display text-3xl lg:text-4xl font-bold">Не нашли деталь?</h3>
            <p className="text-muted-foreground text-lg">
              Загрузите артикул, список или фото — менеджер подберёт оригинал или аналог в течение рабочего дня.
            </p>
            <ul className="space-y-2 text-sm">
              {["Подбор по фото и серийному номеру", "Сравнение оригинала и аналогов", "Расчёт логистики до вашего города"].map((x) => (
                <li key={x} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand" />{x}</li>
              ))}
            </ul>
          </div>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Артикул или название детали" className="w-full h-12 rounded-md border border-input bg-background px-4 text-sm focus:outline-none focus:border-brand" />
            <input type="tel" placeholder="Ваш телефон" className="w-full h-12 rounded-md border border-input bg-background px-4 text-sm focus:outline-none focus:border-brand" />
            <button type="button" className="w-full h-12 rounded-md border-2 border-dashed border-border bg-background/50 text-sm text-muted-foreground hover:border-brand hover:text-brand transition-colors flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" />Прикрепить файл или фото
            </button>
            <Button type="submit" size="lg" className="w-full bg-brand text-brand-foreground hover:bg-brand/90 font-semibold">
              Получить подбор от менеджера
            </Button>
          </form>
        </div>
      </section>

      {/* CTA сетка */}
      <section className="mx-auto max-w-[1400px] px-4 pb-20 grid md:grid-cols-3 gap-4">
        {ctaCards.map((c) => (
          <div key={c.title} className="rounded-lg border border-border bg-surface/60 p-6 flex flex-col gap-4 hover:border-brand/60 transition-colors">
            <h4 className="font-display text-xl">{c.title}</h4>
            <p className="text-sm text-muted-foreground flex-1">{c.text}</p>
            <Button variant="outline" className="w-full justify-between">
              {c.action}<ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </section>

      {/* Отзывы превью */}
      <section className="border-t border-border/60 bg-surface/30">
        <div className="mx-auto max-w-[1400px] px-4 py-20">
          <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
            <div>
              <div className="font-mono text-xs text-brand uppercase tracking-widest mb-2">// отзывы клиентов</div>
              <h2 className="font-display text-3xl lg:text-5xl font-bold">Что говорят покупатели</h2>
            </div>
            <Button asChild variant="outline"><Link to="/reviews">Все отзывы<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-background p-6 space-y-4">
                <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <span key={i} className="text-brand">★</span>)}</div>
                <p className="text-sm leading-relaxed text-foreground/90">«{r.text}»</p>
                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{r.author}</div>
                    {r.company && <div className="text-xs text-muted-foreground">{r.company}</div>}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{formatDate(r.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Блог превью */}
      <section className="mx-auto max-w-[1400px] px-4 py-20">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <div className="font-mono text-xs text-brand uppercase tracking-widest mb-2">// экспертный блог</div>
            <h2 className="font-display text-3xl lg:text-5xl font-bold">Полезные материалы</h2>
          </div>
          <Button asChild variant="outline"><Link to="/blog">Все статьи<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {blogPosts.map((p) => (
            <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }} className="group rounded-lg border border-border bg-surface/60 overflow-hidden hover:border-brand/60 transition-colors">
              <div className="aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `url(${p.cover})` }} />
              <div className="p-5 space-y-2">
                <div className="text-xs font-mono text-brand uppercase tracking-wider">{p.category}</div>
                <h4 className="font-display text-lg leading-tight group-hover:text-brand transition-colors">{p.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                <div className="text-xs font-mono text-muted-foreground pt-2">{formatDate(p.date)} · {p.readTime} мин</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Контакты + карта */}
      <section className="border-t border-border/60 bg-surface/30">
        <div className="mx-auto max-w-[1400px] px-4 py-20 grid lg:grid-cols-[1fr_1.5fr] gap-10">
          <div className="space-y-6">
            <div>
              <div className="font-mono text-xs text-brand uppercase tracking-widest mb-2">// контакты</div>
              <h2 className="font-display text-3xl lg:text-4xl font-bold">8 складов по России</h2>
              <p className="text-muted-foreground mt-3">Прямая отгрузка с ближайшего к вам склада. Самовывоз или транспортная компания на ваш выбор.</p>
            </div>
            <ul className="space-y-3">
              {warehouses.slice(0, 6).map((w) => (
                <li key={w.id} className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">{w.city}</div>
                    <div className="text-muted-foreground text-xs">{w.address}</div>
                  </div>
                </li>
              ))}
            </ul>
            <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90"><Link to="/contacts">Все контакты<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>

          {/* Заглушка карты */}
          <div className="relative rounded-lg border border-border bg-surface overflow-hidden min-h-[400px] grid-bg flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-brand/10" />
            <div className="text-center space-y-2 relative">
              <MapPin className="h-12 w-12 text-brand mx-auto" />
              <div className="font-display text-xl">Яндекс.Карта</div>
              <div className="text-sm text-muted-foreground max-w-xs">Интерактивная карта складов будет подключена на этапе бизнес-логики</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
