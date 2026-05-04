import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * AsyHub middleware — simple, no NextAuth wrapper.
 * Auth is handled by NextAuth's authorized() callback in auth.config.ts
 * which is invoked automatically by the NextAuth route handler.
 * 
 * This middleware handles:
 * 1. Subdomain detection (production)
 * 2. No-cache headers on protected /hub pages
 * 3. Legacy /dashboard redirect to /hub
 */

const SUBDOMAIN_URL_MAP: Record<string, string> = {
  tu: process.env.NEXT_PUBLIC_TU_URL || "http://localhost:3001",
  radig: process.env.NEXT_PUBLIC_RADIG_URL || "http://localhost:3002",
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

  // Legacy /dashboard redirect → /hub
  if (pathname.startsWith("/dashboard")) {
    const newPath = pathname.replace("/dashboard", "/hub");
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Legacy dead-end routes → /hub
  if (pathname === "/guru" || pathname === "/wali") {
    return NextResponse.redirect(new URL("/hub", request.url));
  }

  // Protect /hub routes (require session)
  if (pathname.startsWith("/hub")) {
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
