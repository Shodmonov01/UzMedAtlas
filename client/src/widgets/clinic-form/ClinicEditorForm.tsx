import { useState } from "react";
import type { ClinicFormPayload, CabinetClinic } from "@/shared/api/cabinet";
import type { Specialty } from "@/shared/api/client";
import { CITY_OPTIONS, displayCity, normalizeCity } from "@/shared/lib/cities";


const LANGS = [
  { code: "ru", label: "Русский" },
  { code: "uz", label: "Узбекский" },
  { code: "en", label: "English" },
  { code: "kz", label: "Қазақша" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
];

type Props = {
  specialties: Specialty[];
  initial?: Partial<CabinetClinic>;
  locked?: boolean;
  submitLabel?: string;
  onSubmit: (payload: ClinicFormPayload) => Promise<void>;
};

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm font-bold text-ink ${className}`}>
      <span className="flex items-baseline justify-between gap-2">
        <span>{label}</span>
        {hint ? <span className="text-xs font-semibold text-muted">{hint}</span> : null}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Section({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="soft-card space-y-5 rounded-[1.75rem] bg-white p-5 md:p-7">
      <header className="flex items-start gap-3 border-b border-line pb-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary-soft text-sm font-extrabold text-primary">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold tracking-tight text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

function ChipToggle({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-sm font-bold transition ${
        active
          ? "bg-primary text-white shadow-sm"
          : "border border-line bg-sand text-ink hover:border-primary/40 hover:bg-mint"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

export function ClinicEditorForm({
  specialties,
  initial,
  locked,
  submitLabel = "Создать черновик",
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
  const [coverColor, setCoverColor] = useState(initial?.coverColor || "#1570ef");

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
          city: normalizeCity(String(fd.get("city") || "tashkent")),
      addressRu: String(fd.get("addressRu") || ""),
      addressEn: String(fd.get("addressEn") || ""),
      descriptionRu: String(fd.get("descriptionRu") || ""),
      descriptionEn: String(fd.get("descriptionEn") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      website: String(fd.get("website") || "") || null,
      whatsapp: String(fd.get("whatsapp") || "") || null,
      telegram: String(fd.get("telegram") || "") || null,
      coverColor,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>
      ) : null}

      <Section
        step="01"
        title="Основное"
        description="Как клиника будет называться в каталоге"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Название (RU)">
            <input name="nameRu" required className="field" defaultValue={initial?.nameRu} disabled={locked} />
          </Field>
          <Field label="Название (EN)">
            <input name="nameEn" required className="field" defaultValue={initial?.nameEn} disabled={locked} />
          </Field>
          <Field label="Город">
            <input name="city" list="clinic-city-options" required className="field" defaultValue={displayCity(initial?.city || "tashkent")} disabled={locked} />
            <datalist id="clinic-city-options">{CITY_OPTIONS.map((city) => <option key={city.value} value={city.label} />)}</datalist>
          </Field>
          <Field label="Slug" hint="необязательно">
            <input
              name="slug"
              className="field"
              defaultValue={initial?.slug}
              disabled={locked}
              placeholder="сгенерируется автоматически"
            />
          </Field>
          <Field label="Цвет обложки" className="md:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                className="h-12 w-16 cursor-pointer overflow-hidden rounded-xl border border-line bg-white p-1"
                value={coverColor}
                disabled={locked}
                onChange={(e) => setCoverColor(e.target.value)}
              />
              <div
                className="h-12 min-w-[140px] flex-1 rounded-xl border border-line"
                style={{ background: `linear-gradient(135deg, ${coverColor}, #1849a9)` }}
              />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{coverColor}</span>
            </div>
          </Field>
        </div>
      </Section>

      <Section step="02" title="Адрес" description="Базовый адрес клиники — филиалы добавите позже">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Адрес (RU)">
            <input name="addressRu" required className="field" defaultValue={initial?.addressRu} disabled={locked} />
          </Field>
          <Field label="Адрес (EN)">
            <input name="addressEn" required className="field" defaultValue={initial?.addressEn} disabled={locked} />
          </Field>
        </div>
      </Section>

      <Section step="03" title="Контакты" description="Пациенты увидят эти данные на странице клиники">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Телефон">
            <input name="phone" required className="field" defaultValue={initial?.phone || "+998"} disabled={locked} />
          </Field>
          <Field label="Email">
            <input
              name="email"
              type="email"
              required
              className="field"
              defaultValue={initial?.email}
              disabled={locked}
            />
          </Field>
          <Field label="Сайт" hint="необязательно">
            <input name="website" className="field" defaultValue={initial?.website || ""} disabled={locked} />
          </Field>
          <Field label="WhatsApp" hint="необязательно">
            <input name="whatsapp" className="field" defaultValue={initial?.whatsapp || ""} disabled={locked} />
          </Field>
          <Field label="Telegram" hint="необязательно">
            <input name="telegram" className="field" defaultValue={initial?.telegram || ""} disabled={locked} />
          </Field>
          <Field label="Координатор" hint="необязательно">
            <input
              name="coordinatorName"
              className="field"
              defaultValue={initial?.coordinatorName || ""}
              disabled={locked}
            />
          </Field>
          <Field label="Время ответа, часов">
            <input
              name="responseHours"
              type="number"
              min={1}
              max={168}
              className="field"
              defaultValue={initial?.responseHours ?? 24}
              disabled={locked}
            />
          </Field>
        </div>
      </Section>

      <Section step="04" title="О клинике" description="Короткое описание для карточки и страницы">
        <div className="grid gap-4">
          <Field label="Описание (RU)">
            <textarea
              name="descriptionRu"
              required
              rows={4}
              className="field"
              defaultValue={initial?.descriptionRu}
              disabled={locked}
              placeholder="Чем занимается клиника, для кого подходит…"
            />
          </Field>
          <Field label="Описание (EN)">
            <textarea
              name="descriptionEn"
              required
              rows={4}
              className="field"
              defaultValue={initial?.descriptionEn}
              disabled={locked}
              placeholder="What the clinic offers for international patients…"
            />
          </Field>
        </div>
      </Section>

      <Section step="05" title="Языки и направления" description="Можно изменить позже в редакторе профиля">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-bold text-ink">Языки обслуживания</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {LANGS.map((lang) => {
                const active = languages.includes(lang.code);
                return (
                  <ChipToggle
                    key={lang.code}
                    active={active}
                    disabled={locked}
                    onClick={() => {
                      setLanguages((prev) =>
                        active ? prev.filter((x) => x !== lang.code) : [...prev, lang.code],
                      );
                    }}
                  >
                    {lang.label}
                  </ChipToggle>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-ink">Направления</p>
            <p className="mt-1 text-xs text-muted">Выбрано: {specialtyIds.length}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {specialties.map((item) => {
                const id = item.id || item.slug;
                const active = specialtyIds.includes(id);
                return (
                  <ChipToggle
                    key={id}
                    active={active}
                    disabled={locked}
                    onClick={() => {
                      setSpecialtyIds((prev) =>
                        active ? prev.filter((x) => x !== id) : [...prev, id],
                      );
                    }}
                  >
                    {item.nameRu || item.nameEn}
                  </ChipToggle>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {!locked ? (
        <div className="soft-card flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-line bg-white px-5 py-4">
          <div>
            <p className="text-sm font-extrabold text-ink">Готово к черновику</p>
            <p className="text-xs text-muted">Дальше откроется полный редактор профиля</p>
          </div>
          <button className="btn btn-primary min-w-[180px]" type="submit" disabled={loading}>
            {loading ? "Создание…" : submitLabel}
          </button>
        </div>
      ) : null}
    </form>
  );
}
