import { TeachSidebar } from "@/components/teach/teach-sidebar";
import { TeachBottomNav } from "@/components/teach/teach-bottom-nav";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";

export default async function TeachLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  // Only UMUM (teachers) can access AsyTeach
  // KHUSUS users should use AsyOps
  if (user.accessLevel === "KHUSUS") {
    return redirect("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <TeachSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <TeachBottomNav />

      {/* Floating theme toggle (mobile only) */}
      <FloatingThemeToggle />
    </div>
  );
}
