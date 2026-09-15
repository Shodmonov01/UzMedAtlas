"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/format";

export function LanguageSwitch() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex rounded-full bg-mint p-1 text-xs font-extrabold">
      {(["en", "ru"] as const).map((code) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          className={cn(
            "rounded-full px-3 py-1.5",
            locale === code ? "bg-white text-ink shadow-sm" : "text-muted",
          )}
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
