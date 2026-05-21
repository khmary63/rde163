import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, X, ZoomIn } from "lucide-react";
import certSitrak from "@/assets/cert-sitrak-distributor.jpg";
import certEac from "@/assets/cert-eac-conformity.jpg";
import certSinotruk from "@/assets/cert-sinotruk-rus-permission.jpg";

export const Route = createFileRoute("/certificates")({
  head: () => ({
    meta: [
      { title: "Лицензии и сертификаты — ООО «Русский Дом Экспорта»" },
      { name: "description", content: "Сертификаты соответствия ЕАЭС, разрешения на использование сертификатов, статус официального дистрибьютора SINOTRUK INTERNATIONAL." },
      { property: "og:title", content: "Лицензии и сертификаты — ООО «Русский Дом Экспорта»" },
      { property: "og:description", content: "Сертификаты соответствия ЕАЭС и статус официального дистрибьютора SINOTRUK / SITRAK / HOWO." },
    ],
    links: [{ rel: "canonical", href: "https://rde163.ru/certificates" }],
  }),
  component: CertificatesPage,
});

type Certificate = {
  src: string;
  title: string;
  issuer: string;
  number?: string;
  validity?: string;
  description: string;
};

const certificates: Certificate[] = [
  {
    src: certSitrak,
    title: "Официальный дистрибьютор SINOTRUK INTERNATIONAL",
    issuer: "SINOTRUK INTERNATIONAL (中国重汽集团国际有限公司)",
    validity: "01.01.2026 — 31.12.2026",
    description:
      "ООО «Русский Дом Экспорта» — официальный дистрибьютор SINOTRUK INTERNATIONAL на территории РФ. Уполномочены реализовывать оригинальные запасные части, осуществлять гарантийное и постгарантийное обслуживание серий C7H / C7H-MAX / T5G торговых марок SITRAK и HOWO.",
  },
  {
    src: certEac,
    title: "Сертификат соответствия ЕАЭС",
    issuer: "АНО «Центр содействия сертификации автомототехники» (RA.RU.11MT25)",
    number: "ЕАЭС RU C-CN.MT25.B.05908/23",
    validity: "12.07.2023 — 28.05.2026",
    description:
      "Компоненты, поставляемые в качестве сменных (запасных) частей для послепродажного обслуживания транспортных средств марки SITRAK, HOWO типов ZZHS, ZZH. Соответствует требованиям ТР ТС 018/2011 «О безопасности колёсных транспортных средств».",
  },
  {
    src: certSinotruk,
    title: "Разрешение на использование сертификата соответствия",
    issuer: "ООО «Синотрак Рус»",
    number: "Исх. №130723 от 13.07.2023",
    validity: "до 28.05.2026",
    description:
      "ООО «Синотрак Рус» как заявитель (владелец) сертификата соответствия № ЕАЭС RU C-CN.MT25.B.05908/23 предоставило ООО «Русский Дом Экспорта» разрешение на использование сертификата для проведения таможенного оформления товаров.",
  },
];

function CertificatesPage() {
  const [active, setActive] = useState<Certificate | null>(null);

  return (
    <div className="mx-auto max-w-[1480px] px-6 py-20 lg:py-28">
      <div className="mb-12 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="font-mono text-[11px] text-accent-blue uppercase tracking-[0.3em] mb-3">/ legal & compliance</div>
          <h1 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95]">
            Лицензии<br />
            <span className="text-muted-foreground/60">и сертификаты.</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 border border-border bg-surface/50 px-5 py-3">
          <Shield className="h-5 w-5 text-accent-orange" strokeWidth={1.8} />
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Оригинал · SITRAK · HOWO · SINOTRUK
          </span>
        </div>
      </div>

      <p className="max-w-3xl text-base lg:text-lg text-foreground/85 leading-relaxed mb-12">
        Все поставляемые запасные части сопровождаются полным пакетом разрешительной документации. Ниже — действующие сертификаты соответствия ЕАЭС, разрешение производителя и подтверждение статуса официального дистрибьютора.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((c) => (
          <article
            key={c.title}
            className="group flex flex-col border border-border bg-background hover:border-accent-orange transition-colors"
          >
            <button
              type="button"
              onClick={() => setActive(c)}
              className="relative aspect-[3/4] overflow-hidden bg-surface border-b border-border"
              aria-label={`Открыть ${c.title}`}
            >
              <img
                src={c.src}
                alt={c.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <span className="absolute top-3 right-3 flex items-center gap-1.5 bg-foreground/85 text-background px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-3 w-3" /> увеличить
              </span>
            </button>
            <div className="p-6 space-y-3 flex-1 flex flex-col">
              <h2 className="font-display text-lg font-bold leading-tight">{c.title}</h2>
              <div className="space-y-1 text-xs font-mono text-muted-foreground">
                {c.number && (
                  <div>
                    <span className="text-foreground/50">№ </span>
                    <span className="text-foreground/85">{c.number}</span>
                  </div>
                )}
                {c.validity && (
                  <div>
                    <span className="text-foreground/50">срок </span>
                    <span className="text-foreground/85">{c.validity}</span>
                  </div>
                )}
                <div>
                  <span className="text-foreground/50">кем выдан </span>
                  <span className="text-foreground/85">{c.issuer}</span>
                </div>
              </div>
              <p className="text-sm text-foreground/75 leading-relaxed pt-1">{c.description}</p>
            </div>
          </article>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-foreground/90 backdrop-blur-sm flex items-center justify-center p-4 lg:p-10"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute top-5 right-5 h-11 w-11 flex items-center justify-center bg-background text-foreground hover:bg-accent-orange hover:text-accent-orange-foreground transition-colors"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={active.src}
            alt={active.title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[95vw] object-contain border border-border bg-background"
          />
        </div>
      )}
    </div>
  );
}
