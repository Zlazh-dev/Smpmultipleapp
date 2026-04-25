import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * GET /api/face/photo/[pegawaiId]
 * Serve the face photo image for a pegawai.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pegawaiId: string }> }
) {
  try {
    const { pegawaiId } = await params;

    const pegawai = await db.pegawai.findUnique({
      where: { id: pegawaiId },
      select: { facePhoto: true },
    });

    if (!pegawai?.facePhoto) {
      return NextResponse.json({ error: "No photo" }, { status: 404 });
    }

    const filePath = join(process.cwd(), pegawai.facePhoto);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = await readFile(filePath);
    const ext = pegawai.facePhoto.split(".").pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeMap[ext || "jpg"] || "image/jpeg",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("Face photo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
