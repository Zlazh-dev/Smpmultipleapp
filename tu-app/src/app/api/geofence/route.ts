import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

// GET: Get current geofence settings
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let settings = await db.geofenceSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      // Create default settings
      settings = await db.geofenceSettings.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Geofence GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH: Update geofence settings (KHUSUS only)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.accessLevel !== "KHUSUS") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();

    const settings = await db.geofenceSettings.upsert({
      where: { id: "default" },
      update: {
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
        ...(body.radius !== undefined && { radius: body.radius }),
        ...(body.namaLokasi !== undefined && { namaLokasi: body.namaLokasi }),
        ...(body.jamMasuk !== undefined && { jamMasuk: body.jamMasuk }),
        ...(body.jamPulang !== undefined && { jamPulang: body.jamPulang }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      create: { id: "default", ...body },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Geofence PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
