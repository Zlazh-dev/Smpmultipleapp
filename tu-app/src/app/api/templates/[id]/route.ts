import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/templates/[id]
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const template = await db.printTemplate.findUnique({ where: { id } });

  if (!template) {
    return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(template);
}

// PATCH /api/templates/[id] — update template
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();

    const template = await db.printTemplate.update({
      where: { id },
      data: {
        ...(body.nama !== undefined && { nama: body.nama }),
        ...(body.kategori !== undefined && { kategori: body.kategori }),
        ...(body.deskripsi !== undefined && { deskripsi: body.deskripsi }),
        ...(body.canvasData !== undefined && { canvasData: body.canvasData }),
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/templates/[id]
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await db.printTemplate.delete({ where: { id } });
    return NextResponse.json({ message: "Template berhasil dihapus" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
