import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { CITY_LABELS, fetchClinics, fetchSpecialties } from "@/shared/api/client";
import { SelectField } from "@/shared/ui/SelectField";
import { CITY_OPTIONS, displayCity, normalizeCity } from "@/shared/lib/cities";
import { motion } from "motion/react";
import { Reveal, RevealGroup, revealItem } from "@/shared/ui/Reveal";
import { HeroBuild } from "@/widgets/hero-build/HeroBuild";
import { LogoTiles } from "@/shared/ui/LogoTiles";

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
  { value: "name", label: "По алфавиту" },
  { value: "response", label: "Быстрый ответ" },
  { value: "price", label: "Цена" },
  { value: "city", label: "Город" },
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
      (search.sort && search.sort !== "name"),
  );
}

function clinicWord(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "клиник";
  if (last === 1) return "клиника";
  return last >= 2 && last <= 4 ? "клиники" : "клиник";
}

export function ClinicCatalog({ search, onPatchSearch, onClearSearch }: Props) {
  const titleId = useId();
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogSearch>(search);
  const [q, setQ] = useState(search.q || "");
  const [city, setCity] = useState(displayCity(search.city));
  const [specialty, setSpecialty] = useState(search.specialty || "");
  const [sort, setSort] = useState(search.sort || "name");

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
        sort: search.sort || "name",
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
    setSort(search.sort || "name");
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
    <section className="reference-home">
      <HeroBuild />

      <RevealGroup className="care-steps">
        <motion.a variants={revealItem} href="#catalog"><span className="care-step-number">01</span><span><strong>Найдите клинику</strong><small>По городу и направлению</small></span></motion.a>
        <motion.a variants={revealItem} href="#clinic-results"><span className="care-step-number">02</span><span><strong>Сравните варианты</strong><small>Услуги, специалисты и контакты</small></span></motion.a>
        <motion.div variants={revealItem}><Link to="/checker"><span className="care-step-number">03</span><span><strong>Задайте вопрос</strong><small>Поможем выбрать направление</small></span></Link></motion.div>
      </RevealGroup>
      <div className="catalog-content">
        <LogoTiles corner="tr" seed={11} />
        <Reveal id="catalog" className="catalog-search-card scroll-mt-28">
          <form id="catalog-search" onSubmit={applyQuick}>
            <div className="catalog-search-grid">
              <label className="catalog-query">
                <span>Клиника или услуга</span>
                <span className="catalog-query-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <input className="field" placeholder="Например, кардиология…" value={q} onChange={(e) => setQ(e.target.value)} />
                </span>
              </label>
              <label><span>Город</span><input className="field" list="catalog-city-options" placeholder="Все города" value={city} onChange={(event) => setCity(event.target.value)} /></label>
              <datalist id="catalog-city-options">{CITY_OPTIONS.map((item) => <option key={item.value} value={item.label} />)}</datalist>
              <label><span>Направление</span><SelectField value={specialty} options={specialtyOptions} onChange={setSpecialty} /></label>
              <label><span>Сортировать по</span><SelectField value={sort} options={SORT_OPTIONS} onChange={setSort} /></label>
              <button type="button" className="catalog-more" onClick={() => setModalOpen(true)}>Ещё{advancedCount ? ` · ${advancedCount}` : " фильтров"}</button>
              <button className="catalog-submit" type="submit">
                Найти
                <span aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.2" />
                    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </div>
          </form>
          {specialties.data?.length ? (
            <div className="catalog-popular"><span>Популярные направления:</span>{specialties.data.slice(0, 4).map((item) => <button key={item.slug} type="button" onClick={() => onPatchSearch({ specialty: item.slug })}>{item.nameRu || item.nameEn}</button>)}</div>
          ) : null}
        </Reveal>
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

      <div id="clinic-results" className="mt-12 scroll-mt-28">
        <Reveal className="catalog-heading">
          <div>
            <p className="catalog-eyebrow">Каталог</p>
            <h2>Выберите свою клинику</h2>
          </div>
          {!clinics.isLoading && clinics.data ? (
            <span className="catalog-count">
              {clinics.data.length} {clinicWord(clinics.data.length)}
            </span>
          ) : null}
        </Reveal>

      {clinics.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="overflow-hidden rounded-[1.5rem] border border-line bg-white"><div className="h-44 animate-pulse bg-primary-soft" /><div className="space-y-3 p-5"><div className="h-5 w-3/4 animate-pulse rounded bg-sand" /><div className="h-3 w-1/2 animate-pulse rounded bg-sand" /><div className="h-14 animate-pulse rounded bg-sand" /></div></div>)}
        </div>
      ) : null}
      {clinics.isError ? <p className="mt-8 rounded-2xl bg-danger-soft p-5 text-danger">Не удалось загрузить клиники. Попробуйте обновить страницу.</p> : null}
      {!clinics.isLoading && clinics.data?.length === 0 ? (
        <div className="rounded-[1.5rem] border border-line bg-white px-6 py-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-2xl text-primary">⌕</span>
          <p className="mt-4 text-lg font-extrabold text-ink">Пока не нашли совпадений</p>
          <p className="mt-1 text-sm text-muted">Попробуйте убрать часть фильтров или выбрать другое направление.</p>
          <button type="button" className="btn btn-ghost mt-4 text-sm" onClick={onClearSearch}>Сбросить фильтры</button>
        </div>
      ) : null}

      <RevealGroup className="clinic-grid" key={clinics.dataUpdatedAt}>
        {clinics.data?.map((clinic) => (
          <motion.div key={clinic.id} variants={revealItem} className="clinic-grid-item">
          <Link
            to="/clinics/$slug"
            params={{ slug: clinic.slug }}
            aria-label={clinic.nameRu || clinic.nameEn}
            className="clinic-card"
          >
            <div className="clinic-card-cover">
              {hasPhoto(clinic.photos?.[0]?.url) ? (
                <img src={clinic.photos![0].url} alt="" className="clinic-card-photo" />
              ) : (
                <div className="clinic-card-placeholder">
                  <img src="/brand/logo.svg" alt="" width={56} height={56} />
                </div>
              )}
              <span className="clinic-card-city">{CITY_LABELS[clinic.city] || clinic.city}</span>
              {clinic.logoUrl && hasPhoto(clinic.photos?.[0]?.url) ? <img src={clinic.logoUrl} alt="" className="clinic-card-logo" /> : null}
            </div>
            <div className="clinic-card-body">
              <div className="clinic-card-head">
                <h3>{clinic.nameRu || clinic.nameEn}</h3>
                {clinic.responseHours ? <span className="clinic-card-reply">~{clinic.responseHours} ч</span> : null}
              </div>
              <p className="clinic-card-meta">
                {clinic.branchCount ? `${clinic.branchCount} филиала` : "Профиль клиники"}
                {clinic.fromPrice != null ? ` · услуги от $${clinic.fromPrice}` : ""}
              </p>
              {(clinic.addressRu || clinic.addressEn) && (
                <p className="clinic-card-address">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  {clinic.addressRu || clinic.addressEn}
                </p>
              )}
              <p className="clinic-card-text">{clinic.descriptionRu || clinic.descriptionEn}</p>
              {clinic.specialties?.length ? (
                <div className="clinic-card-tags">
                  {clinic.specialties.slice(0, 4).map((s) => (
                    <span key={s.slug}>{s.nameRu || s.nameEn}</span>
                  ))}
                </div>
              ) : null}
              <div className="clinic-card-foot">
                <span className="clinic-card-langs">
                  {clinic.languages?.slice(0, 4).map((lang) => <span key={lang}>{lang}</span>)}
                </span>
                <span className="clinic-card-more">
                  Подробнее
                  <span aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </div>
            </div>
          </Link>
          </motion.div>
        ))}
      </RevealGroup>
      </div>

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

/** A real cover photo; the seeded SVG drawings stand in for missing photos and get the brand cover instead. */
function hasPhoto(url?: string | null): url is string {
  return Boolean(url) && !url!.toLowerCase().endsWith(".svg");
}
