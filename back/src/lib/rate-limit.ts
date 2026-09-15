const windows = new Map<string, { count: number; start: number }>();

export function checkRateLimit(key: string, limit = 5, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || now - current.start > windowMs) {
    windows.set(key, { count: 1, start: now });
    return { ok: true, remaining: limit - 1 };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}
