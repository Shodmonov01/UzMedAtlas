import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted">
          UzMedAtlas — каталог частных клиник. Health Checker не ставит диагноз.
        </p>
        <div className="flex flex-wrap gap-4 text-sm font-bold">
          <a href="/#catalog" className="text-muted hover:text-primary">
            Клиники
          </a>
          <Link to="/cabinet" className="text-muted hover:text-primary">
            ЛК клиники
          </Link>
          <Link to="/moderation" className="text-muted hover:text-primary">
            Модерация
          </Link>
        </div>
      </div>
    </footer>
  );
}
