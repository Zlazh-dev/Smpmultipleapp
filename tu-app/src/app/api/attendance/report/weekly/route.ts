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
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: "Parameter startDate dan endDate (YYYY-MM-DD) wajib diisi" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(endDateParam);
    endDate.setUTCHours(0, 0, 0, 0);

    // Get all UMUM employees
    const employees = await db.pegawai.findMany({
      where: { accessLevel: "UMUM" },
      select: { id: true, namaLengkap: true, nip: true },
      orderBy: { namaLengkap: "asc" },
    });

    const summaries = await db.dailyAttendanceSummary.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      select: { pegawaiId: true, status: true },
    });

    // Aggregate counts per employee
    const aggregatedData = employees.map((emp) => {
      const counts = { HADIR: 0, IZIN: 0, SAKIT: 0, ALFA: 0, LIBUR: 0 };
      const empSummaries = summaries.filter((s) => s.pegawaiId === emp.id);

      empSummaries.forEach((s) => {
        counts[s.status]++;
      });

      return {
        pegawaiId: emp.id,
        nama: emp.namaLengkap,
        nip: emp.nip,
        counts,
      };
    });

    return NextResponse.json({
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      data: aggregatedData,
    });
  } catch (error) {
    console.error("Weekly report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
