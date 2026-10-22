import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function Header() {
  // On the home page the header sits over the hero photo; it gets a solid background once scrolled.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""} sticky top-0 z-30 border-b border-line/70 bg-white/95 backdrop-blur-xl`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
        <Link to="/" className="group flex items-center gap-3 font-extrabold text-ink">
          <img src="/brand/logo.png" alt="" width={44} height={44} className="site-logo-mark h-11 w-11 object-contain" />
          <span className="flex flex-col text-[13px] leading-[1.15] tracking-tight sm:text-[15px]">
            <span>Ассоциация</span>
            <span className="text-primary">медицинских организаций</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex" aria-label="Главная навигация">
          <a href="/#catalog" className="transition hover:text-primary">Клиники</a>
          <Link to="/checker" className="transition hover:text-primary">Подобрать направление</Link>
        </nav>
        <Link to="/cabinet/login" className="site-header-action btn btn-primary px-5 py-2.5 text-sm">
          Для клиник
        </Link>
      </div>
    </header>
  );
}
