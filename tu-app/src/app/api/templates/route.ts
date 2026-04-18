import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/templates — list all templates
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const kategori = searchParams.get("kategori");
  const activeOnly = searchParams.get("active") === "true";

  const where: any = {};
  if (kategori) where.kategori = kategori;
  if (activeOnly) where.isActive = true;

  const templates = await db.printTemplate.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(templates);
}

// POST /api/templates — create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, kategori, deskripsi, canvasData, createdBy } = body;

    if (!nama || !kategori) {
      return NextResponse.json({ error: "Nama dan kategori wajib" }, { status: 400 });
    }

    const template = await db.printTemplate.create({
      data: {
        nama,
        kategori,
        deskripsi: deskripsi || null,
        canvasData: canvasData || { title: nama, width: 595, height: 842, elements: [] },
        createdBy: createdBy || "system",
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
