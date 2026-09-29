import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-8 bg-primary-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-lg">✚</span>
            UzMedAtlas
          </Link>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
            Помогаем сориентироваться в клиниках Узбекистана и найти подходящее направление лечения.
          </p>
          <p className="mt-2 text-xs text-white/45">Health Checker помогает с выбором направления и не ставит диагноз.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold">
          <a href="/#catalog" className="text-white/75 transition hover:text-white">
            Клиники
          </a>
          <Link to="/checker" className="text-white/75 transition hover:text-white">
            Подобрать направление
          </Link>
          <Link to="/cabinet/login" className="text-white/75 transition hover:text-white">
            Для клиник
          </Link>
          <Link to="/moderation/login" className="text-white/75 transition hover:text-white">
            Кабинет модератора
          </Link>
        </div>
      </div>
    </footer>
  );
}
