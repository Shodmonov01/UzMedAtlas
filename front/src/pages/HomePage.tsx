import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HomeChecker } from "../components/HomeChecker";
import { ClinicCard, type ClinicCardClinic } from "../components/ClinicCard";
import { FaqList } from "../components/FaqList";
import { Greeting } from "../components/Greeting";
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
  const fastest = featured[0];

  return (
    <div className="portal">
      <section className="mx-auto max-w-7xl px-4 py-5 md:py-10">
        <p className="text-sm font-bold text-muted">{t("home.portal")}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-lg font-extrabold text-teal-deep md:text-2xl">
              <Greeting />
            </p>
            <h1 className="mt-1 text-[2.05rem] leading-[1.05] md:text-6xl">
              {t("home.title")}
            </h1>
            <svg className="squiggle" viewBox="0 0 220 10" fill="none" aria-hidden="true">
              <path d="M2 6c24-6 48 6 72 0s48-6 72 0 48 6 72 0" stroke="#e07a5f" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="mt-3 max-w-xl text-base text-muted md:text-lg">{t("home.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">
              {clinicCount} {t("home.trustClinics")}
            </span>
            <span className="chip">{t("home.trustLanguages")}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_340px]">
          <HomeChecker locale={locale} clinicCount={clinicCount} />
          <div className="grid gap-4">
            <button
              type="button"
              className="rounded-[1.6rem] bg-teal-deep p-5 text-left text-white"
              onClick={() => window.dispatchEvent(new Event("uma-open-chat"))}
            >
              <div className="flex items-center gap-3">
                <DoctorPortrait className="h-14 w-14 rounded-2xl" />
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-white/70">
                    <span className="live-dot" />
                    {t("home.live")}
                  </p>
                  <p className="text-lg font-extrabold">{t("operator.name")}</p>
                  <p className="text-sm text-white/70">{t("home.deskTitle")}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{t("home.deskBody")}</p>
              {fastest ? (
                <p className="mt-3 text-sm text-white/70">
                  {t("home.statReply")} {t("home.hoursShort", { hours: fastest.responseHours })}
                </p>
              ) : null}
              <span className="btn mt-4 w-full bg-white text-teal-deep sm:w-auto">{t("home.deskCta")}</span>
            </button>
            <div className="rounded-[1.6rem] bg-white p-5 shadow-[0_18px_50px_-28px_rgba(20,36,33,0.35)]">
              <p className="text-sm font-semibold text-muted">{t("home.trustCities")}</p>
              <div className="mt-4 space-y-3">
                {(data?.cities ?? []).map((item) => (
                  <div key={item.city} className="flex items-center justify-between gap-3">
                    <span className="font-bold">{cityLabel(item.city, locale)}</span>
                    <span className="chip">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-3 md:grid-cols-3 md:gap-4">
          {[t("home.step1"), t("home.step2"), t("home.step3")].map((step, index) => (
            <div key={step} className="rounded-[1.6rem] bg-white p-5 shadow-[0_18px_50px_-28px_rgba(20,36,33,0.35)]">
              <span className="chip">0{index + 1}</span>
              <p className="mt-3 text-lg font-bold leading-snug">{step}</p>
            </div>
          ))}
        </section>
        <p className="mt-4">
          <LocaleLink to="/how-it-works" className="text-sm font-bold text-teal-deep">
            {t("home.howMore")}
          </LocaleLink>
        </p>

        {featured.length ? (
          <section className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
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
