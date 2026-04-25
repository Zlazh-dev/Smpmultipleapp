import { describe, it, expect } from "vitest";

/**
 * Haversine distance calculation - extracted from API route for testability.
 * Calculates the great-circle distance between two points on Earth.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Geofence check - determines if a point is within radius of center.
 */
function isInsideGeofence(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusMeters: number
): boolean {
  return haversineDistance(centerLat, centerLon, pointLat, pointLon) <= radiusMeters;
}

describe("Haversine Distance", () => {
  it("returns 0 for identical points", () => {
    const d = haversineDistance(-7.2575, 112.7521, -7.2575, 112.7521);
    expect(d).toBe(0);
  });

  it("calculates correct distance between two known points", () => {
    // Jakarta to Surabaya ≈ 660 km
    const d = haversineDistance(-6.2088, 106.8456, -7.2575, 112.7521);
    expect(d).toBeGreaterThan(650_000);
    expect(d).toBeLessThan(700_000);
  });

  it("calculates short distance accurately (< 1km)", () => {
    // Two points ~100m apart
    const baseLat = -7.2575;
    const baseLon = 112.7521;
    // ~100m north (1 degree lat ≈ 111km, so 0.0009° ≈ 100m)
    const d = haversineDistance(baseLat, baseLon, baseLat + 0.0009, baseLon);
    expect(d).toBeGreaterThan(90);
    expect(d).toBeLessThan(110);
  });

  it("is symmetric (A→B = B→A)", () => {
    const d1 = haversineDistance(-7.2575, 112.7521, -6.2088, 106.8456);
    const d2 = haversineDistance(-6.2088, 106.8456, -7.2575, 112.7521);
    expect(d1).toBeCloseTo(d2, 6);
  });
});

describe("Geofence Validation", () => {
  const schoolLat = -7.2575;
  const schoolLon = 112.7521;
  const radius = 200; // meters

  it("accepts point inside geofence", () => {
    // 50m north of school
    const result = isInsideGeofence(
      schoolLat, schoolLon,
      schoolLat + 0.00045, schoolLon, // ~50m
      radius
    );
    expect(result).toBe(true);
  });

  it("accepts point exactly at center", () => {
    const result = isInsideGeofence(
      schoolLat, schoolLon,
      schoolLat, schoolLon,
      radius
    );
    expect(result).toBe(true);
  });

  it("rejects point outside geofence", () => {
    // 500m north of school
    const result = isInsideGeofence(
      schoolLat, schoolLon,
      schoolLat + 0.0045, schoolLon, // ~500m
      radius
    );
    expect(result).toBe(false);
  });

  it("handles edge case at boundary", () => {
    // Point at ~199m should be inside 200m radius
    const d = haversineDistance(schoolLat, schoolLon, schoolLat + 0.0018, schoolLon);
    expect(d).toBeLessThan(210); // roughly at boundary
    expect(d).toBeGreaterThan(180);
  });
});
