import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { clinic: true, recommendedSpecialty: true },
  });
  const header = [
    "createdAt",
    "status",
    "source",
    "fullName",
    "country",
    "phone",
    "email",
    "clinic",
    "specialty",
    "contactMethod",
    "preferredHours",
    "utmSource",
    "utmMedium",
    "utmCampaign",
  ];
  const rows = leads.map((lead) => [
    lead.createdAt.toISOString(),
    lead.status,
    lead.source,
    lead.fullName,
    lead.country,
    lead.phone,
    lead.email ?? "",
    lead.clinic.nameEn,
    lead.recommendedSpecialty?.nameEn ?? "",
    lead.contactMethod,
    lead.preferredHours ?? "",
    lead.utmSource ?? "",
    lead.utmMedium ?? "",
    lead.utmCampaign ?? "",
  ]);
  return new NextResponse(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=uzmedatlas-leads.csv",
    },
  });
}
