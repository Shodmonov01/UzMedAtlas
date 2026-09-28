import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useHealthChecker } from "@/widgets/health-checker/HealthCheckerContext";

export const Route = createFileRoute("/checker/")({
  component: CheckerPage,
});

function CheckerPage() {
  const { open } = useHealthChecker();
  const navigate = Route.useNavigate();

  useEffect(() => {
    open();
    void navigate({ to: "/" });
  }, [navigate, open]);

  return (
    <p className="text-muted">Открываем Health Checker…</p>
  );
}
