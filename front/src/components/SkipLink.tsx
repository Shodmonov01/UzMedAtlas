import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

export function SkipLink() {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname.replace(/^\/(en|ru)/, "") || "/";
  if (path.startsWith("/admin")) return null;
  return (
    <a href="#main-content" className="skip-link">
      {t("common.skipToContent")}
    </a>
  );
}
