import type { FastifyInstance } from "fastify";
import { queryClinics } from "../lib/catalog-query";
import {
  branchDetailInclude,
  clinicDetailInclude,
  parseJsonArray,
  parsePhones,
  parseSchedule,
  serializeBranchSummary,
  serializeDoctor,
  serializeService,
} from "../lib/clinic-serialize";
import { prisma } from "../lib/db";
import { parseLanguages } from "../lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializePublicClinic(clinic: any) {
  return {
    id: clinic.id,
    slug: clinic.slug,
    nameEn: clinic.nameEn,
    nameRu: clinic.nameRu,
    shortName: clinic.shortName,
    foundedYear: clinic.foundedYear,
    city: clinic.city,
    addressEn: clinic.addressEn,
    addressRu: clinic.addressRu,
    lat: clinic.lat ?? null,
    lng: clinic.lng ?? null,
    descriptionEn: clinic.descriptionEn,
    descriptionRu: clinic.descriptionRu,
    historyEn: clinic.historyEn,
    historyRu: clinic.historyRu,
    missionEn: clinic.missionEn,
    missionRu: clinic.missionRu,
    advantagesEn: clinic.advantagesEn,
    advantagesRu: clinic.advantagesRu,
    phone: clinic.phone,
    email: clinic.email,
    website: clinic.website,
    whatsapp: clinic.whatsapp,
    telegram: clinic.telegram,
    instagram: clinic.instagram,
    youtube: clinic.youtube ?? null,
    socials: parseJsonArray(clinic.socialsJson),
    languages: parseLanguages(clinic.languages),
    logoUrl: clinic.logoUrl,
    coverColor: clinic.coverColor,
    status: clinic.status,
    founderName: clinic.founderName ?? null,
    founderRoleEn: clinic.founderRoleEn ?? null,
    founderRoleRu: clinic.founderRoleRu ?? null,
    founderBioEn: clinic.founderBioEn ?? null,
    founderBioRu: clinic.founderBioRu ?? null,
    founderPhotoUrl: clinic.founderPhotoUrl ?? null,
    achievements: parseJsonArray(clinic.achievementsJson),
    leaders: parseJsonArray(clinic.leadersJson),
    technologies: parseJsonArray(clinic.technologiesJson),
    chiefDoctorName: clinic.chiefDoctorName,
    chiefDoctorRoleEn: clinic.chiefDoctorRoleEn,
    chiefDoctorRoleRu: clinic.chiefDoctorRoleRu,
    chiefDoctorPhotoUrl: clinic.chiefDoctorPhotoUrl,
    chiefDoctorBioEn: clinic.chiefDoctorBioEn ?? null,
    chiefDoctorBioRu: clinic.chiefDoctorBioRu ?? null,
    responseHours: clinic.responseHours,
    whyChooseEn: clinic.whyChooseEn,
    whyChooseRu: clinic.whyChooseRu,
    popularServicesEn: clinic.popularServicesEn,
    popularServicesRu: clinic.popularServicesRu,
    developmentPlansEn: clinic.developmentPlansEn,
    developmentPlansRu: clinic.developmentPlansRu,
    medicalTourism: clinic.medicalTourism,
    medicalTourismEn: clinic.medicalTourismEn,
    medicalTourismRu: clinic.medicalTourismRu,
    photos: clinic.photos,
    specialties: clinic.specialties.map((item: { specialty: unknown }) => item.specialty),
    services: clinic.services.map(serializeService),
    doctors: clinic.doctors.map(serializeDoctor),
    equipment: clinic.equipment,
    certificates: clinic.certificates,
    branches: clinic.branches.map(serializeBranchSummary),
    branchCount: clinic._count.branches,
    doctorCount: clinic._count.doctors,
    cities: Array.from(
      new Set(
        (clinic.branches || []).map((b: { city: string }) => b.city).filter(Boolean),
      ),
    ),
  };
}

export async function clinicsRoutes(app: FastifyInstance) {
  app.get("/api/clinics", async (request) => {
    const query = request.query as Record<string, string | undefined>;
    const clinics = await queryClinics({
      q: query.q,
      city: query.city,
      specialty: query.specialty,
      service: query.service,
      sort: query.sort,
      lang: query.lang,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      responseMax: query.responseMax,
      medicalTourism: query.medicalTourism,
    });

    return {
      items: clinics.map((clinic) => ({
        id: clinic.id,
        slug: clinic.slug,
        nameEn: clinic.nameEn,
        nameRu: clinic.nameRu,
        city: clinic.city,
        addressEn: clinic.addressEn,
        addressRu: clinic.addressRu,
        lat: clinic.lat ?? null,
        lng: clinic.lng ?? null,
        descriptionEn: clinic.descriptionEn,
        descriptionRu: clinic.descriptionRu,
        phone: clinic.phone,
        email: clinic.email,
        languages: parseLanguages(clinic.languages),
        logoUrl: clinic.logoUrl,
        coverColor: clinic.coverColor,
        responseHours: clinic.responseHours,
        medicalTourism: clinic.medicalTourism,
        fromPrice: clinic.fromPrice,
        photos: clinic.photos,
        specialties: clinic.specialties.map((item) => item.specialty),
        services: clinic.services,
        branchCount: clinic._count?.branches ?? 0,
      })),
    };
  });

  app.get("/api/clinics/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const clinic = await prisma.clinic.findFirst({
      where: {
        slug,
        OR: [{ status: "published" }, { published: true }],
      },
      include: clinicDetailInclude,
    });
    if (!clinic) {
      return reply.code(404).send({ error: "not_found" });
    }
    return serializePublicClinic(clinic);
  });

  app.get("/api/clinics/:slug/branches", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const clinic = await prisma.clinic.findFirst({
      where: {
        slug,
        OR: [{ status: "published" }, { published: true }],
      },
      select: { id: true },
    });
    if (!clinic) return reply.code(404).send({ error: "not_found" });

    const branches = await prisma.branch.findMany({
      where: { clinicId: clinic.id },
      orderBy: { sortOrder: "asc" },
      include: {
        specialties: { include: { specialty: true } },
        photos: { orderBy: { sortOrder: "asc" } },
        _count: { select: { doctorLinks: true, services: true } },
      },
    });
    return { items: branches.map(serializeBranchSummary) };
  });

  app.get("/api/clinics/:slug/branches/:branchSlug", async (request, reply) => {
    const { slug, branchSlug } = request.params as { slug: string; branchSlug: string };
    const branch = await prisma.branch.findFirst({
      where: {
        slug: branchSlug,
        clinic: {
          slug,
          OR: [{ status: "published" }, { published: true }],
        },
      },
      include: branchDetailInclude,
    });
    if (!branch) return reply.code(404).send({ error: "not_found" });

    return {
      id: branch.id,
      clinicId: branch.clinicId,
      slug: branch.slug,
      nameEn: branch.nameEn,
      nameRu: branch.nameRu,
      city: branch.city,
      country: branch.country,
      region: branch.region,
      district: branch.district,
      street: branch.street,
      building: branch.building,
      addressExtra: branch.addressExtra,
      addressEn: branch.addressEn,
      addressRu: branch.addressRu,
      lat: branch.lat,
      lng: branch.lng,
      phone: branch.phone,
      phones: parsePhones(branch.phone, branch.phonesJson),
      email: branch.email,
      whatsapp: branch.whatsapp,
      telegram: branch.telegram,
      website: branch.website,
      instagram: branch.instagram,
      socials: parseJsonArray(branch.socialsJson),
      descriptionEn: branch.descriptionEn,
      descriptionRu: branch.descriptionRu,
      advantagesRu: branch.advantagesRu,
      featuresRu: branch.featuresRu,
      medicalTourism: branch.medicalTourism,
      medicalTourismInfoRu: branch.medicalTourismInfoRu,
      coverUrl: branch.coverUrl,
      schedule: parseSchedule(branch.scheduleJson),
      specialties: branch.specialties.map((s) => s.specialty),
      photos: branch.photos,
      doctors: branch.doctorLinks.map((link) => serializeDoctor(link.doctor)),
      services: branch.services.map(serializeService),
      equipment: branch.equipment,
      certificates: branch.certificates,
      clinic: branch.clinic,
    };
  });
}
