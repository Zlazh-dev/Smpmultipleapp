import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const FACES_DIR = join(process.cwd(), "uploads", "faces");

/**
 * POST /api/face/register
 * Register a face descriptor for a pegawai.
 *
 * Authorization:
 * - KHUSUS (admin): can register any pegawai's face → auto-verified
 * - UMUM (guru): can register only their OWN face → needs admin verification
 *
 * Body: { pegawaiId: string, descriptor: number[], photo?: string (base64 data URL) }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pegawaiId, descriptor, photo } = await request.json();

    if (!pegawaiId) {
      return NextResponse.json({ error: "pegawaiId wajib diisi" }, { status: 400 });
    }

    const isAdmin = user.accessLevel === "KHUSUS";
    const isSelf = user.id === pegawaiId;

    // UMUM can only register their own face
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Anda hanya bisa mendaftarkan wajah sendiri" }, { status: 403 });
    }

    // Handle delete (empty descriptor)
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length === 0) {
      // Only admin can delete
      if (!isAdmin) {
        return NextResponse.json({ error: "Hanya admin yang bisa menghapus data wajah" }, { status: 403 });
      }

      // Delete photo file if exists
      const existing = await db.pegawai.findUnique({ where: { id: pegawaiId }, select: { facePhoto: true } });
      if (existing?.facePhoto) {
        const filePath = join(process.cwd(), existing.facePhoto);
        if (existsSync(filePath)) {
          await unlink(filePath).catch(() => {});
        }
      }

      await db.pegawai.update({
        where: { id: pegawaiId },
        data: { faceDescriptor: [], facePhoto: null, faceVerified: false },
      });

      return NextResponse.json({ success: true, message: "Data wajah dihapus" });
    }

    // Validate descriptor
    if (descriptor.length !== 128) {
      return NextResponse.json({ error: "Descriptor harus 128 dimensi" }, { status: 400 });
    }

    // Save photo if provided (base64 data URL)
    let facePhotoPath: string | undefined;
    if (photo && typeof photo === "string" && photo.startsWith("data:image/")) {
      await mkdir(FACES_DIR, { recursive: true });

      // Extract mime type and data
      const matches = photo.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        const fileName = `${pegawaiId}.${ext}`;
        const filePath = join(FACES_DIR, fileName);

        // Delete old photo if different extension
        const existing = await db.pegawai.findUnique({ where: { id: pegawaiId }, select: { facePhoto: true } });
        if (existing?.facePhoto && existing.facePhoto !== `uploads/faces/${fileName}`) {
          const oldPath = join(process.cwd(), existing.facePhoto);
          if (existsSync(oldPath)) {
            await unlink(oldPath).catch(() => {});
          }
        }

        await writeFile(filePath, buffer);
        facePhotoPath = `uploads/faces/${fileName}`;
      }
    }

    // Update pegawai
    const updateData: any = { faceDescriptor: descriptor };
    if (facePhotoPath) {
      updateData.facePhoto = facePhotoPath;
    }

    // Admin registration = auto-verified; Self registration = needs verification
    if (isAdmin) {
      updateData.faceVerified = true;
    } else {
      updateData.faceVerified = false;
    }

    const pegawai = await db.pegawai.update({
      where: { id: pegawaiId },
      data: updateData,
      select: { id: true, namaLengkap: true, faceVerified: true },
    });

    return NextResponse.json({
      success: true,
      message: isAdmin
        ? `Wajah ${pegawai.namaLengkap} berhasil didaftarkan`
        : `Wajah berhasil diupload! Menunggu verifikasi admin.`,
      pegawai,
      verified: pegawai.faceVerified,
    });
  } catch (error: any) {
    console.error("Face register error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
