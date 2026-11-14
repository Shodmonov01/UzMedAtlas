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
  if (!clinic.data) return <WsNote tone="danger" title="Clinic not found" />;

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
      if (!window.confirm("Once sent, the profile goes to a moderator for review. Continue?")) return;
      await submitCabinetClinic(id);
      await qc.invalidateQueries({ queryKey: ["cabinet-clinic", id] });
      await qc.invalidateQueries({ queryKey: ["cabinet-clinics"] });
      setMessage("The clinic was sent for review. We will let you know the decision.");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.issues) {
        setIssues(err.response.data.issues as { field: string; message: string }[]);
      } else {
        setMessage("Could not send. Please try again.");
      }
    }
  }

  return (
    <div className="ws-stack">
      <PageHead
        back={
          <Link to="/cabinet" className="ws-back">
            <BackMark />
            My clinics
          </Link>
        }
        eyebrow="Clinic profile"
        title={name}
        meta={
          <>
            <StatusBadge status={clinic.data.status} />
            <span>Branches: {clinic.data.branchCount ?? 0}</span>
            <span>Doctors: {clinic.data.doctorCount ?? 0}</span>
          </>
        }
        actions={
          <>
            {canDelete ? (
              <button
                type="button"
                className="ws-pill is-danger is-icon"
                aria-label="Delete clinic"
                title="Delete clinic"
                onClick={async () => {
                  if (!window.confirm(`Delete the clinic “${name}”? This cannot be undone.`)) return;
                  await deleteCabinetClinic(id);
                  void navigate({ to: "/cabinet" });
                }}
              >
                <WsIcon name="trash" size={17} />
              </button>
            ) : null}
            {clinic.data.status === "published" ? (
              <Link to="/clinics/$slug" params={{ slug: clinic.data.slug }} target="_blank" className="ws-pill">
                Public page
                <WsIcon name="external" size={14} />
              </Link>
            ) : null}
            {canSubmit ? (
              <button type="button" className="pill-btn is-ink" onClick={() => void submit()}>
                Send for review
                <span className="pill-btn-icon">
                  <ArrowIcon />
                </span>
              </button>
            ) : null}
          </>
        }
      />

      {clinic.data.moderatorNote ? (
        <WsNote tone="danger" title="Moderator comment">
          <p>{clinic.data.moderatorNote}</p>
        </WsNote>
      ) : null}

      {message ? <WsNote tone="success">{message}</WsNote> : null}
      {issues.length ? (
        <WsNote tone="warning" title="To send for review, fill in:">
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
        <WsNote tone="info" title="The clinic is in review">
          <p>Editing is locked while a moderator reviews the profile. The decision will arrive in the cabinet and on Telegram.</p>
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
