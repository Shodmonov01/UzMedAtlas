import fs from "node:fs/promises";
import { prisma } from "./db";

/* Server-side SEO for the single-page app.
 *
 * The client renders everything in the browser, so a crawler that does not run JavaScript (Yandex often, Telegram,
 * WhatsApp and Facebook previews always) would see an empty page. Before index.html goes out, the server fills in
 * for the requested address:
 *   - the title, description, canonical link, robots rule, Open Graph and Twitter card tags;
 *   - schema.org JSON-LD (Organization + WebSite on the home page, MedicalClinic + BreadcrumbList on clinic pages);
 *   - a plain HTML version of the page's main content inside #root, which React replaces when it mounts
 *     (visitors see the boot loader over it for that moment, crawlers read real text and links).
 * It also answers /robots.txt and /sitemap.xml from the database. */

const SITE_NAME = "MEDGUIDE UZ";
const ORG_NAME = "Association of Medical Organizations";
const PUBLISHED = { OR: [{ status: "published" }, { published: true }] };

export function siteOrigin() {
  const fromEnv = (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || "").replace(/\/$/, "");
  return /^https:\/\//.test(fromEnv) ? fromEnv : "https://uzmedguide.uz";
}

const HOME_TITLE = "Medical Tourism in Uzbekistan — Vetted Clinics & Treatment | MEDGUIDE UZ";
const HOME_DESCRIPTION =
  "Medical tourism in Uzbekistan: vetted private clinics in Tashkent, Samarkand and Bukhara. Compare doctors, prices and equipment, get a treatment plan within 24 hours and plan your medical trip.";
/* The search words people use for this in English, Russian and Uzbek. Search engines mostly ignore meta keywords,
   but Yandex still reads them, and the same words are written into the visible text of the home page. */
const KEYWORDS = [
  "medical tourism Uzbekistan", "treatment in Uzbekistan", "clinics in Tashkent", "private clinic Uzbekistan", "health tourism", "medical travel",
  "медицинский туризм Узбекистан", "медтуризм", "лечение в Узбекистане", "клиники Ташкента", "частные клиники Узбекистана",
  "tibbiy turizm", "medturizm", "O'zbekistonda davolanish", "Toshkent klinikalari", "xususiy klinikalar",
].join(", ");
const DEFAULT_IMAGE = "/og/og-default.jpg";

const CITY: Record<string, string> = {
  tashkent: "Tashkent",
  samarkand: "Samarkand",
  bukhara: "Bukhara",
  andijan: "Andijan",
  namangan: "Namangan",
  fergana: "Fergana",
  khiva: "Khiva",
  urgench: "Urgench",
  nukus: "Nukus",
  karshi: "Karshi",
  termez: "Termez",
  navoi: "Navoi",
  jizzakh: "Jizzakh",
  gulistan: "Gulistan",
};

function cityName(city: string) {
  return CITY[city] || city.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function pick(en?: string | null, ru?: string | null) {
  return (en && en.trim()) || (ru && ru.trim()) || "";
}

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** One clean line of at most `max` characters, cut at a word. */
function clip(text: string, max = 158) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
}

function absolute(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  return `${siteOrigin()}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Removes undefined, null, empty strings and empty arrays so the JSON-LD stays valid and small. */
function prune<T>(value: T): T {
  if (Array.isArray(value)) return value.map(prune).filter((v) => v !== undefined) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const p = prune(v);
      if (p === undefined || p === null || p === "" || (Array.isArray(p) && p.length === 0)) continue;
      out[k] = p;
    }
    return out as T;
  }
  return value;
}

function jsonLd(data: unknown) {
  // "<" escaped so text from the database can never close the script tag.
  return `<script type="application/ld+json">${JSON.stringify(prune(data)).replace(/</g, "\\u003c")}</script>`;
}

function socials(...links: (string | null | undefined)[]) {
  return links
    .filter((l): l is string => Boolean(l && l.trim()))
    .map((l) => (/^https?:\/\//.test(l) ? l : l.startsWith("@") ? `https://t.me/${l.slice(1)}` : `https://${l}`));
}

type Schedule = Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", { open: string; close: string; roundTheClock?: boolean } | null>>;
const DAY_NAMES = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" } as const;

function openingHours(scheduleJson?: string | null) {
  let schedule: Schedule;
  try {
    schedule = JSON.parse(scheduleJson || "{}");
  } catch {
    return undefined;
  }
  const specs = (Object.keys(DAY_NAMES) as (keyof typeof DAY_NAMES)[])
    .map((key) => {
      const day = schedule[key];
      if (!day) return null;
      const opens = day.roundTheClock ? "00:00" : day.open;
      const closes = day.roundTheClock ? "23:59" : day.close;
      if (!/^\d{1,2}:\d{2}$/.test(opens || "") || !/^\d{1,2}:\d{2}$/.test(closes || "")) return null;
      return { "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${DAY_NAMES[key]}`, opens, closes };
    })
    .filter(Boolean);
  return specs.length ? specs : undefined;
}

type Page = {
  status: number;
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  index?: boolean;
  jsonLd?: unknown[];
  body?: string;
};

const organization = () => ({
  "@type": "Organization",
  "@id": `${siteOrigin()}/#organization`,
  name: SITE_NAME,
  alternateName: ORG_NAME,
  url: `${siteOrigin()}/`,
  logo: `${siteOrigin()}/og/logo-512.png`,
  areaServed: { "@type": "Country", name: "Uzbekistan" },
});

function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: `${siteOrigin()}${item.path}` })),
  };
}

async function homePage(): Promise<Page> {
  const clinics = await prisma.clinic.findMany({
    where: PUBLISHED,
    orderBy: { nameEn: "asc" },
    select: {
      slug: true,
      nameEn: true,
      nameRu: true,
      city: true,
      descriptionEn: true,
      descriptionRu: true,
      specialties: { select: { specialty: { select: { nameEn: true } } } },
    },
  });
  const list = clinics
    .map((c) => {
      const name = pick(c.nameEn, c.nameRu);
      const specs = c.specialties.slice(0, 6).map((s) => s.specialty.nameEn).join(", ");
      return `<li><a href="/clinics/${esc(c.slug)}">${esc(name)}</a> — ${esc(cityName(c.city))}${specs ? `. ${esc(specs)}` : ""}. ${esc(clip(pick(c.descriptionEn, c.descriptionRu), 220))}</li>`;
    })
    .join("");
  return {
    status: 200,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: "/",
    jsonLd: [
      { "@context": "https://schema.org", ...organization() },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${siteOrigin()}/#website`,
        name: SITE_NAME,
        url: `${siteOrigin()}/`,
        inLanguage: "en",
        publisher: { "@id": `${siteOrigin()}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${siteOrigin()}/?q={search_term_string}#catalog` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Private clinics in Uzbekistan",
        numberOfItems: clinics.length,
        itemListElement: clinics.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${siteOrigin()}/clinics/${c.slug}`, name: pick(c.nameEn, c.nameRu) })),
      },
    ],
    body: `<header><h1>Medicine you can trust: vetted private clinics in Uzbekistan</h1>
<p>${esc(HOME_DESCRIPTION)}</p></header>
<section><h2>Medical tourism in Uzbekistan</h2>
<p>Uzbekistan is becoming a country people travel to for treatment: vetted clinics, honest prices from 30% below clinics abroad, a reply with a preliminary treatment plan within 24 hours, and coordinators who speak your language.</p></section>
<section id="catalog"><h2>Clinic catalog (${clinics.length})</h2><ul>${list}</ul></section>
<nav><a href="/">Home</a> · <a href="/checker">Health checker</a> · <a href="/#contacts">Contacts</a></nav>`,
  };
}

const clinicSeoInclude = {
  photos: { orderBy: { sortOrder: "asc" as const }, take: 8 },
  specialties: { select: { specialty: { select: { nameEn: true, nameRu: true } } } },
  branches: { orderBy: { sortOrder: "asc" as const }, select: { slug: true, nameEn: true, nameRu: true, city: true, addressEn: true, addressRu: true, phone: true } },
};

async function clinicPage(slug: string): Promise<Page | null> {
  const c = await prisma.clinic.findFirst({ where: { slug, ...PUBLISHED }, include: clinicSeoInclude });
  if (!c) return null;
  const name = pick(c.nameEn, c.nameRu);
  const city = cityName(c.city);
  const description = pick(c.descriptionEn, c.descriptionRu);
  const specs = c.specialties.map((s) => pick(s.specialty.nameEn, s.specialty.nameRu)).filter(Boolean);
  const path = `/clinics/${c.slug}`;
  const cover = c.photos[0]?.url || c.logoUrl || DEFAULT_IMAGE;
  const metaDescription = clip(
    `${name}, ${city}: ${specs.slice(0, 5).join(", ")}${specs.length ? ". " : ""}${description}`,
  );
  const branchList = c.branches
    .map((b) => `<li><a href="${path}/branches/${esc(b.slug)}">${esc(pick(b.nameEn, b.nameRu))}</a> — ${esc(pick(b.addressEn, b.addressRu))}${b.phone ? `, ${esc(b.phone)}` : ""}</li>`)
    .join("");
  return {
    status: 200,
    title: `${name}, ${city} — Treatment & Medical Tourism | ${SITE_NAME}`,
    description: metaDescription,
    path,
    image: cover,
    imageAlt: name,
    type: "profile",
    jsonLd: [
      prune({
        "@context": "https://schema.org",
        "@type": "MedicalClinic",
        "@id": `${siteOrigin()}${path}#clinic`,
        name,
        alternateName: c.shortName || undefined,
        description: clip(description, 500),
        url: `${siteOrigin()}${path}`,
        logo: absolute(c.logoUrl),
        image: c.photos.map((p) => absolute(p.url)),
        telephone: c.phone || undefined,
        email: c.email || undefined,
        foundingDate: c.foundedYear ? String(c.foundedYear) : undefined,
        isAcceptingNewPatients: true,
        address: { "@type": "PostalAddress", streetAddress: pick(c.addressEn, c.addressRu), addressLocality: city, addressCountry: "UZ" },
        geo: c.lat != null && c.lng != null ? { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng } : undefined,
        knowsAbout: specs,
        sameAs: socials(c.website, c.instagram, c.telegram, c.youtube),
        department: c.branches.map((b) => ({ "@type": "MedicalClinic", name: pick(b.nameEn, b.nameRu), url: `${siteOrigin()}${path}/branches/${b.slug}` })),
        memberOf: { "@id": `${siteOrigin()}/#organization` },
      }),
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "Clinics", path: "/#catalog" },
        { name, path },
      ]),
    ],
    body: `<nav><a href="/">Home</a> › <a href="/#catalog">Clinic catalog</a> › ${esc(name)}</nav>
<article><h1>${esc(name)}</h1>
<p>${esc(city)}, Uzbekistan${c.foundedYear ? ` · since ${c.foundedYear}` : ""}${c.medicalTourism ? " · welcomes international patients" : ""}</p>
<p>${esc(description)}</p>
${specs.length ? `<h2>Specialties</h2><ul>${specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
${branchList ? `<h2>Branches</h2><ul>${branchList}</ul>` : ""}
<h2>Contacts</h2><p>${esc(pick(c.addressEn, c.addressRu))}${c.phone ? ` · ${esc(c.phone)}` : ""}${c.email ? ` · ${esc(c.email)}` : ""}</p></article>`,
  };
}

async function branchPage(slug: string, branchSlug: string): Promise<Page | null> {
  const b = await prisma.branch.findFirst({
    where: { slug: branchSlug, clinic: { slug, ...PUBLISHED } },
    include: {
      clinic: { select: { slug: true, nameEn: true, nameRu: true, logoUrl: true } },
      photos: { orderBy: { sortOrder: "asc" }, take: 8 },
      specialties: { select: { specialty: { select: { nameEn: true, nameRu: true } } } },
    },
  });
  if (!b) return null;
  const clinicName = pick(b.clinic.nameEn, b.clinic.nameRu);
  const name = pick(b.nameEn, b.nameRu);
  const fullName = name.toLowerCase().includes(clinicName.toLowerCase()) ? name : `${clinicName} — ${name}`;
  const city = cityName(b.city);
  const address = pick(b.addressEn, b.addressRu);
  const specs = b.specialties.map((s) => pick(s.specialty.nameEn, s.specialty.nameRu)).filter(Boolean);
  const description = pick(b.descriptionEn, b.descriptionRu);
  const path = `/clinics/${b.clinic.slug}/branches/${b.slug}`;
  return {
    status: 200,
    title: `${fullName}, ${city} — Address, Doctors & Prices | ${SITE_NAME}`,
    description: clip(`${fullName} in ${city}: ${address}. ${specs.slice(0, 5).join(", ")}${specs.length ? ". " : ""}${description}`),
    path,
    image: b.coverUrl || b.photos[0]?.url || b.clinic.logoUrl || DEFAULT_IMAGE,
    imageAlt: fullName,
    type: "profile",
    jsonLd: [
      prune({
        "@context": "https://schema.org",
        "@type": "MedicalClinic",
        "@id": `${siteOrigin()}${path}#clinic`,
        name: fullName,
        description: clip(description, 500) || undefined,
        url: `${siteOrigin()}${path}`,
        image: [b.coverUrl, ...b.photos.map((p) => p.url)].filter(Boolean).map((u) => absolute(u)),
        logo: absolute(b.clinic.logoUrl),
        telephone: b.phone || undefined,
        email: b.email || undefined,
        address: { "@type": "PostalAddress", streetAddress: address, addressLocality: city, addressRegion: b.region || undefined, addressCountry: "UZ" },
        geo: b.lat != null && b.lng != null ? { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng } : undefined,
        openingHoursSpecification: openingHours(b.scheduleJson),
        knowsAbout: specs,
        sameAs: socials(b.website, b.instagram, b.telegram),
        parentOrganization: { "@id": `${siteOrigin()}/clinics/${b.clinic.slug}#clinic`, name: clinicName },
      }),
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: clinicName, path: `/clinics/${b.clinic.slug}` },
        { name, path },
      ]),
    ],
    body: `<nav><a href="/">Home</a> › <a href="/clinics/${esc(b.clinic.slug)}">${esc(clinicName)}</a> › ${esc(name)}</nav>
<article><h1>${esc(fullName)}</h1>
<p>${esc(address)}, ${esc(city)}${b.phone ? ` · ${esc(b.phone)}` : ""}</p>
${description ? `<p>${esc(description)}</p>` : ""}
${specs.length ? `<h2>Specialties</h2><ul>${specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}</article>`,
  };
}

function simplePage(path: string, title: string, description: string, index = true, status = 200): Page {
  return { status, title, description, path, index };
}

/** What the server knows about the page at this address; never throws (a database error falls back to defaults). */
async function resolvePage(urlPath: string): Promise<Page> {
  const path = urlPath.replace(/\/+$/, "") || "/";
  try {
    if (path === "/") return await homePage();
    const branch = /^\/clinics\/([^/]+)\/branches\/([^/]+)$/.exec(path);
    if (branch) {
      return (await branchPage(decodeURIComponent(branch[1]!), decodeURIComponent(branch[2]!))) ??
        simplePage(path, `Page not found | ${SITE_NAME}`, HOME_DESCRIPTION, false, 404);
    }
    const clinic = /^\/clinics\/([^/]+)$/.exec(path);
    if (clinic) {
      return (await clinicPage(decodeURIComponent(clinic[1]!))) ??
        simplePage(path, `Clinic not found | ${SITE_NAME}`, HOME_DESCRIPTION, false, 404);
    }
  } catch {
    return simplePage(path, HOME_TITLE, HOME_DESCRIPTION, path === "/");
  }
  if (path === "/clinics") return simplePage("/", HOME_TITLE, HOME_DESCRIPTION);
  if (path === "/checker") {
    return simplePage(
      path,
      `Health Checker — Which Doctor Do I Need? | ${SITE_NAME}`,
      "Describe your symptoms and get a suggestion of which specialist to see, with matching vetted clinics in Uzbekistan. Not a diagnosis: a first step to the right doctor.",
    );
  }
  if (path === "/checker/results") return simplePage(path, `Health Checker results | ${SITE_NAME}`, HOME_DESCRIPTION, false);
  if (path.startsWith("/cabinet")) return simplePage(path, `Clinic cabinet | ${SITE_NAME}`, HOME_DESCRIPTION, false);
  if (path.startsWith("/moderation")) return simplePage(path, `Модерация | ${SITE_NAME}`, HOME_DESCRIPTION, false);
  return simplePage(path, `Page not found | ${SITE_NAME}`, HOME_DESCRIPTION, false, 404);
}

function headTags(page: Page) {
  const origin = siteOrigin();
  const url = `${origin}${page.path}`;
  const image = absolute(page.image || DEFAULT_IMAGE)!;
  const index = page.index !== false && page.status === 200;
  const tags = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    page.path === "/" ? `<meta name="keywords" content="${esc(KEYWORDS)}" />` : "",
    `<meta name="robots" content="${index ? "index, follow, max-image-preview:large, max-snippet:-1" : "noindex, nofollow"}" />`,
    index ? `<link rel="canonical" href="${esc(url)}" />` : "",
    `<meta property="og:type" content="${page.type || "website"}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:alt" content="${esc(page.imageAlt || SITE_NAME)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    process.env.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${esc(process.env.GOOGLE_SITE_VERIFICATION)}" />` : "",
    process.env.YANDEX_VERIFICATION ? `<meta name="yandex-verification" content="${esc(process.env.YANDEX_VERIFICATION)}" />` : "",
    ...(index ? (page.jsonLd || []).map(jsonLd) : []),
  ];
  return tags.filter(Boolean).join("\n    ");
}

/** The built index.html with the page's SEO filled in between the markers that client/index.html carries. */
export async function renderPage(template: string, urlPath: string) {
  const page = await resolvePage(urlPath);
  let html = template.replace(/<!--seo:head-->[\s\S]*?<!--\/seo:head-->/, headTags(page));
  if (page.body) html = html.replace("<!--seo:body-->", `<div class="seo-content">${page.body}</div>`);
  return { status: page.status, html };
}

let templateCache: { file: string; text: string } | null = null;
export async function loadTemplate(file: string) {
  if (templateCache?.file === file) return templateCache.text;
  const text = await fs.readFile(file, "utf8");
  templateCache = { file, text };
  return text;
}

export function robotsTxt() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /cabinet",
    "Disallow: /moderation",
    "Disallow: /api/",
    "Disallow: /checker/results",
    "Disallow: /*?*sort=",
    "",
    `Sitemap: ${siteOrigin()}/sitemap.xml`,
    `Host: ${siteOrigin().replace(/^https:\/\//, "")}`,
    "",
  ].join("\n");
}

function xmlEsc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** Every public page with its last change and its photos (Google image sitemap extension). */
export async function sitemapXml() {
  const origin = siteOrigin();
  const clinics = await prisma.clinic.findMany({
    where: PUBLISHED,
    orderBy: { updatedAt: "desc" },
    select: {
      slug: true,
      nameEn: true,
      nameRu: true,
      updatedAt: true,
      logoUrl: true,
      photos: { orderBy: { sortOrder: "asc" }, take: 10, select: { url: true } },
      branches: { orderBy: { sortOrder: "asc" }, select: { slug: true, updatedAt: true, coverUrl: true, photos: { take: 5, select: { url: true } } } },
    },
  });
  const latest = clinics[0]?.updatedAt ?? new Date();
  const entry = (path: string, lastmod: Date, priority: string, freq: string, images: (string | null | undefined)[] = []) =>
    `  <url>\n    <loc>${xmlEsc(origin + path)}</loc>\n    <lastmod>${lastmod.toISOString()}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n${images
      .filter((u): u is string => Boolean(u))
      .map((u) => `    <image:image><image:loc>${xmlEsc(absolute(u)!)}</image:loc></image:image>\n`)
      .join("")}  </url>`;
  const urls = [
    entry("/", latest, "1.0", "daily", ["/images/hero/hero-desktop.webp"]),
    entry("/checker", latest, "0.6", "monthly"),
    ...clinics.flatMap((c) => [
      entry(`/clinics/${c.slug}`, c.updatedAt, "0.9", "weekly", [c.logoUrl, ...c.photos.map((p) => p.url)]),
      ...c.branches.map((b) =>
        entry(`/clinics/${c.slug}/branches/${b.slug}`, b.updatedAt > c.updatedAt ? b.updatedAt : c.updatedAt, "0.7", "weekly", [b.coverUrl, ...b.photos.map((p) => p.url)]),
      ),
    ]),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>\n`;
}
