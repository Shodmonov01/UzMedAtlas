import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const COOKIE = "uma_session";

export async function getSessionId() {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && existing.length >= 16) return existing;
  const id = randomBytes(16).toString("hex");
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return id;
}

export async function setLastLeadId(id: string) {
  const jar = await cookies();
  jar.set("uma_last_lead", id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function getLastLeadId() {
  const jar = await cookies();
  return jar.get("uma_last_lead")?.value ?? null;
}
