import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PORTAL_DASHBOARD = process.env.NEXT_PUBLIC_PORTAL_URL
  ? `${process.env.NEXT_PUBLIC_PORTAL_URL}/dashboard`
  : "http://localhost:3000/dashboard";

/**
 * TU App middleware:
 * - Allow /api (includes SSO callback), /static routes
 * - Redirect unauthenticated users to Portal dashboard (SSO gateway)
 * - No standalone login — SSO is the only way in
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/presensi/checkin")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (SSO sets "tu.session-token", NextAuth may use "authjs.session-token")
  const hasSession =
    request.cookies.has("tu.session-token") ||
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    // No session → redirect to Portal dashboard (user must SSO from there)
    return NextResponse.redirect(PORTAL_DASHBOARD);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
