import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { CITY_LABELS, fetchClinics, fetchSpecialties } from "@/shared/api/client";
import { SelectField } from "@/shared/ui/SelectField";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { FitImage } from "@/shared/ui/FitImage";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { CITY_OPTIONS, cityName } from "@/shared/lib/cities";
import { countWord, pickName, useLang, type Lang, type Text } from "@/shared/i18n/lang";
import { MOTION_OK, gsap, useGSAP } from "@/shared/lib/gsap";

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

const SERVICE_OPTIONS: { value: string; label: Text }[] = [
  { value: "", label: { ru: "Любая услуга", uz: "Istalgan xizmat", en: "Any service" } },
  { value: "mri", label: { ru: "МРТ", uz: "MRT", en: "MRI" } },
  { value: "ct", label: { ru: "КТ", uz: "KT", en: "CT" } },
  { value: "ultrasound", label: { ru: "УЗИ", uz: "UTT", en: "Ultrasound" } },
  { value: "checkup", label: { ru: "Check-up", uz: "Check-up", en: "Check-up" } },
  { value: "consultation", label: { ru: "Консультация", uz: "Konsultatsiya", en: "Consultation" } },
  { value: "surgery", label: { ru: "Операция", uz: "Operatsiya", en: "Surgery" } },
  { value: "endoscopy", label: { ru: "Эндоскопия", uz: "Endoskopiya", en: "Endoscopy" } },
];

const SORT_OPTIONS: { value: string; label: Text }[] = [
  { value: "name", label: { ru: "По алфавиту", uz: "Alifbo boʻyicha", en: "A to Z" } },
  { value: "response", label: { ru: "Быстрый ответ", uz: "Tez javob", en: "Fastest reply" } },
  { value: "price", label: { ru: "Цена", uz: "Narx", en: "Price" } },
  { value: "city", label: { ru: "Город", uz: "Shahar", en: "City" } },
];

const RESPONSE_OPTIONS: { value: string; label: Text }[] = [
  { value: "", label: { ru: "Не важно", uz: "Farqi yoʻq", en: "Any time" } },
  { value: "6", label: { ru: "До 6 часов", uz: "6 soatgacha", en: "Within 6 hours" } },
  { value: "12", label: { ru: "До 12 часов", uz: "12 soatgacha", en: "Within 12 hours" } },
  { value: "24", label: { ru: "До 24 часов", uz: "24 soatgacha", en: "Within 24 hours" } },
  { value: "48", label: { ru: "До 48 часов", uz: "48 soatgacha", en: "Within 48 hours" } },
];

/** A list of options with its labels in the current language, ready for a SelectField. */
const inLang = (lang: Lang, options: { value: string; label: Text }[]) => options.map((o) => ({ value: o.value, label: o.label[lang] }));

const LANG_OPTIONS = [
  { value: "", label: "Любой язык" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "uz", label: "Oʻzbek" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
  { value: "kz", label: "Қазақша" },
];

/** How many clinics one page of results shows. */
const PAGE = 9;

function countAdvanced(search: CatalogSearch) {
  return [search.lang, search.service, search.priceMin, search.priceMax, search.responseMax, search.medicalTourism].filter(Boolean).length;
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

/** The clinic catalog on the home page: heading, one search bar, the active filters and the clinics as photo-led tiles.
 *  The heading and bar rise in once; tiles rise in batches as they scroll into view and again after every new search. */
export function ClinicCatalog({ search, onPatchSearch, onClearSearch }: Props) {
  const root = useRef<HTMLElement>(null);
  const titleId = useId();
  const { lang, t } = useLang();
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogSearch>(search);
  const [q, setQ] = useState(search.q || "");
  // The results come a page at a time ("show more"), starting again from the first page for every new search.
  const [shown, setShown] = useState(PAGE);

  const specialties = useQuery({ queryKey: ["specialties"], queryFn: fetchSpecialties });

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
  }, [search.q]);

  useEffect(() => {
    setShown(PAGE);
  }, [clinics.dataUpdatedAt]);

  useEffect(() => {
    if (modalOpen) setDraft(search);
  }, [modalOpen, search]);

  // While the filters are open the page behind stays put (the scrollbar gap is kept so nothing shifts); Esc closes.
  useEffect(() => {
    if (!modalOpen) return;
    // Esc in an open dropdown closes only the dropdown (SelectField handles that); otherwise it closes the dialog.
    // Checked in the capture phase, before SelectField's own listener has closed the dropdown.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector('.filters-modal [aria-expanded="true"]')) setModalOpen(false);
    };
    const root = document.documentElement;
    const gap = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (gap > 0) root.style.paddingRight = `${gap}px`;
    window.addEventListener("keydown", onKey, true);
    return () => {
      root.style.removeProperty("overflow");
      root.style.removeProperty("padding-right");
      window.removeEventListener("keydown", onKey, true);
    };
  }, [modalOpen]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from([".catalog-head > *", ".search-main", ".search-chips > *", ".catalog-quick"], {
          y: 32,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.06,
          ease: "expo.out",
          // Leave no transform behind: a transformed chip would paint over the open dropdown of the chip before it.
          clearProps: "transform",
          scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
        });
      });
    },
    { scope: root },
  );

  // New tiles (a fresh result set, or the next page from "show more") rise in right away, one after another. Nothing
  // waits for the scroll: hidden-until-scrolled tiles could stay hidden when the page shifts under their triggers
  // (arriving from the Health Checker, the catalog loading late). A tile that has risen once is marked and left alone.
  useGSAP(
    () => {
      if (!clinics.data?.length) return;
      const fresh = gsap.utils.toArray<HTMLElement>(".clinic-tile:not([data-shown])");
      fresh.forEach((tile) => tile.setAttribute("data-shown", ""));
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(fresh, { y: 32, autoAlpha: 0, duration: 0.9, stagger: 0.06, ease: "expo.out", clearProps: "transform,opacity,visibility" });
      });
    },
    { scope: root, dependencies: [clinics.dataUpdatedAt, shown] },
  );

  const advancedCount = countAdvanced(search);
  const specialtyOptions = [
    { value: "", label: t({ ru: "Все направления", uz: "Barcha yoʻnalishlar", en: "All specialties" }) },
    ...(specialties.data || []).map((s) => ({ value: s.slug, label: pickName(lang, s.nameRu, s.nameEn) })),
  ];
  const specialtyName = (slug: string) => {
    const found = (specialties.data || []).find((s) => s.slug === slug);
    return found ? pickName(lang, found.nameRu, found.nameEn) : slug;
  };
  const langOptions = LANG_OPTIONS.map((o) => (o.value ? o : { ...o, label: t({ ru: "Любой язык", uz: "Istalgan til", en: "Any language" }) }));

  const cityOptions = [
    { value: "", label: t({ ru: "Все города", uz: "Barcha shaharlar", en: "All cities" }) },
    ...CITY_OPTIONS.map((c) => ({ value: c.value, label: cityName(lang, c.value) })),
  ];
  // A city in the URL that is not in the list (typed into an old link) still shows as its own option.
  if (search.city && !cityOptions.some((c) => c.value === search.city)) cityOptions.push({ value: search.city, label: search.city });

  // The text search applies on submit; the city, direction and sort chips apply as soon as they are picked.
  function applyQuick(e: React.FormEvent) {
    e.preventDefault();
    onPatchSearch({ q: q.trim() || undefined });
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
    <section ref={root} id="catalog" className="catalog" aria-labelledby="catalog-title">
      <div className="wrap">
        <div className="catalog-head">
          <h2 id="catalog-title" className="section-title">
            {lang === "uz" ? (
              <>
                <em>Klinikani</em> tanlang
              </>
            ) : lang === "en" ? (
              <>
                Choose a <em>clinic</em>
              </>
            ) : (
              <>
                Выберите <em>клинику</em>
              </>
            )}
          </h2>
          {!clinics.isLoading && clinics.data ? (
            <p className="catalog-count">
              {clinics.data.length} {countWord(lang, clinics.data.length, { ru: ["клиника", "клиники", "клиник"], uz: "ta klinika", en: ["clinic", "clinics"] })}
            </p>
          ) : null}
        </div>

        <form id="catalog-search" className="search" onSubmit={applyQuick}>
          <div className="search-main">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              className="search-main-input"
              type="search"
              aria-label={t({ ru: "Клиника, услуга или направление", uz: "Klinika, xizmat yoki yoʻnalish", en: "Clinic, service or specialty" })}
              placeholder={t({ ru: "Клиника, услуга или направление", uz: "Klinika, xizmat yoki yoʻnalish", en: "Clinic, service or specialty" })}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="pill-btn is-ink" type="submit">
              {t({ ru: "Найти", uz: "Topish", en: "Search" })}
              <span className="pill-btn-icon">
                <ArrowIcon />
              </span>
            </button>
          </div>

          <div className="search-chips">
            <div className="search-chip">
              <span>{t({ ru: "Город", uz: "Shahar", en: "City" })}</span>
              <SelectField title={t({ ru: "Город", uz: "Shahar", en: "City" })} value={search.city || ""} options={cityOptions} onChange={(value) => onPatchSearch({ city: value || undefined })} />
            </div>
            <div className="search-chip">
              <span>{t({ ru: "Направление", uz: "Yoʻnalish", en: "Specialty" })}</span>
              <SelectField title={t({ ru: "Направление", uz: "Yoʻnalish", en: "Specialty" })} value={search.specialty || ""} options={specialtyOptions} onChange={(value) => onPatchSearch({ specialty: value || undefined })} />
            </div>
            <div className="search-chip">
              <span>{t({ ru: "Сортировка", uz: "Saralash", en: "Sort" })}</span>
              <SelectField title={t({ ru: "Сортировка", uz: "Saralash", en: "Sort" })} value={search.sort || "name"} options={inLang(lang, SORT_OPTIONS)} onChange={(value) => onPatchSearch({ sort: value === "name" ? undefined : value })} />
            </div>
            <button type="button" className="search-chip is-button" onClick={() => setModalOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h10m4 0h2M4 17h4m4 0h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="16" cy="7" r="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="10" cy="17" r="2" stroke="currentColor" strokeWidth="2" />
              </svg>
              {t({ ru: "Ещё фильтры", uz: "Boshqa filtrlar", en: "More filters" })}
              {advancedCount ? <b>{advancedCount}</b> : null}
            </button>
          </div>
        </form>

        {/* One tap on a specialty filters the list (and a second tap on it clears it). */}
        {specialties.data?.length ? (
          <div className="catalog-quick" role="group" aria-label={t({ ru: "Быстрый выбор направления", uz: "Yoʻnalishni tez tanlash", en: "Quick specialty filter" })}>
            <button type="button" aria-pressed={!search.specialty} className={!search.specialty ? "is-active" : undefined} onClick={() => onPatchSearch({ specialty: undefined })}>
              {t({ ru: "Все", uz: "Barchasi", en: "All" })}
            </button>
            {specialties.data.map((s) => (
              <button
                key={s.slug}
                type="button"
                aria-pressed={search.specialty === s.slug}
                className={search.specialty === s.slug ? "is-active" : undefined}
                onClick={() => onPatchSearch({ specialty: search.specialty === s.slug ? undefined : s.slug })}
              >
                {pickName(lang, s.nameRu, s.nameEn)}
              </button>
            ))}
          </div>
        ) : null}

        {search.specialty ? (
          <p className="catalog-note">
            {t({ ru: "Подборка по направлению", uz: "Yoʻnalish boʻyicha tanlov:", en: "Clinics for the specialty" })} «{specialtyName(search.specialty)}»
          </p>
        ) : null}

        {hasAnyFilter(search) ? (
          <div className="catalog-chips">
            {search.city ? <span className="chip">{cityName(lang, search.city) || CITY_LABELS[search.city] || search.city}</span> : null}
            {search.specialty ? <span className="chip">{specialtyName(search.specialty)}</span> : null}
            {search.lang ? <span className="chip">{search.lang.toUpperCase()}</span> : null}
            {search.service ? <span className="chip">{SERVICE_OPTIONS.find((s) => s.value === search.service)?.label[lang] || search.service}</span> : null}
            {search.priceMin || search.priceMax ? (
              <span className="chip">
                ${search.priceMin || "0"}-{search.priceMax || "∞"}
              </span>
            ) : null}
            {search.responseMax ? <span className="chip">{t({ ru: `ответ до ${search.responseMax} ч`, uz: `javob ${search.responseMax} soatgacha`, en: `reply within ${search.responseMax} h` })}</span> : null}
            {search.medicalTourism === "1" ? <span className="chip">{t({ ru: "медтуризм", uz: "tibbiy turizm", en: "medical travel" })}</span> : null}
            <button type="button" className="catalog-reset" onClick={onClearSearch}>
              {t({ ru: "Сбросить", uz: "Tozalash", en: "Clear" })}
            </button>
          </div>
        ) : null}

        <div id="clinic-results" className="catalog-results scroll-mt-28">
          {clinics.isLoading ? (
            <div className="clinic-tiles" aria-busy="true">
              {[0, 1, 2].map((item) => (
                <div key={item} className="clinic-tile is-skeleton">
                  <div className="clinic-tile-cover animate-pulse" />
                  <div className="h-6 w-3/4 animate-pulse rounded-full bg-sand" />
                  <div className="h-4 w-1/2 animate-pulse rounded-full bg-sand" />
                </div>
              ))}
            </div>
          ) : null}

          {clinics.isError ? <p className="catalog-error">{t({ ru: "Не удалось загрузить клиники. Попробуйте обновить страницу.", uz: "Klinikalarni yuklab boʻlmadi. Sahifani yangilab koʻring.", en: "Could not load the clinics. Try reloading the page." })}</p> : null}

          {!clinics.isLoading && clinics.data?.length === 0 ? (
            <div className="catalog-empty">
              <p className="catalog-empty-title">{t({ ru: "Пока не нашли совпадений", uz: "Hozircha mos klinika topilmadi", en: "No matches yet" })}</p>
              <p>{t({ ru: "Попробуйте убрать часть фильтров или выбрать другое направление.", uz: "Ayrim filtrlarni olib tashlang yoki boshqa yoʻnalishni tanlang.", en: "Try removing some filters or picking another specialty." })}</p>
              <button type="button" className="pill-btn is-outline" onClick={onClearSearch}>
                {t({ ru: "Сбросить фильтры", uz: "Filtrlarni tozalash", en: "Clear filters" })}
              </button>
            </div>
          ) : null}

          {clinics.data?.length ? (
            <div className="clinic-tiles">
              {clinics.data.slice(0, shown).map((clinic) => {
                const name = pickName(lang, clinic.nameRu, clinic.nameEn);
                const photo = clinic.photos?.[0]?.url;
                const meta = [
                  clinic.branchCount
                    ? `${clinic.branchCount} ${countWord(lang, clinic.branchCount, { ru: ["филиал", "филиала", "филиалов"], uz: "ta filial", en: ["branch", "branches"] })}`
                    : null,
                  clinic.fromPrice != null ? t({ ru: `от $${clinic.fromPrice}`, uz: `$${clinic.fromPrice} dan`, en: `from $${clinic.fromPrice}` }) : null,
                ].filter(Boolean);
                return (
                  <Link key={clinic.id} to="/clinics/$slug" params={{ slug: clinic.slug }} className="clinic-tile">
                    <div className="clinic-tile-cover">
                      {hasPhoto(photo) ? (
                        <FitImage src={photo} className="clinic-tile-photo" />
                      ) : (
                        <div className="clinic-tile-placeholder">
                          <img src="/brand/logo.svg" alt="" width={64} height={64} />
                        </div>
                      )}
                      {clinic.logoUrl && hasPhoto(photo) ? <ClinicLogo src={clinic.logoUrl} name={name} className="clinic-tile-logo" wide /> : null}
                    </div>
                    <div className="clinic-tile-body">
                      <h3>{name}</h3>
                      <p className="clinic-tile-meta">
                        <span className="clinic-tile-city">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                            <path d="M12 2.5a7.5 7.5 0 0 0-7.5 7.5c0 5.2 6 10.6 6.8 11.3.4.3.9.3 1.3 0 .8-.7 6.9-6.1 6.9-11.3A7.5 7.5 0 0 0 12 2.5Zm0 10.3a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Z" />
                          </svg>
                          {cityName(lang, clinic.city) || CITY_LABELS[clinic.city] || clinic.city}
                        </span>
                        {meta.length ? <span>{meta.join(" · ")}</span> : null}
                      </p>
                      <p className="clinic-tile-text">{pickName(lang, clinic.descriptionRu, clinic.descriptionEn)}</p>
                      {clinic.specialties?.length ? (
                        <p className="clinic-tile-tags">
                          {clinic.specialties.slice(0, 3).map((s) => (
                            <span key={s.slug}>{pickName(lang, s.nameRu, s.nameEn)}</span>
                          ))}
                        </p>
                      ) : null}
                    </div>
                    <p className="clinic-tile-foot">
                      {clinic.responseHours ? (
                        <span className="clinic-tile-reply">
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                            <path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm.9 9.1 3 2.2a.9.9 0 0 1-1 1.5l-3.4-2.5a.9.9 0 0 1-.4-.8V7.2a.9.9 0 0 1 1.8 0v4.4Z" />
                          </svg>
                          {t({ ru: `Ответ ~${clinic.responseHours} ч`, uz: `Javob ~${clinic.responseHours} soat`, en: `Reply ~${clinic.responseHours} h` })}
                        </span>
                      ) : null}
                      {clinic.languages?.length ? (
                        <span className="clinic-tile-langs">
                          {clinic.languages.slice(0, 4).map((code) => (
                            <span key={code}>{code}</span>
                          ))}
                        </span>
                      ) : null}
                      <span className="clinic-tile-arrow" aria-hidden="true">
                        <ArrowIcon size={15} />
                      </span>
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : null}

          {clinics.data && clinics.data.length > shown ? (
            <div className="catalog-more">
              <button type="button" className="pill-btn is-outline" onClick={() => setShown((n) => n + PAGE)}>
                {t({ ru: "Показать ещё", uz: "Yana koʻrsatish", en: "Show more" })}
                <span className="catalog-more-count">{Math.min(PAGE, clinics.data.length - shown)}</span>
              </button>
              <p>
                {t({
                  ru: `Показано ${shown} из ${clinics.data.length}`,
                  uz: `${clinics.data.length} tadan ${shown} tasi koʻrsatildi`,
                  en: `Showing ${shown} of ${clinics.data.length}`,
                })}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {modalOpen ? (
        <div className="filters-overlay" role="presentation" onClick={() => setModalOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="filters-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filters-head">
              <div>
                <h2 id={titleId}>{t({ ru: "Дополнительные фильтры", uz: "Qoʻshimcha filtrlar", en: "More filters" })}</h2>
                <p>{t({ ru: "Цена, услуга, язык и медтуризм", uz: "Narx, xizmat, til va tibbiy turizm", en: "Price, service, language and medical travel" })}</p>
              </div>
              <button type="button" className="filters-close" aria-label={t({ ru: "Закрыть", uz: "Yopish", en: "Close" })} onClick={() => setModalOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="filters-body">
              <div className="filters-field">
                <span>{t({ ru: "Язык обслуживания", uz: "Xizmat tili", en: "Service language" })}</span>
                <SelectField value={draft.lang || ""} options={langOptions} onChange={(value) => setDraft((d) => ({ ...d, lang: value || undefined }))} />
              </div>

              <div className="filters-field">
                <span>{t({ ru: "Услуга", uz: "Xizmat", en: "Service" })}</span>
                <SelectField value={draft.service || ""} options={inLang(lang, SERVICE_OPTIONS)} onChange={(value) => setDraft((d) => ({ ...d, service: value || undefined }))} />
              </div>

              <div className="filters-row">
                <label className="filters-field">
                  <span>{t({ ru: "Цена от, $", uz: "Narx dan, $", en: "Price from, $" })}</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="field"
                    placeholder="0"
                    value={draft.priceMin || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, priceMin: e.target.value || undefined }))}
                  />
                </label>
                <label className="filters-field">
                  <span>{t({ ru: "Цена до, $", uz: "Narx gacha, $", en: "Price up to, $" })}</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="field"
                    placeholder="500"
                    value={draft.priceMax || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, priceMax: e.target.value || undefined }))}
                  />
                </label>
              </div>

              <div className="filters-field">
                <span>{t({ ru: "Ответ координатора", uz: "Koordinator javobi", en: "Coordinator reply" })}</span>
                <SelectField value={draft.responseMax || ""} options={inLang(lang, RESPONSE_OPTIONS)} onChange={(value) => setDraft((d) => ({ ...d, responseMax: value || undefined }))} />
              </div>

              <label className="filters-switch">
                <span>{t({ ru: "Поддержка медицинского туризма", uz: "Tibbiy turizmni qoʻllab-quvvatlash", en: "Supports medical travel" })}</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={draft.medicalTourism === "1"}
                  onChange={(e) => setDraft((d) => ({ ...d, medicalTourism: e.target.checked ? "1" : undefined }))}
                />
              </label>
            </div>

            <div className="filters-actions">
              <button
                type="button"
                className="pill-btn is-outline"
                onClick={() => {
                  setDraft({});
                  onPatchSearch({ lang: undefined, service: undefined, priceMin: undefined, priceMax: undefined, responseMax: undefined, medicalTourism: undefined });
                  setModalOpen(false);
                }}
              >
                {t({ ru: "Сбросить", uz: "Tozalash", en: "Clear" })}
              </button>
              <button type="button" className="pill-btn is-ink" onClick={applyAdvanced}>
                {t({ ru: "Применить", uz: "Qoʻllash", en: "Apply" })}
                <span className="pill-btn-icon">
                  <ArrowIcon />
                </span>
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
