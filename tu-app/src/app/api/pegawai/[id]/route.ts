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
    const pegawai = await db.pegawai.update({
      where: { id },
      data: {
        namaLengkap: body.namaLengkap,
        jabatan: body.jabatan,
        role: body.role,
        username: body.username,
        noHp: body.noHp,
        alamat: body.alamat,
        skRiwayat: body.skRiwayat,
        kinerja: body.kinerja,
      },
    });

    return NextResponse.json(pegawai);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
