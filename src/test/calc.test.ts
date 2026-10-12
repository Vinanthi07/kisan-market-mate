import { describe, it, expect } from "vitest";
import { netBreakdown, roadKm, haversineKm } from "@/lib/calc";

describe("net profit", () => {
  it("net = price - km*rate - fee%*price - spoilage", () => {
    const r = netBreakdown({ price: 2000, distanceKm: 100, rate: 1.8, feePct: 2, spoilPer100km: 0.01 });
    expect(r.transport).toBe(180);
    expect(r.fee).toBe(40);
    expect(r.spoil).toBe(20);
    expect(r.net).toBe(1760);
  });
  it("road distance is haversine x 1.3", () => {
    const a: [number, number] = [13, 77], b: [number, number] = [14, 78];
    expect(roadKm(a, b)).toBeCloseTo(haversineKm(a, b) * 1.3);
  });
});
