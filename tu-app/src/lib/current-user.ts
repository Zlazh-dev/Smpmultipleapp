import { auth } from "@/lib/auth";

export type UserRole = "KHUSUS" | "UMUM";

export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  jabatan: string;
}

/** Get current user from server session */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  return {
    id: session.user.id as string,
    name: session.user.name || "",
    username: session.user.email || "", // username stored in email field
    role: ((session.user as any).role || "UMUM") as UserRole,
    jabatan: (session.user as any).jabatan || "",
  };
}

/** Check if user has KHUSUS role */
export async function isKhusus(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "KHUSUS";
}
