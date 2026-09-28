import { useEffect, useRef, useState } from "react";
import {
  TASHKENT,
  loadYandexMaps,
  type YMapsMap,
  type YMapsPlacemark,
} from "@/shared/lib/yandex-maps";

export type BranchMapPick = {
  lat: number;
  lng: number;
  addressRu?: string;
};

type Props = {
  lat?: number | null;
  lng?: number | null;
  mode: "pick" | "view";
  onPick?: (point: BranchMapPick) => void;
  className?: string;
  height?: number;
};

async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const ymaps = await loadYandexMaps();
    const res = await ymaps.geocode([lat, lng], { results: 1, lang: "ru_RU" });
    const first = res.geoObjects.get(0);
    return first?.getAddressLine() || undefined;
  } catch {
    return undefined;
  }
}

export function BranchMap({ lat, lng, mode, onPick, className = "", height = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMapsMap | null>(null);
  const markerRef = useRef<YMapsPlacemark | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const [error, setError] = useState<string | null>(null);

  const hasPoint = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return;

        const center: [number, number] = hasPoint ? [lat!, lng!] : TASHKENT;
        const map = new ymaps.Map(
          containerRef.current,
          {
            center,
            zoom: hasPoint ? 16 : 12,
            controls: ["zoomControl", "geolocationControl"],
          },
          { suppressMapOpenBlock: true },
        );

        const setMarker = (coords: [number, number]) => {
          if (markerRef.current) {
            markerRef.current.geometry.setCoordinates(coords);
            return markerRef.current;
          }
          const placemark = new ymaps.Placemark(
            coords,
            {},
            {
              draggable: mode === "pick",
              preset: "islands#blueIcon",
            },
          );
          map.geoObjects.add(placemark);
          markerRef.current = placemark;

          if (mode === "pick") {
            placemark.events.add("dragend", () => {
              const [dragLat, dragLng] = placemark.geometry.getCoordinates();
              void (async () => {
                const addressRu = await reverseGeocode(dragLat, dragLng);
                onPickRef.current?.({ lat: dragLat, lng: dragLng, addressRu });
              })();
            });
          }
          return placemark;
        };

        if (hasPoint) setMarker([lat!, lng!]);

        if (mode === "pick") {
          map.events.add("click", (e) => {
            const coords = e.get("coords") as [number, number];
            setMarker(coords);
            map.setCenter(coords);
            void (async () => {
              const addressRu = await reverseGeocode(coords[0], coords[1]);
              onPickRef.current?.({ lat: coords[0], lng: coords[1], addressRu });
            })();
          });
        }

        map.container.fitToViewport();
        resizeObserver = new ResizeObserver(() => {
          map.container.fitToViewport();
        });
        resizeObserver.observe(containerRef.current);

        mapRef.current = map;
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Не удалось загрузить Яндекс.Карты");
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.destroy();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasPoint) return;

    const coords: [number, number] = [lat!, lng!];
    if (markerRef.current) {
      markerRef.current.geometry.setCoordinates(coords);
    } else {
      void loadYandexMaps().then((ymaps) => {
        if (!mapRef.current) return;
        const placemark = new ymaps.Placemark(
          coords,
          {},
          { preset: "islands#blueIcon", draggable: mode === "pick" },
        );
        mapRef.current.geoObjects.add(placemark);
        markerRef.current = placemark;
      });
    }
    map.setCenter(coords, Math.max(map.getZoom(), 16));
    map.container.fitToViewport();
  }, [lat, lng, hasPoint, mode]);

  if (error) {
    return (
      <div
        className={`grid w-full max-w-full place-items-center rounded-2xl border border-line bg-sand px-4 text-center text-sm text-muted ${className}`}
        style={{ height, width: "100%" }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`branch-map w-full max-w-full overflow-hidden rounded-2xl border border-line ${className}`}
      style={{ height, width: "100%" }}
      role="img"
      aria-label={
        mode === "pick" ? "Яндекс.Карта: кликните, чтобы указать точку филиала" : "Яндекс.Карта филиала"
      }
    />
  );
}
