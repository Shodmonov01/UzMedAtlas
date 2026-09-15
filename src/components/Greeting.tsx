"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

export function Greeting() {
  const t = useTranslations("home");
  const key = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  }, []);

  return <span>{t(key)}</span>;
}
