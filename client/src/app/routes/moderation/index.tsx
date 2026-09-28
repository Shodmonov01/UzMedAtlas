import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminLogout, adminMe, fetchModerationQueue } from "@/shared/api/cabinet";
import { StatusBadge } from "@/shared/ui/StatusBadge";

export const Route = createFileRoute("/moderation/")({
  component: ModerationQueuePage,
});

function ModerationQueuePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("moderation");
  const auth = useQuery({ queryKey: ["admin-me"], queryFn: adminMe, retry: false });
  const queue = useQuery({
    queryKey: ["moderation-queue", status],
    queryFn: () => fetchModerationQueue(status),
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/moderation/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  if (auth.isLoading || !auth.data) {
    return <p className="text-muted">Проверка сессии…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Модератор</p>
          <h1 className="mt-1 text-3xl font-extrabold">Очередь клиник</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/moderation/leads" search={{ status: undefined, source: undefined, q: undefined }} className="btn btn-ghost text-sm">
            Заявки
          </Link>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={async () => {
              await adminLogout();
              void navigate({ to: "/moderation/login" });
            }}
          >
            Выйти
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["moderation", "На модерации"],
          ["needs_changes", "Нужны изменения"],
          ["approved", "Одобрены"],
          ["published", "Опубликованы"],
          ["all", "Все"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm font-bold ${
              status === value ? "bg-primary text-white" : "bg-white text-muted ring-1 ring-line"
            }`}
            onClick={() => setStatus(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {queue.isLoading ? <p className="text-muted">Загрузка…</p> : null}

      <div className="grid gap-4">
        {queue.data?.map((clinic) => (
          <article
            key={clinic.id}
            className="soft-card flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] bg-white p-5"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold">{clinic.nameRu || clinic.nameEn}</h2>
                <StatusBadge status={clinic.status} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {clinic.city} · обновлено {new Date(clinic.updatedAt).toLocaleString("ru-RU")}
                {clinic.branchCount != null ? ` · филиалов: ${clinic.branchCount}` : ""}
              </p>
            </div>
            <Link
              to="/moderation/$id"
              params={{ id: clinic.id }}
              className="btn btn-primary px-4 py-2 text-sm"
            >
              Проверить
            </Link>
          </article>
        ))}
      </div>

      {queue.data?.length === 0 ? <p className="text-muted">Пусто</p> : null}
    </div>
  );
}
