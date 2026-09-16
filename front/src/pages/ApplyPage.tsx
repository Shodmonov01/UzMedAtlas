import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { LeadForm } from "../components/LeadForm";
import { localized } from "@/lib/format";
import { useLocale, withLocale } from "../locale-link";

type ApplyData = {
  clinic: {
    slug: string;
    nameEn: string;
    nameRu: string;
    afterRequestEn: string | null;
    afterRequestRu: string | null;
  };
  usedChecker: boolean;
  checker: {
    symptoms?: string;
    age?: number;
    gender?: string;
    duration?: string;
    specialtySlug?: string;
  } | null;
  specialty: { nameEn: string; nameRu: string } | null;
};

export function ApplyPage() {
  const { slug } = useParams();
  const locale = useLocale();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<ApplyData | null>(null);

  useEffect(() => {
    if (!slug) return;
    api
      .get<ApplyData>(`/api/apply/${slug}`)
      .then(setData)
      .catch(() => navigate(withLocale(locale, "/clinics"), { replace: true }));
  }, [slug, locale, navigate]);

  if (!data) return null;
  const checker = data.checker;
  const summary = data.usedChecker
    ? [
        checker?.symptoms,
        checker?.age ? `${t("checker.age")}: ${checker.age}` : null,
        checker?.gender
          ? `${t("checker.gender")}: ${
              checker.gender === "female"
                ? t("checker.female")
                : checker.gender === "male"
                  ? t("checker.male")
                  : t("checker.preferNot")
            }`
          : null,
        checker?.duration
          ? `${t("checker.duration")}: ${
              checker.duration === "few_days"
                ? t("checker.fewDays")
                : checker.duration === "few_weeks"
                  ? t("checker.fewWeeks")
                  : checker.duration === "few_months"
                    ? t("checker.fewMonths")
                    : t("checker.moreThanYear")
            }`
          : null,
        data.specialty ? localized(data.specialty, locale, "name") : null,
      ].filter(Boolean) as string[]
    : [];

  return (
    <div className="portal mx-auto max-w-2xl px-4 py-6 md:py-10">
      <h1 className="text-3xl md:text-5xl">{t("apply.title", { clinic: localized(data.clinic, locale, "name") })}</h1>
      <p className="mt-3 text-muted">{t("apply.subtitle")}</p>
      <div className="mt-8">
        <LeadForm
          clinicSlug={data.clinic.slug}
          usedChecker={data.usedChecker}
          checkerSummary={summary}
          afterRequest={(locale === "ru" ? data.clinic.afterRequestRu : data.clinic.afterRequestEn) || undefined}
        />
      </div>
    </div>
  );
}
