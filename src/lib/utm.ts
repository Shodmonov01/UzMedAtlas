export type Utm = {
  source?: string;
  medium?: string;
  campaign?: string;
};

function clip(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 80);
}

export function parseUtmSearch(searchParams: URLSearchParams): Utm | null {
  const source = clip(searchParams.get("utm_source"));
  const medium = clip(searchParams.get("utm_medium"));
  const campaign = clip(searchParams.get("utm_campaign"));
  if (!source && !medium && !campaign) return null;
  return { source, medium, campaign };
}

export function serializeUtm(utm: Utm) {
  return JSON.stringify(utm);
}

export function deserializeUtm(raw?: string | null): Utm | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;
    const utm: Utm = {
      source: typeof parsed.source === "string" ? clip(parsed.source) : undefined,
      medium: typeof parsed.medium === "string" ? clip(parsed.medium) : undefined,
      campaign: typeof parsed.campaign === "string" ? clip(parsed.campaign) : undefined,
    };
    if (!utm.source && !utm.medium && !utm.campaign) return null;
    return utm;
  } catch {
    return null;
  }
}
