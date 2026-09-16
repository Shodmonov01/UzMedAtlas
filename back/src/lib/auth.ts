import type { Request, Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { cookieOptions } from "./cookies";

const COOKIE = "uma_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function isAdminAuthenticated(req: Request) {
  const token = req.cookies?.[COOKIE] as string | undefined;
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = sign(exp);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function setAdminSession(res: Response) {
  const exp = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const token = `${exp}.${sign(exp)}`;
  res.cookie(COOKIE, token, cookieOptions(MAX_AGE_SECONDS * 1000));
}

export function clearAdminSession(res: Response) {
  res.clearCookie(COOKIE, { path: "/" });
}

export function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  if (password.length !== expected.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(password), Buffer.from(expected));
  } catch {
    return false;
  }
}
