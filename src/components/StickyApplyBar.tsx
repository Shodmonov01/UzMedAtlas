import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function StickyApplyBar({
  slug,
  clinicName,
}: {
  slug: string;
  clinicName: string;
}) {
  const t = await getTranslations("clinic");
  return (
    <div className="sticky-apply">
      <p className="truncate text-sm font-semibold">{clinicName}</p>
      <Link href={`/clinics/${slug}/apply`} className="btn btn-clay px-4 py-2 text-sm">
        {t("apply")}
      </Link>
    </div>
  );
}
