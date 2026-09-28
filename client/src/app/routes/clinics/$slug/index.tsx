import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CITY_LABELS, fetchClinic } from "@/shared/api/client";
import { formatServicePrice } from "@/shared/lib/format-price";
import { BranchMap } from "@/shared/ui/BranchMap";
import { PhotoCarousel } from "@/shared/ui/PhotoCarousel";
import { yandexRouteUrl } from "@/shared/lib/yandex-maps";
import { LeadForm } from "@/widgets/lead-form/LeadForm";

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

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 space-y-4 min-w-0">
      <h2 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  );
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
  if (clinic.isError || !clinic.data) {
    return (
      <div>
        <p className="text-danger">Клиника не найдена</p>
        <Link to="/" className="mt-4 inline-block font-bold text-primary">
          ← К каталогу
        </Link>
      </div>
    );
  }

  const data = clinic.data;
  const cover =
    data.photos?.[0]?.url ||
    data.branches?.[0]?.coverUrl ||
    null;
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

  return (
    <div className="space-y-10">
      <div>
        <Link to="/" className="text-sm font-semibold text-muted hover:text-primary">
          ← Каталог
        </Link>
      </div>

      <header className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_24px_60px_-36px_rgba(31,41,55,0.45)]">
        <div
          className="relative min-h-[220px] bg-primary-deep"
          style={{
            background: cover
              ? undefined
              : `linear-gradient(135deg, ${data.coverColor || "#1570ef"}, #1849a9)`,
          }}
        >
          {cover ? (
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent" />
          <div className="relative flex min-h-[220px] flex-col justify-end gap-4 p-6 md:p-8">
            <div className="flex flex-wrap items-end gap-4">
              {data.logoUrl ? (
                <img
                  src={data.logoUrl}
                  alt=""
                  className="h-16 w-16 rounded-2xl border border-white/40 bg-white object-cover shadow-lg md:h-20 md:w-20"
                />
              ) : null}
              <div className="min-w-0 flex-1 text-white">
                <p className="text-sm font-semibold text-white/75">
                  {cityLabel}
                  {data.foundedYear ? ` · с ${data.foundedYear}` : ""}
                  {data.responseHours ? ` · ответ ~${data.responseHours}ч` : ""}
                </p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
                  {data.nameRu || data.nameEn}
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6 md:p-8">
          <p className="max-w-3xl text-base leading-relaxed text-muted md:text-lg">
            {data.descriptionRu || data.descriptionEn}
          </p>
          {data.specialties?.length ? (
            <div className="flex flex-wrap gap-2">
              {data.specialties.map((s: { slug: string; nameRu?: string; nameEn: string }) => (
                <span key={s.slug} className="chip">
                  {s.nameRu || s.nameEn}
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted">
            {data.languages?.length ? (
              <span className="uppercase tracking-wide">{data.languages.join(" · ")}</span>
            ) : null}
            {data.medicalTourism ? <span>Медтуризм</span> : null}
            {data.phone ? (
              <a href={`tel:${data.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">
                {data.phone}
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-12">
          {data.photos?.length ? (
            <Section title="Фотографии">
              <PhotoCarousel
                photos={data.photos.map((p: { id: string; url: string; altRu?: string; altEn?: string }) => ({
                  id: p.id,
                  url: p.url,
                  alt: p.altRu || p.altEn || "",
                }))}
              />
            </Section>
          ) : null}

          {(history || mission) && (
            <Section title="О клинике">
              <div className="grid gap-6 md:grid-cols-2">
                {history ? (
                  <div className="rounded-2xl border border-line bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">История</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{history}</p>
                  </div>
                ) : null}
                {mission ? (
                  <div className="rounded-2xl border border-line bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Миссия</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{mission}</p>
                  </div>
                ) : null}
              </div>
            </Section>
          )}

          {advantages.length ? (
            <Section title="Преимущества">
              <ul className="grid gap-3 sm:grid-cols-2">
                {advantages.map((item) => (
                  <li
                    key={item}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-relaxed text-ink"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {why ? (
            <Section title="Почему выбирают">
              <p className="max-w-3xl text-sm leading-relaxed text-muted md:text-base">{why}</p>
            </Section>
          ) : null}

          {data.chiefDoctorName ? (
            <Section title="Руководство">
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-5">
                {data.chiefDoctorPhotoUrl ? (
                  <img
                    src={data.chiefDoctorPhotoUrl}
                    alt=""
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-mint text-lg font-extrabold text-primary">
                    {(data.chiefDoctorName || "?").slice(0, 1)}
                  </div>
                )}
                <div>
                  <p className="text-lg font-extrabold text-ink">{data.chiefDoctorName}</p>
                  <p className="text-sm text-muted">
                    {data.chiefDoctorRoleRu || data.chiefDoctorRoleEn}
                  </p>
                </div>
              </div>
            </Section>
          ) : null}

          {data.doctors?.length ? (
            <Section title="Специалисты">
              <ul className="grid gap-4 sm:grid-cols-2">
                {data.doctors.map(
                  (d: {
                    id: string;
                    nameRu?: string;
                    nameEn: string;
                    roleRu?: string;
                    roleEn?: string;
                    bioRu?: string;
                    bioEn?: string;
                    photoUrl?: string | null;
                    experienceYears?: number | null;
                  }) => (
                    <li key={d.id} className="rounded-2xl border border-line bg-white p-5">
                      <div className="flex gap-3">
                        {d.photoUrl ? (
                          <img
                            src={d.photoUrl}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-sand text-sm font-extrabold text-muted">
                            {(d.nameRu || d.nameEn).slice(0, 1)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-ink">{d.nameRu || d.nameEn}</p>
                          <p className="text-sm text-muted">{d.roleRu || d.roleEn}</p>
                          {d.experienceYears != null ? (
                            <p className="mt-1 text-xs font-semibold text-primary">
                              опыт {d.experienceYears} лет
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {(d.bioRu || d.bioEn) && (
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                          {d.bioRu || d.bioEn}
                        </p>
                      )}
                    </li>
                  ),
                )}
              </ul>
            </Section>
          ) : null}

          {data.services?.length ? (
            <Section title="Услуги и цены">
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
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
                      <li
                        key={s.id}
                        className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-ink">{s.nameRu || s.nameEn}</p>
                          {(s.descriptionRu || s.descriptionEn) && (
                            <p className="mt-1 text-sm text-muted">
                              {s.descriptionRu || s.descriptionEn}
                            </p>
                          )}
                        </div>
                        {price ? (
                          <p className="shrink-0 text-sm font-extrabold text-primary">{price}</p>
                        ) : null}
                      </li>
                    );
                  },
                )}
              </ul>
              {popular.length ? (
                <div className="mt-4 rounded-2xl bg-mint px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    Популярные услуги
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-ink">
                    {popular.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Section>
          ) : null}

          {data.equipment?.length ? (
            <Section title="Оборудование">
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.equipment.map(
                  (e: {
                    id: string;
                    nameRu?: string;
                    nameEn: string;
                    descriptionRu?: string;
                    descriptionEn?: string;
                  }) => (
                    <li key={e.id} className="rounded-2xl border border-line bg-white p-4">
                      <p className="font-bold text-ink">{e.nameRu || e.nameEn}</p>
                      {(e.descriptionRu || e.descriptionEn) && (
                        <p className="mt-2 text-sm text-muted">
                          {e.descriptionRu || e.descriptionEn}
                        </p>
                      )}
                    </li>
                  ),
                )}
              </ul>
            </Section>
          ) : null}

          {data.certificates?.length ? (
            <Section title="Сертификаты и лицензии">
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.certificates.map(
                  (c: {
                    id: string;
                    nameRu?: string;
                    nameEn: string;
                    issuerRu?: string;
                    issuerEn?: string;
                    year?: number | null;
                  }) => (
                    <li key={c.id} className="rounded-2xl border border-line bg-white p-4">
                      <p className="font-bold text-ink">{c.nameRu || c.nameEn}</p>
                      <p className="mt-1 text-sm text-muted">
                        {c.issuerRu || c.issuerEn}
                        {c.year ? ` · ${c.year}` : ""}
                      </p>
                    </li>
                  ),
                )}
              </ul>
            </Section>
          ) : null}

          {tourism ? (
            <Section title="Медицинский туризм">
              <p className="max-w-3xl text-sm leading-relaxed text-muted md:text-base">{tourism}</p>
            </Section>
          ) : null}

          {mapBranch ? (
            <Section title="Расположение">
              {(mapBranch.addressRu || mapBranch.addressEn) && (
                <p className="text-sm text-muted">{mapBranch.addressRu || mapBranch.addressEn}</p>
              )}
              <div className="min-w-0 overflow-hidden">
                <BranchMap mode="view" lat={mapBranch.lat} lng={mapBranch.lng} className="w-full max-w-full" />
              </div>
              <p className="text-xs text-muted">
                Координаты: {Number(mapBranch.lat).toFixed(6)}, {Number(mapBranch.lng).toFixed(6)}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="btn btn-primary"
                  href={yandexRouteUrl(mapBranch.lat, mapBranch.lng)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Построить маршрут
                </a>
                {mapBranch.slug ? (
                  <Link
                    to="/clinics/$slug/branches/$branchSlug"
                    params={{ slug, branchSlug: mapBranch.slug }}
                    className="inline-flex items-center text-sm font-bold text-primary"
                  >
                    {mapBranch.nameRu || mapBranch.nameEn || "Филиал"} →
                  </Link>
                ) : null}
              </div>
            </Section>
          ) : null}

          <Section id="branches" title="Филиалы">
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
                    <article
                      key={b.id}
                      className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white"
                    >
                      <div
                        className="h-28 bg-primary-soft"
                        style={
                          b.coverUrl
                            ? {
                                backgroundImage: `url(${b.coverUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : undefined
                        }
                      />
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3 className="font-extrabold">{b.nameRu || b.nameEn}</h3>
                        <p className="text-sm text-muted">
                          {CITY_LABELS[b.city] || b.city}
                          {b.phone ? ` · ${b.phone}` : ""}
                        </p>
                        <p className="text-sm text-muted">{b.addressRu || b.addressEn}</p>
                        <Link
                          to="/clinics/$slug/branches/$branchSlug"
                          params={{ slug, branchSlug: b.slug }}
                          className="btn btn-primary mt-auto w-full text-sm"
                        >
                          Подробнее
                        </Link>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-primary-deep p-6 text-white">
            <p className="text-sm text-white/70">Контакты</p>
            <a
              href={`tel:${String(data.phone || "").replace(/\s/g, "")}`}
              className="mt-3 block text-lg font-bold hover:underline"
            >
              {data.phone}
            </a>
            {data.email ? (
              <a href={`mailto:${data.email}`} className="mt-2 block text-sm text-white/85 hover:underline">
                {data.email}
              </a>
            ) : null}
            {data.website ? (
              <a
                href={data.website}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block truncate text-sm text-white/85 hover:underline"
              >
                {data.website.replace(/^https?:\/\//, "")}
              </a>
            ) : null}
            <div className="mt-4 space-y-1 text-sm text-white/80">
              {data.whatsapp ? <p>WhatsApp: {data.whatsapp}</p> : null}
              {data.telegram ? <p>Telegram: {data.telegram}</p> : null}
              {data.instagram ? <p>Instagram: {data.instagram}</p> : null}
            </div>
            {data.coordinatorName ? (
              <div className="mt-5 border-t border-white/15 pt-4">
                <p className="text-xs uppercase tracking-wide text-white/55">Координатор</p>
                <p className="mt-1 font-bold">{data.coordinatorName}</p>
                <p className="text-sm text-white/70">
                  {data.coordinatorRoleRu || data.coordinatorRoleEn}
                </p>
              </div>
            ) : null}
            <p className="mt-4 text-sm text-white/60">Ответ около {data.responseHours} ч</p>
          </div>
          <LeadForm
            clinicSlug={data.slug}
            clinicName={data.nameRu || data.nameEn}
            defaultSymptoms={symptoms}
          />
        </aside>
      </div>
    </div>
  );
}
