import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  cabinetMe,
  fetchCabinetClinic,
  fetchCabinetLeads,
  updateCabinetLead,
} from "@/shared/api/cabinet";
import { CONTACT_LABELS, LEAD_STATUS_LABELS, LeadStatusBadge } from "@/shared/ui/StatusBadge";
import { BackMark, PageHead, WsIcon, WsLoading } from "@/widgets/workspace/Workspace";

export const Route = createFileRoute("/cabinet/clinics/$id/leads")({
  component: CabinetLeadsPage,
});

const STATUS_OPTIONS = [
  { value: "", label: "Все" },
  { value: "new", label: "Новые" },
  { value: "contacted", label: "На связи" },
  { value: "closed", label: "Закрыты" },
];

function CabinetLeadsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
  const clinic = useQuery({
    queryKey: ["cabinet-clinic", id],
    queryFn: () => fetchCabinetClinic(id),
    enabled: auth.data === true,
  });
  const leads = useQuery({
    queryKey: ["cabinet-leads", id, status],
    queryFn: () => fetchCabinetLeads(id, status || undefined),
    enabled: auth.data === true,
  });

  const patch = useMutation({
    mutationFn: (payload: { leadId: string; status?: string; notes?: string | null }) =>
      updateCabinetLead(id, payload.leadId, { status: payload.status, notes: payload.notes }),
    onSuccess: (_data, payload) => {
      if (payload.notes !== undefined) setSavedNote(payload.leadId);
      void qc.invalidateQueries({ queryKey: ["cabinet-leads", id] });
    },
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/cabinet/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  if (auth.isLoading || !auth.data) return <WsLoading label="Проверка сессии…" />;

  return (
    <div className="ws-stack">
      <PageHead
        back={
          <Link to="/cabinet/clinics/$id" params={{ id }} className="ws-back">
            <BackMark />
            {clinic.data?.nameRu || clinic.data?.nameEn || "Клиника"}
          </Link>
        }
        eyebrow="Заявки"
        title="Заявки пациентов"
        lead="Обращения со страницы клиники в каталоге и из Health Checker. Это просьба перезвонить, а не запись к врачу — свяжитесь с пациентом удобным ему способом."
      />

      <div className="ws-toolbar">
        <div className="ws-seg" role="tablist" aria-label="Статус заявки">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              role="tab"
              aria-selected={status === opt.value}
              className={status === opt.value ? "is-active" : undefined}
              onClick={() => setStatus(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {leads.isLoading ? <WsLoading label="Загружаем заявки…" inline /> : null}
      {!leads.isLoading && leads.data?.length === 0 ? (
        <div className="ws-empty">
          <span className="ws-empty-mark">
            <img src="/brand/logo.svg" alt="" width={40} height={40} />
          </span>
          <h2>{status ? "Здесь пусто" : "Заявок пока нет"}</h2>
          <p>Когда пациент оставит заявку на странице клиники, она появится здесь. Подключите Telegram в «Моих клиниках», чтобы узнавать о заявках сразу.</p>
        </div>
      ) : null}

      <div className="grid gap-4">
        {leads.data?.map((lead) => {
          const note = notesDraft[lead.id] ?? lead.notes ?? "";
          const phoneHref = `tel:${lead.phone.replace(/[^\d+]/g, "")}`;
          return (
            <article key={lead.id} className="ws-card is-pad space-y-4">
              <div className="ws-card-head">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-paper text-ink">
                    <WsIcon name="user" size={20} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="ws-card-title">{lead.fullName}</h2>
                    <p className="ws-row-meta">
                      <span>{lead.country}</span>
                      <span>{new Date(lead.createdAt).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })}</span>
                      <span>{lead.source === "checker" ? "Health Checker" : "Каталог"}</span>
                    </p>
                  </div>
                </div>
                <LeadStatusBadge status={lead.status} />
              </div>

              <dl className="ws-facts">
                <div>
                  <dt>Телефон</dt>
                  <dd>
                    <a href={phoneHref}>{lead.phone}</a>
                  </dd>
                </div>
                <div>
                  <dt>Как связаться</dt>
                  <dd>{CONTACT_LABELS[lead.contactMethod] || lead.contactMethod}</dd>
                </div>
                {lead.email ? (
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={`mailto:${lead.email}`}>{lead.email}</a>
                    </dd>
                  </div>
                ) : null}
                {lead.recommendedSpecialty ? (
                  <div>
                    <dt>Направление</dt>
                    <dd>{lead.recommendedSpecialty.nameRu || lead.recommendedSpecialty.nameEn}</dd>
                  </div>
                ) : null}
                {lead.age != null ? (
                  <div>
                    <dt>Возраст</dt>
                    <dd>{lead.age}</dd>
                  </div>
                ) : null}
                {lead.symptoms || lead.medicalNeed ? (
                  <div className="is-wide">
                    <dt>Запрос пациента</dt>
                    <dd className="is-text">{lead.symptoms || lead.medicalNeed}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-muted">Статус:</span>
                <div className="ws-seg">
                  {(["new", "contacted", "closed"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={lead.status === s ? "is-active" : undefined}
                      disabled={patch.isPending || lead.status === s}
                      onClick={() => patch.mutate({ leadId: lead.id, status: s })}
                    >
                      {LEAD_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="ws-field">
                <span className="ws-field-label">Заметки для команды</span>
                <textarea
                  className="field"
                  rows={2}
                  value={note}
                  placeholder="Например: перезвонили, ждёт выписку из МРТ"
                  onChange={(e) => {
                    setSavedNote(null);
                    setNotesDraft((prev) => ({ ...prev, [lead.id]: e.target.value }));
                  }}
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="ws-pill is-ink"
                  disabled={patch.isPending || note === (lead.notes ?? "")}
                  onClick={() => patch.mutate({ leadId: lead.id, notes: note })}
                >
                  Сохранить заметку
                </button>
                <a href={phoneHref} className="ws-pill">
                  Позвонить
                </a>
                {savedNote === lead.id ? <span className="text-sm font-semibold text-accent-strong">Сохранено</span> : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
