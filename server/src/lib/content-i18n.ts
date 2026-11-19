import fs from "node:fs";
import { fileURLToPath } from "node:url";

/** Uzbek and English for a Russian clinic text, from src/i18n/content-translations.json (made by
 *  scripts/translate-content.mjs and reviewed by hand). */
type Entry = { uz?: string; en?: string };

let table: Map<string, Entry> | null = null;

/** The translations, read once. The file sits in src/i18n both when the server runs from src (tsx) and from dist. */
function translations(): Map<string, Entry> {
  if (table) return table;
  const candidates = [
    new URL("../i18n/content-translations.json", import.meta.url),
    new URL("../../src/i18n/content-translations.json", import.meta.url),
  ];
  for (const url of candidates) {
    try {
      const data = JSON.parse(fs.readFileSync(fileURLToPath(url), "utf8")) as { entries?: Record<string, Entry> };
      table = new Map(Object.entries(data.entries ?? {}));
      return table;
    } catch {
      // Not at this path; try the next one.
    }
  }
  table = new Map();
  return table;
}

/** For tests: use these translations instead of the file. */
export function setContentTranslations(entries: Record<string, Entry> | null) {
  table = entries ? new Map(Object.entries(entries)) : null;
}

function addTranslations(value: unknown, entries: Map<string, Entry>) {
  if (Array.isArray(value)) {
    for (const item of value) addTranslations(item, entries);
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const item = record[key];
    if (key.endsWith("Ru") && typeof item === "string") {
      const entry = entries.get(item.trim());
      if (!entry) continue;
      const base = key.slice(0, -2);
      const filled = (name: string) => typeof record[name] === "string" && (record[name] as string).trim() !== "";
      if (entry.uz && !filled(`${base}Uz`)) record[`${base}Uz`] = entry.uz;
      // An English text the clinic or a moderator wrote is kept; the translation only fills a missing one.
      if (entry.en && !filled(`${base}En`)) record[`${base}En`] = entry.en;
    } else if (item && typeof item === "object") {
      addTranslations(item, entries);
    }
  }
}

/** Adds the Uzbek (fooUz) and any missing English (fooEn) next to every Russian text (fooRu) in an API answer, at any
 *  depth. A Russian text that changed since it was translated has no entry, so the site shows the Russian original
 *  instead of an outdated translation. */
export function withContentTranslations<T>(payload: T): T {
  const entries = translations();
  if (entries.size) addTranslations(payload, entries);
  return payload;
}
