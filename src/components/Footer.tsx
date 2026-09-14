"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-line bg-sand">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        <p className="max-w-3xl">{t("disclaimer")}</p>
        <p className="mt-4 font-semibold text-ink">UzMedAtlas · {t("rights")}</p>
      </div>
    </footer>
  );
}
