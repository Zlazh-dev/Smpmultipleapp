import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.accessLevel !== "KHUSUS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { reason } = body;

    if (!reason || reason.trim() === "") {
      return NextResponse.json({ error: "Alasan penolakan wajib diisi" }, { status: 400 });
    }

    const enrollment = await db.faceEnrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Data pengajuan tidak ditemukan" }, { status: 404 });
    }

    if (!enrollment.pendingPhotoUrl) {
      return NextResponse.json({ error: "Tidak ada foto pending untuk ditolak" }, { status: 400 });
    }

    // Delete pending photo file from disk
    if (enrollment.pendingPhotoUrl) {
      const pendingPath = join(process.cwd(), enrollment.pendingPhotoUrl);
      if (existsSync(pendingPath)) {
        await unlink(pendingPath).catch(() => {});
      }
    }

    // If the enrollment was APPROVED (re-submission case), keep APPROVED status
    // but clear the pending photo. If it was SUBMITTED (first submission), set REJECTED.
    const newStatus = enrollment.status === "APPROVED" ? "APPROVED" : "REJECTED";

    const updated = await db.faceEnrollment.update({
      where: { id },
      data: {
        pendingPhotoUrl: null,
        rejectionReason: reason,
        status: newStatus,
        rejectedAt: new Date(),
        reviewedBy: user.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ops reject enrollment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
