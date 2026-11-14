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
import { pickName } from "@/shared/i18n/lang";
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

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const L = {
  catalog: "Clinic catalog",
  clinic: "Clinic",
  loadError: "Could not load the branch page",
  loadErrorText: "Check your connection and reload the page.",
  notFound: "Branch not found",
  notFoundText: "The address may have changed. Open the clinic's page to see all its branches.",
  toClinic: "To the clinic",
  branchOf: "Clinic branch",
  openNow: "Open now",
  closedNow: "Closed now",
  allDay: "Open 24/7",
  today: "Today",
  request: "Send a request",
  howTo: "Getting there",
  address: "Address",
  hours: "Opening hours",
  phone: "Phone",
  route: "Get directions",
  openMap: "Open in maps",
  yandex: "Yandex Maps",
  addressAsk: "Ask the coordinator for the address",
  features: "Features",
  featuresTitle: "About this branch",
  advantages: "Advantages",
  inside: "What's on site",
  tourism: "Medical travel and international cooperation",
  directions: "Specialties",
  doctors: "Doctors",
  doctorsTitle: "Specialists",
  team: "Team",
  services: "Services",
  servicesTitle: "Services and prices",
  prices: "Prices",
  equipment: "Equipment",
  equipmentKicker: "Facilities",
  photos: "Photos",
  insideKicker: "Inside",
  map: "On the map",
  hoursTab: "Hours",
  contactsLabel: "Branch contacts",
  dayOff: "closed",
  roundClock: "24 hours",
  specialists: ["specialist", "specialists"],
} as const;

function todayKey() {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tashkent", weekday: "short" }).format(new Date());
  return weekday.slice(0, 3).toLowerCase();
}

/** One day's hours. */
function dayHours(day: DayHours | null) {
  if (!day) return L.dayOff;
  if (day.roundTheClock) return L.roundClock;
  if (day.breakStart && day.breakEnd) return `${day.open}–${day.breakStart} / ${day.breakEnd}–${day.close}`;
  return `${day.open} – ${day.close}`;
}

function BranchDetailPage() {
  const { slug, branchSlug } = Route.useParams();
  const root = useRef<HTMLDivElement>(null);
  const symptoms = typeof window !== "undefined" ? sessionStorage.getItem("uma_last_symptoms") || "" : "";

  const branch = useQuery({
    queryKey: ["branch", slug, branchSlug],
    queryFn: () => fetchClinicBranch(slug, branchSlug),
  });
  useHeroIntro(root, Boolean(branch.data));

  const toClinic = (
    <Link to="/clinics/$slug" params={{ slug }} className="pill-btn is-ink">
      {L.toClinic}
      <span className="pill-btn-icon">
        <ArrowIcon />
      </span>
    </Link>
  );
  if (branch.isLoading) return <PageSkeleton />;
  if (branch.isError) return <PageState title={L.loadError} text={L.loadErrorText} action={toClinic} />;
  if (!branch.data) return <PageState title={L.notFound} text={L.notFoundText} action={toClinic} />;

  const data = branch.data;
  const pick = (ru?: string | null, en?: string | null) => pickName(ru, en).trim() || null;
  const name: string = pickName(data.nameRu, data.nameEn);
  const clinicName: string = pickName(data.clinic?.nameRu, data.clinic?.nameEn) || L.clinic;
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
    alt: pickName(p.altRu, p.altEn),
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
  const hoursLabel = allDay ? L.allDay : hasSchedule ? `${L.today}: ${dayHours(schedule[today] ?? null)}` : null;
  const stats = [
    doctors.length ? { icon: "users", value: doctors.length, label: (doctors.length === 1 ? L.specialists[0] : L.specialists[1]), href: "#doctors" } : null,
    specialties.length ? { icon: "grid", value: specialties.length, label: (specialties.length === 1 ? "specialty" : "specialties"), href: "#specialties" } : null,
    services.length ? { icon: "tag", value: services.length, label: (services.length === 1 ? "service" : "services"), href: "#services" } : null,
    allDay ? { icon: "clock", value: "24/7", label: "every day" } : null,
    equipment.length ? { icon: "cpu", value: equipment.length, label: "equipment items", href: "#equipment" } : null,
  ].filter(Boolean).slice(0, 4) as HeroStat[];

  const meta = [
    { icon: "pin" as IconName, text: address || CITY_LABELS[data.city] || data.city },
    hoursLabel ? { icon: "clock" as IconName, text: hoursLabel } : null,
    hasSchedule && !allDay ? { icon: "info" as IconName, text: openNow ? L.openNow : L.closedNow, tone: openNow ? ("open" as const) : ("closed" as const) } : null,
  ].filter(Boolean) as { icon: IconName; text: string; tone?: "open" | "closed" }[];

  const sections: BarSection[] = [
    advantages.length || features.length || tourism ? { id: "features", label: L.features } : null,
    specialties.length ? { id: "specialties", label: L.directions, count: specialties.length } : null,
    doctors.length ? { id: "doctors", label: L.doctors, count: doctors.length } : null,
    services.length ? { id: "services", label: L.services, count: services.length } : null,
    equipment.length ? { id: "equipment", label: L.equipment } : null,
    address || hasCoords ? { id: "location", label: L.map } : null,
  ].filter(Boolean) as BarSection[];

  return (
    <div ref={root} className="cp">
      <div className="wrap">
        <nav className="cp-crumbs" aria-label="Breadcrumbs">
          <Link to="/" hash="catalog" className="cp-crumbs-wide">
            {L.catalog}
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
                <p>{L.howTo}</p>
                {address ? (
                  <div className="cp-hero-fact">
                    <Icon name="pin" />
                    <div>
                      <small>{L.address}</small>
                      {address}
                    </div>
                  </div>
                ) : null}
                {hoursLabel ? (
                  <div className="cp-hero-fact">
                    <Icon name="clock" />
                    <div>
                      <small>{L.hours}</small>
                      {hoursLabel}
                    </div>
                  </div>
                ) : null}
                {phones.length ? (
                  <div className="cp-hero-fact">
                    <Icon name="phone" />
                    <div>
                      <small>{L.phone}</small>
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
                    {hasCoords ? L.route : L.openMap}
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
                  {L.branchOf} · {clinicName}
                </Link>
              </div>

              <h1 className="cp-title">{name}</h1>

              <MetaLine items={meta} />

              {description ? <p className="cp-intro">{description}</p> : null}

              <div className="cp-hero-actions">
                <a href="#lead" className="pill-btn is-ink">
                  {L.request}
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

      {sections.length ? <SectionBar sections={sections} cta={L.request} /> : null}

      <div className="wrap cp-body">
        <div className="cp-main">
          {advantages.length || features.length || tourism ? (
            <ProfileSection id="features" icon="shield" kicker={L.features} title={L.featuresTitle}>
              {advantages.length || features.length ? (
                <div className="cp-grid">
                  {advantages.length ? (
                    <InfoCard icon="star" label={L.advantages} wide={!features.length}>
                      <CheckList items={advantages} plain />
                    </InfoCard>
                  ) : null}
                  {features.length ? (
                    <InfoCard icon="building" label={L.inside} wide={!advantages.length}>
                      <CheckList items={features} plain />
                    </InfoCard>
                  ) : null}
                </div>
              ) : null}
              {tourism ? (
                <InfoCard icon="plane" label={L.tourism}>
                  <ReadMore text={tourism} limit={360} />
                </InfoCard>
              ) : null}
            </ProfileSection>
          ) : null}

          {specialties.length ? (
            <ProfileSection id="specialties" icon="grid" kicker={L.directions} title={L.directions} count={specialties.length}>
              <div className="cp-card">
                <ul className="cp-spec-list">
                  {specialties.map((s) => (
                    <li key={s.slug}>
                      <Icon name="check" size={15} />
                      {pickName(s.nameRu, s.nameEn)}
                    </li>
                  ))}
                </ul>
              </div>
            </ProfileSection>
          ) : null}

          {doctors.length ? (
            <ProfileSection id="doctors" icon="stethoscope" kicker={L.team} title={L.doctorsTitle} count={doctors.length}>
              <DoctorList doctors={doctors} />
            </ProfileSection>
          ) : null}

          {services.length ? (
            <ProfileSection id="services" icon="tag" kicker={L.prices} title={L.servicesTitle} count={services.length}>
              <ServicesList services={services} />
            </ProfileSection>
          ) : null}

          {equipment.length ? (
            <ProfileSection id="equipment" icon="cpu" kicker={L.equipmentKicker} title={L.equipment} count={equipment.length}>
              <EquipmentGrid items={equipment} />
            </ProfileSection>
          ) : null}

          {gallery.length > 5 ? <PhotoSection photos={gallery} kicker={L.insideKicker} title={L.photos} /> : null}

          {address || hasCoords ? (
            <ProfileSection id="location" icon="pin" kicker={L.howTo} title={L.map}>
              <LocationBlock
                lat={hasCoords ? lat : null}
                lng={hasCoords ? lng : null}
                address={address || L.addressAsk}
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
            label={L.contactsLabel}
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
                <small>{L.hours}</small>
                {allDay ? (
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                    <span className="text-accent">
                      <Icon name="clock" size={16} />
                    </span>
                    {L.allDay}
                  </p>
                ) : (
                  <ul className="cp-hours">
                    {DAYS.map(({ key, label }) => (
                      <li key={key} className={key === today ? "is-today" : undefined}>
                        <span>{label}</span>
                        <span>{dayHours(schedule[key] ?? null)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </ContactCard>
          <QuickContact name={name} phone={phones[0]} whatsapp={data.whatsapp} telegram={data.telegram} cta={L.request} />
        </aside>
      </div>

      <MobileDock cta={L.request} phone={phones[0]} />
    </div>
  );
}
