import { NextResponse } from "next/server";
import { radigDb } from "@/lib/radig-db";

/**
 * GET /api/siswa — List all students from RADIG (read-only)
 * Query params: kelas, status, search, page, limit
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kelasId = searchParams.get("kelas");
  const status = searchParams.get("status") || "Aktif";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (status) where.status_siswa = status;
    if (kelasId) where.id_kelas = parseInt(kelasId);
    if (search) {
      where.OR = [
        { nama_lengkap: { contains: search } },
        { nisn: { contains: search } },
        { nis: { contains: search } },
      ];
    }

    const [siswa, total] = await Promise.all([
      radigDb.siswa.findMany({
        where,
        include: {
          kelas: {
            include: {
              tahun_ajaran: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { nama_lengkap: "asc" },
      }),
      radigDb.siswa.count({ where }),
    ]);

    return NextResponse.json({
      data: siswa,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch siswa from RADIG:", error);
    return NextResponse.json(
      { error: "Failed to fetch siswa data" },
      { status: 500 }
    );
  }
}
