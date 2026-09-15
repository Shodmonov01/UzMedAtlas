import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { LocaleLink, useLocale, useLocalePath, withLocale } from "../locale-link";
import { cn } from "@/lib/format";

const LINKS = [
  ["dashboard", "/admin"],
  ["clinics", "/admin/clinics"],
  ["specialties", "/admin/specialties"],
  ["services", "/admin/services"],
  ["leads", "/admin/leads"],
  ["outbox", "/admin/outbox"],
] as const;

function AdminNav() {
  const { t } = useTranslation();
  const locale = useLocale();
  const pathname = useLocalePath();
  const navigate = useNavigate();

  async function logout() {
    await api.post("/api/admin/logout");
    navigate(withLocale(locale, "/admin/login"));
  }

  return (
    <aside className="border-b border-line bg-white p-5 md:min-h-screen md:border-b-0 md:border-r">
      <p className="text-xl font-extrabold tracking-tight">UzMedAtlas</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted">{t("admin.dashboard")}</p>
      <nav className="mt-6 grid gap-1 text-sm font-bold">
        {LINKS.map(([key, href]) => (
          <LocaleLink
            key={href}
            to={href}
            className={cn(
              "rounded-full px-3 py-2",
              pathname === href || (href !== "/admin" && pathname.startsWith(href))
                ? "bg-lime text-teal-deep"
                : "text-muted hover:bg-mint",
            )}
          >
            {t(`admin.${key}`)}
          </LocaleLink>
        ))}
      </nav>
      <div className="mt-8 flex items-center gap-3">
        <LanguageSwitch />
        <button className="text-sm font-bold text-muted" type="button" onClick={logout}>
          {t("admin.signOut")}
        </button>
      </div>
    </aside>
  );
}

export function AdminLayout() {
  const [ok, setOk] = useState<boolean | null>(null);
  const locale = useLocale();

  useEffect(() => {
    api.get<{ ok: boolean }>("/api/admin/me").then((data) => setOk(data.ok));
  }, []);

  if (ok === null) return null;
  if (!ok) return <Navigate to={withLocale(locale, "/admin/login")} replace />;

  return (
    <div className="admin-shell">
      <AdminNav />
      <div className="min-h-screen p-4 md:p-8">
        <Outlet />
      </div>
    </div>
  );
}
