import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { encode } from "next-auth/jwt";

const SSO_SECRET = process.env.SSO_JWT_SECRET || process.env.NEXTAUTH_SECRET || "dev-sso-secret";
const secret = new TextEncoder().encode(SSO_SECRET);

// Use NEXTAUTH_URL for redirects since request.url inside Docker returns internal 0.0.0.0:3000
const BASE_URL = process.env.NEXTAUTH_URL || "http://tu.localhost";
const PORTAL_DASHBOARD = process.env.NEXT_PUBLIC_PORTAL_URL
  ? `${process.env.NEXT_PUBLIC_PORTAL_URL}/dashboard`
  : "http://localhost:3000/dashboard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(PORTAL_DASHBOARD);
  }

  // 1. Verify JWT
  let payload;
  try {
    const result = await jwtVerify(token, secret, { issuer: "portal-smpit" });
    payload = result.payload;
  } catch (err) {
    console.error("SSO JWT verify failed:", err);
    return NextResponse.redirect(PORTAL_DASHBOARD);
  }

  const portalUserId = (payload.portalUserId as string) || (payload.sub as string);
  const nip = payload.nip as string | null;
  const username = payload.username as string;
  const name = payload.name as string | null;
  const role = payload.role as string;

  if (!username || !portalUserId) {
    return NextResponse.redirect(PORTAL_DASHBOARD);
  }

  // 2. Find Pegawai: portalUserId (primary) → NIP → username (fallback)
  let pegawai = null;

  // Tier 1: lookup by portalUserId (already linked)
  pegawai = await db.pegawai.findUnique({ where: { portalUserId } });

  // Tier 2: lookup by NIP
  if (!pegawai && nip) {
    pegawai = await db.pegawai.findUnique({ where: { nip } });
    if (pegawai && !pegawai.portalUserId) {
      // Auto-link portalUserId
      await db.pegawai.update({
        where: { id: pegawai.id },
        data: { portalUserId },
      });
      console.log(`SSO: Auto-linked portalUserId='${portalUserId}' to Pegawai nip='${nip}'`);
    }
  }

  // Tier 3: lookup by username
  if (!pegawai) {
    pegawai = await db.pegawai.findUnique({ where: { username } });
    if (pegawai && !pegawai.portalUserId) {
      // Auto-link portalUserId
      await db.pegawai.update({
        where: { id: pegawai.id },
        data: { portalUserId },
      });
      console.log(`SSO: Auto-linked portalUserId='${portalUserId}' to Pegawai username='${username}'`);
    }
  }

  // 3. Auto-create if not found
  if (!pegawai) {
    // Map Portal role to TU accessLevel
    // RADIG (superadmin/admin) or TU → KHUSUS (full access)
    // Guru/WaliSantri → UMUM (basic access)
    const isAdmin = role === "RADIG" || role === "TU";
    const tuAccessLevel = isAdmin ? "KHUSUS" : "UMUM";
    const tuJabatan = isAdmin ? "Admin" : role === "TU" ? "Tata Usaha" : "Guru";

    try {
      pegawai = await db.pegawai.create({
        data: {
          nip: nip || username,
          namaLengkap: name || username,
          username: username,
          jabatan: tuJabatan,
          accessLevel: tuAccessLevel,
          portalUserId: portalUserId,
        },
      });
      console.log(`SSO auto-created Pegawai: ${pegawai.namaLengkap} (${pegawai.username}) portalUserId=${portalUserId}`);
    } catch (err) {
      console.error("SSO auto-create failed:", err);
      return NextResponse.redirect(PORTAL_DASHBOARD);
    }
  }

  // 4. Create NextAuth session by setting the session cookie
  const nextAuthSecret = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";

  // Use non-secure cookie for HTTP environments (Docker local dev)
  // In production with HTTPS, switch to __Secure- prefix
  const useSecureCookie = BASE_URL.startsWith("https://");
  const cookieName = useSecureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const sessionToken = await encode({
    token: {
      id: pegawai.id,
      email: pegawai.username,
      name: pegawai.namaLengkap,
      accessLevel: pegawai.accessLevel,
      jabatan: pegawai.jabatan,
      sub: pegawai.id,
    },
    secret: nextAuthSecret,
    salt: cookieName,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  // 5. Set the session cookie and redirect to dashboard
  const response = NextResponse.redirect(`${BASE_URL}/dashboard`);

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookie,
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
