import { Link } from "react-router-dom";
import { cn } from "@/lib/format";
import { useLocale, useLocalePath, withLocale } from "../locale-link";

export function LanguageSwitch() {
  const locale = useLocale();
  const pathname = useLocalePath();

  return (
    <div className="flex rounded-full bg-mint p-1 text-xs font-extrabold">
      {(["en", "ru"] as const).map((code) => (
        <Link
          key={code}
          to={withLocale(code, pathname)}
          className={cn(
            "min-h-11 min-w-11 rounded-full px-3 py-2 grid place-items-center",
            locale === code ? "bg-white text-ink shadow-sm" : "text-muted",
          )}
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
