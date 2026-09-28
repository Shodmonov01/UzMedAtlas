import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  adminMe,
  approveClinic,
  fetchModerationClinic,
  publishClinic,
  rejectClinic,
  unpublishClinic,
} from "@/shared/api/cabinet";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { ClinicPreview } from "@/widgets/clinic-form/ClinicPreview";
import axios from "axios";

export const Route = createFileRoute("/moderation/$id")({
  component: ModerationDetailPage,
});

const ACTION_LABELS: Record<string, string> = {
  submit: "Отправлено на модерацию",
  approve: "Одобрено",
  reject: "Возврат на доработку",
  publish: "Опубликовано",
  unpublish: "Снято с публикации",
};

function CheckList({
  title,
  items,
}: {
  title: string;
  items: { key: string; label: string; ok: boolean }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-extrabold">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-sm">
            <span
              className={`grid h-5 w-5 place-items-center rounded-full text-xs font-extrabold text-white ${
                item.ok ? "bg-success" : "bg-danger"
              }`}
            >
              {item.ok ? "✓" : "!"}
            </span>
            <span className={item.ok ? "text-ink" : "font-semibold text-danger"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModerationDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const auth = useQuery({ queryKey: ["admin-me"], queryFn: adminMe, retry: false });
  const clinic = useQuery({
    queryKey: ["moderation-clinic", id],
    queryFn: () => fetchModerationClinic(id),
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/moderation/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  if (!auth.data || clinic.isLoading) return <p className="text-muted">Загрузка…</p>;
  if (!clinic.data) return <p className="text-danger">Не найдено</p>;

  const c = clinic.data;
  const checklist = c.checklist;
  const canApprove = c.status === "moderation" && (checklist?.ready ?? true);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["moderation-clinic", id] });
    await qc.invalidateQueries({ queryKey: ["moderation-queue"] });
    await clinic.refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/moderation" className="text-sm font-bold text-primary">
            ← Очередь
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold">{c.nameRu || c.nameEn}</h1>
            <StatusBadge status={c.status} />
          </div>
          <p className="mt-2 text-sm text-muted">
            Филиалов: {c.branchCount ?? c.branches?.length ?? 0} · Врачей:{" "}
            {c.doctorCount ?? c.doctors?.length ?? 0}
          </p>
        </div>
      </div>

      {message ? <p className="text-sm font-bold text-primary">{message}</p> : null}
      {error ? <p className="text-sm font-bold text-danger">{error}</p> : null}

      {c.moderatorNote ? (
        <div className="rounded-[1.25rem] bg-danger-soft p-4 text-sm text-danger">
          <p className="font-bold">Текущий комментарий модератора</p>
          <p className="mt-1">{c.moderatorNote}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          {checklist ? (
            <div className="soft-card space-y-5 rounded-[1.5rem] bg-white p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Чеклист</p>
                <p className="mt-1 text-lg font-extrabold">
                  {checklist.ready ? "Готово к одобрению" : "Есть замечания"}
                </p>
              </div>
              <CheckList title="Обязательно" items={checklist.required} />
              <CheckList title="Рекомендуется" items={checklist.recommended} />
            </div>
          ) : null}

          {c.status === "moderation" ? (
            <div className="soft-card space-y-4 rounded-[1.5rem] bg-white p-5">
              <button
                type="button"
                className="btn btn-primary w-full text-sm"
                disabled={!canApprove}
                onClick={async () => {
                  setError(null);
                  try {
                    await approveClinic(id);
                    await refresh();
                    setMessage("Клиника одобрена");
                  } catch (err) {
                    if (axios.isAxiosError(err) && err.response?.data?.error === "checklist_failed") {
                      setError("Нельзя одобрить: не заполнены обязательные поля");
                      await refresh();
                    } else {
                      setError("Не удалось одобрить");
                    }
                  }
                }}
              >
                Одобрить
              </button>
              {!canApprove ? (
                <p className="text-xs text-danger">Исправьте обязательные пункты чеклиста.</p>
              ) : null}
              <label className="block text-sm font-bold">
                Вернуть на доработку
                <textarea
                  className="field mt-1 min-h-24"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Например: добавьте фото фасада и актуальный телефон филиала"
                />
              </label>
              <button
                type="button"
                className="btn btn-ghost w-full text-sm"
                disabled={note.trim().length < 5}
                onClick={async () => {
                  await rejectClinic(id, note.trim());
                  await refresh();
                  setMessage("Возвращено на доработку");
                  setNote("");
                }}
              >
                Нужны изменения
              </button>
            </div>
          ) : null}

          {c.status === "approved" ? (
            <button
              type="button"
              className="btn btn-primary w-full text-sm"
              onClick={async () => {
                await publishClinic(id);
                await refresh();
                setMessage("Опубликовано в каталоге");
              }}
            >
              Опубликовать
            </button>
          ) : null}

          {c.status === "published" ? (
            <div className="flex flex-col gap-2">
              <Link to="/clinics/$slug" params={{ slug: c.slug }} className="btn btn-ghost text-sm">
                Открыть в каталоге
              </Link>
              <button
                type="button"
                className="btn btn-ghost text-sm"
                onClick={async () => {
                  await unpublishClinic(id);
                  await refresh();
                  setMessage("Снято с публикации");
                }}
              >
                Снять с публикации
              </button>
            </div>
          ) : null}

          <div className="soft-card rounded-[1.5rem] bg-white p-5">
            <h3 className="text-sm font-extrabold">История решений</h3>
            {(c.moderationLogs || []).length === 0 ? (
              <p className="mt-2 text-sm text-muted">Пока пусто</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {(c.moderationLogs || []).map((log) => (
                  <li key={log.id} className="border-b border-line pb-3 text-sm last:border-0 last:pb-0">
                    <p className="font-bold">{ACTION_LABELS[log.action] || log.action}</p>
                    <p className="text-xs text-muted">
                      {new Date(log.createdAt).toLocaleString("ru-RU")}
                    </p>
                    {log.note ? <p className="mt-1 text-muted">{log.note}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <div className="space-y-6">
          <ClinicPreview clinic={c} />

          <section className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6">
            <h2 className="text-xl font-extrabold">Филиалы</h2>
            {(c.branches || []).length === 0 ? (
              <p className="text-sm text-danger">Филиалы отсутствуют</p>
            ) : (
              <div className="space-y-4">
                {(c.branches || []).map((b) => (
                  <article key={b.id} className="rounded-2xl border border-line p-4">
                    <h3 className="font-extrabold">{b.nameRu || b.nameEn}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {b.city} · {b.phone}
                    </p>
                    <p className="mt-1 text-sm">{b.addressRu || b.addressEn}</p>
                    <p className="mt-2 text-xs text-muted">
                      Направлений: {b.specialtyCount ?? b.specialties?.length ?? 0}
                      {" · "}врачей: {b.doctorCount ?? 0}
                      {" · "}фото: {b.photoCount ?? 0}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
