import { useState } from "react";
import type { ClinicFormPayload, CabinetClinic } from "@/shared/api/cabinet";
import type { Specialty } from "@/shared/api/client";

const CITIES = [
  { value: "tashkent", label: "Ташкент" },
  { value: "samarkand", label: "Самарканд" },
  { value: "bukhara", label: "Бухара" },
];

const LANGS = ["ru", "en", "uz", "kz", "tr", "ar"];

type Props = {
  specialties: Specialty[];
  initial?: Partial<CabinetClinic>;
  locked?: boolean;
  submitLabel?: string;
  onSubmit: (payload: ClinicFormPayload) => Promise<void>;
};

export function ClinicEditorForm({
  specialties,
  initial,
  locked,
  submitLabel = "Сохранить черновик",
  onSubmit,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<string[]>(
    initial?.languages?.length ? initial.languages : ["ru", "en"],
  );
  const [specialtyIds, setSpecialtyIds] = useState<string[]>(
    initial?.specialtyIds?.length
      ? initial.specialtyIds
      : (initial?.specialties?.map((s) => s.id).filter(Boolean) as string[]) || [],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    setLoading(true);
    setError(null);
    const fd = new FormData(event.currentTarget);
    const payload: ClinicFormPayload = {
      nameRu: String(fd.get("nameRu") || ""),
      nameEn: String(fd.get("nameEn") || ""),
      slug: String(fd.get("slug") || "") || undefined,
      city: String(fd.get("city") || "tashkent"),
      addressRu: String(fd.get("addressRu") || ""),
      addressEn: String(fd.get("addressEn") || ""),
      descriptionRu: String(fd.get("descriptionRu") || ""),
      descriptionEn: String(fd.get("descriptionEn") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      website: String(fd.get("website") || "") || null,
      whatsapp: String(fd.get("whatsapp") || "") || null,
      telegram: String(fd.get("telegram") || "") || null,
      coverColor: String(fd.get("coverColor") || "#1570ef"),
      coordinatorName: String(fd.get("coordinatorName") || "") || null,
      responseHours: Number(fd.get("responseHours") || 24),
      languages,
      specialtyIds,
    };
    try {
      await onSubmit(payload);
    } catch {
      setError("Не удалось сохранить. Проверьте поля.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="soft-card space-y-5 rounded-[1.75rem] bg-white p-6">
      {error ? <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">
          Название (RU)
          <input name="nameRu" required className="field mt-1" defaultValue={initial?.nameRu} disabled={locked} />
        </label>
        <label className="text-sm font-bold">
          Название (EN)
          <input name="nameEn" required className="field mt-1" defaultValue={initial?.nameEn} disabled={locked} />
        </label>
        <label className="text-sm font-bold">
          Slug
          <input name="slug" className="field mt-1" defaultValue={initial?.slug} disabled={locked} placeholder="auto" />
        </label>
        <label className="text-sm font-bold">
          Город
          <select name="city" className="field mt-1" defaultValue={initial?.city || "tashkent"} disabled={locked}>
            {CITIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Адрес (RU)
          <input name="addressRu" required className="field mt-1" defaultValue={initial?.addressRu} disabled={locked} />
        </label>
        <label className="text-sm font-bold">
          Адрес (EN)
          <input name="addressEn" required className="field mt-1" defaultValue={initial?.addressEn} disabled={locked} />
        </label>
        <label className="text-sm font-bold">
          Телефон
          <input name="phone" required className="field mt-1" defaultValue={initial?.phone} disabled={locked} />
        </label>
        <label className="text-sm font-bold">
          Email
          <input
            name="email"
            type="email"
            required
            className="field mt-1"
            defaultValue={initial?.email}
            disabled={locked}
          />
        </label>
        <label className="text-sm font-bold">
          Сайт
          <input name="website" className="field mt-1" defaultValue={initial?.website || ""} disabled={locked} />
        </label>
        <label className="text-sm font-bold">
          WhatsApp
          <input name="whatsapp" className="field mt-1" defaultValue={initial?.whatsapp || ""} disabled={locked} />
        </label>
        <label className="text-sm font-bold">
          Telegram
          <input name="telegram" className="field mt-1" defaultValue={initial?.telegram || ""} disabled={locked} />
        </label>
        <label className="text-sm font-bold">
          Цвет обложки
          <input
            name="coverColor"
            type="color"
            className="field mt-1 h-12"
            defaultValue={initial?.coverColor || "#1570ef"}
            disabled={locked}
          />
        </label>
        <label className="text-sm font-bold">
          Координатор
          <input
            name="coordinatorName"
            className="field mt-1"
            defaultValue={initial?.coordinatorName || ""}
            disabled={locked}
          />
        </label>
        <label className="text-sm font-bold">
          Время ответа (ч)
          <input
            name="responseHours"
            type="number"
            min={1}
            max={168}
            className="field mt-1"
            defaultValue={initial?.responseHours ?? 24}
            disabled={locked}
          />
        </label>
      </div>

      <label className="block text-sm font-bold">
        Описание (RU)
        <textarea
          name="descriptionRu"
          required
          rows={4}
          className="field mt-1"
          defaultValue={initial?.descriptionRu}
          disabled={locked}
        />
      </label>
      <label className="block text-sm font-bold">
        Описание (EN)
        <textarea
          name="descriptionEn"
          required
          rows={4}
          className="field mt-1"
          defaultValue={initial?.descriptionEn}
          disabled={locked}
        />
      </label>

      <fieldset disabled={locked}>
        <legend className="text-sm font-bold">Языки</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {LANGS.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={languages.includes(code)}
                onChange={(e) => {
                  setLanguages((prev) =>
                    e.target.checked ? [...prev, code] : prev.filter((x) => x !== code),
                  );
                }}
              />
              {code}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={locked}>
        <legend className="text-sm font-bold">Направления</legend>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {specialties.map((item) => {
            const id = item.id || item.slug;
            return (
              <label key={id} className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
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
      </fieldset>

      {!locked ? (
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Сохранение…" : submitLabel}
        </button>
      ) : null}
    </form>
  );
}
