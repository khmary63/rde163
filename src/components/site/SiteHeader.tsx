import { Link, useNavigate } from "@tanstack/react-router";
import { Phone, MessageCircle, Send, User, ShoppingCart, Search, Menu, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { adminContact } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import logoRde from "@/assets/logo-rde.png";

const nav = [
  { to: "/catalog", label: "Каталог" },
  { to: "/blog", label: "Блог" },
  { to: "/reviews", label: "Отзывы" },
  { to: "/contacts", label: "Контакты" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { count } = useCart();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/catalog", search: { q: query.trim() || undefined } });
  };

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
            
            <a href="#" aria-label="WhatsApp" className="hover:text-brand transition-colors"><MessageCircle className="h-3.5 w-3.5" /></a>
            <span className="hidden md:inline">Пн–Пт 8:00–19:00 МСК</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logoRde} alt="Логотип Русский Дом Экспорта" className="h-10 w-10 object-contain" />
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

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-4 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по артикулу, OEM, названию…"
            className="w-full h-10 pl-9 pr-20 rounded-md border border-border bg-surface/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 rounded text-xs font-semibold bg-brand text-brand-foreground hover:bg-brand/90 transition-colors"
          >
            Найти
          </button>
        </form>

        <Link to="/cart" className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface transition-colors">
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
              {count}
            </span>
          )}
        </Link>

        <Link to={user ? "/account" : "/login"} className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface transition-colors" aria-label="Личный кабинет">
          <User className="h-5 w-5" />
        </Link>

        <Button asChild size="sm" className="hidden md:inline-flex bg-brand text-brand-foreground hover:bg-brand/90 font-semibold">
          <Link to={user ? "/account" : "/login"}>{user ? "Кабинет" : "Войти"}</Link>
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
