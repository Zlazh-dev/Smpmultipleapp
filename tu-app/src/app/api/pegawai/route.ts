import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/pegawai — list all
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");
  const jabatan = searchParams.get("jabatan");

  const where: any = {};
  if (q) {
    where.OR = [
      { namaLengkap: { contains: q, mode: "insensitive" } },
      { nip: { contains: q } },
    ];
  }
  if (jabatan) {
    where.jabatan = { contains: jabatan, mode: "insensitive" };
  }

  const pegawai = await db.pegawai.findMany({
    where,
    orderBy: { namaLengkap: "asc" },
  });

  return NextResponse.json(pegawai);
}

// POST /api/pegawai — create new
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nip, namaLengkap, jabatan, accessLevel, username, noHp, alamat } = body;

    if (!nip || !namaLengkap || !jabatan || !username) {
      return NextResponse.json({ error: "Field wajib tidak lengkap" }, { status: 400 });
    }

    const pegawai = await db.pegawai.create({
      data: { nip, namaLengkap, jabatan, accessLevel: accessLevel || "UMUM", username, noHp, alamat },
    });

    return NextResponse.json(pegawai, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "NIP atau username sudah terdaftar" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
