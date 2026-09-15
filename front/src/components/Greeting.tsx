import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function Greeting() {
  const { t } = useTranslation();
  const key = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "home.morning";
    if (hour < 18) return "home.afternoon";
    return "home.evening";
  }, []);

  return <span>{t(key)}</span>;
}
