import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OutboxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const emails = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { lead: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">{t("outbox")}</h1>
      <p className="text-sm text-muted">
        If SMTP is not configured, messages are stored here so the team can still see what the clinic would receive.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand">
            <tr>
              <th className="px-4 py-3">{t("date")}</th>
              <th className="px-4 py-3">{t("to")}</th>
              <th className="px-4 py-3">{t("subject")}</th>
              <th className="px-4 py-3">{t("emailStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((item) => (
              <tr key={item.id} className="border-t border-line align-top">
                <td className="px-4 py-3 whitespace-nowrap">
                  {item.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td className="px-4 py-3">{item.toAddress}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{item.subject}</p>
                  <pre className="mt-2 max-w-xl whitespace-pre-wrap text-xs text-muted">{item.body}</pre>
                </td>
                <td className="px-4 py-3">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
