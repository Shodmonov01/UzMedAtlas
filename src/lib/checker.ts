import type { Duration, Gender } from "./constants";

export type SpecialtyLike = {
  slug: string;
  keywords: string;
};

export type CheckerInput = {
  text: string;
  age?: number;
  gender?: Gender;
  forChild?: boolean;
  duration?: Duration;
};

export type RankedSpecialty<T extends SpecialtyLike> = {
  specialty: T;
  score: number;
  reasons: string[];
};

export type RedFlag = {
  id: string;
  keywords: string[];
};

export const RED_FLAGS: RedFlag[] = [
  {
    id: "chest",
    keywords: [
      "chest pain",
      "can't breathe",
      "cannot breathe",
      "shortness of breath",
      "crushing chest",
      "боль в груди",
      "давит в груди",
      "не могу дышать",
      "одышка сильная",
    ],
  },
  {
    id: "stroke",
    keywords: [
      "one side weak",
      "face droop",
      "can't speak",
      "cannot speak",
      "sudden numbness",
      "weakness on one side",
      "перекосило лицо",
      "не могу говорить",
      "слабость с одной стороны",
      "онемела половина",
    ],
  },
  {
    id: "bleeding",
    keywords: [
      "severe bleeding",
      "bleeding heavily",
      "uncontrolled bleeding",
      "сильное кровотечен",
      "не останавливается кровь",
    ],
  },
];

export function normalizeText(input: string) {
  return input
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectRedFlags(text: string) {
  const haystack = normalizeText(text);
  return RED_FLAGS.filter((flag) =>
    flag.keywords.some((keyword) => haystack.includes(normalizeText(keyword))),
  ).map((flag) => flag.id);
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

function isChild(input: CheckerInput) {
  return Boolean(input.forChild || (input.age != null && input.age < 18));
}

export function rankSpecialties<T extends SpecialtyLike>(
  input: CheckerInput,
  specialties: T[],
): RankedSpecialty<T>[] {
  const child = isChild(input);
  const ranked = specialties.map((specialty) => {
    const reasons: string[] = [];
    let score = scoreSpecialty(input.text, specialty.keywords);
    if (score > 0) reasons.push("symptoms");

    if (child && specialty.slug === "pediatrics") {
      score += 8;
      reasons.push("child");
    }
    if (child && specialty.slug !== "pediatrics" && score > 0) {
      score += 1;
    }
    if (!child && specialty.slug === "pediatrics" && score > 0) {
      score = Math.max(0, score - 4);
    }

    if (input.gender === "female" && specialty.slug === "gynecology" && score > 0) {
      score += 3;
      reasons.push("gender");
    }
    if (input.gender === "male" && specialty.slug === "gynecology") {
      score = 0;
    }
    if (input.gender === "male" && specialty.slug === "urology" && score > 0) {
      score += 2;
      reasons.push("gender");
    }

    if (
      input.duration === "more_than_year" &&
      ["diagnostics", "oncology", "rehabilitation"].includes(specialty.slug) &&
      score > 0
    ) {
      score += 1;
    }

    return { specialty, score, reasons };
  });

  ranked.sort((a, b) => b.score - a.score);
  const best = ranked[0]?.score ?? 0;
  if (best <= 0) {
    const fallback =
      ranked.find((item) => item.specialty.slug === "diagnostics") ?? ranked[0];
    if (!fallback) return [];
    return [{ ...fallback, score: 0, reasons: ["fallback"] }];
  }

  const picked = ranked.filter(
    (item) => item.score > 0 && item.score >= Math.max(2, best * 0.55),
  );
  return picked.slice(0, 3);
}

export function pickSpecialty<T extends SpecialtyLike>(
  text: string,
  specialties: T[],
  fallbackSlug = "diagnostics",
): { specialty: T; score: number } {
  const ranked = rankSpecialties({ text }, specialties);
  const first = ranked[0];
  if (!first) {
    const fallback =
      specialties.find((item) => item.slug === fallbackSlug) ?? specialties[0];
    return { specialty: fallback, score: 0 };
  }
  return { specialty: first.specialty, score: first.score };
}
