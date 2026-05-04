import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * GET /api/face/enrolled-photo/[enrollmentId]?type=pending|approved
 * Serve face enrollment photos from disk.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const { enrollmentId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "approved";

    const enrollment = await db.faceEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { approvedPhotoUrl: true, pendingPhotoUrl: true },
    });

    const photoPath = type === "pending"
      ? enrollment?.pendingPhotoUrl
      : enrollment?.approvedPhotoUrl;

    if (!photoPath) {
      return NextResponse.json({ error: "No photo" }, { status: 404 });
    }

    // Handle legacy base64 data URLs still in DB (migration period)
    if (photoPath.startsWith("data:image/")) {
      const match = photoPath.match(/^data:image\/(jpeg|png|jpg);base64,(.+)$/);
      if (match) {
        const buffer = Buffer.from(match[2], "base64");
        const mime = match[1] === "png" ? "image/png" : "image/jpeg";
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": mime,
            "Cache-Control": "private, max-age=60",
          },
        });
      }
    }

    // File-based path
    const filePath = join(process.cwd(), photoPath);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = await readFile(filePath);
    const ext = photoPath.split(".").pop()?.toLowerCase();
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
    console.error("Enrolled photo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
