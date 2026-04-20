import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { triggerSync } from "@/lib/sync";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

/**
 * GET /api/guru — List all guru/admin users
 * POST /api/guru — Create new guru/admin user + trigger sync
 */

// GET: List users (with optional role filter)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const role = searchParams.get("role");
  const q = searchParams.get("q");

  const where: any = {};
  if (role) where.role = role;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { nip: { contains: q } },
    ];
  }

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      nip: true,
      email: true,
      phone: true,
      isActive: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

// POST: Create new user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only RADIG role (admin) can create users
  const currentRole = (session.user as any).role;
  if (currentRole !== "RADIG") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { username, name, nip, role, password, email, phone } = body;

    if (!username || !name || !role) {
      return NextResponse.json(
        { error: "Username, nama, dan role wajib diisi" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["RADIG", "TU", "Guru"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password || "Smpit2026", 12);

    const user = await db.user.create({
      data: {
        username,
        name,
        nip: nip || null,
        role: role as Role,
        hashedPassword,
        email: email || null,
        phone: phone || null,
        isActive: true,
      },
    });

    // Trigger sync to TU + RADIG
    await triggerSync("user.created", {
      id: user.id,
      username: user.username,
      name: user.name,
      nip: user.nip,
      role: user.role,
      hashedPassword: user.hashedPassword,
      isActive: user.isActive,
    });

    return NextResponse.json(
      { ...user, hashedPassword: undefined },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return NextResponse.json(
        { error: `${field} sudah digunakan` },
        { status: 409 }
      );
    }
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
