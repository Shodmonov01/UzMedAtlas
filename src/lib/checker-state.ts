import { cookies } from "next/headers";
import type { Duration, Gender } from "./constants";

export type CheckerState = {
  skipped?: boolean;
  symptoms?: string;
  age?: number;
  gender?: Gender;
  duration?: Duration;
  specialtySlug?: string;
};

const COOKIE = "uma_checker";

export async function getCheckerState(): Promise<CheckerState | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as CheckerState;
  } catch {
    return null;
  }
}

export async function setCheckerState(state: CheckerState) {
  const jar = await cookies();
  const payload: CheckerState = {
    ...state,
    symptoms: state.symptoms?.slice(0, 1500),
  };
  jar.set(COOKIE, encodeURIComponent(JSON.stringify(payload)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function clearCheckerState() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function hasCheckerDetails(state: CheckerState | null) {
  return Boolean(
    state &&
      !state.skipped &&
      state.symptoms &&
      state.specialtySlug,
  );
}
