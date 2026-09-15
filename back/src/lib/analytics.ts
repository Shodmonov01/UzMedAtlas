import type { Request } from "express";
import { prisma } from "./db";
import { getSessionId, getUtm } from "./session";

export async function trackEvent(req: Request, type: string, meta?: Record<string, string>) {
  try {
    const sessionId = getSessionId(req);
    const utm = getUtm(req);
    const payload = {
      ...meta,
      ...(utm?.source ? { utm_source: utm.source } : {}),
      ...(utm?.medium ? { utm_medium: utm.medium } : {}),
      ...(utm?.campaign ? { utm_campaign: utm.campaign } : {}),
    };
    await prisma.analyticsEvent.create({
      data: {
        type,
        sessionId,
        meta: Object.keys(payload).length ? JSON.stringify(payload) : null,
      },
    });
  } catch {
    // Analytics should never break the patient flow.
  }
}
