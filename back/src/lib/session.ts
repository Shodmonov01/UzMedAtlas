import type { Request, Response } from "express";
import { deserializeUtm, type Utm } from "./utm";
import { cookieOptions } from "./cookies";

export function getSessionId(req: Request) {
  return (req.cookies?.uma_session as string | undefined) ?? "anonymous";
}

export function setLastLeadId(res: Response, id: string) {
  res.cookie("uma_last_lead", id, cookieOptions(60 * 60 * 1000));
}

export function getLastLeadId(req: Request) {
  return (req.cookies?.uma_last_lead as string | undefined) ?? null;
}

export function getUtm(req: Request): Utm | null {
  return deserializeUtm(req.cookies?.uma_utm as string | undefined);
}
