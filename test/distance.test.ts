import { describe, it, expect } from "vitest";
import {
  BUDAPEST,
  distanceFromBudapestKm,
  haversineKm,
  roundToOneDecimal,
} from "../src/geo/distance";

const VIENNA = { lat: 48.2082, lon: 16.3738 };

describe("haversineKm", () => {
  it("computes a known distance (Budapest - Vienna ~ 214 km)", () => {
    const d = haversineKm(BUDAPEST, VIENNA);
    expect(d).toBeGreaterThan(210);
    expect(d).toBeLessThan(218);
  });

  it("is zero for the same point (Budapest - Budapest)", () => {
    expect(haversineKm(BUDAPEST, BUDAPEST)).toBe(0);
  });

  it("is symmetric", () => {
    expect(haversineKm(BUDAPEST, VIENNA)).toBeCloseTo(haversineKm(VIENNA, BUDAPEST), 6);
  });
});

describe("distanceFromBudapestKm", () => {
  it("returns 0 for Budapest itself", () => {
    expect(distanceFromBudapestKm(BUDAPEST)).toBe(0);
  });

  it("returns ~214 for Vienna", () => {
    const d = distanceFromBudapestKm(VIENNA);
    expect(d).not.toBeNull();
    expect(roundToOneDecimal(d as number)).toBeCloseTo(214, 0);
  });

  it("returns null when the coordinate is missing", () => {
    expect(distanceFromBudapestKm(null)).toBeNull();
    expect(distanceFromBudapestKm(undefined)).toBeNull();
    expect(distanceFromBudapestKm({ lat: null, lon: null })).toBeNull();
    expect(distanceFromBudapestKm({ lat: 47.5, lon: null })).toBeNull();
    expect(distanceFromBudapestKm({ lat: null, lon: 19.0 })).toBeNull();
  });
});

describe("roundToOneDecimal", () => {
  it("rounds to a single decimal place", () => {
    expect(roundToOneDecimal(213.94)).toBe(213.9);
    expect(roundToOneDecimal(213.95)).toBe(214);
    expect(roundToOneDecimal(0)).toBe(0);
  });
});
