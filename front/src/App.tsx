import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SkipLink } from "./components/SkipLink";
import { HomePage } from "./pages/HomePage";
import { CheckerPage } from "./pages/CheckerPage";
import { ResultsPage } from "./pages/ResultsPage";
import { ClinicsPage } from "./pages/ClinicsPage";
import { ClinicPage } from "./pages/ClinicPage";
import { ApplyPage } from "./pages/ApplyPage";
import { SuccessPage } from "./pages/SuccessPage";
import { FaqPage } from "./pages/FaqPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminLoginPage } from "./admin/AdminLoginPage";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminHomePage } from "./admin/AdminHomePage";
import { AdminClinicsPage } from "./admin/AdminClinicsPage";
import { AdminClinicFormPage } from "./admin/AdminClinicFormPage";
import { AdminSpecialtiesPage } from "./admin/AdminSpecialtiesPage";
import { AdminServicesPage } from "./admin/AdminServicesPage";
import { AdminLeadsPage } from "./admin/AdminLeadsPage";
import { AdminLeadDetailPage } from "./admin/AdminLeadDetailPage";
import { AdminOutboxPage } from "./admin/AdminOutboxPage";
import { locales } from "./i18n";

function RedirectLocale() {
  const stored = localStorage.getItem("uma_locale");
  const locale = stored === "ru" ? "ru" : "en";
  return <Navigate to={`/${locale}`} replace />;
}

function LocaleSync() {
  const { locale } = useParams();
  const { i18n } = useTranslation();
  useEffect(() => {
    const next = locale === "ru" ? "ru" : "en";
    if (i18n.language !== next) i18n.changeLanguage(next);
    localStorage.setItem("uma_locale", next);
    document.documentElement.lang = next;
  }, [locale, i18n]);
  useEffect(() => {
    const search = window.location.search;
    fetch(`/api/health${search.includes("utm_") ? search : ""}`, { credentials: "include" }).catch(
      () => undefined,
    );
  }, []);
  if (!locales.includes(locale as "en" | "ru")) return <NotFoundPage />;
  return <Outlet />;
}

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col antialiased">
      <SkipLink />
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RedirectLocale />} />
      <Route path="/:locale" element={<LocaleSync />}>
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminHomePage />} />
          <Route path="clinics" element={<AdminClinicsPage />} />
          <Route path="clinics/new" element={<AdminClinicFormPage />} />
          <Route path="clinics/:id" element={<AdminClinicFormPage />} />
          <Route path="specialties" element={<AdminSpecialtiesPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="leads" element={<AdminLeadsPage />} />
          <Route path="leads/:id" element={<AdminLeadDetailPage />} />
          <Route path="outbox" element={<AdminOutboxPage />} />
        </Route>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="checker" element={<CheckerPage />} />
          <Route path="checker/results" element={<ResultsPage />} />
          <Route path="clinics" element={<ClinicsPage />} />
          <Route path="clinics/:slug" element={<ClinicPage />} />
          <Route path="clinics/:slug/apply" element={<ApplyPage />} />
          <Route path="apply/success" element={<SuccessPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
