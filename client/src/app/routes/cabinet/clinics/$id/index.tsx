import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  cabinetMe,
  deleteCabinetClinic,
  fetchCabinetClinic,
  submitCabinetClinic,
  type WizardSectionId,
} from "@/shared/api/cabinet";
import { fetchSpecialties } from "@/shared/api/client";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { ClinicWizard } from "@/widgets/clinic-form/ClinicWizard";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { BackMark, PageHead, WsIcon, WsLoading, WsNote } from "@/widgets/workspace/Workspace";
import axios from "axios";

export const Route = createFileRoute("/cabinet/clinics/$id/")({
  component: EditClinicPage,
});

function EditClinicPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<{ field: string; message: string }[]>([]);
  const [jumpSection, setJumpSection] = useState<WizardSectionId | undefined>();

  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
  const clinic = useQuery({
    queryKey: ["cabinet-clinic", id],
    queryFn: () => fetchCabinetClinic(id),
    enabled: auth.data === true,
  });
  const specialties = useQuery({
    queryKey: ["specialties"],
    queryFn: fetchSpecialties,
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/cabinet/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  if (!auth.data || clinic.isLoading) return <WsLoading />;
  if (!clinic.data) return <WsNote tone="danger" title="Клиника не найдена" />;

  const locked = clinic.data.status === "moderation";
  const canSubmit = clinic.data.status === "draft" || clinic.data.status === "needs_changes";
  const canDelete = clinic.data.status === "draft" || clinic.data.status === "needs_changes";

  function sectionForField(field: string): WizardSectionId {
    if (field.startsWith("branches.")) return "branches";
    if (field === "logo") return "basic";
    if (field === "specialties") return "directions";
    if (field === "phone" || field === "email" || field === "address") return "contacts";
    if (field === "description") return "about";
    if (field === "name") return "basic";
    return "preview";
  }

  const name = clinic.data.nameRu || clinic.data.nameEn;

  async function submit() {
    setMessage(null);
    setIssues([]);
    try {
      if (!window.confirm("После отправки данные будут переданы на проверку модератору. Продолжить?")) return;
      await submitCabinetClinic(id);
      await qc.invalidateQueries({ queryKey: ["cabinet-clinic", id] });
      await qc.invalidateQueries({ queryKey: ["cabinet-clinics"] });
      setMessage("Клиника отправлена на модерацию. Мы сообщим о решении.");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.issues) {
        setIssues(err.response.data.issues as { field: string; message: string }[]);
      } else {
        setMessage("Не удалось отправить. Попробуйте ещё раз.");
      }
    }
  }

  return (
    <div className="ws-stack">
      <PageHead
        back={
          <Link to="/cabinet" className="ws-back">
            <BackMark />
            Мои клиники
          </Link>
        }
        eyebrow="Профиль клиники"
        title={name}
        meta={
          <>
            <StatusBadge status={clinic.data.status} />
            <span>Филиалов: {clinic.data.branchCount ?? 0}</span>
            <span>Врачей: {clinic.data.doctorCount ?? 0}</span>
          </>
        }
        actions={
          <>
            {canDelete ? (
              <button
                type="button"
                className="ws-pill is-danger is-icon"
                aria-label="Удалить клинику"
                title="Удалить клинику"
                onClick={async () => {
                  if (!window.confirm(`Удалить клинику «${name}»? Это действие нельзя отменить.`)) return;
                  await deleteCabinetClinic(id);
                  void navigate({ to: "/cabinet" });
                }}
              >
                <WsIcon name="trash" size={17} />
              </button>
            ) : null}
            {clinic.data.status === "published" ? (
              <Link to="/clinics/$slug" params={{ slug: clinic.data.slug }} target="_blank" className="ws-pill">
                Страница на сайте
                <WsIcon name="external" size={14} />
              </Link>
            ) : null}
            {canSubmit ? (
              <button type="button" className="pill-btn is-ink" onClick={() => void submit()}>
                Отправить на модерацию
                <span className="pill-btn-icon">
                  <ArrowIcon />
                </span>
              </button>
            ) : null}
          </>
        }
      />

      {clinic.data.moderatorNote ? (
        <WsNote tone="danger" title="Комментарий модератора">
          <p>{clinic.data.moderatorNote}</p>
        </WsNote>
      ) : null}

      {message ? <WsNote tone="success">{message}</WsNote> : null}
      {issues.length ? (
        <WsNote tone="warning" title="Чтобы отправить на модерацию, заполните:">
          <ul>
            {issues.map((item) => (
              <li key={item.field + item.message}>
                {item.field.startsWith("branches.") ? (
                  (() => {
                    const [, branchId, field] = item.field.split(".");
                    const section = field === "phone" ? "contacts" : field === "specialties" ? "directions" : field === "address" || field === "city" ? "address" : "basic";
                    return branchId && clinic.data.branches?.some((branch) => branch.id === branchId) ? (
                      <Link to="/cabinet/clinics/$id/branches/$branchId" params={{ id, branchId }} search={{ section }}>
                        {item.message} →
                      </Link>
                    ) : (
                      <Link to="/cabinet/clinics/$id/branches" params={{ id }}>
                        {item.message} →
                      </Link>
                    );
                  })()
                ) : (
                  <button type="button" onClick={() => setJumpSection(sectionForField(item.field))}>
                    {item.message} →
                  </button>
                )}
              </li>
            ))}
          </ul>
        </WsNote>
      ) : null}

      {locked ? (
        <WsNote tone="info" title="Клиника на модерации">
          <p>Пока модератор проверяет профиль, редактирование недоступно. Решение придёт в кабинет и в Telegram.</p>
        </WsNote>
      ) : null}

      {specialties.data ? (
        <ClinicWizard
          key={jumpSection ? `${id}-jump-${jumpSection}` : id}
          clinic={clinic.data}
          specialties={specialties.data}
          locked={locked}
          initialSection={jumpSection}
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: ["cabinet-clinic", id] });
            await qc.invalidateQueries({ queryKey: ["cabinet-clinics"] });
            await clinic.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
