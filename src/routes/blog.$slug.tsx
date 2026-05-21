import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { blogPosts } from "@/data/mock";
import { formatDate } from "@/lib/format";

const BASE = "https://rde163.ru";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = blogPosts.find((p) => p.slug === params.slug);
    if (!post) return { meta: [{ title: "Статья не найдена" }] };
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      image: post.cover,
      datePublished: post.date,
      author: { "@type": "Organization", name: "Русский Дом Экспорта" },
      publisher: { "@type": "Organization", name: "Русский Дом Экспорта" },
      mainEntityOfPage: `${BASE}/blog/${post.slug}`,
    };
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: BASE },
        { "@type": "ListItem", position: 2, name: "Блог", item: `${BASE}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: `${BASE}/blog/${post.slug}` },
      ],
    };
    return {
      meta: [
        { title: `${post.title} — Блог РДЭ` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `${BASE}/blog/${post.slug}` },
        { property: "og:image", content: post.cover },
        { name: "twitter:image", content: post.cover },
      ],
      links: [{ rel: "canonical", href: `${BASE}/blog/${post.slug}` }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(jsonLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbs) },
      ],
    };
  },
  component: BlogPost,
});

const richContent: Record<string, () => ReactNode> = {
  "podbor-zapchasti-sitrak-howo-po-artikulu": () => <SitrakHowoArticulArticle />,
  "original-ili-analog-sitrak-howo": () => <OriginalVsAnalogArticle />,
};

function BlogPost() {
  const { slug } = Route.useParams();
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) throw notFound();
  const Rich = richContent[post.slug];
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 space-y-6">
      <Link to="/blog" className="text-sm text-brand hover:underline">← Все статьи</Link>
      <div className="text-xs font-mono text-brand uppercase tracking-wider">{post.category}</div>
      <h1 className="font-display text-4xl lg:text-5xl">{post.title}</h1>
      <div className="text-sm text-muted-foreground font-mono">{formatDate(post.date)} · {post.readTime} мин чтения</div>
      <img
        src={post.cover}
        alt={post.title}
        loading="lazy"
        width={1024}
        height={1024}
        className="aspect-[16/9] w-full rounded-lg object-cover"
      />
      <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
      {Rich ? <Rich /> : <p className="leading-relaxed">{post.body}</p>}
    </article>
  );
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-2xl lg:text-3xl mt-10 mb-4">{children}</h2>;
}
function H3({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-xl mt-6 mb-3">{children}</h3>;
}
function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed mb-4">{children}</p>;
}
function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2 mb-4 leading-relaxed">{children}</ul>;
}

function SitrakHowoArticulArticle() {
  return (
    <div>
      <H2>Что такое артикул запчасти SITRAK / HOWO</H2>
      <P>
        Артикул (каталожный номер) запчасти SITRAK или HOWO — это уникальный буквенно-цифровой код, который производитель присваивает каждой
        детали. По этому номеру запчасть находится в каталоге, определяется её точное назначение, модификация и совместимость с конкретной
        моделью грузовика или спецтехники.
      </P>
      <P>
        Для клиентов важно понимать: один и тот же узел внешне может выглядеть одинаково, но отличаться по каталожному номеру, размеру, типу
        крепежа или настройкам. Поэтому подбор запчастей SITRAK и HOWO по артикулу — самый надежный способ не ошибиться при заказе.
      </P>

      <H2>Где найти артикул запчасти SITRAK и HOWO</H2>
      <P>
        Чтобы грамотно оформить заявку на подбор запчастей SITRAK или HOWO, необходимо сначала правильно определить каталожный номер детали.
        Сделать это можно несколькими способами.
      </P>
      <H3>1. На корпусе старой детали или её шильдике</H3>
      <P>
        На большинстве оригинальных запчастей SITRAK и HOWO артикул нанесен прямо на деталь: в виде гравировки, отливки или наклейки. Перед
        обращением к поставщику стоит внимательно осмотреть деталь, очистить место маркировки от грязи и сфотографировать найденный номер
        крупным планом.
      </P>
      <H3>2. В документации и каталогах по спецтехнике</H3>
      <P>
        Если под рукой есть руководство по эксплуатации, каталог запчастей или сервисная документация на ваш грузовик SITRAK или HOWO, нужный
        артикул можно найти по схеме узла. Для этого достаточно знать название детали и узла (например, «насос гидроусилителя», «тормозной
        суппорт», «болт крепления ступицы»).
      </P>
      <H3>3. В электронных каталогах и у поставщика</H3>
      <P>
        Многие поставщики запчастей для китайской спецтехники используют электронные каталоги SITRAK и HOWO. Специалист может подобрать
        артикул по VIN/серийному номеру, модели и году выпуска техники, а уже потом подобрать по нему оригинальную запчасть или качественный
        аналог.
      </P>

      <H2>Какие данные подготовить для подбора</H2>
      <P>
        Даже если артикул уже известен, для быстрого и точного подбора запчасти желательно заранее подготовить базовые данные о машине и узле.
      </P>
      <UL>
        <li>марку и модель: SITRAK (например, SITRAK C7H) или HOWO (HOWO A7 и др.);</li>
        <li>тип техники: седельный тягач, самосвал, шасси под спецнадстройку;</li>
        <li>VIN или серийный номер автомобиля;</li>
        <li>год выпуска грузовика или спецтехники;</li>
        <li>узел, к которому относится деталь (двигатель, коробка передач, мосты, подвеска, кабина, электрика и др.).</li>
      </UL>
      <P>
        Эта информация позволяет сопоставить артикул с конкретной модификацией SITRAK или HOWO и исключить ситуацию, когда визуально похожие
        детали в каталоге имеют разные номера и не взаимозаменяемы.
      </P>

      <H2>Пошаговая инструкция: подбор по артикулу</H2>
      <H3>Шаг 1. Проверить правильность написания артикула</H3>
      <UL>
        <li>отличать цифру «0» от буквы «O»;</li>
        <li>не путать латинские и кириллические символы;</li>
        <li>внимательно перепроверить количество знаков.</li>
      </UL>
      <P>Даже одна ошибка в артикуле может привести к тому, что нужная запчасть не будет найдена или система предложит неверный аналог.</P>
      <H3>Шаг 2. Ввести артикул в поиск</H3>
      <P>Далее артикул вводится в строку поиска на сайте поставщика или озвучивается менеджеру. Система показывает:</P>
      <UL>
        <li>оригинальные запчасти SITRAK или HOWO;</li>
        <li>качественные аналоги от проверенных производителей;</li>
        <li>взаимозаменяемые детали с перекрестными номерами.</li>
      </UL>
      <H3>Шаг 3. Сверить описание запчасти с вашей техникой</H3>
      <UL>
        <li>для каких моделей SITRAK или HOWO подходит деталь;</li>
        <li>область применения (какой узел/агрегат);</li>
        <li>основные технические параметры (размеры, тип резьбы, давление, напряжение и т. д.).</li>
      </UL>
      <H3>Шаг 4. Уточнить детали у специалиста</H3>
      <P>Если есть сомнения, отправьте поставщику дополнительную информацию:</P>
      <UL>
        <li>фото старой детали;</li>
        <li>фото шильдиков на технике SITRAK или HOWO;</li>
        <li>VIN/серийный номер;</li>
        <li>найденный артикул.</li>
      </UL>
      <H3>Шаг 5. Оформить заказ</H3>
      <P>После подтверждения совместимости детали с вашим автомобилем можно оформлять заказ — это минимизирует риск ошибки и ускоряет поставку.</P>

      <H2>Оригинал или аналог: что выбрать</H2>
      <H3>Преимущества оригинальных запчастей</H3>
      <UL>
        <li>Полное соответствие требованиям производителя по качеству и ресурсу.</li>
        <li>Гарантированная совместимость с конкретной моделью спецтехники.</li>
        <li>Минимальный риск проблем при установке и эксплуатации.</li>
      </UL>
      <P>Оригинальные запчасти особенно важны для ответственных узлов: двигатели, коробки передач, элементы тормозной системы, детали подвески.</P>
      <H3>Когда можно рассмотреть качественный аналог</H3>
      <UL>
        <li>требуется снизить стоимость ремонта без потери надежности;</li>
        <li>есть проверенный производитель, выпускающий детали по стандартам OEM;</li>
        <li>речь идет о менее критичных расходниках (фильтры, некоторые элементы подвески, крепеж, пластиковые детали).</li>
      </UL>

      <H2>Как избежать подделок</H2>
      <H3>Признаки надежного поставщика</H3>
      <UL>
        <li>Специализация на запчастях для китайских грузовиков и спецтехники.</li>
        <li>Возможность подобрать запчасть по артикулу, VIN и каталогу.</li>
        <li>Наличие документального подтверждения происхождения товара.</li>
        <li>Грамотные консультации по выбору оригинала и аналогов.</li>
      </UL>
      <H3>На что обратить внимание при получении</H3>
      <UL>
        <li>Качество упаковки и печати логотипов.</li>
        <li>Наличие заводской маркировки и каталожного номера.</li>
        <li>Отсутствие явных следов повторной сборки или подкраски.</li>
      </UL>

      <div className="mt-10 rounded-xl border border-brand/40 bg-brand/5 p-6">
        <div className="text-xs font-mono uppercase tracking-wider text-brand mb-2">Не нашли деталь?</div>
        <h3 className="font-display text-2xl mb-2">Найдём за вас</h3>
        <p className="text-muted-foreground mb-4">
          Заполните форму, приложите фото детали или шильдика — наш специалист подберет оригинальные запчасти SITRAK и HOWO или качественные
          аналоги по артикулу и параметрам вашей техники.
        </p>
        <Link
          to="/contacts"
          className="inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90"
        >
          Оставить заявку на подбор
        </Link>
      </div>
    </div>
  );
}
