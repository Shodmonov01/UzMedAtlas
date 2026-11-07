import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { CITY_LABELS, fetchClinicBranch } from "@/shared/api/client";
import { isOpenNow, type DayHours } from "@/shared/lib/schedule";
import { BranchMap } from "@/shared/ui/BranchMap";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { FitImage } from "@/shared/ui/FitImage";
import { LogoTiles } from "@/shared/ui/LogoTiles";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { PhotoCarousel, type GalleryPhoto } from "@/shared/ui/PhotoCarousel";
import { yandexPointUrl, yandexRouteUrl } from "@/shared/lib/yandex-maps";
import { countWord, pickName, useLang, type Lang, type Text } from "@/shared/i18n/lang";
import { LeadForm } from "@/widgets/lead-form/LeadForm";
import {
  ContactCard,
  DoctorList,
  Icon,
  MobileDock,
  PageSkeleton,
  PageState,
  PhotoMosaic,
  ProfileSection,
  QuickContact,
  SectionBar,
  ServicesList,
  telHref,
  useHeroIntro,
  type BarSection,
  type ProfileDoctor,
} from "@/widgets/clinic-profile/ClinicProfile";

export const Route = createFileRoute("/clinics/$slug/branches/$branchSlug")({
  component: BranchDetailPage,
});

const DAYS: { key: string; label: Text }[] = [
  { key: "mon", label: { ru: "Понедельник", uz: "Dushanba", en: "Monday" } },
  { key: "tue", label: { ru: "Вторник", uz: "Seshanba", en: "Tuesday" } },
  { key: "wed", label: { ru: "Среда", uz: "Chorshanba", en: "Wednesday" } },
  { key: "thu", label: { ru: "Четверг", uz: "Payshanba", en: "Thursday" } },
  { key: "fri", label: { ru: "Пятница", uz: "Juma", en: "Friday" } },
  { key: "sat", label: { ru: "Суббота", uz: "Shanba", en: "Saturday" } },
  { key: "sun", label: { ru: "Воскресенье", uz: "Yakshanba", en: "Sunday" } },
];

const L = {
  catalog: { ru: "Каталог клиник", uz: "Klinikalar katalogi", en: "Clinic catalog" },
  back: { ru: "Назад к клинике", uz: "Klinikaga qaytish", en: "Back to the clinic" },
  clinic: { ru: "Клиника", uz: "Klinika", en: "Clinic" },
  loadError: { ru: "Не удалось загрузить страницу филиала", uz: "Filial sahifasini yuklab boʻlmadi", en: "Could not load the branch page" },
  loadErrorText: { ru: "Проверьте соединение и обновите страницу.", uz: "Internetni tekshirib, sahifani yangilang.", en: "Check your connection and reload the page." },
  notFound: { ru: "Филиал не найден", uz: "Filial topilmadi", en: "Branch not found" },
  notFoundText: { ru: "Возможно, адрес изменился. Откройте страницу клиники — там все её филиалы.", uz: "Ehtimol, manzil oʻzgargan. Klinika sahifasini oching — u yerda barcha filiallar bor.", en: "The address may have changed. Open the clinic's page to see all its branches." },
  toClinic: { ru: "К клинике", uz: "Klinikaga", en: "To the clinic" },
  branchOf: { ru: "Филиал клиники", uz: "Klinika filiali", en: "Clinic branch" },
  openNow: { ru: "Сейчас открыто", uz: "Hozir ochiq", en: "Open now" },
  closedNow: { ru: "Сейчас закрыто", uz: "Hozir yopiq", en: "Closed now" },
  allDay: { ru: "Круглосуточно, без выходных", uz: "Kecha-kunduz, dam olishsiz", en: "Open 24/7" },
  today: { ru: "Сегодня", uz: "Bugun", en: "Today" },
  request: { ru: "Оставить заявку", uz: "Ariza qoldirish", en: "Send a request" },
  howTo: { ru: "Как добраться", uz: "Qanday borish mumkin", en: "Getting there" },
  address: { ru: "Адрес", uz: "Manzil", en: "Address" },
  hours: { ru: "Режим работы", uz: "Ish vaqti", en: "Opening hours" },
  phone: { ru: "Телефон", uz: "Telefon", en: "Phone" },
  route: { ru: "Построить маршрут", uz: "Yoʻnalish qurish", en: "Get directions" },
  openMap: { ru: "Открыть на карте", uz: "Xaritada ochish", en: "Open in maps" },
  yandex: { ru: "Яндекс Карты", uz: "Yandex Xaritalar", en: "Yandex Maps" },
  addressAsk: { ru: "Адрес уточняйте у координатора", uz: "Manzilni koordinatordan soʻrang", en: "Ask the coordinator for the address" },
  features: { ru: "Особенности", uz: "Xususiyatlar", en: "Features" },
  featuresTitle: { ru: "Особенности филиала", uz: "Filial xususiyatlari", en: "About this branch" },
  advantages: { ru: "Преимущества", uz: "Afzalliklar", en: "Advantages" },
  inside: { ru: "Что есть в филиале", uz: "Filialda nimalar bor", en: "What's on site" },
  tourism: { ru: "Медицинский туризм и международное сотрудничество", uz: "Tibbiy turizm va xalqaro hamkorlik", en: "Medical travel and international cooperation" },
  directions: { ru: "Направления", uz: "Yoʻnalishlar", en: "Specialties" },
  doctors: { ru: "Врачи", uz: "Shifokorlar", en: "Doctors" },
  doctorsTitle: { ru: "Специалисты", uz: "Mutaxassislar", en: "Specialists" },
  team: { ru: "Команда", uz: "Jamoa", en: "Team" },
  services: { ru: "Услуги", uz: "Xizmatlar", en: "Services" },
  servicesTitle: { ru: "Услуги и цены", uz: "Xizmatlar va narxlar", en: "Services and prices" },
  prices: { ru: "Цены", uz: "Narxlar", en: "Prices" },
  equipment: { ru: "Оборудование", uz: "Uskunalar", en: "Equipment" },
  equipmentKicker: { ru: "Оснащение", uz: "Jihozlar", en: "Facilities" },
  photos: { ru: "Фотографии", uz: "Rasmlar", en: "Photos" },
  insideKicker: { ru: "Внутри", uz: "Ichkarida", en: "Inside" },
  map: { ru: "На карте", uz: "Xaritada", en: "On the map" },
  hoursTab: { ru: "Часы", uz: "Ish vaqti", en: "Hours" },
  contactsLabel: { ru: "Контакты филиала", uz: "Filial kontaktlari", en: "Branch contacts" },
  dayOff: { ru: "выходной", uz: "dam olish", en: "closed" },
  roundClock: { ru: "круглосуточно", uz: "kecha-kunduz", en: "24 hours" },
  specialists: { ru: ["специалист", "специалиста", "специалистов"], uz: "mutaxassis", en: ["specialist", "specialists"] },
} as const;

function todayKey() {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tashkent", weekday: "short" }).format(new Date());
  return weekday.slice(0, 3).toLowerCase();
}

/** One day's hours in the reader's language. */
function dayHours(day: DayHours | null, lang: Lang) {
  if (!day) return L.dayOff[lang];
  if (day.roundTheClock) return L.roundClock[lang];
  if (day.breakStart && day.breakEnd) return `${day.open}–${day.breakStart} / ${day.breakEnd}–${day.close}`;
  return `${day.open} – ${day.close}`;
}

/** "JCI; университетская клиника; робот-центр." → ["JCI", "Университетская клиника", "Робот-центр"] */
function points(value?: string | null) {
  return (value || "")
    .split(/[;\n]/)
    .map((item) => item.replace(/^[•\-*]\s*/, "").replace(/\.$/, "").trim())
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));
}

function BranchDetailPage() {
  const { slug, branchSlug } = Route.useParams();
  const { lang, t } = useLang();
  const root = useRef<HTMLDivElement>(null);
  const symptoms = typeof window !== "undefined" ? sessionStorage.getItem("uma_last_symptoms") || "" : "";

  const branch = useQuery({
    queryKey: ["branch", slug, branchSlug],
    queryFn: () => fetchClinicBranch(slug, branchSlug),
  });
  useHeroIntro(root, Boolean(branch.data));

  const toClinic = (
    <Link to="/clinics/$slug" params={{ slug }} className="pill-btn is-ink">
      {t(L.toClinic)}
      <span className="pill-btn-icon">
        <ArrowIcon />
      </span>
    </Link>
  );
  if (branch.isLoading) return <PageSkeleton />;
  if (branch.isError) return <PageState title={t(L.loadError)} text={t(L.loadErrorText)} action={toClinic} />;
  if (!branch.data) return <PageState title={t(L.notFound)} text={t(L.notFoundText)} action={toClinic} />;

  const data = branch.data;
  const pick = (ru?: string | null, en?: string | null) => pickName(lang, ru, en).trim() || null;
  const name: string = pickName(lang, data.nameRu, data.nameEn);
  const clinicName: string = pickName(lang, data.clinic?.nameRu, data.clinic?.nameEn) || t(L.clinic);
  const description = pick(data.descriptionRu, data.descriptionEn);
  const address = pick(data.addressRu, data.addressEn);
  const schedule: Record<string, DayHours> = data.schedule || {};
  const hasSchedule = Object.keys(schedule).length > 0;
  const allDay = hasSchedule && DAYS.every(({ key }) => schedule[key]?.roundTheClock);
  const openNow = isOpenNow(schedule);
  const today = todayKey();
  const lat = data.lat != null ? Number(data.lat) : null;
  const lng = data.lng != null ? Number(data.lng) : null;
  const hasCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const mapsUrl = hasCoords ? yandexPointUrl(lat, lng) : address ? `https://yandex.uz/maps/?text=${encodeURIComponent(address)}` : null;
  const phones: string[] = Array.isArray(data.phones) && data.phones.length ? data.phones : data.phone ? [data.phone] : [];
  const gallery: GalleryPhoto[] = (data.photos || []).map((p: { id: string; url: string; altRu?: string; altEn?: string }) => ({
    id: p.id,
    url: p.url,
    alt: pickName(lang, p.altRu, p.altEn),
  }));
  if (data.coverUrl && !gallery.some((p) => p.url === data.coverUrl)) {
    gallery.unshift({ id: "cover", url: data.coverUrl, alt: name });
  }
  const advantages = points(pick(data.advantagesRu, data.advantagesEn));
  const features = points(pick(data.featuresRu, data.featuresEn));
  const tourism = data.medicalTourism ? pick(data.medicalTourismInfoRu, data.medicalTourismInfoEn) : null;
  const specialties: { slug: string; nameRu?: string; nameEn: string }[] = data.specialties || [];
  const doctors: ProfileDoctor[] = data.doctors || [];
  const services = data.services || [];
  const equipment: { id: string; nameRu?: string; nameEn: string; manufacturer?: string; descriptionRu?: string; descriptionEn?: string; photoUrl?: string | null }[] = data.equipment || [];
  const hoursLabel = allDay ? t(L.allDay) : hasSchedule ? `${t(L.today)}: ${dayHours(schedule[today] ?? null, lang)}` : null;
  const facts = [
    doctors.length ? { value: String(doctors.length), label: countWord(lang, doctors.length, { ru: [...L.specialists.ru], uz: L.specialists.uz, en: [...L.specialists.en] }) } : null,
    specialties.length ? { value: String(specialties.length), label: countWord(lang, specialties.length, { ru: ["направление", "направления", "направлений"], uz: "yoʻnalish", en: ["specialty", "specialties"] }) } : null,
    services.length ? { value: String(services.length), label: countWord(lang, services.length, { ru: ["услуга", "услуги", "услуг"], uz: "xizmat", en: ["service", "services"] }) } : null,
    allDay ? { value: "24/7", label: t({ ru: "без выходных", uz: "dam olishsiz", en: "every day" }) } : null,
  ].filter(Boolean) as { value: string; label: string }[];

  const sections: BarSection[] = [
    advantages.length || features.length || tourism ? { id: "features", label: t(L.features) } : null,
    specialties.length ? { id: "specialties", label: t(L.directions), count: specialties.length } : null,
    doctors.length ? { id: "doctors", label: t(L.doctors), count: doctors.length } : null,
    services.length ? { id: "services", label: t(L.services), count: services.length } : null,
    equipment.length ? { id: "equipment", label: t(L.equipment) } : null,
    address || hasCoords ? { id: "location", label: t(L.map) } : null,
  ].filter(Boolean) as BarSection[];

  return (
    <div ref={root} className="cp">
      <div className="wrap">
        <nav className="cp-crumbs" aria-label="Breadcrumbs">
          <Link to="/clinics/$slug" params={{ slug }} className="cp-back" aria-label={t(L.back)}>
            <ArrowIcon size={15} />
          </Link>
          <Link to="/" hash="catalog" className="hidden sm:inline">
            {t(L.catalog)}
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">
            /
          </span>
          <Link to="/clinics/$slug" params={{ slug }} className="min-w-0 truncate">
            {clinicName}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{name}</span>
        </nav>

        <header className="cp-hero">
          <div className="cp-hero-copy">
            <div className="cp-hero-top">
              <ClinicLogo src={data.clinic?.logoUrl} name={clinicName} className="h-16 rounded-[18px] md:h-[72px]" wide />
              <div className="cp-chips">
                <span className="cp-chip">
                  <Icon name="pin" size={14} />
                  {CITY_LABELS[data.city] || data.city}
                </span>
                <span className="cp-chip">{t(L.branchOf)}</span>
                {hasSchedule ? <span className={`cp-chip ${openNow ? "is-open" : "is-closed"}`}>{openNow ? t(L.openNow) : t(L.closedNow)}</span> : null}
              </div>
            </div>

            <h1 className="cp-title">{name}</h1>
            {hoursLabel ? (
              <p className="-mt-2 flex items-center gap-2 text-[15px] font-semibold text-muted">
                <Icon name="clock" size={16} />
                {hoursLabel}
              </p>
            ) : null}
            {description ? <p className="cp-intro">{description}</p> : null}

            {specialties.length ? (
              <div className="cp-tags">
                {specialties.slice(0, 4).map((s) => (
                  <span key={s.slug}>{pickName(lang, s.nameRu, s.nameEn)}</span>
                ))}
                {specialties.length > 4 ? <a href="#specialties">+{specialties.length - 4}</a> : null}
              </div>
            ) : null}

            <div className="cp-hero-actions">
              <a href="#lead" className="pill-btn is-ink">
                {t(L.request)}
                <span className="pill-btn-icon">
                  <ArrowIcon />
                </span>
              </a>
              {phones[0] ? (
                <a href={telHref(phones[0])} className="pill-btn is-outline">
                  <Icon name="phone" size={17} />
                  {phones[0]}
                </a>
              ) : null}
            </div>

            {facts.length ? (
              <dl className="cp-facts">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="sr-only">{fact.label}</dt>
                    <dd>
                      <strong>{fact.value}</strong>
                      <span>{fact.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          <div className="cp-hero-media">
            {gallery.length ? (
              <PhotoMosaic photos={gallery} />
            ) : (
              <div className="cp-hero-facts">
                <LogoTiles corner="br" seed={17} />
                <p>{t(L.howTo)}</p>
                {address ? (
                  <div className="cp-hero-fact">
                    <Icon name="pin" />
                    <div>
                      <small>{t(L.address)}</small>
                      {address}
                    </div>
                  </div>
                ) : null}
                {hoursLabel ? (
                  <div className="cp-hero-fact">
                    <Icon name="clock" />
                    <div>
                      <small>{t(L.hours)}</small>
                      {hoursLabel}
                    </div>
                  </div>
                ) : null}
                {phones.length ? (
                  <div className="cp-hero-fact">
                    <Icon name="phone" />
                    <div>
                      <small>{t(L.phone)}</small>
                      {phones.slice(0, 2).map((phone) => (
                        <a key={phone} href={telHref(phone)} className="block">
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
                {mapsUrl ? (
                  <a href={hasCoords ? yandexRouteUrl(lat, lng) : mapsUrl} target="_blank" rel="noreferrer" className="pill-btn is-light">
                    {hasCoords ? t(L.route) : t(L.openMap)}
                    <span className="pill-btn-icon">
                      <Icon name="route" size={17} />
                    </span>
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </header>
      </div>

      {sections.length ? <SectionBar sections={sections} cta={t(L.request)} /> : null}

      <div className="wrap cp-body">
        <div className="cp-main">
          {advantages.length || features.length || tourism ? (
            <ProfileSection id="features" kicker={t(L.features)} title={t(L.featuresTitle)}>
              {advantages.length || features.length ? (
                <div className="cp-grid">
                  {advantages.length ? (
                    <div className={`cp-card${features.length ? "" : " is-wide"}`}>
                      <p className="cp-label">{t(L.advantages)}</p>
                      <ul className="cp-checks is-plain mt-4">
                        {advantages.map((item) => (
                          <li key={item}>
                            <span>
                              <Icon name="check" size={14} />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {features.length ? (
                    <div className={`cp-card${advantages.length ? "" : " is-wide"}`}>
                      <p className="cp-label">{t(L.inside)}</p>
                      <ul className="cp-checks is-plain mt-4">
                        {features.map((item) => (
                          <li key={item}>
                            <span>
                              <Icon name="check" size={14} />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {tourism ? (
                <div className="cp-popular">
                  <p className="cp-label">{t(L.tourism)}</p>
                  <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink">{tourism}</p>
                </div>
              ) : null}
            </ProfileSection>
          ) : null}

          {specialties.length ? (
            <ProfileSection id="specialties" kicker={t(L.directions)} title={t(L.directions)} count={specialties.length}>
              <div className="cp-pills">
                {specialties.map((s) => (
                  <span key={s.slug}>
                    <i aria-hidden="true" />
                    {pickName(lang, s.nameRu, s.nameEn)}
                  </span>
                ))}
              </div>
            </ProfileSection>
          ) : null}

          {doctors.length ? (
            <ProfileSection id="doctors" kicker={t(L.team)} title={t(L.doctorsTitle)} count={doctors.length}>
              <DoctorList doctors={doctors} />
            </ProfileSection>
          ) : null}

          {services.length ? (
            <ProfileSection id="services" kicker={t(L.prices)} title={t(L.servicesTitle)} count={services.length}>
              <ServicesList services={services} />
            </ProfileSection>
          ) : null}

          {equipment.length ? (
            <ProfileSection id="equipment" kicker={t(L.equipmentKicker)} title={t(L.equipment)}>
              <ul className="cp-grid">
                {equipment.map((e) => (
                  <li key={e.id} className="cp-card is-row">
                    {e.photoUrl ? <FitImage src={e.photoUrl} className="cp-thumb" tolerance={0.2} /> : null}
                    <div className="min-w-0">
                      {e.manufacturer ? <p className="cp-label">{e.manufacturer}</p> : null}
                      <h3 className={e.manufacturer ? "mt-1.5" : undefined}>{pickName(lang, e.nameRu, e.nameEn)}</h3>
                      {pick(e.descriptionRu, e.descriptionEn) ? <p className="mt-2">{pick(e.descriptionRu, e.descriptionEn)}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </ProfileSection>
          ) : null}

          {gallery.length > 3 ? (
            <ProfileSection kicker={t(L.insideKicker)} title={t(L.photos)} count={gallery.length}>
              <PhotoCarousel photos={gallery} />
            </ProfileSection>
          ) : null}

          {address || hasCoords ? (
            <ProfileSection id="location" kicker={t(L.howTo)} title={t(L.map)}>
              {hasCoords ? (
                <div className="cp-map">
                  <BranchMap mode="view" lat={lat} lng={lng} className="w-full max-w-full" />
                </div>
              ) : null}
              <div className="cp-address">
                <p>
                  <Icon name="pin" size={20} />
                  {address || t(L.addressAsk)}
                </p>
                <div className="cp-address-actions">
                  {hasCoords ? (
                    <a className="pill-btn is-ink" href={yandexRouteUrl(lat, lng)} target="_blank" rel="noreferrer">
                      {t(L.route)}
                      <span className="pill-btn-icon">
                        <Icon name="route" size={17} />
                      </span>
                    </a>
                  ) : null}
                  {mapsUrl ? (
                    <a className="pill-btn is-outline" href={mapsUrl} target="_blank" rel="noreferrer">
                      {t(L.yandex)}
                    </a>
                  ) : null}
                </div>
              </div>
            </ProfileSection>
          ) : null}
        </div>

        <aside className="cp-aside">
          <LeadForm clinicSlug={slug} clinicName={clinicName} defaultSymptoms={symptoms} />
          <ContactCard
            logoUrl={data.clinic?.logoUrl}
            name={name}
            label={t(L.contactsLabel)}
            phones={phones}
            email={data.email}
            website={data.website}
            whatsapp={data.whatsapp}
            telegram={data.telegram}
            instagram={data.instagram}
            socials={data.socials}
          >
            {hasSchedule ? (
              <div className="cp-contact-extra">
                <small>{t(L.hours)}</small>
                {allDay ? (
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                    <span className="text-accent">
                      <Icon name="clock" size={16} />
                    </span>
                    {t(L.allDay)}
                  </p>
                ) : (
                  <ul className="cp-hours">
                    {DAYS.map(({ key, label }) => (
                      <li key={key} className={key === today ? "is-today" : undefined}>
                        <span>{t(label)}</span>
                        <span>{dayHours(schedule[key] ?? null, lang)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </ContactCard>
          <QuickContact name={name} phone={phones[0]} whatsapp={data.whatsapp} telegram={data.telegram} cta={t(L.request)} />
        </aside>
      </div>

      <MobileDock cta={t(L.request)} phone={phones[0]} />
    </div>
  );
}
