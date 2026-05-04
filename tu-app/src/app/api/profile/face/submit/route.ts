import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const FACES_DIR = join(process.cwd(), "uploads", "faces");
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.accessLevel !== "UMUM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { photoData, descriptor } = body;

    // --- Validation ---
    if (!photoData || typeof photoData !== "string") {
      return NextResponse.json({ error: "Foto wajib diunggah" }, { status: 400 });
    }

    // Validate base64 structure
    const base64Match = photoData.match(/^data:image\/(jpeg|png|jpg);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: "Format foto tidak valid. Gunakan JPEG atau PNG." }, { status: 400 });
    }

    // Check decoded size
    const buffer = Buffer.from(base64Match[2], "base64");
    if (buffer.length > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: `Ukuran foto terlalu besar (maks ${MAX_PHOTO_BYTES / 1024 / 1024}MB)` }, { status: 400 });
    }

    // Validate descriptor
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return NextResponse.json({ error: "Deskriptor wajah tidak valid (harus 128 dimensi)" }, { status: 400 });
    }

    // --- Write photo to disk ---
    await mkdir(FACES_DIR, { recursive: true });
    const ext = base64Match[1] === "png" ? "png" : "jpg";
    const fileName = `${user.id}_pending.${ext}`;
    const filePath = join(FACES_DIR, fileName);
    await writeFile(filePath, buffer);
    const photoPath = `uploads/faces/${fileName}`;

    // --- Upsert enrollment ---
    const existingEnrollment = await db.faceEnrollment.findUnique({
      where: { pegawaiId: user.id },
    });

    if (existingEnrollment && existingEnrollment.status === "SUBMITTED") {
      return NextResponse.json({ error: "Anda sudah memiliki pengajuan yang sedang diproses" }, { status: 400 });
    }

    // If currently APPROVED, keep the status so attendance continues working.
    // The admin gallery will detect a non-null pendingPhotoUrl for review.
    const newStatus = existingEnrollment?.status === "APPROVED" ? "APPROVED" : "SUBMITTED";

    if (existingEnrollment) {
      // Delete old pending file if exists
      if (existingEnrollment.pendingPhotoUrl) {
        const oldPath = join(process.cwd(), existingEnrollment.pendingPhotoUrl);
        if (existsSync(oldPath)) {
          await unlink(oldPath).catch(() => {});
        }
      }

      const updated = await db.faceEnrollment.update({
        where: { pegawaiId: user.id },
        data: {
          pendingPhotoUrl: photoPath,
          faceDescriptor: descriptor,
          status: newStatus,
          submittedAt: new Date(),
          rejectionReason: null,
        },
      });
      return NextResponse.json(updated);
    } else {
      const created = await db.faceEnrollment.create({
        data: {
          pegawaiId: user.id,
          pendingPhotoUrl: photoPath,
          faceDescriptor: descriptor,
          status: "SUBMITTED",
        },
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("Face submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
