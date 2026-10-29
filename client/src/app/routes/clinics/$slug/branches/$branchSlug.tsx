import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CITY_LABELS, fetchClinicBranch } from "@/shared/api/client";
import { formatServicePrice } from "@/shared/lib/format-price";
import { formatDayHours, isOpenNow, type DayHours } from "@/shared/lib/schedule";
import { BranchMap } from "@/shared/ui/BranchMap";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { FitImage } from "@/shared/ui/FitImage";
import { LogoTiles } from "@/shared/ui/LogoTiles";
import { PhotoCarousel, type GalleryPhoto } from "@/shared/ui/PhotoCarousel";
import { yandexPointUrl, yandexRouteUrl } from "@/shared/lib/yandex-maps";
import { LeadForm } from "@/widgets/lead-form/LeadForm";
import { ContactCard, DoctorList, Icon, PhotoMosaic, ProfileSection, type ProfileDoctor } from "@/widgets/clinic-profile/ClinicProfile";

export const Route = createFileRoute("/clinics/$slug/branches/$branchSlug")({
  component: BranchDetailPage,
});

const DAY_LABELS: Record<string, string> = {
  mon: "Понедельник",
  tue: "Вторник",
  wed: "Среда",
  thu: "Четверг",
  fri: "Пятница",
  sat: "Суббота",
  sun: "Воскресенье",
};

function todayKey() {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tashkent", weekday: "short" }).format(new Date());
  return weekday.slice(0, 3).toLowerCase();
}

/** "JCI; университетская клиника; робот-центр." → ["JCI", "Университетская клиника", "Робот-центр"] */
function points(value?: string | null) {
  return (value || "")
    .split(/[;\n]/)
    .map((item) => item.replace(/^[•\-\*]\s*/, "").replace(/\.$/, "").trim())
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));
}

function BranchDetailPage() {
  const { slug, branchSlug } = Route.useParams();
  const symptoms =
    typeof window !== "undefined" ? sessionStorage.getItem("uma_last_symptoms") || "" : "";

  const branch = useQuery({
    queryKey: ["branch", slug, branchSlug],
    queryFn: () => fetchClinicBranch(slug, branchSlug),
  });

  if (branch.isLoading) return <p className="text-muted">Загрузка…</p>;
  if (branch.isError) return <p className="text-danger">Не удалось загрузить страницу филиала</p>;
  if (!branch.data) {
    return (
      <div>
        <p className="text-danger">Филиал не найден</p>
        <Link to="/clinics/$slug" params={{ slug }} className="mt-4 inline-block font-bold text-primary">
          К клинике
        </Link>
      </div>
    );
  }

  const data = branch.data;
  const name: string = data.nameRu || data.nameEn;
  const clinicName: string = data.clinic?.nameRu || data.clinic?.nameEn || "Клиника";
  const description: string | null = data.descriptionRu || data.descriptionEn || null;
  const address: string | null = data.addressRu || data.addressEn || null;
  const schedule: Record<string, DayHours> = data.schedule || {};
  const hasSchedule = Object.keys(schedule).length > 0;
  const allDay = hasSchedule && Object.keys(DAY_LABELS).every((key) => schedule[key]?.roundTheClock);
  const openNow = isOpenNow(schedule);
  const today = todayKey();
  const lat = data.lat != null ? Number(data.lat) : null;
  const lng = data.lng != null ? Number(data.lng) : null;
  const hasCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const mapsUrl = hasCoords
    ? yandexPointUrl(lat, lng)
    : address
      ? `https://yandex.uz/maps/?text=${encodeURIComponent(address)}`
      : null;
  const phones: string[] =
    Array.isArray(data.phones) && data.phones.length ? data.phones : data.phone ? [data.phone] : [];
  const gallery: GalleryPhoto[] = (data.photos || []).map(
    (p: { id: string; url: string; altRu?: string; altEn?: string }) => ({
      id: p.id,
      url: p.url,
      alt: p.altRu || p.altEn || "",
    }),
  );
  if (data.coverUrl && !gallery.some((p) => p.url === data.coverUrl)) {
    gallery.unshift({ id: "cover", url: data.coverUrl, alt: name });
  }
  const advantages = points(data.advantagesRu || data.advantagesEn);
  const features = points(data.featuresRu || data.featuresEn);
  const specialties: { slug: string; nameRu?: string; nameEn: string }[] = data.specialties || [];
  const doctors: ProfileDoctor[] = data.doctors || [];
  const hoursLabel = allDay ? "Круглосуточно, без выходных" : hasSchedule ? `Сегодня: ${formatDayHours(schedule[today] ?? null)}` : null;
  const stats = [
    doctors.length ? { value: doctors.length, label: "специалистов" } : null,
    specialties.length ? { value: specialties.length, label: "направлений" } : null,
    data.services?.length ? { value: data.services.length, label: "услуг" } : null,
    allDay ? { value: "24/7", label: "без выходных" } : null,
  ].filter(Boolean) as { value: number | string; label: string }[];

  return (
    <div className="space-y-12">
      <nav className="flex min-w-0 items-center gap-2 text-sm font-semibold text-muted">
        <Link to="/" className="shrink-0 hover:text-primary">
          Каталог
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/clinics/$slug" params={{ slug }} className="min-w-0 truncate hover:text-primary">
          {clinicName}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="hidden truncate text-ink sm:inline">{name}</span>
      </nav>

      <header className="clinic-hero">
        <div className="clinic-hero-body">
          <div className="flex items-center gap-4">
            <ClinicLogo src={data.clinic?.logoUrl} name={clinicName} className="h-[72px] rounded-[20px] md:h-20" wide />
            <div className="clinic-hero-eyebrow">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="pin" size={15} />
                {CITY_LABELS[data.city] || data.city}
              </span>
              <span>филиал клиники</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1>{name}</h1>
            {hasSchedule ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className={`clinic-status ${openNow ? "is-open" : ""}`}>{openNow ? "Сейчас открыто" : "Сейчас закрыто"}</span>
                {hoursLabel ? <span className="text-sm font-semibold text-muted">{hoursLabel}</span> : null}
              </div>
            ) : null}
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
                <a href="#specialties" className="clinic-tag is-accent">
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
            {phones[0] ? (
              <a href={`tel:${phones[0].replace(/[^\d+]/g, "")}`} className="btn btn-ghost">
                <Icon name="phone" size={16} />
                {phones[0]}
              </a>
            ) : null}
          </div>
        </div>

        {gallery.length ? (
          <PhotoMosaic photos={gallery} />
        ) : (
          <div className="clinic-hero-facts">
            <LogoTiles corner="br" seed={17} />
            <p className="clinic-label text-accent">Как добраться</p>
            {address ? (
              <div className="clinic-hero-fact">
                <Icon name="pin" />
                <div>
                  <p className="text-white/60">Адрес</p>
                  <p>{address}</p>
                </div>
              </div>
            ) : null}
            {hoursLabel ? (
              <div className="clinic-hero-fact">
                <Icon name="clock" />
                <div>
                  <p className="text-white/60">Режим работы</p>
                  <p>{hoursLabel}</p>
                </div>
              </div>
            ) : null}
            {phones.length ? (
              <div className="clinic-hero-fact">
                <Icon name="phone" />
                <div>
                  <p className="text-white/60">Телефон</p>
                  {phones.slice(0, 2).map((phone) => (
                    <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="block hover:underline">
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
            {mapsUrl ? (
              <a href={hasCoords ? yandexRouteUrl(lat, lng) : mapsUrl} target="_blank" rel="noreferrer" className="btn btn-accent mt-auto self-start">
                <Icon name="route" size={16} />
                {hasCoords ? "Построить маршрут" : "Открыть на карте"}
              </a>
            ) : null}
          </div>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-w-0 space-y-14">
          {advantages.length || features.length || (data.medicalTourism && data.medicalTourismInfoRu) ? (
            <ProfileSection title="Особенности филиала">
              <div className="grid gap-4 md:grid-cols-2">
                {advantages.length ? (
                  <div className="clinic-panel p-6">
                    <p className="clinic-label">Преимущества</p>
                    <ul className="mt-4 space-y-2.5">
                      {advantages.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                          <span className="mt-0.5 shrink-0 text-accent-strong"><Icon name="check" size={16} /></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {features.length ? (
                  <div className="clinic-panel p-6">
                    <p className="clinic-label">Что есть в филиале</p>
                    <ul className="mt-4 space-y-2.5">
                      {features.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                          <span className="mt-0.5 shrink-0 text-accent-strong"><Icon name="check" size={16} /></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              {data.medicalTourism && data.medicalTourismInfoRu ? (
                <div className="rounded-[22px] bg-mint px-6 py-5">
                  <p className="clinic-label">Медицинский туризм и международное сотрудничество</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{data.medicalTourismInfoRu}</p>
                </div>
              ) : null}
            </ProfileSection>
          ) : null}

          {specialties.length ? (
            <ProfileSection id="specialties" title="Направления" count={specialties.length}>
              <div className="clinic-panel flex flex-wrap gap-2 p-6">
                {specialties.map((s) => (
                  <span key={s.slug} className="clinic-tag">
                    {s.nameRu || s.nameEn}
                  </span>
                ))}
              </div>
            </ProfileSection>
          ) : null}

          {doctors.length ? (
            <ProfileSection id="doctors" title="Специалисты" count={doctors.length}>
              <DoctorList doctors={doctors} />
            </ProfileSection>
          ) : null}

          {data.services?.length ? (
            <ProfileSection title="Услуги и цены" count={data.services.length}>
              <ul className="clinic-panel divide-y divide-line overflow-hidden">
                {data.services.map(
                  (s: { id: string; nameRu?: string; nameEn: string; descriptionRu?: string; descriptionEn?: string; priceUsd?: number | null; currency?: string; unit?: string }) => {
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
            </ProfileSection>
          ) : null}

          {data.equipment?.length ? (
            <ProfileSection title="Оборудование">
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.equipment.map(
                  (e: { id: string; nameRu?: string; nameEn: string; manufacturer?: string; descriptionRu?: string; descriptionEn?: string; photoUrl?: string | null }) => (
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

          {gallery.length > 3 ? (
            <ProfileSection title="Фотографии" count={gallery.length}>
              <PhotoCarousel photos={gallery} />
            </ProfileSection>
          ) : null}

          {address || hasCoords ? (
            <ProfileSection title="Расположение">
              {hasCoords ? (
                <div className="min-w-0 overflow-hidden rounded-[22px]">
                  <BranchMap mode="view" lat={lat} lng={lng} className="w-full max-w-full" />
                </div>
              ) : null}
              <div className="clinic-panel flex flex-wrap items-center justify-between gap-4 p-5">
                <p className="flex min-w-0 items-start gap-3 text-sm text-ink">
                  <span className="mt-0.5 shrink-0 text-primary"><Icon name="pin" /></span>
                  {address || "Адрес уточняйте у координатора"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {hasCoords ? (
                    <a className="btn btn-primary text-sm" href={yandexRouteUrl(lat, lng)} target="_blank" rel="noreferrer">
                      Построить маршрут
                    </a>
                  ) : null}
                  {mapsUrl ? (
                    <a className="btn btn-ghost text-sm" href={mapsUrl} target="_blank" rel="noreferrer">
                      Открыть в Яндекс.Картах
                    </a>
                  ) : null}
                </div>
              </div>
            </ProfileSection>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-4">
          <ContactCard
            logoUrl={data.clinic?.logoUrl}
            name={name}
            label="Контакты филиала"
            phones={phones}
            email={data.email}
            website={data.website}
            whatsapp={data.whatsapp}
            telegram={data.telegram}
            instagram={data.instagram}
            socials={data.socials}
          >
            {hasSchedule ? (
              <div className="border-t border-white/10 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-white/60">Режим работы</p>
                {allDay ? (
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                    <span className="text-accent"><Icon name="clock" size={16} /></span>
                    Круглосуточно, без выходных
                  </p>
                ) : (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {Object.entries(DAY_LABELS).map(([key, label]) => (
                      <li key={key} className={`flex justify-between gap-4 ${key === today ? "font-semibold text-white" : "text-white/70"}`}>
                        <span>{label}</span>
                        <span>{formatDayHours(schedule[key] ?? null)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </ContactCard>
          <div id="lead" className="scroll-mt-28">
            <LeadForm clinicSlug={slug} clinicName={clinicName} defaultSymptoms={symptoms} />
          </div>
        </aside>
      </div>
    </div>
  );
}
