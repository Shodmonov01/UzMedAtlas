import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { telegramStatus, telegramInvite, telegramDisconnect, ownerTelegramStatus, type Invite } from "@/shared/api/telegram";

export function InvitationLink({ invite }: { invite: Invite }) {
  const [copied, setCopied] = useState(false);
  return <div className="rounded-2xl border border-line bg-white p-4 space-y-3">
    <p className="text-sm">Одноразовое приглашение действует до {new Date(invite.expiresAt).toLocaleString("ru-RU")}. Откройте ссылку и нажмите «Запустить» в Telegram.</p>
    <a href={invite.url} target="_blank" rel="noreferrer" className="btn btn-primary text-sm">Открыть бота</a>
    <button type="button" className="btn btn-ghost ml-2 text-sm" onClick={async () => {
      try { await navigator.clipboard.writeText(invite.url); setCopied(true); } catch { setCopied(false); }
    }}>{copied ? "Ссылка скопирована" : "Скопировать приглашение"}</button>
    <input aria-label="Ссылка приглашения" className="field text-xs" readOnly value={invite.url} onFocus={e => e.target.select()} />
  </div>;
}

export function TelegramPanel({ clinicId }: { clinicId?: string }) {
  const base = clinicId ? `/api/admin/clinics/${clinicId}/telegram` : "/api/admin/telegram";
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["telegram", base], queryFn: () => telegramStatus(base), refetchInterval: 10000 });
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function act(action: "invite" | "disconnect") {
    setBusy(true); setError(null);
    try {
      if (action === "invite") setInvite(await telegramInvite(base));
      else { await telegramDisconnect(base); setInvite(null); }
      await qc.invalidateQueries({ queryKey: ["telegram", base] });
    } catch { setError("Не удалось выполнить действие. Обновите страницу и попробуйте снова."); }
    finally { setBusy(false); }
  }
  const connection = status.data?.connection;
  return <section className="soft-card rounded-[1.5rem] bg-white p-5 space-y-3">
    <h2 className="text-xl font-extrabold">{clinicId ? "Бот для владельца клиники" : "Мои уведомления в Telegram"}</h2>
    {status.isLoading ? <p className="text-muted">Проверяем подключение…</p> : status.isError ? <p className="text-danger">Не удалось проверить подключение. У клиники должен быть назначен владелец.</p> : <>
      <p className="text-sm text-muted">{clinicId
        ? "Создайте приглашение и передайте его владельцу. Он получит уведомления только по этой клинике."
        : "Получайте сообщения о новых заявках и клиниках на модерации. Подробности открываются в кабинете."}</p>
      <p className="text-sm font-bold">{connection?.active ? `Подключён: ${connection.displayName}${connection.username ? ` (@${connection.username})` : ""}` : "Уведомления не подключены"}</p>
      {status.data?.configured ? <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void act("invite")} className="btn btn-primary text-sm">{connection?.active ? "Новое приглашение" : clinicId ? "Пригласить владельца" : "Подключить бота"}</button>
        {connection?.active || invite ? <button type="button" disabled={busy} onClick={() => void act("disconnect")} className="btn btn-ghost text-sm">Отозвать подключение и приглашения</button> : null}
      </div> : <p className="text-danger text-sm">Бот пока не настроен. Обратитесь к администратору.</p>}
    </>}
    {error ? <p role="alert" className="text-danger text-sm">{error}</p> : null}
    {invite ? <InvitationLink invite={invite} /> : null}
  </section>;
}

export function OwnerTelegramPanel() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["owner-telegram"], queryFn: ownerTelegramStatus, refetchInterval: 15000 });
  const [error, setError] = useState<string | null>(null);
  return <section className="soft-card rounded-[1.5rem] bg-white p-5 space-y-3">
    <h2 className="text-xl font-extrabold">Уведомления в Telegram</h2>
    <p className="text-sm text-muted">Для подключения к боту получите персональное приглашение у модератора. Каждая клиника подключается отдельно.</p>
    {status.isLoading ? <p className="text-sm text-muted">Загрузка…</p> : null}
    {status.isError ? <p className="text-sm text-danger">Не удалось загрузить подключения</p> : null}
    {status.data?.map(item => <div key={item.clinicId} className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
      <p className="text-sm"><strong>{item.name}</strong>: {item.connection ? `подключён ${item.connection.displayName}` : "не подключена"}</p>
      {item.connection ? <button type="button" className="btn btn-ghost text-sm" onClick={async () => {
        try { await telegramDisconnect(`/api/cabinet/telegram/${item.clinicId}`); await qc.invalidateQueries({ queryKey: ["owner-telegram"] }); }
        catch { setError("Не удалось отключить уведомления"); }
      }}>Отключить</button> : null}
    </div>)}
    {error ? <p className="text-danger text-sm">{error}</p> : null}
  </section>;
}
