import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  cabinetLogout,
  cabinetMe,
  fetchCabinetClinics,
} from "@/shared/api/cabinet";
import { StatusBadge } from "@/shared/ui/StatusBadge";

export const Route = createFileRoute("/cabinet/")({
  component: CabinetHomePage,
});

function CabinetHomePage() {
  const navigate = useNavigate();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Личный кабинет</p>
          <h1 className="mt-1 text-3xl font-extrabold">Мои клиники</h1>
          {auth.data === true ? (
            <p className="mt-1 text-sm text-muted">Управляйте профилями и заявками пациентов</p>
          ) : null}
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
        {clinics.data?.map((clinic) => (
          <article key={clinic.id} className="soft-card rounded-[1.5rem] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">{clinic.nameRu || clinic.nameEn}</h2>
                <p className="mt-1 text-sm text-muted">{clinic.city}</p>
              </div>
              <StatusBadge status={clinic.status} />
            </div>
            {clinic.moderatorNote ? (
              <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                Комментарий модератора: {clinic.moderatorNote}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-muted">
              Обновлено: {new Date(clinic.updatedAt).toLocaleString("ru-RU")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/cabinet/clinics/$id"
                params={{ id: clinic.id }}
                className="btn btn-primary px-4 py-2 text-sm"
              >
                {clinic.status === "moderation" ? "Просмотреть" : "Открыть"}
              </Link>
              <Link
                to="/cabinet/clinics/$id/leads"
                params={{ id: clinic.id }}
                className="btn btn-ghost px-4 py-2 text-sm"
              >
                Заявки
              </Link>
              <Link
                to="/cabinet/clinics/$id/branches"
                params={{ id: clinic.id }}
                className="btn btn-ghost px-4 py-2 text-sm"
              >
                Филиалы ({clinic.branchCount ?? 0})
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
            </div>
          </article>
        ))}
      </div>

      {clinics.data?.length === 0 ? (
        <p className="text-muted">Пока нет клиник. Создайте первую.</p>
      ) : null}
    </div>
  );
}
