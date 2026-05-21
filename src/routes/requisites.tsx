import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/requisites")({
  head: () => ({
    meta: [
      { title: "Реквизиты — ООО «Русский Дом Экспорта»" },
      { name: "description", content: "Реквизиты ООО «Русский Дом Экспорта» (ООО «РДЭ»). ИНН, КПП, ОГРН, юридический адрес." },
      { property: "og:title", content: "Реквизиты — ООО «Русский Дом Экспорта»" },
      { property: "og:description", content: "Реквизиты ООО «Русский Дом Экспорта» (ООО «РДЭ»). ИНН, КПП, ОГРН, юридический адрес." },
    ],
    links: [{ rel: "canonical", href: "https://rde163.ru/requisites" }],
  }),
  component: RequisitesPage,
});

const fields: { label: string; value: string }[] = [
  { label: "Полное наименование", value: "Общество с ограниченной ответственностью «Русский Дом Экспорта»" },
  { label: "Сокращенное наименование", value: "ООО «РДЭ»" },
  { label: "Дата регистрации", value: "«11» февраля 2015 г." },
  { label: "ИНН", value: "6315001344" },
  { label: "КПП", value: "631201001" },
  { label: "ОКПО", value: "40972871" },
  { label: "ОКВЭД", value: "46.90" },
  { label: "ОГРН", value: "1156315000742" },
  { label: "Юр./фактический адрес", value: "443031 г. Самара, ул. Демократическая, зд. 63а, КОМНАТА 301" },
  { label: "E-mail", value: "hrs@gross.ru" },
];

function RequisitesPage() {
  return (
    <div className="mx-auto max-w-[1480px] px-6 py-20 lg:py-28">
      <div className="mb-12">
        <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em] mb-3">/ legal info</div>
        <h1 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95]">
          Реквизиты<span className="text-muted-foreground/60">.</span>
        </h1>
      </div>

      <div className="border border-border bg-background">
        <div className="divide-y divide-border">
          {fields.map((f) => (
            <div key={f.label} className="grid sm:grid-cols-[280px_1fr] gap-4 px-6 py-5 items-baseline">
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-mono">{f.label}</div>
              <div className="text-base text-foreground font-medium">
                {f.label === "E-mail" ? (
                  <a href={`mailto:${f.value}`} className="text-accent-blue hover:underline">{f.value}</a>
                ) : (
                  f.value
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
