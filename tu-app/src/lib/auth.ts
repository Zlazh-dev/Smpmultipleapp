import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";

const DEFAULT_PASSWORD = process.env.TU_DEFAULT_PASSWORD || "123456";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;

        if (!username || !password) return null;

        const pegawai = await db.pegawai.findUnique({
          where: { username },
          select: { id: true, username: true, namaLengkap: true, role: true, jabatan: true },
        });

        if (!pegawai) return null;
        if (password !== DEFAULT_PASSWORD) return null;

        return {
          id: pegawai.id,
          email: pegawai.username, // NextAuth requires email field, we store username here
          name: pegawai.namaLengkap,
          role: pegawai.role,
          jabatan: pegawai.jabatan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.jabatan = (user as any).jabatan;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).jabatan = token.jabatan;
      }
      return session;
    },
  },
});
