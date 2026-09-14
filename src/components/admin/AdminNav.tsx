"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { adminLogout } from "@/actions/admin";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { cn } from "@/lib/format";

const LINKS = [
  ["dashboard", "/admin"],
  ["clinics", "/admin/clinics"],
  ["specialties", "/admin/specialties"],
  ["services", "/admin/services"],
  ["leads", "/admin/leads"],
] as const;

export function AdminNav({ locale }: { locale: string }) {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <aside className="border-b border-line bg-teal-deep p-5 text-white md:min-h-screen md:border-b-0 md:border-r">
      <p className="font-display text-2xl">UzMedAtlas</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-white/70">{t("dashboard")}</p>
      <nav className="mt-6 grid gap-1 text-sm font-semibold">
        {LINKS.map(([key, href]) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-xl px-3 py-2 hover:bg-white/10",
              pathname === href || (href !== "/admin" && pathname.startsWith(href))
                ? "bg-white/15"
                : "",
            )}
          >
            {t(key)}
          </Link>
        ))}
      </nav>
      <div className="mt-8 flex items-center gap-3">
        <LanguageSwitch />
        <form action={adminLogout}>
          <input type="hidden" name="locale" value={locale} />
          <button className="text-sm underline" type="submit">
            {t("signOut")}
          </button>
        </form>
      </div>
    </aside>
  );
}
