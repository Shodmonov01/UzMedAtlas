import { cookies } from "next/headers";

const COOKIE = "uma_session";

export async function getSessionId() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? "anonymous";
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
