import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/cuti
export async function GET() {
  const cuti = await db.cuti.findMany({
    include: { pegawai: { select: { namaLengkap: true, jabatan: true, nip: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cuti);
}

// POST /api/cuti
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pegawaiId, jenisCuti, tanggalMulai, tanggalSelesai, alasan, dokBukti } = body;

    if (!pegawaiId || !jenisCuti || !tanggalMulai || !tanggalSelesai) {
      return NextResponse.json({ error: "Field wajib tidak lengkap" }, { status: 400 });
    }

    const start = new Date(tanggalMulai);
    const end = new Date(tanggalSelesai);
    const lamaHari = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const cuti = await db.cuti.create({
      data: {
        pegawaiId,
        jenisCuti,
        tanggalMulai: start,
        tanggalSelesai: end,
        lamaHari,
        alasan: alasan || "",
        status: "PENDING",
        ...(dokBukti && { dokBukti }),
      },
      include: { pegawai: { select: { namaLengkap: true } } },
    });

    return NextResponse.json(cuti, { status: 201 });
  } catch (error) {
    console.error("Cuti create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
