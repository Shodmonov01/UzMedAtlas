import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/clinics/$slug")({
  component: ClinicSlugLayout,
});

function ClinicSlugLayout() {
  return <Outlet />;
}
