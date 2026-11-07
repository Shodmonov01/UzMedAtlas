import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { telegramStatus, telegramInvite, telegramDisconnect, ownerTelegramStatus, type Invite } from "@/shared/api/telegram";
import { WsIcon } from "@/widgets/workspace/Workspace";

/** The Telegram mark in a small ink disc, at the head of the panels below. */
function TelegramMark() {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-paper text-ink">
      <WsIcon name="send" size={20} />
    </span>
  );
}

export function InvitationLink({ invite }: { invite: Invite }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="ws-group">
      <p className="text-sm leading-relaxed text-ink">
        Одноразовое приглашение действует до <strong>{new Date(invite.expiresAt).toLocaleString("ru-RU")}</strong>. Откройте ссылку и нажмите «Запустить» в Telegram.
      </p>
      <input aria-label="Ссылка приглашения" className="field" readOnly value={invite.url} onFocus={(e) => e.target.select()} />
      <div className="flex flex-wrap gap-2">
        <a href={invite.url} target="_blank" rel="noreferrer" className="ws-pill is-ink">
          Открыть бота
          <WsIcon name="external" size={14} />
        </a>
        <button
          type="button"
          className="ws-pill"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(invite.url);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Ссылка скопирована" : "Скопировать приглашение"}
        </button>
      </div>
    </div>
  );
}

export function TelegramPanel({ clinicId }: { clinicId?: string }) {
  const base = clinicId ? `/api/admin/clinics/${clinicId}/telegram` : "/api/admin/telegram";
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["telegram", base], queryFn: () => telegramStatus(base), refetchInterval: 10000 });
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function act(action: "invite" | "disconnect") {
    setBusy(true);
    setError(null);
    try {
      if (action === "invite") setInvite(await telegramInvite(base));
      else {
        await telegramDisconnect(base);
        setInvite(null);
      }
      await qc.invalidateQueries({ queryKey: ["telegram", base] });
    } catch {
      setError("Не удалось выполнить действие. Обновите страницу и попробуйте снова.");
    } finally {
      setBusy(false);
    }
  }
  const connection = status.data?.connection;
  return (
    <section className="ws-card is-pad space-y-4">
      <div className="flex items-start gap-4">
        <TelegramMark />
        <div className="min-w-0 flex-1">
          <h2 className="ws-card-title">{clinicId ? "Бот для владельца клиники" : "Мои уведомления в Telegram"}</h2>
          <p className="ws-card-text">
            {clinicId
              ? "Создайте приглашение и передайте его владельцу. Он получит уведомления только по этой клинике."
              : "Получайте сообщения о новых заявках и клиниках на модерации. Подробности открываются в кабинете."}
          </p>
        </div>
        {status.data ? (
          <span className={`ws-status ${connection?.active ? "is-published" : "is-draft"}`}>{connection?.active ? "Подключён" : "Не подключён"}</span>
        ) : null}
      </div>
      {status.isLoading ? <p className="text-sm text-muted">Проверяем подключение…</p> : null}
      {status.isError ? <p className="text-sm text-danger">Не удалось проверить подключение. У клиники должен быть назначен владелец.</p> : null}
      {status.data ? (
        <>
          {connection?.active ? (
            <p className="text-sm font-semibold text-ink">
              {connection.displayName}
              {connection.username ? ` (@${connection.username})` : ""}
            </p>
          ) : null}
          {status.data.configured ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void act("invite")} className="ws-pill is-ink">
                {connection?.active ? "Новое приглашение" : clinicId ? "Пригласить владельца" : "Подключить бота"}
              </button>
              {connection?.active || invite ? (
                <button type="button" disabled={busy} onClick={() => void act("disconnect")} className="ws-pill is-danger">
                  Отозвать подключение и приглашения
                </button>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-danger">Бот пока не настроен. Обратитесь к администратору.</p>
          )}
        </>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {invite ? <InvitationLink invite={invite} /> : null}
    </section>
  );
}

export function OwnerTelegramPanel() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["owner-telegram"], queryFn: ownerTelegramStatus, refetchInterval: 15000 });
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="ws-card is-pad space-y-4">
      <div className="flex items-start gap-4">
        <TelegramMark />
        <div className="min-w-0">
          <h2 className="ws-card-title">Уведомления в Telegram</h2>
          <p className="ws-card-text">
            Чтобы получать новые заявки в Telegram, попросите у модератора персональное приглашение. Каждая клиника подключается отдельно.
          </p>
        </div>
      </div>
      {status.isLoading ? <p className="text-sm text-muted">Загрузка…</p> : null}
      {status.isError ? <p className="text-sm text-danger">Не удалось загрузить подключения</p> : null}
      {status.data?.length ? (
        <ul className="ws-items">
          {status.data.map((item) => (
            <li key={item.clinicId} className="ws-item items-center">
              <div className="ws-item-body">
                <strong>{item.name}</strong>
                <p>{item.connection ? `Подключён: ${item.connection.displayName}` : "Telegram не подключён"}</p>
              </div>
              {item.connection ? (
                <button
                  type="button"
                  className="ws-pill is-danger"
                  onClick={async () => {
                    try {
                      await telegramDisconnect(`/api/cabinet/telegram/${item.clinicId}`);
                      await qc.invalidateQueries({ queryKey: ["owner-telegram"] });
                    } catch {
                      setError("Не удалось отключить уведомления");
                    }
                  }}
                >
                  Отключить
                </button>
              ) : (
                <span className="ws-status is-draft">Не подключён</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </section>
  );
}
