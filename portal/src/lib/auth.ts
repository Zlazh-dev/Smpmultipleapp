import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { authConfig } from "@/lib/auth.config";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name: string | null;
      role: Role;
      nip: string | null;
      image: string | null;
    };
  }

  interface User {
    role: Role;
    nip: string | null;
    username: string;
  }
}

/**
 * Full auth config with Node.js providers (Prisma + bcrypt).
 * NOT safe for Edge runtime — only use in server components, actions, and API routes.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { username: parsed.data.username },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.hashedPassword
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.username, // NextAuth requires email internally
          username: user.username,
          name: user.name,
          role: user.role,
          nip: user.nip,
          image: user.image,
        };
      },
    }),
  ],
});
