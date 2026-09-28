/** Branch / clinic opening hours helpers (§21 / §34) */

export type DayHours = {
  open: string;
  close: string;
  roundTheClock?: boolean;
  breakStart?: string | null;
  breakEnd?: string | null;
} | null;

export type WeekSchedule = Partial<
  Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", DayHours>
>;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatDayHours(day: DayHours): string {
  if (!day) return "выходной";
  if (day.roundTheClock) return "круглосуточно";
  if (day.breakStart && day.breakEnd) {
    return `${day.open}–${day.breakStart} / ${day.breakEnd}–${day.close}`;
  }
  return `${day.open} – ${day.close}`;
}

/** Whether the clinic/branch is open right now (local browser time). */
export function isOpenNow(schedule: WeekSchedule | Record<string, DayHours> | null | undefined, now = new Date()): boolean {
  if (!schedule) return false;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tashkent",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday || "");
  if (dayIndex < 0) return false;
  const todayKey = DAY_KEYS[dayIndex];
  const cur = Number(parts.find((part) => part.type === "hour")?.value || 0) * 60 +
    Number(parts.find((part) => part.type === "minute")?.value || 0);

  const isWithin = (day: DayHours, minutes: number, previousDay = false) => {
    if (!day) return false;
    if (day.roundTheClock) return true;
    const open = toMinutes(day.open);
    const close = toMinutes(day.close);
    if (open == null || close == null) return false;
    const overnight = close <= open;
    const inHours = previousDay && overnight
      ? minutes < close
      : overnight
        ? minutes >= open
        : minutes >= open && minutes < close;
    if (!inHours) return false;
    if (day.breakStart && day.breakEnd) {
      const breakStart = toMinutes(day.breakStart);
      const breakEnd = toMinutes(day.breakEnd);
      if (breakStart != null && breakEnd != null && minutes >= breakStart && minutes < breakEnd) return false;
    }
    return true;
  };

  const today = (schedule as WeekSchedule)[todayKey];
  if (isWithin(today ?? null, cur)) return true;
  const previousKey = DAY_KEYS[(dayIndex + DAY_KEYS.length - 1) % DAY_KEYS.length];
  const previous = (schedule as WeekSchedule)[previousKey];
  return Boolean(previous && !previous.roundTheClock && isWithin(previous, cur, true));
}

export const EMPTY_DAY: Exclude<DayHours, null> = {
  open: "09:00",
  close: "18:00",
  roundTheClock: false,
  breakStart: null,
  breakEnd: null,
};
