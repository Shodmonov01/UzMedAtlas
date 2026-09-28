import { useRef, useState } from "react";
import type { BranchFormPayload, BranchSchedule, CabinetBranch } from "@/shared/api/cabinet";
import type { Specialty } from "@/shared/api/client";
import { BranchMap } from "@/shared/ui/BranchMap";
import { EMPTY_DAY, formatDayHours } from "@/shared/lib/schedule";
import { CITY_OPTIONS, displayCity, normalizeCity } from "@/shared/lib/cities";


const DAYS = [
  { key: "mon", label: "Пн" },
  { key: "tue", label: "Вт" },
  { key: "wed", label: "Ср" },
  { key: "thu", label: "Чт" },
  { key: "fri", label: "Пт" },
  { key: "sat", label: "Сб" },
  { key: "sun", label: "Вс" },
] as const;

export const BRANCH_CORE_SECTIONS = [
  { id: "basic", label: "Основное" },
  { id: "address", label: "Адрес" },
  { id: "map", label: "Карта" },
  { id: "contacts", label: "Контакты" },
  { id: "schedule", label: "Режим" },
  { id: "directions", label: "Направления" },
] as const;

export type BranchCoreSectionId = (typeof BRANCH_CORE_SECTIONS)[number]["id"];

const DEFAULT_SCHEDULE: BranchSchedule = {
  mon: { ...EMPTY_DAY },
  tue: { ...EMPTY_DAY },
  wed: { ...EMPTY_DAY },
  thu: { ...EMPTY_DAY },
  fri: { ...EMPTY_DAY },
  sat: { ...EMPTY_DAY, close: "14:00" },
  sun: null,
};

type Props = {
  specialties: Specialty[];
  allowedSpecialtyIds: string[];
  initial?: Partial<CabinetBranch>;
  locked?: boolean;
  submitLabel?: string;
  onSubmit: (payload: BranchFormPayload) => Promise<void>;
  /** Controlled section (for full-page branch wizard). */
  activeSection?: BranchCoreSectionId;
  onActiveSectionChange?: (id: BranchCoreSectionId) => void;
  hideNav?: boolean;
  onUpload?: (file: File) => Promise<string>;
  /** Called when «Сохранить и продолжить» on last core section. */
  onContinuePastEnd?: () => void;
};

export function BranchEditorForm({
  specialties,
  allowedSpecialtyIds,
  initial,
  locked,
  submitLabel = "Сохранить филиал",
  onSubmit,
  activeSection,
  onActiveSectionChange,
  hideNav,
  onUpload,
  onContinuePastEnd,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [internalSection, setInternalSection] = useState<BranchCoreSectionId>("basic");
  const section = activeSection ?? internalSection;
  const setSection = (id: BranchCoreSectionId) => {
    onActiveSectionChange?.(id);
    if (activeSection === undefined) setInternalSection(id);
  };
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
  const [phones, setPhones] = useState<string[]>(
    initial?.phones?.length ? initial.phones.filter((p) => p !== initial.phone) : [],
  );
  const [instagram, setInstagram] = useState(initial?.instagram || "");
  const [socials, setSocials] = useState(initial?.socials || []);
  const [medicalTourism, setMedicalTourism] = useState(Boolean(initial?.medicalTourism));
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl || "");
  const addressTouchedRef = useRef(Boolean(initial?.addressRu?.trim()));
  const continueAfterSave = useRef(false);

  const available = specialties.filter((s) => allowedSpecialtyIds.includes(s.id));

  function goNextSection() {
    const i = BRANCH_CORE_SECTIONS.findIndex((s) => s.id === section);
    if (i >= 0 && i < BRANCH_CORE_SECTIONS.length - 1) {
      setSection(BRANCH_CORE_SECTIONS[i + 1].id);
      return;
    }
    onContinuePastEnd?.();
  }

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
      city: normalizeCity(String(fd.get("city") || "tashkent")),
      addressRu,
      addressEn,
      country: String(fd.get("country") || "Uzbekistan"),
      region: String(fd.get("region") || "") || null,
      district: String(fd.get("district") || "") || null,
      street: String(fd.get("street") || "") || null,
      building: String(fd.get("building") || "") || null,
      addressExtra: String(fd.get("addressExtra") || "") || null,
      phone: String(fd.get("phone") || ""),
      phones: phones.filter(Boolean),
      email: String(fd.get("email") || "") || null,
      whatsapp: String(fd.get("whatsapp") || "") || null,
      telegram: String(fd.get("telegram") || "") || null,
      website: String(fd.get("website") || "") || null,
      instagram: instagram || null,
      socials: socials.filter((item) => item.label.trim() && item.url.trim()),
      descriptionRu: String(fd.get("descriptionRu") || ""),
      descriptionEn: String(fd.get("descriptionEn") || ""),
      advantagesRu: String(fd.get("advantagesRu") || ""),
      featuresRu: String(fd.get("featuresRu") || ""),
      medicalTourism,
      medicalTourismInfoRu: String(fd.get("medicalTourismInfoRu") || ""),
      coverUrl: coverUrl || null,
      lat: coords.lat,
      lng: coords.lng,
      specialtyIds,
      schedule,
    };
    try {
      await onSubmit(payload);
      if (continueAfterSave.current) {
        continueAfterSave.current = false;
        goNextSection();
      }
    } catch {
      setError("Не удалось сохранить филиал");
      continueAfterSave.current = false;
    } finally {
      setLoading(false);
    }
  }

  const pane = (id: BranchCoreSectionId) => (section === id ? "block" : "hidden");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p> : null}

      {!hideNav ? (
        <nav className="soft-card flex flex-wrap gap-1 rounded-[1.5rem] bg-white p-2">
          {BRANCH_CORE_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-xl px-3 py-2 text-sm font-bold ${
                section === item.id ? "bg-lime text-primary-deep" : "text-muted hover:bg-mint"
              }`}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      ) : null}

      <div className="soft-card space-y-5 rounded-[1.75rem] bg-white p-6">
        <div className={`${pane("basic")} grid gap-4 md:grid-cols-2`}>
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
            <input name="city" list="branch-city-options" required className="field mt-1" defaultValue={displayCity(initial?.city || "tashkent")} disabled={locked} />
            <datalist id="branch-city-options">{CITY_OPTIONS.map((city) => <option key={city.value} value={city.label} />)}</datalist>
          </label>
          <label className="text-sm font-bold md:col-span-2">
            Cover URL
            <input name="coverUrl" className="field mt-1" value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} disabled={locked} />
          </label>
          {!locked && onUpload ? (
            <label className="btn btn-ghost w-fit cursor-pointer text-sm md:col-span-2">
              Загрузить основное фото
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  setCoverUrl(await onUpload(file));
                } catch {
                  setError("Не удалось загрузить основное фото");
                } finally {
                  event.target.value = "";
                }
              }} />
            </label>
          ) : null}
          <label className="block text-sm font-bold md:col-span-2">
            Описание (RU)
            <textarea name="descriptionRu" rows={3} className="field mt-1" defaultValue={initial?.descriptionRu} disabled={locked} />
          </label>
          <label className="block text-sm font-bold md:col-span-2">
            Описание (EN)
            <textarea name="descriptionEn" rows={3} className="field mt-1" defaultValue={initial?.descriptionEn} disabled={locked} />
          </label>
          <label className="block text-sm font-bold md:col-span-2">
            Преимущества филиала
            <textarea name="advantagesRu" rows={2} className="field mt-1" defaultValue={initial?.advantagesRu || ""} disabled={locked} />
          </label>
          <label className="block text-sm font-bold md:col-span-2">
            Особенности филиала
            <textarea name="featuresRu" rows={2} className="field mt-1" defaultValue={initial?.featuresRu || ""} disabled={locked} />
          </label>
          <fieldset className="space-y-3 md:col-span-2" disabled={locked}>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={medicalTourism} onChange={(event) => setMedicalTourism(event.target.checked)} />
              Медицинский туризм / международное сотрудничество
            </label>
            {medicalTourism ? (
              <textarea name="medicalTourismInfoRu" rows={3} className="field" defaultValue={initial?.medicalTourismInfoRu || ""} placeholder="Описание" />
            ) : null}
          </fieldset>
        </div>

        <div className={`${pane("address")} grid gap-4 md:grid-cols-2`}>
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
            Страна
            <input name="country" className="field mt-1" defaultValue={initial?.country || "Uzbekistan"} disabled={locked} />
          </label>
          <label className="text-sm font-bold">
            Область
            <input name="region" className="field mt-1" defaultValue={initial?.region || ""} disabled={locked} />
          </label>
          <label className="text-sm font-bold">
            Район
            <input name="district" className="field mt-1" defaultValue={initial?.district || ""} disabled={locked} />
          </label>
          <label className="text-sm font-bold">
            Улица
            <input name="street" className="field mt-1" defaultValue={initial?.street || ""} disabled={locked} />
          </label>
          <label className="text-sm font-bold">
            Дом
            <input name="building" className="field mt-1" defaultValue={initial?.building || ""} disabled={locked} />
          </label>
          <label className="text-sm font-bold">
            Доп. к адресу
            <input name="addressExtra" className="field mt-1" defaultValue={initial?.addressExtra || ""} disabled={locked} />
          </label>
        </div>

        <div className={`${pane("map")} space-y-2`}>
          <p className="text-sm font-bold">Карта</p>
          <p className="text-xs text-muted">
            {locked
              ? "Точка филиала на карте."
              : "Кликните по карте, чтобы указать точку. Адрес подставится, если поле пустое."}
          </p>
          <BranchMap
            mode={locked ? "view" : "pick"}
            lat={coords.lat}
            lng={coords.lng}
            onPick={({ lat, lng, addressRu: fromMap }) => {
              setCoords({ lat, lng });
              if (fromMap && !addressTouchedRef.current) setAddressRu(fromMap);
            }}
          />
          <p className="text-xs text-muted">
            {coords.lat != null && coords.lng != null
              ? `Координаты: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
              : "Точка не выбрана"}
          </p>
        </div>

        <div className={`${pane("contacts")} grid gap-4 md:grid-cols-2`}>
          <label className="text-sm font-bold">
            Телефон (основной)
            <input name="phone" required className="field mt-1" defaultValue={initial?.phone} disabled={locked} />
          </label>
          <label className="text-sm font-bold md:col-span-2">
            Доп. телефоны (через запятую)
            <input
              className="field mt-1"
              disabled={locked}
              value={phones.join(", ")}
              onChange={(e) =>
                setPhones(
                  e.target.value
                    .split(",")
                    .map((p) => p.trim())
                    .filter(Boolean),
                )
              }
            />
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
          <label className="text-sm font-bold">
            Instagram
            <input
              className="field mt-1"
              disabled={locked}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </label>
          <label className="text-sm font-bold md:col-span-2">
            Сайт
            <input name="website" className="field mt-1" defaultValue={initial?.website || ""} disabled={locked} />
          </label>
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
        </div>

        <fieldset className={pane("schedule")} disabled={locked}>
          <legend className="text-sm font-bold">Режим работы</legend>
          <p className="mt-1 text-xs text-muted">Работает / выходной / 24/7 / перерыв.</p>
          <div className="mt-3 space-y-3">
            {DAYS.map((day) => {
              const value = schedule[day.key];
              const working = value != null;
              const roundTheClock = Boolean(value?.roundTheClock);
              const hasBreak = Boolean(value?.breakStart && value?.breakEnd);
              return (
                <div key={day.key} className="rounded-2xl border border-line bg-sand/40 px-3 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex w-16 items-center gap-2 font-bold">
                      <input
                        type="checkbox"
                        checked={working}
                        onChange={(e) => {
                          setSchedule((prev) => ({
                            ...prev,
                            [day.key]: e.target.checked ? { ...EMPTY_DAY } : null,
                          }));
                        }}
                      />
                      {day.label}
                    </label>
                    {!working ? <span className="text-muted">выходной</span> : null}
                    {working ? (
                      <label className="flex items-center gap-2 font-semibold">
                        <input
                          type="checkbox"
                          checked={roundTheClock}
                          onChange={(e) =>
                            setSchedule((prev) => ({
                              ...prev,
                              [day.key]: {
                                ...(value || EMPTY_DAY),
                                roundTheClock: e.target.checked,
                                breakStart: e.target.checked ? null : value?.breakStart ?? null,
                                breakEnd: e.target.checked ? null : value?.breakEnd ?? null,
                              },
                            }))
                          }
                        />
                        24/7
                      </label>
                    ) : null}
                    {working && !roundTheClock ? (
                      <>
                        <input
                          type="time"
                          className="field w-auto py-1"
                          value={value.open}
                          onChange={(e) =>
                            setSchedule((prev) => ({
                              ...prev,
                              [day.key]: { ...value, open: e.target.value },
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
                              [day.key]: { ...value, close: e.target.value },
                            }))
                          }
                        />
                        <label className="flex items-center gap-2 font-semibold">
                          <input
                            type="checkbox"
                            checked={hasBreak}
                            onChange={(e) =>
                              setSchedule((prev) => ({
                                ...prev,
                                [day.key]: {
                                  ...value,
                                  breakStart: e.target.checked ? "13:00" : null,
                                  breakEnd: e.target.checked ? "14:00" : null,
                                },
                              }))
                            }
                          />
                          перерыв
                        </label>
                      </>
                    ) : null}
                  </div>
                  {working && !roundTheClock && hasBreak ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 pl-[4.5rem]">
                      <input
                        type="time"
                        className="field w-auto py-1"
                        value={value.breakStart || "13:00"}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            [day.key]: { ...value, breakStart: e.target.value },
                          }))
                        }
                      />
                      <span className="text-muted">—</span>
                      <input
                        type="time"
                        className="field w-auto py-1"
                        value={value.breakEnd || "14:00"}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            [day.key]: { ...value, breakEnd: e.target.value },
                          }))
                        }
                      />
                    </div>
                  ) : null}
                  {working ? (
                    <p className="mt-2 pl-[4.5rem] text-xs font-semibold text-muted">
                      {formatDayHours(value)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={pane("directions")} disabled={locked}>
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

        {!locked ? (
          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Сохранение…" : submitLabel}
            </button>
            {section !== "directions" || onContinuePastEnd ? (
              <button
                type="submit"
                className="btn btn-ghost"
                disabled={loading}
                onClick={() => {
                  continueAfterSave.current = true;
                }}
              >
                Сохранить и продолжить
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
