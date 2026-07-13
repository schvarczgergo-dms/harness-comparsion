import { describe, it, expect } from "vitest";
import { buildByDistanceList, type CustomerRow } from "../src/customers.ts";

const row = (over: Partial<CustomerRow>): CustomerRow => ({
  id: 1,
  name: "X",
  telepules: "Somewhere",
  country_code: null,
  budget: null,
  note: null,
  lat: null,
  lon: null,
  ...over,
});

describe("buildByDistanceList", () => {
  it("puts Budapest first at 0 km and sorts known distances ascending", () => {
    const rows: CustomerRow[] = [
      row({ id: 1, name: "Vienna guy", lat: 48.2082, lon: 16.3738 }),
      row({ id: 2, name: "Budapest guy", lat: 47.4979, lon: 19.0402 }),
    ];
    const out = buildByDistanceList(rows);
    expect(out[0]!.name).toBe("Budapest guy");
    expect(out[0]!.distanceKm).toBe(0);
    expect(out[1]!.name).toBe("Vienna guy");
    expect(out[1]!.distanceKm).toBeGreaterThan(200);
    // rounded to 1 decimal
    expect(out[1]!.distanceKm! * 10).toBe(Math.round(out[1]!.distanceKm! * 10));
  });

  it("places unknown-coordinate customers last with null distanceKm", () => {
    const rows: CustomerRow[] = [
      row({ id: 1, name: "Unknown", lat: null, lon: null }),
      row({ id: 2, name: "Budapest", lat: 47.4979, lon: 19.0402 }),
    ];
    const out = buildByDistanceList(rows);
    expect(out[0]!.name).toBe("Budapest");
    expect(out[1]!.name).toBe("Unknown");
    expect(out[1]!.distanceKm).toBeNull();
  });

  it("breaks ties by name ascending", () => {
    const rows: CustomerRow[] = [
      row({ id: 1, name: "Zoe", lat: 47.4979, lon: 19.0402 }),
      row({ id: 2, name: "Adam", lat: 47.4979, lon: 19.0402 }),
    ];
    const out = buildByDistanceList(rows);
    expect(out.map((c) => c.name)).toEqual(["Adam", "Zoe"]);
  });

  it("breaks ties by name for unknown-coordinate customers too", () => {
    const rows: CustomerRow[] = [
      row({ id: 1, name: "Yara", lat: null, lon: null }),
      row({ id: 2, name: "Bob", lat: null, lon: null }),
    ];
    const out = buildByDistanceList(rows);
    expect(out.map((c) => c.name)).toEqual(["Bob", "Yara"]);
  });

  it("maps DTO fields including camelCase countryCode", () => {
    const out = buildByDistanceList([
      row({ id: 7, name: "A", telepules: "Budapest", country_code: "HU", budget: 100, note: "n", lat: 47.4979, lon: 19.0402 }),
    ]);
    expect(out[0]).toMatchObject({
      id: 7,
      name: "A",
      telepules: "Budapest",
      countryCode: "HU",
      budget: 100,
      note: "n",
      distanceKm: 0,
    });
  });
});
