import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPaths = ["", "/clinics", "/faq", "/how-it-works", "/privacy"];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${base}/${locale}${path}`,
        changeFrequency: path === "/clinics" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.7,
      });
    }
  }

  try {
    const clinics = await prisma.clinic.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    for (const clinic of clinics) {
      for (const locale of routing.locales) {
        entries.push({
          url: `${base}/${locale}/clinics/${clinic.slug}`,
          lastModified: clinic.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch {
    // Sitemap should still return static URLs if the database is empty.
  }

  return entries;
}
