import { prisma } from "./db";

export async function trackEvent(
  type: string,
  meta?: Record<string, string>,
  sessionId = "anonymous",
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type,
        sessionId,
        meta: meta && Object.keys(meta).length ? JSON.stringify(meta) : null,
      },
    });
  } catch {
    // Analytics should never break the patient flow.
  }
}
