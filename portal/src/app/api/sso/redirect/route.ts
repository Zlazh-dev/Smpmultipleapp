import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSSOToken } from "@/lib/sso-utils";

const appUrls: Record<string, string | undefined> = {
  tu: process.env.NEXT_PUBLIC_TU_URL || "http://tu.localhost",
  radig: process.env.NEXT_PUBLIC_RADIG_URL || "http://radig.localhost",
};

const appSSOPaths: Record<string, string> = {
  tu: "/api/sso",
  radig: "/sso_login.php",
};

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const app = searchParams.get("app")?.toLowerCase();

  if (!app || !appUrls[app]) {
    return NextResponse.json({ error: "Invalid app parameter" }, { status: 400 });
  }

  const user = session.user as any;
  const token = await generateSSOToken({
    sub: user.id,
    portalUserId: user.id,
    username: user.username,
    nip: user.nip || null,
    name: user.name,
    role: user.role,
  });

  const targetUrl = `${appUrls[app]}${appSSOPaths[app]}?token=${encodeURIComponent(token)}`;

  return NextResponse.redirect(targetUrl);
}
