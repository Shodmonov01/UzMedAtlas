import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { LocaleLink } from "../locale-link";

export function Footer() {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname.replace(/^\/(en|ru)/, "") || "/";
  if (path.startsWith("/admin")) return null;

  return (
    <footer className="px-3 pb-24 pt-10 md:pb-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-line bg-white px-6 py-8 text-sm text-muted">
        <p className="max-w-3xl">{t("footer.disclaimer")}</p>
        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-bold text-ink">
          <LocaleLink to="/how-it-works">{t("footer.how")}</LocaleLink>
          <LocaleLink to="/faq">{t("footer.faq")}</LocaleLink>
          <LocaleLink to="/privacy">{t("footer.privacy")}</LocaleLink>
          <LocaleLink to="/clinics">{t("footer.clinics")}</LocaleLink>
        </nav>
        <p className="mt-4 font-extrabold text-ink">UzMedAtlas · {t("footer.rights")}</p>
      </div>
    </footer>
  );
}
