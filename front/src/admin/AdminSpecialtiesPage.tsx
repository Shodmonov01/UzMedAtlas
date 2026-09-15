import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";

type Specialty = {
  id: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  explanationEn: string;
  explanationRu: string;
  keywords: string;
};

export function AdminSpecialtiesPage() {
  const { t } = useTranslation();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  function load() {
    api.get<{ specialties: Specialty[] }>("/api/admin/specialties").then((data) => setSpecialties(data.specialties));
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    await api.post("/api/admin/specialties", data);
    form.reset();
    load();
  }

  async function remove(id: string) {
    await api.delete(`/api/admin/specialties/${id}`);
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">{t("admin.specialties")}</h1>
      <form onSubmit={save} className="grid gap-3 rounded-3xl border border-line bg-white p-5 md:grid-cols-2">
        <label className="text-sm font-semibold">
          {t("admin.nameEn")}
          <input name="nameEn" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("admin.nameRu")}
          <input name="nameRu" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("admin.slug")}
          <input name="slug" className="field mt-1" />
        </label>
        <label className="text-sm font-semibold md:col-span-2">
          {t("admin.keywords")}
          <input name="keywords" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("admin.descriptionEn")}
          <textarea name="descriptionEn" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("admin.descriptionRu")}
          <textarea name="descriptionRu" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("admin.explanationEn")}
          <textarea name="explanationEn" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("admin.explanationRu")}
          <textarea name="explanationRu" required className="field mt-1" />
        </label>
        <div className="md:col-span-2">
          <button className="btn btn-primary" type="submit">
            {t("admin.create")}
          </button>
        </div>
      </form>
      <div className="space-y-4">
        {specialties.map((item) => (
          <form key={item.id} onSubmit={save} className="grid gap-3 rounded-3xl border border-line bg-white p-5 md:grid-cols-2">
            <input type="hidden" name="id" value={item.id} />
            <label className="text-sm font-semibold">
              {t("admin.nameEn")}
              <input name="nameEn" required defaultValue={item.nameEn} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("admin.nameRu")}
              <input name="nameRu" required defaultValue={item.nameRu} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("admin.slug")}
              <input name="slug" defaultValue={item.slug} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold md:col-span-2">
              {t("admin.keywords")}
              <input name="keywords" required defaultValue={item.keywords} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("admin.descriptionEn")}
              <textarea name="descriptionEn" required defaultValue={item.descriptionEn} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("admin.descriptionRu")}
              <textarea name="descriptionRu" required defaultValue={item.descriptionRu} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("admin.explanationEn")}
              <textarea name="explanationEn" required defaultValue={item.explanationEn} className="field mt-1" />
            </label>
            <label className="text-sm font-semibold">
              {t("admin.explanationRu")}
              <textarea name="explanationRu" required defaultValue={item.explanationRu} className="field mt-1" />
            </label>
            <div className="flex gap-3 md:col-span-2">
              <button className="btn btn-primary" type="submit">
                {t("admin.save")}
              </button>
              <button className="text-sm text-red-700" type="button" onClick={() => remove(item.id)}>
                {t("admin.delete")}
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
