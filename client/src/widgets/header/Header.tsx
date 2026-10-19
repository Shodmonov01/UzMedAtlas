import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="site-header sticky top-0 z-30 border-b border-line/70 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
        <Link to="/" className="group flex items-center gap-3 font-extrabold text-ink">
          <span className="site-logo-mark grid h-10 w-10 place-items-center rounded-xl bg-primary text-white">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
              <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3Z" fill="currentColor" />
            </svg>
          </span>
          <span className="text-lg tracking-tight">UzMed<span className="text-primary">Atlas</span></span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex" aria-label="Главная навигация">
          <a href="/#catalog" className="transition hover:text-primary">Клиники</a>
          <Link to="/checker" className="transition hover:text-primary">Подобрать направление</Link>
        </nav>
        <Link to="/cabinet/login" className="site-header-action btn btn-primary px-5 py-2.5 text-sm">
          Для клиник <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
