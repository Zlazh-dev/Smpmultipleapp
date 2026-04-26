import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/efiling-folders/[id]
 * Get folder details with children and documents
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const folder = await db.efilingFolder.findUnique({
      where: { id },
      include: {
        pegawai: { select: { namaLengkap: true, jabatan: true, nip: true } },
        children: {
          orderBy: { nama: "asc" },
          include: {
            _count: { select: { children: true, dokumen: true } },
          },
        },
        dokumen: {
          orderBy: { createdAt: "desc" },
          include: {
            pegawai: { select: { namaLengkap: true, jabatan: true } },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
    }

    // UMUM can only access own folders
    if (user.accessLevel === "UMUM" && folder.pegawaiId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build breadcrumb path
    const breadcrumbs: { id: string; nama: string }[] = [];
    let currentId: string | null = folder.id;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const f: { id: string; nama: string; parentId: string | null } | null = await db.efilingFolder.findUnique({
        where: { id: currentId },
        select: { id: true, nama: true, parentId: true },
      });
      if (!f) break;
      breadcrumbs.unshift({ id: f.id, nama: f.nama });
      currentId = f.parentId;
    }

    return NextResponse.json({
      ...folder,
      breadcrumbs,
    });
  } catch (error) {
    console.error("EfilingFolder GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/efiling-folders/[id]
 * Rename a folder
 * Body: { nama }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const folder = await db.efilingFolder.findUnique({
      where: { id },
      select: { pegawaiId: true },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
    }

    if (user.accessLevel === "UMUM" && folder.pegawaiId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.efilingFolder.update({
      where: { id },
      data: {
        ...(body.nama && { nama: body.nama.trim() }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("EfilingFolder PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/efiling-folders/[id]
 * Delete a folder and its contents
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const folder = await db.efilingFolder.findUnique({
      where: { id },
      select: { pegawaiId: true, parentId: true },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
    }

    // UMUM can only delete own folders
    if (user.accessLevel === "UMUM" && folder.pegawaiId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Don't allow deleting root folders (parentId === null)
    if (folder.parentId === null) {
      return NextResponse.json({ error: "Tidak bisa menghapus folder root" }, { status: 400 });
    }

    await db.efilingFolder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("EfilingFolder DELETE error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
