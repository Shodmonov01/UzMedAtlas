import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { catalogSearchSchema } from "@/shared/lib/catalog-search";
import { glideTo } from "@/shared/lib/gsap";
import { ClinicCatalog, type CatalogSearch } from "@/widgets/clinic-catalog/ClinicCatalog";
import { HomeHero } from "@/widgets/home/HomeHero";
import { Manifesto } from "@/widgets/home/Manifesto";
import { Gallery } from "@/widgets/home/Gallery";
import { Directions } from "@/widgets/home/Directions";
import { Team } from "@/widgets/team/Team";
import { Contacts } from "@/widgets/home/Contacts";

export const Route = createFileRoute("/")({
  validateSearch: catalogSearchSchema,
  component: HomePage,
});

/** The home page tells the medical-tourism story top to bottom: the film, why Uzbekistan, the country in photos, the directions, the clinic catalog, the team and the contacts. */
function HomePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  // A new search glides to the results, clear of the fixed header (96px above their top).
  useEffect(() => {
    if (search.specialty || search.q || search.city || search.service) glideTo("clinic-results", 96);
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
    <div className="home">
      <HomeHero />
      <Manifesto />
      <Gallery />
      <Directions onPick={(specialty) => patchSearch({ specialty })} />
      <ClinicCatalog search={search} onPatchSearch={patchSearch} onClearSearch={() => void navigate({ search: {}, resetScroll: false })} />
      <Team />
      <Contacts />
    </div>
  );
}
