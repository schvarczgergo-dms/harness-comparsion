import { describe, it, expect } from "vitest";
import { buildByDistanceList, type CustomerRow } from "../src/customers";

const rows: CustomerRow[] = [
  { id: 1, name: "Vienna Guy", telepules: "Vienna", country_code: "AT", budget: 100, lat: 48.2082, lon: 16.3738 },
  { id: 2, name: "Anna Budapest", telepules: "Budapest", country_code: "HU", budget: 200, lat: 47.4979, lon: 19.0402 },
  { id: 3, name: "Unknown Two", telepules: "Atlantis", country_code: "XX", budget: 0, lat: null, lon: null },
  { id: 4, name: "Unknown One", telepules: "Nowhere", country_code: "XX", budget: 0, lat: null, lon: null },
  { id: 5, name: "Bela Budapest", telepules: "Budapest", country_code: "HU", budget: 300, lat: 47.4979, lon: 19.0402 },
];

describe("buildByDistanceList", () => {
  const result = buildByDistanceList(rows);

  it("puts Budapest customers first with distanceKm 0", () => {
    expect(result[0].distanceKm).toBe(0);
    expect(result[1].distanceKm).toBe(0);
  });
  it("breaks ties (equal distance) by name", () => {
    expect(result[0].name).toBe("Anna Budapest");
    expect(result[1].name).toBe("Bela Budapest");
  });
  it("orders known distances ascending", () => {
    const known = result.map((c) => c.distanceKm).filter((d): d is number => d !== null);
    expect(known).toEqual([...known].sort((a, b) => a - b));
  });
  it("places unknown-coordinate customers last with distanceKm null, sorted by name", () => {
    const lastTwo = result.slice(-2);
    expect(lastTwo.map((c) => c.distanceKm)).toEqual([null, null]);
    expect(lastTwo.map((c) => c.name)).toEqual(["Unknown One", "Unknown Two"]);
  });
});
