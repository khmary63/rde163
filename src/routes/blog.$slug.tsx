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
  "nadezhnaya-silovaya-liniya": () => <NadezhnayaSilovayaLiniyaArticle />,
  "moshchnost-i-ekonomiya-topliva": () => <MoshchnostEkonomiyaArticle />,
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

function OriginalVsAnalogArticle() {
  return (
    <div>
      <P>
        Владельцы грузовой техники SITRAK и HOWO часто сталкиваются с выбором между оригинальными запчастями и их аналогами. Оба бренда
        выпускаются китайским концерном SINOTRUK: SITRAK создан с использованием лицензионных технологий немецкого MAN, а HOWO — более
        доступная серия грузовиков.
      </P>

      <H2>Преимущества оригинальных запчастей</H2>
      <P>
        Оригинальные детали для SITRAK и HOWO производятся в соответствии с международными стандартами качества и проходят строгий контроль
        на заводе-изготовителе. Они гарантируют полную совместимость с конструкцией грузовиков, обеспечивая долговечность и надежность работы
        техники.
      </P>
      <P>
        Оригинальные комплектующие имеют защиту от подделок — трехслойные этикетки, QR-коды и серийные номера с лазерным тиснением. На
        российском рынке налажены стабильные поставки оригинальных запчастей с полноценным гарантийным обслуживанием, что минимизирует
        простои техники.
      </P>

      <H2>Варианты аналогов</H2>
      <P>
        Альтернативные запчасти могут быть выгодным решением при правильном подходе. Наиболее надежные источники аналогов:
      </P>
      <UL>
        <li>запчасти от HOWO для техники SITRAK и наоборот — оба бренда производятся одним концерном SINOTRUK;</li>
        <li>детали от грузовиков MAN, совместимые с SITRAK — многие модели используют кабины и ходовую часть немецкого производителя без переработок;</li>
        <li>российские заводы, специализирующиеся на выпуске аналогов, — при условии проверенной репутации производителя.</li>
      </UL>

      <H2>На что обратить внимание при выборе</H2>
      <P>
        При покупке аналогов критически важно проверять соответствие геометрии детали, включая допуски и посадки, а также материал
        изготовления. Необходимо запрашивать у поставщиков бизнес-лицензии и сертификаты авторизованного дилера, особенно при заказе из
        Китая.
      </P>
      <P>
        Экономия на запчастях может обернуться более серьезными потерями: некачественная деталь не только быстрее выходит из строя, но и
        может повредить другие узлы техники. По данным исследований, контрафактные детали вызывают до 72% преждевременных отказов
        трансмиссии, поэтому оригинальные запчасти служат в 2–3 раза дольше, несмотря на цену выше на 20–30%.
      </P>

      <H2>Рекомендации по выбору</H2>
      <UL>
        <li>
          <strong>Критически важные узлы</strong> — двигатель, трансмиссия, тормозная система — оригинал или проверенные аналоги от HOWO / MAN.
        </li>
        <li>
          <strong>Менее нагруженные детали</strong> — допустимы качественные российские аналоги с хорошей репутацией производителя.
        </li>
        <li>
          <strong>Всегда</strong> проверяйте номера деталей по официальному каталогу SINOTRUK, требуйте сертификаты от поставщиков и при
          возможности тестируйте образцы перед крупными закупками.
        </li>
      </UL>

      <div className="mt-10 rounded-xl border border-brand/40 bg-brand/5 p-6">
        <div className="text-xs font-mono uppercase tracking-wider text-brand mb-2">Не уверены в выборе?</div>
        <h3 className="font-display text-2xl mb-2">Подберём оригинал или аналог под вашу технику</h3>
        <p className="text-muted-foreground mb-4">
          Менеджер сверит каталожный номер по базе SINOTRUK, предложит проверенные альтернативы и подтвердит наличие на складе.
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

function NadezhnayaSilovayaLiniyaArticle() {
  return (
    <div>
      <P>
        Ваш бизнес не терпит простоев, и двигатели серии МС созданы, чтобы держать его в движении. Разработанные по технологиям MAN, они
        выдают мощность от 440 до 540 л. с., справляясь с любыми нагрузками. Соответствие нормам Евро-5 и система SCR обеспечивают
        экологичность вашего автопарка.
      </P>

      <H2>Двигатели серии МС</H2>
      <P>Автомобили SITRAK оснащены двигателями серии МС, которые отличаются:</P>

      <H3>Повышенной прочностью</H3>
      <P>
        Блок цилиндров изготовлен из вермикулярного чугуна, обладающего по сравнению с обычным более высокой жесткостью и упругостью.
        Усталостная прочность выше на 100%.
      </P>

      <H3>Точностью прилегания деталей</H3>
      <P>
        Используемые при производстве технологии позволяют значительно повысить несущую способность конструкций и снизить износ подшипников.
      </P>

      <H3>Повышенным давлением впрыска</H3>
      <P>
        Электронный блок управления точно контролирует процесс впрыска топлива. Максимальное давление может достигать 1900 бар, что повышает
        мощность работы двигателя и при этом снижает расход топлива.
      </P>
      <P>
        Двигатель серии МС оснащен специально разработанным устройством EVB, которое повышает эффективность торможения автомобиля, делая
        перевозки еще безопаснее.
      </P>

      <H3>Основные параметры двигателей серии МС</H3>
      <div className="my-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Параметр</th>
              <th className="px-3 py-2 text-left font-medium">MC11</th>
              <th className="px-3 py-2 text-left font-medium">MC13</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="px-3 py-2">Тип</td>
              <td className="px-3 py-2" colSpan={2}>
                Рядный, 6-цилиндровый с жидкостным охлаждением, турбонаддувом и промежуточным охлаждением
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">Метод впрыска топлива</td>
              <td className="px-3 py-2" colSpan={2}>
                Common Rail BOSCH с электронным управлением
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">Диаметр × ход поршня, мм</td>
              <td className="px-3 py-2">120 × 155</td>
              <td className="px-3 py-2">126 × 166</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Рабочий объем, л</td>
              <td className="px-3 py-2">10,518</td>
              <td className="px-3 py-2">12,419</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Степень сжатия</td>
              <td className="px-3 py-2" colSpan={2}>19 : 1</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Мощность / обороты, л. с. / об/мин</td>
              <td className="px-3 py-2">400–440 / 1900</td>
              <td className="px-3 py-2">480–540 / 1900</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Макс. крутящий момент, Нм</td>
              <td className="px-3 py-2">1900–2100</td>
              <td className="px-3 py-2">2300–2500</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Нормы выбросов</td>
              <td className="px-3 py-2" colSpan={2}>Евро-5</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Топливо</td>
              <td className="px-3 py-2" colSpan={2}>Дизельное</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Нейтрализация выхлопных газов</td>
              <td className="px-3 py-2" colSpan={2}>SCR (Евро-4, Евро-5)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <H2>Коробки переключения передач</H2>
      <P>
        Во всех моделях SITRAK используются коробки переключения передач всемирно известного и зарекомендовавшего себя в отношении качества
        производителя — ZF.
      </P>

      <H3>ZF12TX2620 TD / ZF12TX2621 TD</H3>
      <UL>
        <li>автоматический выбор передачи, легкое переключение, экономия топлива;</li>
        <li>автоматический переход в режим движения накатом при снижении нагрузки — экономия топлива и плавность хода;</li>
        <li>учет сопротивления движению, веса автомобиля и других параметров для улучшения ходовых качеств.</li>
      </UL>

      <H3>ZF 16S2531 TO / ZF 16S2530 TO</H3>
      <UL>
        <li>литой корпус из алюминиевого сплава, большой входной крутящий момент;</li>
        <li>сервопривод переключения передач, низкий уровень шума.</li>
      </UL>

      <H2>Мосты</H2>
      <P>
        Все мосты произведены компанией SINOTRUK по передовым немецким технологиям. Стандартно мост оснащается главным редуктором Oerlikon,
        барабанными или дисковыми тормозами. У SINOTRUK широкая линейка мостов для различной грузоподъемности, конфигурация зависит от
        условий эксплуатации автомобиля.
      </P>

      <H3>Задняя ось</H3>
      <UL>
        <li>MCY13JES — дисковые тормоза;</li>
        <li>MCY13BES — дисковые тормоза;</li>
        <li>MCP16ZG, MCY13BGS — барабанные тормоза.</li>
      </UL>

      <H3>Передняя ось</H3>
      <UL>
        <li>VPD71DS — дисковые тормоза;</li>
        <li>VPD95ES — дисковые тормоза;</li>
        <li>VGD95 — барабанные тормоза.</li>
      </UL>

      <div className="mt-10 rounded-xl border border-brand/40 bg-brand/5 p-6">
        <div className="text-xs font-mono uppercase tracking-wider text-brand mb-2">Нужны запчасти на силовую линию SITRAK?</div>
        <h3 className="font-display text-2xl mb-2">Подберём двигатель, КПП и мосты</h3>
        <p className="text-muted-foreground mb-4">
          Менеджер уточнит конфигурацию вашего тягача или самосвала, сверит каталожные номера и подтвердит наличие на складе.
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
