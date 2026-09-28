import { createFileRoute, redirect } from "@tanstack/react-router";
import { catalogSearchSchema } from "@/shared/lib/catalog-search";

export const Route = createFileRoute("/clinics/")({
  validateSearch: catalogSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/", search });
  },
});
