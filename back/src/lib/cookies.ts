import type { CookieOptions } from "express";

export function cookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeMs,
  };
}
