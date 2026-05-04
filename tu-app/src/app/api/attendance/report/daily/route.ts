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
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json({ error: "Parameter date (YYYY-MM-DD) wajib diisi" }, { status: 400 });
    }

    const date = new Date(dateParam);
    date.setUTCHours(0, 0, 0, 0);

    const summaries = await db.dailyAttendanceSummary.findMany({
      where: { date },
      include: {
        pegawai: { select: { namaLengkap: true, nip: true, jabatan: true } },
      },
      orderBy: { pegawai: { namaLengkap: "asc" } },
    });

    const counts = {
      HADIR: 0,
      IZIN: 0,
      SAKIT: 0,
      ALFA: 0,
      LIBUR: 0,
    };

    summaries.forEach((s) => {
      counts[s.status]++;
    });

    return NextResponse.json({
      date: date.toISOString().split("T")[0],
      totalRecords: summaries.length,
      counts,
      data: summaries.map((s) => ({
        id: s.id,
        pegawaiId: s.pegawaiId,
        nama: s.pegawai.namaLengkap,
        nip: s.pegawai.nip,
        jabatan: s.pegawai.jabatan,
        status: s.status,
        checkInTime: s.checkInTime,
        checkOutTime: s.checkOutTime,
        isFinalized: s.isFinalized,
        resolutionSource: s.resolutionSource,
        keterangan: s.keterangan,
      })),
    });
  } catch (error) {
    console.error("Daily report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
