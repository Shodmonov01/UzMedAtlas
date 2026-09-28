import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { detectRedFlags, rankSpecialties } from "../lib/checker";
import { DURATIONS, GENDERS } from "../lib/constants";
import { prisma } from "../lib/db";
import { trackEvent } from "../lib/analytics";
import { ensureSessionId } from "../lib/auth";

const analyzeSchema = z.object({
  symptoms: z.string().trim().min(8).max(1500),
  age: z.coerce.number().int().min(1).max(120),
  gender: z.enum(GENDERS),
  duration: z.enum(DURATIONS),
  forChild: z.boolean().default(false),
});

export async function checkerRoutes(app: FastifyInstance) {
  app.post("/api/checker/analyze", async (request, reply) => {
    const sessionId = ensureSessionId(request, reply);
    const parsed = analyzeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
    }

    const specialties = await prisma.specialty.findMany();
    const ranked = rankSpecialties(
      {
        text: parsed.data.symptoms,
        age: parsed.data.age,
        gender: parsed.data.gender,
        forChild: parsed.data.forChild,
        duration: parsed.data.duration,
      },
      specialties,
    );
    const redFlags = detectRedFlags(parsed.data.symptoms);
    const specialtySlugs = ranked.map((item) => item.specialty.slug);

    await trackEvent(
      "checker_complete",
      {
        specialty: specialtySlugs[0] ?? "none",
        alternatives: String(specialtySlugs.length),
        redFlags: redFlags.join(",") || "none",
      },
      sessionId,
    );

    return {
      symptoms: parsed.data.symptoms,
      redFlags,
      specialtySlugs,
      specialties: ranked.map((item) => ({
        slug: item.specialty.slug,
        nameEn: item.specialty.nameEn,
        nameRu: item.specialty.nameRu,
        explanationEn: item.specialty.explanationEn,
        explanationRu: item.specialty.explanationRu,
        score: item.score,
      })),
    };
  });
}
