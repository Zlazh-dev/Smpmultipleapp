import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

/**
 * POST /api/presensi/auto-alpha
 * Marks all UMUM pegawai who haven't checked in today as ALFA.
 * Excludes: KHUSUS pegawai, those already checked in, those on approved cuti.
 * Only callable by KHUSUS users.
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || user.accessLevel !== "KHUSUS") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Get all UMUM pegawai (KHUSUS are exempt from presensi)
    const allUmumPegawai = await db.pegawai.findMany({
      where: { accessLevel: "UMUM" },
      select: { id: true, namaLengkap: true },
    });

    // 2. Get pegawai who already have presensi today
    const existingPresensi = await db.presensi.findMany({
      where: { tanggal: { gte: today, lt: tomorrow } },
      select: { pegawaiId: true },
    });
    const checkedInIds = new Set(existingPresensi.map((p) => p.pegawaiId));

    // 3. Get pegawai on approved cuti today
    const approvedCuti = await db.cuti.findMany({
      where: {
        status: "APPROVED",
        tanggalMulai: { lte: tomorrow },
        tanggalSelesai: { gte: today },
      },
      select: { pegawaiId: true },
    });
    const cutiIds = new Set(approvedCuti.map((c) => c.pegawaiId));

    // 4. Filter: UMUM pegawai who haven't checked in AND aren't on cuti
    const toMarkAlpha = allUmumPegawai.filter(
      (p) => !checkedInIds.has(p.id) && !cutiIds.has(p.id)
    );

    if (toMarkAlpha.length === 0) {
      return NextResponse.json({
        marked: 0,
        message: "Semua pegawai sudah presensi atau sedang cuti",
      });
    }

    // 5. Batch create ALFA records
    const alfaRecords = toMarkAlpha.map((p) => ({
      pegawaiId: p.id,
      tanggal: today,
      status: "ALFA" as const,
      keterangan: "Auto-alpha: tidak hadir",
    }));

    await db.presensi.createMany({
      data: alfaRecords,
      skipDuplicates: true, // Safety: skip if somehow already exists
    });

    return NextResponse.json({
      marked: toMarkAlpha.length,
      names: toMarkAlpha.map((p) => p.namaLengkap),
      message: `${toMarkAlpha.length} pegawai ditandai ALFA`,
    });
  } catch (error) {
    console.error("Auto-alpha error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
