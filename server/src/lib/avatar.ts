export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

const TONES = ["#1570ef", "#175cd3", "#1849a9", "#2e90fa", "#53b1fd", "#194185"];

export function tone(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0) * 17) % TONES.length;
  return TONES[hash] ?? TONES[0];
}
