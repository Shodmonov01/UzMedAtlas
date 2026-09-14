import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { ClinicForm } from "@/components/admin/ClinicForm";

export const dynamic = "force-dynamic";

export default async function NewClinicPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const specialties = await prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">{t("newClinic")}</h1>
      <ClinicForm locale={locale} specialties={specialties} />
    </div>
  );
}
