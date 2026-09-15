export const CANONICAL_SERVICES = [
  {
    slug: "mri",
    nameEn: "MRI",
    nameRu: "МРТ",
    aliases: ["mri", "мрт", "magnetic resonance"],
  },
  {
    slug: "ct",
    nameEn: "CT",
    nameRu: "КТ",
    aliases: ["ct", "кт", "computed tomography", "компьютерная томография"],
  },
  {
    slug: "ultrasound",
    nameEn: "Ultrasound",
    nameRu: "УЗИ",
    aliases: ["ultrasound", "uzi", "узи", "echo"],
  },
  {
    slug: "checkup",
    nameEn: "Check-up",
    nameRu: "Check-up",
    aliases: ["checkup", "check-up", "check up", "чекап", "screening"],
  },
  {
    slug: "consultation",
    nameEn: "Consultation",
    nameRu: "Консультация",
    aliases: ["consultation", "consult", "консультация", "прием", "приём"],
  },
  {
    slug: "surgery",
    nameEn: "Surgery",
    nameRu: "Операция",
    aliases: ["surgery", "operation", "операция", "хирур"],
  },
  {
    slug: "endoscopy",
    nameEn: "Endoscopy",
    nameRu: "Эндоскопия",
    aliases: ["endoscopy", "gastroscopy", "эндоскопия", "гастроскопия"],
  },
] as const;

export function inferCanonicalSlug(nameEn: string, nameRu: string) {
  const haystack = `${nameEn} ${nameRu}`.toLowerCase();
  for (const item of CANONICAL_SERVICES) {
    if (item.aliases.some((alias) => haystack.includes(alias))) return item.slug;
  }
  return null;
}
