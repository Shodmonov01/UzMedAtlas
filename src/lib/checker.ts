export type SpecialtyLike = {
  slug: string;
  keywords: string;
};

export function normalizeText(input: string) {
  return input
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreSpecialty(text: string, keywords: string) {
  const haystack = ` ${normalizeText(text)} `;
  const parts = keywords
    .split(",")
    .map((item) => normalizeText(item))
    .filter(Boolean);

  let score = 0;
  for (const keyword of parts) {
    if (!keyword) continue;
    if (haystack.includes(` ${keyword} `) || haystack.includes(keyword)) {
      score += keyword.length >= 6 ? 3 : keyword.length >= 4 ? 2 : 1;
    }
  }
  return score;
}

export function pickSpecialty<T extends SpecialtyLike>(
  text: string,
  specialties: T[],
  fallbackSlug = "diagnostics",
): { specialty: T; score: number } {
  if (specialties.length === 0) {
    throw new Error("No specialties available");
  }

  let best = specialties[0];
  let bestScore = -1;

  for (const specialty of specialties) {
    const score = scoreSpecialty(text, specialty.keywords);
    if (score > bestScore) {
      best = specialty;
      bestScore = score;
    }
  }

  if (bestScore <= 0) {
    const fallback =
      specialties.find((item) => item.slug === fallbackSlug) ?? best;
    return { specialty: fallback, score: 0 };
  }

  return { specialty: best, score: bestScore };
}
