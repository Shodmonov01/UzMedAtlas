import { useRef, useState } from "react";
import type { ClinicFormPayload, CabinetClinic } from "@/shared/api/cabinet";
import type { Specialty } from "@/shared/api/client";
import { CITY_OPTIONS, displayCity, normalizeCity } from "@/shared/lib/cities";
import { BranchMap } from "@/shared/ui/BranchMap";
import { AddressMapSearchButton } from "@/shared/ui/AddressMapSearchButton";


const LANGS = [
  { code: "ru", label: "Russian" },
  { code: "uz", label: "Uzbek" },
  { code: "en", label: "English" },
  { code: "kz", label: "Kazakh" },
  { code: "tr", label: "Turkish" },
  { code: "ar", label: "Arabic" },
];

const FIELD_LABELS: Record<string, string> = {
  nameRu: "Name (RU)",
  nameEn: "Name (EN)",
  city: "City",
  slug: "Short page address",
  addressRu: "Address (RU)",
  addressEn: "Address (EN)",
  lat: "Map latitude",
  lng: "Map longitude",
  descriptionRu: "Description (RU)",
  descriptionEn: "Description (EN)",
  phone: "Phone",
  email: "Email",
  languages: "Service languages",
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
    <section data-clinic-step={step} hidden={!active} className="soft-card space-y-5 p-5 md:p-7">
      <header className="flex items-start gap-4 border-b border-line pb-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink text-sm font-bold text-white">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="ws-card-title">{title}</h2>
          {description ? <p className="ws-card-text">{description}</p> : null}
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
      aria-pressed={active}
      className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
        active
          ? "bg-ink text-white"
          : "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--line)] hover:shadow-[inset_0_0_0_1px_var(--ink)]"
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
  submitLabel = "Create draft",
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
      setError("Choose at least one service language.");
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
          ? `Check these fields: ${invalidFields.join(", ")}. Make sure the required data is filled in correctly.`
          : "Could not save. Check your connection and try again.",
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

      <nav aria-label="Clinic setup steps" className="soft-card grid gap-1 p-2 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { n: 1, title: "Basics", note: "Name and city" },
          { n: 2, title: "Address", note: "Address and map" },
          { n: 3, title: "Contacts", note: "Phone and messengers" },
          { n: 4, title: "About", note: "Description" },
          { n: 5, title: "Specialties", note: "Languages and services" },
        ].map((item) => (
          <button
            key={item.n}
            type="button"
            aria-current={activeStep === item.n ? "step" : undefined}
            onClick={() => setActiveStep(item.n)}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${activeStep === item.n ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"}`}
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-xs font-bold ${activeStep === item.n ? "bg-[#1d4a63] text-white" : activeStep > item.n ? "bg-[#e4f5ec] text-accent-strong" : "bg-paper text-muted"}`}>{activeStep > item.n ? "✓" : item.n}</span>
            <span><span className="block text-sm font-bold">{item.title}</span><span className={`block text-xs ${activeStep === item.n ? "text-white/70" : ""}`}>{item.note}</span></span>
          </button>
        ))}
      </nav>
      <p className="-mt-3 px-1 text-xs text-muted"><span className="font-bold text-danger">*</span> Required field. The map location can be added now or later in the clinic editor.</p>

      <Section
        step="01"
        title="Basics"
        description="How the clinic will be named in the catalog"
        active={activeStep === 1}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name (RU)" required>
            <input name="nameRu" required minLength={2} maxLength={200} className="field" defaultValue={initial?.nameRu} disabled={locked} />
          </Field>
          <Field label="Name (EN)" required>
            <input name="nameEn" required minLength={2} maxLength={200} className="field" defaultValue={initial?.nameEn} disabled={locked} />
          </Field>
          <Field label="City" required>
            <input name="city" list="clinic-city-options" required minLength={2} maxLength={80} className="field" value={city} onChange={(event) => setCity(event.target.value)} disabled={locked} />
            <datalist id="clinic-city-options">{CITY_OPTIONS.map((city) => <option key={city.value} value={city.label} />)}</datalist>
          </Field>
          <Field label="Page address" hint="optional">
            <input
              name="slug"
              minLength={2}
              maxLength={80}
              className="field"
              defaultValue={initial?.slug}
              disabled={locked}
              placeholder="generated automatically"
            />
          </Field>
          <Field label="Cover colour" className="md:col-span-2">
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

      <Section step="02" title="Address and location" description="Type the address and mark the exact spot on the map. Branches can be added after the clinic is created." active={activeStep === 2}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Address (RU)" required>
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
          <Field label="Address (EN)" required>
            <input name="addressEn" required minLength={3} maxLength={300} className="field" defaultValue={initial?.addressEn} disabled={locked} />
          </Field>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-bold text-ink">Map pin <span className="font-medium text-muted">(optional)</span></p>
            <p className="mt-1 text-sm text-muted">Click the map or drag the pin to show the exact place of the clinic.</p>
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
            {coords.lat != null && coords.lng != null ? `Chosen: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "No location chosen yet"}
          </p>
        </div>
      </Section>

      <Section step="03" title="Contacts" description="Patients will see these on the clinic page" active={activeStep === 3}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Phone" required>
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
          <Field label="Website" hint="optional">
            <input name="website" className="field" defaultValue={initial?.website || ""} disabled={locked} />
          </Field>
          <Field label="WhatsApp" hint="optional">
            <input name="whatsapp" className="field" defaultValue={initial?.whatsapp || ""} disabled={locked} />
          </Field>
          <Field label="Telegram" hint="optional">
            <input name="telegram" className="field" defaultValue={initial?.telegram || ""} disabled={locked} />
          </Field>
          <Field label="Coordinator" hint="optional">
            <input
              name="coordinatorName"
              className="field"
              defaultValue={initial?.coordinatorName || ""}
              disabled={locked}
            />
          </Field>
          <Field label="Reply time, hours">
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

      <Section step="04" title="About the clinic" description="A short description for the card and the page" active={activeStep === 4}>
        <div className="grid gap-4">
          <Field label="Description (RU)" required>
            <textarea
              name="descriptionRu"
              required
              minLength={10}
              maxLength={5000}
              rows={4}
              className="field"
              defaultValue={initial?.descriptionRu}
              disabled={locked}
              placeholder="What the clinic does and who it suits…"
            />
          </Field>
          <Field label="Description (EN)" required>
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

      <Section step="05" title="Languages and specialties" description="Can be changed later in the profile editor" active={activeStep === 5}>
        <div className="space-y-5">
          <div>
            <p className="text-sm font-bold text-ink">Service languages <span className="text-danger">*</span></p>
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
            <p className="text-sm font-bold text-ink">Specialties</p>
            <p className="mt-1 text-xs text-muted">Chosen: {specialtyIds.length + customSpecialties.length}</p>
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
                    {item.nameEn || item.nameRu}
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
                  <p className="text-sm font-bold text-ink">Add your own specialty</p>
                  <p className="mt-1 text-xs text-muted">It is added to this clinic profile only.</p>
                </div>
                <input name="customSpecialtyRu" minLength={2} maxLength={120} className="field" placeholder="Name in Russian" />
                <input name="customSpecialtyEn" minLength={2} maxLength={120} className="field" placeholder="Name in English (optional)" />
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
                      setError("Enter the specialty name in Russian (2 to 120 characters).");
                      return;
                    }
                    if (customSpecialties.some((item) => item.nameRu.toLocaleLowerCase("ru") === nameRu.toLocaleLowerCase("ru"))) {
                      setError("This specialty is already added.");
                      return;
                    }
                    setError(null);
                    setCustomSpecialties((prev) => [...prev, { nameRu, nameEn }]);
                    if (ru instanceof HTMLInputElement) ru.value = "";
                    if (en instanceof HTMLInputElement) en.value = "";
                  }}
                >
                  Add specialty
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      {!locked ? (
        <div className="soft-card sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-ink">Step {activeStep} of 5</p>
            <p className="text-xs text-muted">The draft can be completed after it is created</p>
          </div>
          <div className="flex gap-2">
            {activeStep > 1 ? (
              <button className="btn btn-ghost" type="button" onClick={() => setActiveStep((step) => step - 1)}>Back</button>
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
              >Continue</button>
            ) : (
              <button className="btn btn-primary min-w-[180px]" type="submit" disabled={loading}>
                {loading ? "Creating…" : submitLabel}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </form>
  );
}
