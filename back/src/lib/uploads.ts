import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import multer from "multer";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"]);

const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

function extFor(mime: string) {
  if (mime === "image/svg+xml") return "svg";
  if (mime === "image/jpeg") return "jpg";
  return mime.split("/")[1] || "bin";
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${randomBytes(4).toString("hex")}.${extFor(file.mimetype)}`);
    },
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new Error("Unsupported file type"));
      return;
    }
    cb(null, true);
  },
});

export function publicUploadUrl(file?: Express.Multer.File) {
  if (!file) return undefined;
  return `/uploads/${file.filename}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
