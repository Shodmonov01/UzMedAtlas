import { initials, tone } from "@/lib/avatar";
import { cn } from "@/lib/format";

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return (
    <span className={cn("avatar", dim)} style={{ background: tone(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
