import { useTranslation } from "react-i18next";
import { LocaleLink } from "../locale-link";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="portal mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-5xl">404</h1>
      <p className="mt-4 text-muted">{t("common.notFound")}</p>
      <LocaleLink to="/" className="btn btn-primary mt-8">
        {t("nav.home")}
      </LocaleLink>
    </div>
  );
}
