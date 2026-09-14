import { describe, expect, it } from "vitest";
import { combinePhone, whatsappLink } from "@/lib/phone";
import { isRecentDuplicate } from "@/lib/leads";
import { parseUtmSearch, deserializeUtm } from "@/lib/utm";
import { checkRateLimit } from "@/lib/rate-limit";
import { csvEscape, toCsv } from "@/lib/csv";

describe("phone", () => {
  it("combines dial code and national number", () => {
    expect(combinePhone("+7", "700 000 00 00")).toBe("+77000000000");
    expect(whatsappLink("+998 90 111 22 33")).toBe("https://wa.me/998901112233");
  });
});

describe("duplicate leads", () => {
  it("treats a request from the same hour as a duplicate", () => {
    const now = new Date("2026-09-14T12:00:00Z");
    expect(isRecentDuplicate(new Date("2026-09-14T11:00:00Z"), now)).toBe(true);
    expect(isRecentDuplicate(new Date("2026-09-13T11:00:00Z"), now)).toBe(false);
  });
});

describe("utm", () => {
  it("reads campaign parameters from the landing URL", () => {
    const utm = parseUtmSearch(new URLSearchParams("utm_source=telegram&utm_campaign=heart"));
    expect(utm).toEqual({ source: "telegram", medium: undefined, campaign: "heart" });
    expect(deserializeUtm(JSON.stringify(utm))?.source).toBe("telegram");
    expect(parseUtmSearch(new URLSearchParams("q=mri"))).toBeNull();
  });
});

describe("rate limit", () => {
  it("blocks a key after the limit", () => {
    const key = `test-${Math.random()}`;
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(false);
  });
});

describe("csv", () => {
  it("escapes quotes", () => {
    expect(csvEscape('Anna "Patient"')).toBe('"Anna ""Patient"""');
    expect(toCsv(["a"], [["x"]])).toBe('"a"\n"x"');
  });
});
