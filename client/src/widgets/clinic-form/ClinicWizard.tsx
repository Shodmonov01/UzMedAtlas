import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Specialty } from "@/shared/api/client";
import {
  addClinicCertificate,
  addClinicDoctor,
  addClinicEquipment,
  addClinicPhoto,
  deleteClinicCertificate,
  deleteClinicDoctor,
  deleteClinicEquipment,
  deleteClinicPhoto,
  updateCabinetClinic,
  uploadCabinetFile,
  WIZARD_SECTIONS,
  type CabinetClinic,
  type ClinicFormPayload,
  type WizardSectionId,
} from "@/shared/api/cabinet";
import { ClinicPreview } from "./ClinicPreview";

const CITIES = [
  { value: "tashkent", label: "Ташкент" },
  { value: "samarkand", label: "Самарканд" },
  { value: "bukhara", label: "Бухара" },
];
const LANGS = ["ru", "en", "uz", "kz", "tr", "ar"];
const PHOTO_CATS = [
  { value: "facade", label: "Фасад" },
  { value: "reception", label: "Ресепшен" },
  { value: "hall", label: "Холл" },
  { value: "rooms", label: "Кабинеты" },
  { value: "or", label: "Операционная" },
  { value: "equipment", label: "Оборудование" },
  { value: "staff", label: "Сотрудники" },
  { value: "other", label: "Другое" },
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

export function ClinicWizard({ clinic, specialties, locked, onSaved, initialSection }: Props) {
  const qc = useQueryClient();
  const [section, setSection] = useState<WizardSectionId>(initialSection || "basic");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState(clinic.languages?.length ? clinic.languages : ["ru", "en"]);
  const [specialtyIds, setSpecialtyIds] = useState(clinic.specialtyIds || []);

  async function save(payload: ClinicFormPayload) {
    if (locked) return;
    setSaving(true);
    setError(null);
    try {
      await updateCabinetClinic(clinic.id, payload);
      setMessage("Сохранено");
      await onSaved();
    } catch {
      setMessage(null);
      setError("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

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
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await save({
                nameRu: String(fd.get("nameRu")),
                nameEn: String(fd.get("nameEn")),
                shortName: String(fd.get("shortName") || "") || null,
                foundedYear: fd.get("foundedYear") ? Number(fd.get("foundedYear")) : null,
                slug: String(fd.get("slug") || "") || undefined,
                city: String(fd.get("city")),
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
                <select name="city" className="field" defaultValue={clinic.city} disabled={locked}>
                  {CITIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
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
                <button className="btn btn-primary text-sm" type="submit" disabled={saving}>
                  {saving ? "…" : "Сохранить"}
                </button>
                <label className="btn btn-ghost cursor-pointer text-sm">
                  Загрузить лого
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await onUpload(file);
                        await save({ logoUrl: url });
                      } catch {
                        setError("Ошибка загрузки");
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
            {!locked ? (
              <button className="btn btn-primary text-sm" type="submit" disabled={saving}>
                Сохранить
              </button>
            ) : null}
          </form>
        ) : null}

        {section === "directions" ? (
          <div className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6">
            <h2 className="text-xl font-extrabold">Направления</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {specialties.map((item) => {
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
              <button
                type="button"
                className="btn btn-primary text-sm"
                disabled={saving}
                onClick={() => save({ specialtyIds })}
              >
                Сохранить направления
              </button>
            ) : null}
          </div>
        ) : null}

        {section === "leadership" ? (
          <form
            className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await save({
                chiefDoctorName: String(fd.get("chiefDoctorName") || "") || null,
                chiefDoctorRoleRu: String(fd.get("chiefDoctorRoleRu") || "") || null,
                chiefDoctorRoleEn: String(fd.get("chiefDoctorRoleEn") || "") || null,
                chiefDoctorPhotoUrl: String(fd.get("chiefDoctorPhotoUrl") || "") || null,
                coordinatorName: String(fd.get("coordinatorName") || "") || null,
                coordinatorRoleRu: String(fd.get("coordinatorRoleRu") || "") || null,
                coordinatorRoleEn: String(fd.get("coordinatorRoleEn") || "") || null,
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
              <button className="btn btn-primary text-sm" type="submit" disabled={saving}>
                Сохранить
              </button>
            ) : null}
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
                      <div>
                        <p className="font-bold">{d.nameRu || d.nameEn}</p>
                        <p className="text-sm text-muted">{d.roleRu || d.roleEn}</p>
                        {branchNames.length ? (
                          <p className="mt-1 text-xs text-muted">Филиалы: {branchNames.join(", ")}</p>
                        ) : (
                          <p className="mt-1 text-xs text-muted">Филиалы не назначены</p>
                        )}
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
                  const fd = new FormData(e.currentTarget);
                  const branchIds = fd.getAll("branchIds").map(String);
                  await addClinicDoctor(clinic.id, {
                    nameRu: String(fd.get("nameRu")),
                    nameEn: String(fd.get("nameEn")),
                    roleRu: String(fd.get("roleRu") || ""),
                    roleEn: String(fd.get("roleEn") || ""),
                    experienceYears: fd.get("experienceYears")
                      ? Number(fd.get("experienceYears"))
                      : null,
                    specialtyIds: specialtyIds.slice(0, 1),
                    branchIds,
                  });
                  e.currentTarget.reset();
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
                      <span>{item.nameRu || item.nameEn}</span>
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
                </ul>
              </div>
              <div>
                <h3 className="font-bold">Сертификаты</h3>
                <ul className="mt-2 space-y-2">
                  {(clinic.certificates || []).map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 text-sm">
                      <span>
                        {item.nameRu || item.nameEn}
                        {item.year ? ` (${item.year})` : ""}
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
              <div className="grid gap-4 md:grid-cols-2">
                <form
                  className="soft-card space-y-3 rounded-[1.5rem] bg-white p-5"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    await addClinicEquipment(clinic.id, {
                      nameRu: String(fd.get("nameRu")),
                      nameEn: String(fd.get("nameEn")),
                      descriptionRu: String(fd.get("descriptionRu") || ""),
                    });
                    e.currentTarget.reset();
                    await refresh();
                  }}
                >
                  <h3 className="font-extrabold">+ Оборудование</h3>
                  <input name="nameRu" required className="field" placeholder="Название RU" />
                  <input name="nameEn" required className="field" placeholder="Name EN" />
                  <input name="descriptionRu" className="field" placeholder="Описание" />
                  <button className="btn btn-primary text-sm" type="submit">
                    Добавить
                  </button>
                </form>
                <form
                  className="soft-card space-y-3 rounded-[1.5rem] bg-white p-5"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    await addClinicCertificate(clinic.id, {
                      nameRu: String(fd.get("nameRu")),
                      nameEn: String(fd.get("nameEn")),
                      issuerRu: String(fd.get("issuerRu") || ""),
                      year: fd.get("year") ? Number(fd.get("year")) : null,
                    });
                    e.currentTarget.reset();
                    await refresh();
                  }}
                >
                  <h3 className="font-extrabold">+ Сертификат</h3>
                  <input name="nameRu" required className="field" placeholder="Название RU" />
                  <input name="nameEn" required className="field" placeholder="Name EN" />
                  <input name="issuerRu" className="field" placeholder="Кем выдан" />
                  <input name="year" type="number" className="field" placeholder="Год" />
                  <button className="btn btn-primary text-sm" type="submit">
                    Добавить
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        ) : null}

        {section === "contacts" ? (
          <form
            className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await save({
                addressRu: String(fd.get("addressRu")),
                addressEn: String(fd.get("addressEn")),
                phone: String(fd.get("phone")),
                email: String(fd.get("email")),
                website: String(fd.get("website") || "") || null,
                whatsapp: String(fd.get("whatsapp") || "") || null,
                telegram: String(fd.get("telegram") || "") || null,
                instagram: String(fd.get("instagram") || "") || null,
                responseHours: Number(fd.get("responseHours") || 24),
                languages,
              });
            }}
          >
            <h2 className="text-xl font-extrabold">Контакты</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Адрес (RU)">
                <input name="addressRu" required className="field" defaultValue={clinic.addressRu} disabled={locked} />
              </Field>
              <Field label="Адрес (EN)">
                <input name="addressEn" required className="field" defaultValue={clinic.addressEn} disabled={locked} />
              </Field>
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
            {!locked ? (
              <button className="btn btn-primary text-sm" type="submit" disabled={saving}>
                Сохранить
              </button>
            ) : null}
          </form>
        ) : null}

        {section === "photos" ? (
          <div className="space-y-4">
            <div className="soft-card rounded-[1.5rem] bg-white p-6">
              <h2 className="text-xl font-extrabold">Фотографии</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(clinic.photos || []).map((photo) => (
                  <div key={photo.id} className="overflow-hidden rounded-xl border border-line">
                    <img src={photo.url} alt="" className="aspect-video w-full object-cover" />
                    <div className="flex items-center justify-between gap-2 p-2 text-xs">
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
          </div>
        ) : null}

        {section === "extra" ? (
          <form
            className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6"
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
            {!locked ? (
              <button className="btn btn-primary text-sm" type="submit" disabled={saving}>
                Сохранить
              </button>
            ) : null}
          </form>
        ) : null}

        {section === "preview" ? <ClinicPreview clinic={clinic} /> : null}
      </div>
    </div>
  );
}
