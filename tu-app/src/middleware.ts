import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PORTAL_LOGIN = process.env.NEXT_PUBLIC_PORTAL_URL
  ? `${process.env.NEXT_PUBLIC_PORTAL_URL}/login`
  : "http://portal.localhost/login";

/**
 * TU App middleware:
 * - Allow /login (for SSO callback), /api, /static routes
 * - Redirect unauthenticated to Portal login (SSO gateway)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (login kept for SSO callback handling)
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/presensi/checkin")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    // Redirect to Portal login — SSO is the only way in
    return NextResponse.redirect(PORTAL_LOGIN);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
