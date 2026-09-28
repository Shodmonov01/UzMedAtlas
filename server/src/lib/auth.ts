import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";

const ADMIN_COOKIE = "uma_admin";
const CLINIC_COOKIE = "uma_clinic";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64).toString("hex");
  return safeEqual(next, hash);
}

function readSignedCookie(request: FastifyRequest, name: string) {
  const token = request.cookies?.[name];
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}

function writeSignedCookie(reply: FastifyReply, name: string) {
  const exp = String(Date.now() + MAX_AGE_SECONDS * 1000);
  reply.setCookie(name, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function checkAdminPassword(password: string) {
  return safeEqual(password, process.env.ADMIN_PASSWORD || "admin123");
}

/** @deprecated Shared cabinet password — only for emergency bootstrap */
export function checkClinicPassword(password: string) {
  return safeEqual(password, process.env.CLINIC_PASSWORD || "clinic123");
}

export function isAdminAuthenticated(request: FastifyRequest) {
  return readSignedCookie(request, ADMIN_COOKIE);
}

export function getClinicOwnerId(request: FastifyRequest): string | null {
  const token = request.cookies?.[CLINIC_COOKIE];
  if (!token) return null;
  const [exp, ownerId, sig] = token.split(".");
  if (!exp || !ownerId || !sig) return null;
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires < Date.now()) return null;
  if (!safeEqual(sig, sign(`${exp}.${ownerId}`))) return null;
  return ownerId;
}

export function isClinicAuthenticated(request: FastifyRequest) {
  return Boolean(getClinicOwnerId(request));
}

export function setAdminSession(reply: FastifyReply) {
  writeSignedCookie(reply, ADMIN_COOKIE);
}

export function clearAdminSession(reply: FastifyReply) {
  reply.clearCookie(ADMIN_COOKIE, { path: "/" });
}

export function setClinicSession(reply: FastifyReply, ownerId: string) {
  const exp = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const payload = `${exp}.${ownerId}`;
  reply.setCookie(CLINIC_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearClinicSession(reply: FastifyReply) {
  reply.clearCookie(CLINIC_COOKIE, { path: "/" });
}

export function ensureSessionId(request: FastifyRequest, reply: FastifyReply) {
  const existing = request.cookies?.uma_session;
  if (existing) return existing;
  const id = randomUUID();
  reply.setCookie("uma_session", id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return id;
}
