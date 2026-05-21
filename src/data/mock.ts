// Моковые данные для прототипа интернет-магазина ГРОСС Запчасти
// На шаге B будут заменены на запросы к Lovable Cloud.
import blogSitrakHowoCover from "@/assets/blog-sitrak-howo-articul.jpg";
import blogSitrakHowoOriginalVsAnalog from "@/assets/blog-sitrak-howo-original-vs-analog.jpg";
import blogNadezhnayaSilovayaLiniya from "@/assets/blog-nadezhnaya-silovaya-liniya.jpg";
import blogMoshchnostEkonomiya from "@/assets/blog-moshchnost-ekonomiya.jpg";
import blogMoshchnyyNadezhnyy from "@/assets/blog-moshchnyy-nadezhnyy-dvigatel.jpg";
import blogModifitsirovannayaMoshchnost from "@/assets/blog-modifitsirovannaya-moshchnost.jpg";


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
  updatedAt?: string;
  readTime: number;
  cover: string;
  body: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
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
    slug: "modifitsirovannaya-moshchnost",
    title: "Модифицированная мощность: двигатели MC13 для SITRAK C7H 6×6",
    seoTitle: "Двигатели MC13.48-50 и MC13.54-50 для SITRAK C7H 6×6",
    excerpt:
      "Полноприводный SITRAK C7H с двигателями MC13.48-50 и MC13.54-50: до 540 л. с., крутящий момент до 2500 Нм и моторный тормоз EVB для тяжёлых условий.",
    seoDescription:
      "Технические характеристики двигателей MC13.48-50 и MC13.54-50 для полноприводного SITRAK C7H 6×6: мощность до 540 л.с., момент 2500 Нм, тормоз EVB.",
    keywords: ["SITRAK C7H 6x6", "двигатель MC13.48-50", "двигатель MC13.54-50", "запчасти SITRAK", "моторный тормоз EVB"],
    category: "Техника SITRAK",
    date: "2024-05-21",
    updatedAt: "2024-05-21",
    readTime: 4,
    cover: blogModifitsirovannayaMoshchnost,
    body: "Обновлённый полноприводный SITRAK C7H оснащается флагманскими двигателями серии MC13, разработанными на базе технологий MAN.",
  },
  {
    slug: "moshchnyy-i-nadezhnyy-dvigatel",
    title: "Мощный и надежный двигатель SITRAK C7H MAX",
    seoTitle: "Двигатели MC13 для SITRAK C7H MAX: характеристики и ресурс",
    excerpt:
      "Двигатели серии MC13.48-50 и MC13.54-50 для SITRAK C7H MAX: мощность от 480 л. с., крутящий момент до 2500 Нм, экономичность и моторный тормоз EVB.",
    seoDescription:
      "Обзор двигателей MC13.48-50 и MC13.54-50 для SITRAK C7H MAX: мощность от 480 л.с., момент до 2500 Нм, моторный тормоз EVB и низкий расход топлива.",
    keywords: ["SITRAK C7H MAX", "двигатель MC13", "запчасти SITRAK", "MC13.48-50", "MC13.54-50", "EVB"],
    category: "Техника SITRAK",
    date: "2024-05-21",
    updatedAt: "2024-05-21",
    readTime: 4,
    cover: blogMoshchnyyNadezhnyy,
    body: "Обновленный SITRAK C7H MAX оснащен проверенными и надежными двигателями серии MC.",
  },
  {
    slug: "moshchnost-i-ekonomiya-topliva",
    title: "Мощность и экономия топлива: двигатели MC13 для SITRAK C9H",
    seoTitle: "Двигатели MC13.48-50A и MC13.54-50A для SITRAK C9H",
    excerpt:
      "Версии MC13.48-50A (480 л. с.) и MC13.54-50A (540 л. с.), обновлённый моторный тормоз EVB до 370 кВт и широкий диапазон крутящего момента 900–1400 об/мин.",
    seoDescription:
      "Двигатели MC13.48-50A и MC13.54-50A для SITRAK C9H: 480–540 л.с., момент в диапазоне 900–1400 об/мин и моторный тормоз EVB до 370 кВт.",
    keywords: ["SITRAK C9H", "двигатель MC13.48-50A", "двигатель MC13.54-50A", "запчасти SITRAK", "EVB 370 кВт"],
    category: "Техника SITRAK",
    date: "2024-05-21",
    updatedAt: "2024-05-21",
    readTime: 5,
    cover: blogMoshchnostEkonomiya,
    body: "SITRAK C9H оснащен передовыми двигателями серии MC13, разработанными для оптимального баланса мощности и топливной экономичности.",
  },
  {
    slug: "nadezhnaya-silovaya-liniya",
    title: "Надежная силовая линия SITRAK: двигатели MC, коробки ZF и мосты SINOTRUK",
    seoTitle: "Силовая линия SITRAK: двигатели MC, коробки ZF, мосты SINOTRUK",
    excerpt:
      "Из чего складывается силовая линия SITRAK: двигатели серии MC по технологиям MAN, коробки ZF, мосты SINOTRUK с дисковыми и барабанными тормозами.",
    seoDescription:
      "Силовая линия SITRAK: двигатели MC на технологиях MAN, коробки передач ZF, мосты SINOTRUK с дисковыми и барабанными тормозами — обзор и характеристики.",
    keywords: ["силовая линия SITRAK", "двигатели MC", "коробка ZF", "мосты SINOTRUK", "запчасти SITRAK", "MAN технологии"],
    category: "Техника SITRAK",
    date: "2024-05-21",
    updatedAt: "2024-05-21",
    readTime: 6,
    cover: blogNadezhnayaSilovayaLiniya,
    body: "Двигатели серии МС, коробки ZF и мосты SINOTRUK — основа надежной силовой линии SITRAK для бизнеса без простоев.",
  },
  {
    slug: "original-ili-analog-sitrak-howo",
    title: "Оригинал или аналог: что выбрать для SITRAK и HOWO",
    seoTitle: "Оригинал или аналог запчастей SITRAK и HOWO: что выбрать",
    excerpt:
      "Разбираем, чем оригинальные запчасти SINOTRUK отличаются от аналогов, какие альтернативы безопасны для SITRAK и HOWO и где экономия оборачивается простоем.",
    seoDescription:
      "Когда брать оригинал, а когда — аналог запчастей SITRAK и HOWO: разбор по узлам, риски подделок и советы по выбору проверенных производителей SINOTRUK.",
    keywords: ["запчасти SITRAK", "запчасти HOWO", "оригинал или аналог", "SINOTRUK", "аналоги запчастей"],
    category: "Оригинал или аналог",
    date: "2024-05-21",
    updatedAt: "2024-05-21",
    readTime: 7,
    cover: blogSitrakHowoOriginalVsAnalog,
    body: "Владельцы грузовой техники SITRAK и HOWO часто сталкиваются с выбором между оригинальными запчастями и их аналогами.",
  },
  {
    slug: "podbor-zapchasti-sitrak-howo-po-artikulu",
    title: "Как подобрать запчасть для китайской спецтехники SITRAK и HOWO по артикулу",
    seoTitle: "Подбор запчастей SITRAK и HOWO по артикулу: пошаговый гайд",
    excerpt:
      "Пошаговый алгоритм: где найти каталожный номер SITRAK / HOWO, как сверить деталь по VIN, выбрать оригинал или аналог и не нарваться на подделку.",
    seoDescription:
      "Как подобрать запчасть SITRAK и HOWO по артикулу: поиск каталожного номера, сверка по VIN, выбор оригинала или аналога и проверка поставщика.",
    keywords: ["подбор запчастей SITRAK", "подбор запчастей HOWO", "артикул запчасти", "каталожный номер SINOTRUK", "VIN SITRAK"],
    category: "Как подобрать запчасть",
    date: "2024-05-21",
    updatedAt: "2024-05-21",
    readTime: 9,
    cover: blogSitrakHowoCover,
    body: "Правильный подбор запчастей для SITRAK и HOWO по артикулу позволяет избежать простоев, ошибок при заказе и лишних затрат на ремонт.",
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
