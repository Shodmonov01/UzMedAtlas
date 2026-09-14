"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const KEY = "uma_recent_clinics";

type Item = { slug: string; name: string };

export function recordRecentClinic(slug: string, name: string) {
  try {
    const current = JSON.parse(localStorage.getItem(KEY) || "[]") as Item[];
    const next = [{ slug, name }, ...current.filter((item) => item.slug !== slug)].slice(0, 4);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function RecentlyViewed({ currentSlug }: { currentSlug?: string }) {
  const t = useTranslations("clinic");
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem(KEY) || "[]") as Item[];
      setItems(current.filter((item) => item.slug !== currentSlug).slice(0, 3));
    } catch {
      setItems([]);
    }
  }, [currentSlug]);

  if (!items.length) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">{t("recent")}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={`/clinics/${item.slug}`} className="chip">
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RecordClinicView({ slug, name }: { slug: string; name: string }) {
  useEffect(() => {
    recordRecentClinic(slug, name);
  }, [slug, name]);
  return null;
}
