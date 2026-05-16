import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Truck, Shield, Users, FileText, RotateCw, MapPin, ArrowRight, ArrowUpRight, Zap, Package, Headphones, Upload, Layers, CheckCircle2, Activity, Radio, Cpu, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { warehouses, brands, reviews, blogPosts } from "@/data/mock";
import { formatNumber, formatDate } from "@/lib/format";
import heroImage from "@/assets/hero-hitech.jpg";
import sitrakTruck1 from "@/assets/sitrak-truck-1.jpg";
import sitrakTruck2 from "@/assets/sitrak-truck-2.jpg";
import sitrakFleet from "@/assets/sitrak-fleet.png";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Русский Дом Экспорта — B2B каталог запчастей для китайской спецтехники" },
      { name: "description", content: "40 000+ позиций в наличии на 8 складах по РФ. Персональные цены для юрлиц, заявка менеджеру за 30 секунд." },
    ],
  }),
  component: HomePage,
});

const trustItems = [
  { icon: Package, title: "40 000+ позиций", text: "Прямые поставки от производителей Китая", code: "SKU.40K" },
  { icon: Truck, title: "8 складов по РФ", text: "Самара, Москва, СПб, Новосибирск, Екатеринбург", code: "WH.08" },
  { icon: Shield, title: "Персональные скидки", text: "По договору для юрлиц — цены в кабинете", code: "B2B.PRC" },
  { icon: Users, title: "Закреплённый менеджер", text: "Один контакт по всем вопросам", code: "PM.01" },
  { icon: FileText, title: "Документы в день заказа", text: "Счёт, счёт-фактура — в личный кабинет", code: "DOC.D0" },
  { icon: RotateCw, title: "Повтор заказа в 1 клик", text: "Шаблоны для регулярных закупок", code: "TPL.X1" },
];

const tickerItems = [
  "SDLG · в наличии 4 218 поз.",
  "XCMG · в наличии 3 904 поз.",
  "SHANTUI · в наличии 2 117 поз.",
  "SHACMAN · в наличии 5 442 поз.",
  "HOWO · в наличии 6 081 поз.",
  "LIUGONG · в наличии 1 873 поз.",
  "ZOOMLION · в наличии 992 поз.",
  "FOTON · в наличии 2 055 поз.",
];

function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ============== HI-TECH HERO ============== */}
      <section className="relative">
        {/* Статичная подложка — SITRAK */}
        <div className="absolute inset-0 overflow-hidden bg-accent-blue">
          <img
            src={sitrakTruck1}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
          />
          {/* Светлый градиент-вуаль слева, чтобы текст читался */}
          <div className="absolute inset-0 bg-[linear-gradient(95deg,oklch(0.99_0.002_240/0.96)_0%,oklch(0.99_0.002_240/0.85)_38%,oklch(0.99_0.002_240/0.4)_62%,oklch(0.42_0.18_258/0.2)_100%)]" />
          <div className="absolute inset-0 grid-bg opacity-25" />
          {/* Цветные блики */}
          <div className="absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-accent-orange/25 blur-3xl" />
          <div className="absolute top-10 right-1/4 h-[340px] w-[340px] rounded-full bg-accent-blue/35 blur-3xl" />
        </div>

        {/* HUD-углы */}
        <Corner className="top-4 left-4" pos="tl" color="orange" />
        <Corner className="top-4 right-4" pos="tr" color="brand" />

        {/* Координаты-метки */}
        <div className="absolute top-6 right-1/2 translate-x-1/2 hidden lg:flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
          <span className="h-px w-8 bg-accent-orange" />
          <span>SYS · РДЭ · v2026.05</span>
          <span className="h-px w-8 bg-brand" />
        </div>

        <div className="relative mx-auto max-w-[1480px] px-6 pt-20 pb-32 lg:pt-28 lg:pb-40">
          {/* Метка-чип */}
          <div className="inline-flex items-center gap-3 rounded-full border-2 border-accent-orange bg-background/90 backdrop-blur px-4 py-1.5 text-xs font-mono tracking-widest uppercase shadow-[0_8px_30px_-10px_oklch(0.72_0.19_45/0.6)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-orange opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-orange" />
            </span>
            <span className="text-foreground">live</span>
            <span className="h-3 w-px bg-border" />
            <span className="text-accent-orange font-bold">8 СКЛАДОВ ОНЛАЙН</span>
          </div>

          {/* Гигантский заголовок */}
          <h1 className="mt-10 font-display font-bold leading-[0.85] tracking-tight">
            <span className="block text-[clamp(3.5rem,9vw,9.5rem)]">ЗАПЧАСТИ</span>
            <span className="block text-[clamp(2.2rem,5.5vw,5.5rem)] text-muted-foreground/70 mt-2">
              для <span className="text-accent-orange font-extrabold">SITRAK</span>, SDLG,<br className="hidden lg:block"/> XCMG, HOWO и других
            </span>
            <span className="block text-[clamp(2rem,4.5vw,4.5rem)] mt-4">
              в один экран. <span className="font-mono text-brand text-[0.7em] align-middle">/</span> в одну минуту.
            </span>
          </h1>

          {/* Подзаголовок + поиск */}
          <div className="mt-12 grid lg:grid-cols-[1.4fr_auto] gap-10 items-end max-w-[1100px]">
            <div>
              <p className="text-base lg:text-lg text-foreground/80 max-w-2xl leading-relaxed">
                <span className="font-mono text-accent-orange font-bold">→</span> Официальный спрос на SITRAK · оригинал и аналоги. Введите артикул — получите наличие, склад и цену с вашей договорной скидкой.
              </p>

              {/* Поисковая строка */}
              <div className="mt-7 flex flex-col sm:flex-row gap-2 max-w-2xl">
                <div className="flex-1 flex items-center gap-3 rounded-none border-b-2 border-foreground bg-background/80 backdrop-blur px-4 h-16 focus-within:border-accent-orange transition-colors">
                  <span className="font-mono text-xs text-accent-orange tracking-widest font-bold">01</span>
                  <span className="h-6 w-px bg-border" />
                  <Search className="h-5 w-5 text-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="Артикул, OEM-номер или название"
                    className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground/60"
                  />
                </div>
                <Button asChild size="lg" className="h-16 px-8 rounded-none bg-accent-orange text-accent-orange-foreground hover:bg-foreground hover:text-background font-display tracking-wide text-base group shadow-[0_15px_40px_-10px_oklch(0.72_0.19_45/0.6)]">
                  <Link to="/catalog">
                    НАЙТИ
                    <ArrowUpRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
                <span><span className="text-accent-orange font-bold">⌘K</span> быстрый поиск</span>
                <span><span className="text-accent-orange font-bold">↵</span> отправить</span>
                <span><span className="text-brand font-bold">●</span> 40 132 SKU индексировано</span>
              </div>
            </div>

            {/* Боковая статистика — стек */}
            <div className="hidden lg:flex flex-col gap-1 font-mono text-right">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">в реальном времени</div>
              <div className="font-display text-6xl font-bold tabular-nums text-accent-orange leading-none">40K+</div>
              <div className="text-xs text-muted-foreground">позиций в наличии</div>
              <div className="mt-3 h-px w-full bg-border" />
              <div className="font-display text-3xl font-bold tabular-nums leading-none mt-3 text-accent-teal">~ 30 сек</div>
              <div className="text-xs text-muted-foreground">от запроса до КП</div>
            </div>
          </div>
        </div>

        {/* TICKER-лента */}
        <div className="relative border-y-2 border-foreground bg-foreground text-background overflow-hidden">
          <div className="flex items-center">
            <div className="shrink-0 border-r border-background/20 bg-accent-orange text-accent-orange-foreground px-5 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2 font-bold">
              <Radio className="h-3.5 w-3.5 animate-pulse" /> live · stock
            </div>
            <div className="relative flex-1 overflow-hidden">
              <div className="flex gap-10 whitespace-nowrap py-3 animate-[ticker_40s_linear_infinite] font-mono text-sm">
                {[...tickerItems, ...tickerItems, ...tickerItems].map((t, i) => (
                  <span key={i} className="flex items-center gap-3">
                    <span className="text-accent-orange">▸</span>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== BENTO: «Нашёл за 30 секунд» + сценарии ============== */}
      <section className="relative mx-auto max-w-[1480px] px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-4">
          {/* Заголовок секции — большой */}
          <div className="lg:col-span-12 mb-6 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em] mb-3">/ 02 · workflow</div>
              <h2 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95]">
                Минимум кликов.<br />
                <span className="text-muted-foreground/60">Максимум фактов.</span>
              </h2>
            </div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest hidden md:block">
              [ 03 / шага ]
            </div>
          </div>

          {/* 3 шага */}
          {[
            { n: "01", t: "Поиск", d: "Артикул, OEM или название. Каталог 40 000+ позиций.", icon: Search },
            { n: "02", t: "Наличие", d: "Сразу: склад, цена с вашей скидкой, срок отгрузки.", icon: Activity },
            { n: "03", t: "Заявка", d: "Один клик — менеджер, документы и счёт в кабинете.", icon: Send },
          ].map((s, idx) => (
            <div
              key={s.n}
              className="lg:col-span-4 group relative border border-border bg-background hover:bg-surface transition-colors p-8 lg:p-10 overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand/0 group-hover:bg-brand/10 blur-3xl transition-all duration-500" />
              <div className="flex items-start justify-between mb-12">
                <span className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">шаг · {s.n}</span>
                <s.icon className="h-5 w-5 text-foreground/40 group-hover:text-brand transition-colors" />
              </div>
              <div className="font-display text-7xl lg:text-8xl font-bold text-foreground/10 group-hover:text-brand/30 transition-colors leading-none mb-6 tabular-nums">
                {s.n}
              </div>
              <h3 className="font-display text-2xl mb-2">{s.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              {idx < 2 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 z-10 h-3 w-3 rotate-45 border-r border-t border-brand bg-background" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============== SITRAK SPOTLIGHT — яркий оранжевый блок ============== */}
      <section className="relative border-y-2 border-foreground bg-foreground text-background overflow-hidden">
        <div className="absolute inset-0">
          <img src={sitrakTruck2} alt="" aria-hidden loading="lazy" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.20_0.013_250/0.95)_0%,oklch(0.20_0.013_250/0.7)_50%,oklch(0.20_0.013_250/0.4)_100%)]" />
          <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-accent-orange/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1480px] px-6 py-24 lg:py-32 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-3 border border-accent-orange bg-accent-orange/10 px-3 py-1.5 font-mono text-[11px] tracking-[0.3em] uppercase text-accent-orange">
              <span className="h-2 w-2 rounded-full bg-accent-orange animate-pulse" />
              / featured · spotlight
            </div>
            <h2 className="font-display font-bold leading-[0.85]">
              <span className="block text-[clamp(3rem,8vw,8rem)] text-accent-orange">SITRAK</span>
              <span className="block text-[clamp(1.5rem,3.5vw,3.5rem)] text-background mt-1">флагман нашего каталога</span>
            </h2>
            <p className="text-lg text-background/80 max-w-xl leading-relaxed">
              Карьерные самосвалы, тягачи C7H, MAX, T7H. <span className="text-accent-orange font-bold">12 000+ артикулов</span> только по линейке SITRAK — двигатели, ТНВД, мосты, кабина, расходники.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { v: "12K+", l: "SKU SITRAK" },
                { v: "98%", l: "со склада" },
                { v: "1–3", l: "дня доставка" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-accent-orange pl-4">
                  <div className="font-display text-3xl lg:text-4xl font-bold text-accent-orange tabular-nums">{s.v}</div>
                  <div className="text-xs text-background/70 mt-1">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="rounded-none bg-accent-orange text-accent-orange-foreground hover:bg-background hover:text-foreground font-display tracking-wide px-7 text-base shadow-[0_15px_40px_-10px_oklch(0.72_0.19_45/0.6)]">
                <Link to="/catalog">Каталог SITRAK <ArrowUpRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-none border-background bg-transparent text-background hover:bg-background hover:text-foreground px-7 text-base">
                <Link to="/contacts">Запросить КП</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-3 -left-3 right-3 bottom-3 border-2 border-accent-orange" />
            <div className="relative overflow-hidden">
              <img src={sitrakFleet} alt="Линейка SITRAK" loading="lazy" className="w-full h-auto object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/90 to-transparent p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-accent-orange mb-1">/ серия c7h · max · t7h</div>
                <div className="font-display text-xl text-background">Полная линейка тягачей и самосвалов</div>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 bg-accent-orange text-accent-orange-foreground px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold">
              IN STOCK
            </div>
          </div>
        </div>
      </section>

      {/* ============== ASYMMETRIC: бренды + большая цифра ============== */}
      <section className="relative border-y border-border bg-surface/50">
        <div className="mx-auto max-w-[1480px] px-6 py-20 grid lg:grid-cols-[auto_1fr] gap-12 items-center">
          <div className="space-y-3">
            <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em]">/ 03 · partners</div>
            <div className="font-display font-bold leading-[0.85]">
              <div className="text-7xl lg:text-9xl tabular-nums">10<span className="text-accent-blue">+</span></div>
              <div className="text-xl lg:text-2xl text-muted-foreground mt-2">брендов · прямые поставки</div>
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border border border-border">
              {brands.slice(0, 10).map((b) => (
                <div key={b.id} className="bg-background flex items-center justify-center h-24 group hover:bg-surface transition-colors">
                  <span className="font-display text-xl tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                    {b.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== «Почему нам доверяют» — терминал-стиль ============== */}
      <section className="mx-auto max-w-[1480px] px-6 py-24 lg:py-32">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em] mb-3">/ 04 · why us</div>
            <h2 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95]">
              Конкретика,<br />не обещания.
            </h2>
          </div>
          <Button asChild variant="outline" className="rounded-none border-foreground hover:bg-foreground hover:text-background h-12 px-6">
            <Link to="/contacts">Связаться <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {trustItems.map((t) => (
            <div key={t.title} className="bg-background p-8 group hover:bg-surface transition-colors relative">
              <div className="absolute top-4 right-4 font-mono text-[10px] tracking-widest text-muted-foreground/60">
                {t.code}
              </div>
              <t.icon className="h-7 w-7 text-foreground group-hover:text-accent-blue transition-colors mb-6" strokeWidth={1.5} />
              <div className="font-display text-xl mb-2">{t.title}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{t.text}</div>
              <div className="absolute bottom-0 left-0 h-px w-0 bg-accent-blue group-hover:w-full transition-all duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* ============== «Не нашли деталь?» — split panel ============== */}
      <section className="relative border-y border-border bg-foreground text-background overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute -top-20 -right-20 h-[500px] w-[500px] rounded-full bg-accent-teal/30 blur-3xl" />

        <div className="relative mx-auto max-w-[1480px] px-6 py-24 grid lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
          <div className="space-y-6">
            <div className="font-mono text-[11px] text-accent-teal uppercase tracking-[0.3em]">/ 05 · custom request</div>
            <h2 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95]">
              Не нашли деталь?<br />
              <span className="text-accent-teal">Найдём за вас.</span>
            </h2>
            <p className="text-lg text-background/70 max-w-xl leading-relaxed">
              Загрузите артикул, список или фото — менеджер подберёт оригинал или аналог в течение рабочего дня.
            </p>
            <ul className="space-y-3 text-sm text-background/85">
              {["Подбор по фото и серийному номеру", "Сравнение оригинал ↔ аналог", "Расчёт логистики до вашего города"].map((x) => (
                <li key={x} className="flex items-center gap-3">
                  <span className="h-px w-6 bg-accent-teal" />{x}
                </li>
              ))}
            </ul>
          </div>

          <form className="relative space-y-3 bg-background text-foreground p-8 border border-accent-teal/40 shadow-[0_30px_80px_-20px_oklch(0.72_0.13_195/0.5)]" onSubmit={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">// заявка</span>
              <span className="font-mono text-xs text-brand">REQ-{Math.floor(Math.random() * 9000 + 1000)}</span>
            </div>
            <input type="text" placeholder="Артикул или название детали" className="w-full h-12 border border-border bg-background px-4 text-sm focus:outline-none focus:border-accent-teal rounded-none" />
            <input type="tel" placeholder="Ваш телефон" className="w-full h-12 border border-border bg-background px-4 text-sm focus:outline-none focus:border-accent-teal rounded-none" />
            <button type="button" className="w-full h-12 border border-dashed border-border bg-background text-sm text-muted-foreground hover:border-accent-teal hover:text-accent-teal transition-colors flex items-center justify-center gap-2 rounded-none">
              <Upload className="h-4 w-4" />Прикрепить файл или фото
            </button>
            <Button type="submit" size="lg" className="w-full rounded-none bg-foreground text-background hover:bg-accent-teal hover:text-accent-teal-foreground font-display tracking-wide h-12">
              ОТПРАВИТЬ → МЕНЕДЖЕР
            </Button>
          </form>
        </div>
      </section>

      {/* ============== ОТЗЫВЫ ============== */}
      <section className="mx-auto max-w-[1480px] px-6 py-24 lg:py-32">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em] mb-3">/ 06 · feedback</div>
            <h2 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95]">Что говорят<br/>покупатели</h2>
          </div>
          <Button asChild variant="outline" className="rounded-none border-foreground hover:bg-foreground hover:text-background h-12 px-6">
            <Link to="/reviews">Все отзывы <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
          {reviews.slice(0, 3).map((r) => (
            <div key={r.id} className="bg-background p-8 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5 text-accent-orange text-lg">{Array.from({ length: r.rating }).map((_, i) => <span key={i}>★</span>)}</div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">verified</span>
              </div>
              <p className="text-base leading-relaxed text-foreground/90">«{r.text}»</p>
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{r.author}</div>
                  {r.company && <div className="text-xs text-muted-foreground">{r.company}</div>}
                </div>
                <span className="text-xs font-mono text-muted-foreground">{formatDate(r.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============== БЛОГ ============== */}
      <section className="border-t border-border bg-surface/50">
        <div className="mx-auto max-w-[1480px] px-6 py-24">
          <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
            <div>
              <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em] mb-3">/ 07 · journal</div>
              <h2 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95]">Экспертный<br/>блог</h2>
            </div>
            <Button asChild variant="outline" className="rounded-none border-foreground hover:bg-foreground hover:text-background h-12 px-6">
              <Link to="/blog">Все статьи <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
            {blogPosts.map((p, i) => (
              <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }} className="group bg-background overflow-hidden flex flex-col">
                <div className="relative aspect-[16/10] bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url(${p.cover})` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
                  <div className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-widest text-background bg-foreground/70 backdrop-blur px-2 py-1">
                    /{String(i + 1).padStart(2, '0')} · {p.category}
                  </div>
                </div>
                <div className="p-6 space-y-3 flex-1 flex flex-col">
                  <h4 className="font-display text-xl leading-tight group-hover:text-accent-blue transition-colors flex-1">{p.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                  <div className="text-xs font-mono text-muted-foreground pt-2 flex items-center justify-between">
                    <span>{formatDate(p.date)} · {p.readTime} мин</span>
                    <ArrowUpRight className="h-4 w-4 group-hover:text-brand transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============== КОНТАКТЫ + СКЛАДЫ ============== */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1480px] px-6 py-24 grid lg:grid-cols-[1fr_1.5fr] gap-12">
          <div className="space-y-7">
            <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em]">/ 08 · network</div>
            <h2 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95]">8 складов<br/>по России</h2>
            <p className="text-muted-foreground text-lg max-w-md">
              Прямая отгрузка с ближайшего склада. Самовывоз или транспортная компания на ваш выбор.
            </p>
            <Button asChild className="rounded-none bg-foreground text-background hover:bg-accent-blue hover:text-accent-blue-foreground h-12 px-6">
              <Link to="/contacts">Все контакты <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <ul className="grid sm:grid-cols-2 gap-px bg-border border border-border">
            {warehouses.slice(0, 8).map((w, i) => (
              <li key={w.id} className="bg-background p-6 flex items-start gap-4 group hover:bg-surface transition-colors">
                <div className="font-mono text-xs text-muted-foreground tabular-nums">/{String(i + 1).padStart(2, '0')}</div>
                <div className="flex-1">
                  <div className="font-display text-xl mb-1 group-hover:text-accent-blue transition-colors">{w.city}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{w.address}</div>
                </div>
                <MapPin className="h-4 w-4 text-foreground/30 group-hover:text-accent-blue transition-colors mt-1" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

/* HUD-уголки */
function Corner({ className = "", pos, color = "brand" }: { className?: string; pos: "tl" | "tr" | "bl" | "br"; color?: "brand" | "orange" }) {
  const map = {
    tl: "border-l border-t",
    tr: "border-r border-t",
    bl: "border-l border-b",
    br: "border-r border-b",
  };
  const colorClass = color === "orange" ? "border-accent-orange" : "border-brand";
  return (
    <div className={`pointer-events-none absolute z-10 h-6 w-6 ${colorClass} ${map[pos]} ${className}`} />
  );
}

/* Иконка-плейсхолдер для шагов */
function Send(props: { className?: string }) {
  return <ArrowUpRight {...props} />;
}
