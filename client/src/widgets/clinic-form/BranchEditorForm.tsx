import { useRef, useState } from "react";
import type { Specialty } from "@/shared/api/client";
import type { BranchFormPayload, BranchSchedule, CabinetBranch } from "@/shared/api/cabinet";
import { BranchMap } from "@/shared/ui/BranchMap";

const CITIES = [
  { value: "tashkent", label: "Ташкент" },
  { value: "samarkand", label: "Самарканд" },
  { value: "bukhara", label: "Бухара" },
];

const DAYS = [
  { key: "mon", label: "Пн" },
  { key: "tue", label: "Вт" },
  { key: "wed", label: "Ср" },
  { key: "thu", label: "Чт" },
  { key: "fri", label: "Пт" },
  { key: "sat", label: "Сб" },
  { key: "sun", label: "Вс" },
] as const;

const DEFAULT_SCHEDULE: BranchSchedule = {
  mon: { open: "09:00", close: "18:00" },
  tue: { open: "09:00", close: "18:00" },
  wed: { open: "09:00", close: "18:00" },
  thu: { open: "09:00", close: "18:00" },
  fri: { open: "09:00", close: "18:00" },
  sat: { open: "09:00", close: "14:00" },
  sun: null,
};

type Props = {
  specialties: Specialty[];
  allowedSpecialtyIds: string[];
  initial?: Partial<CabinetBranch>;
  locked?: boolean;
  submitLabel?: string;
  onSubmit: (payload: BranchFormPayload) => Promise<void>;
};

export function BranchEditorForm({
  specialties,
  allowedSpecialtyIds,
  initial,
  locked,
  submitLabel = "Сохранить филиал",
  onSubmit,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [specialtyIds, setSpecialtyIds] = useState<string[]>(
    initial?.specialtyIds?.length ? initial.specialtyIds : [],
  );
  const [schedule, setSchedule] = useState<BranchSchedule>(
    Object.keys(initial?.schedule || {}).length ? initial!.schedule! : DEFAULT_SCHEDULE,
  );
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: initial?.lat ?? null,
    lng: initial?.lng ?? null,
  });
  const [addressRu, setAddressRu] = useState(initial?.addressRu || "");
  const [addressEn, setAddressEn] = useState(initial?.addressEn || "");
  const addressTouchedRef = useRef(Boolean(initial?.addressRu?.trim()));

  const available = specialties.filter((s) => allowedSpecialtyIds.includes(s.id));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    setLoading(true);
    setError(null);
    const fd = new FormData(event.currentTarget);
    const payload: BranchFormPayload = {
      nameRu: String(fd.get("nameRu") || ""),
      nameEn: String(fd.get("nameEn") || ""),
      slug: String(fd.get("slug") || "") || undefined,
      city: String(fd.get("city") || "tashkent"),
      addressRu,
      addressEn,
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || "") || null,
      whatsapp: String(fd.get("whatsapp") || "") || null,
      telegram: String(fd.get("telegram") || "") || null,
      website: String(fd.get("website") || "") || null,
      descriptionRu: String(fd.get("descriptionRu") || ""),
      descriptionEn: String(fd.get("descriptionEn") || ""),
      coverUrl: String(fd.get("coverUrl") || "") || null,
      lat: coords.lat,
      lng: coords.lng,
      specialtyIds,
      schedule,
    };
    try {
      await onSubmit(payload);
    } catch {
      setError("Не удалось сохранить филиал");
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
          <input
            name="addressRu"
            required
            className="field mt-1"
            value={addressRu}
            disabled={locked}
            onChange={(e) => {
              addressTouchedRef.current = true;
              setAddressRu(e.target.value);
            }}
          />
        </label>
        <label className="text-sm font-bold">
          Адрес (EN)
          <input
            name="addressEn"
            required
            className="field mt-1"
            value={addressEn}
            disabled={locked}
            onChange={(e) => setAddressEn(e.target.value)}
          />
        </label>
        <label className="text-sm font-bold">
          Телефон
          <input name="phone" required className="field mt-1" defaultValue={initial?.phone} disabled={locked} />
        </label>
        <label className="text-sm font-bold">
          Email
          <input name="email" type="email" className="field mt-1" defaultValue={initial?.email || ""} disabled={locked} />
        </label>
        <label className="text-sm font-bold">
          WhatsApp
          <input name="whatsapp" className="field mt-1" defaultValue={initial?.whatsapp || ""} disabled={locked} />
        </label>
        <label className="text-sm font-bold">
          Telegram
          <input name="telegram" className="field mt-1" defaultValue={initial?.telegram || ""} disabled={locked} />
        </label>
        <label className="text-sm font-bold md:col-span-2">
          Cover URL
          <input name="coverUrl" className="field mt-1" defaultValue={initial?.coverUrl || ""} disabled={locked} />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">Карта</p>
        <p className="text-xs text-muted">
          {locked ? "Точка филиала на карте." : "Кликните по карте, чтобы указать точку филиала. Адрес подставится автоматически, если поле пустое."}
        </p>
        <BranchMap
          mode={locked ? "view" : "pick"}
          lat={coords.lat}
          lng={coords.lng}
          onPick={({ lat, lng, addressRu: fromMap }) => {
            setCoords({ lat, lng });
            if (fromMap && !addressTouchedRef.current) {
              setAddressRu(fromMap);
            }
          }}
        />
        <p className="text-xs text-muted">
          {coords.lat != null && coords.lng != null
            ? `Координаты: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
            : "Точка не выбрана"}
        </p>
      </div>

      <label className="block text-sm font-bold">
        Описание (RU)
        <textarea name="descriptionRu" rows={3} className="field mt-1" defaultValue={initial?.descriptionRu} disabled={locked} />
      </label>
      <label className="block text-sm font-bold">
        Описание (EN)
        <textarea name="descriptionEn" rows={3} className="field mt-1" defaultValue={initial?.descriptionEn} disabled={locked} />
      </label>

      <fieldset disabled={locked}>
        <legend className="text-sm font-bold">Направления филиала (из клиники)</legend>
        {available.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Сначала выберите направления у клиники.</p>
        ) : (
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {available.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={specialtyIds.includes(item.id)}
                  onChange={(e) => {
                    setSpecialtyIds((prev) =>
                      e.target.checked ? [...prev, item.id] : prev.filter((x) => x !== item.id),
                    );
                  }}
                />
                {item.nameRu || item.nameEn}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset disabled={locked}>
        <legend className="text-sm font-bold">Режим работы</legend>
        <div className="mt-3 space-y-2">
          {DAYS.map((day) => {
            const value = schedule[day.key];
            const open = value != null;
            return (
              <div key={day.key} className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex w-16 items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    checked={open}
                    onChange={(e) => {
                      setSchedule((prev) => ({
                        ...prev,
                        [day.key]: e.target.checked ? { open: "09:00", close: "18:00" } : null,
                      }));
                    }}
                  />
                  {day.label}
                </label>
                {open ? (
                  <>
                    <input
                      type="time"
                      className="field w-auto py-1"
                      value={value.open}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          [day.key]: { open: e.target.value, close: value.close },
                        }))
                      }
                    />
                    <span className="text-muted">—</span>
                    <input
                      type="time"
                      className="field w-auto py-1"
                      value={value.close}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          [day.key]: { open: value.open, close: e.target.value },
                        }))
                      }
                    />
                  </>
                ) : (
                  <span className="text-muted">выходной</span>
                )}
              </div>
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
