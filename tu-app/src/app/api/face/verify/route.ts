import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const FACE_MATCH_THRESHOLD = 0.6;

function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * POST /api/face/verify
 * Verify a face descriptor against the registered descriptor for a pegawai.
 * Body: { pegawaiId: string, descriptor: number[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { pegawaiId, descriptor } = await request.json();

    if (!pegawaiId || !descriptor || !Array.isArray(descriptor)) {
      return NextResponse.json(
        { error: "pegawaiId dan descriptor wajib diisi" },
        { status: 400 }
      );
    }

    const pegawai = await db.pegawai.findUnique({
      where: { id: pegawaiId },
      select: { id: true, namaLengkap: true, faceDescriptor: true, faceVerified: true },
    });

    if (!pegawai) {
      return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
    }

    if (!pegawai.faceDescriptor || pegawai.faceDescriptor.length === 0) {
      return NextResponse.json(
        {
          error: "Wajah belum terdaftar",
          notRegistered: true,
          message: "Kamu harus registrasi wajah dahulu di halaman profil atau hubungi admin.",
        },
        { status: 400 }
      );
    }

    // Check if face is verified by admin
    if (!pegawai.faceVerified) {
      return NextResponse.json(
        {
          error: "Wajah belum diverifikasi",
          notVerified: true,
          message: "Foto wajah kamu sudah diupload tapi belum diverifikasi oleh admin. Hubungi admin untuk verifikasi.",
        },
        { status: 400 }
      );
    }

    const distance = euclideanDistance(descriptor, pegawai.faceDescriptor);
    const match = distance < FACE_MATCH_THRESHOLD;

    return NextResponse.json({
      match,
      distance: Math.round(distance * 1000) / 1000,
      threshold: FACE_MATCH_THRESHOLD,
      name: pegawai.namaLengkap,
    });
  } catch (error) {
    console.error("Face verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
