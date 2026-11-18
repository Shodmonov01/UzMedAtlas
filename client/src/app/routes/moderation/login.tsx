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
      setError("Не удалось войти. Проверьте данные или обратитесь к администратору.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout ru title="Вход в модерацию" subtitle="Администратор входит по паролю, модератор — по email и паролю.">
      <div className="ws-seg is-block mt-6" role="tablist" aria-label="Роль">
        <button type="button" role="tab" aria-selected={mode === "administrator"} className={mode === "administrator" ? "is-active" : undefined} onClick={() => setMode("administrator")}>
          Администратор
        </button>
        <button type="button" role="tab" aria-selected={mode === "staff"} className={mode === "staff" ? "is-active" : undefined} onClick={() => setMode("staff")}>
          Модератор
        </button>
      </div>

      <form onSubmit={onSubmit} className="auth-form">
        {mode === "staff" ? (
          <Field label="Email">
            <input type="email" autoComplete="username" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.uz" />
          </Field>
        ) : null}
        <Field label="Пароль">
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
          {loading ? "Вход…" : "Войти"}
          <span className="pill-btn-icon">
            <ArrowIcon />
          </span>
        </button>
      </form>
    </AuthLayout>
  );
}
