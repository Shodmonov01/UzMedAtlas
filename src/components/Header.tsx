"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitch } from "./LanguageSwitch";
import { cn } from "@/lib/format";

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const links = [
    { href: "/", label: t("home"), match: (path: string) => path === "/" },
    { href: "/clinics", label: t("clinics"), match: (path: string) => path.startsWith("/clinics") },
    { href: "/faq", label: t("faq"), match: (path: string) => path.startsWith("/faq") },
  ];

  return (
    <header className="sticky top-0 z-30 px-3 pt-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-line bg-white/90 px-3 py-2 shadow-[0_12px_40px_-24px_rgba(20,36,33,0.45)] backdrop-blur">
        <Link href="/" className="flex items-center gap-2 pl-1">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-teal text-lg font-black text-white">
            +
          </span>
          <span className="text-lg font-extrabold leading-none tracking-tight">UzMedAtlas</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold",
                link.match(pathname) ? "bg-lime text-teal-deep" : "text-muted hover:bg-mint",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/clinics" className="rounded-full px-3 py-2 text-sm font-bold md:hidden">
            {t("clinics")}
          </Link>
          <LanguageSwitch />
        </div>
      </div>
    </header>
  );
}
