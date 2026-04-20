import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { PortalBottomNav } from "@/components/portal-bottom-nav";
import { PortalMobileHeader } from "@/components/portal-mobile-header";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard Portal SMPIT Asy-Syadzili — Akses cepat ke semua aplikasi.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex">
          <DashboardSidebar user={session.user} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PortalMobileHeader />
          <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <PortalBottomNav role={session.user.role} />

        {/* PWA Install Prompt */}
        <PwaInstallPrompt />
      </div>
    </ErrorBoundary>
  );
}
