import { db } from "@/lib/db";
import { AttendanceStatus, ResolutionSource } from "@prisma/client";

// ============================================================
// Attendance Resolution Engine
// ============================================================
// Determines the daily attendance status for a given employee
// on a given date using strict precedence rules:
//
//   1. Approved Cuti  → IZIN or SAKIT (based on jenisCuti)
//   2. Raw events     → HADIR
//   3. Calendar check → LIBUR (holiday or non-working day)
//   4. Fallback       → ALFA
//
// This engine is called:
//   - LIVE: immediately after a check-in event (unfinalized)
//   - EOD:  by the finalization cron job (locks the day)
// ============================================================

export interface ResolvedStatus {
  status: AttendanceStatus;
  resolutionSource: ResolutionSource;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  keterangan: string | null;
}

/**
 * Resolves the daily attendance status for one employee on one date.
 *
 * @param pegawaiId - The employee ID
 * @param date      - The business date (time component is stripped)
 * @returns         - The resolved status, source, and times
 */
export async function resolveDay(
  pegawaiId: string,
  date: Date
): Promise<ResolvedStatus> {
  // Normalize date to midnight UTC for consistent comparison
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  // ── Step 1: Check approved Cuti ──
  const cuti = await db.cuti.findFirst({
    where: {
      pegawaiId,
      status: "APPROVED",
      tanggalMulai: { lte: dayEnd },
      tanggalSelesai: { gte: dayStart },
    },
  });

  if (cuti) {
    // Map cuti type to attendance status
    const cutiStatus = mapCutiToStatus(cuti.jenisCuti);
    return {
      status: cutiStatus,
      resolutionSource: "LEAVE_APPROVAL",
      checkInTime: null,
      checkOutTime: null,
      keterangan: `Cuti ${cuti.jenisCuti}: ${cuti.alasan}`,
    };
  }

  // ── Step 2: Check raw attendance events ──
  const events = await db.attendanceRawEvent.findMany({
    where: {
      pegawaiId,
      occurredAt: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { occurredAt: "asc" },
  });

  if (events.length > 0) {
    const inEvents = events.filter((e) => e.eventType === "IN");
    const outEvents = events.filter((e) => e.eventType === "OUT");

    return {
      status: "HADIR",
      resolutionSource: "RAW_EVENT",
      checkInTime: inEvents[0]?.occurredAt ?? null,
      checkOutTime: outEvents.length > 0
        ? outEvents[outEvents.length - 1].occurredAt
        : null,
      keterangan: null,
    };
  }

  // ── Step 3: Check if this is a working day ──
  const isWorking = await isWorkingDay(dayStart);

  if (!isWorking) {
    return {
      status: "LIBUR",
      resolutionSource: "CALENDAR",
      checkInTime: null,
      checkOutTime: null,
      keterangan: null,
    };
  }

  // ── Step 4: Fallback → ALFA ──
  return {
    status: "ALFA",
    resolutionSource: "AUTO_ABSENT",
    checkInTime: null,
    checkOutTime: null,
    keterangan: "Tidak hadir (otomatis)",
  };
}

/**
 * Determines if a given date is a working day by checking:
 *   1. WorkingDayCalendar (exception overrides)
 *   2. GeofenceSettings.hariKerja (default weekly pattern)
 */
export async function isWorkingDay(date: Date): Promise<boolean> {
  // Strip time for @db.Date comparison
  const dateOnly = new Date(date);
  dateOnly.setUTCHours(0, 0, 0, 0);

  // Check exception calendar first
  const calendarEntry = await db.workingDayCalendar.findUnique({
    where: { date: dateOnly },
  });

  if (calendarEntry !== null) {
    // Explicit override exists — use it directly
    return calendarEntry.isWorkingDay;
  }

  // Fallback: check weekly pattern from GeofenceSettings
  const geoSettings = await db.geofenceSettings.findUnique({
    where: { id: "default" },
  });

  if (!geoSettings) {
    // If no settings exist, assume Mon-Fri
    return isWeekdayDefault(date);
  }

  // Map JS day number to Indonesian day name
  const dayName = getDayNameId(date);
  return geoSettings.hariKerja.includes(dayName);
}

/**
 * Upserts the DailyAttendanceSummary for a resolved day.
 * If the record is already finalized, this is a no-op (returns false).
 *
 * @param pegawaiId - Employee ID
 * @param date      - Business date
 * @param resolved  - Output from resolveDay()
 * @param finalize  - If true, locks the record (isFinalized = true)
 * @returns         - true if written, false if skipped (already finalized)
 */
export async function upsertDailySummary(
  pegawaiId: string,
  date: Date,
  resolved: ResolvedStatus,
  finalize: boolean = false
): Promise<boolean> {
  const dateOnly = new Date(date);
  dateOnly.setUTCHours(0, 0, 0, 0);

  // Check if already finalized — never overwrite automatically
  const existing = await db.dailyAttendanceSummary.findUnique({
    where: { pegawaiId_date: { pegawaiId, date: dateOnly } },
  });

  if (existing?.isFinalized) {
    return false; // Already locked, skip
  }

  await db.dailyAttendanceSummary.upsert({
    where: { pegawaiId_date: { pegawaiId, date: dateOnly } },
    update: {
      status: resolved.status,
      resolutionSource: resolved.resolutionSource,
      checkInTime: resolved.checkInTime,
      checkOutTime: resolved.checkOutTime,
      keterangan: resolved.keterangan,
      ...(finalize
        ? { isFinalized: true, finalizedAt: new Date() }
        : {}),
    },
    create: {
      pegawaiId,
      date: dateOnly,
      status: resolved.status,
      resolutionSource: resolved.resolutionSource,
      checkInTime: resolved.checkInTime,
      checkOutTime: resolved.checkOutTime,
      keterangan: resolved.keterangan,
      isFinalized: finalize,
      finalizedAt: finalize ? new Date() : null,
    },
  });

  return true;
}

// ── Helpers ──

/**
 * Maps Cuti.jenisCuti (free-text string) to AttendanceStatus.
 * "Sakit" → SAKIT, everything else → IZIN.
 */
function mapCutiToStatus(jenisCuti: string): AttendanceStatus {
  const lower = jenisCuti.toLowerCase();
  if (lower.includes("sakit")) return "SAKIT";
  return "IZIN";
}

/** Default Mon-Fri check when no GeofenceSettings exist */
function isWeekdayDefault(date: Date): boolean {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5; // Mon=1 .. Fri=5
}

/** Maps JS Date to Indonesian day name matching GeofenceSettings.hariKerja */
function getDayNameId(date: Date): string {
  const names = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return names[date.getUTCDay()];
}
