import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { saveSpecialty, deleteSpecialty } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function SpecialtiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const specialties = await prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">{t("specialties")}</h1>
      <form action={saveSpecialty} className="grid gap-3 rounded-3xl border border-line bg-white p-5 md:grid-cols-2">
        <label className="text-sm font-semibold">
          {t("nameEn")}
          <input name="nameEn" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("nameRu")}
          <input name="nameRu" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("slug")}
          <input name="slug" className="field mt-1" />
        </label>
        <label className="text-sm font-semibold md:col-span-2">
          {t("keywords")}
          <input name="keywords" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("descriptionEn")}
          <textarea name="descriptionEn" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("descriptionRu")}
          <textarea name="descriptionRu" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("explanationEn")}
          <textarea name="explanationEn" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("explanationRu")}
          <textarea name="explanationRu" required className="field mt-1" />
        </label>
        <div className="md:col-span-2">
          <button className="btn btn-primary" type="submit">
            {t("create")}
          </button>
        </div>
      </form>
      <div className="space-y-4">
        {specialties.map((item) => (
          <form
            key={item.id}
            action={saveSpecialty}
            className="grid gap-3 rounded-3xl border border-line bg-white p-5 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={item.id} />
            <label className="text-sm font-semibold">
              {t("nameEn")}
              <input name="nameEn" required defaultValue={item.nameEn} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("nameRu")}
              <input name="nameRu" required defaultValue={item.nameRu} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("slug")}
              <input name="slug" defaultValue={item.slug} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold md:col-span-2">
              {t("keywords")}
              <input name="keywords" required defaultValue={item.keywords} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("descriptionEn")}
              <textarea name="descriptionEn" required defaultValue={item.descriptionEn} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("descriptionRu")}
              <textarea name="descriptionRu" required defaultValue={item.descriptionRu} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("explanationEn")}
              <textarea name="explanationEn" required defaultValue={item.explanationEn} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("explanationRu")}
              <textarea name="explanationRu" required defaultValue={item.explanationRu} className="field mt-1" />
            </label>
            <div className="flex gap-3 md:col-span-2">
              <button className="btn btn-primary" type="submit">
                {t("save")}
              </button>
              <button formAction={deleteSpecialty} className="text-sm text-red-700" type="submit">
                {t("delete")}
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
