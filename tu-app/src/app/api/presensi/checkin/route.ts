import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { resolveDay, upsertDailySummary } from "@/lib/attendance-engine";

// Haversine distance (meters)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/presensi/checkin — QR scan check-in/check-out
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

    const body = await req.json();
    const { latitude, longitude } = body;

    // Get geofence settings
    const geoSettings = await db.geofenceSettings.findUnique({ where: { id: "default" } });

    // ── System Toggle: Block if presensi system is deactivated ──
    if (geoSettings && !geoSettings.isActive) {
      return NextResponse.json({
        error: "Sistem presensi sedang dinonaktifkan oleh administrator.",
        type: "SYSTEM_INACTIVE",
      }, { status: 403 });
    }

    // Compute geofence result for raw event metadata
    let isWithinGeofence: boolean | null = null;
    if (geoSettings?.isActive && latitude !== undefined && longitude !== undefined) {
      const distance = haversineDistance(geoSettings.latitude, geoSettings.longitude, latitude, longitude);
      isWithinGeofence = distance <= geoSettings.radius;
      if (!isWithinGeofence) {
        return NextResponse.json({
          error: `Anda di luar area sekolah (${Math.round(distance)}m). Maks: ${geoSettings.radius}m`,
          type: "GEOFENCE_ERROR",
          distance: Math.round(distance),
        }, { status: 403 });
      }
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Check existing presensi today
    const existing = await db.presensi.findUnique({
      where: { pegawaiId_tanggal: { pegawaiId: user.id, tanggal: today } },
    });

    if (!existing) {
      // === CHECK-IN ===
      const presensi = await db.presensi.create({
        data: {
          pegawaiId: user.id,
          tanggal: today,
          status: "HADIR",
          jamDatang: now,
          keterangan: latitude ? `Check-in GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "Check-in via QR",
        },
        include: { pegawai: { select: { namaLengkap: true } } },
      });

      // ── DUAL-WRITE: New CQRS tables ──
      try {
        await db.attendanceRawEvent.create({
          data: {
            pegawaiId: user.id,
            eventType: "IN",
            occurredAt: now,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
            isWithinGeofence,
            verificationMethod: latitude ? "gps" : "qr",
            sourceRef: "checkin-page",
          },
        });
        const resolved = await resolveDay(user.id, today);
        await upsertDailySummary(user.id, today, resolved);
      } catch (dualWriteErr) {
        // Log but do not fail the primary check-in
        console.error("Dual-write (IN) error:", dualWriteErr);
      }

      return NextResponse.json({
        type: "CHECK_IN",
        message: `Selamat datang, ${presensi.pegawai.namaLengkap}!`,
        jamDatang: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      });
    }

    if (existing.jamPulang) {
      // Already checked out
      return NextResponse.json({
        type: "ALREADY_DONE",
        message: "Anda sudah check-in dan check-out hari ini",
        jamDatang: existing.jamDatang?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        jamPulang: existing.jamPulang.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      });
    }

    // === CHECK-OUT — validate timing ===
    if (geoSettings) {
      const [pulangH, pulangM] = geoSettings.jamPulang.split(":").map(Number);
      const pulangTime = new Date(today);
      pulangTime.setHours(pulangH, pulangM, 0, 0);

      const minsBeforePulang = (pulangTime.getTime() - now.getTime()) / (1000 * 60);

      if (minsBeforePulang > 5) {
        // Still more than 5 minutes before jamPulang → reject
        return NextResponse.json({
          type: "TOO_EARLY",
          error: `Belum bisa check-out. Tunggu hingga ${geoSettings.jamPulang} (${Math.ceil(minsBeforePulang)} menit lagi)`,
          jamPulangSetting: geoSettings.jamPulang,
          minsRemaining: Math.ceil(minsBeforePulang),
        }, { status: 403 });
      }
    }

    // Allowed to check-out
    const updated = await db.presensi.update({
      where: { id: existing.id },
      data: {
        jamPulang: now,
        keterangan: existing.keterangan + ` | Check-out GPS: ${latitude?.toFixed(6) || "-"}, ${longitude?.toFixed(6) || "-"}`,
      },
      include: { pegawai: { select: { namaLengkap: true } } },
    });

    // ── DUAL-WRITE: New CQRS tables ──
    try {
      await db.attendanceRawEvent.create({
        data: {
          pegawaiId: user.id,
          eventType: "OUT",
          occurredAt: now,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          isWithinGeofence,
          verificationMethod: latitude ? "gps" : "qr",
          sourceRef: "checkin-page",
        },
      });
      const resolved = await resolveDay(user.id, today);
      await upsertDailySummary(user.id, today, resolved);
    } catch (dualWriteErr) {
      console.error("Dual-write (OUT) error:", dualWriteErr);
    }

    return NextResponse.json({
      type: "CHECK_OUT",
      message: `Sampai jumpa, ${updated.pegawai.namaLengkap}! Check-out berhasil.`,
      jamDatang: existing.jamDatang?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      jamPulang: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (error) {
    console.error("Checkin error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
