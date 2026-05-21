import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { HelpCircle, Truck, RotateCcw, Info, MessageSquare } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const BASE = "https://rde163.ru";

type Category = {
  id: string;
  title: string;
  icon: typeof Truck;
  items: { q: string; a: React.ReactNode }[];
};

const categories: Category[] = [
  {
    id: "delivery",
    title: "Вопросы о доставке",
    icon: Truck,
    items: [
      {
        q: "Возможен ли самовывоз заказанного товара?",
        a: (
          <>
            <p>
              Да, возможен, если данный вариант предусмотрен при заключении Договора. Товары
              возможно получить по товарным накладным / УПД на складе Поставщика с понедельника по
              пятницу с 9:00 до 18:00 со склада Поставщика в городах присутствия:
            </p>
            <ul className="mt-3 space-y-1.5 list-disc pl-5 text-foreground/85">
              <li>Самара: ул. Демократическая, 63 «а»</li>
              <li>Самара: ул. Волжское шоссе, 110</li>
              <li>
                Московская обл, Ленинский г.о. Горки Ленинские рп, Технопарк промзона,
                Инновационный проезд, зд. 7А (ориентир — 3 подъезд, ворота №8)
              </li>
              <li>Челябинск: ул. Енисейская, 54В</li>
              <li>Санкт-Петербург: Таллинское шоссе, 194, кор. 2, стр. 2</li>
              <li>Новосибирск: ул. Петухова, 23/4</li>
              <li>Краснодар: ул. Уральская, 97</li>
              <li>Екатеринбург: ул. Норильская, 77</li>
            </ul>
          </>
        ),
      },
      {
        q: "Как осуществляется доставка?",
        a: (
          <p>
            Поставщик производит отгрузку товара до терминала транспортной компании, которая была
            согласована Покупателем. Доставка до склада Покупателя осуществляется транспортной
            компанией, выбранной покупателем. Услуги транспортной компании оплачиваются Покупателем
            отдельно и не входят в стоимость товара.
          </p>
        ),
      },
      {
        q: "В какие сроки можно забрать товар?",
        a: (
          <p>
            Забрать товар со склада покупатель может не позднее 14 (четырнадцати) рабочих дней после
            получения от поставщика уведомления о готовности Товара к отгрузке.
          </p>
        ),
      },
      {
        q: "Как рассчитать стоимость доставки?",
        a: (
          <p>
            Для расчёта стоимости доставки заказа воспользуйтесь калькулятором выбранной
            транспортной компании. Менеджер РДЭ поможет подобрать оптимальный способ отправки —
            свяжитесь с нами на странице{" "}
            <Link to="/contacts" className="text-brand hover:underline">
              контактов
            </Link>
            .
          </p>
        ),
      },
    ],
  },
  {
    id: "returns",
    title: "Вопросы по возврату",
    icon: RotateCcw,
    items: [
      {
        q: "При каких условиях можно вернуть товар надлежащего качества?",
        a: (
          <>
            <p>
              Возврат Товара надлежащего качества возможен исключительно с согласия Продавца, с
              учётом заявленных оснований Покупателем в письменном обращении на возврат Товара, а
              также при соблюдении обязательных условий:
            </p>
            <ul className="mt-3 space-y-1.5 list-disc pl-5 text-foreground/85">
              <li>сохранность и целостность заводской упаковки;</li>
              <li>отсутствие следов сборки и эксплуатации, признаков установки;</li>
              <li>возврат товара в полной комплектности;</li>
              <li>
                сохранение товарного вида изделия и предоставление документов, подтверждающих
                поставку товара.
              </li>
            </ul>
            <p className="mt-3">
              Несоблюдение одного или нескольких условий лишает Покупателя возможности возврата
              Товара надлежащего качества.
            </p>
            <p className="mt-3">
              Возможность возврата рассматривается Продавцом только в отношении Товаров, находящихся
              в наличии и поставляемых со склада Продавца. В отношении Товара, поставляемого под
              заказ из Китая, Покупатель не имеет права на возврат Товара надлежащего качества,
              независимо от оснований и причин.
            </p>
            <p className="mt-3">
              В случае отрицательного решения Продавец направляет в адрес Покупателя мотивированный
              отказ в течение 10 (десяти) рабочих дней с даты получения письменного обращения.
            </p>
          </>
        ),
      },
      {
        q: "Как происходит обмен товара?",
        a: (
          <>
            <p>
              <strong className="text-foreground">1.</strong> Покупатель вправе в течение
              четырнадцати дней с момента передачи ему непродовольственного товара, если более
              длительный срок не объявлен продавцом, обменять купленный товар в месте покупки и иных
              местах, объявленных продавцом, на аналогичный товар других размера, формы, габарита,
              фасона, расцветки или комплектации, произведя в случае разницы в цене необходимый
              перерасчёт с продавцом.
            </p>
            <p className="mt-3">
              При отсутствии необходимого для обмена товара у продавца покупатель вправе возвратить
              приобретённый товар продавцу и получить уплаченную за него денежную сумму.
            </p>
            <p className="mt-3">
              Требование покупателя об обмене либо о возврате товара подлежит удовлетворению, если
              товар не был в употреблении, сохранены его потребительские свойства и имеются
              доказательства приобретения его у данного продавца.
            </p>
            <p className="mt-3">
              <strong className="text-foreground">2.</strong> Перечень товаров, которые не подлежат
              обмену или возврату, определён Постановлением Правительства РФ от 31.12.2020 № 2463
              «Об утверждении Правил продажи товаров по договору розничной купли-продажи…», а также
              статьёй 503 Гражданского кодекса Российской Федерации.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "general",
    title: "Общие вопросы",
    icon: Info,
    items: [
      {
        q: "Как оформить заказ?",
        a: (
          <ol className="space-y-2 list-decimal pl-5 text-foreground/85">
            <li>Пройдите регистрацию в личном кабинете.</li>
            <li>Выберите товары и добавьте их в корзину.</li>
            <li>Перейдите в раздел «Корзина» и нажмите «Перейти к оформлению».</li>
            <li>Выберите способ доставки и укажите адрес.</li>
            <li>Отправьте заказ менеджеру и дождитесь подтверждения.</li>
            <li>Оплатите заказ на основании выставленного счёта.</li>
            <li>Ожидайте уведомления о готовности товара к отгрузке.</li>
            <li>Товар со склада Продавца необходимо забрать не позднее 14 дней.</li>
          </ol>
        ),
      },
    ],
  },
];

export const Route = createFileRoute("/faq")({
  head: () => {
    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: categories.flatMap((c) =>
        c.items.map((it) => ({
          "@type": "Question",
          name: it.q,
          acceptedAnswer: {
            "@type": "Answer",
            text:
              typeof it.a === "string"
                ? it.a
                : "Подробный ответ доступен на странице раздела «Вопросы и ответы».",
          },
        })),
      ),
    };
    return {
      meta: [
        { title: "Вопросы и ответы — РДЭ Запчасти" },
        {
          name: "description",
          content:
            "Ответы на частые вопросы: доставка, самовывоз, возврат и обмен товара, оформление заказа в РДЭ.",
        },
        { property: "og:title", content: "Вопросы и ответы — РДЭ Запчасти" },
        {
          property: "og:description",
          content: "Доставка, возврат, оформление заказа — частые вопросы клиентов РДЭ.",
        },
        { property: "og:url", content: `${BASE}/faq` },
      ],
      links: [{ rel: "canonical", href: `${BASE}/faq` }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd) }],
    };
  },
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-16 lg:py-24">
      <div className="mb-10">
        <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em] mb-3">
          / помощь клиентам
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold leading-[1.05] flex items-center gap-3">
          <HelpCircle className="h-9 w-9 text-brand" strokeWidth={1.8} />
          Вопросы и ответы
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl">
          В данном разделе приведены ответы на часто задаваемые вопросы. Если не нашли свой —
          напишите нам, мы ответим в течение рабочего дня.
        </p>

        <nav className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="inline-flex items-center gap-2 border border-border bg-surface/60 px-3.5 py-2 text-sm hover:border-brand hover:text-brand transition-colors"
            >
              <c.icon className="h-4 w-4" />
              {c.title}
            </a>
          ))}
        </nav>
      </div>

      <div className="space-y-12">
        {categories.map((c) => (
          <section key={c.id} id={c.id} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
              <c.icon className="h-5 w-5 text-brand" strokeWidth={1.8} />
              <h2 className="font-display text-2xl font-bold">{c.title}</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {c.items.map((it, i) => (
                <AccordionItem key={i} value={`${c.id}-${i}`}>
                  <AccordionTrigger className="text-base font-medium py-5">
                    {it.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-foreground/80 space-y-2 pr-2">
                    {it.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>

      <div className="mt-14 border border-border bg-surface/50 p-6 lg:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <h3 className="font-display text-lg font-bold">Не нашли ответа на свой вопрос?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Свяжитесь с нами, и мы предоставим необходимую информацию.
          </p>
        </div>
        <Link
          to="/contacts"
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground hover:bg-brand/90 px-5 py-3 text-sm font-medium transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          Написать сообщение
        </Link>
      </div>
    </div>
  );
}
