import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Portal middleware — simple, no NextAuth wrapper.
 * Auth is handled by NextAuth's authorized() callback in auth.config.ts
 * which is invoked automatically by the NextAuth route handler.
 * 
 * This middleware only handles:
 * 1. Subdomain detection
 * 2. No-cache headers on protected pages
 */

const SUBDOMAIN_URL_MAP: Record<string, string> = {
  tu: process.env.NEXT_PUBLIC_TU_URL || "http://localhost:3001",
  radig: process.env.NEXT_PUBLIC_RADIG_URL || "http://localhost:3002",
  guru: process.env.NEXT_PUBLIC_GURU_URL || "http://localhost:3003",
  wali: process.env.NEXT_PUBLIC_WALI_URL || "http://localhost:3004",
};

export function middleware(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

  // Subdomain detection (production)
  const subdomain = hostname.split(".")[0];
  if (
    subdomain &&
    subdomain in SUBDOMAIN_URL_MAP &&
    subdomain !== "portal" &&
    subdomain !== "localhost" &&
    subdomain !== "www"
  ) {
    return NextResponse.redirect(SUBDOMAIN_URL_MAP[subdomain]);
  }

  // No-cache on dashboard pages (prevents back-button after logout)
  if (pathname.startsWith("/dashboard")) {
    // Check session using the correct cookie name from auth.config.ts
    const hasSession = request.cookies.has("portal.session-token");

    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate, private");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)",
  ],
};
