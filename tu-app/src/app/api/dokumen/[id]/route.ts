import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "uploads");

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const dokumen = await db.dokumen.findUnique({ where: { id } });
    if (!dokumen) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // UMUM can only delete own documents
    if (user.accessLevel === "UMUM" && dokumen.uploadedBy !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete file from disk
    try {
      const filePath = join(UPLOAD_DIR, dokumen.pathS3);
      await unlink(filePath);
    } catch {
      // File may already be deleted, continue
    }

    await db.dokumen.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Dokumen DELETE error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const dokumen = await db.dokumen.findUnique({ where: { id } });
    if (!dokumen) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.accessLevel === "UMUM" && dokumen.uploadedBy !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.dokumen.update({
      where: { id },
      data: {
        ...(body.namaAsli && { namaAsli: body.namaAsli }),
        ...(body.kategori && { kategori: body.kategori }),
        ...(body.pegawaiId !== undefined && { pegawaiId: body.pegawaiId }),
      },
      include: {
        pegawai: { select: { namaLengkap: true, jabatan: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Dokumen PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
