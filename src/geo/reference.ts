import { BUDAPEST, type Coord } from "./distance.ts";

/**
 * Offline city -> coordinate reference for every city in seed-customers.json.
 * Keys are normalized (see normalizeCity). No external calls (AD-3).
 */
const CITY_COORDS: Record<string, Coord> = {
  budapest: BUDAPEST,
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

/**
 * Deterministic normalization for matching: accent-stripped (NFD), lowercased,
 * trimmed, internal whitespace collapsed.
 */
export function normalizeCity(city: string): string {
  return city
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Resolve a city/telepules to coordinates from the offline reference.
 * Robust to accents/case/whitespace; "Budapest" and its districts/postal forms
 * resolve to the capital. Unknown/empty/null -> null (never throws, no network).
 */
export function lookupCoord(city: string | null | undefined): Coord | null {
  if (!city) return null;
  const key = normalizeCity(city);
  if (!key) return null;

  // "Budapest", "Budapest XI. kerület", "1094 Budapest" all map to the capital.
  if (key.split(" ").includes("budapest")) return BUDAPEST;

  // Object.hasOwn avoids matching inherited prototype keys (e.g. "toString").
  return Object.hasOwn(CITY_COORDS, key) ? CITY_COORDS[key]! : null;
}
