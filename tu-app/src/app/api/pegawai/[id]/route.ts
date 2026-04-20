import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/pegawai/[id]
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const pegawai = await db.pegawai.findUnique({
    where: { id },
    include: {
      presensi: { orderBy: { tanggal: "desc" }, take: 30 },
      cuti: { orderBy: { createdAt: "desc" } },
      dokumen: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!pegawai) {
    return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(pegawai);
}

// PATCH /api/pegawai/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const body = await request.json();
    const data: any = {};

    // Only update fields that are explicitly provided
    if (body.namaLengkap !== undefined) data.namaLengkap = body.namaLengkap;
    if (body.jabatan !== undefined) data.jabatan = body.jabatan;
    if (body.accessLevel !== undefined) data.accessLevel = body.accessLevel;
    if (body.username !== undefined) data.username = body.username;
    if (body.noHp !== undefined) data.noHp = body.noHp;
    if (body.alamat !== undefined) data.alamat = body.alamat;
    if (body.skRiwayat !== undefined) data.skRiwayat = body.skRiwayat;
    if (body.kinerja !== undefined) data.kinerja = body.kinerja;

    const pegawai = await db.pegawai.update({
      where: { id },
      data,
    });

    return NextResponse.json(pegawai);
  } catch (error: any) {
    console.error("[PATCH /api/pegawai] Error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/pegawai/[id]
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await db.pegawai.delete({ where: { id } });
    return NextResponse.json({ message: "Pegawai berhasil dihapus" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
