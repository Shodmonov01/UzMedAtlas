import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { getLastLeadId } from "@/lib/session";
import { localized } from "@/lib/format";
import { whatsappLink } from "@/lib/phone";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("success");
  const leadId = await getLastLeadId();
  const lead = leadId
    ? await prisma.lead.findUnique({
        where: { id: leadId },
        include: { clinic: true },
      })
    : null;
  const loc = locale as Locale;
  const hours = lead?.clinic.responseHours ?? 24;
  const wa = lead?.clinic.whatsapp || lead?.clinic.phone;
  const waHref = wa ? whatsappLink(wa) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal text-2xl text-white">
        ✓
      </p>
      <h1 className="mt-6 font-display text-4xl md:text-5xl">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted">{t("body")}</p>
      <p className="mt-3 text-muted">{t("next")}</p>
      <p className="mt-1 text-sm text-muted">{t("hours", { hours })}</p>
      {lead ? (
        <p className="mt-2 text-sm font-semibold">
          {localized(lead.clinic, loc, "name")}
        </p>
      ) : null}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {waHref ? (
          <a href={waHref} className="btn btn-clay" target="_blank" rel="noreferrer">
            {t("whatsappClinic")}
          </a>
        ) : null}
        <Link href="/clinics" className="btn btn-primary">
          {t("catalog")}
        </Link>
        <Link href="/" className="btn btn-ghost">
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
