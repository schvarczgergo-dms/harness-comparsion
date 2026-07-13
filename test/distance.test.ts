import { describe, it, expect } from "vitest";
import {
  BUDAPEST,
  haversineKm,
  distanceFromBudapestKm,
  roundToOneDecimal,
} from "../src/geo/distance.ts";

const VIENNA = { lat: 48.2082, lon: 16.3738 };

describe("haversineKm", () => {
  it("computes a known distance Budapest -> Vienna (~214 km)", () => {
    const d = haversineKm(BUDAPEST, VIENNA);
    expect(d).toBeGreaterThan(210);
    expect(d).toBeLessThan(218);
  });

  it("returns 0 for identical points", () => {
    expect(haversineKm(BUDAPEST, BUDAPEST)).toBe(0);
  });

  it("is symmetric", () => {
    expect(haversineKm(BUDAPEST, VIENNA)).toBeCloseTo(
      haversineKm(VIENNA, BUDAPEST),
      6,
    );
  });
});

describe("distanceFromBudapestKm", () => {
  it("is 0 for Budapest itself", () => {
    expect(distanceFromBudapestKm(BUDAPEST)).toBe(0);
  });

  it("returns ~214 for Vienna", () => {
    const d = distanceFromBudapestKm(VIENNA);
    expect(d).not.toBeNull();
    expect(d as number).toBeGreaterThan(210);
    expect(d as number).toBeLessThan(218);
  });

  it("returns null for null coordinate", () => {
    expect(distanceFromBudapestKm(null)).toBeNull();
  });

  it("returns null for partial/undefined coordinate without throwing", () => {
    expect(distanceFromBudapestKm({ lat: 47.5, lon: null })).toBeNull();
    expect(distanceFromBudapestKm({ lat: null, lon: 19.0 })).toBeNull();
    expect(distanceFromBudapestKm(undefined)).toBeNull();
  });
});

describe("roundToOneDecimal", () => {
  it("rounds to a single decimal place", () => {
    expect(roundToOneDecimal(213.97)).toBe(214);
    expect(roundToOneDecimal(213.44)).toBe(213.4);
    expect(roundToOneDecimal(0)).toBe(0);
  });
});
