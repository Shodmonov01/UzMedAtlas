import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { ClinicCard, type ClinicCardClinic } from "../components/ClinicCard";
import { LocaleLink, useLocale, withLocale } from "../locale-link";
import { cityLabel, formatPrice, languageLabel, localized, parseLanguages } from "@/lib/format";

type Results = {
  state: { symptoms: string; specialtySlug: string; specialtySlugs?: string[]; redFlags?: string[] };
  specialty: {
    slug: string;
    nameEn: string;
    nameRu: string;
    explanationEn: string;
    explanationRu: string;
  };
  alternatives: { id: string; slug: string; nameEn: string; nameRu: string }[];
  clinics: ClinicCardClinic[];
};

export function ResultsPage() {
  const locale = useLocale();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<Results | null>(null);

  function load() {
    api
      .get<Results>("/api/checker/results")
      .then(setData)
      .catch(() => navigate(withLocale(locale, "/"), { replace: true }));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function choose(slug: string) {
    await api.post("/api/checker/choose", { specialtySlug: slug });
    load();
  }

  if (!data) return null;
  const specialtyName = localized(data.specialty, locale, "name");
  const redFlagCopy: Record<string, string> = {
    chest: t("results.redFlagChest"),
    stroke: t("results.redFlagStroke"),
    bleeding: t("results.redFlagBleeding"),
  };

  return (
    <div className="portal mx-auto max-w-7xl px-4 py-12">
      <p className="chip w-fit">{t("results.kicker")}</p>
      <h1 className="mt-4 max-w-4xl text-4xl md:text-6xl">{specialtyName}</h1>
      <p className="mt-4 max-w-3xl text-lg text-muted">{t("results.title", { specialty: specialtyName })}</p>
      {data.state.redFlags?.length ? (
        <div className="mt-6 max-w-3xl rounded-[1.8rem] bg-orange-50 p-5">
          <h2 className="font-display text-2xl">{t("results.redFlagTitle")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.state.redFlags.map((flag) => (
              <li key={flag}>{redFlagCopy[flag]}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <section className="mt-8 max-w-3xl rounded-3xl border border-line bg-white p-6">
        <h2 className="font-display text-2xl">{t("results.why")}</h2>
        <p className="mt-3 leading-relaxed text-muted">{localized(data.specialty, locale, "explanation")}</p>
        <p className="mt-4 text-sm text-muted">{t("results.disclaimerBox")}</p>
      </section>
      {data.alternatives.length > 0 ? (
        <section className="mt-8 max-w-3xl">
          <h2 className="font-display text-2xl">{t("results.also")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.alternatives.map((item) => (
              <button key={item.id} className="chip" type="button" onClick={() => choose(item.slug)}>
                {localized(item, locale, "name")} · {t("results.notThis")}
              </button>
            ))}
          </div>
        </section>
      ) : null}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl">{t("results.clinics")}</h2>
          <LocaleLink to={`/clinics?specialty=${data.specialty.slug}`} className="text-sm font-semibold text-teal">
            {t("results.allClinics")}
          </LocaleLink>
        </div>
        {data.clinics.length === 0 ? (
          <p className="mt-6 text-muted">
            {t("results.empty")}{" "}
            <LocaleLink to="/clinics" className="font-semibold text-teal">
              {t("results.browse")}
            </LocaleLink>
          </p>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-sand">
                  <tr>
                    <th className="px-4 py-3">{t("results.clinics")}</th>
                    <th className="px-4 py-3">{t("catalog.city")}</th>
                    <th className="px-4 py-3">{t("results.fromPrice")}</th>
                    <th className="px-4 py-3">{t("results.response")}</th>
                    <th className="px-4 py-3">{t("catalog.languages")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.clinics.map((clinic) => (
                    <tr key={clinic.slug} className="border-t border-line">
                      <td className="px-4 py-3 font-semibold">{localized(clinic, locale, "name")}</td>
                      <td className="px-4 py-3">{cityLabel(clinic.city, locale)}</td>
                      <td className="px-4 py-3">{formatPrice(clinic.fromPrice ?? null, locale)}</td>
                      <td className="px-4 py-3">{t("results.hours", { hours: clinic.responseHours })}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted">
                          {parseLanguages(clinic.languages)
                            .map((code) => languageLabel(code, locale))
                            .join(", ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {data.clinics.slice(0, 6).map((clinic) => (
                <ClinicCard
                  key={clinic.slug}
                  clinic={clinic}
                  matchReason={t("results.whyClinic", { specialty: specialtyName })}
                />
              ))}
            </div>
          </>
        )}
      </section>
      <p className="mt-10">
        <LocaleLink to="/" className="text-sm font-semibold text-muted">
          {t("results.change")}
        </LocaleLink>
      </p>
    </div>
  );
}
