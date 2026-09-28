import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/db";

export async function specialtiesRoutes(app: FastifyInstance) {
  app.get("/api/specialties", async () => {
    const items = await prisma.specialty.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { items };
  });
}
