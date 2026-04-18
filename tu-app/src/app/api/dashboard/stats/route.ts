import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dashboard/stats
export async function GET() {
  const [pegawaiCount, totalPresensiToday, cutiPending, dokumenCount] =
    await Promise.all([
      db.pegawai.count(),
      db.presensi.count({
        where: {
          tanggal: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: "HADIR",
        },
      }),
      db.cuti.count({ where: { status: "PENDING" } }),
      db.dokumen.count(),
    ]);

  return NextResponse.json({
    pegawai: pegawaiCount,
    presensiHariIni: totalPresensiToday,
    presensiRate: pegawaiCount > 0 ? Math.round((totalPresensiToday / pegawaiCount) * 100) : 0,
    cutiPending,
    dokumen: dokumenCount,
  });
}
