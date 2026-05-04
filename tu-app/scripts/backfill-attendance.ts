/**
 * Backfill Script: Legacy Presensi → New CQRS Tables
 * 
 * Run with: npx tsx scripts/backfill-attendance.ts
 * Requires DATABASE_URL environment variable.
 * 
 * Idempotent: uses skipDuplicates / unique constraints.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("=== Attendance Backfill: Presensi → CQRS ===\n");

  const allPresensi = await db.presensi.findMany({
    orderBy: { tanggal: "asc" },
  });

  console.log(`Found ${allPresensi.length} legacy Presensi records.\n`);

  let eventsCreated = 0;
  let eventsSkipped = 0;
  let summariesCreated = 0;
  let summariesSkipped = 0;

  for (const p of allPresensi) {
    // ── Create raw events ──
    if (p.jamDatang) {
      try {
        await db.attendanceRawEvent.create({
          data: {
            pegawaiId: p.pegawaiId,
            eventType: "IN",
            occurredAt: p.jamDatang,
            verificationMethod: "backfill",
            sourceRef: `legacy-presensi:${p.id}`,
            keterangan: p.keterangan || null,
            bukti: p.bukti || null,
          },
        });
        eventsCreated++;
      } catch (err: any) {
        if (err.code === "P2002") {
          eventsSkipped++; // Duplicate — idempotency guard caught it
        } else {
          console.error(`  Error creating IN event for ${p.id}:`, err.message);
        }
      }
    }

    if (p.jamPulang) {
      try {
        await db.attendanceRawEvent.create({
          data: {
            pegawaiId: p.pegawaiId,
            eventType: "OUT",
            occurredAt: p.jamPulang,
            verificationMethod: "backfill",
            sourceRef: `legacy-presensi:${p.id}`,
          },
        });
        eventsCreated++;
      } catch (err: any) {
        if (err.code === "P2002") {
          eventsSkipped++;
        } else {
          console.error(`  Error creating OUT event for ${p.id}:`, err.message);
        }
      }
    }

    // ── Create daily summary ──
    const dateOnly = new Date(p.tanggal);
    dateOnly.setUTCHours(0, 0, 0, 0);

    // Map legacy PresensiStatus to AttendanceStatus
    const statusMap: Record<string, string> = {
      HADIR: "HADIR",
      IZIN: "IZIN",
      SAKIT: "SAKIT",
      ALFA: "ALFA",
    };
    const mappedStatus = statusMap[p.status] || "ALFA";

    // Determine resolution source from legacy data
    const resolutionSource =
      p.status === "ALFA" ? "AUTO_ABSENT" :
      p.status === "IZIN" ? "LEAVE_APPROVAL" :
      p.status === "SAKIT" ? "LEAVE_APPROVAL" :
      "RAW_EVENT";

    try {
      await db.dailyAttendanceSummary.create({
        data: {
          pegawaiId: p.pegawaiId,
          date: dateOnly,
          status: mappedStatus as any,
          resolutionSource: resolutionSource as any,
          checkInTime: p.jamDatang || null,
          checkOutTime: p.jamPulang || null,
          isFinalized: true,
          finalizedAt: p.createdAt,
          keterangan: p.keterangan || null,
        },
      });
      summariesCreated++;
    } catch (err: any) {
      if (err.code === "P2002") {
        summariesSkipped++; // Already exists for this pegawai+date
      } else {
        console.error(`  Error creating summary for ${p.id}:`, err.message);
      }
    }
  }

  console.log("=== Backfill Complete ===");
  console.log(`Raw Events:  ${eventsCreated} created, ${eventsSkipped} skipped (duplicates)`);
  console.log(`Summaries:   ${summariesCreated} created, ${summariesSkipped} skipped (duplicates)`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
