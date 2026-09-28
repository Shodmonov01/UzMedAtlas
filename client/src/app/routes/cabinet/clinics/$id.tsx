import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cabinet/clinics/$id")({
  component: CabinetClinicLayout,
});

function CabinetClinicLayout() {
  return <Outlet />;
}
