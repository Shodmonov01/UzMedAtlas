import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CITY_LABELS, fetchClinicBranch } from "@/shared/api/client";
import { formatServicePrice } from "@/shared/lib/format-price";
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
  if (branch.isError || !branch.data) {
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

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <div>
          <Link to="/clinics/$slug" params={{ slug }} className="text-sm font-semibold text-muted">
            ← {data.clinic?.nameRu || data.clinic?.nameEn || "Клиника"}
          </Link>
          <h1 className="mt-4 text-4xl font-extrabold">{data.nameRu || data.nameEn}</h1>
          <p className="mt-2 text-muted">{CITY_LABELS[data.city] || data.city}</p>
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
          <p className="text-sm">{data.phone}</p>
          {data.email ? <p className="text-sm text-muted">{data.email}</p> : null}
          {data.whatsapp ? <p className="text-sm text-muted">WhatsApp: {data.whatsapp}</p> : null}
          {data.telegram ? <p className="text-sm text-muted">Telegram: {data.telegram}</p> : null}
        </section>

        {Object.keys(schedule).length ? (
          <section className="space-y-2">
            <h2 className="text-2xl font-extrabold">Режим работы</h2>
            <ul className="space-y-1 text-sm">
              {Object.entries(DAY_LABELS).map(([key, label]) => {
                const day = schedule[key];
                return (
                  <li key={key} className="flex gap-3">
                    <span className="w-8 font-bold">{label}</span>
                    <span className="text-muted">
                      {day ? `${day.open} – ${day.close}` : "выходной"}
                    </span>
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
                }) => (
                  <li key={d.id} className="rounded-2xl border border-line p-4">
                    <p className="font-bold">{d.nameRu || d.nameEn}</p>
                    <p className="text-sm text-muted">{d.roleRu || d.roleEn}</p>
                  </li>
                ),
              )}
            </ul>
          </section>
        ) : null}

        {data.equipment?.length ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-extrabold">Оборудование</h2>
            <ul className="list-disc pl-5 text-sm text-muted">
              {data.equipment.map((e: { id: string; nameRu?: string; nameEn: string }) => (
                <li key={e.id}>{e.nameRu || e.nameEn}</li>
              ))}
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

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <LeadForm
          clinicSlug={slug}
          clinicName={data.clinic?.nameRu || data.clinic?.nameEn || data.nameRu || data.nameEn}
          defaultSymptoms={symptoms}
        />
      </aside>
    </div>
  );
}
