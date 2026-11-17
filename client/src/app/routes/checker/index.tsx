import { SITE_NAME, useSeo } from "@/shared/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useHealthChecker } from "@/widgets/health-checker/HealthCheckerContext";

export const Route = createFileRoute("/checker/")({
  component: CheckerPage,
});

function CheckerPage() {
  useSeo({
    title: `Health Checker — Which Doctor Do I Need? | ${SITE_NAME}`,
    description: "Describe your symptoms and get a suggestion of which specialist to see, with matching vetted clinics in Uzbekistan. Not a diagnosis: a first step to the right doctor.",
  });
  const { open } = useHealthChecker();
  const navigate = Route.useNavigate();

  useEffect(() => {
    open();
    void navigate({ to: "/" });
  }, [navigate, open]);

  return (
    <p className="text-muted">Opening Health Checker…</p>
  );
}
