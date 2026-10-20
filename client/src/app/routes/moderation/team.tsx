import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminProfile, listStaff, createStaff, toggleStaff, inviteStaff, resetStaffPassword, type Invite } from "@/shared/api/telegram";
import { InvitationLink } from "@/widgets/telegram/TelegramPanel";

export const Route = createFileRoute("/moderation/team")({ component: TeamPage });
function TeamPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["admin-profile"], queryFn: adminProfile, retry: false });
  const staff = useQuery({ queryKey: ["staff"], queryFn: listStaff, enabled: profile.data?.role === "administrator", refetchInterval: 15000 });
  const [name,setName] = useState(""); const [email,setEmail] = useState("");
  const [busy,setBusy] = useState(false); const [error,setError] = useState<string | null>(null);
  const [result,setResult] = useState<{ email: string; password?: string; invite?: Invite | null } | null>(null);
  useEffect(() => { if (profile.isError) void navigate({ to: "/moderation/login" }); }, [profile.isError, navigate]);
  if (!profile.data) return <p className="text-muted">Проверка сессии…</p>;
  if (profile.data.role !== "administrator") return <div><p className="text-danger">Управлять сотрудниками может только администратор.</p><Link to="/moderation">Вернуться</Link></div>;
  async function action(fn: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await fn(); await qc.invalidateQueries({ queryKey: ["staff"] }); }
    catch { setError("Не удалось выполнить действие. Проверьте данные: email должен быть уникальным."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <Link to="/moderation" className="font-bold text-primary">← Модерация</Link>
    <h1 className="text-3xl font-extrabold">Команда модераторов</h1>
    <form className="soft-card rounded-[1.5rem] bg-white p-5 space-y-4" onSubmit={e => { e.preventDefault(); void action(async () => {
      const created = await createStaff(name,email); setResult(created); setName(""); setEmail("");
    }); }}>
      <h2 className="text-xl font-extrabold">Добавить модератора</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">Имя<input className="field mt-1" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={100} required /></label>
        <label className="text-sm font-bold">Email для входа<input type="email" className="field mt-1" value={email} onChange={e => setEmail(e.target.value)} maxLength={120} required /></label>
      </div>
      <p className="text-sm text-muted">Передайте сотруднику данные для входа и персональную ссылку в бот. Письма не отправляются.</p>
      <button disabled={busy} className="btn btn-primary" type="submit">Создать аккаунт и приглашение</button>
    </form>
    {error ? <p className="text-danger" role="alert">{error}</p> : null}
    {result ? <section className="rounded-2xl border border-line bg-white p-5 space-y-3">
      <p className="font-bold">Доступ для {result.email}</p>
      {result.password ? <><p className="text-sm">Сохраните пароль и передайте сотруднику. Он показывается только сейчас.</p><input aria-label="Пароль сотрудника" readOnly className="field font-mono" value={result.password} onFocus={e => e.target.select()} /></> : null}
      {result.invite ? <InvitationLink invite={result.invite} /> : null}
      <button type="button" className="btn btn-ghost text-sm" onClick={() => setResult(null)}>Скрыть данные</button>
    </section> : null}
    {staff.isError ? <p className="text-danger">Не удалось загрузить команду</p> : null}
    <div className="grid gap-4">{staff.data?.map(item => <article key={item.id} className="soft-card rounded-[1.5rem] bg-white p-5 space-y-3">
      <h2 className="font-extrabold">{item.name} · {item.active ? "Активен" : "Отключён"}</h2>
      <p className="text-sm text-muted">{item.email} · Telegram: {item.connections.some(c => c.active) ? "подключён" : "не подключён"}</p>
      <div className="flex flex-wrap gap-2">
        {item.active ? <button disabled={busy} type="button" className="btn btn-primary text-sm" onClick={() => void action(async () => setResult({ email: item.email, invite: await inviteStaff(item.id) }))}>Пригласить в бот</button> : null}
        <button disabled={busy} type="button" className="btn btn-ghost text-sm" onClick={() => void action(async () => setResult({ email: item.email, password: await resetStaffPassword(item.id) }))}>Новый пароль</button>
        <button disabled={busy} type="button" className="btn btn-ghost text-sm" onClick={() => void action(async () => { await toggleStaff(item.id,!item.active); setResult(null); })}>{item.active ? "Отключить аккаунт и уведомления" : "Включить аккаунт"}</button>
      </div>
    </article>)}</div>
  </div>;
}
