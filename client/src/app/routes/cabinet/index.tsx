import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  cabinetLogout,
  cabinetMe,
  deleteCabinetClinic,
  fetchCabinetClinics,
} from "@/shared/api/cabinet";
import { CITY_LABELS } from "@/shared/api/client";
import { StatusBadge } from "@/shared/ui/StatusBadge";

export const Route = createFileRoute("/cabinet/")({
  component: CabinetHomePage,
});

function CabinetHomePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
  const clinics = useQuery({
    queryKey: ["cabinet-clinics"],
    queryFn: fetchCabinetClinics,
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/cabinet/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  if (auth.isLoading || !auth.data) {
    return <p className="text-muted">Проверка сессии…</p>;
  }

  const cities = CITY_LABELS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Личный кабинет</p>
          <h1 className="mt-1 text-3xl font-extrabold">Мои клиники</h1>
          <p className="mt-1 text-sm text-muted">Управляйте профилями и заявками пациентов</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/cabinet/clinics/new" className="btn btn-primary text-sm">
            + Добавить клинику
          </Link>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={async () => {
              await cabinetLogout();
              void navigate({ to: "/cabinet/login" });
            }}
          >
            Выйти
          </button>
        </div>
      </div>

      {clinics.isLoading ? <p className="text-muted">Загрузка…</p> : null}
      {clinics.isError ? <p className="text-danger">Не удалось загрузить клиники</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {clinics.data?.map((clinic) => {
          const canEdit = clinic.status === "draft" || clinic.status === "needs_changes";
          const canDelete = canEdit;
          return (
            <article key={clinic.id} className="soft-card overflow-hidden rounded-[1.5rem] bg-white">
              <div className="flex gap-4 p-5">
                {clinic.logoUrl ? (
                  <img
                    src={clinic.logoUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-2xl border border-line object-cover"
                  />
                ) : (
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-extrabold text-white">
                    {(clinic.nameRu || clinic.nameEn).slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-extrabold">{clinic.nameRu || clinic.nameEn}</h2>
                    <StatusBadge status={clinic.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {cities[clinic.city] || clinic.city}
                    {clinic.branchCount != null ? ` · филиалов: ${clinic.branchCount}` : ""}
                    {clinic.doctorCount != null ? ` · врачей: ${clinic.doctorCount}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Обновлено: {new Date(clinic.updatedAt).toLocaleString("ru-RU")}
                  </p>
                </div>
              </div>
              {clinic.moderatorNote ? (
                <p className="mx-5 mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                  Комментарий модератора: {clinic.moderatorNote}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
                <Link
                  to="/cabinet/clinics/$id"
                  params={{ id: clinic.id }}
                  className="btn btn-primary px-4 py-2 text-sm"
                >
                  {clinic.status === "moderation" ? "Просмотреть" : canEdit || clinic.status === "published" ? "Редактировать" : "Открыть"}
                </Link>
                <Link
                  to="/cabinet/clinics/$id/branches"
                  params={{ id: clinic.id }}
                  className="btn btn-ghost px-4 py-2 text-sm"
                >
                  Филиалы ({clinic.branchCount ?? 0})
                </Link>
                <Link
                  to="/cabinet/clinics/$id/leads"
                  params={{ id: clinic.id }}
                  className="btn btn-ghost px-4 py-2 text-sm"
                >
                  Заявки
                </Link>
                {clinic.status === "published" ? (
                  <Link
                    to="/clinics/$slug"
                    params={{ slug: clinic.slug }}
                    className="btn btn-ghost px-4 py-2 text-sm"
                  >
                    Публичная страница
                  </Link>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    className="btn btn-ghost px-4 py-2 text-sm text-danger"
                    onClick={async () => {
                      if (!window.confirm("Удалить клинику?")) return;
                      await deleteCabinetClinic(clinic.id);
                      await qc.invalidateQueries({ queryKey: ["cabinet-clinics"] });
                    }}
                  >
                    Удалить
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {clinics.data?.length === 0 ? (
        <p className="text-muted">Пока нет клиник. Создайте первую.</p>
      ) : null}
    </div>
  );
}
