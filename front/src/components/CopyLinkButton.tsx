import { useState } from "react";
import { useTranslation } from "react-i18next";

export function CopyLinkButton() {
  const { t } = useTranslation();
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
    <button type="button" className="text-sm font-bold text-current" onClick={copy}>
      {copied ? t("clinic.copied") : t("clinic.copyLink")}
    </button>
  );
}
