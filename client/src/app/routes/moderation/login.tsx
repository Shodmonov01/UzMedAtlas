import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminLogin } from "@/shared/api/cabinet";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { AuthLayout, WsIcon } from "@/widgets/workspace/Workspace";
import { Field } from "@/widgets/clinic-form/FormField";

export const Route = createFileRoute("/moderation/login")({
  component: ModerationLoginPage,
});

function ModerationLoginPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"administrator" | "staff">("administrator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminLogin(password, mode === "staff" ? email : undefined);
      qc.clear();
      void navigate({ to: "/moderation" });
    } catch {
      setError("Could not sign in. Check your details or contact the administrator.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      kicker="Moderation"
      title={
        <>
          Clinic review <em>before publishing</em>
        </>
      }
      points={[
        "A queue of clinics with a checklist of required fields",
        "Approve, send back for changes, publish to the catalog",
        "Patient requests and Telegram notifications",
      ]}
    >
      <h2>Moderator sign-in</h2>
      <p>The administrator signs in with a password, moderators with email and password.</p>

      <div className="ws-seg is-block mt-7" role="tablist" aria-label="Role">
        <button type="button" role="tab" aria-selected={mode === "administrator"} className={mode === "administrator" ? "is-active" : undefined} onClick={() => setMode("administrator")}>
          Administrator
        </button>
        <button type="button" role="tab" aria-selected={mode === "staff"} className={mode === "staff" ? "is-active" : undefined} onClick={() => setMode("staff")}>
          Moderator
        </button>
      </div>

      <form onSubmit={onSubmit} className="auth-form">
        {mode === "staff" ? (
          <Field label="Email">
            <input type="email" autoComplete="username" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.uz" />
          </Field>
        ) : null}
        <Field label="Password">
          <input
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            autoFocus
          />
        </Field>
        {error ? (
          <p className="auth-error" role="alert">
            <WsIcon name="alert" />
            {error}
          </p>
        ) : null}
        <button className="pill-btn is-ink is-large" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
          <span className="pill-btn-icon">
            <ArrowIcon />
          </span>
        </button>
      </form>
    </AuthLayout>
  );
}
