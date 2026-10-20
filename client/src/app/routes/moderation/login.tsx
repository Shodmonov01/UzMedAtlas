import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminLogin } from "@/shared/api/cabinet";

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
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center">
      <h1 className="text-3xl font-extrabold">Модерация</h1>
      <p className="mt-2 text-muted">Вход для проверки клиник</p>
      <form onSubmit={onSubmit} className="soft-card mt-6 space-y-4 rounded-[1.75rem] bg-white p-6">
        <div className="flex gap-2">
          <button type="button" className={`btn ${mode === "administrator" ? "btn-primary" : "btn-ghost"} text-sm`} onClick={() => setMode("administrator")}>Администратор</button>
          <button type="button" className={`btn ${mode === "staff" ? "btn-primary" : "btn-ghost"} text-sm`} onClick={() => setMode("staff")}>Модератор</button>
        </div>
        {mode === "staff" ? <label className="block text-sm font-bold">Email<input type="email" autoComplete="username" className="field mt-1" value={email} onChange={e => setEmail(e.target.value)} required /></label> : null}
        <label className="block text-sm font-bold">
          Пароль
          <input
            type="password"
            className="field mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            autoFocus
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Вход…" : "Войти"}
        </button>
      </form>
      <Link to="/" className="mt-4 text-sm font-bold text-primary">
        На главную
      </Link>
    </div>
  );
}
