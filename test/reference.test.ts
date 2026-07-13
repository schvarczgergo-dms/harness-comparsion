import { describe, it, expect } from "vitest";
import { lookupCoord, normalizeCity } from "../src/geo/reference";

describe("normalizeCity", () => {
  it("is case-insensitive and trims/collapses whitespace", () => {
    expect(normalizeCity("  BUDAPEST  ")).toBe("budapest");
    expect(normalizeCity("New   York")).toBe("new york");
  });
  it("strips accents", () => {
    expect(normalizeCity("Kraków")).toBe("krakow");
    expect(normalizeCity("Bécs")).toBe("becs");
  });
});

describe("lookupCoord", () => {
  it("finds known cities regardless of case/whitespace", () => {
    expect(lookupCoord("Vienna")).toEqual({ lat: 48.2082, lon: 16.3738 });
    expect(lookupCoord("  amsterdam ")).toEqual({ lat: 52.3676, lon: 4.9041 });
  });
  it("matches accented city names", () => {
    expect(lookupCoord("Kraków")).toEqual({ lat: 50.0647, lon: 19.945 });
  });
  it("maps Budapest and its districts to the capital", () => {
    const bp = { lat: 47.4979, lon: 19.0402 };
    expect(lookupCoord("Budapest")).toEqual(bp);
    expect(lookupCoord("Budapest XI. kerület")).toEqual(bp);
    expect(lookupCoord("1094 Budapest")).toEqual(bp);
  });
  it("returns null for unknown or empty cities", () => {
    expect(lookupCoord("Atlantis")).toBeNull();
    expect(lookupCoord("")).toBeNull();
    expect(lookupCoord(null)).toBeNull();
    expect(lookupCoord(undefined)).toBeNull();
  });
});
