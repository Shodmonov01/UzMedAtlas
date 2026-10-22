import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="site-footer mt-8 bg-white text-ink">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <img src="/brand/logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            Ассоциация медицинских организаций
          </Link>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Помогаем сориентироваться в клиниках Узбекистана и найти подходящее направление лечения.
          </p>
          <p className="mt-2 text-xs text-muted">Health Checker помогает с выбором направления и не ставит диагноз.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold">
          <a href="/#catalog" className="text-muted transition hover:text-primary">Клиники</a>
          <Link to="/checker" className="text-muted transition hover:text-primary">Подобрать направление</Link>
          <Link to="/cabinet/login" className="text-muted transition hover:text-primary">Для клиник</Link>
          <Link to="/moderation/login" className="text-muted transition hover:text-primary">Кабинет модератора</Link>
        </div>
      </div>
    </footer>
  );
}
