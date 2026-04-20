import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

/**
 * POST /api/face/register
 * Register a face descriptor for a pegawai.
 * Only KHUSUS (admin) can register faces.
 * Body: { pegawaiId: string, descriptor: number[] }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.accessLevel !== "KHUSUS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { pegawaiId, descriptor } = await request.json();

    if (!pegawaiId || !descriptor || !Array.isArray(descriptor)) {
      return NextResponse.json(
        { error: "pegawaiId dan descriptor wajib diisi" },
        { status: 400 }
      );
    }

    if (descriptor.length !== 128) {
      return NextResponse.json(
        { error: "Descriptor harus 128 dimensi" },
        { status: 400 }
      );
    }

    const pegawai = await db.pegawai.update({
      where: { id: pegawaiId },
      data: { faceDescriptor: descriptor },
      select: { id: true, namaLengkap: true },
    });

    return NextResponse.json({
      success: true,
      message: `Wajah ${pegawai.namaLengkap} berhasil didaftarkan`,
      pegawai,
    });
  } catch (error: any) {
    console.error("Face register error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
