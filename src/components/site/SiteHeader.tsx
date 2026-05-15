import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, Send, User, ShoppingCart, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { adminContact } from "@/data/mock";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/catalog", label: "Каталог" },
  { to: "/blog", label: "Блог" },
  { to: "/reviews", label: "Отзывы" },
  { to: "/contacts", label: "Контакты" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top bar with admin contact */}
      <div className="border-b border-border/40 bg-surface/60">
        <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between px-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Администратор магазина:</span>
            <a href={`tel:${adminContact.phone}`} className="flex items-center gap-1.5 text-foreground hover:text-brand transition-colors">
              <Phone className="h-3 w-3" />
              {adminContact.phone}
            </a>
            <a href={`mailto:${adminContact.email}`} className="hidden md:inline hover:text-brand transition-colors">
              {adminContact.email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" aria-label="Telegram" className="hover:text-brand transition-colors"><Send className="h-3.5 w-3.5" /></a>
            <a href="#" aria-label="WhatsApp" className="hover:text-brand transition-colors"><MessageCircle className="h-3.5 w-3.5" /></a>
            <span className="hidden md:inline">Пн–Пт 8:00–19:00 МСК</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center bg-brand text-brand-foreground font-display font-bold text-base rounded-sm">РДЭ</div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-display font-bold text-base tracking-wide uppercase">Русский Дом Экспорта</span>
            <span className="text-[10px] text-muted-foreground tracking-[0.18em] uppercase">Запчасти для спецтехники</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-brand transition-colors"
              activeProps={{ className: "px-3 py-2 text-sm font-medium text-brand" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <Link to="/catalog" className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Search className="h-4 w-4" />
          <span>Поиск по артикулу…</span>
          <kbd className="ml-2 hidden xl:inline-flex items-center gap-0.5 rounded border border-border/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
        </Link>

        <Link to="/cart" className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface transition-colors">
          <ShoppingCart className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">3</span>
        </Link>

        <Link to="/account" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface transition-colors">
          <User className="h-5 w-5" />
        </Link>

        <Button asChild size="sm" className="hidden md:inline-flex bg-brand text-brand-foreground hover:bg-brand/90 font-semibold">
          <Link to="/login">Войти</Link>
        </Button>

        <button
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Меню"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background">
          <nav className="mx-auto max-w-[1400px] flex flex-col px-4 py-2">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="py-3 text-sm font-medium" onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
