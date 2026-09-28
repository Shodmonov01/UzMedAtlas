import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clinicsRoutes } from "./routes/clinics";
import { specialtiesRoutes } from "./routes/specialties";
import { checkerRoutes } from "./routes/checker";
import { adminRoutes } from "./routes/admin";
import { cabinetRoutes } from "./routes/cabinet";
import { leadsRoutes } from "./routes/leads";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4000);
const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

async function main() {
  const app = Fastify({ logger: true });

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
  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "public"),
    prefix: "/",
    decorateReply: false,
  });

  app.get("/api/health", async () => ({ ok: true, service: "uzmedatlas-server" }));

  await app.register(clinicsRoutes);
  await app.register(specialtiesRoutes);
  await app.register(checkerRoutes);
  await app.register(adminRoutes);
  await app.register(cabinetRoutes);
  await app.register(leadsRoutes);

  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`API on http://localhost:${port} (CORS ${clientOrigins.join(", ")})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
