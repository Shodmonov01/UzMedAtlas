import type { FastifyInstance } from "fastify";
import { withContentTranslations } from "../lib/content-i18n";
import { prisma } from "../lib/db";

export async function specialtiesRoutes(app: FastifyInstance) {
  app.addHook("preSerialization", async (_request, _reply, payload) => withContentTranslations(payload));

  app.get("/api/specialties", async () => {
    const items = await prisma.specialty.findMany({
      where: { sortOrder: { lt: 900 } },
      orderBy: { sortOrder: "asc" },
    });
    return { items };
  });
}
