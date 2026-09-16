import type { Request, Response } from "express";
import type { Duration, Gender } from "./constants";
import { cookieOptions } from "./cookies";

export type CheckerState = {
  skipped?: boolean;
  symptoms?: string;
  age?: number;
  gender?: Gender;
  duration?: Duration;
  forChild?: boolean;
  specialtySlug?: string;
  specialtySlugs?: string[];
  redFlags?: string[];
};

const COOKIE = "uma_checker";

export function getCheckerState(req: Request): CheckerState | null {
  const raw = req.cookies?.[COOKIE] as string | undefined;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckerState;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(raw)) as CheckerState;
    } catch {
      return null;
    }
  }
}

export function setCheckerState(res: Response, state: CheckerState) {
  const payload: CheckerState = {
    ...state,
    symptoms: state.symptoms?.slice(0, 1500),
  };
  res.cookie(COOKIE, JSON.stringify(payload), cookieOptions(60 * 60 * 24 * 7 * 1000));
}

export function clearCheckerState(res: Response) {
  res.clearCookie(COOKIE, { path: "/" });
}

export function hasCheckerDetails(state: CheckerState | null) {
  return Boolean(state && !state.skipped && state.symptoms && state.specialtySlug);
}
