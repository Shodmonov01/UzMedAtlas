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
      setError(mode === "register" ? "Не удалось зарегистрироваться. Возможно, этот email уже занят." : "Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      kicker="Для клиник"
      title={
        <>
          Кабинет клиники на <em>карте медтуризма</em>
        </>
      }
      points={[
        "Профиль клиники, филиалы, врачи и цены — в одном месте",
        "Заявки пациентов из каталога и Health Checker",
        "Проверка модератором перед публикацией в каталоге",
      ]}
    >
      <h2>{mode === "login" ? "Вход в кабинет" : "Регистрация клиники"}</h2>
      <p>{mode === "login" ? "Войдите, чтобы управлять профилем клиники и заявками." : "Создайте аккаунт владельца — затем добавите клинику по шагам."}</p>

      <div className="ws-seg is-block mt-7" role="tablist" aria-label="Вход или регистрация">
        <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "is-active" : undefined} onClick={() => { setMode("login"); setError(null); }}>
          Вход
        </button>
        <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "is-active" : undefined} onClick={() => { setMode("register"); setError(null); }}>
          Регистрация
        </button>
      </div>

      <form onSubmit={onSubmit} className="auth-form">
        {mode === "register" ? (
          <Field label="Ваше имя">
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" placeholder="Например, Дилноза Юсупова" />
          </Field>
        ) : null}
        <Field label="Email">
          <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" placeholder="clinic@example.uz" />
        </Field>
        <Field label="Пароль" hint={mode === "register" ? "Не меньше 8 символов" : undefined}>
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
          {loading ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
          <span className="pill-btn-icon">
            <ArrowIcon />
          </span>
        </button>
      </form>
    </AuthLayout>
  );
}
