import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Portal middleware — classifier only.
 * No auth checks. Portal is a public landing page that redirects
 * users to each app's own login.
 *
 * Subdomain detection still works for production:
 * tu.sekolahasy.com → redirect to TU app
 * radig.sekolahasy.com → redirect to RADIG app
 * guru.sekolahasy.com → redirect to Guru app (future)
 * wali.sekolahasy.com → redirect to Wali app (future)
 */

const SUBDOMAIN_URL_MAP: Record<string, string> = {
  tu: process.env.NEXT_PUBLIC_TU_URL || "http://localhost:3001",
  radig: process.env.NEXT_PUBLIC_RADIG_URL || "http://localhost:3002",
  guru: process.env.NEXT_PUBLIC_GURU_URL || "http://localhost:3003",
  wali: process.env.NEXT_PUBLIC_WALI_URL || "http://localhost:3004",
};

export function middleware(request: NextRequest) {
  const { hostname } = request.nextUrl;

  // Subdomain detection (production)
  const subdomain = hostname.split(".")[0];

  if (subdomain && subdomain in SUBDOMAIN_URL_MAP && subdomain !== "portal" && subdomain !== "localhost" && subdomain !== "www") {
    // Redirect to the app's URL
    return NextResponse.redirect(SUBDOMAIN_URL_MAP[subdomain]);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)",
  ],
};
