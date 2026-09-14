import { CITIES, SERVICE_LANGUAGES } from "@/lib/constants";
import { saveClinic, deleteClinic, deletePhoto, duplicateClinic } from "@/actions/admin";
import { getTranslations } from "next-intl/server";
import { parseLanguages } from "@/lib/format";

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

export async function ClinicForm({
  clinic,
  specialties,
  locale,
  error,
}: {
  clinic?: ClinicFormData;
  specialties: { id: string; nameEn: string; nameRu: string }[];
  locale: string;
  error?: string;
}) {
  const t = await getTranslations("admin");
  const selected = new Set(clinic?.specialties?.map((item) => item.specialtyId) ?? []);
  const languages = clinic?.languages ? parseLanguages(clinic.languages) : ["en", "ru"];

  return (
    <div>
    {error === "slug" ? (
      <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{t("slugTaken")}</p>
    ) : error === "invalid" ? (
      <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{t("formError")}</p>
    ) : null}
    {clinic?.slug ? (
      <p className="mb-4">
        <a className="text-sm font-semibold text-teal" href={`/${locale}/clinics/${clinic.slug}`} target="_blank" rel="noreferrer">
          {t("preview")}
        </a>
      </p>
    ) : null}
    <form action={saveClinic} className="space-y-5 rounded-3xl border border-line bg-white p-6">
      <input type="hidden" name="locale" value={locale} />
      {clinic?.id ? <input type="hidden" name="id" value={clinic.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">
          {t("nameEn")}
          <input name="nameEn" required defaultValue={clinic?.nameEn} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("nameRu")}
          <input name="nameRu" required defaultValue={clinic?.nameRu} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("slug")}
          <input name="slug" defaultValue={clinic?.slug} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("city")}
          <select name="city" defaultValue={clinic?.city || "tashkent"} className="field mt-1">
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t("addressEn")}
          <input name="addressEn" required defaultValue={clinic?.addressEn} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("addressRu")}
          <input name="addressRu" required defaultValue={clinic?.addressRu} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("phone")}
          <input name="phone" required defaultValue={clinic?.phone} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("email")}
          <input name="email" type="email" required defaultValue={clinic?.email} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("website")}
          <input name="website" defaultValue={clinic?.website || ""} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("coverColor")}
          <input name="coverColor" type="color" defaultValue={clinic?.coverColor || "#1B6B6A"} className="field mt-1 h-12" />
        </label>
      </div>
      <label className="block text-sm font-semibold">
        {t("descriptionEn")}
        <textarea name="descriptionEn" required rows={4} defaultValue={clinic?.descriptionEn} className="field mt-1" />
      </label>
      <label className="block text-sm font-semibold">
        {t("descriptionRu")}
        <textarea name="descriptionRu" required rows={4} defaultValue={clinic?.descriptionRu} className="field mt-1" />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">{t("languages")}</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {SERVICE_LANGUAGES.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="languages"
                value={code}
                defaultChecked={languages.includes(code)}
              />
              {code}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold">{t("linkSpecialties")}</legend>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {specialties.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="specialtyIds"
                value={item.id}
                defaultChecked={selected.has(item.id)}
              />
              {locale === "ru" ? item.nameRu : item.nameEn}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="published" defaultChecked={clinic?.published ?? true} />
        {t("published")}
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">
          {t("whatsapp")}
          <input name="whatsapp" defaultValue={clinic?.whatsapp || ""} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("telegram")}
          <input name="telegram" defaultValue={clinic?.telegram || ""} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("coordinator")}
          <input name="coordinatorName" defaultValue={clinic?.coordinatorName || ""} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("responseHours")}
          <input name="responseHours" type="number" min={1} defaultValue={clinic?.responseHours ?? 24} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("coordinator")} EN
          <input name="coordinatorRoleEn" defaultValue={clinic?.coordinatorRoleEn || ""} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("coordinator")} RU
          <input name="coordinatorRoleRu" defaultValue={clinic?.coordinatorRoleRu || ""} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("licenseEn")}
          <textarea name="licenseInfoEn" defaultValue={clinic?.licenseInfoEn || ""} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("licenseRu")}
          <textarea name="licenseInfoRu" defaultValue={clinic?.licenseInfoRu || ""} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("afterEn")}
          <textarea name="afterRequestEn" defaultValue={clinic?.afterRequestEn || ""} className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("afterRu")}
          <textarea name="afterRequestRu" defaultValue={clinic?.afterRequestRu || ""} className="field mt-1" />
        </label>
      </div>
      <label className="block text-sm font-semibold">
        {t("logo")}
        <input name="logo" type="file" accept="image/*" className="field mt-1" />
        <span className="mt-1 block text-xs font-normal text-muted">{t("uploadHint")}</span>
      </label>
      {clinic?.id ? (
        <label className="block text-sm font-semibold">
          {t("addPhoto")}
          <input name="photo" type="file" accept="image/*" className="field mt-1" />
        </label>
      ) : null}
      {clinic?.photos?.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {clinic.photos.map((photo) => (
            <div key={photo.id} className="rounded-2xl border border-line p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="h-24 w-full rounded-xl object-cover" />
              <form action={deletePhoto} className="mt-2">
                <input type="hidden" name="id" value={photo.id} />
                <button className="text-xs text-red-700" type="submit">
                  {t("delete")}
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : null}
      <button className="btn btn-primary" type="submit">
        {clinic?.id ? t("save") : t("create")}
      </button>
    </form>
      {clinic?.id ? (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <form action={duplicateClinic}>
            <input type="hidden" name="id" value={clinic.id} />
            <input type="hidden" name="locale" value={locale} />
            <button className="text-sm font-semibold text-teal" type="submit">
              {t("duplicate")}
            </button>
          </form>
          <form action={deleteClinic}>
            <input type="hidden" name="id" value={clinic.id} />
            <input type="hidden" name="locale" value={locale} />
            <button className="text-sm text-red-700" type="submit">
              {t("delete")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
