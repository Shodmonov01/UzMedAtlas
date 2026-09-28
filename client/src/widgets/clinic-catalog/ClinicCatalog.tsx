import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { CITY_LABELS, fetchClinics, fetchSpecialties } from "@/shared/api/client";
import { SelectField } from "@/shared/ui/SelectField";
import { CITY_OPTIONS, displayCity, normalizeCity } from "@/shared/lib/cities";

export type CatalogSearch = {
  q?: string;
  city?: string;
  specialty?: string;
  lang?: string;
  sort?: string;
  service?: string;
  priceMin?: string;
  priceMax?: string;
  responseMax?: string;
  medicalTourism?: string;
};

type Props = {
  search: CatalogSearch;
  onPatchSearch: (patch: Partial<CatalogSearch>) => void;
  onClearSearch: () => void;
};

const SERVICE_OPTIONS = [
  { value: "", label: "Любая услуга" },
  { value: "mri", label: "МРТ" },
  { value: "ct", label: "КТ" },
  { value: "ultrasound", label: "УЗИ" },
  { value: "checkup", label: "Check-up" },
  { value: "consultation", label: "Консультация" },
  { value: "surgery", label: "Операция" },
  { value: "endoscopy", label: "Эндоскопия" },
];

const SORT_OPTIONS = [
  { value: "response", label: "Быстрый ответ" },
  { value: "price", label: "Цена" },
  { value: "city", label: "Город" },
  { value: "name", label: "Название" },
];

const LANG_OPTIONS = [
  { value: "", label: "Любой язык" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "uz", label: "Oʻzbek" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
  { value: "kz", label: "Қазақша" },
];

const RESPONSE_OPTIONS = [
  { value: "", label: "Не важно" },
  { value: "6", label: "До 6 часов" },
  { value: "12", label: "До 12 часов" },
  { value: "24", label: "До 24 часов" },
  { value: "48", label: "До 48 часов" },
];

function countAdvanced(search: CatalogSearch) {
  return [
    search.lang,
    search.service,
    search.priceMin,
    search.priceMax,
    search.responseMax,
    search.medicalTourism,
  ].filter(Boolean).length;
}

function hasAnyFilter(search: CatalogSearch) {
  return Boolean(
    search.q ||
      search.city ||
      search.specialty ||
      search.lang ||
      search.service ||
      search.priceMin ||
      search.priceMax ||
      search.responseMax ||
      search.medicalTourism ||
      (search.sort && search.sort !== "response"),
  );
}

export function ClinicCatalog({ search, onPatchSearch, onClearSearch }: Props) {
  const titleId = useId();
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogSearch>(search);
  const [q, setQ] = useState(search.q || "");
  const [city, setCity] = useState(displayCity(search.city));
  const [specialty, setSpecialty] = useState(search.specialty || "");
  const [sort, setSort] = useState(search.sort || "response");

  const specialties = useQuery({
    queryKey: ["specialties"],
    queryFn: fetchSpecialties,
  });

  const clinics = useQuery({
    queryKey: ["clinics", search],
    queryFn: () =>
      fetchClinics({
        q: search.q,
        city: search.city,
        specialty: search.specialty,
        lang: search.lang,
        sort: search.sort || "response",
        service: search.service,
        priceMin: search.priceMin,
        priceMax: search.priceMax,
        responseMax: search.responseMax,
        medicalTourism: search.medicalTourism,
      }),
  });

  useEffect(() => {
    setQ(search.q || "");
    setCity(displayCity(search.city));
    setSpecialty(search.specialty || "");
    setSort(search.sort || "response");
  }, [search.q, search.city, search.specialty, search.sort]);

  useEffect(() => {
    if (modalOpen) setDraft(search);
  }, [modalOpen, search]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const advancedCount = countAdvanced(search);
  const specialtyOptions = [
    { value: "", label: "Направление" },
    ...(specialties.data || []).map((s) => ({
      value: s.slug,
      label: s.nameRu || s.nameEn,
    })),
  ];

  function applyQuick(e: React.FormEvent) {
    e.preventDefault();
    onPatchSearch({
      q: q.trim() || undefined,
      city: city.trim() ? normalizeCity(city) : undefined,
      specialty: specialty || undefined,
      sort: sort || undefined,
    });
  }

  function applyAdvanced() {
    onPatchSearch({
      lang: draft.lang || undefined,
      service: draft.service || undefined,
      priceMin: draft.priceMin || undefined,
      priceMax: draft.priceMax || undefined,
      responseMax: draft.responseMax || undefined,
      medicalTourism: draft.medicalTourism === "1" ? "1" : undefined,
    });
    setModalOpen(false);
  }

  return (
    <section id="catalog" className="scroll-mt-24">
      {search.specialty ? (
        <div className="mb-4 rounded-2xl border border-primary/15 bg-mint px-4 py-3 text-sm">
          <p className="font-bold text-primary">Подборка по Health Checker</p>
          <p className="mt-1 text-muted">
            Направление «
            {(specialties.data || []).find((s) => s.slug === search.specialty)?.nameRu ||
              search.specialty}
            »
          </p>
        </div>
      ) : null}

      <form
        className="rounded-2xl border border-line bg-white p-3 shadow-[0_12px_40px_-28px_rgba(31,41,55,0.35)]"
        onSubmit={applyQuick}
      >
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto_auto]">
          <input
            className="field"
            placeholder="Поиск клиники…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div>
            <input className="field" list="catalog-city-options" placeholder="Город" value={city} onChange={(event) => setCity(event.target.value)} />
            <datalist id="catalog-city-options">{CITY_OPTIONS.map((item) => <option key={item.value} value={item.label} />)}</datalist>
          </div>
          <SelectField value={specialty} options={specialtyOptions} onChange={setSpecialty} />
          <SelectField value={sort} options={SORT_OPTIONS} onChange={setSort} />
          <button type="button" className="btn btn-ghost px-4 py-2 text-sm" onClick={() => setModalOpen(true)}>
            Ещё{advancedCount ? ` · ${advancedCount}` : ""}
          </button>
          <button className="btn btn-primary px-5 py-2 text-sm" type="submit">
            Найти
          </button>
        </div>
      </form>

      {hasAnyFilter(search) ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {search.city ? <span className="chip">{CITY_LABELS[search.city] || search.city}</span> : null}
          {search.specialty ? (
            <span className="chip">
              {(specialties.data || []).find((s) => s.slug === search.specialty)?.nameRu ||
                search.specialty}
            </span>
          ) : null}
          {search.lang ? <span className="chip">{search.lang.toUpperCase()}</span> : null}
          {search.service ? (
            <span className="chip">
              {SERVICE_OPTIONS.find((s) => s.value === search.service)?.label || search.service}
            </span>
          ) : null}
          {search.priceMin || search.priceMax ? (
            <span className="chip">
              ${search.priceMin || "0"}–{search.priceMax || "∞"}
            </span>
          ) : null}
          {search.responseMax ? <span className="chip">ответ ≤ {search.responseMax}ч</span> : null}
          {search.medicalTourism === "1" ? <span className="chip">медтуризм</span> : null}
          <button type="button" className="text-sm font-bold text-primary" onClick={onClearSearch}>
            Сбросить
          </button>
        </div>
      ) : null}

      {clinics.isLoading ? <p className="mt-8 text-muted">Загрузка…</p> : null}
      {clinics.isError ? <p className="mt-8 text-danger">Не удалось загрузить клиники</p> : null}
      {!clinics.isLoading && clinics.data?.length === 0 ? (
        <p className="mt-8 text-muted">Ничего не найдено. Измените фильтры.</p>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clinics.data?.map((clinic) => (
          <article
            key={clinic.id}
            className="soft-card flex h-full flex-col overflow-hidden rounded-2xl bg-white"
          >
            <div className="relative h-28 shrink-0" style={{ background: clinic.coverColor || "#1570ef" }}>
              {clinic.photos?.[0]?.url ? (
                <img
                  src={clinic.photos[0].url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              {clinic.logoUrl ? (
                <img
                  src={clinic.logoUrl}
                  alt=""
                  className="absolute bottom-3 left-3 h-12 w-12 rounded-xl border border-white/40 bg-white object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <h2 className="text-xl font-extrabold">{clinic.nameRu || clinic.nameEn}</h2>
              <p className="text-sm text-muted">
                {CITY_LABELS[clinic.city] || clinic.city}
                {clinic.branchCount ? ` · филиалов: ${clinic.branchCount}` : ""}
                {clinic.responseHours ? ` · ответ ~${clinic.responseHours}ч` : ""}
              </p>
              {(clinic.addressRu || clinic.addressEn) && (
                <p className="line-clamp-2 text-sm text-muted">{clinic.addressRu || clinic.addressEn}</p>
              )}
              <p className="line-clamp-3 text-sm text-muted">
                {clinic.descriptionRu || clinic.descriptionEn}
              </p>
              {clinic.specialties?.length ? (
                <div className="flex flex-wrap gap-2">
                  {clinic.specialties.slice(0, 4).map((s) => (
                    <span key={s.slug} className="chip">
                      {s.nameRu || s.nameEn}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mb-1 flex flex-wrap gap-2 text-xs font-bold text-muted">
                {clinic.languages?.slice(0, 4).map((lang) => (
                  <span key={lang} className="rounded-full bg-sand px-2 py-1 uppercase">
                    {lang}
                  </span>
                ))}
                {clinic.fromPrice != null ? <span>от ${clinic.fromPrice}</span> : null}
                {clinic.medicalTourism ? <span>медтуризм</span> : null}
              </div>
              <Link
                to="/clinics/$slug"
                params={{ slug: clinic.slug }}
                className="btn btn-primary mt-auto w-full text-sm"
              >
                Подробнее
              </Link>
            </div>
          </article>
        ))}
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_60px_-24px_rgba(31,41,55,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="text-2xl font-extrabold">
                  Дополнительные фильтры
                </h2>
                <p className="mt-1 text-sm text-muted">Цена, услуга, язык и медтуризм</p>
              </div>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-sand"
                aria-label="Закрыть"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-bold">
                Язык обслуживания
                <div className="mt-1">
                  <SelectField
                    value={draft.lang || ""}
                    options={LANG_OPTIONS}
                    onChange={(value) => setDraft((d) => ({ ...d, lang: value || undefined }))}
                  />
                </div>
              </label>

              <label className="block text-sm font-bold">
                Услуга
                <div className="mt-1">
                  <SelectField
                    value={draft.service || ""}
                    options={SERVICE_OPTIONS}
                    onChange={(value) => setDraft((d) => ({ ...d, service: value || undefined }))}
                  />
                </div>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-bold">
                  Цена от, $
                  <input
                    type="number"
                    min={0}
                    className="field mt-1"
                    placeholder="0"
                    value={draft.priceMin || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, priceMin: e.target.value || undefined }))
                    }
                  />
                </label>
                <label className="block text-sm font-bold">
                  Цена до, $
                  <input
                    type="number"
                    min={0}
                    className="field mt-1"
                    placeholder="500"
                    value={draft.priceMax || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, priceMax: e.target.value || undefined }))
                    }
                  />
                </label>
              </div>

              <label className="block text-sm font-bold">
                Ответ координатора
                <div className="mt-1">
                  <SelectField
                    value={draft.responseMax || ""}
                    options={RESPONSE_OPTIONS}
                    onChange={(value) =>
                      setDraft((d) => ({ ...d, responseMax: value || undefined }))
                    }
                  />
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3 text-sm font-bold">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--primary)]"
                  checked={draft.medicalTourism === "1"}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      medicalTourism: e.target.checked ? "1" : undefined,
                    }))
                  }
                />
                Поддержка медицинского туризма
              </label>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary flex-1" onClick={applyAdvanced}>
                Применить
              </button>
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={() => {
                  setDraft({});
                  onPatchSearch({
                    lang: undefined,
                    service: undefined,
                    priceMin: undefined,
                    priceMax: undefined,
                    responseMax: undefined,
                    medicalTourism: undefined,
                  });
                  setModalOpen(false);
                }}
              >
                Сбросить доп.
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
