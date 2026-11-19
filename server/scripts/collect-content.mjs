// Collects every Russian clinic text the public site shows (clinics, their branches, specialties) from the live API,
// so it can be translated into Uzbek and English (scripts/translate-content.mjs). Usage:
//   node scripts/collect-content.mjs [https://uzmedguide.uz] > content-ru.json
// Prints {"texts": [...], "needsEn": [...]}: each distinct Russian text once, and those that somewhere have no English
// beside them (the API keeps an English text a clinic wrote, so only these need an English translation). A text is the value of any field whose name ends in
// "Ru" — the same rule src/lib/content-i18n.ts uses when it adds the translations to the API's answers.

const origin = (process.argv[2] || "https://uzmedguide.uz").replace(/\/$/, "");

/** Every non-empty string under a key ending in "Ru", anywhere in the value; those without an English sibling also go
 *  to `noEnglish`. */
function collectRussianTexts(value, out, noEnglish) {
  if (Array.isArray(value)) {
    for (const item of value) collectRussianTexts(item, out, noEnglish);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key.endsWith("Ru") && typeof item === "string") {
        const text = item.trim();
        if (!text) continue;
        out.add(text);
        const english = value[`${key.slice(0, -2)}En`];
        if (typeof english !== "string" || !english.trim()) noEnglish.add(text);
      } else if (item && typeof item === "object") {
        collectRussianTexts(item, out, noEnglish);
      }
    }
  }
}

async function get(path) {
  const res = await fetch(origin + path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

const texts = new Set();
const needsEn = new Set();
const add = (value) => collectRussianTexts(value, texts, needsEn);

add(await get("/api/specialties"));
const list = await get("/api/clinics");
add(list);
for (const clinic of list.items) {
  add(await get(`/api/clinics/${clinic.slug}`));
  const branches = await get(`/api/clinics/${clinic.slug}/branches`);
  add(branches);
  for (const branch of branches.items || []) add(await get(`/api/clinics/${clinic.slug}/branches/${branch.slug}`));
}

process.stdout.write(JSON.stringify({ origin, collectedAt: new Date().toISOString(), texts: [...texts], needsEn: [...needsEn] }, null, 1));
