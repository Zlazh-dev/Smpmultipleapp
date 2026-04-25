import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

/**
 * POST /api/face/verify-status
 * Admin approves or rejects a pegawai's face registration.
 * Body: { pegawaiId: string, verified: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.accessLevel !== "KHUSUS") {
      return NextResponse.json({ error: "Hanya admin yang bisa verifikasi" }, { status: 403 });
    }

    const { pegawaiId, verified } = await request.json();

    if (!pegawaiId || typeof verified !== "boolean") {
      return NextResponse.json({ error: "pegawaiId dan verified wajib diisi" }, { status: 400 });
    }

    // If rejecting, also clear the face data so they can re-register
    const updateData: any = { faceVerified: verified };
    if (!verified) {
      updateData.faceDescriptor = [];
      updateData.facePhoto = null;
    }

    const pegawai = await db.pegawai.update({
      where: { id: pegawaiId },
      data: updateData,
      select: { id: true, namaLengkap: true, faceVerified: true },
    });

    return NextResponse.json({
      success: true,
      message: verified
        ? `Wajah ${pegawai.namaLengkap} telah diverifikasi ✓`
        : `Registrasi wajah ${pegawai.namaLengkap} ditolak. Pegawai harus mendaftar ulang.`,
      pegawai,
    });
  } catch (error: any) {
    console.error("Face verify-status error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
