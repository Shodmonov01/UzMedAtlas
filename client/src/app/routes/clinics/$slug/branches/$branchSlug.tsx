import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CITY_LABELS, fetchClinicBranch } from "@/shared/api/client";
import { formatServicePrice } from "@/shared/lib/format-price";
import { formatDayHours, isOpenNow } from "@/shared/lib/schedule";
import { BranchMap } from "@/shared/ui/BranchMap";
import { PhotoCarousel } from "@/shared/ui/PhotoCarousel";
import { yandexPointUrl, yandexRouteUrl } from "@/shared/lib/yandex-maps";
import { LeadForm } from "@/widgets/lead-form/LeadForm";

export const Route = createFileRoute("/clinics/$slug/branches/$branchSlug")({
  component: BranchDetailPage,
});

const DAY_LABELS: Record<string, string> = {
  mon: "Пн",
  tue: "Вт",
  wed: "Ср",
  thu: "Чт",
  fri: "Пт",
  sat: "Сб",
  sun: "Вс",
};

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
          ← К клинике
        </Link>
      </div>
    );
  }

  const data = branch.data;
  const schedule = data.schedule || {};
  const hasCoords = data.lat != null && data.lng != null;
  const openNow = isOpenNow(schedule);
  const phones: string[] =
    Array.isArray(data.phones) && data.phones.length
      ? data.phones
      : data.phone
        ? [data.phone]
        : [];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-8">
        <div>
          <Link to="/clinics/$slug" params={{ slug }} className="text-sm font-semibold text-muted">
            ← {data.clinic?.nameRu || data.clinic?.nameEn || "Клиника"}
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {data.clinic?.logoUrl ? (
              <img
                src={data.clinic.logoUrl}
                alt=""
                className="h-14 w-14 rounded-2xl border border-line object-cover"
              />
            ) : null}
            <div>
              <h1 className="text-4xl font-extrabold">{data.nameRu || data.nameEn}</h1>
              <p className="mt-2 text-muted">{CITY_LABELS[data.city] || data.city}</p>
            </div>
            {Object.keys(schedule).length ? (
              <span
                className={`rounded-xl px-3 py-1 text-sm font-bold ${
                  openNow ? "bg-mint text-primary" : "bg-sand text-muted"
                }`}
              >
                {openNow ? "Сейчас открыто" : "Сейчас закрыто"}
              </span>
            ) : null}
          </div>
          {data.coverUrl ? (
            <img src={data.coverUrl} alt="" className="mt-5 aspect-[16/7] w-full rounded-xl object-cover" />
          ) : null}
          {(data.descriptionRu || data.descriptionEn) && (
            <p className="mt-6 max-w-3xl leading-relaxed text-muted">
              {data.descriptionRu || data.descriptionEn}
            </p>
          )}
        </div>

        <section className="space-y-3">
          <h2 className="text-2xl font-extrabold">Расположение</h2>
          <p className="text-sm text-muted">{data.addressRu || data.addressEn}</p>
          {hasCoords ? (
            <>
              <div className="min-w-0 overflow-hidden">
                <BranchMap mode="view" lat={data.lat} lng={data.lng} className="w-full max-w-full" />
              </div>
              <p className="text-xs text-muted">
                Координаты: {Number(data.lat).toFixed(6)}, {Number(data.lng).toFixed(6)}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="btn btn-primary"
                  href={yandexRouteUrl(Number(data.lat), Number(data.lng))}
                  target="_blank"
                  rel="noreferrer"
                >
                  Построить маршрут
                </a>
                <a
                  className="inline-flex items-center text-sm font-bold text-primary"
                  href={yandexPointUrl(Number(data.lat), Number(data.lng))}
                  target="_blank"
                  rel="noreferrer"
                >
                  Открыть в Яндекс.Картах
                </a>
              </div>
            </>
          ) : null}
        </section>

        <section className="space-y-2">
          <h2 className="text-2xl font-extrabold">Контакты</h2>
          {phones.map((p) => (
            <p key={p} className="text-sm">
              <a href={`tel:${p.replace(/\s/g, "")}`} className="font-semibold text-primary hover:underline">
                {p}
              </a>
            </p>
          ))}
          {data.email ? <a className="block text-sm text-primary hover:underline" href={`mailto:${data.email}`}>{data.email}</a> : null}
          {data.whatsapp ? <a className="block text-sm text-primary hover:underline" href={`https://wa.me/${String(data.whatsapp).replace(/\D/g, "")}`}>WhatsApp</a> : null}
          {data.telegram ? <a className="block text-sm text-primary hover:underline" href={String(data.telegram).startsWith("http") ? data.telegram : `https://t.me/${String(data.telegram).replace(/^@/, "")}`} target="_blank" rel="noreferrer">Telegram</a> : null}
          {data.instagram ? <a className="block text-sm text-primary hover:underline" href={String(data.instagram).startsWith("http") ? data.instagram : `https://instagram.com/${String(data.instagram).replace(/^@/, "")}`} target="_blank" rel="noreferrer">Instagram</a> : null}
          {data.website ? <a className="block text-sm text-primary hover:underline" href={String(data.website).startsWith("http") ? data.website : `https://${data.website}`} target="_blank" rel="noreferrer">{data.website}</a> : null}
          {data.socials?.map((social: { label: string; url: string }, index: number) => (
            <p key={`${social.label}-${index}`} className="text-sm">
              <a href={social.url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">{social.label}</a>
            </p>
          ))}
        </section>

        {(data.advantagesRu || data.featuresRu || data.medicalTourism) ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-extrabold">Особенности филиала</h2>
            {data.advantagesRu ? <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{data.advantagesRu}</p> : null}
            {data.featuresRu ? <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{data.featuresRu}</p> : null}
            {data.medicalTourism && data.medicalTourismInfoRu ? (
              <div>
                <h3 className="font-bold">Медицинский туризм и международное сотрудничество</h3>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{data.medicalTourismInfoRu}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        {Object.keys(schedule).length ? (
          <section className="space-y-2">
            <h2 className="text-2xl font-extrabold">Режим работы</h2>
            <ul className="space-y-1 text-sm">
              {Object.entries(DAY_LABELS).map(([key, label]) => {
                const day = schedule[key];
                return (
                  <li key={key} className="flex gap-3">
                    <span className="w-8 font-bold">{label}</span>
                    <span className="text-muted">{formatDayHours(day ?? null)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {data.specialties?.length ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-extrabold">Направления</h2>
            <div className="flex flex-wrap gap-2">
              {data.specialties.map((s: { slug: string; nameRu?: string; nameEn: string }) => (
                <span key={s.slug} className="chip">
                  {s.nameRu || s.nameEn}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {data.services?.length ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-extrabold">Услуги</h2>
            <ul className="space-y-2">
              {data.services.map(
                (s: {
                  id: string;
                  nameRu?: string;
                  nameEn: string;
                  priceUsd?: number | null;
                  currency?: string;
                  unit?: string;
                }) => {
                  const price = formatServicePrice(s);
                  return (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm"
                    >
                      <span className="font-semibold">{s.nameRu || s.nameEn}</span>
                      {price ? <span className="text-muted">{price}</span> : null}
                    </li>
                  );
                },
              )}
            </ul>
          </section>
        ) : null}

        {data.doctors?.length ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-extrabold">Специалисты</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.doctors.map(
                (d: {
                  id: string;
                  nameRu?: string;
                  nameEn: string;
                  roleRu?: string;
                  roleEn?: string;
                  photoUrl?: string | null;
                  experienceYears?: number | null;
                  bioRu?: string;
                  certsRu?: string;
                  continuingEducationRu?: string;
                  internationalExperienceRu?: string;
                  researchActivityRu?: string;
                  awardsRu?: string;
                  achievementsRu?: string;
                }) => (
                  <li key={d.id} className="rounded-2xl border border-line p-4">
                    <div className="flex gap-3">
                      {d.photoUrl ? <img src={d.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : null}
                      <div>
                        <p className="font-bold">{d.nameRu || d.nameEn}</p>
                        <p className="text-sm text-muted">{d.roleRu || d.roleEn}</p>
                        {d.experienceYears != null ? <p className="text-xs text-muted">Стаж: {d.experienceYears} лет</p> : null}
                      </div>
                    </div>
                    {[d.bioRu, d.certsRu, d.continuingEducationRu, d.internationalExperienceRu, d.researchActivityRu, d.awardsRu, d.achievementsRu]
                      .filter(Boolean)
                      .map((detail, index) => <p key={index} className="mt-2 text-sm text-muted">{detail}</p>)}
                  </li>
                ),
              )}
            </ul>
          </section>
        ) : null}

        {data.equipment?.length ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-extrabold">Оборудование</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.equipment.map(
                (e: {
                  id: string;
                  nameRu?: string;
                  nameEn: string;
                  descriptionRu?: string;
                  descriptionEn?: string;
                  photoUrl?: string | null;
                }) => (
                  <li key={e.id} className="rounded-2xl border border-line p-4">
                    <div className="flex gap-3">
                      {e.photoUrl ? (
                        <img src={e.photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                      ) : null}
                      <div className="min-w-0">
                        <p className="font-bold">{e.nameRu || e.nameEn}</p>
                        {(e.descriptionRu || e.descriptionEn) && (
                          <p className="mt-1 text-sm text-muted">{e.descriptionRu || e.descriptionEn}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ),
              )}
            </ul>
          </section>
        ) : null}

        {data.photos?.length ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-extrabold">Фотографии</h2>
            <PhotoCarousel
              photos={data.photos.map((p: { id: string; url: string; altRu?: string; altEn?: string }) => ({
                id: p.id,
                url: p.url,
                alt: p.altRu || p.altEn || "",
              }))}
            />
          </section>
        ) : null}
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
        <LeadForm
          clinicSlug={slug}
          clinicName={data.clinic?.nameRu || data.clinic?.nameEn || data.nameRu || data.nameEn}
          defaultSymptoms={symptoms}
        />
      </aside>
    </div>
  );
}
