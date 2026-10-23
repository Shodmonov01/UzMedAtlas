import { describe, expect, it } from "vitest";
import { rankSpecialties } from "./checker";

const specialties = [
  { slug: "dentistry", keywords: "tooth, teeth, dental, зуб, стомат, десна" },
  { slug: "orthopedics", keywords: "knee, joint, колено, сустав" },
  { slug: "diagnostics", keywords: "mri, checkup, обследован" },
];

describe("rankSpecialties", () => {
  it("picks a specialty from a single short whole-word keyword", () => {
    const ranked = rankSpecialties({ text: "болит зуб уже неделю" }, specialties);
    expect(ranked.map((item) => item.specialty.slug)).toEqual(["dentistry"]);
  });

  it("never returns an empty list when a keyword matched only weakly", () => {
    const ranked = rankSpecialties({ text: "зубы" }, specialties);
    expect(ranked[0]?.specialty.slug).toBe("dentistry");
  });

  it("falls back to diagnostics when nothing matches", () => {
    const ranked = rankSpecialties({ text: "чувствую себя странно" }, specialties);
    expect(ranked[0]?.specialty.slug).toBe("diagnostics");
  });
});
