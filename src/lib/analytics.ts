import { prisma } from "./db";

export async function trackEvent(type: string, meta?: Record<string, string>) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  } catch {
    // Analytics should never break the patient flow.
  }
}
