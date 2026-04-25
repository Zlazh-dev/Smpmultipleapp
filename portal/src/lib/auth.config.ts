import type { NextAuthConfig } from "next-auth";

/**
 * Auth config WITHOUT any Node.js-only imports (no Prisma, no pg, no bcrypt).
 * This is safe to use in Edge runtime (middleware).
 */
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "portal.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // Providers are added in auth.ts (Node.js runtime only)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role;
        token.nip = (user as any).nip;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).nip = token.nip;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
};
