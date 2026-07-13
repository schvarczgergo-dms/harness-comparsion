import { distanceFromBudapestKm, roundToOneDecimal } from "./geo/distance.ts";

/** A customer row as stored/retrieved from the database. */
export interface CustomerRow {
  id: number;
  name: string;
  telepules: string;
  country_code: string | null;
  budget: number | null;
  note: string | null;
  lat: number | null;
  lon: number | null;
}

/** The customer shape returned by the by-distance endpoint. */
export interface CustomerDistanceDto {
  id: number;
  name: string;
  telepules: string;
  countryCode: string | null;
  budget: number | null;
  note: string | null;
  distanceKm: number | null;
}

function toDto(row: CustomerRow): CustomerDistanceDto {
  const raw = distanceFromBudapestKm({ lat: row.lat, lon: row.lon });
  return {
    id: row.id,
    name: row.name,
    telepules: row.telepules,
    countryCode: row.country_code,
    budget: row.budget,
    note: row.note,
    distanceKm: raw === null ? null : roundToOneDecimal(raw),
  };
}

/**
 * Map rows to DTOs ordered by ascending distance from Budapest.
 * Known distances first (ascending); unknown-coordinate customers last;
 * ties broken by name ascending (AD-6).
 */
export function buildByDistanceList(rows: CustomerRow[]): CustomerDistanceDto[] {
  return rows.map(toDto).sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) {
      return a.name.localeCompare(b.name);
    }
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    return a.name.localeCompare(b.name);
  });
}
