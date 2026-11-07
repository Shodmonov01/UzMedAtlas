import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminMe, fetchAdminLead, updateAdminLead } from "@/shared/api/cabinet";
import { CONTACT_LABELS, LEAD_STATUS_LABELS, LeadStatusBadge } from "@/shared/ui/StatusBadge";
import { BackMark, PageHead, WsLoading, WsNote } from "@/widgets/workspace/Workspace";

export const Route = createFileRoute("/moderation/leads/$id")({
  component: AdminLeadDetailPage,
});

function AdminLeadDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const auth = useQuery({ queryKey: ["admin-me"], queryFn: adminMe, retry: false });
  const lead = useQuery({
    queryKey: ["admin-lead", id],
    queryFn: () => fetchAdminLead(id),
    enabled: auth.data === true,
  });

  const patch = useMutation({
    mutationFn: (payload: { status?: string; notes?: string | null }) => updateAdminLead(id, payload),
    onSuccess: (_data, payload) => {
      if (payload.notes !== undefined) setSaved(true);
      void qc.invalidateQueries({ queryKey: ["admin-lead", id] });
      void qc.invalidateQueries({ queryKey: ["admin-leads"] });
    },
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/moderation/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  useEffect(() => {
    if (lead.data) setNotes(lead.data.notes || "");
  }, [lead.data]);

  if (auth.isLoading || !auth.data) return <WsLoading label="Проверка сессии…" />;
  if (lead.isLoading) return <WsLoading />;

  const back = (
    <Link to="/moderation/leads" search={{ status: undefined, source: undefined, q: undefined }} className="ws-back">
      <BackMark />
      Все заявки
    </Link>
  );

  if (lead.isError || !lead.data) {
    return (
      <div className="ws-stack">
        {back}
        <WsNote tone="danger" title="Заявка не найдена" />
      </div>
    );
  }

  const data = lead.data;
  const phoneHref = `tel:${data.phone.replace(/[^\d+]/g, "")}`;

  return (
    <div className="ws-stack">
      <PageHead
        back={back}
        eyebrow={data.source === "checker" ? "Заявка · Health Checker" : "Заявка · Каталог"}
        title={data.fullName}
        meta={
          <>
            <LeadStatusBadge status={data.status} />
            <span>{data.clinic?.nameRu || data.clinic?.nameEn}</span>
            <span>{new Date(data.createdAt).toLocaleString("ru-RU", { dateStyle: "long", timeStyle: "short" })}</span>
          </>
        }
        actions={
          <a href={phoneHref} className="pill-btn is-ink">
            Позвонить
            <span className="pill-btn-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        }
      />

      <div className="ws-split">
        <section className="ws-card is-pad">
          <h2 className="ws-card-title">Данные пациента</h2>
          <dl className="ws-facts mt-4">
            <div>
              <dt>Телефон</dt>
              <dd>
                <a href={phoneHref}>{data.phone}</a>
              </dd>
            </div>
            <div>
              <dt>Как связаться</dt>
              <dd>{CONTACT_LABELS[data.contactMethod] || data.contactMethod}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{data.email ? <a href={`mailto:${data.email}`}>{data.email}</a> : "—"}</dd>
            </div>
            <div>
              <dt>Страна</dt>
              <dd>{data.country}</dd>
            </div>
            <div>
              <dt>Возраст</dt>
              <dd>{data.age ?? "—"}</dd>
            </div>
            <div>
              <dt>Направление</dt>
              <dd>{data.recommendedSpecialty?.nameRu || data.recommendedSpecialty?.nameEn || "—"}</dd>
            </div>
            <div className="is-wide">
              <dt>Запрос</dt>
              <dd className="is-text">{data.symptoms || data.medicalNeed || "—"}</dd>
            </div>
          </dl>
        </section>

        <aside>
          <section className="ws-card is-pad space-y-4">
            <div>
              <h2 className="ws-card-title">Статус</h2>
              <p className="ws-card-text">Отмечайте, когда с пациентом связались и когда вопрос закрыт.</p>
            </div>
            <div className="ws-seg is-block">
              {(["new", "contacted", "closed"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={data.status === s ? "is-active" : undefined}
                  disabled={patch.isPending || data.status === s}
                  onClick={() => patch.mutate({ status: s })}
                >
                  {LEAD_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </section>
          <section className="ws-card is-pad space-y-4">
            <label className="ws-field">
              <span className="ws-field-label">Заметки модератора</span>
              <textarea
                className="field"
                rows={5}
                value={notes}
                placeholder="Что уже сделано по заявке"
                onChange={(e) => {
                  setSaved(false);
                  setNotes(e.target.value);
                }}
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="ws-pill is-ink" disabled={patch.isPending || notes === (data.notes || "")} onClick={() => patch.mutate({ notes })}>
                Сохранить заметку
              </button>
              {saved ? <span className="text-sm font-semibold text-accent-strong">Сохранено</span> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
