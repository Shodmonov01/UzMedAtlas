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
  ["outbox", "/admin/outbox"],
] as const;

export function AdminNav({ locale }: { locale: string }) {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <aside className="border-b border-line bg-white p-5 md:min-h-screen md:border-b-0 md:border-r">
      <p className="text-xl font-extrabold tracking-tight">UzMedAtlas</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted">{t("dashboard")}</p>
      <nav className="mt-6 grid gap-1 text-sm font-bold">
        {LINKS.map(([key, href]) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-full px-3 py-2",
              pathname === href || (href !== "/admin" && pathname.startsWith(href))
                ? "bg-lime text-teal-deep"
                : "text-muted hover:bg-mint",
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
          <button className="text-sm font-bold text-muted" type="submit">
            {t("signOut")}
          </button>
        </form>
      </div>
    </aside>
  );
}
