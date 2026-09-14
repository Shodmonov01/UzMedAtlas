"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function CopyLinkButton() {
  const t = useTranslations("clinic");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="text-sm font-semibold text-teal" onClick={copy}>
      {copied ? t("copied") : t("copyLink")}
    </button>
  );
}
