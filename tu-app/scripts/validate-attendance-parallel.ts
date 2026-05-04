/**
 * Parallel-Run Validation Script: Presensi vs DailyAttendanceSummary
 * 
 * Run with: npx tsx scripts/validate-attendance-parallel.ts
 * Requires DATABASE_URL environment variable.
 * 
 * This script compares the legacy Presensi table against the new 
 * DailyAttendanceSummary table to ensure the resolution engine is 
 * working correctly and to identify any discrepancies.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("=== Attendance Parallel-Run Validation ===\n");

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  console.log(`Analyzing data from ${thirtyDaysAgo.toISOString().split('T')[0]} to today...\n`);

  // 1. Get all legacy Presensi records for the period
  const legacyRecords = await db.presensi.findMany({
    where: {
      tanggal: { gte: thirtyDaysAgo }
    },
    include: {
      pegawai: { select: { namaLengkap: true } }
    }
  });

  // 2. Get all DailyAttendanceSummary records for the period
  const newRecords = await db.dailyAttendanceSummary.findMany({
    where: {
      date: { gte: thirtyDaysAgo }
    },
    include: {
      pegawai: { select: { namaLengkap: true } }
    }
  });

  // 3. Get all active UMUM employees
  const activeUmum = await db.pegawai.findMany({
    where: { accessLevel: "UMUM" },
    select: { id: true, namaLengkap: true }
  });

  console.log(`Found ${legacyRecords.length} legacy records and ${newRecords.length} new summaries.`);
  console.log(`Active UMUM employees: ${activeUmum.length}\n`);

  // --- Aggregate Totals ---
  const legacyTotals = { HADIR: 0, IZIN: 0, SAKIT: 0, ALFA: 0 };
  for (const r of legacyRecords) {
    if (r.status in legacyTotals) {
      legacyTotals[r.status as keyof typeof legacyTotals]++;
    }
  }

  const newTotals = { HADIR: 0, IZIN: 0, SAKIT: 0, ALFA: 0, LIBUR: 0 };
  for (const r of newRecords) {
    if (r.status in newTotals) {
      newTotals[r.status as keyof typeof newTotals]++;
    }
  }

  console.log("--- Aggregate Status Totals ---");
  console.log("Legacy Presensi:");
  console.table(legacyTotals);
  console.log("New DailyAttendanceSummary:");
  console.table(newTotals);
  console.log("\nNote: New system explicitly models LIBUR; legacy did not.\n");

  // --- Discrepancy Analysis ---
  console.log("--- Discrepancy Analysis (Last 7 Days) ---");
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  let expectedImprovements = 0;
  let mustMatchBlockers = 0;
  let missingSummaries = 0;
  
  // Create lookup maps for the last 7 days
  const legacyMap = new Map<string, typeof legacyRecords[0]>();
  for (const r of legacyRecords) {
    if (r.tanggal >= sevenDaysAgo) {
      const dateStr = r.tanggal.toISOString().split('T')[0];
      legacyMap.set(`${r.pegawaiId}_${dateStr}`, r);
    }
  }

  const newMap = new Map<string, typeof newRecords[0]>();
  for (const r of newRecords) {
    if (r.date >= sevenDaysAgo) {
      const dateStr = r.date.toISOString().split('T')[0];
      newMap.set(`${r.pegawaiId}_${dateStr}`, r);
    }
  }

  // Iterate over every employee for every date in the last 7 days
  for (let d = new Date(sevenDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    
    for (const emp of activeUmum) {
      const key = `${emp.id}_${dateStr}`;
      const legacy = legacyMap.get(key);
      const summary = newMap.get(key);

      // 1. Missing Summary Blocker
      // If it's not today (cron hasn't run yet for today), every UMUM employee should have a summary
      const isToday = dateStr === today.toISOString().split('T')[0];
      if (!isToday && !summary) {
        missingSummaries++;
        console.log(`[BLOCKER] Missing Summary: ${emp.namaLengkap} on ${dateStr}`);
        continue;
      }

      if (!legacy && !summary) continue;

      const legacyStatus = legacy ? legacy.status : "NO_RECORD";
      const newStatus = summary ? summary.status : "NOT_FINALIZED";

      if (legacyStatus !== newStatus) {
        // Categorize the discrepancy
        
        if (legacyStatus === "NO_RECORD" && newStatus === "LIBUR") {
          expectedImprovements++; // Engine correctly identified holiday/weekend
        } 
        else if (legacyStatus === "NO_RECORD" && newStatus === "ALFA") {
          expectedImprovements++; // Engine correctly auto-alpha'd a missing check-in
        }
        else if (legacyStatus === "ALFA" && newStatus === "ALFA") {
           // Both agree (maybe admin manually clicked in legacy, cron caught it in new)
        }
        else if (legacyStatus === "HADIR" && (newStatus === "ALFA" || newStatus === "LIBUR")) {
          mustMatchBlockers++;
          console.log(`[BLOCKER] Physical check-in lost/ignored: ${emp.namaLengkap} on ${dateStr} (Legacy: ${legacyStatus}, New: ${newStatus})`);
        }
        else if ((legacyStatus === "IZIN" || legacyStatus === "SAKIT") && newStatus === "ALFA") {
          // This happens if admin manually inserted IZIN into Presensi without a Cuti request.
          // The new engine enforces Cuti requests. This is an expected process improvement, 
          // but worth noting.
          expectedImprovements++;
        }
        else if (newStatus === "NOT_FINALIZED") {
            // Expected for today
        }
        else {
          // Unknown discrepancy
          console.log(`[INVESTIGATE] ${emp.namaLengkap} on ${dateStr}: Legacy = ${legacyStatus}, New = ${newStatus}`);
        }
      }
    }
  }

  console.log("\n--- Audit Summary (Last 7 Days) ---");
  console.log(`Expected Improvements (Better accuracy): ${expectedImprovements}`);
  console.log(`Must-Match Blockers (Critical bugs):     ${mustMatchBlockers}`);
  console.log(`Missing Summaries (Cron failures):       ${missingSummaries}`);

  if (mustMatchBlockers === 0 && missingSummaries === 0) {
    console.log("\n✅ PASS: No blocking discrepancies found in the recent parallel run.");
  } else {
    console.log("\n❌ FAIL: Blockers detected. Please investigate before cutover.");
  }

  await db.$disconnect();
}

main().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
