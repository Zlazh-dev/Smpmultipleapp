import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  // AsyOps is the admin/backoffice product — KHUSUS only.
  // UMUM (Guru) users belong in AsyTeach, not here.
  if (user.accessLevel !== "KHUSUS") {
    return redirect("/teach/home");
  }

  const role = user.accessLevel;

  // Get pending cuti count for sidebar badge (only for KHUSUS/admin)
  let pendingCutiCount = 0;
  if (role === "KHUSUS") {
    pendingCutiCount = await db.cuti.count({ where: { status: "PENDING" } });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <AppSidebar role={role} userId={user?.id} pendingCutiCount={pendingCutiCount} />
      </div>

      {/* Main content — headerless on mobile */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav role={role} userId={user?.id} />

      {/* Floating theme toggle (mobile only) */}
      <FloatingThemeToggle />
    </div>
  );
}
