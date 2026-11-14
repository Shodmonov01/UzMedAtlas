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
      <h2 className="text-xl font-extrabold">Branch doctors</h2>
      <p className="text-sm text-muted">Tick existing doctors or add a new one.</p>
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
        <p className="text-sm text-muted">The clinic has no doctors yet.</p>
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
              setMessage("Doctors saved for this branch");
              await onChanged();
            } catch {
              setError("Could not save the doctors");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving…" : "Save doctors"}
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
              setMessage("Doctor added to this branch");
              await onChanged();
            } catch {
              setError("Could not add the doctor");
            }
          }}
        >
          <div>
            <h3 className="font-extrabold">New doctor</h3>
            <p className="mt-1 text-sm text-muted">Not in the list above? Add them and they appear in this branch right away. Fields with an asterisk are required.</p>
          </div>
          <FormGroup title="Who">
            <Field label="Full name (RU) *">
              <input name="nameRu" required className="field" placeholder="e.g. Алишер Рахимов" />
            </Field>
            <Field label="Full name (EN) *">
              <input name="nameEn" required className="field" placeholder="For example, Alisher Rakhimov" />
            </Field>
            <Field label="Position (RU)">
              <input name="roleRu" className="field" placeholder="e.g. кардиолог" />
            </Field>
            <Field label="Position (EN)">
              <input name="roleEn" className="field" placeholder="For example, cardiologist" />
            </Field>
            <Field label="Experience, years">
              <input name="experienceYears" type="number" min={0} className="field" placeholder="10" />
            </Field>
            <Field label="Medical category">
              <select name="category" className="field" defaultValue=""><option value="">No category</option><option value="highest">Highest</option><option value="first">First</option><option value="second">Second</option><option value="other">Other</option></select>
            </Field>
            <Field label="Specialty" hint="From the clinic specialties">
              <select name="specialtyId" className="field" defaultValue={specialtyIds[0] || ""}><option value="">Not chosen</option>{specialtyOptions.filter((specialty) => specialtyIds.includes(specialty.id)).map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.nameEn || specialty.nameRu}</option>)}</select>
            </Field>
          </FormGroup>
          <FormGroup title="Photo">
            {onUpload ? (
              <Field label="Upload a file" hint="A portrait, square works best">
                <input name="photoFile" type="file" accept="image/*" className="field" />
              </Field>
            ) : null}
            <Field label={onUpload ? "Or a photo link" : "Photo link"}>
              <input name="photoUrl" className="field" placeholder="https://…" />
            </Field>
          </FormGroup>
          <FormGroup title="About the doctor">
            <Field label="Short bio" wide>
              <textarea name="bioRu" rows={2} className="field" placeholder="What they do and which cases they handle" />
            </Field>
            <Field label="Certificates">
              <textarea name="certsRu" rows={2} className="field" />
            </Field>
            <Field label="Further training">
              <textarea name="continuingEducationRu" rows={2} className="field" />
            </Field>
            <Field label="International experience">
              <textarea name="internationalExperienceRu" rows={2} className="field" />
            </Field>
            <Field label="Research">
              <textarea name="researchActivityRu" rows={2} className="field" />
            </Field>
            <Field label="Awards">
              <textarea name="awardsRu" rows={2} className="field" />
            </Field>
            <Field label="Achievements">
              <textarea name="achievementsRu" rows={2} className="field" />
            </Field>
          </FormGroup>
          <button type="submit" className="btn btn-primary text-sm">
            Add doctor
          </button>
        </form>
      ) : null}
    </div>
  );
}
