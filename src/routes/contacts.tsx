import { createFileRoute } from "@tanstack/react-router";
import { warehouses, adminContact } from "@/data/mock";
import { Phone, Mail, MapPin, Send } from "lucide-react";

const BASE = "https://rde163.ru";

export const Route = createFileRoute("/contacts")({
  head: () => {
    const localBusiness = {
      "@context": "https://schema.org",
      "@type": "AutoPartsStore",
      name: "Русский Дом Экспорта",
      alternateName: "РДЭ Запчасти",
      url: `${BASE}/contacts`,
      telephone: adminContact.phone,
      email: adminContact.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: "ул. Демократическая, 63А",
        addressLocality: "Самара",
        addressCountry: "RU",
      },
      areaServed: "RU",
      department: warehouses.map((w) => ({
        "@type": "AutoPartsStore",
        name: `РДЭ — склад ${w.city}`,
        address: {
          "@type": "PostalAddress",
          streetAddress: w.address,
          addressLocality: w.city,
          addressCountry: "RU",
        },
        telephone: adminContact.phone,
      })),
    };
    return {
      meta: [
        { title: "Контакты — РДЭ Запчасти" },
        { name: "description", content: "Свяжитесь с РДЭ: телефон, email, Telegram и адреса 8 складов по России." },
        { property: "og:title", content: "Контакты РДЭ" },
        { property: "og:description", content: "Телефон, email и адреса 8 складов по России." },
        { property: "og:url", content: `${BASE}/contacts` },
      ],
      links: [{ rel: "canonical", href: `${BASE}/contacts` }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(localBusiness) },
      ],
    };
  },
  component: () => (
    <div className="mx-auto max-w-[1400px] px-4 py-16 space-y-10">
      <div>
        <h1 className="font-display text-4xl mb-2">Контакты</h1>
        <p className="text-muted-foreground">8 складов по России. Свяжитесь с администратором магазина — направим к ближайшему.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <a href={`tel:${adminContact.phone}`} className="rounded-lg border border-border bg-surface/60 p-6 hover:border-brand/60 transition-colors">
          <Phone className="h-6 w-6 text-brand mb-3" />
          <div className="text-sm text-muted-foreground">Телефон</div>
          <div className="font-display text-xl">{adminContact.phone}</div>
        </a>
        <a href={`mailto:${adminContact.email}`} className="rounded-lg border border-border bg-surface/60 p-6 hover:border-brand/60 transition-colors">
          <Mail className="h-6 w-6 text-brand mb-3" />
          <div className="text-sm text-muted-foreground">Email</div>
          <div className="font-display text-xl">{adminContact.email}</div>
        </a>
        <a href="#" className="rounded-lg border border-border bg-surface/60 p-6 hover:border-brand/60 transition-colors">
          <Send className="h-6 w-6 text-brand mb-3" />
          <div className="text-sm text-muted-foreground">Telegram</div>
          <div className="font-display text-xl">{adminContact.telegram}</div>
        </a>
      </div>

      <div>
        <h2 className="font-display text-2xl mb-4">Склады</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {warehouses.map((w) => (
            <div key={w.id} className="rounded-md border border-border bg-surface/60 p-4">
              <MapPin className="h-4 w-4 text-brand mb-2" />
              <div className="font-medium">{w.city}</div>
              <div className="text-xs text-muted-foreground mt-1">{w.address}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl mb-4">Главный офис: г. Самара, ул. Демократическая, 63А</h2>
        <div className="rounded-lg overflow-hidden border border-border bg-surface">
          <iframe
            src="https://yandex.ru/map-widget/v1/?mode=search&text=%D0%A1%D0%B0%D0%BC%D0%B0%D1%80%D0%B0%2C%20%D1%83%D0%BB.%20%D0%94%D0%B5%D0%BC%D0%BE%D0%BA%D1%80%D0%B0%D1%82%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B0%D1%8F%2C%2063%D0%90&z=17&l=map"
            width="100%"
            height="450"
            frameBorder={0}
            allowFullScreen
            loading="lazy"
            title="РДЭ — Самара, ул. Демократическая, 63А"
            style={{ border: 0, display: "block" }}
          />
        </div>
      </div>
    </div>
  ),
});
