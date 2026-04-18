import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/cuti/[id] — update status
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const cuti = await db.cuti.update({
      where: { id },
      data: { status },
      include: { pegawai: { select: { namaLengkap: true } } },
    });

    return NextResponse.json(cuti);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Cuti tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
