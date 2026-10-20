import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import fs from "node:fs";
import path from "node:path";
import { clinicsRoutes } from "./routes/clinics";
import { specialtiesRoutes } from "./routes/specialties";
import { checkerRoutes } from "./routes/checker";
import { adminRoutes } from "./routes/admin";
import { cabinetRoutes } from "./routes/cabinet";
import { leadsRoutes } from "./routes/leads";
import { telegramRoutes } from "./routes/telegram";

const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const publicRoot = path.join(process.cwd(), "public");
const clientDist = path.join(process.cwd(), "..", "client", "dist");

export async function buildApp(options: { logger?: boolean } = {}) {
  const app = Fastify({ logger: options.logger ?? true, trustProxy: "127.0.0.1" });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || clientOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        cb(null, true);
        return;
      }
      cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  });
  await app.register(cookie);

  // Media only — never register public/ at "/" with default wildcard (it swallows /assets).
  await app.register(fastifyStatic, {
    root: process.env.UPLOADS_DIR || path.join(publicRoot, "uploads"),
    prefix: "/uploads/",
    decorateReply: false,
  });
  await app.register(fastifyStatic, {
    root: path.join(publicRoot, "clinics"),
    prefix: "/clinics/",
    wildcard: false,
    decorateReply: false,
  });

  app.get("/api/health", async () => ({ ok: true, service: "uzmedatlas-server" }));

  await app.register(clinicsRoutes);
  await app.register(specialtiesRoutes);
  await app.register(checkerRoutes);
  await app.register(adminRoutes);
  await app.register(cabinetRoutes);
  await app.register(leadsRoutes);
  await app.register(telegramRoutes);

  if (fs.existsSync(clientDist)) {
    await app.register(fastifyStatic, {
      root: clientDist,
      prefix: "/",
      wildcard: false,
      decorateReply: true,
    });
    app.setNotFoundHandler((request, reply) => {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return reply.status(404).send({ error: "not_found" });
      }
      const urlPath = (request.url.split("?")[0] ?? "").replace(/\/+$/, "") || "/";
      if (urlPath.startsWith("/api") || urlPath.startsWith("/assets") || urlPath.startsWith("/uploads")) {
        return reply.status(404).send({ error: "not_found" });
      }
      if (/\.[a-zA-Z0-9]+$/.test(urlPath)) {
        return reply.status(404).send({ error: "not_found" });
      }
      return reply.sendFile("index.html");
    });
  }

  return app;
}
