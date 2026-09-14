import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { ClinicForm } from "@/components/admin/ClinicForm";

export const dynamic = "force-dynamic";

export default async function EditClinicPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const [clinic, specialties] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id },
      include: { photos: { orderBy: { sortOrder: "asc" } }, specialties: true },
    }),
    prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!clinic) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">{t("editClinic")}</h1>
      <ClinicForm locale={locale} specialties={specialties} clinic={clinic} />
    </div>
  );
}
