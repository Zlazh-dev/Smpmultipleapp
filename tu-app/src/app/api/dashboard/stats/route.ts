import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dashboard/stats
export async function GET() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [pegawaiCount, totalHadirToday, cutiPending, dokumenCount] =
    await Promise.all([
      db.pegawai.count({ where: { accessLevel: "UMUM" } }),
      // Read from DailyAttendanceSummary (new CQRS source of truth)
      db.dailyAttendanceSummary.count({
        where: {
          date: today,
          status: "HADIR",
        },
      }),
      db.cuti.count({ where: { status: "PENDING" } }),
      db.dokumen.count(),
    ]);

  return NextResponse.json({
    pegawai: pegawaiCount,
    presensiHariIni: totalHadirToday,
    presensiRate: pegawaiCount > 0 ? Math.round((totalHadirToday / pegawaiCount) * 100) : 0,
    cutiPending,
    dokumen: dokumenCount,
  });
}
