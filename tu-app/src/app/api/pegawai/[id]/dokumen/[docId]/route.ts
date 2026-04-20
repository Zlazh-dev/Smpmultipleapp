import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readFile, unlink } from "fs/promises";
import path from "path";

/**
 * GET /api/pegawai/[id]/dokumen/[docId] — Download document
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { docId } = await params;

  try {
    const dokumen = await db.dokumen.findUnique({ where: { id: docId } });
    if (!dokumen) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), dokumen.pathS3);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": dokumen.mimeType,
        "Content-Disposition": `inline; filename="${dokumen.namaAsli}"`,
        "Content-Length": String(dokumen.ukuran),
      },
    });
  } catch (error) {
    console.error("Failed to serve document:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

/**
 * DELETE /api/pegawai/[id]/dokumen/[docId] — Delete document
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { docId } = await params;

  try {
    const dokumen = await db.dokumen.findUnique({ where: { id: docId } });
    if (!dokumen) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), dokumen.pathS3);
      await unlink(filePath);
    } catch {
      // File might already be deleted, continue
    }

    // Delete database record
    await db.dokumen.delete({ where: { id: docId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
