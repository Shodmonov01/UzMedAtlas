import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-lg text-white">
            U
          </span>
          UzMedAtlas
        </Link>
        <Link to="/cabinet/login" className="btn btn-ghost text-sm">
          Войти
        </Link>
      </div>
    </header>
  );
}
