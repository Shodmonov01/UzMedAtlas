import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  cabinetMe,
  deleteCabinetBranch,
  fetchCabinetBranches,
  fetchCabinetClinic,
} from "@/shared/api/cabinet";

export const Route = createFileRoute("/cabinet/clinics/$id/branches/")({
  component: BranchesListPage,
});

function BranchesListPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
  const clinic = useQuery({
    queryKey: ["cabinet-clinic", id],
    queryFn: () => fetchCabinetClinic(id),
    enabled: auth.data === true,
  });
  const branches = useQuery({
    queryKey: ["cabinet-branches", id],
    queryFn: () => fetchCabinetBranches(id),
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) void navigate({ to: "/cabinet/login" });
  }, [auth.data, auth.isError, navigate]);

  if (!auth.data || clinic.isLoading) return <p className="text-muted">Загрузка…</p>;
  if (!clinic.data) return <p className="text-danger">Клиника не найдена</p>;

  const locked = clinic.data.status === "moderation";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/cabinet/clinics/$id" params={{ id }} className="text-sm font-bold text-primary">
            ← {clinic.data.nameRu || clinic.data.nameEn}
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">Филиалы</h1>
          <p className="mt-1 text-sm text-muted">
            Для модерации нужен хотя бы один филиал с адресом и телефоном.
          </p>
        </div>
        {!locked ? (
          <Link
            to="/cabinet/clinics/$id/branches/new"
            params={{ id }}
            className="btn btn-primary text-sm"
          >
            + Добавить филиал
          </Link>
        ) : null}
      </div>

      {branches.isLoading ? <p className="text-muted">Загрузка…</p> : null}
      {branches.isError ? <p className="text-danger">Не удалось загрузить список филиалов</p> : null}

      <div className="grid gap-4">
        {(branches.data || []).map((branch) => (
          <article
            key={branch!.id}
            className="soft-card flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] bg-white p-5"
          >
            <div>
              <h2 className="text-xl font-extrabold">{branch!.nameRu || branch!.nameEn}</h2>
              <p className="mt-1 text-sm text-muted">
                {branch!.city} · {branch!.phone}
              </p>
              <p className="mt-1 text-xs text-muted">
                Врачей: {branch!.doctorCount ?? 0} · услуг: {branch!.serviceCount ?? 0}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/cabinet/clinics/$id/branches/$branchId"
                params={{ id, branchId: branch!.id }}
                search={{ section: undefined }}
                className="btn btn-primary px-4 py-2 text-sm"
              >
                {locked ? "Открыть" : "Редактировать"}
              </Link>
              {!locked ? (
                <button
                  type="button"
                  className="btn btn-ghost px-4 py-2 text-sm"
                  onClick={async () => {
                    if (!window.confirm("Удалить филиал?")) return;
                    await deleteCabinetBranch(id, branch!.id);
                    await branches.refetch();
                  }}
                >
                  Удалить
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {!branches.isLoading && (branches.data || []).length === 0 ? (
        <p className="rounded-[1.25rem] bg-warning-soft p-4 text-sm">
          Филиалов пока нет. Добавьте первый — без него клинику не отправить на модерацию.
        </p>
      ) : null}
    </div>
  );
}
