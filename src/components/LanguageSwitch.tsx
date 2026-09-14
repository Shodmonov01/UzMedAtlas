"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/format";

export function LanguageSwitch() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex overflow-hidden rounded-full border border-line bg-white text-xs font-bold">
      {(["en", "ru"] as const).map((code) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          className={cn(
            "px-3 py-2",
            locale === code ? "bg-teal text-white" : "text-muted",
          )}
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
