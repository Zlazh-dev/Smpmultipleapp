import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const kategori = searchParams.get("kategori");
    const q = searchParams.get("q");
    const pegawaiId = searchParams.get("pegawaiId");

    const where: any = {};

    // UMUM users can only see their own documents
    if (user.accessLevel === "UMUM") {
      where.OR = [
        { pegawaiId: user.id },
        { uploadedBy: user.id },
      ];
    }

    if (kategori && kategori !== "ALL") {
      where.kategori = kategori;
    }
    if (q) {
      where.namaAsli = { contains: q, mode: "insensitive" };
    }
    if (pegawaiId) {
      where.pegawaiId = pegawaiId;
    }
    const folderId = searchParams.get("folderId");
    if (folderId) {
      where.folderId = folderId;
    }

    const dokumen = await db.dokumen.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        pegawai: { select: { namaLengkap: true, jabatan: true } },
      },
    });

    return NextResponse.json(dokumen);
  } catch (error) {
    console.error("Dokumen GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { namaAsli, namaFile, ukuran, mimeType, path, kategori, pegawaiId, folderId } = body;

    if (!namaAsli || !namaFile || !path || !kategori) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const dokumen = await db.dokumen.create({
      data: {
        namaAsli,
        namaFile,
        ukuran: ukuran || 0,
        mimeType: mimeType || "application/octet-stream",
        pathS3: path,
        kategori,
        pegawaiId: pegawaiId || user.id,
        uploadedBy: user.id,
        folderId: folderId || null,
      },
      include: {
        pegawai: { select: { namaLengkap: true, jabatan: true } },
      },
    });

    return NextResponse.json(dokumen, { status: 201 });
  } catch (error) {
    console.error("Dokumen POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
