import type { Coord } from "./distance";

const CITY_COORDS: Record<string, Coord> = {
  budapest: { lat: 47.4979, lon: 19.0402 },
  vienna: { lat: 48.2082, lon: 16.3738 },
  munich: { lat: 48.1351, lon: 11.582 },
  milan: { lat: 45.4642, lon: 9.19 },
  barcelona: { lat: 41.3874, lon: 2.1686 },
  lyon: { lat: 45.764, lon: 4.8357 },
  krakow: { lat: 50.0647, lon: 19.945 },
  prague: { lat: 50.0755, lon: 14.4378 },
  lisbon: { lat: 38.7223, lon: -9.1393 },
  amsterdam: { lat: 52.3676, lon: 4.9041 },
  stockholm: { lat: 59.3293, lon: 18.0686 },
  ljubljana: { lat: 46.0569, lon: 14.5058 },
  bucharest: { lat: 44.4268, lon: 26.1025 },
  dublin: { lat: 53.3498, lon: -6.2603 },
  copenhagen: { lat: 55.6761, lon: 12.5683 },
};

export function normalizeCity(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function lookupCoord(city: string | null | undefined): Coord | null {
  if (!city) {
    return null;
  }
  const key = normalizeCity(city);
  if (Object.hasOwn(CITY_COORDS, key)) {
    return CITY_COORDS[key];
  }
  if (key.includes("budapest")) {
    return CITY_COORDS.budapest;
  }
  return null;
}
