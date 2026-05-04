import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/config";
import { AdminNav } from "@/components/admin/admin-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Console",
  description: "Admin Console — Kelola pengguna, roles, dan pengaturan sistem.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdminRole(session.user.role)) {
    redirect("/hub");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
