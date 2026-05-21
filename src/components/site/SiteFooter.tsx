import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Send, MessageCircle } from "lucide-react";
import { adminContact } from "@/data/mock";
import logoRde from "@/assets/logo-rde.png";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface/40 mt-24">
      <div className="mx-auto max-w-[1400px] px-4 py-14 grid gap-10 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <img src={logoRde} alt="Логотип Русский Дом Экспорта" className="h-10 w-10 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-base tracking-wide uppercase">Русский Дом Экспорта</span>
              <span className="text-[10px] text-muted-foreground tracking-[0.18em] uppercase">Запчасти для спецтехники</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ООО «Русский Дом Экспорта». Запчасти для китайской спецтехники и грузовиков.<br />
            8 складов по РФ, 5 000+ позиций, прямые поставки.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-display text-sm tracking-wide text-foreground/80 uppercase">Магазин</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/catalog" className="text-muted-foreground hover:text-brand transition-colors">Каталог</Link></li>
            <li><Link to="/cart" className="text-muted-foreground hover:text-brand transition-colors">Корзина</Link></li>
            <li><Link to="/account" className="text-muted-foreground hover:text-brand transition-colors">Личный кабинет</Link></li>
            <li><Link to="/login" className="text-muted-foreground hover:text-brand transition-colors">Войти / Регистрация</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-display text-sm tracking-wide text-foreground/80 uppercase">Информация</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/blog" className="text-muted-foreground hover:text-brand transition-colors">Блог</Link></li>
            <li><Link to="/reviews" className="text-muted-foreground hover:text-brand transition-colors">Отзывы</Link></li>
            <li><Link to="/contacts" className="text-muted-foreground hover:text-brand transition-colors">Контакты</Link></li>
            <li><Link to="/certificates" className="text-muted-foreground hover:text-brand transition-colors">Лицензии и сертификаты</Link></li>
            <li><Link to="/requisites" className="text-muted-foreground hover:text-brand transition-colors">Реквизиты</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-display text-sm tracking-wide text-foreground/80 uppercase">Контакты</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><Phone className="h-4 w-4 text-brand mt-0.5 shrink-0" /><a href={`tel:${adminContact.phone}`} className="hover:text-brand">{adminContact.phone}</a></li>
            <li className="flex items-start gap-2"><Mail className="h-4 w-4 text-brand mt-0.5 shrink-0" /><a href="mailto:rusdomexport@gmail.com" className="hover:text-brand">rusdomexport@gmail.com</a></li>
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-brand mt-0.5 shrink-0" /><span>443031 г. Самара, ул. Демократическая, зд. 63а, КОМНАТА 301</span></li>
          </ul>
          <div className="flex items-center gap-3 pt-1">
            <a href="#" aria-label="Telegram" className="text-muted-foreground hover:text-brand transition-colors"><Send className="h-4 w-4" /></a>
            <a href="#" aria-label="WhatsApp" className="text-muted-foreground hover:text-brand transition-colors"><MessageCircle className="h-4 w-4" /></a>
          </div>
        </div>
      </div>

      <div className="border-t border-border/40">
        <div className="mx-auto max-w-[1400px] px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2026 ООО «Русский Дом Экспорта». Все права защищены.</span>
          <span className="font-mono">ИНН 6315001344 · ОГРН 1156315000742</span>
        </div>
      </div>
    </footer>
  );
}
