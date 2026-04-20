import { NextResponse } from "next/server";
import { radigDb } from "@/lib/radig-db";

/**
 * GET /api/kelas — List all classes from RADIG (for filter dropdowns)
 */
export async function GET() {
  try {
    const kelas = await radigDb.kelas.findMany({
      include: {
        tahun_ajaran: true,
        wali_kelas: { select: { nama_guru: true } },
        _count: { select: { siswa: true } },
      },
      orderBy: [{ id_tahun_ajaran: "desc" }, { nama_kelas: "asc" }],
    });

    return NextResponse.json(kelas);
  } catch (error) {
    console.error("Failed to fetch kelas from RADIG:", error);
    return NextResponse.json(
      { error: "Failed to fetch kelas data" },
      { status: 500 }
    );
  }
}
