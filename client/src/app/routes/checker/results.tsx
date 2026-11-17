import { SITE_NAME, useSeo } from "@/shared/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useHealthChecker } from "@/widgets/health-checker/HealthCheckerContext";

export const Route = createFileRoute("/checker/results")({
  component: CheckerResultsPage,
});

function CheckerResultsPage() {
  useSeo({ title: `Health Checker results | ${SITE_NAME}`, noindex: true });
  const { open } = useHealthChecker();
  const navigate = Route.useNavigate();

  useEffect(() => {
    open();
    void navigate({ to: "/" });
  }, [navigate, open]);

  return <p className="text-muted">Opening Health Checker…</p>;
}
