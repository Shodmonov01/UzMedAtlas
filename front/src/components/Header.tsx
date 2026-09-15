import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { LocaleLink } from "../locale-link";
import { LanguageSwitch } from "./LanguageSwitch";
import { cn } from "@/lib/format";

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname.replace(/^\/(en|ru)/, "") || "/";
  if (path.startsWith("/admin")) return null;

  const links = [
    { href: "/", label: t("nav.home"), match: (value: string) => value === "/" },
    { href: "/clinics", label: t("nav.clinics"), match: (value: string) => value.startsWith("/clinics") },
    { href: "/faq", label: t("nav.faq"), match: (value: string) => value.startsWith("/faq") },
  ];

  return (
    <header className="sticky top-0 z-30 px-3 pt-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-line bg-white/90 px-3 py-2 shadow-[0_12px_40px_-24px_rgba(20,36,33,0.45)] backdrop-blur">
        <LocaleLink to="/" className="flex items-center gap-2 pl-1">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-teal text-lg font-black text-white">
            +
          </span>
          <span className="text-lg font-extrabold leading-none tracking-tight">UzMedAtlas</span>
        </LocaleLink>
        <nav className="hidden items-center gap-1 md:flex">
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
          <LocaleLink to="/clinics" className="rounded-full px-3 py-2 text-sm font-bold md:hidden">
            {t("nav.clinics")}
          </LocaleLink>
          <LanguageSwitch />
        </div>
      </div>
    </header>
  );
}
