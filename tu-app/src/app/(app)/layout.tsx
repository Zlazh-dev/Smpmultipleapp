import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { MobileHeader } from "@/components/mobile-header";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const role = user?.accessLevel || "UMUM";

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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <MobileHeader />

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav role={role} userId={user?.id} />
    </div>
  );
}
