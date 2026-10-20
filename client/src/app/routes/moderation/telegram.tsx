import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminProfile, deliveryStatus, retryDelivery } from "@/shared/api/telegram";
import { TelegramPanel } from "@/widgets/telegram/TelegramPanel";

export const Route = createFileRoute("/moderation/telegram")({ component: TelegramPage });
function TelegramPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["admin-profile"], queryFn: adminProfile, retry: false });
  const delivery = useQuery({ queryKey: ["telegram-deliveries"], queryFn: deliveryStatus, enabled: profile.data?.role === "administrator", refetchInterval: 10000 });
  useEffect(() => { if (profile.isError) void navigate({ to: "/moderation/login" }); }, [profile.isError, navigate]);
  if (!profile.data) return <p className="text-muted">Проверка сессии…</p>;
  const labels: Record<string, string> = { pending: "Ожидают", sent: "Отправлены", failed: "Ошибка", cancelled: "Отменены" };
  return <div className="space-y-6">
    <Link to="/moderation" className="text-primary font-bold">← Модерация</Link>
    <h1 className="text-3xl font-extrabold">Уведомления</h1>
    <TelegramPanel />
    {profile.data.role === "administrator" ? <section className="soft-card rounded-[1.5rem] bg-white p-5 space-y-4">
      <h2 className="text-xl font-extrabold">Доставка сообщений</h2>
      <p className="text-sm text-muted">Сообщения повторно отправляются при временных ошибках. Отозванные подключения больше не получают уведомлений.</p>
      <div className="flex flex-wrap gap-3">{Object.entries(labels).map(([key,label]) => <span key={key} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">{label}: {delivery.data?.counts[key] || 0}</span>)}</div>
      {delivery.isError ? <p className="text-danger">Не удалось загрузить журнал</p> : null}
      {delivery.data?.items.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm">
        <span>{new Date(item.createdAt).toLocaleString("ru-RU")} · {labels[item.status] || item.status} · попыток: {item.attempts}</span>
        {item.status === "failed" ? <button type="button" className="btn btn-ghost text-sm" onClick={async () => {
          try { await retryDelivery(item.id); await qc.invalidateQueries({ queryKey: ["telegram-deliveries"] }); }
          catch { window.alert("Подключение неактивно. Сначала подключите получателя заново."); }
        }}>Повторить</button> : null}
      </div>)}
    </section> : null}
  </div>;
}
