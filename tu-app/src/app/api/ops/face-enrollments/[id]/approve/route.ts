import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { rename, copyFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.accessLevel !== "KHUSUS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const enrollment = await db.faceEnrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Data pengajuan tidak ditemukan" }, { status: 404 });
    }

    // Must have a pending photo to approve
    if (!enrollment.pendingPhotoUrl) {
      return NextResponse.json({ error: "Tidak ada foto pending untuk disetujui" }, { status: 400 });
    }

    // Must be SUBMITTED or APPROVED-with-pending-update
    if (enrollment.status !== "SUBMITTED" && enrollment.status !== "APPROVED") {
      return NextResponse.json({ error: "Data pengajuan tidak valid atau sudah diproses" }, { status: 400 });
    }

    // Move pending photo file → approved photo file
    const pendingFilePath = join(process.cwd(), enrollment.pendingPhotoUrl);
    const ext = enrollment.pendingPhotoUrl.split(".").pop() || "jpg";
    const approvedFileName = `${enrollment.pegawaiId}_approved.${ext}`;
    const approvedFilePath = join(process.cwd(), "uploads", "faces", approvedFileName);
    const approvedPhotoUrl = `uploads/faces/${approvedFileName}`;

    if (existsSync(pendingFilePath)) {
      // Delete old approved file if exists
      if (enrollment.approvedPhotoUrl) {
        const oldApprovedPath = join(process.cwd(), enrollment.approvedPhotoUrl);
        if (existsSync(oldApprovedPath) && oldApprovedPath !== pendingFilePath) {
          await unlink(oldApprovedPath).catch(() => {});
        }
      }
      // Copy pending → approved (don't rename, in case of rollback)
      await copyFile(pendingFilePath, approvedFilePath);
      await unlink(pendingFilePath).catch(() => {});
    }

    // Update enrollment: move pending → approved, sync descriptor
    const updated = await db.faceEnrollment.update({
      where: { id },
      data: {
        approvedPhotoUrl,
        pendingPhotoUrl: null,
        rejectionReason: null,
        status: "APPROVED",
        approvedAt: new Date(),
        reviewedBy: user.id,
      },
    });

    // Sync descriptor + photo to Pegawai for backward compat with verify endpoint
    await db.pegawai.update({
      where: { id: enrollment.pegawaiId },
      data: {
        faceDescriptor: enrollment.faceDescriptor,
        facePhoto: approvedPhotoUrl,
        faceVerified: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ops approve enrollment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
