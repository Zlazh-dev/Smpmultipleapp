import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveDay, upsertDailySummary } from "@/lib/attendance-engine";

// ============================================================
// POST /api/cron/finalize
// ============================================================
// End-of-day finalization endpoint. Called by an external cron
// service (e.g., cron-job.org) daily at ~23:59 WIB.
//
// Behavior:
//   1. Scans the past 7 days for any un-finalized dates
//   2. For each un-finalized working day, resolves status for
//      every UMUM employee
//   3. Upserts DailyAttendanceSummary with isFinalized = true
//
// Idempotent: safe to call multiple times. Already-finalized
// records are skipped.
//
// Security: Protected by CRON_SECRET header. Not callable by
// regular users.
// ============================================================

const LOOKBACK_DAYS = 7;

export async function POST(req: NextRequest) {
  // ── Auth: verify cron secret ──
  const secret = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const now = new Date();

    // ── System Toggle: Skip if presensi system is deactivated ──
    const geoSettings = await db.geofenceSettings.findUnique({ where: { id: "default" } });
    if (geoSettings && !geoSettings.isActive) {
      return NextResponse.json({
        success: true,
        paused: true,
        message: "Sistem presensi sedang nonaktif. Finalisasi dilewati.",
        timestamp: now.toISOString(),
      });
    }

    const results: Array<{
      date: string;
      finalized: number;
      skipped: number;
    }> = [];

    // ── Get all UMUM employees ──
    const employees = await db.pegawai.findMany({
      where: { accessLevel: "UMUM" },
      select: { id: true },
    });

    // ── Scan past N days ──
    for (let daysAgo = 1; daysAgo <= LOOKBACK_DAYS; daysAgo++) {
      const targetDate = new Date(now);
      targetDate.setUTCDate(targetDate.getUTCDate() - daysAgo);
      targetDate.setUTCHours(0, 0, 0, 0);

      const dateStr = targetDate.toISOString().split("T")[0];

      // Check if any employees still need finalization for this date
      const unfinalizedCount = await db.dailyAttendanceSummary.count({
        where: {
          date: targetDate,
          isFinalized: false,
        },
      });

      // Also check for employees with NO summary at all for this date
      const existingSummaryIds = await db.dailyAttendanceSummary.findMany({
        where: { date: targetDate },
        select: { pegawaiId: true },
      });
      const existingSet = new Set(existingSummaryIds.map((s) => s.pegawaiId));
      const missingEmployees = employees.filter(
        (e) => !existingSet.has(e.id)
      );

      // If everything is finalized and no one is missing, skip this date
      if (unfinalizedCount === 0 && missingEmployees.length === 0) {
        continue;
      }

      let finalized = 0;
      let skipped = 0;

      // Process each employee for this date
      for (const emp of employees) {
        const resolved = await resolveDay(emp.id, targetDate);
        const written = await upsertDailySummary(
          emp.id,
          targetDate,
          resolved,
          true // finalize = true
        );

        if (written) {
          finalized++;
        } else {
          skipped++;
        }
      }

      results.push({ date: dateStr, finalized, skipped });
    }

    return NextResponse.json({
      success: true,
      processedDates: results.length,
      details: results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Finalization cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
