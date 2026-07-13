export interface Coord {
  lat: number;
  lon: number;
}

/** Nullable coordinate: either component may be missing/unknown. */
export type MaybeCoord =
  | { lat: number | null; lon: number | null }
  | null
  | undefined;

/** Single source of truth for the Budapest reference point (AD-7). */
export const BUDAPEST: Coord = { lat: 47.4979, lon: 19.0402 };

const EARTH_RADIUS_KM = 6371;

const toRadians = (deg: number): number => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in kilometers. */
export function haversineKm(a: Coord, b: Coord): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/**
 * Distance from Budapest to a (possibly unknown) coordinate.
 * Returns null when coordinates are missing/partial — never throws (AD-6).
 */
export function distanceFromBudapestKm(coord: MaybeCoord): number | null {
  if (!coord || !isFiniteNumber(coord.lat) || !isFiniteNumber(coord.lon)) {
    return null;
  }
  return haversineKm(BUDAPEST, { lat: coord.lat, lon: coord.lon });
}

/** Round to one decimal place (AD-5). */
export function roundToOneDecimal(n: number): number {
  return Math.round(n * 10) / 10;
}
