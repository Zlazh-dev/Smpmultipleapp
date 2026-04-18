import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PresensiStatus } from "@prisma/client";

// GET /api/presensi?tanggal=2026-04-17
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tanggal = searchParams.get("tanggal");

  const filterDate = tanggal ? new Date(tanggal) : new Date();
  filterDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(filterDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const presensi = await db.presensi.findMany({
    where: { tanggal: { gte: filterDate, lt: nextDay } },
    include: {
      pegawai: { select: { namaLengkap: true, nip: true, jabatan: true } },
    },
    orderBy: { pegawai: { namaLengkap: "asc" } },
  });

  return NextResponse.json(presensi);
}

// Haversine distance calculation (meters)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/presensi — manual, QR scan, or geofenced check-in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pegawaiId, nip, status, keterangan, bukti, latitude, longitude } = body;

    // Resolve pegawaiId from NIP if not provided
    let resolvedPegawaiId = pegawaiId;
    if (!resolvedPegawaiId && nip) {
      const pegawai = await db.pegawai.findUnique({ where: { nip } });
      if (!pegawai) {
        return NextResponse.json({ error: "NIP tidak ditemukan" }, { status: 404 });
      }
      resolvedPegawaiId = pegawai.id;
    }

    if (!resolvedPegawaiId) {
      return NextResponse.json({ error: "pegawaiId atau nip wajib diisi" }, { status: 400 });
    }

    // Geofence validation (if enabled and lat/lng provided)
    if (latitude !== undefined && longitude !== undefined) {
      const geoSettings = await db.geofenceSettings.findUnique({ where: { id: "default" } });
      if (geoSettings && geoSettings.isActive) {
        const distance = haversineDistance(
          geoSettings.latitude, geoSettings.longitude,
          latitude, longitude
        );
        if (distance > geoSettings.radius) {
          return NextResponse.json({
            error: `Anda berada di luar area sekolah (${Math.round(distance)}m dari lokasi). Radius maksimal: ${geoSettings.radius}m`,
            distance: Math.round(distance),
            maxRadius: geoSettings.radius,
          }, { status: 403 });
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const presensi = await db.presensi.upsert({
      where: {
        pegawaiId_tanggal: { pegawaiId: resolvedPegawaiId, tanggal: today },
      },
      update: {
        status: (status as PresensiStatus) || "HADIR",
        keterangan: keterangan || (latitude ? `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : undefined),
        bukti,
      },
      create: {
        pegawaiId: resolvedPegawaiId,
        tanggal: today,
        status: (status as PresensiStatus) || "HADIR",
        keterangan: keterangan || (latitude ? `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : undefined),
        bukti,
      },
      include: {
        pegawai: { select: { namaLengkap: true, nip: true } },
      },
    });

    return NextResponse.json(presensi, { status: 201 });
  } catch (error) {
    console.error("Presensi error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
