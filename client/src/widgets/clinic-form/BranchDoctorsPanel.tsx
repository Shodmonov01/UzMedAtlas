import { useEffect, useMemo, useState } from "react";
import type { CabinetDoctor } from "@/shared/api/cabinet";
import { addClinicDoctor, setBranchDoctors } from "@/shared/api/cabinet";

type Props = {
  clinicId: string;
  branchId: string;
  clinicDoctors: CabinetDoctor[];
  branchDoctorIds: string[];
  specialtyIds: string[];
  locked?: boolean;
  onChanged: () => Promise<void>;
};

export function BranchDoctorsPanel({
  clinicId,
  branchId,
  clinicDoctors,
  branchDoctorIds,
  specialtyIds,
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
              await addClinicDoctor(clinicId, {
                nameRu: String(fd.get("nameRu")),
                nameEn: String(fd.get("nameEn")),
                roleRu: String(fd.get("roleRu") || ""),
                roleEn: String(fd.get("roleEn") || ""),
                experienceYears: fd.get("experienceYears") ? Number(fd.get("experienceYears")) : null,
                specialtyIds: specialtyIds.slice(0, 1),
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
          </div>
          <button type="submit" className="btn btn-primary text-sm">
            Создать
          </button>
        </form>
      ) : null}
    </div>
  );
}
