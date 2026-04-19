import { NextResponse } from "next/server";
import { roleLabels, subdomainMap } from "@/lib/config";

export async function GET() {
  const roles = Object.entries(roleLabels).map(([key, label]) => ({
    key,
    label,
    url: subdomainMap[key as keyof typeof subdomainMap],
  }));

  return NextResponse.json({ roles });
}
