// Translates clinic texts (collected by scripts/collect-content.mjs) from Russian into Uzbek (Latin) and English with
// Groq, adding only the texts the translation file does not have yet. Usage (from server/):
//   node --env-file=.env scripts/translate-content.mjs content-ru.json
// It writes src/i18n/content-translations.json, which the API reads (src/lib/content-i18n.ts). Machine output is
// reviewed before it is committed; edits made by hand in that file are kept, since known texts are never sent again.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/i18n/content-translations.json");
const KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.GROQ_TRANSLATE_MODEL || "openai/gpt-oss-120b";
if (!KEY) throw new Error("GROQ_API_KEY is not set");

const source = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const file = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { entries: {} };
const entries = file.entries;
// Every text needs Uzbek; English only where the site has none beside the Russian (source.needsEn).
const needsEn = new Set(source.needsEn ?? source.texts);
const wantsEn = (text) => needsEn.has(text) && !entries[text]?.en;
const todo = source.texts.filter((text) => !entries[text]?.uz || wantsEn(text));
console.error(`${source.texts.length} texts, ${todo.length} to translate with ${MODEL}`);

const SYSTEM = `You translate texts from private clinics' profiles on a medical-tourism website about Uzbekistan.
Translate every value of "texts" from Russian into Uzbek in the Latin script, and the values whose ids are listed in
"english" also into English. Return JSON {"uz": {id: text}, "en": {id: text}}: "uz" with every id you were given,
"en" with exactly the ids listed in "english" (empty object when none).

Rules for both languages:
- Keep every fact, number, date, price, unit and list item; add nothing, drop nothing, keep the order of list items.
- Keep line breaks and list markers ("•", "-", "1.") where the Russian has them.
- Clinic, brand, company, product and equipment names stay as they are when written in Latin letters
  (BIO NUR MED SERVIS, AKFA Medline, Siemens MAGNETOM). Names written in Cyrillic are transliterated into Latin.
- People's names: transliterate into Latin, keep the Russian word order (surname first if it is first).
- Write natural, fluent text a patient would read, not word-for-word.
- A value that is only a name, code or number is returned unchanged (transliterated if Cyrillic).

Uzbek: modern Latin orthography — oʻ and gʻ with the turned comma (ʻ, U+02BB), the tutuq belgisi as ʼ (U+02BC, e.g.
maʼlumot, sanʼat), sh, ch, ng; no Cyrillic letters. Use standard Uzbek medical terms:
врач → shifokor; врач-уролог → urolog shifokor; стационар → statsionar; койка → oʻrin ("на 380 коек" → "380 oʻrinli");
операционная → operatsiya xonasi; реанимация → reanimatsiya; МРТ → MRT; КТ → KT; МСКТ → MSKT; УЗИ → UTT
(ultratovush tekshiruvi); ЭКГ → EKG; ЭКО → EKU (ekstrakorporal urugʻlantirish); ЛОР → LOR; поликлиника → poliklinika;
негосударственный → nodavlat; номинация → nominatsiya; европейского уровня → Yevropa darajasidagi;
лечение → davolash; диагностика → diagnostika; приём → qabul; консультация → konsultatsiya; анализы → tahlillar;
изжога → jigʻildon qaynashi; желудок → oshqozon; онемение → uvishish; судороги → tirishish;
тазобедренный сустав → chanoq-son boʻgʻimi; направление (from a doctor) → yoʻllanma; интервенционная → intervension;
гигиена → gigiyena; роботизированная / роботическая хирургия → robotlashtirilgan jarrohlik; сооснователь → hammuassisi;
туристическая компания → sayyohlik kompaniyasi;
диетология → dietologiya; гнатология → gnatologiya; зона ожидания → kutish zonasi; вывеска → peshlavha;
ресепшен → resepshn; хирургия → jarrohlik ("-хирургия" compounds → "-jarrohlik": кардиохирургия → kardiojarrohlik, ангиохирургия → angiojarrohlik,
нейрохирургия → neyrojarrohlik); врач общей практики → umumiy amaliyot shifokori; медсестра → hamshira.
Addresses: ООО → MChJ; г. Ташкент → Toshkent sh.; область → viloyati; р-н / район → tumani; массив / мкр → mavzesi;
ориентир → moʻljal; ул. X → "X koʻchasi" (the name first, never "koʻchasi X"); пр-т / проспект → shoh koʻchasi;
use the official Uzbek names of places, not a transliteration of the Russian: Алмазарский → Olmazor, Бектемирский → Bektemir,
Мирабадский → Mirobod, Мирзо-Улугбекский → Mirzo Ulugʻbek, Сергелийский → Sergeli, Учтепинский → Uchtepa,
Чиланзарский → Chilonzor, Шайхантахурский → Shayxontohur, Юнусабадский → Yunusobod, Яккасарайский → Yakkasaroy,
Яшнабадский → Yashnobod, Янгихаётский → Yangihayot; Самарканд → Samarqand, Бухара → Buxoro, Фергана → Fargʻona,
Андижан → Andijon, Наманган → Namangan, Карши → Qarshi, Нукус → Nukus, Ургенч → Urganch, Джизак → Jizzax;
ул. Ислама Каримова → Islom Karimov koʻchasi; Фараби → Forobiy; Амира Темура → Amir Temur; Навои → Navoiy;
Мирабад → Mirobod; Янги Сергели → Yangi Sergeli; Кичик Халка йули → Kichik Halqa yoʻli; метро «Пахтакор» → «Paxtakor» metrosi.
Ассоциация медицинского туризма Узбекистана → Oʻzbekiston tibbiy turizm assotsiatsiyasi.

English: clear international English; Х → Kh in transliterated names (Kholnasimovich); МРТ → MRI, КТ → CT, УЗИ → ultrasound,
ЭКО → IVF, ЛОР → ENT; ООО → LLC; ул. → St.; р-н → district; область → Region.`;

/** Uzbek punctuation the models get wrong: the oʻ/gʻ comma and the tutuq belgisi in their proper characters, plain hyphens. */
function tidyUzbek(text) {
  return text
    .replace(/([oOgG])[‘’'`´ʼ]/g, "$1ʻ")
    .replace(/([A-Za-zʻ])[‘’'`´](?=[A-Za-z])/g, "$1ʼ")
    .replace(/[‐‑]/g, "-")
    .replace(/ /g, " ");
}
const tidyEnglish = (text) => text.replace(/[‐‑]/g, "-").replace(/ /g, " ");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateBatch(batch) {
  const texts = Object.fromEntries(batch.map((text, i) => [String(i + 1), text]));
  const english = batch.flatMap((text, i) => (wantsEn(text) ? [String(i + 1)] : []));
  const payload = { texts, english };
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        max_completion_tokens: 5000,
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify(payload) }],
      }),
    });
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get("retry-after")) || attempt * 10;
      console.error(`  ${res.status}, waiting ${wait}s`);
      await sleep(wait * 1000);
      continue;
    }
    // Too big for the per-minute token allowance: translate the two halves separately.
    if (res.status === 413 && batch.length > 1) {
      const half = Math.ceil(batch.length / 2);
      return [...(await translateBatch(batch.slice(0, half))), ...(await translateBatch(batch.slice(half)))];
    }
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    try {
      const out = JSON.parse(json.choices[0].message.content);
      const missing = [...Object.keys(texts).filter((id) => !out.uz?.[id]), ...english.filter((id) => !out.en?.[id])];
      if (missing.length) {
        // The model sometimes drops a text from a batch; asking for the halves separately gets it back.
        if (batch.length > 1 && attempt >= 2) {
          const half = Math.ceil(batch.length / 2);
          return [...(await translateBatch(batch.slice(0, half))), ...(await translateBatch(batch.slice(half)))];
        }
        throw new Error(`missing ids ${missing.join(",")}`);
      }
      return batch.map((_, i) => {
        const id = String(i + 1);
        const result = { uz: tidyUzbek(String(out.uz[id]).trim()) };
        if (english.includes(id)) result.en = tidyEnglish(String(out.en[id]).trim());
        return result;
      });
    } catch (error) {
      console.error(`  bad answer (${error.message}), retrying`);
      await sleep(2000);
    }
  }
  throw new Error("batch failed after retries");
}

function save() {
  const sorted = Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b, "ru")));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ note: "Russian clinic text → Uzbek (Latin) and English. Reviewed by hand; see scripts/translate-content.mjs.", entries: sorted }, null, 1) + "\n");
}

// Batches of about 1,600 characters (at most 20 texts) keep each request inside Groq's free per-minute token allowance.
const batches = [];
let current = [];
let size = 0;
for (const text of todo) {
  if (current.length && (size + text.length > 1600 || current.length >= 20)) {
    batches.push(current);
    current = [];
    size = 0;
  }
  current.push(text);
  size += text.length;
}
if (current.length) batches.push(current);

let done = 0;
for (const batch of batches) {
  const result = await translateBatch(batch);
  batch.forEach((text, i) => {
    entries[text] = { ...entries[text], ...result[i] };
  });
  done += batch.length;
  save();
  console.error(`  ${done}/${todo.length}`);
}
save();
console.error("done");
