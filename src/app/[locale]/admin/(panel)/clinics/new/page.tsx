import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { ClinicForm } from "@/components/admin/ClinicForm";

export const dynamic = "force-dynamic";

export default async function NewClinicPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const specialties = await prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">{t("newClinic")}</h1>
      <ClinicForm locale={locale} specialties={specialties} error={error} />
    </div>
  );
}
