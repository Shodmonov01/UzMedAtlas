export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

const TONES = ["#6fa56a", "#173832", "#2f6f6a", "#8fbf73", "#3d6b66", "#4e8f62"];

export function tone(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0) * 17) % TONES.length;
  return TONES[hash] ?? TONES[0];
}
