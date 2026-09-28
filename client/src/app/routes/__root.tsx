import { Link, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { Header } from "@/widgets/header/Header";
import { Footer } from "@/widgets/footer/Footer";
import { HealthCheckerProvider } from "@/widgets/health-checker/HealthCheckerContext";
import { HealthCheckerWidget } from "@/widgets/health-checker/HealthCheckerWidget";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-primary">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">Страница не найдена</h1>
      <p className="mt-3 text-muted">Проверьте адрес или вернитесь в каталог клиник.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-ghost">
          На главную
        </Link>
        <Link to="/" className="btn btn-primary">
          Каталог
        </Link>
      </div>
    </div>
  );
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isWorkspace = pathname.startsWith("/cabinet") || pathname.startsWith("/moderation");

  return (
    <HealthCheckerProvider>
      <div className="portal flex min-h-screen flex-col">
        {!isWorkspace ? <Header /> : null}
        <main className={`mx-auto w-full max-w-7xl flex-1 px-4 py-8 ${isWorkspace ? "" : "pb-28"}`}>
          {isWorkspace ? (
            <div className="mb-6 flex items-center justify-between gap-3">
              <Link to="/" className="font-extrabold text-ink">
                UzMedAtlas
              </Link>
              <div className="flex items-center gap-3 text-sm font-bold text-muted">
                {pathname.startsWith("/moderation") ? (
                  <>
                    <Link to="/moderation" className="hover:text-primary">
                      Очередь
                    </Link>
                    <Link to="/moderation/leads" className="hover:text-primary">
                      Заявки
                    </Link>
                    <span>Модерация</span>
                  </>
                ) : (
                  <>
                    <Link to="/cabinet" className="hover:text-primary">
                      Мои клиники
                    </Link>
                    <span>ЛК клиники</span>
                  </>
                )}
              </div>
            </div>
          ) : null}
          <Outlet />
        </main>
        {!isWorkspace ? <Footer /> : null}
        {!isWorkspace ? <HealthCheckerWidget /> : null}
      </div>
    </HealthCheckerProvider>
  );
}
