import { NextResponse } from "next/server";

/**
 * GET /api/auth/logout
 * Clears the TU session cookie and redirects to Portal login.
 * Called when user logs out from Portal to ensure TU session is also invalidated.
 */
export async function GET() {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || "http://portal.localhost";

  const response = NextResponse.redirect(`${portalUrl}/login?pesan=logout`);

  // Clear all possible session cookies
  response.cookies.delete("tu.session-token");
  response.cookies.delete("authjs.session-token");
  response.cookies.delete("__Secure-authjs.session-token");

  // No-cache headers
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate, private");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}
