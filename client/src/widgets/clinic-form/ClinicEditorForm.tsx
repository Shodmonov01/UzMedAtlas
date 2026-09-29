import { useRef, useState } from "react";
import type { ClinicFormPayload, CabinetClinic } from "@/shared/api/cabinet";
import type { Specialty } from "@/shared/api/client";
import { CITY_OPTIONS, displayCity, normalizeCity } from "@/shared/lib/cities";
import { BranchMap } from "@/shared/ui/BranchMap";
import { AddressMapSearchButton } from "@/shared/ui/AddressMapSearchButton";


const LANGS = [
  { code: "ru", label: "Русский" },
  { code: "uz", label: "Узбекский" },
  { code: "en", label: "English" },
  { code: "kz", label: "Қазақша" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
];

const FIELD_LABELS: Record<string, string> = {
  nameRu: "Название (RU)",
  nameEn: "Название (EN)",
  city: "Город",
  slug: "Короткий адрес страницы",
  addressRu: "Адрес (RU)",
  addressEn: "Адрес (EN)",
  lat: "Широта на карте",
  lng: "Долгота на карте",
  descriptionRu: "Описание (RU)",
  descriptionEn: "Описание (EN)",
  phone: "Телефон",
  email: "Email",
  languages: "Языки обслуживания",
};

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
  required = false,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm font-bold text-ink ${className}`}>
      <span className="flex items-baseline justify-between gap-2">
        <span>{label}{required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}</span>
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
  active,
  children,
}: {
  step: string;
  title: string;
  description?: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <section data-clinic-step={step} hidden={!active} className="soft-card space-y-5 rounded-[1.75rem] bg-white p-5 md:p-7">
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
  const [activeStep, setActiveStep] = useState(1);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: initial?.lat ?? null,
    lng: initial?.lng ?? null,
  });
  const [city, setCity] = useState(displayCity(initial?.city || "tashkent"));
  const [addressRu, setAddressRu] = useState(initial?.addressRu || "");
  const addressRuTouched = useRef(Boolean(initial?.addressRu?.trim()));
  const [languages, setLanguages] = useState<string[]>(
    initial?.languages?.length ? initial.languages : ["ru", "en"],
  );
  const [specialtyIds, setSpecialtyIds] = useState<string[]>(
    initial?.specialtyIds?.length
      ? initial.specialtyIds
      : (initial?.specialties?.map((s) => s.id).filter(Boolean) as string[]) || [],
  );
  const [customSpecialties, setCustomSpecialties] = useState<{ nameRu: string; nameEn: string }[]>([]);
  const [coverColor, setCoverColor] = useState(initial?.coverColor || "#1570ef");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    const firstInvalid = Array.from(
      event.currentTarget.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[required]"),
    ).find((field) => !field.checkValidity());
    if (firstInvalid) {
      const step = Number(firstInvalid.closest<HTMLElement>("[data-clinic-step]")?.dataset.clinicStep || 1);
      setActiveStep(step);
      window.requestAnimationFrame(() => firstInvalid.reportValidity());
      return;
    }
    if (languages.length === 0) {
      setActiveStep(5);
      setError("Выберите хотя бы один язык обслуживания.");
      return;
    }
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
      lat: coords.lat,
      lng: coords.lng,
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
      customSpecialties: customSpecialties.map(({ nameRu, nameEn }) => ({
        nameRu,
        ...(nameEn ? { nameEn } : {}),
      })),
    };
    try {
      await onSubmit(payload);
    } catch (cause) {
      const fieldErrors = (cause as {
        response?: { data?: { details?: { fieldErrors?: Record<string, unknown> } } };
      })?.response?.data?.details?.fieldErrors;
      const invalidFields = Object.keys(fieldErrors || {}).map((field) => FIELD_LABELS[field] || field);
      setError(
        invalidFields.length
          ? `Проверьте поля: ${invalidFields.join(", ")}. Убедитесь, что обязательные данные заполнены корректно.`
          : "Не удалось сохранить. Проверьте подключение и попробуйте ещё раз.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>
      ) : null}

      <nav aria-label="Этапы заполнения клиники" className="soft-card grid gap-2 rounded-[1.5rem] bg-white p-2 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { n: 1, title: "Основное", note: "Название и город" },
          { n: 2, title: "Адрес", note: "Адрес и карта" },
          { n: 3, title: "Контакты", note: "Телефон и связь" },
          { n: 4, title: "О клинике", note: "Описание" },
          { n: 5, title: "Направления", note: "Языки и услуги" },
        ].map((item) => (
          <button
            key={item.n}
            type="button"
            aria-current={activeStep === item.n ? "step" : undefined}
            onClick={() => setActiveStep(item.n)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left ${activeStep === item.n ? "bg-mint text-primary-deep" : "text-muted hover:bg-sand"}`}
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${activeStep === item.n ? "bg-primary text-white" : "bg-sand text-muted"}`}>{item.n}</span>
            <span><span className="block text-sm font-extrabold">{item.title}</span><span className="block text-xs">{item.note}</span></span>
          </button>
        ))}
      </nav>
      <p className="-mt-3 px-1 text-xs text-muted"><span className="font-bold text-danger">*</span> Обязательное поле. Точку на карте можно добавить сейчас или позже в редакторе клиники.</p>

      <Section
        step="01"
        title="Основное"
        description="Как клиника будет называться в каталоге"
        active={activeStep === 1}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Название (RU)" required>
            <input name="nameRu" required minLength={2} maxLength={200} className="field" defaultValue={initial?.nameRu} disabled={locked} />
          </Field>
          <Field label="Название (EN)" required>
            <input name="nameEn" required minLength={2} maxLength={200} className="field" defaultValue={initial?.nameEn} disabled={locked} />
          </Field>
          <Field label="Город" required>
            <input name="city" list="clinic-city-options" required minLength={2} maxLength={80} className="field" value={city} onChange={(event) => setCity(event.target.value)} disabled={locked} />
            <datalist id="clinic-city-options">{CITY_OPTIONS.map((city) => <option key={city.value} value={city.label} />)}</datalist>
          </Field>
          <Field label="Slug" hint="необязательно">
            <input
              name="slug"
              minLength={2}
              maxLength={80}
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

      <Section step="02" title="Адрес и расположение" description="Укажите адрес текстом и отметьте точное место на карте. Филиалы можно добавить после создания клиники." active={activeStep === 2}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Адрес (RU)" required>
            <div className="space-y-1.5">
              <input
                name="addressRu"
                required
                minLength={3}
                maxLength={300}
                className="field"
                value={addressRu}
                disabled={locked}
                onChange={(event) => {
                  addressRuTouched.current = true;
                  setAddressRu(event.target.value);
                }}
              />
              <AddressMapSearchButton
                address={addressRu.trim() && city.trim() ? `${addressRu}, ${city}` : addressRu}
                disabled={locked}
                onFound={({ lat, lng }) => setCoords({ lat, lng })}
              />
            </div>
          </Field>
          <Field label="Адрес (EN)" required>
            <input name="addressEn" required minLength={3} maxLength={300} className="field" defaultValue={initial?.addressEn} disabled={locked} />
          </Field>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-bold text-ink">Метка на карте <span className="font-medium text-muted">(необязательно)</span></p>
            <p className="mt-1 text-sm text-muted">Нажмите на карту или перетащите метку, чтобы показать точное место клиники.</p>
          </div>
          <BranchMap
            mode={locked ? "view" : "pick"}
            lat={coords.lat}
            lng={coords.lng}
            onPick={({ lat, lng, addressRu }) => {
              setCoords({ lat, lng });
              if (addressRu && !addressRuTouched.current) setAddressRu(addressRu);
            }}
          />
          <p className="text-xs text-muted">
            {coords.lat != null && coords.lng != null ? `Выбрано: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Точка пока не выбрана"}
          </p>
        </div>
      </Section>

      <Section step="03" title="Контакты" description="Пациенты увидят эти данные на странице клиники" active={activeStep === 3}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Телефон" required>
            <input name="phone" required minLength={5} maxLength={40} className="field" defaultValue={initial?.phone || "+998"} disabled={locked} />
          </Field>
          <Field label="Email" required>
            <input
              name="email"
              type="email"
              required
              maxLength={120}
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

      <Section step="04" title="О клинике" description="Короткое описание для карточки и страницы" active={activeStep === 4}>
        <div className="grid gap-4">
          <Field label="Описание (RU)" required>
            <textarea
              name="descriptionRu"
              required
              minLength={10}
              maxLength={5000}
              rows={4}
              className="field"
              defaultValue={initial?.descriptionRu}
              disabled={locked}
              placeholder="Чем занимается клиника, для кого подходит…"
            />
          </Field>
          <Field label="Описание (EN)" required>
            <textarea
              name="descriptionEn"
              required
              minLength={10}
              maxLength={5000}
              rows={4}
              className="field"
              defaultValue={initial?.descriptionEn}
              disabled={locked}
              placeholder="What the clinic offers for international patients…"
            />
          </Field>
        </div>
      </Section>

      <Section step="05" title="Языки и направления" description="Можно изменить позже в редакторе профиля" active={activeStep === 5}>
        <div className="space-y-5">
          <div>
            <p className="text-sm font-bold text-ink">Языки обслуживания <span className="text-danger">*</span></p>
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
            <p className="mt-1 text-xs text-muted">Выбрано: {specialtyIds.length + customSpecialties.length}</p>
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
              {customSpecialties.map((item) => (
                <ChipToggle
                  key={`${item.nameRu}-${item.nameEn}`}
                  active
                  disabled={locked}
                  onClick={() => setCustomSpecialties((prev) => prev.filter((current) => current !== item))}
                >
                  {item.nameRu}
                </ChipToggle>
              ))}
            </div>
            {!locked ? (
              <div className="mt-4 space-y-2 rounded-2xl border border-dashed border-line p-4">
                <div>
                  <p className="text-sm font-bold text-ink">Добавить своё направление</p>
                  <p className="mt-1 text-xs text-muted">Оно будет добавлено только в профиль этой клиники.</p>
                </div>
                <input name="customSpecialtyRu" minLength={2} maxLength={120} className="field" placeholder="Название на русском" />
                <input name="customSpecialtyEn" minLength={2} maxLength={120} className="field" placeholder="Название на английском (необязательно)" />
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={(event) => {
                    const form = event.currentTarget.closest("form");
                    const ru = form?.elements.namedItem("customSpecialtyRu");
                    const en = form?.elements.namedItem("customSpecialtyEn");
                    const nameRu = ru instanceof HTMLInputElement ? ru.value.trim() : "";
                    const nameEn = en instanceof HTMLInputElement ? en.value.trim() : "";
                    if (nameRu.length < 2 || nameRu.length > 120 || (nameEn && (nameEn.length < 2 || nameEn.length > 120))) {
                      setError("Укажите название направления на русском (от 2 до 120 символов).");
                      return;
                    }
                    if (customSpecialties.some((item) => item.nameRu.toLocaleLowerCase("ru") === nameRu.toLocaleLowerCase("ru"))) {
                      setError("Это направление уже добавлено.");
                      return;
                    }
                    setError(null);
                    setCustomSpecialties((prev) => [...prev, { nameRu, nameEn }]);
                    if (ru instanceof HTMLInputElement) ru.value = "";
                    if (en instanceof HTMLInputElement) en.value = "";
                  }}
                >
                  Добавить направление
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      {!locked ? (
        <div className="soft-card flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-line bg-white px-5 py-4">
          <div>
            <p className="text-sm font-extrabold text-ink">Шаг {activeStep} из 5</p>
            <p className="text-xs text-muted">Черновик можно дополнить после создания</p>
          </div>
          <div className="flex gap-2">
            {activeStep > 1 ? (
              <button className="btn btn-ghost" type="button" onClick={() => setActiveStep((step) => step - 1)}>Назад</button>
            ) : null}
            {activeStep < 5 ? (
              <button
                className="btn btn-primary min-w-[160px]"
                type="button"
                onClick={() => {
                  const current = document.querySelector<HTMLElement>(`[data-clinic-step="${String(activeStep).padStart(2, "0")}"]`);
                  const invalid = current?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[required]:invalid");
                  if (invalid) { invalid.reportValidity(); return; }
                  setActiveStep((step) => step + 1);
                }}
              >Продолжить</button>
            ) : (
              <button className="btn btn-primary min-w-[180px]" type="submit" disabled={loading}>
                {loading ? "Создание…" : submitLabel}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </form>
  );
}
