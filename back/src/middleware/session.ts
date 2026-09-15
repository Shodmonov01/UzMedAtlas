import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { parseUtmSearch, serializeUtm } from "../lib/utm";
import { cookieOptions } from "../lib/cookies";

function queryParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return typeof value === "string" ? value : "";
}

export function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.uma_session) {
    const id = randomUUID().replaceAll("-", "");
    res.cookie("uma_session", id, cookieOptions(60 * 60 * 24 * 30 * 1000));
    req.cookies = { ...req.cookies, uma_session: id };
  }

  const params = new URLSearchParams();
  for (const key of ["utm_source", "utm_medium", "utm_campaign"] as const) {
    const value = queryParam(req.query[key]);
    if (value) params.set(key, value);
  }
  const utm = parseUtmSearch(params);
  if (utm) {
    res.cookie("uma_utm", serializeUtm(utm), cookieOptions(60 * 60 * 24 * 30 * 1000));
    req.cookies = { ...req.cookies, uma_utm: serializeUtm(utm) };
  }

  next();
}
