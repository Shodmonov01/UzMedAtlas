import { useEffect } from "react";

/* Titles and descriptions for navigation inside the app. The first load already gets them from the server
   (server/src/lib/seo.ts); these keep the tab title, description and canonical link right after client-side moves. */

export const SITE_NAME = "MEDGUIDE UZ";
export const HOME_TITLE = "Medical Tourism in Uzbekistan — Vetted Clinics & Treatment | MEDGUIDE UZ";
export const HOME_DESCRIPTION =
  "Medical tourism in Uzbekistan: vetted private clinics in Tashkent, Samarkand and Bukhara. Compare doctors, prices and equipment, get a treatment plan within 24 hours and plan your medical trip.";

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function clip(text: string, max = 158) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

/** Sets the page's title, description, canonical link and social tags while the page is shown.
 *  Pass `null` while data is loading to leave the current tags alone. */
export function useSeo(seo: { title: string; description?: string; noindex?: boolean } | null) {
  const title = seo?.title;
  const description = seo?.description;
  const noindex = seo?.noindex;
  useEffect(() => {
    if (!title) return;
    document.title = title;
    const desc = clip(description || HOME_DESCRIPTION);
    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", desc);
    setMeta('meta[name="robots"]', "name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1");
    const url = `${window.location.origin}${window.location.pathname.replace(/\/+$/, "") || "/"}`;
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!noindex) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    } else canonical?.remove();
  }, [title, description, noindex]);
}
