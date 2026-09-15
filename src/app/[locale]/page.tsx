import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeChecker } from "@/components/HomeChecker";
import { ClinicCard } from "@/components/ClinicCard";
import { FaqList } from "@/components/FaqList";
import { Greeting } from "@/components/Greeting";
import { Avatar } from "@/components/Avatar";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";
import { queryClinics } from "@/lib/catalog-query";
import { cityLabel, localized } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations("home");
  const tFaq = await getTranslations("faq");
  const [clinicCount, cityGroups] = await Promise.all([
    prisma.clinic.count({ where: { published: true } }),
    prisma.clinic.groupBy({
      by: ["city"],
      where: { published: true },
      _count: { city: true },
    }),
  ]);
  await trackEvent("home_view");
  const featured = (await queryClinics({ sort: "response" })).slice(0, 4);
  const faqItems = (tFaq.raw("items") as { q: string; a: string }[]).slice(0, 3);
  const fastest = featured[0];
  const bars = [40, 70, 48, 88, 62, 95, 54, 78, 36, 84];

  return (
    <div className="portal">
      <section className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <p className="text-sm font-bold text-muted">
          {t("portal")} <span className="text-ink">/</span> {t("live")}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="max-w-3xl text-4xl leading-[1.05] md:text-6xl">
              <Greeting />
              <span className="block text-muted">{t("title")}</span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted md:text-lg">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">{clinicCount} {t("trustClinics")}</span>
            <span className="chip">{t("trustLanguages")}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <HomeChecker locale={locale} clinicCount={clinicCount} />
          <div className="grid gap-4">
            <div className="rounded-[2rem] bg-teal-deep p-5 text-white">
              <p className="text-sm font-semibold text-white/70">{t("statReply")}</p>
              <p className="mt-2 text-5xl font-extrabold tabular-nums">
                {fastest ? t("hoursShort", { hours: fastest.responseHours }) : "12h"}
              </p>
              <p className="mt-1 text-sm text-white/70">{t("featured")}</p>
              <div className="spark mt-5">
                {bars.map((height, index) => (
                  <span
                    key={height + index}
                    className={index === 3 || index === 5 ? "on" : ""}
                    style={{ height: `${height}%`, background: index === 5 ? "#c8e6c0" : undefined }}
                  />
                ))}
              </div>
            </div>
            <div className="soft-card rounded-[2rem] bg-white p-5">
              <p className="text-sm font-semibold text-muted">{t("trustCities")}</p>
              <div className="mt-4 space-y-3">
                {cityGroups.map((item) => (
                  <div key={item.city} className="flex items-center justify-between gap-3">
                    <span className="font-bold">{cityLabel(item.city, loc)}</span>
                    <span className="chip">{item._count.city}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[t("step1"), t("step2"), t("step3")].map((step, index) => (
            <div key={step} className="soft-card rounded-[2rem] bg-white p-5">
              <span className="chip">0{index + 1}</span>
              <p className="mt-3 text-lg font-bold leading-snug">{step}</p>
            </div>
          ))}
        </section>
        <p className="mt-4">
          <Link href="/how-it-works" className="text-sm font-bold text-teal-deep">
            {t("howMore")}
          </Link>
        </p>

        {featured.length ? (
          <section className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-3xl">{t("featured")}</h2>
                <Link href="/clinics" className="text-sm font-bold text-teal-deep">
                  {t("allClinics")}
                </Link>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {featured.slice(0, 4).map((clinic) => (
                  <ClinicCard key={clinic.id} clinic={clinic} compact />
                ))}
              </div>
            </div>
            <aside className="soft-card h-fit rounded-[2rem] bg-white p-5">
              <h2 className="text-xl font-extrabold">{t("fastList")}</h2>
              <ul className="mt-4 space-y-3">
                {featured.map((clinic) => (
                  <li key={clinic.id}>
                    <Link href={`/clinics/${clinic.slug}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-mint">
                      <Avatar name={clinic.coordinatorName || clinic.nameEn} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{localized(clinic, loc, "name")}</span>
                        <span className="block text-xs text-muted">
                          {clinic.coordinatorName || cityLabel(clinic.city, loc)}
                        </span>
                      </span>
                      <span className="chip pill-ok">{t("hoursShort", { hours: clinic.responseHours })}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </section>
        ) : null}

        <section className="mt-10 pb-8">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-3xl">{tFaq("title")}</h2>
            <Link href="/faq" className="text-sm font-bold text-teal-deep">
              {t("allFaq")}
            </Link>
          </div>
          <div className="mt-5">
            <FaqList items={faqItems} />
          </div>
        </section>
      </section>
    </div>
  );
}
