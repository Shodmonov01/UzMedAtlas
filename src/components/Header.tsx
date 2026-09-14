"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitch } from "./LanguageSwitch";

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-lg text-white">
            +
          </span>
          <span className="font-display text-2xl leading-none">UzMedAtlas</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <Link href="/clinics" className="rounded-full px-3 py-2 hover:bg-white">
            {t("clinics")}
          </Link>
          <LanguageSwitch />
        </nav>
      </div>
    </header>
  );
}
