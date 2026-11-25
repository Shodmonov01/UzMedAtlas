import { SITE_NAME, useSeo } from "@/shared/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { fetchClinic } from "@/shared/api/client";
import { cityName } from "@/shared/lib/cities";
import { COMPANY_LANGUAGES_MORE, companyLanguages, isTourismCompany } from "@/shared/lib/tourism";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { FitImage } from "@/shared/ui/FitImage";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { type GalleryPhoto } from "@/shared/ui/PhotoCarousel";
import { yandexPointUrl, yandexRouteUrl } from "@/shared/lib/yandex-maps";
import { clinicName, countWord, localText, plainText, useLang, type Text } from "@/shared/i18n/lang";
import { LeadForm } from "@/widgets/lead-form/LeadForm";
import {
  CertificateList,
  CheckList,
  ContactCard,
  DoctorList,
  EquipmentGrid,
  FeatureGrid,
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
  PersonCard,
  ProfileSection,
  QuickContact,
  ReadMore,
  SectionBar,
  ServicesList,
  Timeline,
  languageName,
  socialHref,
  splitPoints,
  telHref,
  splitPhones,
  type BarSection,
  type Certificate,
  type EquipmentItem,
  type HeroStat,
  type IconName,
} from "@/widgets/clinic-profile/ClinicProfile";

export const Route = createFileRoute("/clinics/$slug/")({
  component: ClinicDetailPage,
});

/** Copy of the page in the three site languages. */
const L = {
  catalog: { ru: "Каталог клиник", uz: "Klinikalar katalogi", en: "Clinic catalog" },
  loadError: { ru: "Не удалось загрузить страницу клиники", uz: "Klinika sahifasini yuklab boʻlmadi", en: "Could not load the clinic page" },
  loadErrorText: { ru: "Проверьте соединение и обновите страницу.", uz: "Internetni tekshirib, sahifani yangilang.", en: "Check your connection and reload the page." },
  notFound: { ru: "Клиника не найдена", uz: "Klinika topilmadi", en: "Clinic not found" },
  notFoundText: { ru: "Возможно, страница переехала или клиника ещё не опубликована.", uz: "Ehtimol, sahifa koʻchgan yoki klinika hali eʼlon qilinmagan.", en: "The page may have moved, or the clinic is not published yet." },
  reply: { ru: "Ответ примерно за {n} ч", uz: "Taxminan {n} soatda javob", en: "Replies in about {n} h" },
  since: { ru: "С {n} года", uz: "{n}-yildan beri", en: "Since {n}" },
  request: { ru: "Оставить заявку", uz: "Ariza qoldirish", en: "Send a request" },
  about: { ru: "О компании", uz: "Kompaniya haqida", en: "About" },
  aboutKicker: { ru: "Знакомство", uz: "Tanishuv", en: "Introduction" },
  history: { ru: "История", uz: "Tarix", en: "History" },
  mission: { ru: "Миссия", uz: "Missiya", en: "Mission" },
  directions: { ru: "Направления", uz: "Yoʻnalishlar", en: "Specialties" },
  languages: { ru: "Языки общения", uz: "Muloqot tillari", en: "Languages spoken" },
  tourism: { ru: "Медтуризм", uz: "Tibbiy turizm", en: "Medical travel" },
  intl: { ru: "Принимает иностранных пациентов", uz: "Xorijlik bemorlarni qabul qiladi", en: "Welcomes international patients" },
  advantages: { ru: "Преимущества", uz: "Afzalliklar", en: "Advantages" },
  advantagesKicker: { ru: "Почему сюда", uz: "Nega aynan shu yerga", en: "Why here" },
  more: { ru: "Подробнее о компании", uz: "Kompaniya haqida batafsil", en: "More about the company" },
  why: { ru: "Почему выбирают", uz: "Nega tanlashadi", en: "Why patients choose it" },
  plans: { ru: "Планы развития", uz: "Rivojlanish rejalari", en: "Development plans" },
  tourismText: { ru: "Медицинский туризм", uz: "Tibbiy turizm", en: "Medical travel" },
  doctors: { ru: "Врачи", uz: "Shifokorlar", en: "Doctors" },
  doctorsTitle: { ru: "Специалисты", uz: "Mutaxassislar", en: "Specialists" },
  team: { ru: "Команда", uz: "Jamoa", en: "Team" },
  leadership: { ru: "Руководство", uz: "Rahbariyat", en: "Leadership" },
  founder: { ru: "Основатель", uz: "Asoschi", en: "Founder" },
  chief: { ru: "Главный врач", uz: "Bosh shifokor", en: "Chief physician" },
  services: { ru: "Услуги", uz: "Xizmatlar", en: "Services" },
  servicesTitle: { ru: "Услуги и цены", uz: "Xizmatlar va narxlar", en: "Services and prices" },
  prices: { ru: "Цены", uz: "Narxlar", en: "Prices" },
  popular: { ru: "Популярные услуги", uz: "Ommabop xizmatlar", en: "Popular services" },
  photos: { ru: "Фотографии", uz: "Rasmlar", en: "Photos" },
  inside: { ru: "Внутри клиники", uz: "Klinika ichida", en: "Inside the clinic" },
  equipment: { ru: "Оборудование", uz: "Uskunalar", en: "Equipment" },
  equipmentKicker: { ru: "Оснащение", uz: "Jihozlar", en: "Facilities" },
  tech: { ru: "Технологии и методики", uz: "Texnologiyalar va usullar", en: "Technologies and methods" },
  certs: { ru: "Сертификаты и лицензии", uz: "Sertifikatlar va litsenziyalar", en: "Certificates and licences" },
  trust: { ru: "Признание", uz: "Eʼtirof", en: "Recognition" },
  achievements: { ru: "Достижения", uz: "Yutuqlar", en: "Achievements" },
  location: { ru: "Как добраться", uz: "Qanday borish mumkin", en: "Getting there" },
  map: { ru: "На карте", uz: "Xaritada", en: "On the map" },
  branches: { ru: "Филиалы", uz: "Filiallar", en: "Branches" },
  branchesKicker: { ru: "Адреса", uz: "Manzillar", en: "Addresses" },
  noBranches: { ru: "Филиалы пока не указаны.", uz: "Filiallar hali koʻrsatilmagan.", en: "No branches listed yet." },
  coordinator: { ru: "Координатор", uz: "Koordinator", en: "Coordinator" },
  open: { ru: "Открыть", uz: "Ochish", en: "Open" },
} satisfies Record<string, Text>;

function text(value?: string | null) {
  const v = value?.trim();
  return v || null;
}

type Branch = {
  id: string;
  slug: string;
  nameRu?: string;
  nameEn: string;
  city: string;
  addressRu?: string;
  addressEn?: string;
  coverUrl?: string | null;
  phone?: string;
  lat?: number | null;
  lng?: number | null;
};

function ClinicDetailPage() {
  const { slug } = Route.useParams();
  const { lang, t } = useLang();
  const root = useRef<HTMLDivElement>(null);
  const symptoms = typeof window !== "undefined" ? sessionStorage.getItem("uma_last_symptoms") || "" : "";

  const clinic = useQuery({
    queryKey: ["clinic", slug],
    queryFn: () => fetchClinic(slug),
  });
  const seoData = clinic.data;
  const seoCity = seoData ? cityName(lang, seoData.city) : "";
  useSeo(
    seoData
      ? {
          title: `${clinicName(seoData, lang)}, ${seoCity} — ${t({ ru: "лечение и медицинский туризм", uz: "davolanish va tibbiy turizm", en: "Treatment & Medical Tourism" })} | ${SITE_NAME}`,
          description: `${clinicName(seoData, lang)}, ${seoCity}: ${localText(lang, seoData, "description")}`,
        }
      : clinic.isError
        ? { title: `${t({ ru: "Клиника не найдена", uz: "Klinika topilmadi", en: "Clinic not found" })} | ${SITE_NAME}`, noindex: true }
        : null,
  );

  const backToCatalog = (
    <Link to="/" hash="catalog" className="pill-btn is-ink">
      {t(L.catalog)}
      <span className="pill-btn-icon">
        <ArrowIcon />
      </span>
    </Link>
  );
  if (clinic.isLoading) return <PageSkeleton />;
  if (clinic.isError) return <PageState title={t(L.loadError)} text={t(L.loadErrorText)} action={backToCatalog} />;
  if (!clinic.data) return <PageState title={t(L.notFound)} text={t(L.notFoundText)} action={backToCatalog} />;

  const data = clinic.data;
  // The clinic's own texts in the site language (Russian from the brief, Uzbek and English from the translations).
  const pick = (item: object | null | undefined, field: string) => text(localText(lang, item, field));
  const pickPoints = (item: object | null | undefined, field: string) => splitPoints(localText(lang, item, field));
  const name: string = clinicName(data, lang);
  const phones = splitPhones(data.phone);
  const shortName = text(data.shortName);
  const description = pick(data, "description");
  const gallery: GalleryPhoto[] = (data.photos || []).map((p: { id: string; url: string; altRu?: string; altEn?: string }) => ({
    id: p.id,
    url: p.url,
    alt: localText(lang, p, "alt"),
  }));
  if (!gallery.length && data.branches?.[0]?.coverUrl) {
    gallery.push({ id: "branch-cover", url: data.branches[0].coverUrl, alt: name });
  }
  const history = pick(data, "history");
  const mission = pick(data, "mission");
  const advantages = pickPoints(data, "advantages");
  const why = pick(data, "whyChoose");
  const plans = pick(data, "developmentPlans");
  const popular = (pick(data, "popularServices") || "")
    .split(/[;,\n]/)
    .map((item) => item.replace(/^[•\-*–]\s*/, "").replace(/\.$/, "").trim())
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));
  const tourism = pick(data, "medicalTourism");
  const cityLabel = cityName(lang, data.city);
  const branches: Branch[] = data.branches || [];
  const mapBranch = branches.find((b) => b.lat != null && b.lng != null && Number.isFinite(b.lat) && Number.isFinite(b.lng)) as (Branch & { lat: number; lng: number }) | undefined;
  const mapLocation = mapBranch
    ? { lat: mapBranch.lat, lng: mapBranch.lng, address: pick(mapBranch, "address") }
    : data.lat != null && data.lng != null && Number.isFinite(data.lat) && Number.isFinite(data.lng)
      ? { lat: data.lat as number, lng: data.lng as number, address: pick(data, "address") }
      : null;
  const address = mapLocation?.address || pick(data, "address");
  const cities: string = data.cities?.length ? data.cities.map((c: string) => cityName(lang, c)).join(", ") : cityLabel;
  const doctors = data.doctors || [];
  const specialties: { slug: string; nameRu?: string; nameEn: string }[] = data.specialties || [];
  // Tourism partners are companies, not clinics: same rule as the catalog's "Tourism partners" block. A company shows
  // no reply time, and its languages end with "and others".
  const isCompany = isTourismCompany(specialties);
  const responseHours = isCompany ? null : data.responseHours;
  const services = data.services || [];
  const briefLanguages: string[] = Array.isArray(data.languages) ? data.languages : [];
  const languages = isCompany ? companyLanguages(briefLanguages) : briefLanguages;
  const moreLanguages = isCompany ? ` ${t(COMPANY_LANGUAGES_MORE)}` : "";
  const leaders: { id?: string; name: string; roleRu?: string; roleEn?: string; bioRu?: string; bioEn?: string; photoUrl?: string | null }[] = Array.isArray(data.leaders) ? data.leaders : [];
  const achievements: { id?: string; titleRu?: string; titleEn?: string; descriptionRu?: string; descriptionEn?: string; year?: number | null }[] = Array.isArray(data.achievements) ? data.achievements : [];
  const technologies: { id?: string; nameRu?: string; nameEn?: string; descriptionRu?: string; descriptionEn?: string }[] = Array.isArray(data.technologies) ? data.technologies : [];
  const equipment: EquipmentItem[] = data.equipment || [];
  const certificates: Certificate[] = data.certificates || [];

  const stats = (
    [
      doctors.length ? { icon: "users", value: doctors.length, label: countWord(lang, doctors.length, { ru: ["специалист", "специалиста", "специалистов"], uz: "mutaxassis", en: ["specialist", "specialists"] }), href: "#doctors" } : null,
      specialties.length ? { icon: "grid", value: specialties.length, label: countWord(lang, specialties.length, { ru: ["направление", "направления", "направлений"], uz: "yoʻnalish", en: ["specialty", "specialties"] }), href: "#about" } : null,
      services.length ? { icon: "tag", value: services.length, label: countWord(lang, services.length, { ru: ["услуга", "услуги", "услуг"], uz: "xizmat", en: ["service", "services"] }), href: "#services" } : null,
      branches.length ? { icon: "building", value: branches.length, label: countWord(lang, branches.length, { ru: ["филиал", "филиала", "филиалов"], uz: "filial", en: ["branch", "branches"] }), href: "#branches" } : null,
      data.foundedYear ? { icon: "calendar", value: data.foundedYear, label: t({ ru: "год основания", uz: "tashkil topgan yil", en: "year founded" }) } : null,
      certificates.length ? { icon: "award", value: certificates.length, label: t({ ru: "сертификатов", uz: "sertifikat", en: "certificates" }), href: "#equipment" } : null,
    ].filter(Boolean) as HeroStat[]
  ).slice(0, 4);

  const meta = [
    { icon: "pin" as IconName, text: cities },
    data.foundedYear ? { icon: "calendar" as IconName, text: t(L.since).replace("{n}", String(data.foundedYear)) } : null,
    languages.length ? { icon: "translate" as IconName, text: languages.slice(0, 4).map((code) => languageName(code, lang)).join(" · ") + (languages.length > 4 ? ` +${languages.length - 4}` : "") + moreLanguages } : null,
    responseHours ? { icon: "clock" as IconName, text: t(L.reply).replace("{n}", String(responseHours)) } : null,
  ].filter(Boolean) as { icon: IconName; text: string }[];

  const moreCards = [
    why ? { icon: "heart" as IconName, label: t(L.why), body: why } : null,
    tourism ? { icon: "plane" as IconName, label: t(L.tourismText), body: tourism } : null,
    plans ? { icon: "trend" as IconName, label: t(L.plans), body: plans } : null,
  ].filter(Boolean) as { icon: IconName; label: string; body: string }[];

  const hasAbout = Boolean(description || history || mission || specialties.length || languages.length);
  const hasLeadership = Boolean(data.founderName || data.chiefDoctorName || leaders.length);
  const sections: BarSection[] = [
    hasAbout ? { id: "about", label: t(L.about) } : null,
    doctors.length ? { id: "doctors", label: t(L.doctors), count: doctors.length } : null,
    services.length || popular.length ? { id: "services", label: t(L.services), count: services.length || undefined } : null,
    equipment.length || technologies.length || certificates.length || achievements.length ? { id: "equipment", label: t(L.equipmentKicker) } : null,
    mapLocation || address ? { id: "location", label: t(L.map) } : null,
    { id: "branches", label: t(L.branches), count: branches.length || undefined },
  ].filter(Boolean) as BarSection[];

  return (
    <div ref={root} className="cp">
      <div className="wrap">
        <nav className="cp-crumbs" aria-label="Breadcrumbs">
          <Link to="/" hash="catalog">
            {t(L.catalog)}
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
              <div className="cp-gallery-fallback" aria-hidden="true">
                <img src="/brand/logo.svg?v=2" alt="" width={88} height={88} />
              </div>
            }
          />

          <div className="cp-hero-body">
            <div className="cp-id">
              <div className="cp-id-top">
                <ClinicLogo src={data.logoUrl} name={name} className="h-16 rounded-[18px] md:h-[76px]" wide />
                {data.medicalTourism ? (
                  <span className="cp-badge">
                    <Icon name="plane" size={15} />
                    {t(L.intl)}
                  </span>
                ) : null}
              </div>

              <div>
                <h1 className="cp-title">{name}</h1>
                {shortName && shortName !== name ? <p className="cp-subtitle">{shortName}</p> : null}
              </div>

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

      <SectionBar sections={sections} cta={t(L.request)} />

      <div className="wrap cp-body">
        <div className="cp-main">
          {hasAbout ? (
            <ProfileSection id="about" icon="info" kicker={t(L.aboutKicker)} title={t(L.about)}>
              {description ? <ReadMore text={description} className="cp-text is-lead" /> : null}
              {history || mission ? (
                <div className="cp-grid">
                  {history ? (
                    <InfoCard icon="book" label={t(L.history)} wide={!mission}>
                      <ReadMore text={history} limit={320} />
                    </InfoCard>
                  ) : null}
                  {mission ? (
                    <InfoCard icon="target" label={t(L.mission)} wide={!history}>
                      <ReadMore text={mission} limit={320} />
                    </InfoCard>
                  ) : null}
                </div>
              ) : null}
              {specialties.length ? (
                <InfoCard icon="grid" label={`${t(L.directions)} · ${specialties.length}`}>
                  <ul className="cp-spec-list">
                    {specialties.map((s) => (
                      <li key={s.slug}>
                        <Icon name="check" size={15} />
                        {localText(lang, s, "name")}
                      </li>
                    ))}
                  </ul>
                </InfoCard>
              ) : null}
              {languages.length ? (
                <InfoCard icon="translate" label={t(L.languages)}>
                  <div className="cp-pills">
                    {languages.map((code) => (
                      <span key={code}>
                        <b>{code.toUpperCase()}</b>
                        {languageName(code, lang)}
                      </span>
                    ))}
                    {isCompany ? <span className="cp-pill-more">{t(COMPANY_LANGUAGES_MORE)}</span> : null}
                  </div>
                </InfoCard>
              ) : null}
            </ProfileSection>
          ) : null}

          {advantages.length ? (
            <ProfileSection icon="shield" kicker={t(L.advantagesKicker)} title={t(L.advantages)} count={advantages.length > 3 ? advantages.length : undefined}>
              <CheckList items={advantages} />
            </ProfileSection>
          ) : null}

          {moreCards.length ? (
            <ProfileSection icon="star" kicker={t(L.advantagesKicker)} title={t(L.more)}>
              <div className="cp-grid">
                {moreCards.map((item, i) => (
                  <InfoCard key={item.label} icon={item.icon} label={item.label} wide={moreCards.length % 2 === 1 && i === 0}>
                    <ReadMore text={item.body} limit={320} />
                  </InfoCard>
                ))}
              </div>
            </ProfileSection>
          ) : null}

          {doctors.length ? (
            <ProfileSection id="doctors" icon="stethoscope" kicker={t(L.team)} title={t(L.doctorsTitle)} count={doctors.length}>
              <DoctorList doctors={doctors} />
            </ProfileSection>
          ) : null}

          {hasLeadership ? (
            <ProfileSection icon="users" kicker={t(L.team)} title={t(L.leadership)}>
              <ul className="cp-people">
                {data.founderName ? (
                  <PersonCard
                    wide
                    name={plainText(lang, data, "founderName")}
                    role={pick(data, "founderRole") || t(L.founder)}
                    bio={pick(data, "founderBio")}
                    photoUrl={data.founderPhotoUrl}
                  />
                ) : null}
                {data.chiefDoctorName ? (
                  <PersonCard
                    wide={!data.founderName}
                    name={plainText(lang, data, "chiefDoctorName")}
                    role={pick(data, "chiefDoctorRole") || t(L.chief)}
                    bio={pick(data, "chiefDoctorBio")}
                    photoUrl={data.chiefDoctorPhotoUrl}
                  />
                ) : null}
                {leaders.map((l) => (
                  <PersonCard key={l.id || l.name} name={plainText(lang, l, "name")} role={pick(l, "role")} bio={pick(l, "bio")} photoUrl={l.photoUrl} />
                ))}
              </ul>
            </ProfileSection>
          ) : null}

          {services.length || popular.length ? (
            <ProfileSection
              id="services"
              icon="tag"
              kicker={t(L.prices)}
              title={services.length ? t(L.servicesTitle) : t(L.popular)}
              count={services.length || undefined}
            >
              {popular.length ? (
                <div className="cp-popular">
                  {services.length ? (
                    <p className="cp-label">
                      <Icon name="star" size={14} />
                      {t(L.popular)}
                    </p>
                  ) : null}
                  <ul>
                    {popular.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {services.length ? <ServicesList services={services} /> : null}
            </ProfileSection>
          ) : null}

          {gallery.length > 5 ? <PhotoSection photos={gallery} kicker={t(L.inside)} title={t(L.photos)} /> : null}

          {equipment.length || technologies.length ? (
            <ProfileSection id="equipment" icon="cpu" kicker={t(L.equipmentKicker)} title={equipment.length ? t(L.equipment) : t(L.tech)} count={equipment.length || undefined}>
              {equipment.length ? <EquipmentGrid items={equipment} /> : null}
              {technologies.length ? (
                <>
                  {equipment.length ? <h3 className="cp-subhead">{t(L.tech)}</h3> : null}
                  <FeatureGrid
                    items={technologies.map((item, i) => ({
                      key: item.id || item.nameRu || String(i),
                      title: localText(lang, item, "name"),
                      text: pick(item, "description"),
                    }))}
                  />
                </>
              ) : null}
            </ProfileSection>
          ) : null}

          {certificates.length || achievements.length ? (
            <ProfileSection
              id={equipment.length || technologies.length ? undefined : "equipment"}
              icon="award"
              kicker={t(L.trust)}
              title={certificates.length ? t(L.certs) : t(L.achievements)}
            >
              {certificates.length ? <CertificateList items={certificates} /> : null}
              {achievements.length ? (
                <>
                  {certificates.length ? <h3 className="cp-subhead">{t(L.achievements)}</h3> : null}
                  <Timeline
                    items={[...achievements]
                      .sort((a, b) => (b.year || 0) - (a.year || 0))
                      .map((a, i) => ({
                        key: a.id || a.titleRu || String(i),
                        year: a.year,
                        title: localText(lang, a, "title"),
                        text: pick(a, "description"),
                      }))}
                  />
                </>
              ) : null}
            </ProfileSection>
          ) : null}

          {mapLocation || address ? (
            <ProfileSection id="location" icon="pin" kicker={t(L.location)} title={t(L.map)}>
              <LocationBlock
                lat={mapLocation?.lat}
                lng={mapLocation?.lng}
                address={address || cities}
                routeUrl={mapLocation ? yandexRouteUrl(mapLocation.lat, mapLocation.lng) : null}
                mapsUrl={mapLocation ? yandexPointUrl(mapLocation.lat, mapLocation.lng) : address ? `https://yandex.uz/maps/?text=${encodeURIComponent(address)}` : null}
              />
            </ProfileSection>
          ) : null}

          <ProfileSection id="branches" icon="building" kicker={t(L.branchesKicker)} title={t(L.branches)} count={branches.length || undefined}>
            {branches.length === 0 ? (
              <p className="cp-empty">
                <Icon name="building" size={18} />
                {t(L.noBranches)}
              </p>
            ) : (
              <div className="clinic-tiles cp-branches">
                {branches.map((b) => {
                  const branchAddress = pick(b, "address");
                  return (
                    <Link key={b.id} to="/clinics/$slug/branches/$branchSlug" params={{ slug, branchSlug: b.slug }} className="clinic-tile">
                      <div className="clinic-tile-cover">
                        {b.coverUrl ? (
                          <FitImage src={b.coverUrl} className="clinic-tile-photo" />
                        ) : (
                          <div className="clinic-tile-placeholder">
                            <img src="/brand/logo.svg?v=2" alt="" width={64} height={64} />
                          </div>
                        )}
                      </div>
                      <div className="clinic-tile-body">
                        <h3>{clinicName(b)}</h3>
                        <p className="clinic-tile-meta">
                          <span className="clinic-tile-city">
                            <Icon name="pin" size={14} />
                            {cityName(lang, b.city)}
                          </span>
                        </p>
                        {branchAddress ? <p className="clinic-tile-text">{branchAddress}</p> : null}
                      </div>
                      <p className="clinic-tile-foot">
                        {b.phone ? (
                          <span className="clinic-tile-reply">
                            <Icon name="phone" size={14} />
                            {b.phone}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="clinic-tile-arrow" aria-label={t(L.open)}>
                          <ArrowIcon size={15} />
                        </span>
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </ProfileSection>
        </div>

        <aside className="cp-aside">
          <LeadForm clinicSlug={data.slug} clinicName={name} defaultSymptoms={symptoms} responseHours={responseHours} />
          <ContactCard
            logoUrl={data.logoUrl}
            name={name}
            phones={phones}
            email={data.email}
            website={data.website}
            whatsapp={data.whatsapp}
            telegram={data.telegram}
            instagram={data.instagram}
            youtube={data.youtube}
            socials={data.socials}
            responseHours={responseHours}
          >
            {data.coordinatorName ? (
              <div className="cp-contact-extra">
                <small>{t(L.coordinator)}</small>
                <p className="cp-contact-person">
                  <i>
                    <Icon name="user" size={22} weight="duotone" />
                  </i>
                  <span>
                    <b>{plainText(lang, data, "coordinatorName")}</b>
                    {pick(data, "coordinatorRole") ? <span>{pick(data, "coordinatorRole")}</span> : null}
                  </span>
                </p>
              </div>
            ) : null}
          </ContactCard>
          <QuickContact name={name} phone={phones[0]} whatsapp={data.whatsapp} telegram={data.telegram} responseHours={responseHours} cta={t(L.request)} />
        </aside>
      </div>

      <MobileDock cta={t(L.request)} phone={phones[0]} />
    </div>
  );
}
