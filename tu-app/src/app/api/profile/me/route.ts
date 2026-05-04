import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.accessLevel !== "UMUM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pegawai = await db.pegawai.findUnique({
      where: { id: user.id },
      include: {
        faceEnrollment: true,
      },
    });

    if (!pegawai) {
      return NextResponse.json({ error: "Profil pegawai tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      id: pegawai.id,
      namaLengkap: pegawai.namaLengkap,
      nip: pegawai.nip,
      jabatan: pegawai.jabatan,
      faceEnrollment: pegawai.faceEnrollment,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
