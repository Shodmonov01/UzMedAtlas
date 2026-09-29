import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Specialty } from "@/shared/api/client";
import {
  addClinicCertificate,
  addClinicDoctor,
  addClinicEquipment,
  addClinicPhoto,
  addClinicSpecialty,
  deleteClinicCertificate,
  deleteClinicDoctor,
  deleteClinicEquipment,
  deleteClinicPhoto,
  reorderClinicPhotos,
  replaceClinicPhoto,
  setClinicMainPhoto,
  updateCabinetClinic,
  uploadCabinetFile,
  WIZARD_SECTIONS,
  type CabinetClinic,
  type AchievementItem,
  type ClinicFormPayload,
  type LeaderItem,
  type SocialItem,
  type WizardSectionId,
} from "@/shared/api/cabinet";
import { ClinicPreview } from "./ClinicPreview";
import { CITY_OPTIONS, displayCity, normalizeCity } from "@/shared/lib/cities";
import { BranchMap } from "@/shared/ui/BranchMap";
import { AddressMapSearchButton } from "@/shared/ui/AddressMapSearchButton";

const LANGS = ["ru", "en", "uz", "kz", "tr", "ar"];
const PHOTO_CATS = [
  { value: "facade", label: "Фасад" },
  { value: "reception", label: "Ресепшен" },
  { value: "hall", label: "Холл" },
  { value: "waiting", label: "Зона ожидания" },
  { value: "rooms", label: "Кабинеты" },
  { value: "or", label: "Операционная" },
  { value: "equipment", label: "Оборудование" },
  { value: "staff", label: "Команда врачей" },
  { value: "leadership", label: "Руководство" },
  { value: "patients", label: "Пациенты / процесс" },
  { value: "team", label: "Коллектив" },
  { value: "other", label: "Другое" },
];
const DOCTOR_CATEGORIES = [
  { value: "", label: "Без категории" },
  { value: "highest", label: "Высшая" },
  { value: "first", label: "Первая" },
  { value: "second", label: "Вторая" },
  { value: "other", label: "Другая" },
];

type Props = {
  clinic: CabinetClinic;
  specialties: Specialty[];
  locked?: boolean;
  onSaved: () => Promise<void>;
  initialSection?: WizardSectionId;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function FormActions({
  locked,
  saving,
  onContinue,
}: {
  locked?: boolean;
  saving: boolean;
  onContinue?: () => void;
}) {
  if (locked) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn btn-primary text-sm" type="submit" disabled={saving} name="intent" value="save">
        {saving ? "Сохранение…" : "Сохранить"}
      </button>
      {onContinue ? (
        <button
          className="btn btn-ghost text-sm"
          type="submit"
          disabled={saving}
          name="intent"
          value="continue"
          onClick={onContinue}
        >
          Сохранить и продолжить
        </button>
      ) : null}
    </div>
  );
}

export function ClinicWizard({ clinic, specialties, locked, onSaved, initialSection }: Props) {
  const qc = useQueryClient();
  const [section, setSection] = useState<WizardSectionId>(initialSection || "basic");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState(clinic.languages?.length ? clinic.languages : ["ru", "en"]);
  const [specialtyIds, setSpecialtyIds] = useState(clinic.specialtyIds || []);
  const [addedSpecialties, setAddedSpecialties] = useState<Specialty[]>(
    (clinic.specialties || []).filter((item) => !specialties.some((listed) => listed.id === item.id)),
  );
  const [addingSpecialty, setAddingSpecialty] = useState(false);
  const [leaders, setLeaders] = useState<LeaderItem[]>(clinic.leaders || []);
  const [achievements, setAchievements] = useState<AchievementItem[]>(clinic.achievements || []);
  const [socials, setSocials] = useState<SocialItem[]>(clinic.socials || []);
  const [clinicAddressRu, setClinicAddressRu] = useState(clinic.addressRu || "");
  const [clinicCoords, setClinicCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: clinic.lat ?? null,
    lng: clinic.lng ?? null,
  });
  const continueAfterSave = useRef(false);
  const quietSave = useRef(false);
  const skipSpecialtyAutosave = useRef(true);
  const draftTimer = useRef<number | null>(null);

  function goNext() {
    const ids = WIZARD_SECTIONS.map((s) => s.id);
    const i = ids.indexOf(section);
    if (i >= 0 && i < ids.length - 1) {
      setSection(ids[i + 1]);
      setMessage(null);
      setError(null);
    }
  }

  async function save(payload: ClinicFormPayload) {
    if (locked) return;
    setSaving(true);
    setError(null);
    const quiet = quietSave.current;
    quietSave.current = false;
    try {
      await updateCabinetClinic(clinic.id, payload);
      setMessage(quiet ? "Черновик сохранён" : "Сохранено");
      await onSaved();
      if (continueAfterSave.current) {
        continueAfterSave.current = false;
        goNext();
      }
    } catch {
      setMessage(null);
      setError("Не удалось сохранить");
      continueAfterSave.current = false;
    } finally {
      setSaving(false);
    }
  }

  function markContinue() {
    continueAfterSave.current = true;
  }

  function queueDraftAutosave(form: HTMLFormElement) {
    if (locked) return;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      quietSave.current = true;
      if (form.checkValidity()) form.requestSubmit();
      else quietSave.current = false;
    }, 1200);
  }

  // §5 autosave directions when specialty selection changes
  useEffect(() => {
    if (locked) return;
    if (skipSpecialtyAutosave.current) {
      skipSpecialtyAutosave.current = false;
      return;
    }
    const same =
      specialtyIds.length === (clinic.specialtyIds || []).length &&
      specialtyIds.every((id) => (clinic.specialtyIds || []).includes(id));
    if (same) return;
    const t = window.setTimeout(() => {
      quietSave.current = true;
      void save({ specialtyIds });
    }, 900);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialtyIds, locked]);

  useEffect(() => {
    setLeaders(clinic.leaders || []);
    setAchievements(clinic.achievements || []);
    setSocials(clinic.socials || []);
  }, [clinic.id, clinic.updatedAt]);

  useEffect(() => {
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, []);

  async function onUpload(file: File) {
    return uploadCabinetFile(file);
  }

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["cabinet-clinic", clinic.id] });
    await onSaved();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="soft-card h-fit space-y-1 rounded-[1.5rem] bg-white p-3">
        {WIZARD_SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold ${
              section === item.id ? "bg-lime text-primary-deep" : "text-muted hover:bg-mint"
            }`}
            onClick={() => {
              setSection(item.id);
              setMessage(null);
              setError(null);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="space-y-4">
        {message ? <p className="text-sm font-bold text-primary">{message}</p> : null}
        {error ? <p className="text-sm font-bold text-danger">{error}</p> : null}

        {section === "basic" ? (
          <form
            className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6"
            onInput={(e) => queueDraftAutosave(e.currentTarget)}
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await save({
                nameRu: String(fd.get("nameRu")),
                nameEn: String(fd.get("nameEn")),
                shortName: String(fd.get("shortName") || "") || null,
                foundedYear: fd.get("foundedYear") ? Number(fd.get("foundedYear")) : null,
                slug: String(fd.get("slug") || "") || undefined,
                city: normalizeCity(String(fd.get("city"))),
                coverColor: String(fd.get("coverColor") || clinic.coverColor),
                logoUrl: String(fd.get("logoUrl") || "") || null,
                // keep required contacts/address from current clinic when patching basic
                addressRu: clinic.addressRu,
                addressEn: clinic.addressEn,
                descriptionRu: clinic.descriptionRu,
                descriptionEn: clinic.descriptionEn,
                phone: clinic.phone,
                email: clinic.email,
              });
            }}
          >
            <h2 className="text-xl font-extrabold">Основная информация</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Название (RU)">
                <input name="nameRu" required className="field" defaultValue={clinic.nameRu} disabled={locked} />
              </Field>
              <Field label="Название (EN)">
                <input name="nameEn" required className="field" defaultValue={clinic.nameEn} disabled={locked} />
              </Field>
              <Field label="Короткое название">
                <input name="shortName" className="field" defaultValue={clinic.shortName || ""} disabled={locked} />
              </Field>
              <Field label="Год основания">
                <input
                  name="foundedYear"
                  type="number"
                  min={1800}
                  max={2100}
                  className="field"
                  defaultValue={clinic.foundedYear ?? ""}
                  disabled={locked}
                />
              </Field>
              <Field label="Slug">
                <input name="slug" className="field" defaultValue={clinic.slug} disabled={locked} />
              </Field>
              <Field label="Город">
                <input name="city" list="clinic-city-options" required className="field" defaultValue={displayCity(clinic.city)} disabled={locked} />
                <datalist id="clinic-city-options">{CITY_OPTIONS.map((city) => <option key={city.value} value={city.label} />)}</datalist>
              </Field>
              <Field label="Цвет обложки">
                <input
                  name="coverColor"
                  type="color"
                  className="field h-12"
                  defaultValue={clinic.coverColor || "#1570ef"}
                  disabled={locked}
                />
              </Field>
              <Field label="URL логотипа">
                <input name="logoUrl" className="field" defaultValue={clinic.logoUrl || ""} disabled={locked} />
              </Field>
            </div>
            {!locked ? (
              <div className="flex flex-wrap items-center gap-3">
                <FormActions locked={locked} saving={saving} onContinue={markContinue} />
                <label className="btn btn-ghost cursor-pointer text-sm">
                  Загрузить лого
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        setError("Логотип: максимум 2 МБ");
                        e.target.value = "";
                        return;
                      }
                      try {
                        const url = await uploadCabinetFile(file, "logo");
                        await save({ logoUrl: url });
                      } catch {
                        setError("Ошибка загрузки");
                      } finally {
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            ) : null}
          </form>
        ) : null}

        {section === "about" ? (
          <form
            className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6"
            onInput={(e) => queueDraftAutosave(e.currentTarget)}
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await save({
                descriptionRu: String(fd.get("descriptionRu")),
                descriptionEn: String(fd.get("descriptionEn")),
                historyRu: String(fd.get("historyRu") || "") || null,
                historyEn: String(fd.get("historyEn") || "") || null,
                missionRu: String(fd.get("missionRu") || "") || null,
                missionEn: String(fd.get("missionEn") || "") || null,
                advantagesRu: String(fd.get("advantagesRu") || "") || null,
                advantagesEn: String(fd.get("advantagesEn") || "") || null,
                founderName: String(fd.get("founderName") || "") || null,
                founderRoleRu: String(fd.get("founderRoleRu") || "") || null,
                founderRoleEn: String(fd.get("founderRoleEn") || "") || null,
                founderBioRu: String(fd.get("founderBioRu") || "") || null,
                founderBioEn: String(fd.get("founderBioEn") || "") || null,
                founderPhotoUrl: String(fd.get("founderPhotoUrl") || "") || null,
                achievements: achievements.filter((item) => item.titleRu.trim()),
              });
            }}
          >
            <h2 className="text-xl font-extrabold">О клинике</h2>
            <Field label="Описание (RU)">
              <textarea name="descriptionRu" required rows={4} className="field" defaultValue={clinic.descriptionRu} disabled={locked} />
            </Field>
            <Field label="Описание (EN)">
              <textarea name="descriptionEn" required rows={4} className="field" defaultValue={clinic.descriptionEn} disabled={locked} />
            </Field>
            <Field label="История (RU)">
              <textarea name="historyRu" rows={3} className="field" defaultValue={clinic.historyRu || ""} disabled={locked} />
            </Field>
            <Field label="История (EN)">
              <textarea name="historyEn" rows={3} className="field" defaultValue={clinic.historyEn || ""} disabled={locked} />
            </Field>
            <Field label="Миссия (RU)">
              <textarea name="missionRu" rows={2} className="field" defaultValue={clinic.missionRu || ""} disabled={locked} />
            </Field>
            <Field label="Миссия (EN)">
              <textarea name="missionEn" rows={2} className="field" defaultValue={clinic.missionEn || ""} disabled={locked} />
            </Field>
            <Field label="Преимущества (RU, с новой строки)">
              <textarea name="advantagesRu" rows={3} className="field" defaultValue={clinic.advantagesRu || ""} disabled={locked} />
            </Field>
            <Field label="Преимущества (EN)">
              <textarea name="advantagesEn" rows={3} className="field" defaultValue={clinic.advantagesEn || ""} disabled={locked} />
            </Field>
            <h3 className="pt-2 text-lg font-extrabold">Основатель</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="ФИО">
                <input name="founderName" className="field" defaultValue={clinic.founderName || ""} disabled={locked} />
              </Field>
              <Field label="Должность (RU)">
                <input name="founderRoleRu" className="field" defaultValue={clinic.founderRoleRu || ""} disabled={locked} />
              </Field>
              <Field label="Должность (EN)">
                <input name="founderRoleEn" className="field" defaultValue={clinic.founderRoleEn || ""} disabled={locked} />
              </Field>
              <Field label="Фото основателя (URL)">
                <input name="founderPhotoUrl" className="field" defaultValue={clinic.founderPhotoUrl || ""} disabled={locked} />
              </Field>
            </div>
            {!locked ? (
              <label className="btn btn-ghost inline-flex cursor-pointer text-sm">
                Загрузить фото основателя
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await onUpload(file);
                      const input = e.currentTarget.form?.elements.namedItem(
                        "founderPhotoUrl",
                      ) as HTMLInputElement | null;
                      if (input) input.value = url;
                      await save({ founderPhotoUrl: url });
                    } catch {
                      setError("Ошибка загрузки");
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            ) : null}
            <Field label="Биография основателя (RU)">
              <textarea name="founderBioRu" rows={2} className="field" defaultValue={clinic.founderBioRu || ""} disabled={locked} />
            </Field>
            <Field label="Биография основателя (EN)">
              <textarea name="founderBioEn" rows={2} className="field" defaultValue={clinic.founderBioEn || ""} disabled={locked} />
            </Field>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold">Достижения и преимущества</h3>
                {!locked ? <button type="button" className="btn btn-ghost text-sm" onClick={() => setAchievements((items) => [...items, { titleRu: "", descriptionRu: "", year: null }])}>Добавить достижение</button> : null}
              </div>
              {achievements.map((item, index) => (
                <div key={item.id || index} className="grid gap-3 rounded-xl border border-line p-3 md:grid-cols-2">
                  <input className="field" value={item.titleRu} disabled={locked} placeholder="Название" onChange={(event) => setAchievements((items) => items.map((current, i) => i === index ? { ...current, titleRu: event.target.value } : current))} />
                  <input className="field" type="number" min={1800} max={2100} value={item.year ?? ""} disabled={locked} placeholder="Год (необязательно)" onChange={(event) => setAchievements((items) => items.map((current, i) => i === index ? { ...current, year: event.target.value ? Number(event.target.value) : null } : current))} />
                  <textarea className="field md:col-span-2" rows={2} value={item.descriptionRu || ""} disabled={locked} placeholder="Описание" onChange={(event) => setAchievements((items) => items.map((current, i) => i === index ? { ...current, descriptionRu: event.target.value } : current))} />
                  {!locked ? <button type="button" className="justify-self-start text-sm font-bold text-danger" onClick={() => setAchievements((items) => items.filter((_, i) => i !== index))}>Удалить</button> : null}
                </div>
              ))}
              {!achievements.length ? <p className="text-sm text-muted">Достижения не добавлены</p> : null}
            </div>
            <FormActions locked={locked} saving={saving} onContinue={markContinue} />
          </form>
        ) : null}

        {section === "directions" ? (
          <div className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6">
            <h2 className="text-xl font-extrabold">Направления</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {[...specialties, ...addedSpecialties.filter((added) => !specialties.some((item) => item.id === added.id))].map((item) => {
                const id = item.id || item.slug;
                return (
                  <label key={id} className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      disabled={locked}
                      checked={specialtyIds.includes(id)}
                      onChange={(e) => {
                        setSpecialtyIds((prev) =>
                          e.target.checked ? [...prev, id] : prev.filter((x) => x !== id),
                        );
                      }}
                    />
                    {item.nameRu || item.nameEn}
                  </label>
                );
              })}
            </div>
            {!locked ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-primary text-sm"
                  disabled={saving}
                  onClick={() => save({ specialtyIds })}
                >
                  Сохранить направления
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  disabled={saving}
                  onClick={() => {
                    markContinue();
                    void save({ specialtyIds });
                  }}
                >
                  Сохранить и продолжить
                </button>
              </div>
            ) : null}
            {!locked ? (
              <form
                className="space-y-2 rounded-2xl border border-dashed border-line p-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (addingSpecialty) return;
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  const nameRu = String(fd.get("nameRu") || "").trim();
                  const nameEn = String(fd.get("nameEn") || "").trim();
                  setAddingSpecialty(true);
                  setError(null);
                  setMessage(null);
                  try {
                    const specialty = (await addClinicSpecialty(clinic.id, {
                      nameRu,
                      ...(nameEn ? { nameEn } : {}),
                    })) as Specialty;
                    setAddedSpecialties((prev) => [...prev.filter((item) => item.id !== specialty.id), specialty]);
                    setSpecialtyIds((prev) => (prev.includes(specialty.id) ? prev : [...prev, specialty.id]));
                    form.reset();
                    await refresh();
                    setMessage("Направление добавлено в клинику");
                  } catch {
                    setError("Не удалось добавить направление. Проверьте название и попробуйте ещё раз.");
                  } finally {
                    setAddingSpecialty(false);
                  }
                }}
              >
                <div>
                  <p className="text-sm font-bold">Добавить своё направление</p>
                  <p className="mt-1 text-xs text-muted">Оно сразу появится в списке вашей клиники.</p>
                </div>
                <input name="nameRu" required minLength={2} maxLength={120} className="field" placeholder="Название на русском" />
                <input name="nameEn" minLength={2} maxLength={120} className="field" placeholder="Название на английском (необязательно)" />
                <button className="btn btn-ghost text-sm" type="submit" disabled={addingSpecialty}>
                  {addingSpecialty ? "Добавляем…" : "Добавить направление"}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}

        {section === "leadership" ? (
          <form
            className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6"
            onInput={(e) => queueDraftAutosave(e.currentTarget)}
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await save({
                chiefDoctorName: String(fd.get("chiefDoctorName") || "") || null,
                chiefDoctorRoleRu: String(fd.get("chiefDoctorRoleRu") || "") || null,
                chiefDoctorRoleEn: String(fd.get("chiefDoctorRoleEn") || "") || null,
                chiefDoctorPhotoUrl: String(fd.get("chiefDoctorPhotoUrl") || "") || null,
                chiefDoctorBioRu: String(fd.get("chiefDoctorBioRu") || "") || null,
                chiefDoctorBioEn: String(fd.get("chiefDoctorBioEn") || "") || null,
                coordinatorName: String(fd.get("coordinatorName") || "") || null,
                coordinatorRoleRu: String(fd.get("coordinatorRoleRu") || "") || null,
                coordinatorRoleEn: String(fd.get("coordinatorRoleEn") || "") || null,
                leaders: leaders
                  .map((l) => ({
                    ...l,
                    name: l.name.trim(),
                  }))
                  .filter((l) => l.name),
              });
            }}
          >
            <h2 className="text-xl font-extrabold">Руководство</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Главный врач">
                <input name="chiefDoctorName" className="field" defaultValue={clinic.chiefDoctorName || ""} disabled={locked} />
              </Field>
              <Field label="Должность (RU)">
                <input name="chiefDoctorRoleRu" className="field" defaultValue={clinic.chiefDoctorRoleRu || ""} disabled={locked} />
              </Field>
              <Field label="Должность (EN)">
                <input name="chiefDoctorRoleEn" className="field" defaultValue={clinic.chiefDoctorRoleEn || ""} disabled={locked} />
              </Field>
              <Field label="Фото главврача (URL)">
                <input name="chiefDoctorPhotoUrl" className="field" defaultValue={clinic.chiefDoctorPhotoUrl || ""} disabled={locked} />
              </Field>
              <Field label="Координатор">
                <input name="coordinatorName" className="field" defaultValue={clinic.coordinatorName || ""} disabled={locked} />
              </Field>
              <Field label="Роль координатора (RU)">
                <input name="coordinatorRoleRu" className="field" defaultValue={clinic.coordinatorRoleRu || ""} disabled={locked} />
              </Field>
              <Field label="Роль координатора (EN)">
                <input name="coordinatorRoleEn" className="field" defaultValue={clinic.coordinatorRoleEn || ""} disabled={locked} />
              </Field>
            </div>
            {!locked ? (
              <label className="btn btn-ghost w-fit cursor-pointer text-sm">
                Загрузить фото главврача
                <input type="file" accept="image/*" className="hidden" onChange={async (event) => {
                  const input = event.currentTarget;
                  const file = input.files?.[0];
                  if (!file) return;
                  try {
                    const url = await onUpload(file);
                    const photoField = input.form?.elements.namedItem("chiefDoctorPhotoUrl") as HTMLInputElement | null;
                    if (photoField) photoField.value = url;
                    await save({ chiefDoctorPhotoUrl: url });
                  } catch {
                    setError("Ошибка загрузки фото главврача");
                  } finally {
                    input.value = "";
                  }
                }} />
              </label>
            ) : null}
            <Field label="О главном враче (RU)">
              <textarea name="chiefDoctorBioRu" rows={2} className="field" defaultValue={clinic.chiefDoctorBioRu || ""} disabled={locked} />
            </Field>
            <Field label="О главном враче (EN)">
              <textarea name="chiefDoctorBioEn" rows={2} className="field" defaultValue={clinic.chiefDoctorBioEn || ""} disabled={locked} />
            </Field>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-extrabold">Доп. руководители</h3>
                {!locked ? (
                  <button
                    type="button"
                    className="btn btn-ghost text-sm"
                    onClick={() =>
                      setLeaders((prev) => [
                        ...prev,
                        { name: "", roleRu: "", roleEn: "", bioRu: "", photoUrl: null },
                      ])
                    }
                  >
                    + Добавить руководителя
                  </button>
                ) : null}
              </div>
              {leaders.length === 0 ? (
                <p className="text-sm text-muted">Руководители не добавлены</p>
              ) : (
                leaders.map((leader, index) => (
                  <div key={leader.id || `leader-${index}`} className="grid gap-3 rounded-2xl border border-line p-4 md:grid-cols-2">
                    <input
                      className="field"
                      placeholder="ФИО"
                      value={leader.name}
                      disabled={locked}
                      onChange={(e) =>
                        setLeaders((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)),
                        )
                      }
                    />
                    <input
                      className="field"
                      placeholder="Должность RU"
                      value={leader.roleRu || ""}
                      disabled={locked}
                      onChange={(e) =>
                        setLeaders((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, roleRu: e.target.value } : item)),
                        )
                      }
                    />
                    <input
                      className="field"
                      placeholder="Role EN"
                      value={leader.roleEn || ""}
                      disabled={locked}
                      onChange={(e) =>
                        setLeaders((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, roleEn: e.target.value } : item)),
                        )
                      }
                    />
                    <input
                      className="field"
                      placeholder="Фото (URL)"
                      value={leader.photoUrl || ""}
                      disabled={locked}
                      onChange={(e) =>
                        setLeaders((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, photoUrl: e.target.value || null } : item,
                          ),
                        )
                      }
                    />
                    <textarea
                      className="field md:col-span-2"
                      rows={2}
                      placeholder="Краткая информация"
                      value={leader.bioRu || ""}
                      disabled={locked}
                      onChange={(e) =>
                        setLeaders((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, bioRu: e.target.value } : item)),
                        )
                      }
                    />
                    {!locked ? (
                      <div className="flex flex-wrap gap-2 md:col-span-2">
                        <label className="btn btn-ghost cursor-pointer text-sm">
                          Загрузить фото
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const url = await onUpload(file);
                              setLeaders((prev) =>
                                prev.map((item, i) => (i === index ? { ...item, photoUrl: url } : item)),
                              );
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="text-sm font-bold text-danger"
                          onClick={() => setLeaders((prev) => prev.filter((_, i) => i !== index))}
                        >
                          Удалить
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            <FormActions locked={locked} saving={saving} onContinue={markContinue} />
          </form>
        ) : null}

        {section === "doctors" ? (
          <div className="space-y-4">
            <div className="soft-card rounded-[1.5rem] bg-white p-6">
              <h2 className="text-xl font-extrabold">Специалисты</h2>
              <ul className="mt-4 space-y-3">
                {(clinic.doctors || []).map((d) => {
                  const branchNames = (clinic.branches || [])
                    .filter((b) => (d.branchIds || []).includes(b.id))
                    .map((b) => b.nameRu || b.nameEn);
                  return (
                    <li key={d.id} className="flex items-start justify-between gap-3 rounded-xl border border-line p-3">
                      <div className="flex gap-3">
                        {d.photoUrl ? (
                          <img src={d.photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                        ) : (
                          <div className="grid h-12 w-12 place-items-center rounded-xl bg-sand text-sm font-extrabold text-muted">
                            {(d.nameRu || d.nameEn).slice(0, 1)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{d.nameRu || d.nameEn}</p>
                          <p className="text-sm text-muted">{d.roleRu || d.roleEn}</p>
                          {d.category ? (
                            <p className="mt-1 text-xs font-semibold text-primary">категория: {d.category}</p>
                          ) : null}
                          {branchNames.length ? (
                            <p className="mt-1 text-xs text-muted">Филиалы: {branchNames.join(", ")}</p>
                          ) : (
                            <p className="mt-1 text-xs text-muted">Филиалы не назначены</p>
                          )}
                        </div>
                      </div>
                      {!locked ? (
                        <button
                          type="button"
                          className="text-sm font-bold text-danger"
                          onClick={async () => {
                            await deleteClinicDoctor(clinic.id, d.id);
                            await refresh();
                          }}
                        >
                          Удалить
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
            {!locked ? (
              <form
                className="soft-card space-y-3 rounded-[1.5rem] bg-white p-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  const branchIds = fd.getAll("branchIds").map(String);
                  let photoUrl: string | null = String(fd.get("photoUrl") || "") || null;
                  const photoFile = (form.elements.namedItem("photoFile") as HTMLInputElement)?.files?.[0];
                  if (photoFile) {
                    photoUrl = await onUpload(photoFile);
                  }
                  await addClinicDoctor(clinic.id, {
                    nameRu: String(fd.get("nameRu")),
                    nameEn: String(fd.get("nameEn")),
                    roleRu: String(fd.get("roleRu") || ""),
                    roleEn: String(fd.get("roleEn") || ""),
                    category: String(fd.get("category") || "") || undefined,
                    certsRu: String(fd.get("certsRu") || "") || undefined,
                    certsEn: String(fd.get("certsEn") || "") || undefined,
                    continuingEducationRu: String(fd.get("continuingEducationRu") || "") || undefined,
                    internationalExperienceRu: String(fd.get("internationalExperienceRu") || "") || undefined,
                    researchActivityRu: String(fd.get("researchActivityRu") || "") || undefined,
                    awardsRu: String(fd.get("awardsRu") || "") || undefined,
                    achievementsRu: String(fd.get("achievementsRu") || "") || undefined,
                    photoUrl,
                    bioRu: String(fd.get("bioRu") || "") || undefined,
                    experienceYears: fd.get("experienceYears")
                      ? Number(fd.get("experienceYears"))
                      : null,
                    specialtyIds: [String(fd.get("doctorSpecialtyId") || "")].filter(Boolean),
                    branchIds,
                  });
                  form.reset();
                  await refresh();
                  setMessage("Специалист добавлен");
                }}
              >
                <h3 className="font-extrabold">Добавить специалиста</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="nameRu" required placeholder="Имя RU" className="field" />
                  <input name="nameEn" required placeholder="Name EN" className="field" />
                  <input name="roleRu" placeholder="Должность RU" className="field" />
                  <input name="roleEn" placeholder="Role EN" className="field" />
                  <input name="experienceYears" type="number" min={0} placeholder="Стаж, лет" className="field" />
                  <select name="category" className="field" defaultValue="">
                    {DOCTOR_CATEGORIES.map((c) => (
                      <option key={c.value || "none"} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <select name="doctorSpecialtyId" className="field" defaultValue={specialtyIds[0] || ""}>
                    <option value="">Специальность врача</option>
                    {specialties.filter((item) => specialtyIds.includes(item.id)).map((item) => (
                      <option key={item.id} value={item.id}>{item.nameRu || item.nameEn}</option>
                    ))}
                  </select>
                  <input name="photoUrl" className="field md:col-span-2" placeholder="URL фото или загрузите ниже" />
                  <input name="photoFile" type="file" accept="image/*" className="field md:col-span-2" />
                  <textarea name="bioRu" rows={2} className="field md:col-span-2" placeholder="Краткая информация" />
                  <textarea name="certsRu" rows={2} className="field md:col-span-2" placeholder="Сертификаты / квалификация (RU)" />
                  <textarea name="certsEn" rows={2} className="field md:col-span-2" placeholder="Certificates (EN)" />
                  <textarea name="continuingEducationRu" rows={2} className="field md:col-span-2" placeholder="Повышение квалификации" />
                  <textarea name="internationalExperienceRu" rows={2} className="field md:col-span-2" placeholder="Международный опыт" />
                  <textarea name="researchActivityRu" rows={2} className="field md:col-span-2" placeholder="Научная деятельность" />
                  <textarea name="awardsRu" rows={2} className="field md:col-span-2" placeholder="Награды" />
                  <textarea name="achievementsRu" rows={2} className="field md:col-span-2" placeholder="Достижения" />
                </div>
                {(clinic.branches || []).length ? (
                  <fieldset>
                    <legend className="text-sm font-bold">Филиалы</legend>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {(clinic.branches || []).map((b) => (
                        <label key={b.id} className="flex items-center gap-2 text-sm font-semibold">
                          <input type="checkbox" name="branchIds" value={b.id} />
                          {b.nameRu || b.nameEn}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : (
                  <p className="text-sm text-muted">Сначала добавьте филиал — потом можно привязать специалиста.</p>
                )}
                <button className="btn btn-primary text-sm" type="submit">
                  Добавить
                </button>
              </form>
            ) : null}
            {!locked ? (
              <button type="button" className="btn btn-ghost text-sm" onClick={goNext}>
                Сохранить и продолжить
              </button>
            ) : null}
          </div>
        ) : null}

        {section === "equipment" ? (
          <div className="space-y-4">
            <div className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6">
              <h2 className="text-xl font-extrabold">Оснащение и сертификаты</h2>
              <div>
                <h3 className="font-bold">Оборудование</h3>
                <ul className="mt-2 space-y-2">
                  {(clinic.equipment || []).map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        {item.photoUrl ? (
                          <img src={item.photoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        ) : null}
                        {item.nameRu || item.nameEn}
                        {item.manufacturer ? ` · ${item.manufacturer}` : ""}
                      </span>
                      {!locked ? (
                        <button
                          type="button"
                          className="font-bold text-danger"
                          onClick={async () => {
                            await deleteClinicEquipment(clinic.id, item.id);
                            await refresh();
                          }}
                        >
                          Удалить
                        </button>
                      ) : null}
                    </li>
                  ))}
                  {!clinic.equipment?.length ? (
                    <li className="text-sm text-muted">Оборудование не добавлено</li>
                  ) : null}
                </ul>
              </div>
              <div>
                <h3 className="font-bold">Технологии и методики</h3>
                <ul className="mt-2 space-y-2">
                  {(clinic.technologies || []).map((item) => (
                    <li key={item.id || item.nameRu} className="flex justify-between gap-3 text-sm">
                      <span>{item.nameRu || item.nameEn}</span>
                      {!locked ? (
                        <button
                          type="button"
                          className="font-bold text-danger"
                          onClick={async () => {
                            const next = (clinic.technologies || []).filter(
                              (t) => (t.id || t.nameRu) !== (item.id || item.nameRu),
                            );
                            await save({ technologies: next });
                          }}
                        >
                          Удалить
                        </button>
                      ) : null}
                    </li>
                  ))}
                  {!clinic.technologies?.length ? (
                    <li className="text-sm text-muted">Технологии не добавлены</li>
                  ) : null}
                </ul>
              </div>
              <div>
                <h3 className="font-bold">Сертификаты</h3>
                <ul className="mt-2 space-y-2">
                  {(clinic.certificates || []).map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        ) : null}
                        {item.nameRu || item.nameEn}
                        {item.year ? ` (${item.year})` : ""}
                        {item.validUntil ? ` · до ${item.validUntil}` : ""}
                        {item.fileUrl ? (
                          <>
                            {" "}
                            <a href={item.fileUrl} className="font-bold text-primary" target="_blank" rel="noreferrer">
                              файл
                            </a>
                          </>
                        ) : null}
                      </span>
                      {!locked ? (
                        <button
                          type="button"
                          className="font-bold text-danger"
                          onClick={async () => {
                            await deleteClinicCertificate(clinic.id, item.id);
                            await refresh();
                          }}
                        >
                          Удалить
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {!locked ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <form
                  className="soft-card space-y-3 rounded-[1.5rem] bg-white p-5"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const fd = new FormData(form);
                    let photoUrl: string | null = String(fd.get("photoUrl") || "") || null;
                    const photoFile = (form.elements.namedItem("photoFile") as HTMLInputElement)?.files?.[0];
                    if (photoFile) photoUrl = await onUpload(photoFile);
                    await addClinicEquipment(clinic.id, {
                      nameRu: String(fd.get("nameRu")),
                      nameEn: String(fd.get("nameEn")),
                      manufacturer: String(fd.get("manufacturer") || ""),
                      descriptionRu: String(fd.get("descriptionRu") || ""),
                      photoUrl,
                    });
                    form.reset();
                    await refresh();
                  }}
                >
                  <h3 className="font-extrabold">+ Оборудование</h3>
                  <input name="nameRu" required className="field" placeholder="Название RU" />
                  <input name="nameEn" required className="field" placeholder="Name EN" />
                  <input name="manufacturer" className="field" placeholder="Производитель" />
                  <input name="descriptionRu" className="field" placeholder="Описание" />
                  <input name="photoUrl" className="field" placeholder="Фото URL" />
                  <input name="photoFile" type="file" accept="image/*" className="field" />
                  <button className="btn btn-primary text-sm" type="submit">
                    Добавить
                  </button>
                </form>
                <form
                  className="soft-card space-y-3 rounded-[1.5rem] bg-white p-5"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const nameRu = String(fd.get("nameRu") || "").trim();
                    if (!nameRu) return;
                    const next = [
                      ...(clinic.technologies || []),
                      {
                        nameRu,
                        nameEn: String(fd.get("nameEn") || "") || nameRu,
                        descriptionRu: String(fd.get("descriptionRu") || ""),
                        descriptionEn: String(fd.get("descriptionEn") || ""),
                      },
                    ];
                    await save({ technologies: next });
                    e.currentTarget.reset();
                  }}
                >
                  <h3 className="font-extrabold">+ Технология</h3>
                  <input name="nameRu" required className="field" placeholder="Название RU" />
                  <input name="nameEn" className="field" placeholder="Name EN" />
                  <input name="descriptionRu" className="field" placeholder="Описание" />
                  <button className="btn btn-primary text-sm" type="submit">
                    Добавить
                  </button>
                </form>
                <form
                  className="soft-card space-y-3 rounded-[1.5rem] bg-white p-5"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const fd = new FormData(form);
                    let fileUrl: string | null = null;
                    let imageUrl: string | null = null;
                    const file = (form.elements.namedItem("file") as HTMLInputElement)?.files?.[0];
                    const logo = (form.elements.namedItem("logo") as HTMLInputElement)?.files?.[0];
                    if (file) fileUrl = await onUpload(file);
                    if (logo) imageUrl = await onUpload(logo);
                    await addClinicCertificate(clinic.id, {
                      nameRu: String(fd.get("nameRu")),
                      nameEn: String(fd.get("nameEn")),
                      issuerRu: String(fd.get("issuerRu") || ""),
                      year: fd.get("year") ? Number(fd.get("year")) : null,
                      receivedAt: String(fd.get("receivedAt") || "") || null,
                      validUntil: String(fd.get("validUntil") || "") || null,
                      fileUrl,
                      imageUrl,
                    });
                    form.reset();
                    await refresh();
                  }}
                >
                  <h3 className="font-extrabold">+ Сертификат</h3>
                  <input name="nameRu" required className="field" placeholder="Название RU" />
                  <input name="nameEn" required className="field" placeholder="Name EN" />
                  <input name="issuerRu" className="field" placeholder="Кем выдан" />
                  <label className="text-sm font-semibold">Дата получения<input name="receivedAt" type="date" className="field mt-1" /></label>
                  <label className="text-sm font-semibold">Срок действия<input name="validUntil" type="date" className="field mt-1" /></label>
                  <input name="logo" type="file" accept="image/*" className="field" title="Логотип" />
                  <input name="file" type="file" accept="image/*,application/pdf" className="field" title="Файл" />
                  <button className="btn btn-primary text-sm" type="submit">
                    Добавить
                  </button>
                </form>
              </div>
            ) : null}
            {!locked ? (
              <button type="button" className="btn btn-ghost text-sm" onClick={goNext}>
                Сохранить и продолжить
              </button>
            ) : null}
          </div>
        ) : null}

        {section === "contacts" ? (
          <form
            className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6"
            onInput={(e) => queueDraftAutosave(e.currentTarget)}
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await save({
                addressRu: clinicAddressRu,
                addressEn: String(fd.get("addressEn")),
                lat: clinicCoords.lat,
                lng: clinicCoords.lng,
                phone: String(fd.get("phone")),
                email: String(fd.get("email")),
                website: String(fd.get("website") || "") || null,
                whatsapp: String(fd.get("whatsapp") || "") || null,
                telegram: String(fd.get("telegram") || "") || null,
                instagram: String(fd.get("instagram") || "") || null,
                youtube: String(fd.get("youtube") || "") || null,
                socials: socials.filter((item) => item.label.trim() && item.url.trim()),
                responseHours: Number(fd.get("responseHours") || 24),
                languages,
              });
            }}
          >
            <h2 className="text-xl font-extrabold">Контакты</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Адрес (RU)">
                <div className="space-y-1.5">
                  <input
                    name="addressRu"
                    required
                    className="field"
                    value={clinicAddressRu}
                    disabled={locked}
                    onChange={(event) => setClinicAddressRu(event.target.value)}
                  />
                  <AddressMapSearchButton
                    address={clinicAddressRu.trim() ? `${clinicAddressRu}, ${displayCity(clinic.city)}` : clinicAddressRu}
                    disabled={locked}
                    onFound={({ lat, lng }) => setClinicCoords({ lat, lng })}
                  />
                </div>
              </Field>
              <Field label="Адрес (EN)">
                <input name="addressEn" required className="field" defaultValue={clinic.addressEn} disabled={locked} />
              </Field>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-bold">Точка клиники на карте <span className="font-medium text-muted">(необязательно)</span></p>
                <p className="text-sm text-muted">Нажмите на карту или перетащите метку. Изменения сохраняются кнопкой «Сохранить».</p>
                <BranchMap
                  mode={locked ? "view" : "pick"}
                  lat={clinicCoords.lat}
                  lng={clinicCoords.lng}
                  onPick={({ lat, lng }) => setClinicCoords({ lat, lng })}
                />
                <p className="text-xs text-muted">
                  {clinicCoords.lat != null && clinicCoords.lng != null
                    ? `Выбрано: ${clinicCoords.lat.toFixed(6)}, ${clinicCoords.lng.toFixed(6)}`
                    : "Точка пока не выбрана"}
                </p>
              </div>
              <Field label="Телефон">
                <input name="phone" required className="field" defaultValue={clinic.phone} disabled={locked} />
              </Field>
              <Field label="Email">
                <input name="email" type="email" required className="field" defaultValue={clinic.email} disabled={locked} />
              </Field>
              <Field label="Сайт">
                <input name="website" className="field" defaultValue={clinic.website || ""} disabled={locked} />
              </Field>
              <Field label="WhatsApp">
                <input name="whatsapp" className="field" defaultValue={clinic.whatsapp || ""} disabled={locked} />
              </Field>
              <Field label="Telegram">
                <input name="telegram" className="field" defaultValue={clinic.telegram || ""} disabled={locked} />
              </Field>
              <Field label="Instagram">
                <input name="instagram" className="field" defaultValue={clinic.instagram || ""} disabled={locked} />
              </Field>
              <Field label="YouTube">
                <input name="youtube" className="field" defaultValue={clinic.youtube || ""} disabled={locked} />
              </Field>
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">Другие социальные сети</span>
                  {!locked ? <button type="button" className="btn btn-ghost text-sm" onClick={() => setSocials((items) => [...items, { label: "", url: "" }])}>Добавить</button> : null}
                </div>
                {socials.map((item, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
                    <input className="field" value={item.label} disabled={locked} aria-label="Название социальной сети" placeholder="Название" onChange={(event) => setSocials((items) => items.map((current, i) => i === index ? { ...current, label: event.target.value } : current))} />
                    <input className="field" value={item.url} disabled={locked} aria-label="Ссылка на социальную сеть" placeholder="Ссылка" onChange={(event) => setSocials((items) => items.map((current, i) => i === index ? { ...current, url: event.target.value } : current))} />
                    {!locked ? <button type="button" className="text-sm font-bold text-danger" aria-label="Удалить социальную сеть" onClick={() => setSocials((items) => items.filter((_, i) => i !== index))}>Удалить</button> : null}
                  </div>
                ))}
              </div>
              <Field label="Время ответа (ч)">
                <input
                  name="responseHours"
                  type="number"
                  min={1}
                  max={168}
                  className="field"
                  defaultValue={clinic.responseHours}
                  disabled={locked}
                />
              </Field>
            </div>
            <fieldset disabled={locked}>
              <legend className="text-sm font-bold">Языки</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {LANGS.map((code) => (
                  <label key={code} className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={languages.includes(code)}
                      onChange={(e) =>
                        setLanguages((prev) =>
                          e.target.checked ? [...prev, code] : prev.filter((x) => x !== code),
                        )
                      }
                    />
                    {code}
                  </label>
                ))}
              </div>
            </fieldset>
            <FormActions locked={locked} saving={saving} onContinue={markContinue} />
          </form>
        ) : null}

        {section === "photos" ? (
          <div className="space-y-4">
            <div className="soft-card rounded-[1.5rem] bg-white p-6">
              <h2 className="text-xl font-extrabold">Фотографии</h2>
              <p className="mt-1 text-sm text-muted">
                Первое фото — обложка публичной страницы. Меняйте порядок стрелками или назначьте
                главную.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(clinic.photos || []).map((photo, index) => (
                  <div key={photo.id} className="overflow-hidden rounded-xl border border-line">
                    <div className="relative">
                      <img src={photo.url} alt="" className="aspect-video w-full object-cover" />
                      {index === 0 ? (
                        <span className="absolute left-2 top-2 rounded-lg bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Главная
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2 p-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-muted">{photo.category}</span>
                        {!locked ? (
                          <button
                            type="button"
                            className="font-bold text-danger"
                            onClick={async () => {
                              await deleteClinicPhoto(clinic.id, photo.id);
                              await refresh();
                            }}
                          >
                            Удалить
                          </button>
                        ) : null}
                      </div>
                      {!locked ? (
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="rounded-lg border border-line px-2 py-1 font-bold disabled:opacity-40"
                            disabled={index === 0}
                            title="Выше"
                            onClick={async () => {
                              const ids = (clinic.photos || []).map((p) => p.id);
                              const next = [...ids];
                              [next[index - 1], next[index]] = [next[index], next[index - 1]];
                              await reorderClinicPhotos(clinic.id, next);
                              await refresh();
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-line px-2 py-1 font-bold disabled:opacity-40"
                            disabled={index >= (clinic.photos?.length || 0) - 1}
                            title="Ниже"
                            onClick={async () => {
                              const ids = (clinic.photos || []).map((p) => p.id);
                              const next = [...ids];
                              [next[index], next[index + 1]] = [next[index + 1], next[index]];
                              await reorderClinicPhotos(clinic.id, next);
                              await refresh();
                            }}
                          >
                            ↓
                          </button>
                          {index !== 0 ? (
                            <button
                              type="button"
                              className="rounded-lg border border-line px-2 py-1 font-bold text-primary"
                              onClick={async () => {
                                await setClinicMainPhoto(clinic.id, photo.id);
                                await refresh();
                                setMessage("Главное фото обновлено");
                              }}
                            >
                              Главная
                            </button>
                          ) : null}
                          <label className="cursor-pointer rounded-lg border border-line px-2 py-1 font-bold text-primary">
                            Заменить
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const url = await onUpload(file);
                                await replaceClinicPhoto(clinic.id, photo.id, { url });
                                await refresh();
                                setMessage("Фото заменено");
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {!locked ? (
              <form
                className="soft-card space-y-3 rounded-[1.5rem] bg-white p-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement)
                    ?.files?.[0];
                  if (!file) return;
                  const url = await onUpload(file);
                  await addClinicPhoto(clinic.id, {
                    url,
                    category: String(fd.get("category") || "other"),
                    altRu: String(fd.get("altRu") || ""),
                  });
                  e.currentTarget.reset();
                  await refresh();
                  setMessage("Фото добавлено");
                }}
              >
                <h3 className="font-extrabold">Загрузить фото</h3>
                <select name="category" className="field" defaultValue="other">
                  {PHOTO_CATS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input name="altRu" className="field" placeholder="Подпись" />
                <input name="file" type="file" accept="image/*" required className="field" />
                <button className="btn btn-primary text-sm" type="submit">
                  Загрузить
                </button>
              </form>
            ) : null}
            {!locked ? (
              <button type="button" className="btn btn-ghost text-sm" onClick={goNext}>
                Сохранить и продолжить
              </button>
            ) : null}
          </div>
        ) : null}

        {section === "extra" ? (
          <form
            className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6"
            onInput={(e) => queueDraftAutosave(e.currentTarget)}
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await save({
                whyChooseRu: String(fd.get("whyChooseRu") || "") || null,
                whyChooseEn: String(fd.get("whyChooseEn") || "") || null,
                popularServicesRu: String(fd.get("popularServicesRu") || "") || null,
                popularServicesEn: String(fd.get("popularServicesEn") || "") || null,
                developmentPlansRu: String(fd.get("developmentPlansRu") || "") || null,
                developmentPlansEn: String(fd.get("developmentPlansEn") || "") || null,
                medicalTourism: fd.get("medicalTourism") === "on",
                medicalTourismRu: String(fd.get("medicalTourismRu") || "") || null,
                medicalTourismEn: String(fd.get("medicalTourismEn") || "") || null,
              });
            }}
          >
            <h2 className="text-xl font-extrabold">Дополнительно</h2>
            <Field label="Почему выбирают (RU)">
              <textarea name="whyChooseRu" rows={3} className="field" defaultValue={clinic.whyChooseRu || ""} disabled={locked} />
            </Field>
            <Field label="Почему выбирают (EN)">
              <textarea name="whyChooseEn" rows={3} className="field" defaultValue={clinic.whyChooseEn || ""} disabled={locked} />
            </Field>
            <Field label="Популярные услуги (RU)">
              <textarea name="popularServicesRu" rows={2} className="field" defaultValue={clinic.popularServicesRu || ""} disabled={locked} />
            </Field>
            <Field label="Популярные услуги (EN)">
              <textarea name="popularServicesEn" rows={2} className="field" defaultValue={clinic.popularServicesEn || ""} disabled={locked} />
            </Field>
            <Field label="Планы развития (RU)">
              <textarea name="developmentPlansRu" rows={2} className="field" defaultValue={clinic.developmentPlansRu || ""} disabled={locked} />
            </Field>
            <Field label="Планы развития (EN)">
              <textarea name="developmentPlansEn" rows={2} className="field" defaultValue={clinic.developmentPlansEn || ""} disabled={locked} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                name="medicalTourism"
                defaultChecked={clinic.medicalTourism}
                disabled={locked}
              />
              Медицинский туризм
            </label>
            <Field label="Медтуризм — описание (RU)">
              <textarea name="medicalTourismRu" rows={2} className="field" defaultValue={clinic.medicalTourismRu || ""} disabled={locked} />
            </Field>
            <Field label="Медтуризм — описание (EN)">
              <textarea name="medicalTourismEn" rows={2} className="field" defaultValue={clinic.medicalTourismEn || ""} disabled={locked} />
            </Field>
            <FormActions locked={locked} saving={saving} onContinue={markContinue} />
          </form>
        ) : null}

        {section === "preview" ? <ClinicPreview clinic={clinic} /> : null}

        {section === "branches" ? (
          <div className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6">
            <h2 className="text-xl font-extrabold">Филиалы</h2>
            <p className="text-sm text-muted">
              Для модерации нужен хотя бы один филиал с адресом и телефоном.
            </p>
            {(clinic.branches || []).length === 0 ? (
              <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm">Филиалы ещё не добавлены.</p>
            ) : (
              <ul className="space-y-2">
                {clinic.branches!.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-extrabold">{b.nameRu || b.nameEn}</p>
                      <p className="text-muted">
                        {b.city}
                        {b.phone ? ` · ${b.phone}` : ""}
                        {b.addressRu ? ` · ${b.addressRu}` : ""}
                      </p>
                    </div>
                    <a
                      href={`/cabinet/clinics/${clinic.id}/branches/${b.id}`}
                      className="font-bold text-primary"
                    >
                      Редактировать
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <a
              href={`/cabinet/clinics/${clinic.id}/branches`}
              className="btn btn-primary inline-flex text-sm"
            >
              Управление филиалами
            </a>
          </div>
        ) : null}

        {section === "moderation" ? (
          <div className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6">
            <h2 className="text-xl font-extrabold">Перед модерацией</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              <li>Проверьте название, логотип и описание</li>
              <li>Выберите направления</li>
              <li>Добавьте хотя бы один филиал с адресом и телефоном</li>
              <li>Откройте «Предпросмотр» и сверьте с публичной страницей</li>
              <li>Кнопка «Отправить на модерацию» — в шапке страницы клиники</li>
            </ul>
            {clinic.moderatorNote ? (
              <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                Комментарий модератора: {clinic.moderatorNote}
              </p>
            ) : null}
            <p className="text-sm font-semibold text-muted">Текущий статус: {clinic.status}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
