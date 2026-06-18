export type Annotation = {
  x: number; // % of frame width
  y: number; // % of frame height
  title: string;
  text?: string;
  side?: "left" | "right";
};

export type Chapter = {
  slug: string;
  title: string;
  subtitle: string;
  path: string;            // route in the app rendered inside the iframe
  viewport: "desktop" | "mobile";
  duration: number;        // ms in auto-tour
  highlights: string[];    // bullet points shown under the frame
  annotations?: Annotation[];
};

export const chapters: Chapter[] = [
  {
    slug: "home",
    title: "Главная — Hi-Tech Hero",
    subtitle: "B2B-каталог запчастей для SITRAK / HOWO",
    path: "/",
    viewport: "desktop",
    duration: 6000,
    highlights: [
      "Live-счётчик 6 000+ позиций с пульсацией",
      "Тикер реальных остатков по брендам",
      "HUD-углы, моно-разметка, brutalist-сетка",
    ],
    annotations: [
      { x: 78, y: 45, title: "Live-данные", text: "Счётчик обновляется из БД в реальном времени", side: "left" },
      { x: 50, y: 92, title: "Тикер остатков", text: "Бегущая строка по 8 складам", side: "right" },
    ],
  },
  {
    slug: "catalog",
    title: "Каталог — 40 000+ SKU",
    subtitle: "Фильтры, персональные цены, наличие по складам",
    path: "/catalog",
    viewport: "desktop",
    duration: 6500,
    highlights: [
      "Поиск по артикулу, OEM и кросс-номеру",
      "Фильтры: бренд, склад, оригинал/аналог, наличие",
      "Персональная скидка для авторизованных юрлиц",
    ],
    annotations: [
      { x: 16, y: 35, title: "Фильтры", text: "Бренды · склады · тип · наличие", side: "right" },
      { x: 75, y: 50, title: "Цены", text: "С учётом договорной скидки клиента", side: "left" },
    ],
  },
  {
    slug: "cart",
    title: "Корзина и оформление",
    subtitle: "Заявка менеджеру за 30 секунд",
    path: "/cart",
    viewport: "desktop",
    duration: 5500,
    highlights: [
      "Локальная корзина с восстановлением",
      "Под заказ — даже если позиции нет на складах",
      "Excel-выгрузка заказа в один клик",
    ],
  },
  {
    slug: "account",
    title: "Личный кабинет",
    subtitle: "История заявок, реквизиты, скидка",
    path: "/account",
    viewport: "desktop",
    duration: 5000,
    highlights: [
      "Привязка компании и КПП",
      "История заказов с статусами",
      "Skidka хранится в profiles, применяется в каталоге",
    ],
  },
  {
    slug: "admin",
    title: "Админка — обзор",
    subtitle: "Сводка по заявкам в реальном времени",
    path: "/admin",
    viewport: "desktop",
    duration: 5000,
    highlights: [
      "Счётчики: новые · в работе · завершённые",
      "Последние заявки с переходом в карточку",
      "Ролевая модель user_roles + RLS",
    ],
  },
  {
    slug: "admin-orders",
    title: "Админка — заказы",
    subtitle: "Управление заявками клиентов",
    path: "/admin/orders",
    viewport: "desktop",
    duration: 6000,
    highlights: [
      "Фильтры по статусу, клиенту, дате",
      "Экспорт в Excel со всеми позициями",
      "Транзакционные письма клиенту через React Email",
    ],
  },
  {
    slug: "admin-catalog",
    title: "Админка — каталог",
    subtitle: "Импорт прайса из 1С/Excel",
    path: "/admin/catalog",
    viewport: "desktop",
    duration: 5500,
    highlights: [
      "Пакетный импорт SKU + остатков по складам",
      "Сопоставление брендов и кросс-номеров",
      "Server functions с авторизацией по роли",
    ],
  },
  {
    slug: "admin-analytics",
    title: "Аналитика",
    subtitle: "Воронка заявок и активность клиентов",
    path: "/admin/analytics",
    viewport: "desktop",
    duration: 5000,
    highlights: [
      "GMV, число заявок, средний чек",
      "Топ-клиенты и топ-SKU",
      "Запросы к Postgres через защищённые RPC",
    ],
  },
  {
    slug: "mobile-home",
    title: "Адаптив — Главная",
    subtitle: "Mobile-first, 320px и выше",
    path: "/",
    viewport: "mobile",
    duration: 4500,
    highlights: [
      "Brutalist-вёрстка перестраивается под 1 колонку",
      "HUD-элементы и тикер сохраняются",
    ],
  },
  {
    slug: "mobile-catalog",
    title: "Адаптив — Каталог",
    subtitle: "Карточный вид вместо таблицы",
    path: "/catalog",
    viewport: "mobile",
    duration: 4500,
    highlights: [
      "Таблица → карточки на узких экранах",
      "Фильтры в выезжающей панели",
    ],
  },
];

export const findChapter = (slug: string) =>
  chapters.find((c) => c.slug === slug) ?? chapters[0];
