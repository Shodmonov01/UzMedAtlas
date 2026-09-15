import { useTranslation } from "react-i18next";
import { LocaleLink } from "../locale-link";

export function StickyApplyBar({ slug, clinicName }: { slug: string; clinicName: string }) {
  const { t } = useTranslation();
  return (
    <div className="sticky-apply">
      <p className="truncate text-sm font-semibold">{clinicName}</p>
      <LocaleLink to={`/clinics/${slug}/apply`} className="btn btn-clay px-4 py-2 text-sm">
        {t("clinic.apply")}
      </LocaleLink>
    </div>
  );
}
