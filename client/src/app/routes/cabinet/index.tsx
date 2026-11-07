import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { cabinetMe, deleteCabinetClinic, fetchCabinetClinics } from "@/shared/api/cabinet";
import { CITY_LABELS } from "@/shared/api/client";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { OwnerTelegramPanel } from "@/widgets/telegram/TelegramPanel";
import { PageHead, WsIcon, WsLoading, WsNote } from "@/widgets/workspace/Workspace";

export const Route = createFileRoute("/cabinet/")({
  component: CabinetHomePage,
});

function CabinetHomePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
  const clinics = useQuery({
    queryKey: ["cabinet-clinics"],
    queryFn: fetchCabinetClinics,
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/cabinet/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  if (auth.isLoading || !auth.data) return <WsLoading label="Проверка сессии…" />;

  const list = clinics.data || [];
  const count = (...statuses: string[]) => list.filter((c) => statuses.includes(c.status)).length;
  const stats = [
    { label: "Всего клиник", value: list.length, dot: "var(--ink)" },
    { label: "Опубликованы", value: count("published"), dot: "var(--accent)" },
    { label: "На проверке", value: count("moderation", "approved"), dot: "var(--warning)" },
    { label: "Черновики и правки", value: count("draft", "needs_changes"), dot: "var(--brand-sky)" },
  ];

  return (
    <div className="ws-stack">
      <PageHead
        eyebrow="Личный кабинет"
        title="Мои клиники"
        lead="Заполняйте профиль по шагам, добавляйте филиалы и отвечайте на заявки пациентов."
        actions={
          <Link to="/cabinet/clinics/new" className="pill-btn is-ink">
            Добавить клинику
            <span className="pill-btn-icon">
              <WsIcon name="plus" size={18} />
            </span>
          </Link>
        }
      />

      {list.length ? (
        <div className="ws-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="ws-stat">
              <span>
                <i style={{ background: stat.dot }} />
                {stat.label}
              </span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {clinics.isLoading ? <WsLoading label="Загружаем клиники…" inline /> : null}
      {clinics.isError ? <WsNote tone="danger" title="Не удалось загрузить клиники">Обновите страницу через минуту.</WsNote> : null}

      {list.length ? (
        <div className="ws-clinics">
          {list.map((clinic) => {
            const name = clinic.nameRu || clinic.nameEn;
            const canEdit = clinic.status === "draft" || clinic.status === "needs_changes";
            return (
              <article key={clinic.id} className="ws-clinic">
                <div className="ws-clinic-top">
                  <ClinicLogo src={clinic.logoUrl} name={name} className="h-16 w-16 rounded-[18px]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2>
                        <Link to="/cabinet/clinics/$id" params={{ id: clinic.id }}>
                          {name}
                        </Link>
                      </h2>
                      <StatusBadge status={clinic.status} />
                    </div>
                    <p className="ws-clinic-meta">
                      <span>
                        <WsIcon name="pin" size={14} />
                        {CITY_LABELS[clinic.city] || clinic.city}
                      </span>
                      <span>Филиалов: {clinic.branchCount ?? 0}</span>
                      <span>Врачей: {clinic.doctorCount ?? 0}</span>
                    </p>
                  </div>
                </div>
                {clinic.moderatorNote ? (
                  <div className="ws-clinic-note">
                    <WsNote tone="danger" title="Комментарий модератора">
                      <p>{clinic.moderatorNote}</p>
                    </WsNote>
                  </div>
                ) : null}
                <p className="ws-clinic-time">Обновлено {new Date(clinic.updatedAt).toLocaleString("ru-RU", { dateStyle: "long", timeStyle: "short" })}</p>
                <div className="ws-clinic-foot">
                  <Link to="/cabinet/clinics/$id" params={{ id: clinic.id }} className="ws-pill is-ink">
                    {clinic.status === "moderation" ? "Просмотреть" : "Редактировать"}
                    <ArrowIcon size={14} />
                  </Link>
                  <Link to="/cabinet/clinics/$id/branches" params={{ id: clinic.id }} className="ws-pill">
                    Филиалы <b>{clinic.branchCount ?? 0}</b>
                  </Link>
                  <Link to="/cabinet/clinics/$id/leads" params={{ id: clinic.id }} className="ws-pill">
                    Заявки
                  </Link>
                  {clinic.status === "published" ? (
                    <Link to="/clinics/$slug" params={{ slug: clinic.slug }} target="_blank" className="ws-pill">
                      На сайте
                      <WsIcon name="external" size={14} />
                    </Link>
                  ) : null}
                  {canEdit ? (
                    <button
                      type="button"
                      className="ws-pill is-icon is-danger"
                      aria-label={`Удалить клинику ${name}`}
                      title="Удалить клинику"
                      onClick={async () => {
                        if (!window.confirm(`Удалить клинику «${name}»? Это действие нельзя отменить.`)) return;
                        await deleteCabinetClinic(clinic.id);
                        await qc.invalidateQueries({ queryKey: ["cabinet-clinics"] });
                      }}
                    >
                      <WsIcon name="trash" size={17} />
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {clinics.data?.length === 0 ? (
        <div className="ws-empty">
          <span className="ws-empty-mark">
            <img src="/brand/logo.svg" alt="" width={40} height={40} />
          </span>
          <h2>Пока нет клиник</h2>
          <p>Создайте профиль по шагам: название, адрес, контакты и направления. Фото, филиалы и врачей можно добавить после создания.</p>
          <Link to="/cabinet/clinics/new" className="pill-btn is-ink">
            Добавить клинику
            <span className="pill-btn-icon">
              <WsIcon name="plus" size={18} />
            </span>
          </Link>
        </div>
      ) : null}

      <OwnerTelegramPanel />
    </div>
  );
}
