import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { CITY_LABELS, fetchClinicBranch } from "@/shared/api/client";
import { isOpenNow, type DayHours } from "@/shared/lib/schedule";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { LogoTiles } from "@/shared/ui/LogoTiles";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { type GalleryPhoto } from "@/shared/ui/PhotoCarousel";
import { yandexPointUrl, yandexRouteUrl } from "@/shared/lib/yandex-maps";
import { countWord, pickName, useLang, type Lang, type Text } from "@/shared/i18n/lang";
import { LeadForm } from "@/widgets/lead-form/LeadForm";
import {
  CheckList,
  ContactCard,
  DoctorList,
  EquipmentGrid,
  HeroGallery,
  HeroStats,
  Icon,
  InfoCard,
  LocationBlock,
  MetaLine,
  MobileDock,
  PageSkeleton,
  PageState,
  PhotoSection,
  ProfileSection,
  QuickContact,
  ReadMore,
  SectionBar,
  ServicesList,
  socialHref,
  splitPoints,
  telHref,
  useHeroIntro,
  type BarSection,
  type EquipmentItem,
  type HeroStat,
  type IconName,
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
  const advantages = splitPoints(pick(data.advantagesRu, data.advantagesEn));
  const features = splitPoints(pick(data.featuresRu, data.featuresEn));
  const tourism = data.medicalTourism ? pick(data.medicalTourismInfoRu, data.medicalTourismInfoEn) : null;
  const specialties: { slug: string; nameRu?: string; nameEn: string }[] = data.specialties || [];
  const doctors: ProfileDoctor[] = data.doctors || [];
  const services = data.services || [];
  const equipment: EquipmentItem[] = data.equipment || [];
  const hoursLabel = allDay ? t(L.allDay) : hasSchedule ? `${t(L.today)}: ${dayHours(schedule[today] ?? null, lang)}` : null;
  const stats = [
    doctors.length ? { icon: "users", value: doctors.length, label: countWord(lang, doctors.length, { ru: [...L.specialists.ru], uz: L.specialists.uz, en: [...L.specialists.en] }), href: "#doctors" } : null,
    specialties.length ? { icon: "grid", value: specialties.length, label: countWord(lang, specialties.length, { ru: ["направление", "направления", "направлений"], uz: "yoʻnalish", en: ["specialty", "specialties"] }), href: "#specialties" } : null,
    services.length ? { icon: "tag", value: services.length, label: countWord(lang, services.length, { ru: ["услуга", "услуги", "услуг"], uz: "xizmat", en: ["service", "services"] }), href: "#services" } : null,
    allDay ? { icon: "clock", value: "24/7", label: t({ ru: "без выходных", uz: "dam olishsiz", en: "every day" }) } : null,
    equipment.length ? { icon: "cpu", value: equipment.length, label: t({ ru: "единиц оборудования", uz: "uskuna", en: "equipment items" }), href: "#equipment" } : null,
  ].filter(Boolean).slice(0, 4) as HeroStat[];

  const meta = [
    { icon: "pin" as IconName, text: address || CITY_LABELS[data.city] || data.city },
    hoursLabel ? { icon: "clock" as IconName, text: hoursLabel } : null,
    hasSchedule && !allDay ? { icon: "info" as IconName, text: openNow ? t(L.openNow) : t(L.closedNow), tone: openNow ? ("open" as const) : ("closed" as const) } : null,
  ].filter(Boolean) as { icon: IconName; text: string; tone?: "open" | "closed" }[];

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
          <Link to="/" hash="catalog" className="cp-crumbs-wide">
            {t(L.catalog)}
          </Link>
          <span aria-hidden="true" className="cp-crumbs-wide">
            <Icon name="chevron" size={14} />
          </span>
          <Link to="/clinics/$slug" params={{ slug }} className="min-w-0 truncate">
            {clinicName}
          </Link>
          <span aria-hidden="true">
            <Icon name="chevron" size={14} />
          </span>
          <span>{name}</span>
        </nav>

        <header className="cp-hero">
          <HeroGallery
            photos={gallery}
            fallback={
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
            }
          />

          <div className="cp-hero-body">
            <div className="cp-id">
              <div className="cp-id-top">
                <ClinicLogo src={data.clinic?.logoUrl} name={clinicName} className="h-16 rounded-[18px] md:h-[76px]" wide />
                <Link to="/clinics/$slug" params={{ slug }} className="cp-badge is-link">
                  <Icon name="building" size={15} />
                  {t(L.branchOf)} · {clinicName}
                </Link>
              </div>

              <h1 className="cp-title">{name}</h1>

              <MetaLine items={meta} />

              {description ? <p className="cp-intro">{description}</p> : null}

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
                {data.whatsapp ? (
                  <a href={socialHref("whatsapp", data.whatsapp)} target="_blank" rel="noreferrer" className="cp-round-btn" aria-label="WhatsApp">
                    <Icon name="chat" size={19} />
                  </a>
                ) : null}
                {data.telegram ? (
                  <a href={socialHref("telegram", data.telegram)} target="_blank" rel="noreferrer" className="cp-round-btn" aria-label="Telegram">
                    <Icon name="send" size={19} />
                  </a>
                ) : null}
              </div>
            </div>

            <HeroStats stats={stats} />
          </div>
        </header>
      </div>

      {sections.length ? <SectionBar sections={sections} cta={t(L.request)} /> : null}

      <div className="wrap cp-body">
        <div className="cp-main">
          {advantages.length || features.length || tourism ? (
            <ProfileSection id="features" icon="shield" kicker={t(L.features)} title={t(L.featuresTitle)}>
              {advantages.length || features.length ? (
                <div className="cp-grid">
                  {advantages.length ? (
                    <InfoCard icon="star" label={t(L.advantages)} wide={!features.length}>
                      <CheckList items={advantages} plain />
                    </InfoCard>
                  ) : null}
                  {features.length ? (
                    <InfoCard icon="building" label={t(L.inside)} wide={!advantages.length}>
                      <CheckList items={features} plain />
                    </InfoCard>
                  ) : null}
                </div>
              ) : null}
              {tourism ? (
                <InfoCard icon="plane" label={t(L.tourism)}>
                  <ReadMore text={tourism} limit={360} />
                </InfoCard>
              ) : null}
            </ProfileSection>
          ) : null}

          {specialties.length ? (
            <ProfileSection id="specialties" icon="grid" kicker={t(L.directions)} title={t(L.directions)} count={specialties.length}>
              <div className="cp-card">
                <ul className="cp-spec-list">
                  {specialties.map((s) => (
                    <li key={s.slug}>
                      <Icon name="check" size={15} />
                      {pickName(lang, s.nameRu, s.nameEn)}
                    </li>
                  ))}
                </ul>
              </div>
            </ProfileSection>
          ) : null}

          {doctors.length ? (
            <ProfileSection id="doctors" icon="stethoscope" kicker={t(L.team)} title={t(L.doctorsTitle)} count={doctors.length}>
              <DoctorList doctors={doctors} />
            </ProfileSection>
          ) : null}

          {services.length ? (
            <ProfileSection id="services" icon="tag" kicker={t(L.prices)} title={t(L.servicesTitle)} count={services.length}>
              <ServicesList services={services} />
            </ProfileSection>
          ) : null}

          {equipment.length ? (
            <ProfileSection id="equipment" icon="cpu" kicker={t(L.equipmentKicker)} title={t(L.equipment)} count={equipment.length}>
              <EquipmentGrid items={equipment} />
            </ProfileSection>
          ) : null}

          {gallery.length > 5 ? <PhotoSection photos={gallery} kicker={t(L.insideKicker)} title={t(L.photos)} /> : null}

          {address || hasCoords ? (
            <ProfileSection id="location" icon="pin" kicker={t(L.howTo)} title={t(L.map)}>
              <LocationBlock
                lat={hasCoords ? lat : null}
                lng={hasCoords ? lng : null}
                address={address || t(L.addressAsk)}
                routeUrl={hasCoords ? yandexRouteUrl(lat, lng) : null}
                mapsUrl={mapsUrl}
                extra={
                  hoursLabel ? (
                    <p className={`cp-address-hours${hasSchedule && !allDay ? (openNow ? " is-open" : " is-closed") : ""}`}>
                      <Icon name="clock" size={16} />
                      {hoursLabel}
                    </p>
                  ) : null
                }
              />
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
