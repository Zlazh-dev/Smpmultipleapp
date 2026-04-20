import { NextResponse } from "next/server";
import { radigDb } from "@/lib/radig-db";

/**
 * GET /api/siswa/[id] — Detail student + rapor + catatan from RADIG
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const siswaId = parseInt(id);

  if (isNaN(siswaId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const siswa = await radigDb.siswa.findUnique({
      where: { id_siswa: siswaId },
      include: {
        kelas: {
          include: {
            tahun_ajaran: true,
            wali_kelas: true,
          },
        },
        rapor: {
          include: {
            detail_akademik: {
              include: { mapel: true },
            },
          },
          orderBy: [{ id_tahun_ajaran: "desc" }, { semester: "desc" }],
        },
        catatan: {
          orderBy: { tanggal_catatan: "desc" },
        },
      },
    });

    if (!siswa) {
      return NextResponse.json({ error: "Siswa not found" }, { status: 404 });
    }

    return NextResponse.json(siswa);
  } catch (error) {
    console.error("Failed to fetch siswa detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch siswa detail" },
      { status: 500 }
    );
  }
}
