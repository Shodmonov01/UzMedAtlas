import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { CITY_LABELS, fetchClinics, fetchSpecialties } from "@/shared/api/client";
import { SelectField } from "@/shared/ui/SelectField";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { FitImage } from "@/shared/ui/FitImage";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { CITY_OPTIONS, displayCity } from "@/shared/lib/cities";
import { pickName } from "@/shared/i18n/lang";

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

const SERVICE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Any service" },
  { value: "mri", label: "MRI" },
  { value: "ct", label: "CT" },
  { value: "ultrasound", label: "Ultrasound" },
  { value: "checkup", label: "Check-up" },
  { value: "consultation", label: "Consultation" },
  { value: "surgery", label: "Surgery" },
  { value: "endoscopy", label: "Endoscopy" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "name", label: "A to Z" },
  { value: "response", label: "Fastest reply" },
  { value: "price", label: "Price" },
  { value: "city", label: "City" },
];

const RESPONSE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Any time" },
  { value: "6", label: "Within 6 hours" },
  { value: "12", label: "Within 12 hours" },
  { value: "24", label: "Within 24 hours" },
  { value: "48", label: "Within 48 hours" },
];

const LANG_OPTIONS = [
  { value: "", label: "Any language" },
  { value: "ru", label: "Russian" },
  { value: "en", label: "English" },
  { value: "uz", label: "Uzbek" },
  { value: "tr", label: "Turkish" },
  { value: "ar", label: "Arabic" },
  { value: "kz", label: "Kazakh" },
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

  // Back to the first page only when the search itself changes. Not on every refetch (react-query refetches when the
  // window regains focus), or the list would collapse back to one page under the reader.
  const searchKey = JSON.stringify(search);
  useEffect(() => {
    setShown(PAGE);
  }, [searchKey]);

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

  // No entrance animation here: the catalog and its tiles are simply there (animations tied to the scroll could leave
  // tiles hidden when the page shifted, so they were removed).

  const advancedCount = countAdvanced(search);
  const specialtyOptions = [
    { value: "", label: "All specialties" },
    ...(specialties.data || []).map((s) => ({ value: s.slug, label: pickName(s.nameRu, s.nameEn) })),
  ];
  const specialtyName = (slug: string) => {
    const found = (specialties.data || []).find((s) => s.slug === slug);
    return found ? pickName(found.nameRu, found.nameEn) : slug;
  };

  const cityOptions = [
    { value: "", label: "All cities" },
    ...CITY_OPTIONS.map((c) => ({ value: c.value, label: displayCity(c.value) })),
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
            <>
                Choose a <em>clinic</em>
              </>
          </h2>
          {/* The count and the sort order sit beside the heading, out of the search bar. */}
          <div className="catalog-head-side">
            {!clinics.isLoading && clinics.data ? (
              <p className="catalog-count">
                {clinics.data.length} {(clinics.data.length === 1 ? "clinic" : "clinics")}
              </p>
            ) : null}
            <div className="catalog-sort">
              <span>Sort</span>
              <SelectField title="Sort" value={search.sort || "name"} options={SORT_OPTIONS} onChange={(value) => onPatchSearch({ sort: value === "name" ? undefined : value })} />
            </div>
          </div>
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
              aria-label="Clinic, service or specialty"
              placeholder="Clinic, service or specialty"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="pill-btn is-ink" type="submit">
              Search
              <span className="pill-btn-icon">
                <ArrowIcon />
              </span>
            </button>
          </div>

          <div className="search-chips">
            <div className="search-chip">
              <span>City</span>
              <SelectField title="City" value={search.city || ""} options={cityOptions} onChange={(value) => onPatchSearch({ city: value || undefined })} />
            </div>
            <div className="search-chip">
              <span>Specialty</span>
              <SelectField title="Specialty" value={search.specialty || ""} options={specialtyOptions} onChange={(value) => onPatchSearch({ specialty: value || undefined })} />
            </div>
            <button type="button" className="search-chip is-button" onClick={() => setModalOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h10m4 0h2M4 17h4m4 0h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="16" cy="7" r="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="10" cy="17" r="2" stroke="currentColor" strokeWidth="2" />
              </svg>
              Filters
              {advancedCount ? <b>{advancedCount}</b> : null}
            </button>
          </div>
        </form>

        {/* One tap on a specialty filters the list (and a second tap on it clears it). */}
        {specialties.data?.length ? (
          <div className="catalog-quick" role="group" aria-label="Quick specialty filter">
            <button type="button" aria-pressed={!search.specialty} className={!search.specialty ? "is-active" : undefined} onClick={() => onPatchSearch({ specialty: undefined })}>
              All
            </button>
            {specialties.data.map((s) => (
              <button
                key={s.slug}
                type="button"
                aria-pressed={search.specialty === s.slug}
                className={search.specialty === s.slug ? "is-active" : undefined}
                onClick={() => onPatchSearch({ specialty: search.specialty === s.slug ? undefined : s.slug })}
              >
                {pickName(s.nameRu, s.nameEn)}
              </button>
            ))}
          </div>
        ) : null}

        {search.specialty ? (
          <p className="catalog-note">
            Clinics for the specialty «{specialtyName(search.specialty)}»
          </p>
        ) : null}

        {hasAnyFilter(search) ? (
          <div className="catalog-chips">
            {search.city ? <span className="chip">{displayCity(search.city) || CITY_LABELS[search.city] || search.city}</span> : null}
            {search.specialty ? <span className="chip">{specialtyName(search.specialty)}</span> : null}
            {search.lang ? <span className="chip">{search.lang.toUpperCase()}</span> : null}
            {search.service ? <span className="chip">{SERVICE_OPTIONS.find((s) => s.value === search.service)?.label || search.service}</span> : null}
            {search.priceMin || search.priceMax ? (
              <span className="chip">
                ${search.priceMin || "0"}-{search.priceMax || "∞"}
              </span>
            ) : null}
            {search.responseMax ? <span className="chip">{`reply within ${search.responseMax} h`}</span> : null}
            {search.medicalTourism === "1" ? <span className="chip">medical travel</span> : null}
            <button type="button" className="catalog-reset" onClick={onClearSearch}>
              Clear
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

          {clinics.isError ? <p className="catalog-error">Could not load the clinics. Try reloading the page.</p> : null}

          {!clinics.isLoading && clinics.data?.length === 0 ? (
            <div className="catalog-empty">
              <p className="catalog-empty-title">No matches yet</p>
              <p>Try removing some filters or picking another specialty.</p>
              <button type="button" className="pill-btn is-outline" onClick={onClearSearch}>
                Clear filters
              </button>
            </div>
          ) : null}

          {clinics.data?.length ? (
            <div className="clinic-tiles">
              {clinics.data.slice(0, shown).map((clinic) => {
                const name = pickName(clinic.nameRu, clinic.nameEn);
                const photo = clinic.photos?.[0]?.url;
                const meta = [
                  clinic.branchCount
                    ? `${clinic.branchCount} ${(clinic.branchCount === 1 ? "branch" : "branches")}`
                    : null,
                  clinic.fromPrice != null ? `from $${clinic.fromPrice}` : null,
                ].filter(Boolean);
                return (
                  <Link key={clinic.id} to="/clinics/$slug" params={{ slug: clinic.slug }} className="clinic-tile">
                    <div className="clinic-tile-cover">
                      {hasPhoto(photo) ? (
                        <FitImage src={photo} className="clinic-tile-photo" />
                      ) : (
                        <div className="clinic-tile-placeholder">
                          <img src="/brand/logo.svg?v=2" alt="" width={64} height={64} />
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
                          {displayCity(clinic.city) || CITY_LABELS[clinic.city] || clinic.city}
                        </span>
                        {meta.length ? <span>{meta.join(" · ")}</span> : null}
                      </p>
                      <p className="clinic-tile-text">{pickName(clinic.descriptionRu, clinic.descriptionEn)}</p>
                      {clinic.specialties?.length ? (
                        <p className="clinic-tile-tags">
                          {clinic.specialties.slice(0, 3).map((s) => (
                            <span key={s.slug}>{pickName(s.nameRu, s.nameEn)}</span>
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
                          {`Reply ~${clinic.responseHours} h`}
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
                Show more
                <span className="catalog-more-count">{Math.min(PAGE, clinics.data.length - shown)}</span>
              </button>
              <p>
                {`Showing ${shown} of ${clinics.data.length}`}
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
                <h2 id={titleId}>More filters</h2>
                <p>Price, service, language and medical travel</p>
              </div>
              <button type="button" className="filters-close" aria-label="Close" onClick={() => setModalOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="filters-body">
              <div className="filters-field">
                <span>Service language</span>
                <SelectField value={draft.lang || ""} options={LANG_OPTIONS} onChange={(value) => setDraft((d) => ({ ...d, lang: value || undefined }))} />
              </div>

              <div className="filters-field">
                <span>Service</span>
                <SelectField value={draft.service || ""} options={SERVICE_OPTIONS} onChange={(value) => setDraft((d) => ({ ...d, service: value || undefined }))} />
              </div>

              <div className="filters-row">
                <label className="filters-field">
                  <span>Price from, $</span>
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
                  <span>Price up to, $</span>
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
                <span>Coordinator reply</span>
                <SelectField value={draft.responseMax || ""} options={RESPONSE_OPTIONS} onChange={(value) => setDraft((d) => ({ ...d, responseMax: value || undefined }))} />
              </div>

              <label className="filters-switch">
                <span>Supports medical travel</span>
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
                Clear
              </button>
              <button type="button" className="pill-btn is-ink" onClick={applyAdvanced}>
                Apply
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
