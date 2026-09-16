import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { publicRouter } from "./routes/public";
import { adminRouter } from "./routes/admin";
import { sessionMiddleware } from "./middleware/session";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const envPath = path.join(root, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

const app = express();
const origin = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

app.use(
  cors({
    origin: [origin, "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

app.use("/clinics", express.static(path.join(root, "public", "clinics")));
app.use("/uploads", express.static(path.join(root, "public", "uploads")));

app.use("/api", publicRouter);
app.use("/api/admin", adminRouter);

const frontDist = path.join(root, "..", "front", "dist");
if (fs.existsSync(frontDist)) {
  app.use(express.static(frontDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontDist, "index.html"));
  });
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "server" });
});

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => {
  console.log(`UzMedAtlas http://${host}:${port}`);
});
