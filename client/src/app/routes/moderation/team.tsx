import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminProfile, listStaff, createStaff, toggleStaff, inviteStaff, resetStaffPassword, type Invite } from "@/shared/api/telegram";
import { InvitationLink } from "@/widgets/telegram/TelegramPanel";
import { Field } from "@/widgets/clinic-form/FormField";
import { BackMark, PageHead, WsIcon, WsLoading, WsNote } from "@/widgets/workspace/Workspace";

export const Route = createFileRoute("/moderation/team")({ component: TeamPage });

function TeamPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["admin-profile"], queryFn: adminProfile, retry: false });
  const staff = useQuery({ queryKey: ["staff"], queryFn: listStaff, enabled: profile.data?.role === "administrator", refetchInterval: 15000 });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; password?: string; invite?: Invite | null } | null>(null);

  useEffect(() => {
    if (profile.isError) void navigate({ to: "/moderation/login" });
  }, [profile.isError, navigate]);

  if (!profile.data) return <WsLoading label="Проверка сессии…" />;
  if (profile.data.role !== "administrator") {
    return (
      <div className="ws-stack">
        <WsNote tone="warning" title="Только для администратора">
          <p>Управлять сотрудниками может только администратор.</p>
        </WsNote>
        <Link to="/moderation" className="ws-back">
          <BackMark />
          Вернуться к очереди
        </Link>
      </div>
    );
  }

  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["staff"] });
    } catch {
      setError("Не удалось выполнить действие. Проверьте данные: email должен быть уникальным.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ws-stack">
      <PageHead
        eyebrow="Администратор"
        title="Команда модераторов"
        lead="Создайте аккаунт сотруднику и передайте ему данные для входа и персональную ссылку в Telegram-бот. Письма не отправляются."
      />

      <div className="ws-split">
        <div className="grid min-w-0 gap-4">
          {staff.isLoading ? <WsLoading label="Загружаем команду…" inline /> : null}
          {staff.isError ? <WsNote tone="danger" title="Не удалось загрузить команду" /> : null}
          {staff.data?.length === 0 ? (
            <div className="ws-empty">
              <span className="ws-empty-mark">
                <img src="/brand/logo.svg" alt="" width={40} height={40} />
              </span>
              <h2>Пока только вы</h2>
              <p>Добавьте первого модератора справа.</p>
            </div>
          ) : null}
          {staff.data?.map((item) => {
            const connected = item.connections.some((c) => c.active);
            return (
              <article key={item.id} className="ws-card is-pad space-y-4">
                <div className="ws-card-head">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-paper text-ink">
                      <WsIcon name="user" size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="ws-card-title">{item.name}</h2>
                      <p className="ws-row-meta">
                        <span>{item.email}</span>
                        <span>Telegram: {connected ? "подключён" : "не подключён"}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`ws-status ${item.active ? "is-published" : "is-draft"}`}>{item.active ? "Активен" : "Отключён"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.active ? (
                    <button disabled={busy} type="button" className="ws-pill is-ink" onClick={() => void action(async () => setResult({ email: item.email, invite: await inviteStaff(item.id) }))}>
                      Пригласить в бот
                    </button>
                  ) : null}
                  <button disabled={busy} type="button" className="ws-pill" onClick={() => void action(async () => setResult({ email: item.email, password: await resetStaffPassword(item.id) }))}>
                    Новый пароль
                  </button>
                  <button
                    disabled={busy}
                    type="button"
                    className={`ws-pill${item.active ? " is-danger" : ""}`}
                    onClick={() =>
                      void action(async () => {
                        await toggleStaff(item.id, !item.active);
                        setResult(null);
                      })
                    }
                  >
                    {item.active ? "Отключить аккаунт и уведомления" : "Включить аккаунт"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <aside>
          <form
            className="ws-card is-pad space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void action(async () => {
                const created = await createStaff(name, email);
                setResult(created);
                setName("");
                setEmail("");
              });
            }}
          >
            <h2 className="ws-card-title">Добавить модератора</h2>
            <Field label="Имя">
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required />
            </Field>
            <Field label="Email для входа">
              <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} required />
            </Field>
            <button disabled={busy} className="btn btn-primary w-full" type="submit">
              Создать аккаунт и приглашение
            </button>
          </form>

          {error ? (
            <WsNote tone="danger">
              <p>{error}</p>
            </WsNote>
          ) : null}

          {result ? (
            <section className="ws-card is-pad space-y-4">
              <h2 className="ws-card-title">Доступ для {result.email}</h2>
              {result.password ? (
                <>
                  <WsNote tone="warning">
                    <p>Сохраните пароль и передайте сотруднику. Он показывается только сейчас.</p>
                  </WsNote>
                  <input aria-label="Пароль сотрудника" readOnly className="field font-mono" value={result.password} onFocus={(e) => e.target.select()} />
                </>
              ) : null}
              {result.invite ? <InvitationLink invite={result.invite} /> : null}
              <button type="button" className="ws-pill" onClick={() => setResult(null)}>
                Скрыть данные
              </button>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
