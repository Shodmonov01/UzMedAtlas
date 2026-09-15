import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../api";
import { CITIES, SERVICE_LANGUAGES } from "@/lib/constants";
import { parseLanguages } from "@/lib/format";
import { useLocale, withLocale } from "../locale-link";

type ClinicFormData = {
  id?: string;
  slug?: string;
  nameEn?: string;
  nameRu?: string;
  city?: string;
  addressEn?: string;
  addressRu?: string;
  descriptionEn?: string;
  descriptionRu?: string;
  phone?: string;
  email?: string;
  website?: string | null;
  languages?: string;
  coverColor?: string;
  published?: boolean;
  logoUrl?: string | null;
  photos?: { id: string; url: string }[];
  specialties?: { specialtyId: string }[];
  whatsapp?: string | null;
  telegram?: string | null;
  coordinatorName?: string | null;
  coordinatorRoleEn?: string | null;
  coordinatorRoleRu?: string | null;
  responseHours?: number;
  licenseInfoEn?: string | null;
  licenseInfoRu?: string | null;
  afterRequestEn?: string | null;
  afterRequestRu?: string | null;
};

export function AdminClinicFormPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<ClinicFormData | undefined>(undefined);
  const [specialties, setSpecialties] = useState<{ id: string; nameEn: string; nameRu: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      api
        .get<{ clinic: ClinicFormData; specialties: { id: string; nameEn: string; nameRu: string }[] }>(
          `/api/admin/clinics/${id}`,
        )
        .then((data) => {
          setClinic(data.clinic);
          setSpecialties(data.specialties);
        });
    } else {
      api.get<{ specialties: { id: string; nameEn: string; nameRu: string }[] }>("/api/admin/specialties").then((data) => {
        setSpecialties(data.specialties);
      });
    }
  }, [id]);

  const selected = new Set(clinic?.specialties?.map((item) => item.specialtyId) ?? []);
  const languages = clinic?.languages ? parseLanguages(clinic.languages) : ["en", "ru"];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    try {
      const path = id ? `/api/admin/clinics/${id}` : "/api/admin/clinics";
      const result = await api.postForm<{ clinic: { id: string } }>(path, form);
      navigate(withLocale(locale, `/admin/clinics/${result.clinic.id}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "invalid");
    }
  }

  async function removePhoto(photoId: string) {
    await api.delete(`/api/admin/photos/${photoId}`);
    if (id) {
      const data = await api.get<{ clinic: ClinicFormData }>(`/api/admin/clinics/${id}`);
      setClinic(data.clinic);
    }
  }

  async function duplicate() {
    if (!id) return;
    const result = await api.postForm<{ clinic: { id: string } }>(`/api/admin/clinics/${id}/duplicate`, new FormData());
    navigate(withLocale(locale, `/admin/clinics/${result.clinic.id}`));
  }

  async function removeClinic() {
    if (!id) return;
    await api.delete(`/api/admin/clinics/${id}`);
    navigate(withLocale(locale, "/admin/clinics"));
  }

  return (
    <div>
      {error === "slug" ? (
        <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{t("admin.slugTaken")}</p>
      ) : error ? (
        <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{t("admin.formError")}</p>
      ) : null}
      {clinic?.slug ? (
        <p className="mb-4">
          <a className="text-sm font-semibold text-teal" href={`/${locale}/clinics/${clinic.slug}`} target="_blank" rel="noreferrer">
            {t("admin.preview")}
          </a>
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-line bg-white p-6">
        {clinic?.id ? <input type="hidden" name="id" value={clinic.id} /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            {t("admin.nameEn")}
            <input name="nameEn" required defaultValue={clinic?.nameEn} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.nameRu")}
            <input name="nameRu" required defaultValue={clinic?.nameRu} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.slug")}
            <input name="slug" defaultValue={clinic?.slug} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.city")}
            <select name="city" defaultValue={clinic?.city || "tashkent"} className="field mt-1">
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {t("admin.addressEn")}
            <input name="addressEn" required defaultValue={clinic?.addressEn} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.addressRu")}
            <input name="addressRu" required defaultValue={clinic?.addressRu} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.phone")}
            <input name="phone" required defaultValue={clinic?.phone} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.email")}
            <input name="email" type="email" required defaultValue={clinic?.email} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.website")}
            <input name="website" defaultValue={clinic?.website || ""} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.coverColor")}
            <input name="coverColor" type="color" defaultValue={clinic?.coverColor || "#1B6B6A"} className="field mt-1 h-12" />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          {t("admin.descriptionEn")}
          <textarea name="descriptionEn" required rows={4} defaultValue={clinic?.descriptionEn} className="field mt-1" />
        </label>
        <label className="block text-sm font-semibold">
          {t("admin.descriptionRu")}
          <textarea name="descriptionRu" required rows={4} defaultValue={clinic?.descriptionRu} className="field mt-1" />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">{t("admin.languages")}</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {SERVICE_LANGUAGES.map((code) => (
              <label key={code} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="languages" value={code} defaultChecked={languages.includes(code)} />
                {code}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">{t("admin.linkSpecialties")}</legend>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {specialties.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="specialtyIds" value={item.id} defaultChecked={selected.has(item.id)} />
                {locale === "ru" ? item.nameRu : item.nameEn}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="published" defaultChecked={clinic?.published ?? true} />
          {t("admin.published")}
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            {t("admin.whatsapp")}
            <input name="whatsapp" defaultValue={clinic?.whatsapp || ""} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.telegram")}
            <input name="telegram" defaultValue={clinic?.telegram || ""} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.coordinator")}
            <input name="coordinatorName" defaultValue={clinic?.coordinatorName || ""} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.responseHours")}
            <input name="responseHours" type="number" min={1} defaultValue={clinic?.responseHours ?? 24} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.coordinator")} EN
            <input name="coordinatorRoleEn" defaultValue={clinic?.coordinatorRoleEn || ""} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.coordinator")} RU
            <input name="coordinatorRoleRu" defaultValue={clinic?.coordinatorRoleRu || ""} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.licenseEn")}
            <textarea name="licenseInfoEn" defaultValue={clinic?.licenseInfoEn || ""} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.licenseRu")}
            <textarea name="licenseInfoRu" defaultValue={clinic?.licenseInfoRu || ""} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.afterEn")}
            <textarea name="afterRequestEn" defaultValue={clinic?.afterRequestEn || ""} className="field mt-1" />
          </label>
          <label className="text-sm font-semibold">
            {t("admin.afterRu")}
            <textarea name="afterRequestRu" defaultValue={clinic?.afterRequestRu || ""} className="field mt-1" />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          {t("admin.logo")}
          <input name="logo" type="file" accept="image/*" className="field mt-1" />
          <span className="mt-1 block text-xs font-normal text-muted">{t("admin.uploadHint")}</span>
        </label>
        {clinic?.id ? (
          <label className="block text-sm font-semibold">
            {t("admin.addPhoto")}
            <input name="photo" type="file" accept="image/*" className="field mt-1" />
          </label>
        ) : null}
        {clinic?.photos?.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {clinic.photos.map((photo) => (
              <div key={photo.id} className="rounded-2xl border border-line p-2">
                <img src={photo.url} alt="" className="h-24 w-full rounded-xl object-cover" />
                <button className="mt-2 text-xs text-red-700" type="button" onClick={() => removePhoto(photo.id)}>
                  {t("admin.delete")}
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <button className="btn btn-primary" type="submit">
          {clinic?.id ? t("admin.save") : t("admin.create")}
        </button>
      </form>
      {clinic?.id ? (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button className="text-sm font-semibold text-teal" type="button" onClick={duplicate}>
            {t("admin.duplicate")}
          </button>
          <button className="text-sm text-red-700" type="button" onClick={removeClinic}>
            {t("admin.delete")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
