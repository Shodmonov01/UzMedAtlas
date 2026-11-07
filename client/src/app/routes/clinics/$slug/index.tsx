import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { CITY_LABELS, fetchClinic } from "@/shared/api/client";
import { BranchMap } from "@/shared/ui/BranchMap";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { FitImage } from "@/shared/ui/FitImage";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { PhotoCarousel, type GalleryPhoto } from "@/shared/ui/PhotoCarousel";
import { yandexRouteUrl } from "@/shared/lib/yandex-maps";
import { countWord, pickName, useLang, type Text } from "@/shared/i18n/lang";
import { LeadForm } from "@/widgets/lead-form/LeadForm";
import {
  ContactCard,
  DoctorList,
  Icon,
  MobileDock,
  PageSkeleton,
  PageState,
  PersonCard,
  PhotoMosaic,
  ProfileSection,
  QuickContact,
  SectionBar,
  ServicesList,
  telHref,
  useHeroIntro,
  type BarSection,
} from "@/widgets/clinic-profile/ClinicProfile";

export const Route = createFileRoute("/clinics/$slug/")({
  component: ClinicDetailPage,
});

/** Copy of the page in the three site languages. */
const L = {
  catalog: { ru: "Каталог клиник", uz: "Klinikalar katalogi", en: "Clinic catalog" },
  back: { ru: "Назад в каталог", uz: "Katalogga qaytish", en: "Back to the catalog" },
  loadError: { ru: "Не удалось загрузить страницу клиники", uz: "Klinika sahifasini yuklab boʻlmadi", en: "Could not load the clinic page" },
  loadErrorText: { ru: "Проверьте соединение и обновите страницу.", uz: "Internetni tekshirib, sahifani yangilang.", en: "Check your connection and reload the page." },
  notFound: { ru: "Клиника не найдена", uz: "Klinika topilmadi", en: "Clinic not found" },
  notFoundText: { ru: "Возможно, страница переехала или клиника ещё не опубликована.", uz: "Ehtimol, sahifa koʻchgan yoki klinika hali eʼlon qilinmagan.", en: "The page may have moved, or the clinic is not published yet." },
  reply: { ru: "ответ ~{n} ч", uz: "javob ~{n} soat", en: "reply ~{n} h" },
  request: { ru: "Оставить заявку", uz: "Ariza qoldirish", en: "Send a request" },
  about: { ru: "О клинике", uz: "Klinika haqida", en: "About" },
  aboutKicker: { ru: "Знакомство", uz: "Tanishuv", en: "Introduction" },
  history: { ru: "История", uz: "Tarix", en: "History" },
  mission: { ru: "Миссия", uz: "Missiya", en: "Mission" },
  directions: { ru: "Направления", uz: "Yoʻnalishlar", en: "Specialties" },
  languages: { ru: "Языки общения", uz: "Muloqot tillari", en: "Languages" },
  tourism: { ru: "Медтуризм", uz: "Tibbiy turizm", en: "Medical travel" },
  advantages: { ru: "Преимущества", uz: "Afzalliklar", en: "Advantages" },
  advantagesKicker: { ru: "Почему сюда", uz: "Nega aynan shu yerga", en: "Why here" },
  more: { ru: "Подробнее о клинике", uz: "Klinika haqida batafsil", en: "More about the clinic" },
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
  openFile: { ru: "Открыть документ", uz: "Hujjatni ochish", en: "Open document" },
  received: { ru: "получен", uz: "olingan", en: "issued" },
  validUntil: { ru: "до", uz: "gacha", en: "valid until" },
  location: { ru: "Как добраться", uz: "Qanday borish mumkin", en: "Getting there" },
  map: { ru: "На карте", uz: "Xaritada", en: "On the map" },
  route: { ru: "Построить маршрут", uz: "Yoʻnalish qurish", en: "Get directions" },
  branches: { ru: "Филиалы", uz: "Filiallar", en: "Branches" },
  branchesKicker: { ru: "Адреса", uz: "Manzillar", en: "Addresses" },
  noBranches: { ru: "Филиалы пока не указаны.", uz: "Filiallar hali koʻrsatilmagan.", en: "No branches listed yet." },
  coordinator: { ru: "Координатор", uz: "Koordinator", en: "Coordinator" },
  call: { ru: "Позвонить", uz: "Qoʻngʻiroq", en: "Call" },
} satisfies Record<string, Text>;

function text(value?: string | null) {
  const v = value?.trim();
  return v || null;
}

function lines(value?: string | null) {
  const raw = text(value);
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.replace(/^[•\-*]\s*/, "").trim())
    .filter(Boolean);
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
  useHeroIntro(root, Boolean(clinic.data));

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
  const pick = (ru?: string | null, en?: string | null) => text(pickName(lang, ru, en));
  const pickLines = (ru?: string | null, en?: string | null) => {
    const first = lines(lang === "en" ? en : ru);
    return first.length ? first : lines(lang === "en" ? ru : en);
  };
  const name: string = pickName(lang, data.nameRu, data.nameEn);
  const description = pick(data.descriptionRu, data.descriptionEn);
  const gallery: GalleryPhoto[] = (data.photos || []).map((p: { id: string; url: string; altRu?: string; altEn?: string }) => ({
    id: p.id,
    url: p.url,
    alt: pickName(lang, p.altRu, p.altEn),
  }));
  if (!gallery.length && data.branches?.[0]?.coverUrl) {
    gallery.push({ id: "branch-cover", url: data.branches[0].coverUrl, alt: name });
  }
  const history = pick(data.historyRu, data.historyEn);
  const mission = pick(data.missionRu, data.missionEn);
  const advantages = pickLines(data.advantagesRu, data.advantagesEn);
  const why = pick(data.whyChooseRu, data.whyChooseEn);
  const plans = pick(data.developmentPlansRu, data.developmentPlansEn);
  const popular = pickLines(data.popularServicesRu, data.popularServicesEn);
  const tourism = pick(data.medicalTourismRu, data.medicalTourismEn);
  const cityLabel = CITY_LABELS[data.city] || data.city;
  const branches: Branch[] = data.branches || [];
  const mapBranch = branches.find((b) => b.lat != null && b.lng != null && Number.isFinite(b.lat) && Number.isFinite(b.lng)) as (Branch & { lat: number; lng: number }) | undefined;
  const mapLocation = mapBranch
    ? { lat: mapBranch.lat, lng: mapBranch.lng, address: pick(mapBranch.addressRu, mapBranch.addressEn) }
    : data.lat != null && data.lng != null && Number.isFinite(data.lat) && Number.isFinite(data.lng)
      ? { lat: data.lat as number, lng: data.lng as number, address: pick(data.addressRu, data.addressEn) }
      : null;
  const cities: string = data.cities?.length ? data.cities.map((c: string) => CITY_LABELS[c] || c).join(", ") : cityLabel;
  const doctors = data.doctors || [];
  const specialties: { slug: string; nameRu?: string; nameEn: string }[] = data.specialties || [];
  const services = data.services || [];
  const leaders: { id?: string; name: string; roleRu?: string; roleEn?: string; bioRu?: string; bioEn?: string; photoUrl?: string | null }[] = Array.isArray(data.leaders) ? data.leaders : [];
  const achievements: { id?: string; titleRu?: string; titleEn?: string; descriptionRu?: string; descriptionEn?: string; year?: number | null }[] = Array.isArray(data.achievements) ? data.achievements : [];
  const technologies: { id?: string; nameRu?: string; nameEn?: string; descriptionRu?: string; descriptionEn?: string }[] = Array.isArray(data.technologies) ? data.technologies : [];
  const equipment: { id: string; nameRu?: string; nameEn: string; manufacturer?: string; descriptionRu?: string; descriptionEn?: string; photoUrl?: string | null }[] = data.equipment || [];
  const certificates: { id: string; nameRu?: string; nameEn: string; issuerRu?: string; issuerEn?: string; year?: number | null; receivedAt?: string | null; validUntil?: string | null; fileUrl?: string | null; imageUrl?: string | null }[] = data.certificates || [];

  const facts = [
    doctors.length ? { value: doctors.length, label: countWord(lang, doctors.length, { ru: ["специалист", "специалиста", "специалистов"], uz: "mutaxassis", en: ["specialist", "specialists"] }) } : null,
    branches.length ? { value: branches.length, label: countWord(lang, branches.length, { ru: ["филиал", "филиала", "филиалов"], uz: "filial", en: ["branch", "branches"] }) } : null,
    specialties.length ? { value: specialties.length, label: countWord(lang, specialties.length, { ru: ["направление", "направления", "направлений"], uz: "yoʻnalish", en: ["specialty", "specialties"] }) } : null,
    data.foundedYear ? { value: data.foundedYear, label: t({ ru: "год основания", uz: "tashkil topgan yil", en: "founded" }) } : null,
  ].filter(Boolean) as { value: number; label: string }[];

  const hasAbout = Boolean(description || history || mission || specialties.length);
  const hasLeadership = Boolean(data.founderName || data.chiefDoctorName || leaders.length);
  const sections: BarSection[] = [
    hasAbout ? { id: "about", label: t(L.about) } : null,
    doctors.length ? { id: "doctors", label: t(L.doctors), count: doctors.length } : null,
    services.length ? { id: "services", label: t(L.services), count: services.length } : null,
    equipment.length || technologies.length || certificates.length ? { id: "equipment", label: t(L.equipmentKicker) } : null,
    mapLocation ? { id: "location", label: t(L.map) } : null,
    { id: "branches", label: t(L.branches), count: branches.length || undefined },
  ].filter(Boolean) as BarSection[];

  return (
    <div ref={root} className="cp">
      <div className="wrap">
        <nav className="cp-crumbs" aria-label="Breadcrumbs">
          <Link to="/" hash="catalog" className="cp-back" aria-label={t(L.back)}>
            <ArrowIcon size={15} />
          </Link>
          <Link to="/" hash="catalog">
            {t(L.catalog)}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{name}</span>
        </nav>

        <header className="cp-hero">
          <div className="cp-hero-copy">
            <div className="cp-hero-top">
              <ClinicLogo src={data.logoUrl} name={name} className="h-16 rounded-[18px] md:h-[72px]" wide />
              <div className="cp-chips">
                <span className="cp-chip">
                  <Icon name="pin" size={14} />
                  {cities}
                </span>
                {data.responseHours ? (
                  <span className="cp-chip">
                    <Icon name="clock" size={14} />
                    {t(L.reply).replace("{n}", String(data.responseHours))}
                  </span>
                ) : null}
                {data.medicalTourism ? <span className="cp-chip is-open">{t(L.tourism)}</span> : null}
              </div>
            </div>

            <h1 className="cp-title">{name}</h1>
            {description ? <p className="cp-intro">{description}</p> : null}

            {specialties.length ? (
              <div className="cp-tags">
                {specialties.slice(0, 4).map((s) => (
                  <span key={s.slug}>{pickName(lang, s.nameRu, s.nameEn)}</span>
                ))}
                {specialties.length > 4 ? <a href="#about">+{specialties.length - 4}</a> : null}
              </div>
            ) : null}

            <div className="cp-hero-actions">
              <a href="#lead" className="pill-btn is-ink">
                {t(L.request)}
                <span className="pill-btn-icon">
                  <ArrowIcon />
                </span>
              </a>
              {data.phone ? (
                <a href={telHref(String(data.phone))} className="pill-btn is-outline">
                  <Icon name="phone" size={17} />
                  {data.phone}
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
              <div className="cp-hero-empty" aria-hidden="true">
                <img src="/brand/logo.svg" alt="" width={88} height={88} />
              </div>
            )}
          </div>
        </header>
      </div>

      <SectionBar sections={sections} cta={t(L.request)} />

      <div className="wrap cp-body">
        <div className="cp-main">
          {hasAbout ? (
            <ProfileSection id="about" kicker={t(L.aboutKicker)} title={t(L.about)}>
              {description ? <p className="cp-text is-lead">{description}</p> : null}
              {history || mission ? (
                <div className="cp-grid">
                  {history ? (
                    <div className={`cp-card${mission ? "" : " is-wide"}`}>
                      <p className="cp-label">{t(L.history)}</p>
                      <p>{history}</p>
                    </div>
                  ) : null}
                  {mission ? (
                    <div className={`cp-card${history ? "" : " is-wide"}`}>
                      <p className="cp-label">{t(L.mission)}</p>
                      <p>{mission}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {specialties.length ? (
                <div className="cp-card">
                  <p className="cp-label">{t(L.directions)}</p>
                  <div className="cp-pills mt-4">
                    {specialties.map((s) => (
                      <span key={s.slug}>
                        <i aria-hidden="true" />
                        {pickName(lang, s.nameRu, s.nameEn)}
                      </span>
                    ))}
                  </div>
                  {data.languages?.length ? (
                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
                      <span className="cp-label">{t(L.languages)}</span>
                      <div className="cp-pills">
                        {data.languages.map((code: string) => (
                          <span key={code} className="is-accent uppercase">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </ProfileSection>
          ) : null}

          {advantages.length ? (
            <ProfileSection kicker={t(L.advantagesKicker)} title={t(L.advantages)}>
              <ul className="cp-checks">
                {advantages.map((item) => (
                  <li key={item}>
                    <span>
                      <Icon name="check" size={15} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </ProfileSection>
          ) : null}

          {why || tourism || plans ? (
            <ProfileSection kicker={t(L.advantagesKicker)} title={t(L.more)}>
              <div className="cp-grid">
                {[
                  why ? { label: t(L.why), body: why } : null,
                  tourism ? { label: t(L.tourismText), body: tourism } : null,
                  plans ? { label: t(L.plans), body: plans } : null,
                ]
                  .filter(Boolean)
                  .map((item, i, list) => (
                    <div key={item!.label} className={`cp-card${list.length % 2 === 1 && i === 0 ? " is-wide" : ""}`}>
                      <p className="cp-label">{item!.label}</p>
                      <p className="whitespace-pre-line">{item!.body}</p>
                    </div>
                  ))}
              </div>
            </ProfileSection>
          ) : null}

          {doctors.length ? (
            <ProfileSection id="doctors" kicker={t(L.team)} title={t(L.doctorsTitle)} count={doctors.length}>
              <DoctorList doctors={doctors} />
            </ProfileSection>
          ) : null}

          {hasLeadership ? (
            <ProfileSection kicker={t(L.team)} title={t(L.leadership)}>
              <ul className="cp-people">
                {data.founderName ? (
                  <PersonCard
                    wide
                    name={data.founderName}
                    role={pick(data.founderRoleRu, data.founderRoleEn) || t(L.founder)}
                    bio={pick(data.founderBioRu, data.founderBioEn)}
                    photoUrl={data.founderPhotoUrl}
                  />
                ) : null}
                {data.chiefDoctorName ? (
                  <PersonCard
                    wide={!data.founderName}
                    name={data.chiefDoctorName}
                    role={pick(data.chiefDoctorRoleRu, data.chiefDoctorRoleEn) || t(L.chief)}
                    bio={pick(data.chiefDoctorBioRu, data.chiefDoctorBioEn)}
                    photoUrl={data.chiefDoctorPhotoUrl}
                  />
                ) : null}
                {leaders.map((l) => (
                  <PersonCard key={l.id || l.name} name={l.name} role={pick(l.roleRu, l.roleEn)} bio={pick(l.bioRu, l.bioEn)} photoUrl={l.photoUrl} />
                ))}
              </ul>
            </ProfileSection>
          ) : null}

          {services.length ? (
            <ProfileSection id="services" kicker={t(L.prices)} title={t(L.servicesTitle)} count={services.length}>
              <ServicesList services={services} />
              {popular.length ? (
                <div className="cp-popular">
                  <p className="cp-label">{t(L.popular)}</p>
                  <ul>
                    {popular.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </ProfileSection>
          ) : popular.length ? (
            <ProfileSection kicker={t(L.prices)} title={t(L.popular)}>
              <div className="cp-popular">
                <ul className="!mt-0">
                  {popular.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </ProfileSection>
          ) : null}

          {gallery.length > 3 ? (
            <ProfileSection kicker={t(L.inside)} title={t(L.photos)} count={gallery.length}>
              <PhotoCarousel photos={gallery} />
            </ProfileSection>
          ) : null}

          {equipment.length || technologies.length ? (
            <ProfileSection id="equipment" kicker={t(L.equipmentKicker)} title={equipment.length ? t(L.equipment) : t(L.tech)}>
              {equipment.length ? (
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
              ) : null}
              {technologies.length ? (
                <>
                  {equipment.length ? <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink">{t(L.tech)}</h3> : null}
                  <ul className="cp-grid">
                    {technologies.map((item) => (
                      <li key={item.id || item.nameRu} className="cp-card">
                        <h3>{pickName(lang, item.nameRu, item.nameEn)}</h3>
                        {pick(item.descriptionRu, item.descriptionEn) ? <p>{pick(item.descriptionRu, item.descriptionEn)}</p> : null}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </ProfileSection>
          ) : null}

          {certificates.length || achievements.length ? (
            <ProfileSection id={equipment.length || technologies.length ? undefined : "equipment"} kicker={t(L.trust)} title={certificates.length ? t(L.certs) : t(L.achievements)}>
              {certificates.length ? (
                <ul className="cp-grid">
                  {certificates.map((c) => (
                    <li key={c.id} className="cp-card is-row">
                      {c.imageUrl ? <FitImage src={c.imageUrl} className="cp-thumb" tolerance={0.2} /> : null}
                      <div className="min-w-0">
                        <h3>{pickName(lang, c.nameRu, c.nameEn)}</h3>
                        <p className="mt-1.5">
                          {pickName(lang, c.issuerRu, c.issuerEn)}
                          {c.receivedAt ? ` · ${t(L.received)} ${c.receivedAt}` : c.year ? ` · ${c.year}` : ""}
                          {c.validUntil ? ` · ${t(L.validUntil)} ${c.validUntil}` : ""}
                        </p>
                        {c.fileUrl ? (
                          <a href={c.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm">
                            <Icon name="file" size={16} />
                            {t(L.openFile)}
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {achievements.length ? (
                <>
                  {certificates.length ? <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink">{t(L.achievements)}</h3> : null}
                  <ul className="cp-grid">
                    {achievements.map((a) => (
                      <li key={a.id || a.titleRu} className="cp-card">
                        {a.year ? <p className="cp-label">{a.year}</p> : null}
                        <h3>{pickName(lang, a.titleRu, a.titleEn)}</h3>
                        {pick(a.descriptionRu, a.descriptionEn) ? <p>{pick(a.descriptionRu, a.descriptionEn)}</p> : null}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </ProfileSection>
          ) : null}

          {mapLocation ? (
            <ProfileSection id="location" kicker={t(L.location)} title={t(L.map)}>
              <div className="cp-map">
                <BranchMap mode="view" lat={mapLocation.lat} lng={mapLocation.lng} className="w-full max-w-full" />
              </div>
              <div className="cp-address">
                <p>
                  <Icon name="pin" size={20} />
                  {mapLocation.address || cities}
                </p>
                <div className="cp-address-actions">
                  <a className="pill-btn is-ink" href={yandexRouteUrl(mapLocation.lat, mapLocation.lng)} target="_blank" rel="noreferrer">
                    {t(L.route)}
                    <span className="pill-btn-icon">
                      <Icon name="route" size={17} />
                    </span>
                  </a>
                </div>
              </div>
            </ProfileSection>
          ) : null}

          <ProfileSection id="branches" kicker={t(L.branchesKicker)} title={t(L.branches)} count={branches.length || undefined}>
            {branches.length === 0 ? (
              <p className="cp-text">{t(L.noBranches)}</p>
            ) : (
              <div className="clinic-tiles cp-branches">
                {branches.map((b) => {
                  const address = pick(b.addressRu, b.addressEn);
                  return (
                    <Link key={b.id} to="/clinics/$slug/branches/$branchSlug" params={{ slug, branchSlug: b.slug }} className="clinic-tile">
                      <div className="clinic-tile-cover">
                        {b.coverUrl ? (
                          <FitImage src={b.coverUrl} className="clinic-tile-photo" />
                        ) : (
                          <div className="clinic-tile-placeholder">
                            <img src="/brand/logo.svg" alt="" width={64} height={64} />
                          </div>
                        )}
                      </div>
                      <div className="clinic-tile-body">
                        <h3>{pickName(lang, b.nameRu, b.nameEn)}</h3>
                        <p className="clinic-tile-meta">
                          <span className="clinic-tile-city">
                            <Icon name="pin" size={14} />
                            {CITY_LABELS[b.city] || b.city}
                          </span>
                        </p>
                        {address ? <p className="clinic-tile-text">{address}</p> : null}
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
                        <span className="clinic-tile-arrow" aria-hidden="true">
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
          <LeadForm clinicSlug={data.slug} clinicName={name} defaultSymptoms={symptoms} responseHours={data.responseHours} />
          <ContactCard
            logoUrl={data.logoUrl}
            name={name}
            phones={data.phone ? [data.phone] : []}
            email={data.email}
            website={data.website}
            whatsapp={data.whatsapp}
            telegram={data.telegram}
            instagram={data.instagram}
            youtube={data.youtube}
            socials={data.socials}
            responseHours={data.responseHours}
          >
            {data.coordinatorName ? (
              <div className="cp-contact-extra">
                <small>{t(L.coordinator)}</small>
                <p className="mt-1.5 font-semibold">{data.coordinatorName}</p>
                {pick(data.coordinatorRoleRu, data.coordinatorRoleEn) ? <p className="text-sm text-white/70">{pick(data.coordinatorRoleRu, data.coordinatorRoleEn)}</p> : null}
              </div>
            ) : null}
          </ContactCard>
          <QuickContact name={name} phone={data.phone} whatsapp={data.whatsapp} telegram={data.telegram} responseHours={data.responseHours} cta={t(L.request)} />
        </aside>
      </div>

      <MobileDock cta={t(L.request)} phone={data.phone} />
    </div>
  );
}
