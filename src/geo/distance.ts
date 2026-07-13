export interface Coord {
  lat: number;
  lon: number;
}

export const BUDAPEST: Coord = { lat: 47.4979, lon: 19.0402 };

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineKm(a: Coord, b: Coord): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function distanceFromBudapestKm(
  coord: { lat: number | null; lon: number | null } | null | undefined,
): number | null {
  if (!coord || coord.lat === null || coord.lon === null) {
    return null;
  }
  return haversineKm(BUDAPEST, { lat: coord.lat, lon: coord.lon });
}

export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
