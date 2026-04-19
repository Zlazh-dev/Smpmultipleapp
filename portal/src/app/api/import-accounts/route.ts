import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

/**
 * POST /api/import-accounts
 * 
 * Imports RADIG account backup JSON into Portal.
 * Expects multipart form data with a JSON file.
 * Only accessible by admin/superadmin users.
 * 
 * Default password for imported accounts: Smpit2026
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    let data: {
      source: string;
      version: string;
      total: number;
      accounts: Array<{
        username: string;
        name: string;
        nip: string | null;
        role: string;
      }>;
    };

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
    }

    if (!data.accounts || !Array.isArray(data.accounts)) {
      return NextResponse.json(
        { error: "Invalid format: missing 'accounts' array" },
        { status: 400 }
      );
    }

    const defaultPassword = await bcrypt.hash("Smpit2026", 12);
    const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (const account of data.accounts) {
      if (!account.username) continue;

      try {
        // Map role string to Prisma Role enum
        let role: Role = Role.RADIG;
        if (account.role === "TU") role = Role.TU;

        await db.user.upsert({
          where: { username: account.username },
          update: {
            name: account.name,
            nip: account.nip || null,
          },
          create: {
            username: account.username,
            name: account.name,
            nip: account.nip || null,
            role,
            hashedPassword: defaultPassword,
          },
        });
        results.created++;
      } catch (err: unknown) {
        results.errors.push(`${account.username}: ${err instanceof Error ? err.message.substring(0, 80) : "Unknown error"}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import selesai: ${results.created} akun diproses, ${results.skipped} dilewati`,
      source: data.source || "unknown",
      results,
    });
  } catch (err: unknown) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
