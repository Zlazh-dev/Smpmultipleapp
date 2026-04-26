import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

/**
 * GET /api/efiling-folders
 * - UMUM: returns own folders (auto-creates root if none exist)
 * - KHUSUS: returns all pegawai with their root folders
 * 
 * Query params:
 *   parentId: show children of this folder
 *   pegawaiId: filter by pegawai (KHUSUS only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");
    const pegawaiId = searchParams.get("pegawaiId");

    // If requesting a specific folder's children
    if (parentId) {
      const folder = await db.efilingFolder.findUnique({
        where: { id: parentId },
        select: { pegawaiId: true },
      });

      // UMUM can only access own folders
      if (user.accessLevel === "UMUM" && folder?.pegawaiId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const [children, documents] = await Promise.all([
        db.efilingFolder.findMany({
          where: { parentId },
          orderBy: { nama: "asc" },
          include: {
            _count: { select: { children: true, dokumen: true } },
          },
        }),
        db.dokumen.findMany({
          where: { folderId: parentId },
          orderBy: { createdAt: "desc" },
          include: {
            pegawai: { select: { namaLengkap: true, jabatan: true } },
          },
        }),
      ]);

      return NextResponse.json({ children, documents });
    }

    // KHUSUS: List all pegawai with their root folder count
    if (user.accessLevel === "KHUSUS" && !pegawaiId) {
      const pegawaiList = await db.pegawai.findMany({
        orderBy: { namaLengkap: "asc" },
        select: {
          id: true,
          namaLengkap: true,
          jabatan: true,
          nip: true,
          _count: {
            select: { folders: true, dokumen: true },
          },
        },
      });

      return NextResponse.json({ pegawaiList });
    }

    // Get specific pegawai's root folders
    const targetPegawaiId = pegawaiId || user.id;

    // UMUM can only see own
    if (user.accessLevel === "UMUM" && targetPegawaiId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Auto-create root folder if none exist
    const existingFolders = await db.efilingFolder.findMany({
      where: { pegawaiId: targetPegawaiId, parentId: null },
      orderBy: { nama: "asc" },
      include: {
        _count: { select: { children: true, dokumen: true } },
      },
    });

    if (existingFolders.length === 0) {
      // Auto-create root folder "Dokumen Saya"
      const pegawai = await db.pegawai.findUnique({
        where: { id: targetPegawaiId },
        select: { namaLengkap: true },
      });

      if (pegawai) {
        const newFolder = await db.efilingFolder.create({
          data: {
            nama: "Dokumen Saya",
            pegawaiId: targetPegawaiId,
          },
          include: {
            _count: { select: { children: true, dokumen: true } },
          },
        });
        return NextResponse.json({ folders: [newFolder] });
      }
    }

    // Also get root-level documents (not in any folder)
    const rootDocuments = await db.dokumen.findMany({
      where: {
        pegawaiId: targetPegawaiId,
        folderId: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        pegawai: { select: { namaLengkap: true, jabatan: true } },
      },
    });

    return NextResponse.json({ folders: existingFolders, documents: rootDocuments });
  } catch (error) {
    console.error("EfilingFolders GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * POST /api/efiling-folders
 * Create a new folder
 * Body: { nama, parentId? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { nama, parentId } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama folder harus diisi" }, { status: 400 });
    }

    // If creating inside a parent folder, verify ownership
    let ownerPegawaiId = user.id;
    if (parentId) {
      const parentFolder = await db.efilingFolder.findUnique({
        where: { id: parentId },
        select: { pegawaiId: true },
      });

      if (!parentFolder) {
        return NextResponse.json({ error: "Folder parent tidak ditemukan" }, { status: 404 });
      }

      // UMUM can only create in own folders
      if (user.accessLevel === "UMUM" && parentFolder.pegawaiId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      ownerPegawaiId = parentFolder.pegawaiId;
    }

    const folder = await db.efilingFolder.create({
      data: {
        nama: nama.trim(),
        parentId: parentId || null,
        pegawaiId: ownerPegawaiId,
      },
      include: {
        _count: { select: { children: true, dokumen: true } },
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("EfilingFolders POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
