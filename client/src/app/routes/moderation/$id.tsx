import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  adminMe,
  approveClinic,
  fetchModerationClinic,
  publishClinic,
  rejectClinic,
  unpublishClinic,
} from "@/shared/api/cabinet";
import { CITY_LABELS } from "@/shared/api/client";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { TelegramPanel } from "@/widgets/telegram/TelegramPanel";
import { ClinicPreview } from "@/widgets/clinic-form/ClinicPreview";
import { BackMark, PageHead, WsIcon, WsLoading, WsNote, WsToast } from "@/widgets/workspace/Workspace";
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

function CheckList({ title, items }: { title: string; items: { key: string; label: string; ok: boolean }[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="ws-label">{title}</p>
      <ul className="ws-checks">
        {items.map((item) => (
          <li key={item.key} className={item.ok ? undefined : "is-missing"}>
            <span>
              <WsIcon name={item.ok ? "check" : "close"} size={13} />
            </span>
            {item.label}
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
  const clearNotice = useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

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

  if (!auth.data || clinic.isLoading) return <WsLoading />;
  if (!clinic.data) return <WsNote tone="danger" title="Клиника не найдена" />;

  const c = clinic.data;
  const checklist = c.checklist;
  const canApprove = c.status === "moderation" && (checklist?.ready ?? true);
  const missing = checklist ? checklist.required.filter((item) => !item.ok).length : 0;

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["moderation-clinic", id] });
    await qc.invalidateQueries({ queryKey: ["moderation-queue"] });
    await clinic.refetch();
  }

  return (
    <div className="ws-stack">
      <WsToast message={message} error={error} onDone={clearNotice} />
      <PageHead
        back={
          <Link to="/moderation" className="ws-back">
            <BackMark />
            Очередь клиник
          </Link>
        }
        eyebrow="Проверка клиники"
        title={c.nameRu || c.nameEn}
        meta={
          <>
            <StatusBadge status={c.status} />
            <span>{CITY_LABELS[c.city] || c.city}</span>
            <span>Филиалов: {c.branchCount ?? c.branches?.length ?? 0}</span>
            <span>Врачей: {c.doctorCount ?? c.doctors?.length ?? 0}</span>
          </>
        }
        actions={
          c.status === "published" ? (
            <Link to="/clinics/$slug" params={{ slug: c.slug }} target="_blank" className="ws-pill">
              Открыть в каталоге
              <WsIcon name="external" size={14} />
            </Link>
          ) : undefined
        }
      />

      {c.moderatorNote ? (
        <WsNote tone="danger" title="Текущий комментарий модератора">
          <p>{c.moderatorNote}</p>
        </WsNote>
      ) : null}

      <div className="ws-split">
        <div className="grid min-w-0 gap-6">
          <ClinicPreview clinic={c} />

          <section className="ws-card is-pad space-y-4">
            <h2 className="ws-card-title">Филиалы</h2>
            {(c.branches || []).length === 0 ? (
              <WsNote tone="danger">Филиалы отсутствуют — без филиала клинику нельзя одобрить.</WsNote>
            ) : (
              <ul className="ws-items">
                {(c.branches || []).map((b) => (
                  <li key={b.id} className="ws-item">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-ink">
                      <WsIcon name="pin" size={18} />
                    </span>
                    <div className="ws-item-body">
                      <strong>{b.nameRu || b.nameEn}</strong>
                      <p>
                        {CITY_LABELS[b.city] || b.city}
                        {b.phone ? ` · ${b.phone}` : ""}
                      </p>
                      {b.addressRu || b.addressEn ? <p>{b.addressRu || b.addressEn}</p> : null}
                      <p>
                        Направлений: {b.specialtyCount ?? b.specialties?.length ?? 0} · врачей: {b.doctorCount ?? 0} · фото: {b.photoCount ?? 0}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside>
          <section className="ws-card is-pad space-y-5">
            <div>
              <p className="ws-label">Решение</p>
              <h2 className="ws-card-title mt-2">
                {c.status === "moderation"
                  ? checklist?.ready ?? true
                    ? "Готово к одобрению"
                    : `Не хватает обязательных пунктов: ${missing}`
                  : c.status === "approved"
                    ? "Одобрена — можно публиковать"
                    : c.status === "published"
                      ? "Опубликована в каталоге"
                      : c.status === "needs_changes"
                        ? "Ждём правок от клиники"
                        : "Черновик клиники"}
              </h2>
            </div>

            {c.status === "moderation" ? (
              <>
                <button
                  type="button"
                  className="pill-btn is-ink w-full"
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
                  <span className="pill-btn-icon">
                    <WsIcon name="check" size={18} />
                  </span>
                </button>
                {!canApprove ? <p className="text-sm font-semibold text-danger">Сначала клиника должна заполнить обязательные пункты чеклиста.</p> : null}
                <div className="ws-group">
                  <label className="ws-field">
                    <span className="ws-field-label">Вернуть на доработку</span>
                    <textarea
                      className="field min-h-24"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Например: добавьте фото фасада и актуальный телефон филиала"
                    />
                    <span className="ws-field-hint">Клиника увидит этот комментарий в кабинете.</span>
                  </label>
                  <button
                    type="button"
                    className="ws-pill w-full"
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
              </>
            ) : null}

            {c.status === "approved" ? (
              <button
                type="button"
                className="pill-btn is-ink w-full"
                onClick={async () => {
                  await publishClinic(id);
                  await refresh();
                  setMessage("Опубликовано в каталоге");
                }}
              >
                Опубликовать
                <span className="pill-btn-icon">
                  <ArrowIcon />
                </span>
              </button>
            ) : null}

            {c.status === "published" ? (
              <button
                type="button"
                className="ws-pill is-danger w-full"
                onClick={async () => {
                  if (!window.confirm("Снять клинику с публикации? Она пропадёт из каталога.")) return;
                  await unpublishClinic(id);
                  await refresh();
                  setMessage("Снято с публикации");
                }}
              >
                Снять с публикации
              </button>
            ) : null}
          </section>

          {checklist ? (
            <section className="ws-card is-pad space-y-5">
              <h2 className="ws-card-title">Чеклист</h2>
              <CheckList title="Обязательно" items={checklist.required} />
              <CheckList title="Рекомендуется" items={checklist.recommended} />
            </section>
          ) : null}

          <section className="ws-card is-pad">
            <h2 className="ws-card-title">История решений</h2>
            {(c.moderationLogs || []).length === 0 ? (
              <p className="ws-card-text">Пока пусто</p>
            ) : (
              <ul className="ws-timeline">
                {(c.moderationLogs || []).map((log) => (
                  <li key={log.id}>
                    <strong>{ACTION_LABELS[log.action] || log.action}</strong>
                    <small>{new Date(log.createdAt).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })}</small>
                    {log.note ? <p>{log.note}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <TelegramPanel clinicId={id} />
        </aside>
      </div>
    </div>
  );
}
