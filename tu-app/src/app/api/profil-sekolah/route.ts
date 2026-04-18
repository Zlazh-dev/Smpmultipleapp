import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

// GET: Get school profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let profil = await db.profilSekolah.findUnique({ where: { id: "default" } });
    if (!profil) {
      profil = await db.profilSekolah.create({ data: { id: "default" } });
    }
    return NextResponse.json(profil);
  } catch (error) {
    console.error("Profil GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH: Update school profile (KHUSUS only)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "KHUSUS") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const profil = await db.profilSekolah.upsert({
      where: { id: "default" },
      update: body,
      create: { id: "default", ...body },
    });

    return NextResponse.json(profil);
  } catch (error) {
    console.error("Profil PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
