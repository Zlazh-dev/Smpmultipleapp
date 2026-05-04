import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.accessLevel !== "KHUSUS") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    if (!monthParam || !yearParam) {
      return NextResponse.json(
        { error: "Parameter month dan year wajib diisi" },
        { status: 400 }
      );
    }

    const month = parseInt(monthParam, 10);
    const year = parseInt(yearParam, 10);

    if (isNaN(month) || month < 1 || month > 12 || isNaN(year)) {
      return NextResponse.json(
        { error: "Format month atau year tidak valid" },
        { status: 400 }
      );
    }

    // Month boundary
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1)); // First day of next month
    // We want dates < endDate

    // Total days in the month up to today (if current month) or full month (if past)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const isCurrentMonth = today.getUTCFullYear() === year && today.getUTCMonth() === month - 1;
    const lastDayToCount = isCurrentMonth ? today : endDate;

    // Get all UMUM employees
    const employees = await db.pegawai.findMany({
      where: { accessLevel: "UMUM" },
      select: { id: true, namaLengkap: true, nip: true },
      orderBy: { namaLengkap: "asc" },
    });

    // Get strictly FINALIZED summaries for the month
    const summaries = await db.dailyAttendanceSummary.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
        isFinalized: true,
      },
      select: { pegawaiId: true, status: true, date: true },
    });

    // Aggregate counts per employee
    const aggregatedData = employees.map((emp) => {
      const counts = { HADIR: 0, IZIN: 0, SAKIT: 0, ALFA: 0, LIBUR: 0 };
      const empSummaries = summaries.filter((s) => s.pegawaiId === emp.id);

      empSummaries.forEach((s) => {
        counts[s.status]++;
      });

      // Expected working days calculation
      // Total finalized days - LIBUR days
      // Note: If the month is not fully finalized, expectedWorkingDays reflects
      // only the finalized portion of the month.
      const totalFinalizedDays = empSummaries.length;
      const expectedWorkingDays = totalFinalizedDays - counts.LIBUR;

      const attendanceRate =
        expectedWorkingDays > 0
          ? Math.round((counts.HADIR / expectedWorkingDays) * 100)
          : 0;

      return {
        pegawaiId: emp.id,
        nama: emp.namaLengkap,
        nip: emp.nip,
        totalFinalizedDays,
        expectedWorkingDays,
        counts,
        attendanceRate,
      };
    });

    return NextResponse.json({
      month,
      year,
      period: `${year}-${month.toString().padStart(2, "0")}`,
      data: aggregatedData,
    });
  } catch (error) {
    console.error("Monthly report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
