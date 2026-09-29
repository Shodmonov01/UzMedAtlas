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
    <section className="scroll-mt-24">
      <div className="home-hero hero-enter mb-10 px-6 pb-6 pt-8 sm:px-10 sm:pt-12 lg:px-14 lg:pb-8 lg:pt-14">
        <div className="grid items-center gap-5 lg:grid-cols-[1.1fr_.9fr] lg:gap-0">
          <div className="relative z-10 max-w-2xl pb-5 lg:pb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/75 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[.12em] text-primary shadow-sm">
              <span className="h-2 w-2 rounded-full bg-clay shadow-[0_0_0_4px_rgba(233,134,92,.14)]" />
              Медицинский атлас Узбекистана
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.04] tracking-[-.06em] text-ink sm:text-5xl lg:text-[3.65rem]">
              Найдите место, где о вас <span className="text-primary">позаботятся</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted sm:text-lg">
              Сравните клиники, направления и услуги. Спокойно выберите подходящий вариант и свяжитесь напрямую.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#catalog-search" className="btn btn-primary rounded-full px-6 py-3.5 shadow-xl shadow-primary/20">
                Найти клинику <span className="text-lg" aria-hidden="true">↘</span>
              </a>
              <Link to="/checker" className="group inline-flex items-center gap-2 rounded-full px-3 py-3 text-sm font-bold text-ink transition hover:bg-white/70">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-primary shadow-sm transition group-hover:scale-110">✳</span>
                Не знаете, с чего начать?
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted">
              <span className="inline-flex items-center gap-1.5"><span className="text-primary">✓</span> Понятные профили клиник</span>
              <span className="inline-flex items-center gap-1.5"><span className="text-primary">✓</span> Фильтры по вашим критериям</span>
            </div>
          </div>

            <div className="relative mx-auto h-[250px] w-full max-w-[420px] sm:h-[310px] lg:h-[390px]" aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 shadow-[inset_0_0_0_1px_rgba(21,112,239,.1)] sm:h-[320px] sm:w-[320px]" />
            <div className="absolute left-1/2 top-1/2 h-[195px] w-[195px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/20 sm:h-[265px] sm:w-[265px]" />
            <div className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2.5rem] bg-gradient-to-br from-primary to-primary-deep text-white shadow-[0_24px_55px_-20px_rgba(24,73,169,.35)] sm:h-48 sm:w-48 sm:rounded-[3.25rem]">
              <div className="absolute inset-2 rounded-[2rem] border border-white/20 sm:rounded-[2.75rem]" />
              <svg viewBox="0 0 120 120" className="relative h-24 w-24 sm:h-32 sm:w-32" fill="none" aria-hidden="true">
                <path d="M60 104c-4.2-3.2-31-24.3-40.5-40.2C4.7 39.8 21.1 17 42 21c8.3 1.6 14.5 7.1 18 13.4C63.5 28.1 69.7 22.6 78 21c20.9-4 37.3 18.8 22.5 42.8C91 79.7 64.2 100.8 60 104Z" fill="currentColor" fillOpacity=".17" stroke="currentColor" strokeWidth="3" />
                <path d="M54 40h12v14h14v12H66v14H54V66H40V54h14V40Z" fill="currentColor" />
              </svg>
              <span className="absolute bottom-4 text-[10px] font-extrabold uppercase tracking-[.2em] text-white/70">UzMedAtlas</span>
            </div>
            <div className="hero-float absolute left-0 top-[14%] rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-xl shadow-primary/10 backdrop-blur sm:left-[2%] sm:p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-xl text-primary">⌕</span>
              <p className="mt-2 text-xs font-extrabold text-ink">Найдите направление</p>
              <p className="mt-0.5 text-[10px] text-muted">от симптомов к выбору</p>
            </div>
            <div className="hero-float-delayed absolute bottom-[12%] right-0 rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-xl shadow-clay/10 backdrop-blur sm:right-[1%] sm:p-4">
              <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-warning-soft text-lg text-gold">✦</span>
                <div><p className="text-xs font-extrabold text-ink">Сравните варианты</p><p className="mt-0.5 text-[10px] text-muted">услуги · врачи · контакты</p></div>
              </div>
            </div>
            <span className="absolute right-[15%] top-[8%] h-3 w-3 rounded-full bg-clay shadow-[0_0_0_7px_rgba(21,112,239,.12)]" />
            <span className="absolute bottom-[13%] left-[15%] h-2 w-2 rounded-full bg-primary" />
          </div>
        </div>

        <div id="catalog" className="scroll-mt-28 rounded-[1.5rem] border border-white bg-white/90 p-3 shadow-[0_20px_50px_-25px_rgba(24,73,169,.16)] backdrop-blur sm:p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
            <div>
              <p className="text-sm font-extrabold text-ink sm:text-base">Подберите клинику под себя</p>
              <p className="mt-0.5 text-xs text-muted">Ищите по названию, городу или направлению</p>
            </div>
              <span className="hidden rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary sm:inline-flex">Ваш выбор — в вашем темпе</span>
          </div>
          <form id="catalog-search" className="rounded-2xl bg-white" onSubmit={applyQuick}>
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto_auto]">
              <input className="field" placeholder="Например, кардиология…" value={q} onChange={(e) => setQ(e.target.value)} />
              <div>
                <input className="field" list="catalog-city-options" placeholder="Город" value={city} onChange={(event) => setCity(event.target.value)} />
                <datalist id="catalog-city-options">{CITY_OPTIONS.map((item) => <option key={item.value} value={item.label} />)}</datalist>
              </div>
              <SelectField value={specialty} options={specialtyOptions} onChange={setSpecialty} />
              <SelectField value={sort} options={SORT_OPTIONS} onChange={setSort} />
              <button type="button" className="btn btn-ghost px-4 py-2 text-sm" onClick={() => setModalOpen(true)}>
                Ещё{advancedCount ? ` · ${advancedCount}` : " фильтров"}
              </button>
              <button className="btn btn-primary px-5 py-2 text-sm lg:col-span-6 lg:justify-self-start lg:min-w-[220px]" type="submit">Найти клинику</button>
            </div>
          </form>
          {specialties.data?.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
              <span className="mr-1 text-xs font-bold text-muted">Популярные направления:</span>
              {specialties.data.slice(0, 4).map((item) => (
                <button key={item.slug} type="button" className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-muted transition hover:border-primary/30 hover:bg-primary-soft hover:text-primary" onClick={() => onPatchSearch({ specialty: item.slug })}>
                  {item.nameRu || item.nameEn}
                </button>
              ))}
            </div>
          ) : null}
        </div>
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
