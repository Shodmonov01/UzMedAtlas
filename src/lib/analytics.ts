import { prisma } from "./db";
import { getSessionId } from "./session";

export async function trackEvent(type: string, meta?: Record<string, string>) {
  try {
    const sessionId = await getSessionId();
    await prisma.analyticsEvent.create({
      data: {
        type,
        sessionId,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  } catch {
    // Analytics should never break the patient flow.
  }
}
