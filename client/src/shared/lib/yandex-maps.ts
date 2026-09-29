/** Minimal Yandex Maps JS API 2.1 typings used by BranchMap */

export type YMapsCoords = [number, number]; // [lat, lng]

export type YMapsMap = {
  destroy: () => void;
  setCenter: (center: YMapsCoords, zoom?: number) => void;
  getZoom: () => number;
  container: {
    fitToViewport: () => void;
  };
  events: {
    add: (event: string, handler: (e: { get: (key: string) => unknown }) => void) => void;
  };
  geoObjects: {
    add: (obj: unknown) => void;
    remove: (obj: unknown) => void;
  };
};

export type YMapsPlacemark = {
  geometry: {
    setCoordinates: (coords: YMapsCoords) => void;
    getCoordinates: () => YMapsCoords;
  };
  events: {
    add: (event: string, handler: () => void) => void;
  };
};

export type YMapsGeoObject = {
  getAddressLine: () => string;
  geometry?: { getCoordinates: () => YMapsCoords };
};

export type YMapsApi = {
  ready: (cb?: () => void) => Promise<void>;
  Map: new (
    element: HTMLElement | string,
    state: { center: YMapsCoords; zoom: number; controls?: string[] },
    options?: { suppressMapOpenBlock?: boolean },
  ) => YMapsMap;
  Placemark: new (
    coords: YMapsCoords,
    properties?: Record<string, unknown>,
    options?: { draggable?: boolean; preset?: string },
  ) => YMapsPlacemark;
  geocode: (
    query: YMapsCoords | string,
    options?: { results?: number; lang?: string },
  ) => Promise<{
    geoObjects: {
      get: (index: number) => YMapsGeoObject | null;
    };
  }>;
};

declare global {
  interface Window {
    ymaps?: YMapsApi;
  }
}

const TASHKENT: YMapsCoords = [41.3111, 69.2797];

let loadPromise: Promise<YMapsApi> | null = null;

/** Optional — без ключа работает бесплатный JS API 2.1 */
export function getYandexMapsApiKey() {
  return import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim() || "";
}

export function loadYandexMaps(): Promise<YMapsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Yandex Maps only available in browser"));
  }
  if (window.ymaps) {
    return window.ymaps.ready().then(() => window.ymaps!);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<YMapsApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-yandex-maps]");
    if (existing) {
      existing.addEventListener("load", () => {
        window.ymaps?.ready().then(() => resolve(window.ymaps!)).catch(reject);
      });
      existing.addEventListener("error", () => reject(new Error("Failed to load Yandex Maps")));
      return;
    }

    const apiKey = getYandexMapsApiKey();
    const params = new URLSearchParams({ lang: "ru_RU" });
    if (apiKey) params.set("apikey", apiKey);

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?${params.toString()}`;
    script.async = true;
    script.dataset.yandexMaps = "1";
    script.onload = () => {
      window.ymaps?.ready().then(() => resolve(window.ymaps!)).catch(reject);
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Yandex Maps"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function yandexPointUrl(lat: number, lng: number) {
  return `https://yandex.ru/maps/?pt=${lng},${lat}&z=16&l=map`;
}

export function yandexRouteUrl(lat: number, lng: number) {
  return `https://yandex.ru/maps/?rtext=~${lat},${lng}&rtt=auto`;
}

export async function geocodeYandexAddress(address: string) {
  const ymaps = await loadYandexMaps();
  const result = await ymaps.geocode(address, { results: 1, lang: "ru_RU" });
  const first = result.geoObjects.get(0);
  const coordinates = first?.geometry?.getCoordinates();
  if (!coordinates) throw new Error("Адрес не найден на карте");
  return {
    lat: coordinates[0],
    lng: coordinates[1],
    addressRu: first?.getAddressLine() || address,
  };
}

export { TASHKENT };
