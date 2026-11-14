import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cabinetLogin, cabinetRegister } from "@/shared/api/cabinet";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { AuthLayout, WsIcon } from "@/widgets/workspace/Workspace";
import { Field } from "@/widgets/clinic-form/FormField";

export const Route = createFileRoute("/cabinet/login")({
  component: CabinetLoginPage,
});

function CabinetLoginPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "register") {
        await cabinetRegister({ email, password, name });
      } else {
        await cabinetLogin(email, password);
      }
      qc.clear();
      void navigate({ to: "/cabinet" });
    } catch {
      setError(mode === "register" ? "Could not register. This email may already be in use." : "Wrong email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      kicker="For clinics"
      title={
        <>
          Your clinic on the <em>medical travel map</em>
        </>
      }
      points={[
        "Clinic profile, branches, doctors and prices in one place",
        "Patient requests from the catalog and Health Checker",
        "A moderator reviews the profile before it goes live",
      ]}
    >
      <h2>{mode === "login" ? "Sign in" : "Register a clinic"}</h2>
      <p>{mode === "login" ? "Sign in to manage your clinic profile and requests." : "Create an owner account, then add your clinic step by step."}</p>

      <div className="ws-seg is-block mt-7" role="tablist" aria-label="Sign in or register">
        <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "is-active" : undefined} onClick={() => { setMode("login"); setError(null); }}>
          Sign in
        </button>
        <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "is-active" : undefined} onClick={() => { setMode("register"); setError(null); }}>
          Register
        </button>
      </div>

      <form onSubmit={onSubmit} className="auth-form">
        {mode === "register" ? (
          <Field label="Your name">
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" placeholder="e.g. Dilnoza Yusupova" />
          </Field>
        ) : null}
        <Field label="Email">
          <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" placeholder="clinic@example.uz" />
        </Field>
        <Field label="Password" hint={mode === "register" ? "At least 8 characters" : undefined}>
          <input
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 8 : 1}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
        </Field>
        {error ? (
          <p className="auth-error" role="alert">
            <WsIcon name="alert" />
            {error}
          </p>
        ) : null}
        <button className="pill-btn is-ink is-large" type="submit" disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          <span className="pill-btn-icon">
            <ArrowIcon />
          </span>
        </button>
      </form>
    </AuthLayout>
  );
}
