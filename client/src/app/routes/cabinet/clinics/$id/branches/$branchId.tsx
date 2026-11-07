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
  { id: "services", label: "Услуги" },
  { id: "doctors", label: "Специалисты" },
  { id: "photos", label: "Фото" },
  { id: "equipment", label: "Оборудование" },
] as const;

type BranchPageSectionId = (typeof BRANCH_PAGE_SECTIONS)[number]["id"];

const CORE_IDS = new Set<string>(BRANCH_CORE_SECTIONS.map((s) => s.id));

const PHOTO_CATEGORY_LABELS: Record<string, string> = {
  facade: "Фасад",
  reception: "Ресепшен",
  hall: "Холл",
  rooms: "Кабинеты",
  or: "Операционная",
  equipment: "Оборудование",
  staff: "Сотрудники",
  other: "Другое",
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
  if (!clinic.data || !branch.data) return <WsNote tone="danger" title="Филиал не найден" />;

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
            Филиалы · {clinicName}
          </Link>
        }
        eyebrow="Филиал"
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
              Страница на сайте
              <WsIcon name="external" size={14} />
            </Link>
          ) : undefined
        }
      />

      {locked ? (
        <WsNote tone="info" title="Клиника на модерации">
          <p>Пока модератор проверяет профиль, филиалы редактировать нельзя.</p>
        </WsNote>
      ) : null}

      <WsToast message={message} onDone={clearMessage} />

      <div className="wz">
        <nav className="wz-nav" aria-label="Разделы филиала">
          <div className="wz-progress">
            <p>
              Раздел <strong>{stepIndex + 1} из {BRANCH_PAGE_SECTIONS.length}</strong>
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
                setMessage("Филиал сохранён");
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
                <h2 className="ws-card-title">Фото филиала</h2>
                <p className="ws-card-text">Первое фото — обложка страницы филиала. Меняйте порядок стрелками или сделайте нужное фото обложкой.</p>
              </div>
              {(branch.data.photos || []).length ? (
                <div className="ws-photos">
                  {(branch.data.photos || []).map((photo, index) => (
                    <div key={photo.id} className="ws-photo">
                      <div className="ws-photo-img">
                        <img src={photo.url} alt="" loading="lazy" />
                        {index === 0 ? <b>Обложка</b> : null}
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
                            title="Переместить выше"
                            aria-label="Переместить выше"
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
                            title="Переместить ниже"
                            aria-label="Переместить ниже"
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
                              title="Сделать обложкой"
                              aria-label="Сделать обложкой"
                              onClick={async () => {
                                await setBranchMainPhoto(id, branchId, photo.id);
                                await branch.refetch();
                                setMessage("Обложка обновлена");
                              }}
                            >
                              <WsIcon name="star" size={15} />
                            </button>
                          ) : null}
                          <label className="ws-mini" title="Заменить файл" aria-label="Заменить файл">
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
                                setMessage("Фото заменено");
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className="ws-mini is-danger ml-auto"
                            title="Удалить фото"
                            aria-label="Удалить фото"
                            onClick={async () => {
                              if (!window.confirm("Удалить это фото?")) return;
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
                <p className="rounded-2xl bg-paper px-4 py-3 text-sm text-muted">Фото пока нет. Добавьте фасад, вход и кабинеты — так пациенту проще найти филиал.</p>
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
                    setMessage("Фото добавлено");
                  }}
                >
                  <p className="ws-label">Добавить фото</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Что на фото">
                      <select name="category" className="field" defaultValue="facade">
                        {Object.entries(PHOTO_CATEGORY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Файл" hint="JPG, PNG или WEBP, лучше горизонтальное">
                      <input name="file" type="file" accept="image/*" required className="field" />
                    </Field>
                  </div>
                  <button className="btn btn-primary justify-self-start" type="submit">
                    Загрузить фото
                  </button>
                </form>
              ) : null}

              {branch.data.lat != null && branch.data.lng != null ? (
                <p className="text-sm text-muted">
                  Точка на карте:{" "}
                  <a className="font-bold text-primary" href={yandexPointUrl(branch.data.lat, branch.data.lng)} target="_blank" rel="noreferrer">
                    Яндекс.Карты ({branch.data.lat}, {branch.data.lng})
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
                  Далее: {nextStep.label}
                  <ArrowIcon size={15} />
                </button>
              ) : (
                <Link to="/cabinet/clinics/$id/branches" params={{ id }} className="ws-pill is-ink">
                  Готово — к списку филиалов
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
