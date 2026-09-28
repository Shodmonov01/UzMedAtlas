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

type AiRecommendation = {
  specialtySlug: string;
  doctorRecommendation: string;
  explanationRu: string;
};

async function requestAiRecommendation(
  data: z.infer<typeof analyzeSchema>,
  specialties: { slug: string; nameRu: string; nameEn: string }[],
): Promise<AiRecommendation | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You provide cautious symptom navigation, never a diagnosis. Return JSON only with specialtySlug, doctorRecommendation, explanationRu. Choose specialtySlug only from the supplied list. Recommend an appropriate type of medical specialist and explain briefly in Russian why that direction may be relevant. Do not prescribe treatment or medication. If symptoms may be urgent, say to seek emergency care immediately.",
        },
        {
          role: "user",
          content: JSON.stringify({
            symptoms: data.symptoms,
            age: data.age,
            gender: data.gender,
            duration: data.duration,
            forChild: data.forChild,
            availableSpecialties: specialties.map(({ slug, nameRu, nameEn }) => ({ slug, nameRu, nameEn })),
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned an empty response");
  const parsed = JSON.parse(content) as Partial<AiRecommendation>;
  if (typeof parsed.specialtySlug !== "string" || !specialties.some((item) => item.slug === parsed.specialtySlug)) {
    throw new Error("AI provider returned an unknown specialty");
  }
  if (typeof parsed.explanationRu !== "string" || typeof parsed.doctorRecommendation !== "string") {
    throw new Error("AI provider returned an invalid recommendation");
  }
  return {
    specialtySlug: parsed.specialtySlug,
    doctorRecommendation: parsed.doctorRecommendation.slice(0, 180),
    explanationRu: parsed.explanationRu.slice(0, 600),
  };
}

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
    let ai: AiRecommendation | null = null;
    try {
      ai = await requestAiRecommendation(parsed.data, specialties);
    } catch (error) {
      request.log.warn({ err: error }, "Health Checker AI unavailable; using local matching");
    }

    const aiChoice = ai
      ? ranked.find((item) => item.specialty.slug === ai!.specialtySlug) ??
        specialties
          .filter((item) => item.slug === ai!.specialtySlug)
          .map((specialty) => ({ specialty, score: 1, reasons: ["ai"] }))[0]
      : undefined;
    const resultItems = aiChoice
      ? [aiChoice, ...ranked.filter((item) => item.specialty.slug !== aiChoice.specialty.slug)].slice(0, 3)
      : ranked;
    const specialtySlugs = resultItems.map((item) => item.specialty.slug);

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
      source: ai ? "ai" : "rules",
      doctorRecommendation: ai?.doctorRecommendation ?? null,
      specialtySlugs,
      specialties: resultItems.map((item) => ({
        slug: item.specialty.slug,
        nameEn: item.specialty.nameEn,
        nameRu: item.specialty.nameRu,
        explanationEn: item.specialty.explanationEn,
        explanationRu: ai && item.specialty.slug === ai.specialtySlug
          ? ai.explanationRu
          : item.specialty.explanationRu,
        score: item.score,
      })),
    };
  });
}
