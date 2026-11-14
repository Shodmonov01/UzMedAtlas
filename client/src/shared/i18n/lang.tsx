/** The site is English only. */

/** A name from the API in English, falling back to the Russian when the clinic has no English name yet. */
export function pickName(ru?: string | null, en?: string | null) {
  return en || ru || "";
}

/** A count with its noun: "1 clinic", "3 clinics". */
export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
