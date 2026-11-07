import { Link, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { Header } from "@/widgets/header/Header";
import { Footer } from "@/widgets/footer/Footer";
import { HealthCheckerProvider } from "@/widgets/health-checker/HealthCheckerContext";
import { HealthCheckerWidget } from "@/widgets/health-checker/HealthCheckerWidget";
import { LanguageProvider, useLang } from "@/shared/i18n/lang";
import { WorkspaceShell } from "@/widgets/workspace/Workspace";

// The AI helper bubble is switched off for now; set to true to bring it back.
const SHOW_HEALTH_CHECKER = true;

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

function NotFoundPage() {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-primary">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">{t({ ru: "Страница не найдена", uz: "Sahifa topilmadi", en: "Page not found" })}</h1>
      <p className="mt-3 text-muted">{t({ ru: "Проверьте адрес или вернитесь в каталог клиник.", uz: "Manzilni tekshiring yoki klinikalar katalogiga qayting.", en: "Check the address or go back to the clinic catalog." })}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-ghost">
          {t({ ru: "На главную", uz: "Bosh sahifa", en: "Home" })}
        </Link>
        <Link to="/" className="btn btn-primary">
          {t({ ru: "Каталог", uz: "Katalog", en: "Catalog" })}
        </Link>
      </div>
    </div>
  );
}

function RootLayout() {
  return (
    <LanguageProvider>
      <RootShell />
    </LanguageProvider>
  );
}

/** The page frame. A language change redraws the page and the checker from scratch (keyed by the language), so every
 *  text and every GSAP split and trigger is built again in the new language. */
function RootShell() {
  const { lang } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isWorkspace = pathname.startsWith("/cabinet") || pathname.startsWith("/moderation");
  const isSignIn = pathname === "/cabinet/login" || pathname === "/moderation/login";
  const isHome = pathname === "/";
  // Clinic and branch pages lay out their own width (full-width bars, the site's gutters).
  const isClinicPage = /^\/clinics\/[^/]+/.test(pathname);

  // The cabinet and the moderation desk have their own frame (a sidebar instead of the site header and footer);
  // their sign-in pages fill the screen on their own.
  if (isWorkspace) {
    return (
      <HealthCheckerProvider>
        {isSignIn ? (
          <Outlet key={lang} />
        ) : (
          <WorkspaceShell kind={pathname.startsWith("/moderation") ? "moderation" : "cabinet"}>
            <Outlet key={lang} />
          </WorkspaceShell>
        )}
      </HealthCheckerProvider>
    );
  }

  return (
    <HealthCheckerProvider>
      <div className={`portal flex min-h-screen flex-col ${isHome ? "reference-portal" : ""}`}>
        <Header />
        <main className={isHome || isClinicPage ? "w-full flex-1" : "mx-auto w-full max-w-[calc(var(--page-width)+2rem)] flex-1 px-4 py-8 pb-28"}>
          <Outlet key={lang} />
        </main>
        <Footer />
        {SHOW_HEALTH_CHECKER ? <HealthCheckerWidget key={lang} showTip={!isHome} hideOverHero={isHome} /> : null}
      </div>
    </HealthCheckerProvider>
  );
}
