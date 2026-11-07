import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminMe, fetchModerationQueue } from "@/shared/api/cabinet";
import { CITY_LABELS } from "@/shared/api/client";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { PageHead, WsLoading, WsNote } from "@/widgets/workspace/Workspace";

export const Route = createFileRoute("/moderation/")({
  component: ModerationQueuePage,
});

const FILTERS = [
  ["moderation", "На модерации"],
  ["needs_changes", "Нужны изменения"],
  ["approved", "Одобрены"],
  ["published", "Опубликованы"],
  ["all", "Все"],
] as const;

function ModerationQueuePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("moderation");
  const [q, setQ] = useState("");
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

  if (auth.isLoading || !auth.data) return <WsLoading label="Проверка сессии…" />;

  const needle = q.trim().toLowerCase();
  const list = (queue.data || []).filter(
    (clinic) => !needle || `${clinic.nameRu} ${clinic.nameEn} ${clinic.city}`.toLowerCase().includes(needle),
  );

  return (
    <div className="ws-stack">
      <PageHead
        eyebrow="Модерация"
        title="Очередь клиник"
        lead="Проверьте профиль по чеклисту, затем одобрите и опубликуйте клинику или верните её на доработку с комментарием."
      />

      <div className="ws-toolbar">
        <div className="ws-seg" role="tablist" aria-label="Статус">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={status === value}
              className={status === value ? "is-active" : undefined}
              onClick={() => setStatus(value)}
            >
              {label}
              {status === value && queue.data ? <b>{queue.data.length}</b> : null}
            </button>
          ))}
        </div>
        <label className="ws-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти клинику или город" aria-label="Поиск клиники" />
        </label>
      </div>

      {queue.isLoading ? <WsLoading label="Загружаем очередь…" inline /> : null}
      {queue.isError ? <WsNote tone="danger" title="Не удалось загрузить очередь" /> : null}

      {list.length ? (
        <div className="ws-rows">
          {list.map((clinic) => {
            const name = clinic.nameRu || clinic.nameEn;
            return (
              <article key={clinic.id} className="ws-row">
                <ClinicLogo src={clinic.logoUrl} name={name} className="h-12 w-12 rounded-2xl" />
                <div className="ws-row-main">
                  <h2 className="ws-row-title">
                    <Link to="/moderation/$id" params={{ id: clinic.id }} className="ws-row-link">
                      {name}
                    </Link>
                    <StatusBadge status={clinic.status} />
                  </h2>
                  <p className="ws-row-meta">
                    <span>{CITY_LABELS[clinic.city] || clinic.city}</span>
                    {clinic.branchCount != null ? <span>Филиалов: {clinic.branchCount}</span> : null}
                    <span>Обновлено {new Date(clinic.updatedAt).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </p>
                </div>
                <div className="ws-row-end">
                  <span className="hidden text-sm font-semibold text-ink sm:inline">{clinic.status === "moderation" ? "Проверить" : "Открыть"}</span>
                  <span className="ws-row-arrow" aria-hidden="true">
                    <ArrowIcon size={15} />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {queue.data && list.length === 0 ? (
        <div className="ws-empty">
          <span className="ws-empty-mark">
            <img src="/brand/logo.svg" alt="" width={40} height={40} />
          </span>
          <h2>{needle ? "Ничего не нашлось" : "Очередь пуста"}</h2>
          <p>{needle ? "Попробуйте другое название или город." : "Новых клиник на проверку нет. Когда владелец отправит профиль, он появится здесь."}</p>
        </div>
      ) : null}
    </div>
  );
}
