import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { LocaleLink } from "../locale-link";
import { LanguageSwitch } from "./LanguageSwitch";
import { cn } from "@/lib/format";

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname.replace(/^\/(en|ru)/, "") || "/";
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menu) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menu]);

  if (path.startsWith("/admin")) return null;

  const links = [
    { href: "/", label: t("nav.home"), match: (value: string) => value === "/" },
    { href: "/clinics", label: t("nav.clinics"), match: (value: string) => value.startsWith("/clinics") },
    { href: "/faq", label: t("nav.faq"), match: (value: string) => value.startsWith("/faq") },
  ];

  return (
    <header className="sticky top-0 z-30 px-3 pt-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-line bg-white/90 px-3 py-2 shadow-[0_12px_40px_-24px_rgba(20,36,33,0.45)] backdrop-blur">
        <LocaleLink to="/" className="flex min-w-0 items-center gap-2 pl-1">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-teal text-lg font-black text-white">
            +
          </span>
          <span className="truncate text-lg font-extrabold leading-none tracking-tight">UzMedAtlas</span>
        </LocaleLink>
        <nav className="desktop-nav hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <LocaleLink
              key={link.href}
              to={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold",
                link.match(path) ? "bg-lime text-teal-deep" : "text-muted hover:bg-mint",
              )}
            >
              {link.label}
            </LocaleLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <button
            type="button"
            className="mobile-nav grid h-11 w-11 place-items-center rounded-full bg-mint md:hidden"
            aria-expanded={menu}
            aria-label={menu ? t("nav.closeMenu") : t("nav.menu")}
            onClick={() => setMenu((value) => !value)}
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menu ? (
        <nav className="mx-auto mt-2 grid max-w-7xl gap-1 rounded-[1.6rem] border border-line bg-white p-2 shadow-[0_18px_50px_-28px_rgba(20,36,33,0.35)] md:hidden">
          {links.map((link) => (
            <LocaleLink
              key={link.href}
              to={link.href}
              className={cn(
                "rounded-2xl px-4 py-3 text-base font-bold",
                link.match(path) ? "bg-lime text-teal-deep" : "text-ink",
              )}
              onClick={() => setMenu(false)}
            >
              {link.label}
            </LocaleLink>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
