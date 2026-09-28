export const CITY_OPTIONS = [
  { value: "tashkent", label: "Ташкент" },
  { value: "samarkand", label: "Самарканд" },
  { value: "bukhara", label: "Бухара" },
  { value: "andijan", label: "Андижан" },
  { value: "fergana", label: "Фергана" },
  { value: "namangan", label: "Наманган" },
  { value: "nukus", label: "Нукус" },
  { value: "qarshi", label: "Карши" },
  { value: "termez", label: "Термез" },
  { value: "urgench", label: "Ургенч" },
  { value: "jizzakh", label: "Джизак" },
  { value: "navoi", label: "Навои" },
  { value: "kokand", label: "Коканд" },
  { value: "margilan", label: "Маргилан" },
  { value: "gulistan", label: "Гулистан" },
] as const;

const cityAliases = new Map(
  CITY_OPTIONS.flatMap(({ value, label }) => [
    [value.toLowerCase(), value],
    [label.toLowerCase(), value],
  ]),
);

export function normalizeCity(input: string) {
  const value = input.trim();
  return cityAliases.get(value.toLowerCase()) || value;
}

export function displayCity(input: string | null | undefined) {
  if (!input) return "";
  return CITY_OPTIONS.find(({ value }) => value === input)?.label || input;
}
