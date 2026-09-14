import { describe, expect, it } from "vitest";
import { pickSpecialty, scoreSpecialty } from "@/lib/checker";

const specialties = [
  {
    slug: "orthopedics",
    keywords: "knee, joint, walking, orthoped, колено, ходьб",
  },
  {
    slug: "neurology",
    keywords: "headache, dizziness, голова, головокруж, neurolog",
  },
  {
    slug: "cardiology",
    keywords: "heart, chest, cardiolog, сердце, давлен",
  },
  {
    slug: "diagnostics",
    keywords: "mri, checkup, мрт, диагностик",
  },
];

describe("symptom checker", () => {
  it("maps knee pain while walking to orthopedics", () => {
    const result = pickSpecialty(
      "My knee has been hurting when I walk for several weeks.",
      specialties,
    );
    expect(result.specialty.slug).toBe("orthopedics");
    expect(result.score).toBeGreaterThan(0);
  });

  it("maps Russian headache and dizziness to neurology", () => {
    const result = pickSpecialty(
      "У меня часто болит голова и появляется головокружение.",
      specialties,
    );
    expect(result.specialty.slug).toBe("neurology");
  });

  it("maps heart check-up to cardiology", () => {
    const result = pickSpecialty("I want a heart check-up", specialties);
    expect(result.specialty.slug).toBe("cardiology");
  });

  it("falls back to diagnostics when nothing matches", () => {
    const result = pickSpecialty("I feel generally unwell", specialties);
    expect(result.specialty.slug).toBe("diagnostics");
    expect(result.score).toBe(0);
  });

  it("gives zero when keywords are absent", () => {
    expect(scoreSpecialty("I feel generally unwell", "knee, heart")).toBe(0);
    expect(scoreSpecialty("knee pain while walking", "knee, walking")).toBeGreaterThan(0);
  });
});
