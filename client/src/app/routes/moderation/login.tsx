import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { adminLogin } from "@/shared/api/cabinet";

export const Route = createFileRoute("/moderation/login")({
  component: ModerationLoginPage,
});

function ModerationLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminLogin(password);
      void navigate({ to: "/moderation" });
    } catch {
      setError("Неверный пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center">
      <h1 className="text-3xl font-extrabold">Модерация</h1>
      <p className="mt-2 text-muted">Вход для проверки клиник</p>
      <form onSubmit={onSubmit} className="soft-card mt-6 space-y-4 rounded-[1.75rem] bg-white p-6">
        <label className="block text-sm font-bold">
          Пароль модератора
          <input
            type="password"
            className="field mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
