import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { catalogSearchSchema } from "@/shared/lib/catalog-search";
import { ClinicCatalog, type CatalogSearch } from "@/widgets/clinic-catalog/ClinicCatalog";

export const Route = createFileRoute("/")({
  validateSearch: catalogSearchSchema,
  component: HomePage,
});

function HomePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  useEffect(() => {
    if (search.specialty || search.q || search.city || search.service) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("clinic-results")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }, [search.specialty, search.q, search.city, search.service]);

  function patchSearch(patch: Partial<CatalogSearch>) {
    void navigate({
      search: (prev) => {
        const next = { ...prev, ...patch };
        for (const key of Object.keys(next) as (keyof typeof next)[]) {
          if (!next[key]) delete next[key];
        }
        return next;
      },
      // Filters change the URL only; the page stays where the reader is.
      resetScroll: false,
    });
  }

  return (
    <ClinicCatalog
      search={search}
      onPatchSearch={patchSearch}
      onClearSearch={() => void navigate({ search: {}, resetScroll: false })}
    />
  );
}
