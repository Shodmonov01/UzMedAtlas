import { useEffect, useMemo, useState } from "react";
import type { CabinetDoctor } from "@/shared/api/cabinet";
import { addClinicDoctor, setBranchDoctors } from "@/shared/api/cabinet";

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
          <h3 className="font-extrabold">+ Создать специалиста</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <input name="nameRu" required className="field" placeholder="Имя RU" />
            <input name="nameEn" required className="field" placeholder="Name EN" />
            <input name="roleRu" className="field" placeholder="Должность RU" />
            <input name="roleEn" className="field" placeholder="Role EN" />
            <input name="experienceYears" type="number" min={0} className="field" placeholder="Стаж, лет" />
            <select name="category" className="field" defaultValue=""><option value="">Категория</option><option value="highest">Высшая</option><option value="first">Первая</option><option value="second">Вторая</option><option value="other">Другая</option></select>
            <select name="specialtyId" className="field" defaultValue={specialtyIds[0] || ""}><option value="">Специальность</option>{specialtyOptions.filter((specialty) => specialtyIds.includes(specialty.id)).map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.nameRu || specialty.nameEn}</option>)}</select>
            <input name="photoUrl" className="field md:col-span-2" placeholder="Ссылка на фото" />
            {onUpload ? <input name="photoFile" type="file" accept="image/*" className="field md:col-span-2" /> : null}
            <textarea name="bioRu" rows={2} className="field md:col-span-2" placeholder="Краткая информация" />
            <textarea name="certsRu" rows={2} className="field md:col-span-2" placeholder="Сертификаты" />
            <textarea name="continuingEducationRu" rows={2} className="field md:col-span-2" placeholder="Повышение квалификации" />
            <textarea name="internationalExperienceRu" rows={2} className="field md:col-span-2" placeholder="Международный опыт" />
            <textarea name="researchActivityRu" rows={2} className="field md:col-span-2" placeholder="Научная деятельность" />
            <textarea name="awardsRu" rows={2} className="field md:col-span-2" placeholder="Награды" />
            <textarea name="achievementsRu" rows={2} className="field md:col-span-2" placeholder="Достижения" />
          </div>
          <button type="submit" className="btn btn-primary text-sm">
            Создать
          </button>
        </form>
      ) : null}
    </div>
  );
}
