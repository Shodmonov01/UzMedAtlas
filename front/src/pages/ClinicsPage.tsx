import { useTranslation } from "react-i18next";
import { ClinicCatalog } from "../components/ClinicCatalog";
import { RecentlyViewed } from "../components/RecentlyViewed";

export function ClinicsPage() {
  const { t } = useTranslation();

  return (
    <div className="portal mx-auto max-w-7xl px-4 py-6 md:py-10">
      <h1 className="text-3xl md:text-5xl">{t("catalog.title")}</h1>
      <RecentlyViewed />
      <ClinicCatalog basePath="/clinics" />
    </div>
  );
}
