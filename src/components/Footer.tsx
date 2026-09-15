"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="px-3 pb-6 pt-10">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-line bg-white px-6 py-8 text-sm text-muted">
        <p className="max-w-3xl">{t("disclaimer")}</p>
        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-bold text-ink">
          <Link href="/how-it-works">{t("how")}</Link>
          <Link href="/faq">{t("faq")}</Link>
          <Link href="/privacy">{t("privacy")}</Link>
          <Link href="/clinics">{t("clinics")}</Link>
        </nav>
        <p className="mt-4 font-extrabold text-ink">UzMedAtlas · {t("rights")}</p>
      </div>
    </footer>
  );
}
