"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

export function SkipLink() {
  const t = useTranslations("common");
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <a href="#main-content" className="skip-link">
      {t("skipToContent")}
    </a>
  );
}
