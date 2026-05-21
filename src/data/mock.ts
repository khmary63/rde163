// Моковые данные для прототипа интернет-магазина ГРОСС Запчасти
// На шаге B будут заменены на запросы к Lovable Cloud.
import blogSitrakHowoCover from "@/assets/blog-sitrak-howo-articul.jpg";
import blogSitrakHowoOriginalVsAnalog from "@/assets/blog-sitrak-howo-original-vs-analog.jpg";
import blogNadezhnayaSilovayaLiniya from "@/assets/blog-nadezhnaya-silovaya-liniya.jpg";


export type StockStatus = "in_stock" | "expected" | "out";

export type Warehouse = {
  id: string;
  city: string;
  address: string;
};

export type Brand = {
  id: string;
  name: string;
  logo?: string;
};

export type CatalogItem = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  isOriginal: boolean;
  characteristics: string;
  warehouseId: string;
  status: StockStatus;
  qty: number;
  expectedQty?: number;
  expectedDate?: string;
  basePrice: number; // в рублях
  category: string;
};

export type Manager = {
  id: string;
  name: string;
  phone: string;
  email: string;
  telegram?: string;
  whatsapp?: string;
  photo: string;
};

export type CurrentUser = {
  id: string;
  type: "individual" | "company";
  name: string;
  companyName?: string;
  inn?: string;
  email: string;
  phone: string;
  discountPercent: number;
  managerId: string;
};

export type OrderItem = {
  catalogItemId: string;
  qty: number;
  mode: "buy" | "reserve" | "preorder";
};

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  status: "draft" | "pending" | "processing" | "invoiced" | "completed" | "cancelled";
  items: OrderItem[];
  total: number;
  warehouseSplit: boolean;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: number;
  cover: string;
  body: string;
};

export type Review = {
  id: string;
  author: string;
  company?: string;
  rating: number;
  date: string;
  text: string;
  source: "site" | "yandex";
  reply?: string;
};

export const warehouses: Warehouse[] = [
  { id: "smr-d", city: "Самара", address: "ул. Демократическая, 63а" },
  { id: "smr-a", city: "Самара", address: "Агро-парк" },
  { id: "nsk", city: "Новосибирск", address: "ул. Большевистская, 177" },
  { id: "krd", city: "Краснодар", address: "ул. Уральская, 75/2" },
  { id: "msk", city: "Москва", address: "Дмитровское ш., 100с2" },
  { id: "spb", city: "Санкт-Петербург", address: "Софийская ул., 14" },
  { id: "ekb", city: "Екатеринбург", address: "ул. Завокзальная, 29" },
  { id: "chl", city: "Челябинск", address: "Троицкий тракт, 11Б" },
];

export const brands: Brand[] = [
  { id: "sdlg", name: "SDLG" },
  { id: "shantui", name: "Shantui" },
  { id: "xcmg", name: "XCMG" },
  { id: "liugong", name: "LiuGong" },
  { id: "lonking", name: "Lonking" },
  { id: "shacman", name: "Shacman" },
  { id: "howo", name: "HOWO" },
  { id: "foton", name: "Foton" },
  { id: "weichai", name: "Weichai" },
  { id: "fast", name: "Fast Gear" },
];

export const categories = [
  "Двигатель",
  "Трансмиссия",
  "Гидравлика",
  "Ходовая часть",
  "Электрика",
  "Кабина",
  "Тормозная система",
  "Фильтры",
];

const namesByCat: Record<string, string[]> = {
  "Двигатель": ["Фильтр масляный", "Прокладка ГБЦ", "Поршень", "Турбокомпрессор", "Помпа водяная", "Маслоохладитель"],
  "Трансмиссия": ["Диск сцепления", "Корзина сцепления", "Вал первичный", "Шестерня КПП", "Сальник вала"],
  "Гидравлика": ["Гидронасос основной", "РВД 1м", "Распределитель", "Гидроцилиндр стрелы", "Уплотнение штока"],
  "Ходовая часть": ["Башмак гусеницы", "Палец трака", "Опорный каток", "Натяжитель цепи", "Звёздочка ведущая"],
  "Электрика": ["Стартер", "Генератор", "АКБ 190А·ч", "Реле зарядки", "Жгут проводов кабины"],
  "Кабина": ["Стекло лобовое", "Зеркало боковое", "Кресло водителя", "Дверная ручка", "Замок зажигания"],
  "Тормозная система": ["Колодка тормозная", "Барабан тормозной", "Кран тормозной", "Шланг тормозной", "Камера тормозная"],
  "Фильтры": ["Фильтр воздушный", "Фильтр топливный", "Фильтр гидравлический", "Фильтр салона", "Фильтр сепаратора"],
};

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateCatalog(): CatalogItem[] {
  const r = rng(42);
  const items: CatalogItem[] = [];
  let counter = 1;
  for (const cat of categories) {
    const names = namesByCat[cat];
    for (const baseName of names) {
      // 2 варианта на наименование (разные склады/бренды)
      for (let v = 0; v < 2; v++) {
        const brand = brands[Math.floor(r() * brands.length)];
        const wh = warehouses[Math.floor(r() * warehouses.length)];
        const statusRoll = r();
        const status: StockStatus = statusRoll < 0.55 ? "in_stock" : statusRoll < 0.85 ? "expected" : "out";
        const qty = status === "in_stock" ? Math.floor(r() * 40) + 3 : 0;
        const expectedQty = status === "expected" ? Math.floor(r() * 25) + 2 : undefined;
        const isOriginal = r() > 0.35;
        const sku = `${brand.id.toUpperCase()}-${String(1000 + counter).padStart(5, "0")}`;
        const basePrice = Math.floor((r() * 48000 + 800) / 10) * 10;
        items.push({
          id: `it-${counter}`,
          name: baseName,
          sku,
          brand: brand.name,
          isOriginal,
          characteristics: cat === "Электрика" ? "12V/24V" : cat === "Гидравлика" ? "350 бар" : "стандарт",
          warehouseId: wh.id,
          status,
          qty,
          expectedQty,
          expectedDate: status === "expected" ? "через 14 дней" : undefined,
          basePrice,
          category: cat,
        });
        counter++;
      }
    }
  }
  return items;
}

export const catalogItems: CatalogItem[] = generateCatalog();

export const currentManager: Manager = {
  id: "mgr-1",
  name: "Иван Петров",
  phone: "+7 (846) 200-12-34",
  email: "i.petrov@gross-parts.ru",
  telegram: "@gross_petrov",
  whatsapp: "+78462001234",
  photo: "https://i.pravatar.cc/200?img=15",
};

export const adminContact = {
  name: "Администратор магазина",
  phone: "8 937-219-49-26",
  email: "hrs@gross.ru",
  telegram: "@gross_shop",
};

export const currentUser: CurrentUser = {
  id: "u-1",
  type: "company",
  name: "Алексей Смирнов",
  companyName: "ООО «СтройТехСервис»",
  inn: "6315012345",
  email: "smirnov@stroyteh.ru",
  phone: "+7 (901) 234-56-78",
  discountPercent: 12,
  managerId: "mgr-1",
};

export function priceWithDiscount(base: number, discountPercent: number): number {
  return Math.round(base * (1 - discountPercent / 100));
}

export const mockOrders: Order[] = [
  {
    id: "o-1",
    number: "ГР-2026-0142",
    createdAt: "2026-05-12",
    status: "invoiced",
    items: [
      { catalogItemId: "it-1", qty: 4, mode: "buy" },
      { catalogItemId: "it-3", qty: 2, mode: "buy" },
    ],
    total: 184500,
    warehouseSplit: false,
  },
  {
    id: "o-2",
    number: "ГР-2026-0151",
    createdAt: "2026-05-08",
    status: "completed",
    items: [
      { catalogItemId: "it-12", qty: 1, mode: "buy" },
      { catalogItemId: "it-21", qty: 6, mode: "reserve" },
    ],
    total: 67200,
    warehouseSplit: true,
  },
  {
    id: "o-3",
    number: "ГР-2026-0098",
    createdAt: "2026-04-28",
    status: "completed",
    items: [{ catalogItemId: "it-8", qty: 2, mode: "preorder" }],
    total: 312000,
    warehouseSplit: false,
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "nadezhnaya-silovaya-liniya",
    title: "Надежная силовая линия SITRAK: двигатели MC, коробки ZF и мосты SINOTRUK",
    excerpt:
      "Из чего складывается силовая линия SITRAK: двигатели серии MC по технологиям MAN, коробки ZF, мосты SINOTRUK с дисковыми и барабанными тормозами.",
    category: "Техника SITRAK",
    date: "2025-05-21",
    readTime: 6,
    cover: blogNadezhnayaSilovayaLiniya,
    body: "Двигатели серии МС, коробки ZF и мосты SINOTRUK — основа надежной силовой линии SITRAK для бизнеса без простоев.",
  },
  {
    slug: "original-ili-analog-sitrak-howo",
    title: "Оригинал или аналог: что выбрать для SITRAK и HOWO",
    excerpt:
      "Разбираем, чем оригинальные запчасти SINOTRUK отличаются от аналогов, какие альтернативы безопасны для SITRAK и HOWO и где экономия оборачивается простоем.",
    category: "Оригинал или аналог",
    date: "2025-05-21",
    readTime: 7,
    cover: blogSitrakHowoOriginalVsAnalog,
    body: "Владельцы грузовой техники SITRAK и HOWO часто сталкиваются с выбором между оригинальными запчастями и их аналогами.",
  },
  {
    slug: "podbor-zapchasti-sitrak-howo-po-artikulu",
    title: "Как подобрать запчасть для китайской спецтехники SITRAK и HOWO по артикулу",
    excerpt:
      "Пошаговый алгоритм: где найти каталожный номер SITRAK / HOWO, как сверить деталь по VIN, выбрать оригинал или аналог и не нарваться на подделку.",
    category: "Как подобрать запчасть",
    date: "2025-05-21",
    readTime: 9,
    cover: blogSitrakHowoCover,
    body: "Правильный подбор запчастей для SITRAK и HOWO по артикулу позволяет избежать простоев, ошибок при заказе и лишних затрат на ремонт.",
  },
  {
    slug: "kak-podobrat-zapchast-po-artikulu",
    title: "Как подобрать запчасть для китайской спецтехники по артикулу",
    excerpt: "Алгоритм точного подбора деталей за 5 минут — без ошибок и лишних звонков.",
    category: "Как подобрать запчасть",
    date: "2026-05-10",
    readTime: 6,
    cover: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200",
    body: "Подробный гайд по подбору запчастей по артикулу. Шаг 1 — найдите артикул на корпусе детали или в сервисной книге. Шаг 2 — сверьте с прайсом. Шаг 3 — уточните склад и срок поставки.",
  },
  {
    slug: "original-ili-analog",
    title: "Оригинал или аналог: что выбрать для SDLG, XCMG и Shantui",
    excerpt: "Разбираем на конкретных примерах, когда аналог сэкономит до 40%, а когда обернётся простоем.",
    category: "Оригинал или аналог",
    date: "2026-05-03",
    readTime: 8,
    cover: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200",
    body: "Аналоги от проверенных производителей часто не уступают оригиналу по ресурсу, но могут отличаться по геометрии посадочных мест.",
  },
  {
    slug: "tipovye-neispravnosti-frontalnyh-pogruzchikov",
    title: "Типовые неисправности фронтальных погрузчиков SDLG L956",
    excerpt: "Топ-7 неисправностей по статистике сервисных центров за 2025 год.",
    category: "Типовые неисправности",
    date: "2026-04-22",
    readTime: 10,
    cover: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1200",
    body: "По статистике наших сервисных центров чаще всего встречаются: перегрев гидросистемы, износ опорных катков, выход из строя стартера в зимний период.",
  },
];

export const reviews: Review[] = [
  {
    id: "r-1",
    author: "Дмитрий К.",
    company: "ООО «ДорСтройМеханизация»",
    rating: 5,
    date: "2026-05-09",
    text: "Заказывали гидронасос на SDLG L958 — нашли в наличии в Новосибирске, пришёл за 4 дня. Цена с нашей скидкой по договору — лучшая из 5 поставщиков, к которым обращались.",
    source: "site",
    reply: "Дмитрий, спасибо за отзыв! Готовы к следующим заказам — менеджер Иван Петров на связи.",
  },
  {
    id: "r-2",
    author: "Сергей М.",
    company: "ИП Морозов С.А.",
    rating: 5,
    date: "2026-05-04",
    text: "Шаблоны заказов в кабинете — отдельное спасибо. Раз в месяц повторяю заявку на расходники для парка из 3 самосвалов Shacman, экономит 30 минут.",
    source: "site",
  },
  {
    id: "r-3",
    author: "Анна В.",
    rating: 4,
    date: "2026-04-28",
    text: "Хорошее наличие по фильтрам, оригинальные Weichai. Из минусов — хотелось бы видеть больше характеристик в карточке.",
    source: "yandex",
  },
  {
    id: "r-4",
    author: "Роман Т.",
    company: "Карьер «Северный»",
    rating: 5,
    date: "2026-04-15",
    text: "Башмаки гусениц на бульдозер Shantui SD16 — забронировали поставку за 2 недели до прихода, как только пришли — сразу выкупили. Удобная логика брони.",
    source: "yandex",
  },
  {
    id: "r-5",
    author: "Виктор Л.",
    rating: 5,
    date: "2026-04-02",
    text: "Менеджер Иван — оперативно, по делу, без воды. Документы приходят в кабинет в тот же день.",
    source: "site",
  },
];
