import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { cabinetLogin, cabinetRegister } from "@/shared/api/cabinet";

export const Route = createFileRoute("/cabinet/login")({
  component: CabinetLoginPage,
});

function CabinetLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("owner@uzmedatlas.local");
  const [password, setPassword] = useState("clinic123");
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
      void navigate({ to: "/cabinet" });
    } catch {
      setError(mode === "register" ? "Не удалось зарегистрироваться" : "Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center">
      <h1 className="text-3xl font-extrabold">ЛК клиники</h1>
      <p className="mt-2 text-muted">
        {mode === "login" ? "Вход владельца клиники" : "Регистрация владельца"}
      </p>
      <form onSubmit={onSubmit} className="soft-card mt-6 space-y-4 rounded-[1.75rem] bg-white p-6">
        {mode === "register" ? (
          <label className="block text-sm font-bold">
            Имя
            <input
              className="field mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </label>
        ) : null}
        <label className="block text-sm font-bold">
          Email
          <input
            type="email"
            className="field mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="block text-sm font-bold">
          Пароль
          <input
            type="password"
            className="field mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 8 : 1}
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "…" : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
        <button
          type="button"
          className="w-full text-sm font-bold text-primary"
          onClick={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
            setError(null);
          }}
        >
          {mode === "login" ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
        </button>
      </form>
      <p className="mt-3 text-xs text-muted">
        Демо: owner@uzmedatlas.local / clinic123
      </p>
      <Link to="/" className="mt-4 text-sm font-bold text-primary">
        На главную
      </Link>
    </div>
  );
}
