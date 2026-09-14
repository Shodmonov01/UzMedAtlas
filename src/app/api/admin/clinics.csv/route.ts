import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { parseLanguages } from "@/lib/format";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const clinics = await prisma.clinic.findMany({
    orderBy: { nameEn: "asc" },
    include: { specialties: { include: { specialty: true } }, _count: { select: { leads: true } } },
  });
  const header = ["slug", "nameEn", "nameRu", "city", "published", "languages", "responseHours", "leads"];
  const rows = clinics.map((clinic) => [
    clinic.slug,
    clinic.nameEn,
    clinic.nameRu,
    clinic.city,
    clinic.published ? "yes" : "no",
    parseLanguages(clinic.languages).join(" "),
    clinic.responseHours,
    clinic._count.leads,
  ]);
  return new NextResponse(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=uzmedatlas-clinics.csv",
    },
  });
}
