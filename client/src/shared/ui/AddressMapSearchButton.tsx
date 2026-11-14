import { useState } from "react";
import { geocodeYandexAddress } from "@/shared/lib/yandex-maps";

type Props = {
  address: string;
  onFound: (point: { lat: number; lng: number; addressRu: string }) => void;
  disabled?: boolean;
};

export function AddressMapSearchButton({ address, onFound, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function search() {
    if (!address.trim()) {
      setFailed(true);
      setMessage("Enter the address first.");
      return;
    }
    setLoading(true);
    setFailed(false);
    setMessage(null);
    try {
      const point = await geocodeYandexAddress(address.trim());
      onFound(point);
      setMessage(`Address found: ${point.addressRu}`);
    } catch {
      setFailed(true);
      setMessage("The search failed. Make the address more precise or try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        className="btn btn-ghost w-full whitespace-nowrap text-sm sm:w-auto"
        onClick={() => void search()}
        disabled={disabled || loading}
      >
        {loading ? "Searching…" : "Find on the map"}
      </button>
      {message ? (
        <p className={`mt-1 max-w-xs text-xs ${failed ? "text-danger" : "text-primary"}`} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
