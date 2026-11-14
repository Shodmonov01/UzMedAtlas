import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  addBranchPhoto,
  cabinetMe,
  deleteBranchPhoto,
  fetchCabinetBranch,
  fetchCabinetClinic,
  reorderBranchPhotos,
  replaceBranchPhoto,
  setBranchMainPhoto,
  updateCabinetBranch,
  uploadCabinetFile,
} from "@/shared/api/cabinet";
import { CITY_LABELS, fetchSpecialties } from "@/shared/api/client";
import { yandexPointUrl } from "@/shared/lib/yandex-maps";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { BranchDoctorsPanel } from "@/widgets/clinic-form/BranchDoctorsPanel";
import {
  BRANCH_CORE_SECTIONS,
  BranchEditorForm,
  type BranchCoreSectionId,
} from "@/widgets/clinic-form/BranchEditorForm";
import { BranchEquipmentPanel } from "@/widgets/clinic-form/BranchEquipmentPanel";
import { BranchServicesPanel } from "@/widgets/clinic-form/BranchServicesPanel";
import { Field } from "@/widgets/clinic-form/FormField";
import { BackMark, PageHead, WsIcon, WsLoading, WsNote, WsToast } from "@/widgets/workspace/Workspace";

export const Route = createFileRoute("/cabinet/clinics/$id/branches/$branchId")({
  validateSearch: (search: Record<string, unknown>) => ({
    section: typeof search.section === "string" ? search.section : undefined,
  }),
  component: EditBranchPage,
});

const BRANCH_PAGE_SECTIONS = [
  ...BRANCH_CORE_SECTIONS,
  { id: "services", label: "Services" },
  { id: "doctors", label: "Doctors" },
  { id: "photos", label: "Photos" },
  { id: "equipment", label: "Equipment" },
] as const;

type BranchPageSectionId = (typeof BRANCH_PAGE_SECTIONS)[number]["id"];

const CORE_IDS = new Set<string>(BRANCH_CORE_SECTIONS.map((s) => s.id));

const PHOTO_CATEGORY_LABELS: Record<string, string> = {
  facade: "Facade",
  reception: "Reception",
  hall: "Lobby",
  rooms: "Rooms",
  or: "Operating room",
  equipment: "Equipment",
  staff: "Staff",
  other: "Other",
};

function EditBranchPage() {
  const { id, branchId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [section, setSection] = useState<BranchPageSectionId>(
    BRANCH_PAGE_SECTIONS.some((item) => item.id === search.section)
      ? (search.section as BranchPageSectionId)
      : "basic",
  );
  const clearMessage = useCallback(() => setMessage(null), []);

  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
  const clinic = useQuery({
    queryKey: ["cabinet-clinic", id],
    queryFn: () => fetchCabinetClinic(id),
    enabled: auth.data === true,
  });
  const branch = useQuery({
    queryKey: ["cabinet-branch", id, branchId],
    queryFn: () => fetchCabinetBranch(id, branchId),
    enabled: auth.data === true,
  });
  const specialties = useQuery({
    queryKey: ["specialties"],
    queryFn: fetchSpecialties,
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) void navigate({ to: "/cabinet/login" });
  }, [auth.data, auth.isError, navigate]);

  if (!auth.data || clinic.isLoading || branch.isLoading) return <WsLoading />;
  if (!clinic.data || !branch.data) return <WsNote tone="danger" title="Branch not found" />;

  const locked = clinic.data.status === "moderation";
  const isCore = CORE_IDS.has(section);
  const stepIndex = Math.max(0, BRANCH_PAGE_SECTIONS.findIndex((s) => s.id === section));
  const prevStep = BRANCH_PAGE_SECTIONS[stepIndex - 1];
  const nextStep = BRANCH_PAGE_SECTIONS[stepIndex + 1];
  const branchName = branch.data.nameRu || branch.data.nameEn;
  const clinicName = clinic.data.nameRu || clinic.data.nameEn;

  function pick(next: BranchPageSectionId) {
    setSection(next);
    setMessage(null);
    const wz = document.querySelector(".wz");
    if (wz && wz.getBoundingClientRect().top < 0) wz.scrollIntoView({ block: "start" });
  }

  return (
    <div className="ws-stack">
      <PageHead
        back={
          <Link to="/cabinet/clinics/$id/branches" params={{ id }} className="ws-back">
            <BackMark />
            Branches · {clinicName}
          </Link>
        }
        eyebrow="Branch"
        title={branchName}
        meta={
          <>
            <span>
              <WsIcon name="pin" size={15} />
              {CITY_LABELS[branch.data.city] || branch.data.city}
            </span>
            {branch.data.phone ? <span>{branch.data.phone}</span> : null}
          </>
        }
        actions={
          clinic.data.status === "published" && branch.data.slug ? (
            <Link
              to="/clinics/$slug/branches/$branchSlug"
              params={{ slug: clinic.data.slug, branchSlug: branch.data.slug }}
              target="_blank"
              className="ws-pill"
            >
              Public page
              <WsIcon name="external" size={14} />
            </Link>
          ) : undefined
        }
      />

      {locked ? (
        <WsNote tone="info" title="The clinic is in review">
          <p>Branches cannot be edited while a moderator reviews the profile.</p>
        </WsNote>
      ) : null}

      <WsToast message={message} onDone={clearMessage} />

      <div className="wz">
        <nav className="wz-nav" aria-label="Branch sections">
          <div className="wz-progress">
            <p>
              Section <strong>{stepIndex + 1} of {BRANCH_PAGE_SECTIONS.length}</strong>
            </p>
            <div className="wz-progress-bar">
              <span style={{ width: `${((stepIndex + 1) / BRANCH_PAGE_SECTIONS.length) * 100}%` }} />
            </div>
          </div>
          <ol className="wz-steps">
            {BRANCH_PAGE_SECTIONS.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`wz-step${section === item.id ? " is-active" : i < stepIndex ? " is-done" : ""}`}
                  aria-current={section === item.id ? "step" : undefined}
                  onClick={() => pick(item.id)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="wz-body">
          {isCore && specialties.data ? (
            <BranchEditorForm
              key={branch.data.id}
              specialties={specialties.data}
              allowedSpecialtyIds={clinic.data.specialtyIds}
              onUpload={uploadCabinetFile}
              initial={branch.data}
              locked={locked}
              hideNav
              activeSection={section as BranchCoreSectionId}
              onActiveSectionChange={(next) => pick(next)}
              onContinuePastEnd={() => pick("services")}
              onSubmit={async (payload) => {
                await updateCabinetBranch(id, branchId, payload);
                await qc.invalidateQueries({ queryKey: ["cabinet-branch", id, branchId] });
                await qc.invalidateQueries({ queryKey: ["cabinet-branches", id] });
                await qc.invalidateQueries({ queryKey: ["cabinet-clinic", id] });
                setMessage("Branch saved");
                await branch.refetch();
              }}
            />
          ) : null}

          {section === "services" ? (
            <BranchServicesPanel
              clinicId={id}
              branchId={branchId}
              services={branch.data.services || []}
              specialties={(branch.data.specialties || []).map((s) => ({
                id: s.id,
                nameRu: s.nameRu,
                nameEn: s.nameEn,
              }))}
              locked={locked}
              onChanged={async () => {
                await branch.refetch();
                await qc.invalidateQueries({ queryKey: ["cabinet-branches", id] });
                await qc.invalidateQueries({ queryKey: ["cabinet-clinic", id] });
              }}
            />
          ) : null}

          {section === "doctors" ? (
            <BranchDoctorsPanel
              clinicId={id}
              branchId={branchId}
              clinicDoctors={clinic.data.doctors || []}
              branchDoctorIds={(branch.data.doctors || []).map((d) => d.id)}
              specialtyIds={branch.data.specialtyIds || []}
              specialtyOptions={clinic.data.specialties || []}
              onUpload={uploadCabinetFile}
              locked={locked}
              onChanged={async () => {
                await branch.refetch();
                await clinic.refetch();
                await qc.invalidateQueries({ queryKey: ["cabinet-branches", id] });
              }}
            />
          ) : null}

          {section === "photos" ? (
            <div className="soft-card space-y-5">
              <div>
                <h2 className="ws-card-title">Branch photos</h2>
                <p className="ws-card-text">The first photo is the cover of the branch page. Reorder with the arrows or make any photo the cover.</p>
              </div>
              {(branch.data.photos || []).length ? (
                <div className="ws-photos">
                  {(branch.data.photos || []).map((photo, index) => (
                    <div key={photo.id} className="ws-photo">
                      <div className="ws-photo-img">
                        <img src={photo.url} alt="" loading="lazy" />
                        {index === 0 ? <b>Cover</b> : null}
                      </div>
                      <div className="ws-photo-meta">
                        <span className="truncate">{PHOTO_CATEGORY_LABELS[photo.category] || photo.category}</span>
                        <span className="text-xs font-semibold text-muted">#{index + 1}</span>
                      </div>
                      {!locked ? (
                        <div className="ws-photo-tools">
                          <button
                            type="button"
                            className="ws-mini"
                            disabled={index === 0}
                            title="Move up"
                            aria-label="Move up"
                            onClick={async () => {
                              const ids = (branch.data.photos || []).map((p) => p.id);
                              const next = [...ids];
                              [next[index - 1], next[index]] = [next[index], next[index - 1]];
                              await reorderBranchPhotos(id, branchId, next);
                              await branch.refetch();
                            }}
                          >
                            <WsIcon name="up" size={15} />
                          </button>
                          <button
                            type="button"
                            className="ws-mini"
                            disabled={index >= (branch.data.photos?.length || 0) - 1}
                            title="Move down"
                            aria-label="Move down"
                            onClick={async () => {
                              const ids = (branch.data.photos || []).map((p) => p.id);
                              const next = [...ids];
                              [next[index], next[index + 1]] = [next[index + 1], next[index]];
                              await reorderBranchPhotos(id, branchId, next);
                              await branch.refetch();
                            }}
                          >
                            <WsIcon name="down" size={15} />
                          </button>
                          {index !== 0 ? (
                            <button
                              type="button"
                              className="ws-mini"
                              title="Make cover"
                              aria-label="Make cover"
                              onClick={async () => {
                                await setBranchMainPhoto(id, branchId, photo.id);
                                await branch.refetch();
                                setMessage("Cover updated");
                              }}
                            >
                              <WsIcon name="star" size={15} />
                            </button>
                          ) : null}
                          <label className="ws-mini" title="Replace file" aria-label="Replace file">
                            <WsIcon name="swap" size={15} />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const url = await uploadCabinetFile(file);
                                await replaceBranchPhoto(id, branchId, photo.id, { url });
                                await branch.refetch();
                                setMessage("Photo replaced");
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className="ws-mini is-danger ml-auto"
                            title="Delete photo"
                            aria-label="Delete photo"
                            onClick={async () => {
                              if (!window.confirm("Delete this photo?")) return;
                              await deleteBranchPhoto(id, branchId, photo.id);
                              await branch.refetch();
                            }}
                          >
                            <WsIcon name="trash" size={15} />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-paper px-4 py-3 text-sm text-muted">No photos yet. Add the facade, the entrance and the rooms so patients can find the branch easily.</p>
              )}
              {!locked ? (
                <form
                  className="ws-group"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const fd = new FormData(form);
                    const file = (form.elements.namedItem("file") as HTMLInputElement)?.files?.[0];
                    if (!file) return;
                    const url = await uploadCabinetFile(file);
                    await addBranchPhoto(id, branchId, {
                      url,
                      category: String(fd.get("category") || "facade"),
                    });
                    form.reset();
                    await branch.refetch();
                    setMessage("Photo added");
                  }}
                >
                  <p className="ws-label">Add a photo</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="What is in the photo">
                      <select name="category" className="field" defaultValue="facade">
                        {Object.entries(PHOTO_CATEGORY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="File" hint="JPG, PNG or WEBP, landscape works best">
                      <input name="file" type="file" accept="image/*" required className="field" />
                    </Field>
                  </div>
                  <button className="btn btn-primary justify-self-start" type="submit">
                    Upload photo
                  </button>
                </form>
              ) : null}

              {branch.data.lat != null && branch.data.lng != null ? (
                <p className="text-sm text-muted">
                  Map location:{" "}
                  <a className="font-bold text-primary" href={yandexPointUrl(branch.data.lat, branch.data.lng)} target="_blank" rel="noreferrer">
                    Yandex Maps ({branch.data.lat}, {branch.data.lng})
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}

          {section === "equipment" ? (
            <BranchEquipmentPanel
              clinicId={id}
              branchId={branchId}
              equipment={branch.data.equipment || []}
              locked={locked}
              onChanged={async () => {
                await branch.refetch();
                await qc.invalidateQueries({ queryKey: ["cabinet-clinic", id] });
              }}
            />
          ) : null}

          {!isCore ? (
            <div className="wz-pager">
              {prevStep ? (
                <button type="button" className="ws-pill" onClick={() => pick(prevStep.id)}>
                  <span className="inline-flex -scale-x-100">
                    <ArrowIcon size={15} />
                  </span>
                  {prevStep.label}
                </button>
              ) : (
                <span />
              )}
              {nextStep ? (
                <button type="button" className="ws-pill is-ink" onClick={() => pick(nextStep.id)}>
                  Next: {nextStep.label}
                  <ArrowIcon size={15} />
                </button>
              ) : (
                <Link to="/cabinet/clinics/$id/branches" params={{ id }} className="ws-pill is-ink">
                  Done, back to branches
                  <ArrowIcon size={15} />
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
