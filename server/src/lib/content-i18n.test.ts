import { afterEach, describe, expect, it } from "vitest";
import { setContentTranslations, withContentTranslations } from "./content-i18n";

describe("withContentTranslations", () => {
  afterEach(() => setContentTranslations(null));

  it("adds Uzbek and fills a missing English next to each Russian text, at any depth", () => {
    setContentTranslations({
      "Врач-уролог": { uz: "Urolog shifokor", en: "Urologist" },
      "Кардиология": { uz: "Kardiologiya", en: "Cardiology (machine)" },
    });
    const payload = {
      descriptionRu: "Врач-уролог",
      descriptionEn: "",
      specialties: [{ nameRu: "Кардиология", nameEn: "Cardiology" }],
      doctors: [{ roleRu: " Врач-уролог ", roleEn: "Urologist" }],
    };
    const result = withContentTranslations(payload) as Record<string, unknown> & typeof payload;
    expect(result.descriptionUz).toBe("Urolog shifokor");
    expect(result.descriptionEn).toBe("Urologist");
    // An English text that is already there is kept.
    expect(result.specialties[0]).toMatchObject({ nameEn: "Cardiology", nameUz: "Kardiologiya" });
    expect(result.doctors[0]).toMatchObject({ roleUz: "Urolog shifokor" });
  });

  it("adds Uzbek and English beside people's names and makers kept in one field", () => {
    setContentTranslations({
      "Пулатов Зафар Уткурович": { uz: "Pulatov Zafar Utkurovich", en: "Pulatov Zafar Utkurovich" },
      "Pentax (Япония)": { uz: "Pentax (Yaponiya)", en: "Pentax (Japan)" },
    });
    const result = withContentTranslations({
      founderName: "Пулатов Зафар Уткурович",
      leaders: [{ name: "Пулатов Зафар Уткурович", roleRu: "Директор" }],
      equipment: [{ manufacturer: "Pentax (Япония)" }, { manufacturer: "Siemens" }],
    }) as Record<string, unknown> & { leaders: Record<string, unknown>[]; equipment: Record<string, unknown>[] };
    expect(result.founderNameUz).toBe("Pulatov Zafar Utkurovich");
    expect(result.leaders[0].nameEn).toBe("Pulatov Zafar Utkurovich");
    expect(result.equipment[0]).toMatchObject({ manufacturerUz: "Pentax (Yaponiya)", manufacturerEn: "Pentax (Japan)" });
    expect(result.equipment[1].manufacturerUz).toBeUndefined();
  });

  it("leaves a Russian text it has no translation for (or one that changed) alone", () => {
    setContentTranslations({ "Старый текст": { uz: "Eski matn", en: "Old text" } });
    const result = withContentTranslations({ descriptionRu: "Новый текст", descriptionEn: "" }) as Record<string, unknown>;
    expect(result.descriptionUz).toBeUndefined();
    expect(result.descriptionEn).toBe("");
  });
});
