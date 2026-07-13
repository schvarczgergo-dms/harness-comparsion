import { distanceFromBudapestKm, roundToOneDecimal } from "./geo/distance";

export interface CustomerRow {
  id: number;
  name: string;
  telepules: string;
  country_code: string | null;
  budget: number | null;
  lat: number | null;
  lon: number | null;
}

export interface CustomerDistanceDto {
  id: number;
  name: string;
  telepules: string;
  countryCode: string | null;
  budget: number | null;
  distanceKm: number | null;
}

export function toDistanceDto(row: CustomerRow): CustomerDistanceDto {
  const distance = distanceFromBudapestKm({ lat: row.lat, lon: row.lon });
  return {
    id: row.id,
    name: row.name,
    telepules: row.telepules,
    countryCode: row.country_code,
    budget: row.budget,
    distanceKm: distance === null ? null : roundToOneDecimal(distance),
  };
}

export function sortByDistanceThenName(
  customers: CustomerDistanceDto[],
): CustomerDistanceDto[] {
  return [...customers].sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) return a.name.localeCompare(b.name);
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    return a.name.localeCompare(b.name);
  });
}

export function buildByDistanceList(rows: CustomerRow[]): CustomerDistanceDto[] {
  return sortByDistanceThenName(rows.map(toDistanceDto));
}
