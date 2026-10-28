import { useEffect, useMemo, useState } from "react";
import type { CabinetDoctor } from "@/shared/api/cabinet";
import { addClinicDoctor, setBranchDoctors } from "@/shared/api/cabinet";
import { Field, FormGroup } from "./FormField";

type Props = {
  clinicId: string;
  branchId: string;
  clinicDoctors: CabinetDoctor[];
  branchDoctorIds: string[];
  specialtyIds: string[];
  specialtyOptions: { id: string; nameRu: string; nameEn: string }[];
  onUpload?: (file: File) => Promise<string>;
  locked?: boolean;
  onChanged: () => Promise<void>;
};

export function BranchDoctorsPanel({
  clinicId,
  branchId,
  clinicDoctors,
  branchDoctorIds,
  specialtyIds,
  specialtyOptions,
  onUpload,
  locked,
  onChanged,
}: Props) {
  const [selected, setSelected] = useState<string[]>(branchDoctorIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedKey = useMemo(() => branchDoctorIds.slice().sort().join(","), [branchDoctorIds]);
  const localKey = useMemo(() => selected.slice().sort().join(","), [selected]);
  const dirty = selectedKey !== localKey;

  useEffect(() => {
    setSelected(branchDoctorIds);
  }, [selectedKey, branchDoctorIds]);

  return (
    <div className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6">
      <h2 className="text-xl font-extrabold">Специалисты филиала</h2>
      <p className="text-sm text-muted">Отметьте существующих специалистов или создайте нового.</p>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm font-bold text-primary">{message}</p> : null}

      {clinicDoctors.length ? (
        <ul className="space-y-2">
          {clinicDoctors.map((doctor) => (
            <li key={doctor.id}>
              <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  disabled={locked}
                  checked={selected.includes(doctor.id)}
                  onChange={(e) => {
                    setSelected((prev) =>
                      e.target.checked ? [...prev, doctor.id] : prev.filter((x) => x !== doctor.id),
                    );
                  }}
                />
                <span>
                  <span className="block font-bold">{doctor.nameRu || doctor.nameEn}</span>
                  <span className="text-muted">{doctor.roleRu || doctor.roleEn}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">В клинике пока нет специалистов.</p>
      )}

      {!locked && dirty ? (
        <button
          type="button"
          className="btn btn-primary text-sm"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              await setBranchDoctors(clinicId, branchId, selected);
              setMessage("Привязка специалистов сохранена");
              await onChanged();
            } catch {
              setError("Не удалось сохранить привязку");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Сохранение…" : "Сохранить привязку"}
        </button>
      ) : null}

      {!locked ? (
        <form
          className="space-y-3 border-t border-line pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const form = e.currentTarget;
            const fd = new FormData(form);
            try {
              const photoFile = (form.elements.namedItem("photoFile") as HTMLInputElement)?.files?.[0];
              const photoUrl = photoFile && onUpload
                ? await onUpload(photoFile)
                : String(fd.get("photoUrl") || "") || null;
              await addClinicDoctor(clinicId, {
                nameRu: String(fd.get("nameRu")),
                nameEn: String(fd.get("nameEn")),
                roleRu: String(fd.get("roleRu") || ""),
                roleEn: String(fd.get("roleEn") || ""),
                category: String(fd.get("category") || ""),
                bioRu: String(fd.get("bioRu") || ""),
                certsRu: String(fd.get("certsRu") || ""),
                continuingEducationRu: String(fd.get("continuingEducationRu") || ""),
                internationalExperienceRu: String(fd.get("internationalExperienceRu") || ""),
                researchActivityRu: String(fd.get("researchActivityRu") || ""),
                awardsRu: String(fd.get("awardsRu") || ""),
                achievementsRu: String(fd.get("achievementsRu") || ""),
                photoUrl,
                experienceYears: fd.get("experienceYears") ? Number(fd.get("experienceYears")) : null,
                specialtyIds: [String(fd.get("specialtyId") || "")].filter(Boolean),
                branchIds: [branchId],
              });
              form.reset();
              setMessage("Специалист создан и привязан к филиалу");
              await onChanged();
            } catch {
              setError("Не удалось создать специалиста");
            }
          }}
        >
          <div>
            <h3 className="font-extrabold">Новый специалист</h3>
            <p className="mt-1 text-sm text-muted">Его не было в списке выше? Создайте — он сразу появится в этом филиале. Поля со звёздочкой обязательны.</p>
          </div>
          <FormGroup title="Кто это">
            <Field label="Имя и фамилия (RU) *">
              <input name="nameRu" required className="field" placeholder="Например, Алишер Рахимов" />
            </Field>
            <Field label="Имя и фамилия (EN) *">
              <input name="nameEn" required className="field" placeholder="For example, Alisher Rakhimov" />
            </Field>
            <Field label="Должность (RU)">
              <input name="roleRu" className="field" placeholder="Например, кардиолог" />
            </Field>
            <Field label="Должность (EN)">
              <input name="roleEn" className="field" placeholder="For example, cardiologist" />
            </Field>
            <Field label="Стаж, лет">
              <input name="experienceYears" type="number" min={0} className="field" placeholder="10" />
            </Field>
            <Field label="Врачебная категория">
              <select name="category" className="field" defaultValue=""><option value="">Без категории</option><option value="highest">Высшая</option><option value="first">Первая</option><option value="second">Вторая</option><option value="other">Другая</option></select>
            </Field>
            <Field label="Специальность" hint="Из направлений клиники">
              <select name="specialtyId" className="field" defaultValue={specialtyIds[0] || ""}><option value="">Не выбрана</option>{specialtyOptions.filter((specialty) => specialtyIds.includes(specialty.id)).map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.nameRu || specialty.nameEn}</option>)}</select>
            </Field>
          </FormGroup>
          <FormGroup title="Фото">
            {onUpload ? (
              <Field label="Загрузить файл" hint="Портрет, лучше квадратный">
                <input name="photoFile" type="file" accept="image/*" className="field" />
              </Field>
            ) : null}
            <Field label={onUpload ? "Или ссылка на фото" : "Ссылка на фото"}>
              <input name="photoUrl" className="field" placeholder="https://…" />
            </Field>
          </FormGroup>
          <FormGroup title="О специалисте">
            <Field label="Кратко о враче" wide>
              <textarea name="bioRu" rows={2} className="field" placeholder="Чем занимается, с какими случаями работает" />
            </Field>
            <Field label="Сертификаты">
              <textarea name="certsRu" rows={2} className="field" />
            </Field>
            <Field label="Повышение квалификации">
              <textarea name="continuingEducationRu" rows={2} className="field" />
            </Field>
            <Field label="Международный опыт">
              <textarea name="internationalExperienceRu" rows={2} className="field" />
            </Field>
            <Field label="Научная деятельность">
              <textarea name="researchActivityRu" rows={2} className="field" />
            </Field>
            <Field label="Награды">
              <textarea name="awardsRu" rows={2} className="field" />
            </Field>
            <Field label="Достижения">
              <textarea name="achievementsRu" rows={2} className="field" />
            </Field>
          </FormGroup>
          <button type="submit" className="btn btn-primary text-sm">
            Создать специалиста
          </button>
        </form>
      ) : null}
    </div>
  );
}
