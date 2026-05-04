import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HubSidebar } from "@/components/hub/hub-sidebar";
import { HubBottomNav } from "@/components/hub/hub-bottom-nav";
import { FloatingThemeToggle } from "@/components/hub/floating-theme-toggle";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Hub",
  description: "AsyHub — Pusat identitas dan akses aplikasi.",
};

export default async function HubLayout({
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
          <HubSidebar user={session.user} />
        </div>

        {/* Main Content — headerless on mobile */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <HubBottomNav />

        {/* Floating Theme Toggle (mobile only) */}
        <FloatingThemeToggle />

        {/* PWA Install Prompt */}
        <PwaInstallPrompt />
      </div>
    </ErrorBoundary>
  );
}
