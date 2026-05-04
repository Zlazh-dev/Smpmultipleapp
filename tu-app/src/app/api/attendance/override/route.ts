import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";

// ============================================================
// POST /api/attendance/override
// ============================================================
// Admin-only endpoint to manually override a finalized
// DailyAttendanceSummary record. Creates an audit log entry.
//
// Body: { summaryId, newStatus, reason, notes? }
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.accessLevel !== "KHUSUS") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { summaryId, newStatus, reason, notes } = body;

    if (!summaryId || !newStatus || !reason) {
      return NextResponse.json(
        { error: "summaryId, newStatus, dan reason wajib diisi" },
        { status: 400 }
      );
    }

    // Validate newStatus is a valid enum value
    const validStatuses: AttendanceStatus[] = ["HADIR", "IZIN", "SAKIT", "ALFA", "LIBUR"];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Status tidak valid. Pilihan: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Find the existing summary
    const existing = await db.dailyAttendanceSummary.findUnique({
      where: { id: summaryId },
      include: { pegawai: { select: { namaLengkap: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Record kehadiran tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existing.status === newStatus) {
      return NextResponse.json(
        { error: "Status baru sama dengan status sebelumnya" },
        { status: 400 }
      );
    }

    // Perform the override + audit log in a transaction
    const [updatedSummary, auditLog] = await db.$transaction([
      db.dailyAttendanceSummary.update({
        where: { id: summaryId },
        data: {
          status: newStatus,
          resolutionSource: "MANUAL_OVERRIDE",
          keterangan: `Override: ${existing.status} → ${newStatus} oleh admin`,
        },
      }),
      db.attendanceAuditLog.create({
        data: {
          summaryId,
          performedByAdminId: user.id,
          previousStatus: existing.status,
          newStatus,
          actionType: "MANUAL_OVERRIDE",
          reason,
          notes: notes || null,
          metadata: {
            previousResolutionSource: existing.resolutionSource,
            wasFinalized: existing.isFinalized,
            overrideTimestamp: new Date().toISOString(),
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Status ${existing.pegawai.namaLengkap} berhasil diubah: ${existing.status} → ${newStatus}`,
      summary: updatedSummary,
      auditLogId: auditLog.id,
    });
  } catch (error) {
    console.error("Attendance override error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
