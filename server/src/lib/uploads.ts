import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

export async function saveUploadBuffer(
  buffer: Buffer,
  mimeType: string,
  folder = "uploads",
) {
  if (!buffer.length) return null;
  if (!ALLOWED.has(mimeType)) {
    throw new Error("Unsupported file type");
  }
  const ext =
    mimeType === "image/svg+xml"
      ? "svg"
      : mimeType === "image/jpeg"
        ? "jpg"
        : mimeType.split("/")[1];
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return `/${folder}/${name}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
