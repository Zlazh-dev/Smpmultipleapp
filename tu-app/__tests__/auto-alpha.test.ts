import { describe, it, expect } from "vitest";

/**
 * Auto-alpha filter logic — extracted from the API route for pure unit testing.
 * This tests the LOGIC, not the database queries.
 */

interface Pegawai {
  id: string;
  namaLengkap: string;
  accessLevel: "KHUSUS" | "UMUM";
}

interface PresensiRecord {
  pegawaiId: string;
}

interface CutiRecord {
  pegawaiId: string;
}

/**
 * Core auto-alpha filter: determines which pegawai should be marked ALFA.
 * Rules:
 * 1. Only UMUM pegawai (KHUSUS are exempt)
 * 2. Not already checked in
 * 3. Not on approved cuti
 */
function filterAutoAlpha(
  allPegawai: Pegawai[],
  existingPresensi: PresensiRecord[],
  approvedCuti: CutiRecord[]
): Pegawai[] {
  const checkedInIds = new Set(existingPresensi.map((p) => p.pegawaiId));
  const cutiIds = new Set(approvedCuti.map((c) => c.pegawaiId));

  return allPegawai.filter(
    (p) =>
      p.accessLevel === "UMUM" &&
      !checkedInIds.has(p.id) &&
      !cutiIds.has(p.id)
  );
}

// Test data
const pegawaiList: Pegawai[] = [
  { id: "p1", namaLengkap: "Admin TU", accessLevel: "KHUSUS" },
  { id: "p2", namaLengkap: "Budi Guru", accessLevel: "UMUM" },
  { id: "p3", namaLengkap: "Citra Guru", accessLevel: "UMUM" },
  { id: "p4", namaLengkap: "Dedi Guru", accessLevel: "UMUM" },
  { id: "p5", namaLengkap: "Eka Guru", accessLevel: "UMUM" },
  { id: "p6", namaLengkap: "Kepala Sekolah", accessLevel: "KHUSUS" },
];

describe("Auto-Alpha Filter Logic", () => {
  it("marks all UMUM pegawai as ALFA when none checked in and no cuti", () => {
    const result = filterAutoAlpha(pegawaiList, [], []);
    expect(result).toHaveLength(4); // p2, p3, p4, p5
    expect(result.every((p) => p.accessLevel === "UMUM")).toBe(true);
  });

  it("excludes KHUSUS pegawai from auto-alpha", () => {
    const result = filterAutoAlpha(pegawaiList, [], []);
    const ids = result.map((p) => p.id);
    expect(ids).not.toContain("p1"); // Admin TU
    expect(ids).not.toContain("p6"); // Kepala Sekolah
  });

  it("excludes pegawai who already checked in", () => {
    const presensi: PresensiRecord[] = [
      { pegawaiId: "p2" }, // Budi sudah check-in
      { pegawaiId: "p3" }, // Citra sudah check-in
    ];
    const result = filterAutoAlpha(pegawaiList, presensi, []);
    expect(result).toHaveLength(2); // p4, p5
    expect(result.map((p) => p.id)).toEqual(["p4", "p5"]);
  });

  it("excludes pegawai on approved cuti", () => {
    const cuti: CutiRecord[] = [
      { pegawaiId: "p4" }, // Dedi sedang cuti
    ];
    const result = filterAutoAlpha(pegawaiList, [], cuti);
    expect(result).toHaveLength(3); // p2, p3, p5
    expect(result.map((p) => p.id)).not.toContain("p4");
  });

  it("excludes both checked-in AND cuti pegawai", () => {
    const presensi: PresensiRecord[] = [{ pegawaiId: "p2" }];
    const cuti: CutiRecord[] = [{ pegawaiId: "p3" }];
    const result = filterAutoAlpha(pegawaiList, presensi, cuti);
    expect(result).toHaveLength(2); // p4, p5
    expect(result.map((p) => p.id)).toEqual(["p4", "p5"]);
  });

  it("returns empty when all UMUM pegawai checked in", () => {
    const presensi: PresensiRecord[] = [
      { pegawaiId: "p2" },
      { pegawaiId: "p3" },
      { pegawaiId: "p4" },
      { pegawaiId: "p5" },
    ];
    const result = filterAutoAlpha(pegawaiList, presensi, []);
    expect(result).toHaveLength(0);
  });

  it("returns empty when only KHUSUS pegawai exist", () => {
    const khususOnly: Pegawai[] = [
      { id: "p1", namaLengkap: "Admin", accessLevel: "KHUSUS" },
    ];
    const result = filterAutoAlpha(khususOnly, [], []);
    expect(result).toHaveLength(0);
  });

  it("handles pegawai on cuti who also checked in (edge case)", () => {
    // Pegawai checked in despite being on cuti — should still be excluded
    const presensi: PresensiRecord[] = [{ pegawaiId: "p2" }];
    const cuti: CutiRecord[] = [{ pegawaiId: "p2" }]; // Same pegawai
    const result = filterAutoAlpha(pegawaiList, presensi, cuti);
    // p2 excluded by both conditions, p3/p4/p5 remain
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.id)).not.toContain("p2");
  });

  it("handles empty pegawai list", () => {
    const result = filterAutoAlpha([], [], []);
    expect(result).toHaveLength(0);
  });
});
