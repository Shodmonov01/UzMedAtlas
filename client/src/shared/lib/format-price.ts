/** Format service price for public UI */

export function formatServicePrice(service: {
  priceUsd?: number | null;
  currency?: string | null;
  unit?: string | null;
}) {
  if (service.priceUsd == null) return null;
  const amount = service.priceUsd.toLocaleString("ru-RU");
  const unit = service.unit ? ` / ${service.unit}` : "";
  if (service.currency === "USD") return `$${amount}${unit}`;
  return `${amount} сум${unit}`;
}
