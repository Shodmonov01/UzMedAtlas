import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CITY_LABELS, fetchClinic } from "@/shared/api/client";
import { formatServicePrice } from "@/shared/lib/format-price";
import { BranchMap } from "@/shared/ui/BranchMap";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { FitImage } from "@/shared/ui/FitImage";
import { PhotoCarousel, type GalleryPhoto } from "@/shared/ui/PhotoCarousel";
import { yandexRouteUrl } from "@/shared/lib/yandex-maps";
import { LeadForm } from "@/widgets/lead-form/LeadForm";
import { ContactCard, DoctorList, Icon, PhotoMosaic, ProfileSection, initials } from "@/widgets/clinic-profile/ClinicProfile";

export const Route = createFileRoute("/clinics/$slug/")({
  component: ClinicDetailPage,
});

function text(value?: string | null) {
  const v = value?.trim();
  return v || null;
}

function lines(value?: string | null) {
  const raw = text(value);
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);
}

function ClinicDetailPage() {
  const { slug } = Route.useParams();
  const symptoms =
    typeof window !== "undefined" ? sessionStorage.getItem("uma_last_symptoms") || "" : "";

  const clinic = useQuery({
    queryKey: ["clinic", slug],
    queryFn: () => fetchClinic(slug),
  });

  if (clinic.isLoading) return <p className="text-muted">Загрузка…</p>;
  if (clinic.isError) return <p className="text-danger">Не удалось загрузить страницу клиники</p>;
  if (!clinic.data) {
    return (
      <div>
        <p className="text-danger">Клиника не найдена</p>
        <Link to="/" className="mt-4 inline-block font-bold text-primary">
          К каталогу
        </Link>
      </div>
    );
  }

  const data = clinic.data;
  const name: string = data.nameRu || data.nameEn;
  const description = text(data.descriptionRu) || text(data.descriptionEn);
  const gallery: GalleryPhoto[] = (data.photos || []).map(
    (p: { id: string; url: string; altRu?: string; altEn?: string }) => ({
      id: p.id,
      url: p.url,
      alt: p.altRu || p.altEn || "",
    }),
  );
  if (!gallery.length && data.branches?.[0]?.coverUrl) {
    gallery.push({ id: "branch-cover", url: data.branches[0].coverUrl, alt: name });
  }
  const history = text(data.historyRu) || text(data.historyEn);
  const mission = text(data.missionRu) || text(data.missionEn);
  const advantagesRu = lines(data.advantagesRu);
  const advantages = advantagesRu.length ? advantagesRu : lines(data.advantagesEn);
  const why = text(data.whyChooseRu) || text(data.whyChooseEn);
  const popularRu = lines(data.popularServicesRu);
  const popular = popularRu.length ? popularRu : lines(data.popularServicesEn);
  const tourism = text(data.medicalTourismRu) || text(data.medicalTourismEn);
  const cityLabel = CITY_LABELS[data.city] || data.city;
  const mapBranch = (data.branches || []).find(
    (b: { lat?: number | null; lng?: number | null }) =>
      b.lat != null && b.lng != null && Number.isFinite(b.lat) && Number.isFinite(b.lng),
  ) as
    | {
        lat: number;
        lng: number;
        addressRu?: string;
        addressEn?: string;
        nameRu?: string;
        nameEn?: string;
        slug?: string;
      }
    | undefined;
  const mapLocation = mapBranch || (
    data.lat != null && data.lng != null && Number.isFinite(data.lat) && Number.isFinite(data.lng)
      ? { lat: data.lat, lng: data.lng, addressRu: data.addressRu, addressEn: data.addressEn }
      : undefined
  );

  const cities: string = data.cities?.length
    ? data.cities.map((c: string) => CITY_LABELS[c] || c).join(", ")
    : cityLabel;
  const doctors = data.doctors || [];
  const specialties: { slug: string; nameRu?: string; nameEn: string }[] = data.specialties || [];
  const phoneHref = data.phone ? `tel:${String(data.phone).replace(/\s/g, "")}` : null;
  const stats = [
    doctors.length ? { value: doctors.length, label: "специалистов" } : null,
    data.branches?.length ? { value: data.branches.length, label: data.branches.length === 1 ? "филиал" : "филиалов" } : null,
    specialties.length ? { value: specialties.length, label: "направлений" } : null,
    data.foundedYear ? { value: data.foundedYear, label: "год основания" } : null,
  ].filter(Boolean) as { value: number; label: string }[];

  return (
    <div className="space-y-12">
      <nav className="flex items-center gap-2 text-sm font-semibold text-muted">
        <Link to="/" className="hover:text-primary">
          Каталог
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-ink">{name}</span>
      </nav>

      <header className="clinic-hero">
        <div className="clinic-hero-body">
          <div className="flex items-center gap-4">
            <ClinicLogo src={data.logoUrl} name={name} className="h-[72px] rounded-[20px] md:h-20" wide />
            <div className="clinic-hero-eyebrow">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="pin" size={15} />
                {cities}
              </span>
              {data.responseHours ? <span>ответ ~{data.responseHours} ч</span> : null}
            </div>
          </div>

          <div className="space-y-4">
            <h1>{name}</h1>
            {description ? <p className="clinic-hero-lead">{description}</p> : null}
          </div>

          {specialties.length ? (
            <div className="flex flex-wrap gap-2">
              {specialties.slice(0, 5).map((s) => (
                <span key={s.slug} className="clinic-tag">
                  {s.nameRu || s.nameEn}
                </span>
              ))}
              {specialties.length > 5 ? (
                <a href="#about" className="clinic-tag is-accent">
                  +{specialties.length - 5}
                </a>
              ) : null}
            </div>
          ) : null}

          {stats.length ? (
            <div className="clinic-stats">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="clinic-hero-actions">
            <a href="#lead" className="btn btn-primary">
              Оставить заявку
            </a>
            {phoneHref ? (
              <a href={phoneHref} className="btn btn-ghost">
                <Icon name="phone" size={16} />
                {data.phone}
              </a>
            ) : null}
          </div>
        </div>

        {gallery.length ? (
          <PhotoMosaic photos={gallery} />
        ) : (
          <div className="clinic-mosaic-empty" aria-hidden="true">
            <img src="/brand/logo.svg" alt="" width={72} height={72} />
          </div>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-w-0 space-y-14">
          {description || history || mission || specialties.length ? (
            <ProfileSection id="about" title="О клинике">
              {description ? (
                <p className="max-w-3xl text-base leading-relaxed text-muted md:text-[17px]">{description}</p>
              ) : null}
              {history || mission ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {history ? (
                    <div className="clinic-panel p-6">
                      <p className="clinic-label">История</p>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{history}</p>
                    </div>
                  ) : null}
                  {mission ? (
                    <div className="clinic-panel p-6">
                      <p className="clinic-label">Миссия</p>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{mission}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {specialties.length ? (
                <div className="clinic-panel p-6">
                  <p className="clinic-label">Направления</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {specialties.map((s) => (
                      <span key={s.slug} className="clinic-tag">
                        {s.nameRu || s.nameEn}
                      </span>
                    ))}
                  </div>
                  {data.languages?.length || data.medicalTourism ? (
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
                      {data.languages?.length ? (
                        <span className="clinic-tag is-accent uppercase tracking-wide">
                          {data.languages.join(" · ")}
                        </span>
                      ) : null}
                      {data.medicalTourism ? <span className="clinic-tag is-accent">Медтуризм</span> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </ProfileSection>
          ) : null}

          {gallery.length > 3 ? (
            <ProfileSection title="Фотографии" count={gallery.length}>
              <PhotoCarousel photos={gallery} />
            </ProfileSection>
          ) : null}

          {advantages.length ? (
            <ProfileSection title="Преимущества">
              <ul className="grid gap-3 sm:grid-cols-2">
                {advantages.map((item) => (
                  <li key={item} className="clinic-panel flex gap-3 px-5 py-4 text-sm leading-relaxed text-ink">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </ProfileSection>
          ) : null}

          {why ? (
            <ProfileSection title="Почему выбирают">
              <p className="max-w-3xl text-sm leading-relaxed text-muted md:text-base">{why}</p>
            </ProfileSection>
          ) : null}

          {(text(data.developmentPlansRu) || text(data.developmentPlansEn)) && (
            <ProfileSection title="Планы развития">
              <p className="max-w-3xl text-sm leading-relaxed text-muted md:text-base">
                {text(data.developmentPlansRu) || text(data.developmentPlansEn)}
              </p>
            </ProfileSection>
          )}

          {data.founderName ? (
            <ProfileSection title="Основатель">
              <div className="clinic-panel flex flex-wrap items-center gap-4 p-5">
                <span className="clinic-avatar h-16 w-16 rounded-2xl text-lg">
                  {data.founderPhotoUrl ? <img src={data.founderPhotoUrl} alt="" /> : initials(data.founderName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-ink">{data.founderName}</p>
                  <p className="text-sm text-muted">{data.founderRoleRu || data.founderRoleEn}</p>
                  {(data.founderBioRu || data.founderBioEn) && (
                    <p className="mt-2 text-sm text-muted">{data.founderBioRu || data.founderBioEn}</p>
                  )}
                </div>
              </div>
            </ProfileSection>
          ) : null}

          {Array.isArray(data.achievements) && data.achievements.length ? (
            <ProfileSection title="Достижения">
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.achievements.map((a: { id?: string; titleRu?: string; titleEn?: string; descriptionRu?: string; descriptionEn?: string; year?: number | null }) => (
                  <li key={a.id || a.titleRu} className="clinic-panel p-5">
                    {a.year ? <p className="clinic-label">{a.year}</p> : null}
                    <p className="mt-1 font-semibold text-ink">{a.titleRu || a.titleEn}</p>
                    {(a.descriptionRu || a.descriptionEn) ? <p className="mt-1 text-sm text-muted">{a.descriptionRu || a.descriptionEn}</p> : null}
                  </li>
                ))}
              </ul>
            </ProfileSection>
          ) : null}

          {Array.isArray(data.technologies) && data.technologies.length ? (
            <ProfileSection title="Технологии и методики">
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.technologies.map(
                  (t: { id?: string; nameRu?: string; nameEn?: string; descriptionRu?: string; descriptionEn?: string }) => (
                    <li key={t.id || t.nameRu} className="clinic-panel p-5">
                      <p className="font-semibold text-ink">{t.nameRu || t.nameEn}</p>
                      {(t.descriptionRu || t.descriptionEn) && (
                        <p className="mt-2 text-sm text-muted">{t.descriptionRu || t.descriptionEn}</p>
                      )}
                    </li>
                  ),
                )}
              </ul>
            </ProfileSection>
          ) : null}

          {data.chiefDoctorName || (Array.isArray(data.leaders) && data.leaders.length) ? (
            <ProfileSection title="Руководство">
              {data.chiefDoctorName ? (
                <div className="clinic-panel flex flex-wrap items-center gap-4 p-5">
                  <span className="clinic-avatar h-16 w-16 rounded-2xl text-lg">
                    {data.chiefDoctorPhotoUrl ? <img src={data.chiefDoctorPhotoUrl} alt="" /> : initials(data.chiefDoctorName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-ink">{data.chiefDoctorName}</p>
                    <p className="text-sm text-muted">{data.chiefDoctorRoleRu || data.chiefDoctorRoleEn}</p>
                    {(data.chiefDoctorBioRu || data.chiefDoctorBioEn) && (
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {data.chiefDoctorBioRu || data.chiefDoctorBioEn}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
              {Array.isArray(data.leaders) && data.leaders.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {data.leaders.map(
                    (l: {
                      id?: string;
                      name: string;
                      roleRu?: string;
                      roleEn?: string;
                      bioRu?: string;
                      bioEn?: string;
                      photoUrl?: string | null;
                    }) => (
                      <li key={l.id || l.name} className="clinic-panel flex gap-4 p-5">
                        <span className="clinic-avatar h-12 w-12 rounded-xl text-sm">
                          {l.photoUrl ? <img src={l.photoUrl} alt="" /> : initials(l.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{l.name}</p>
                          <p className="text-sm text-muted">{l.roleRu || l.roleEn}</p>
                          {(l.bioRu || l.bioEn) && <p className="mt-1 text-sm text-muted">{l.bioRu || l.bioEn}</p>}
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              ) : null}
            </ProfileSection>
          ) : null}

          {doctors.length ? (
            <ProfileSection id="doctors" title="Специалисты" count={doctors.length}>
              <DoctorList doctors={doctors} />
            </ProfileSection>
          ) : null}

          {data.services?.length ? (
            <ProfileSection title="Услуги и цены">
              <ul className="clinic-panel divide-y divide-line overflow-hidden">
                {data.services.map(
                  (s: {
                    id: string;
                    nameRu?: string;
                    nameEn: string;
                    descriptionRu?: string;
                    descriptionEn?: string;
                    priceUsd?: number | null;
                    currency?: string;
                    unit?: string;
                  }) => {
                    const price = formatServicePrice(s);
                    return (
                      <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-ink">{s.nameRu || s.nameEn}</p>
                          {(s.descriptionRu || s.descriptionEn) && (
                            <p className="mt-1 text-sm text-muted">{s.descriptionRu || s.descriptionEn}</p>
                          )}
                        </div>
                        {price ? <p className="shrink-0 text-sm font-bold text-accent-strong">{price}</p> : null}
                      </li>
                    );
                  },
                )}
              </ul>
              {popular.length ? (
                <div className="rounded-[22px] bg-mint px-6 py-5">
                  <p className="clinic-label">Популярные услуги</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-ink">
                    {popular.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </ProfileSection>
          ) : null}

          {data.equipment?.length ? (
            <ProfileSection title="Оборудование">
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.equipment.map(
                  (e: {
                    id: string;
                    nameRu?: string;
                    nameEn: string;
                    manufacturer?: string;
                    descriptionRu?: string;
                    descriptionEn?: string;
                    photoUrl?: string | null;
                  }) => (
                    <li key={e.id} className="clinic-panel flex gap-4 p-4">
                      {e.photoUrl ? <FitImage src={e.photoUrl} className="h-20 w-20 shrink-0 rounded-xl" tolerance={0.2} /> : null}
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{e.nameRu || e.nameEn}</p>
                        {e.manufacturer ? <p className="mt-1 clinic-label">{e.manufacturer}</p> : null}
                        {(e.descriptionRu || e.descriptionEn) && (
                          <p className="mt-2 text-sm text-muted">{e.descriptionRu || e.descriptionEn}</p>
                        )}
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </ProfileSection>
          ) : null}

          {data.certificates?.length ? (
            <ProfileSection title="Сертификаты и лицензии">
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.certificates.map(
                  (c: {
                    id: string;
                    nameRu?: string;
                    nameEn: string;
                    issuerRu?: string;
                    issuerEn?: string;
                    year?: number | null;
                    receivedAt?: string | null;
                    validUntil?: string | null;
                    fileUrl?: string | null;
                    imageUrl?: string | null;
                  }) => (
                    <li key={c.id} className="clinic-panel flex gap-4 p-4">
                      {c.imageUrl ? <FitImage src={c.imageUrl} className="h-16 w-16 shrink-0 rounded-xl" tolerance={0.2} /> : null}
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{c.nameRu || c.nameEn}</p>
                        <p className="mt-1 text-sm text-muted">
                          {c.issuerRu || c.issuerEn}
                          {c.receivedAt ? ` · получен ${c.receivedAt}` : c.year ? ` · ${c.year}` : ""}
                          {c.validUntil ? ` · до ${c.validUntil}` : ""}
                        </p>
                        {c.fileUrl ? (
                          <a href={c.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-primary">
                            Открыть файл
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </ProfileSection>
          ) : null}

          {tourism ? (
            <ProfileSection title="Медицинский туризм">
              <p className="max-w-3xl text-sm leading-relaxed text-muted md:text-base">{tourism}</p>
            </ProfileSection>
          ) : null}

          {mapLocation ? (
            <ProfileSection title="Расположение">
              {(mapLocation.addressRu || mapLocation.addressEn) && (
                <p className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-0.5 text-primary"><Icon name="pin" size={16} /></span>
                  {mapLocation.addressRu || mapLocation.addressEn}
                </p>
              )}
              <div className="min-w-0 overflow-hidden rounded-[22px]">
                <BranchMap mode="view" lat={mapLocation.lat} lng={mapLocation.lng} className="w-full max-w-full" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  className="btn btn-primary"
                  href={yandexRouteUrl(mapLocation.lat, mapLocation.lng)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Построить маршрут
                </a>
                {mapBranch?.slug ? (
                  <Link
                    to="/clinics/$slug/branches/$branchSlug"
                    params={{ slug, branchSlug: mapBranch.slug }}
                    className="inline-flex items-center text-sm font-bold text-primary"
                  >
                    {mapBranch.nameRu || mapBranch.nameEn || "Филиал"}
                  </Link>
                ) : null}
              </div>
            </ProfileSection>
          ) : null}

          <ProfileSection id="branches" title="Филиалы" count={data.branches?.length}>
            {(data.branches || []).length === 0 ? (
              <p className="text-sm text-muted">Филиалы не указаны</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.branches.map(
                  (b: {
                    id: string;
                    slug: string;
                    nameRu?: string;
                    nameEn: string;
                    city: string;
                    addressRu?: string;
                    addressEn?: string;
                    coverUrl?: string | null;
                    phone?: string;
                  }) => (
                    <Link
                      key={b.id}
                      to="/clinics/$slug/branches/$branchSlug"
                      params={{ slug, branchSlug: b.slug }}
                      className="clinic-card"
                    >
                      <div className="clinic-card-cover">
                        {b.coverUrl ? (
                          <FitImage src={b.coverUrl} className="clinic-card-photo" />
                        ) : (
                          <div className="clinic-card-placeholder">
                            <img src="/brand/logo.svg" alt="" width={56} height={56} />
                          </div>
                        )}
                        <span className="clinic-card-city">{CITY_LABELS[b.city] || b.city}</span>
                      </div>
                      <div className="clinic-card-body">
                        <div className="clinic-card-head">
                          <h3>{b.nameRu || b.nameEn}</h3>
                        </div>
                        {(b.addressRu || b.addressEn) && (
                          <p className="clinic-card-address">
                            <Icon name="pin" size={14} />
                            {b.addressRu || b.addressEn}
                          </p>
                        )}
                        <div className="clinic-card-foot">
                          <span className="clinic-card-meta">{b.phone || ""}</span>
                          <span className="clinic-card-more">
                            Подробнее
                            <span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            )}
          </ProfileSection>
        </div>

        <aside className="min-w-0 space-y-4">
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
              <div className="border-t border-white/10 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-white/60">Координатор</p>
                <p className="mt-1 font-semibold">{data.coordinatorName}</p>
                <p className="text-sm text-white/70">{data.coordinatorRoleRu || data.coordinatorRoleEn}</p>
              </div>
            ) : null}
          </ContactCard>
          <div id="lead" className="scroll-mt-28">
            <LeadForm clinicSlug={data.slug} clinicName={name} defaultSymptoms={symptoms} />
          </div>
        </aside>
      </div>
    </div>
  );
}
