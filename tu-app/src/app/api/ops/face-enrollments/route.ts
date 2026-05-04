import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.accessLevel !== "KHUSUS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Default: show all enrollments that need admin attention
    // (SUBMITTED status OR any status with a pending photo update)
    const enrollments = await db.faceEnrollment.findMany({
      where: status
        ? { status: status as any }
        : {
            OR: [
              { status: "SUBMITTED" },
              { pendingPhotoUrl: { not: null } },
            ],
          },
      include: {
        pegawai: { select: { namaLengkap: true, nip: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    // Strip photo data from response — gallery loads photos via API
    const sanitized = enrollments.map(e => ({
      id: e.id,
      pegawaiId: e.pegawaiId,
      status: e.status,
      hasPendingPhoto: !!e.pendingPhotoUrl,
      hasApprovedPhoto: !!e.approvedPhotoUrl,
      submittedAt: e.submittedAt,
      rejectionReason: e.rejectionReason,
      pegawai: e.pegawai,
    }));

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Ops fetch enrollments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
