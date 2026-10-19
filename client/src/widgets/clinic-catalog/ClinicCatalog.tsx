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
    <section className="reference-home">
      <div className="home-hero">
        <img className="home-hero-photo" src="/images/consultation-banner.jpg" alt="" width="1920" height="2876" fetchPriority="high" />
        <div className="home-hero-shade" />
        <div className="home-hero-copy">
          <p className="home-eyebrow">Медицинский атлас Узбекистана</p>
          <h1>Медицина, которой<br /><span>можно доверять.</span></h1>
          <p className="home-hero-description">Найдите свою клинику.<br />Выберите заботу о себе.</p>
          <div className="home-hero-actions">
            <a href="#catalog" className="btn btn-accent">Найти клинику <span aria-hidden="true">→</span></a>
            <Link to="/checker" className="home-hero-secondary">Подобрать направление <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <svg className="home-hero-wave" viewBox="0 0 1440 230" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0C140 100 160 212 395 172L1440 0V230H0Z" fill="var(--accent)" />
          <path d="M0 23C140 123 160 229 395 189L1440 18V230H0Z" fill="var(--paper)" />
        </svg>
      </div>

      <div className="care-intro-band">
        <div className="care-intro">
          <div className="care-illustration" aria-hidden="true">
            <svg viewBox="0 0 440 330" fill="none">
              <path d="M91 91C106 20 208 0 257 40L371 139C415 178 377 258 315 271L155 302C75 316 29 247 53 191Z" fill="var(--accent)" />
              <path d="M107 86C122 21 211 16 255 51L362 144C402 179 370 247 309 261L159 289C84 304 45 243 67 193Z" fill="var(--primary)" />
              <rect x="112" y="76" width="221" height="175" rx="11" fill="white" />
              <rect x="122" y="87" width="201" height="146" rx="4" fill="#EDF7F2" />
              <path d="M200 251H245L250 270H194Z" fill="#AAC9C0" />
              <rect x="173" y="270" width="99" height="7" rx="3.5" fill="var(--primary)" />
              <rect x="143" y="108" width="53" height="53" rx="12" fill="var(--accent)" />
              <path d="M169.5 120V149M155 134.5H184" stroke="white" strokeWidth="7" strokeLinecap="round" />
              <path d="M214 115H298M214 131H279M214 147H288" stroke="#ADCABD" strokeWidth="6" strokeLinecap="round" />
              <path d="M143 185H171L179 173L191 205L205 181L216 191H251" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="276" y="173" width="23" height="38" rx="4" fill="#D5EBDE" />
              <path d="M288 181V202M282 191H294" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="326" cy="87" r="28" fill="var(--accent)" />
              <path d="M315 87L323 95L338 79" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="74" y="197" width="65" height="78" rx="8" fill="white" stroke="#B9DACA" strokeWidth="2" />
              <path d="M89 217H122M89 229H112M89 241H119M89 253H104" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
              <circle cx="221" cy="242" r="3" fill="#AAC9C0" />
              <ellipse cx="220" cy="293" rx="133" ry="5" fill="var(--primary)" fillOpacity=".06" />
            </svg>
          </div>
          <div className="care-intro-copy">
            <p className="section-eyebrow">Ориентир в мире медицины</p>
            <h2>Нужная помощь.<br />Понятный выбор.</h2>
            <p>Собрали клиники Узбекистана в одном месте. Изучайте направления, сравнивайте услуги и находите то, что подходит именно вам.</p>
            <p>От первого вопроса до обращения в клинику — двигайтесь в своём темпе.</p>
            <Link to="/checker" className="care-intro-link">С чего начать? <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="care-steps">
          <a href="#catalog"><span className="care-step-number">01</span><span><strong>Найдите клинику</strong><small>По городу и направлению</small></span></a>
          <a href="#clinic-results"><span className="care-step-number">02</span><span><strong>Сравните варианты</strong><small>Услуги, специалисты и контакты</small></span></a>
          <Link to="/checker"><span className="care-step-number">03</span><span><strong>Задайте вопрос</strong><small>Поможем выбрать направление</small></span></Link>
        </div>
      </div>

      <div className="catalog-content">
        <div id="catalog" className="catalog-search-card scroll-mt-28">
          <div className="catalog-search-heading">
            <div><p className="section-eyebrow">Начните здесь</p><h2>Найдём вашу клинику</h2></div>
            <span className="catalog-search-caption">Город. Направление. Ваш выбор.</span>
          </div>
          <form id="catalog-search" onSubmit={applyQuick}>
            <div className="catalog-search-grid">
              <label className="catalog-query"><span>Клиника или услуга</span><input className="field" placeholder="Например, кардиология…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
              <label><span>Город</span><input className="field" list="catalog-city-options" placeholder="Все города" value={city} onChange={(event) => setCity(event.target.value)} /></label>
              <datalist id="catalog-city-options">{CITY_OPTIONS.map((item) => <option key={item.value} value={item.label} />)}</datalist>
              <label><span>Направление</span><SelectField value={specialty} options={specialtyOptions} onChange={setSpecialty} /></label>
              <label><span>Сортировать по</span><SelectField value={sort} options={SORT_OPTIONS} onChange={setSort} /></label>
              <button type="button" className="catalog-more btn btn-ghost" onClick={() => setModalOpen(true)}>Ещё{advancedCount ? ` · ${advancedCount}` : " фильтров"}</button>
              <button className="catalog-submit btn btn-primary" type="submit">Найти <span aria-hidden="true">→</span></button>
            </div>
          </form>
          {specialties.data?.length ? (
            <div className="catalog-popular"><span>Популярные направления:</span>{specialties.data.slice(0, 4).map((item) => <button key={item.slug} type="button" onClick={() => onPatchSearch({ specialty: item.slug })}>{item.nameRu || item.nameEn}</button>)}</div>
          ) : null}
        </div>
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
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-primary">Ваш следующий шаг</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Выберите свою клинику</h2>
            <p className="mt-1 text-sm text-muted">Сравните профили и найдите то, что важно именно вам.</p>
          </div>
          {!clinics.isLoading && clinics.data ? (
              <span className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm">
              {clinics.data.length} {clinicWord(clinics.data.length)}
            </span>
          ) : null}
        </div>

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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {clinics.data?.map((clinic) => (
          <article
            key={clinic.id}
            className="clinic-card group soft-card flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-line/70 bg-white"
          >
            <div className="relative h-44 shrink-0 overflow-hidden bg-primary-soft">
              {clinic.photos?.[0]?.url ? (
                <img
                  src={clinic.photos[0].url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="clinic-cover-fallback absolute inset-0 grid place-items-center" style={{ backgroundColor: clinic.coverColor || "#1570ef" }}>
                  <svg viewBox="0 0 100 100" className="h-24 w-24 text-white/90 drop-shadow-lg transition duration-500 group-hover:scale-110" fill="none" aria-hidden="true">
                    <path d="M50 8v84M8 50h84" stroke="currentColor" strokeWidth="13" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeOpacity=".28" strokeWidth="2" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-primary-deep/45 via-transparent to-ink/5" />
              <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-[11px] font-extrabold text-primary-deep shadow-sm backdrop-blur">
                {CITY_LABELS[clinic.city] || clinic.city}
              </span>
              {clinic.medicalTourism ? <span className="absolute right-4 top-4 rounded-full bg-warning-soft px-3 py-1 text-[11px] font-extrabold text-[#8a6100]">Для гостей страны</span> : null}
              {clinic.logoUrl ? (
                <img
                  src={clinic.logoUrl}
                  alt=""
                  className="absolute bottom-3 left-4 h-14 w-14 rounded-2xl border-2 border-white bg-white object-cover shadow-lg"
                />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-extrabold leading-tight text-ink">{clinic.nameRu || clinic.nameEn}</h3>
                {clinic.responseHours ? <span className="shrink-0 rounded-xl bg-success-soft px-2.5 py-1 text-[11px] font-extrabold text-[#087f5b]">~{clinic.responseHours} ч</span> : null}
              </div>
              <p className="text-xs font-semibold text-muted">
                {clinic.branchCount ? `${clinic.branchCount} филиала` : "Профиль клиники"}
                {clinic.fromPrice != null ? ` · услуги от $${clinic.fromPrice}` : ""}
              </p>
              {(clinic.addressRu || clinic.addressEn) && (
                <p className="line-clamp-2 inline-flex items-start gap-2 text-sm text-muted"><span className="mt-0.5 text-clay">⌖</span>{clinic.addressRu || clinic.addressEn}</p>
              )}
              <p className="line-clamp-3 text-sm leading-6 text-muted">
                {clinic.descriptionRu || clinic.descriptionEn}
              </p>
              {clinic.specialties?.length ? (
                <div className="flex flex-wrap gap-2">
                  {clinic.specialties.slice(0, 4).map((s) => (
                    <span key={s.slug} className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-deep">
                      {s.nameRu || s.nameEn}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mb-2 flex flex-wrap gap-2 text-[10px] font-extrabold text-muted">
                {clinic.languages?.slice(0, 4).map((lang) => (
                  <span key={lang} className="rounded-full border border-line bg-white px-2.5 py-1.5 uppercase tracking-wide">
                    {lang}
                  </span>
                ))}
              </div>
              <Link
                to="/clinics/$slug"
                params={{ slug: clinic.slug }}
                className="mt-auto inline-flex w-full items-center justify-between rounded-2xl bg-primary-soft px-4 py-3 text-sm font-extrabold text-primary-deep transition group-hover:bg-primary group-hover:text-white"
              >
                Смотреть клинику <span className="text-lg transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
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
