import { SignJWT, jwtVerify } from "jose";

const SSO_SECRET = process.env.SSO_JWT_SECRET || process.env.NEXTAUTH_SECRET || "dev-sso-secret";
const secret = new TextEncoder().encode(SSO_SECRET);

export interface SSOTokenPayload {
  sub: string;          // Portal user ID (cuid)
  portalUserId: string; // Explicit Portal user ID for cross-app linking
  username: string;     // Username (fallback match key)
  nip: string | null;   // NIP (secondary match key)
  name: string | null;
  role: string;         // TU, RADIG, Guru, WaliSantri
}

/**
 * Generate a short-lived SSO JWT token for cross-app authentication.
 * Token expires in 60 seconds — only used for one-time redirect.
 */
export async function generateSSOToken(payload: SSOTokenPayload): Promise<string> {
  return new SignJWT({
    portalUserId: payload.sub,
    username: payload.username,
    nip: payload.nip,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("60s")
    .setIssuer("portal-smpit")
    .sign(secret);
}

/**
 * Verify an SSO JWT token. Used by receiving apps.
 */
export async function verifySSOToken(token: string): Promise<SSOTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: "portal-smpit",
    });

    return {
      sub: payload.sub as string,
      portalUserId: (payload.portalUserId as string) || (payload.sub as string),
      username: payload.username as string,
      nip: (payload.nip as string) || null,
      name: (payload.name as string) || null,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}
