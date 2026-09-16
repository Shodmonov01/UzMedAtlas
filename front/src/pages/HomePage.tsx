import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClinicCard, type ClinicCardClinic } from "../components/ClinicCard";
import { FaqList } from "../components/FaqList";
import { Avatar } from "../components/Avatar";
import { DoctorPortrait } from "../components/DoctorPortrait";
import { LocaleLink, useLocale } from "../locale-link";
import { api } from "../api";
import { cityLabel, localized } from "@/lib/format";

type HomeData = {
  clinicCount: number;
  cities: { city: string; count: number }[];
  featured: ClinicCardClinic[];
};

export function HomePage() {
  const locale = useLocale();
  const { t } = useTranslation();
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    api.get<HomeData>("/api/home").then(setData).catch(() => setData({ clinicCount: 0, cities: [], featured: [] }));
  }, []);

  const faqItems = (t("faq.items", { returnObjects: true }) as { q: string; a: string }[]).slice(0, 3);
  const featured = data?.featured ?? [];
  const clinicCount = data?.clinicCount ?? 0;

  return (
    <div className="portal">
      <section className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-[2.35rem] leading-[1.02] md:text-6xl">{t("home.title")}</h1>
            <svg className="squiggle" viewBox="0 0 220 10" fill="none" aria-hidden="true">
              <path d="M2 6c24-6 48 6 72 0s48-6 72 0 48 6 72 0" stroke="#e07a5f" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.dispatchEvent(new Event("uma-open-chat"))}
              >
                {t("home.deskCta")}
              </button>
              <LocaleLink to="/clinics" className="btn btn-ghost">
                {t("home.allClinics")}
              </LocaleLink>
            </div>
            <p className="mt-4 text-sm font-semibold text-muted">
              {clinicCount} {t("home.trustClinics")}
              {(data?.cities ?? []).length
                ? ` · ${(data?.cities ?? []).map((item) => cityLabel(item.city, locale)).join(", ")}`
                : ""}
            </p>
          </div>

          <button
            type="button"
            className="w-full max-w-sm rounded-[1.6rem] bg-teal-deep p-5 text-left text-white lg:w-[340px]"
            onClick={() => window.dispatchEvent(new Event("uma-open-chat"))}
          >
            <div className="flex items-center gap-3">
              <DoctorPortrait className="h-14 w-14 rounded-2xl" />
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-white/70">
                  <span className="live-dot" />
                  {t("home.live")}
                </p>
                <p className="text-xl font-extrabold">{t("operator.name")}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-white/85">{t("home.deskBody")}</p>
          </button>
        </div>

        {featured.length ? (
          <section className="mt-12 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-2xl md:text-3xl">{t("home.featured")}</h2>
                <LocaleLink to="/clinics" className="shrink-0 text-sm font-bold text-teal-deep">
                  {t("home.allClinics")}
                </LocaleLink>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {featured.slice(0, 4).map((clinic) => (
                  <ClinicCard key={clinic.slug} clinic={clinic} compact />
                ))}
              </div>
            </div>
            <aside className="h-fit rounded-[1.6rem] bg-white p-5 shadow-[0_18px_50px_-28px_rgba(20,36,33,0.35)]">
              <h2 className="text-xl font-extrabold">{t("home.fastList")}</h2>
              <ul className="mt-4 space-y-3">
                {featured.map((clinic) => (
                  <li key={clinic.slug}>
                    <LocaleLink to={`/clinics/${clinic.slug}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-mint">
                      <Avatar name={clinic.coordinatorName || clinic.nameEn} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{localized(clinic, locale, "name")}</span>
                        <span className="block text-xs text-muted">
                          {clinic.coordinatorName || cityLabel(clinic.city, locale)}
                        </span>
                      </span>
                      <span className="chip pill-ok">{t("home.hoursShort", { hours: clinic.responseHours })}</span>
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </aside>
          </section>
        ) : null}

        <section className="mt-10 pb-8">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl md:text-3xl">{t("faq.title")}</h2>
            <LocaleLink to="/faq" className="text-sm font-bold text-teal-deep">
              {t("home.allFaq")}
            </LocaleLink>
          </div>
          <div className="mt-5">
            <FaqList items={faqItems} />
          </div>
        </section>
      </section>
    </div>
  );
}
