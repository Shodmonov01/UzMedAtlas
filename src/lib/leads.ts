export const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isRecentDuplicate(createdAt: Date, now = new Date(), windowMs = DUPLICATE_WINDOW_MS) {
  return now.getTime() - createdAt.getTime() < windowMs;
}
