import { describe, it, expect } from "vitest";
import { normalizeCity, lookupCoord } from "../src/geo/reference.ts";
import { BUDAPEST } from "../src/geo/distance.ts";

describe("normalizeCity", () => {
  it("strips accents, lowercases, trims and collapses whitespace", () => {
    expect(normalizeCity("Kraków")).toBe("krakow");
    expect(normalizeCity("  KRAKOW ")).toBe("krakow");
    expect(normalizeCity("Buda  pest")).toBe("buda pest");
  });
});

describe("lookupCoord", () => {
  it("matches accent/case/whitespace variants to the same coords (FR-3)", () => {
    const a = lookupCoord("Kraków");
    const b = lookupCoord("KRAKOW");
    const c = lookupCoord("  krakow ");
    expect(a).not.toBeNull();
    expect(a).toEqual(b);
    expect(a).toEqual(c);
  });

  it("resolves Budapest and its districts/postal forms to the capital (FR-3)", () => {
    expect(lookupCoord("Budapest")).toEqual(BUDAPEST);
    expect(lookupCoord("Budapest XI. kerület")).toEqual(BUDAPEST);
    expect(lookupCoord("1094 Budapest")).toEqual(BUDAPEST);
  });

  it("returns null for unknown/empty/null city (FR-4)", () => {
    expect(lookupCoord("Atlantis")).toBeNull();
    expect(lookupCoord("")).toBeNull();
    expect(lookupCoord(null)).toBeNull();
    expect(lookupCoord(undefined)).toBeNull();
  });

  it("does not match inherited Object.prototype keys", () => {
    expect(lookupCoord("toString")).toBeNull();
    expect(lookupCoord("constructor")).toBeNull();
  });

  it("covers all 15 seed cities", () => {
    const seedCities = [
      "Budapest", "Vienna", "Munich", "Milan", "Barcelona", "Lyon",
      "Kraków", "Prague", "Lisbon", "Amsterdam", "Stockholm",
      "Ljubljana", "Bucharest", "Dublin", "Copenhagen",
    ];
    for (const city of seedCities) {
      expect(lookupCoord(city), `expected coords for ${city}`).not.toBeNull();
    }
  });
});
