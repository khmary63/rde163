import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Truck, Shield, Users, FileText, RotateCw, MapPin, ArrowRight, ArrowUpRight, Zap, Package, Headphones, Upload, Layers, CheckCircle2, Activity, Radio, Cpu, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { warehouses, reviews, blogPosts } from "@/data/mock";
import { formatNumber, formatDate } from "@/lib/format";
import { LiveStockCounter } from "@/components/site/LiveStockCounter";
import { LiveStockTicker } from "@/components/site/LiveStockTicker";
import { HudCorner as Corner } from "@/components/site/HudCorner";
import heroImage from "@/assets/hero-hitech.jpg";
import sitrakTruck1 from "@/assets/sitrak-truck-1.jpg";
import sitrakTruck2 from "@/assets/sitrak-truck-2.jpg";
import sitrakFleet from "@/assets/sitrak-fleet.png";
import russiaMap from "@/assets/russia-map.png";
import warehouseSamara from "@/assets/warehouse-samara.jpg";
import warehouseSpb from "@/assets/warehouse-spb.jpg";
import warehouseKrasnodar from "@/assets/warehouse-krasnodar.jpg";
import warehouseEkaterinburg from "@/assets/warehouse-ekaterinburg.jpg";
import warehouseNovosibirsk from "@/assets/warehouse-novosibirsk.jpg";
import warehouseChelyabinsk from "@/assets/warehouse-chelyabinsk.jpg";
import warehouseMoscow from "@/assets/warehouse-moscow.jpg";
import managerKhabarov from "@/assets/manager-khabarov.jpg";
import warehouseSamaraAgropark from "@/assets/warehouse-samara-agropark.jpg";


const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Русский Дом Экспорта",
  alternateName: "РДЭ Запчасти",
  url: "https://rde163.ru",
  description: "B2B каталог запчастей для китайской спецтехники и грузовиков. 5 000+ позиций, 8 складов по РФ.",
  areaServed: "RU",
  sameAs: [],
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "РДЭ — B2B каталог запчастей для китайской техники" },
      { name: "description", content: "5 000+ наименований в наличии на 8 складах по РФ. Персональные цены для юрлиц, заявка менеджеру за 30 секунд." },
      { property: "og:title", content: "РДЭ — B2B каталог запчастей для китайской техники" },
      { property: "og:description", content: "5 000+ позиций, 8 складов по РФ, персональные цены для юрлиц." },
      { property: "og:url", content: "https://rde163.ru/" },
    ],
    links: [{ rel: "canonical", href: "https://rde163.ru/" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(organizationJsonLd) },
    ],
  }),
  component: HomePage,
});



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
            className="h-full w-full object-cover object-[20%_center]"
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
              SITRAK <span className="text-accent-orange font-extrabold">/</span> HOWO
            </span>
          </h1>

          {/* Подзаголовок + поиск */}
          <div className="mt-12 max-w-2xl">
            <div>
              <p className="text-base lg:text-lg text-foreground/80 max-w-2xl leading-relaxed">
                <span className="font-mono text-accent-orange font-bold">→</span> Официальный дистрибьютор запасных частей SITRAK и HOWO в Российской Федерации · Оригинал и аналоги · Введите артикул — получите наличие, склад и цену с вашей договорной скидкой.
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
                <span><span className="text-brand font-bold">●</span> 6700 SKU ИНДЕКСИРОВАНО</span>
              </div>
            </div>
          </div>

          {/* Боковая статистика — позиционирована над задним колесом грузовика */}
          <div className="hidden lg:flex absolute right-[6%] bottom-[14%] flex-col gap-1 font-mono text-right bg-background/85 backdrop-blur-md border border-border px-6 py-5 shadow-[0_20px_60px_-20px_oklch(0.20_0.013_250/0.35)]">
            <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/70">в реальном времени</div>
            <div className="font-display text-6xl font-bold tabular-nums text-accent-orange leading-none flex items-baseline justify-end gap-2">
              <LiveStockCounter fallback={5663} />
              <span className="relative flex h-2 w-2 self-center" aria-hidden>
                <span className="absolute inset-0 rounded-full bg-accent-orange animate-ping opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-orange" />
              </span>
            </div>
            <div className="text-xs text-foreground/75">наименований в наличии</div>
            <div className="mt-3 h-px w-full bg-border" />
            <div className="font-display text-3xl font-bold tabular-nums leading-none mt-3 text-accent-teal">~ 30 сек</div>
            <div className="text-xs text-foreground/75">на оформление заказа</div>
          </div>
        </div>

        {/* TICKER-лента — реальные остатки по брендам */}
        <LiveStockTicker />
      </section>

      {/* ============== BENTO: «Нашёл за 30 секунд» + сценарии ============== */}
      <section className="relative mx-auto max-w-[1480px] px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Заголовок секции */}
          <div className="lg:col-span-12 mb-2 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em] mb-3">/ 02 · о компании</div>
              <h2 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95]">
                О компании.<br />
                <span className="text-muted-foreground/60">Надёжность и масштаб.</span>
              </h2>
            </div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest hidden md:block">
              [ ГК ГРОСС ]
            </div>
          </div>

          {/* Вступление */}
          <div className="lg:col-span-12 border border-border bg-background p-8 lg:p-10">
            <p className="text-base lg:text-lg text-foreground/85 leading-relaxed max-w-4xl">
              Компания ООО «Русский Дом Экспорта» входит в состав <span className="font-semibold text-foreground">ГК ГРОСС</span>, что подтверждает её надёжность, устойчивость и высокий уровень компетенций в сфере поставок комплектующих для коммерческого транспорта и специализированной техники.
            </p>
          </div>

          {/* Филиальная сеть + карта */}
          <div className="lg:col-span-5 border border-border bg-surface/50 p-8 lg:p-10 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <h3 className="font-display text-2xl lg:text-3xl font-bold leading-tight">
                Развитая филиальная сеть и масштабная инфраструктура
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Деятельность компании охватывает ключевые регионы страны. Собственные филиалы «Русского Дома Экспорта» расположены в городах:
              </p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-mono">
                {["Санкт-Петербург", "Москва", "Краснодар", "Самара", "Челябинск", "Екатеринбург", "Новосибирск"].map((c) => (
                  <li key={c} className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-accent-blue shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <div className="font-display text-3xl lg:text-4xl font-bold text-accent-blue tabular-nums">10 150 м²</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">складских площадей</div>
              </div>
              <div>
                <div className="font-display text-3xl lg:text-4xl font-bold text-accent-blue tabular-nums">3 млрд ₽</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">складских запасов</div>
              </div>
            </div>
          </div>

          {/* Карта */}
          <div className="lg:col-span-7 border border-border bg-background p-4 lg:p-6 flex items-center justify-center">
            <img
              src={russiaMap}
              alt="Карта филиалов: Санкт-Петербург, Москва, Краснодар, Самара, Челябинск, Екатеринбург, Новосибирск"
              loading="lazy"
              className="w-full h-auto"
            />
          </div>

          {/* Описание ассортимента */}
          <div className="lg:col-span-12 border border-border bg-background p-8 lg:p-10 space-y-5">
            <h3 className="font-display text-2xl lg:text-3xl font-bold">
              Комплексный подход к товарам и услугам
            </h3>
            <p className="text-base text-foreground/85 leading-relaxed max-w-4xl">
              На складах компании представлены <span className="font-semibold text-foreground">более 5 000 наименований</span> оригинальных запасных частей — от расходных материалов до крупных узлов и агрегатов.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                "Детали для двигателей и трансмиссий",
                "Компоненты кузовов и кабин",
                "Гидравлическое и электрооборудование",
                "Элементы тормозных систем",
                "Фильтры и расходные материалы",
                "Запчасти для снятых с производства моделей",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 border-l-2 border-accent-orange pl-4 py-2">
                  <span className="text-sm text-foreground/85">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl pt-2">
              Все товары соответствуют строгим требованиям производителей техники и международным стандартам качества.<br />
              Поставляемые запасные части обеспечивают надёжную работу как современной техники, так и моделей, снятых с производства.
            </p>
          </div>
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
              / FEATURED
            </div>
            <h2 className="font-display font-bold leading-[0.85]">
              <span className="block text-[clamp(3rem,8vw,8rem)] text-accent-orange">SITRAK</span>
              <span className="block text-[clamp(1.5rem,3.5vw,3.5rem)] text-background mt-1">флагман нашего каталога</span>
            </h2>
            <p className="text-lg text-background/80 max-w-xl leading-relaxed">
              Важно! Если Вы ищете оригинальные запчасти на SITRAK и HOWO, обратите внимание на бренд CNHTC. В ООО "Русский дом экспорта" оригинальные запчасти идут именно под этим брендом.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { v: "2,5K+", l: "SKU" },
                { v: "98%", l: "со склада" },
                { v: "1–7", l: "дня доставка" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-accent-orange pl-4">
                  <div className="font-display text-3xl lg:text-4xl font-bold text-accent-orange tabular-nums">{s.v}</div>
                  <div className="text-xs text-background/70 mt-1">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="rounded-none bg-accent-orange text-accent-orange-foreground hover:bg-background hover:text-foreground font-display tracking-wide px-7 text-base shadow-[0_15px_40px_-10px_oklch(0.72_0.19_45/0.6)]">
                <Link to="/catalog">Каталог <ArrowUpRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-3 -left-3 right-3 bottom-3 border-2 border-accent-orange" />
            <div className="relative overflow-hidden">
              <img src={sitrakFleet} alt="Линейка SITRAK" loading="lazy" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ============== БЛОК 04 · Гарантии и сервис + галерея складов ============== */}
      <section className="mx-auto max-w-[1480px] px-6 py-24 lg:py-32">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em] mb-3">/ 04 · гарантии и сервис</div>
            <h2 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95]">
              Гарантия<br /><span className="text-muted-foreground/60">и забота о клиенте.</span>
            </h2>
          </div>
          <Button asChild variant="outline" className="rounded-none border-foreground hover:bg-foreground hover:text-background h-12 px-6">
            <Link to="/contacts">Связаться <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-px bg-border border border-border mb-16">
          <div className="bg-background p-8 lg:p-10 space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-7 w-7 text-accent-blue" strokeWidth={1.5} />
              <h3 className="font-display text-2xl font-bold">Гарантийные обязательства</h3>
            </div>
            <p className="text-base text-foreground/85 leading-relaxed">
              ООО «Русский Дом Экспорта» предоставляет гарантию на запасные части в соответствии с директивами заводов-изготовителей. Это обеспечивает клиентам уверенность в качестве приобретаемых компонентов и защищённость на протяжении всего гарантийного периода.
            </p>
          </div>
          <div className="bg-background p-8 lg:p-10 space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-7 w-7 text-accent-orange" strokeWidth={1.5} />
              <h3 className="font-display text-2xl font-bold">Персональный подход</h3>
            </div>
            <p className="text-base text-foreground/85 leading-relaxed">
              Мы придерживаемся принципа индивидуальной работы с каждым клиентом. Процессы обслуживания выстроены так, чтобы клиент получал не просто товар, а комплексное решение для бесперебойной работы своей техники.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Компания постоянно совершенствует внутренние процессы и расширяет складские запасы — это позволяет поддерживать долгосрочные партнёрские отношения с клиентами по всей стране.
            </p>
          </div>
        </div>

        {/* Галерея складов */}
        <div>
          <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
            <div>
              <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em] mb-2">/ наши склады</div>
              <h3 className="font-display text-2xl lg:text-3xl font-bold">Склады в наших филиалах</h3>
            </div>
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">8 складов · 10 150 м²</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { src: warehouseMoscow, city: "Москва", address: "Дмитровское ш., 100с2" },
              { src: warehouseSpb, city: "Санкт-Петербург", address: "Софийская ул., 14" },
              { src: warehouseSamara, city: "Самара", address: "ул. Демократическая, 63а" },
              { src: warehouseKrasnodar, city: "Краснодар", address: "ул. Уральская, 75/2" },
              { src: warehouseEkaterinburg, city: "Екатеринбург", address: "ул. Завокзальная, 29" },
              { src: warehouseChelyabinsk, city: "Челябинск", address: "Троицкий тракт, 11Б" },
              { src: warehouseNovosibirsk, city: "Новосибирск", address: "ул. Большевистская, 177" },
              { src: warehouseSamaraAgropark, city: "Самара Агропарк", address: "Агро-парк" },
            ].map((w) => (
              <figure key={w.city} className="group relative overflow-hidden border border-border bg-surface aspect-[4/3]">
                <img
                  src={w.src}
                  alt={`Склад «Русский Дом Экспорта» — ${w.city}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                <figcaption className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-0.5 text-background">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent-orange shrink-0" />
                    <span className="font-display text-base lg:text-lg font-bold tracking-tight">{w.city}</span>
                  </div>
                  <span className="text-xs text-background/80 pl-6">{w.address}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground max-w-lg">
              Прямая отгрузка с ближайшего склада.<br />Самовывоз или транспортная компания на ваш выбор.
            </p>
            <Link
              to="/contacts"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent-orange hover:text-foreground transition-colors"
            >
              Все контакты
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============== РЕГИОНАЛЬНЫЙ МЕНЕДЖЕР ============== */}
      <section className="mx-auto max-w-[1480px] px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-4 relative">
            <div className="absolute -top-3 -left-3 right-3 bottom-3 border-2 border-accent-orange pointer-events-none" />
            <div className="relative overflow-hidden border border-border bg-surface aspect-[3/4] max-w-[260px] mx-auto lg:mx-1">
              <img
                src={managerKhabarov}
                alt="Хабаров Роман Сергеевич — региональный менеджер по продажам ООО «Русский Дом Экспорта»"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em]">/ ваш менеджер</div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold leading-[0.95]">
              Хабаров<br />
              <span className="text-muted-foreground/60">Роман Сергеевич</span>
            </h2>
            <p className="text-base lg:text-lg text-foreground/80 leading-relaxed max-w-2xl">
              Региональный менеджер по продажам и администратор магазина.<br />
              Подберёт оригинал или аналог, рассчитает персональную цену и логистику до вашего города.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2 max-w-2xl">
              <a
                href="tel:+79372194926"
                className="group flex items-center gap-4 border border-border bg-background hover:border-accent-orange transition-colors p-5"
              >
                <div className="h-11 w-11 shrink-0 flex items-center justify-center bg-accent-orange/10 text-accent-orange group-hover:bg-accent-orange group-hover:text-accent-orange-foreground transition-colors">
                  <Headphones className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">телефон</div>
                  <div className="font-display text-base lg:text-lg font-bold tabular-nums">8 937-219-49-26</div>
                </div>
              </a>
              <a
                href="mailto:hrs@gross.ru"
                className="group flex items-center gap-4 border border-border bg-background hover:border-accent-blue transition-colors p-5"
              >
                <div className="h-11 w-11 shrink-0 flex items-center justify-center bg-accent-blue/10 text-accent-blue group-hover:bg-accent-blue group-hover:text-background transition-colors">
                  <FileText className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">e-mail</div>
                  <div className="font-display text-base lg:text-lg font-bold truncate">hrs@gross.ru</div>
                </div>
              </a>
            </div>
          </div>
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
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground whitespace-pre-line">// ЗАЯВКА{"\n\n"}</span>
              <span className="font-mono text-xs text-brand"></span>
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
    </div>
  );
}

