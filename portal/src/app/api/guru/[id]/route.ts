import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { triggerSync } from "@/lib/sync";
import { Role } from "@prisma/client";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/guru/[id] — Update user + trigger sync
 * DELETE /api/guru/[id] — Delete user + trigger sync
 */

// PATCH: Update user
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "RADIG") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data: any = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.nip !== undefined) data.nip = body.nip || null;
    if (body.role !== undefined && ["RADIG", "TU", "Guru"].includes(body.role)) {
      data.role = body.role as Role;
    }
    if (body.email !== undefined) data.email = body.email || null;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const user = await db.user.update({
      where: { id },
      data,
    });

    // Trigger sync
    await triggerSync("user.updated", {
      id: user.id,
      username: user.username,
      name: user.name,
      nip: user.nip,
      role: user.role,
      hashedPassword: user.hashedPassword,
      isActive: user.isActive,
    });

    return NextResponse.json({ ...user, hashedPassword: undefined });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "NIP sudah digunakan" }, { status: 409 });
    }
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete user
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "RADIG") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Prevent deleting yourself
    if (user.id === (session.user as any).id) {
      return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
    }

    await db.user.delete({ where: { id } });

    // Trigger sync deletion
    await triggerSync("user.deleted", {
      id: user.id,
      username: user.username,
      name: user.name,
      nip: user.nip,
      role: user.role,
      hashedPassword: user.hashedPassword,
      isActive: false,
    });

    return NextResponse.json({ message: "User berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
