"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSsoCheck } from "@/hooks/use-sso-check";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CalendarOff,
  FolderOpen,
  Briefcase,
  Moon,
  Sun,
  ExternalLink,
  ArrowLeft,
  GraduationCap,
  UserCircle,
  Settings,
  CheckSquare,
  Activity,
  FileText,
} from "lucide-react";
import { useTheme } from "next-themes";

// Main nav groups for AsyOps
const navGroups = [
  {
    label: "Utama",
    items: [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard, roles: ["UMUM", "KHUSUS"] },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/presensi", label: "Presensi", icon: ClipboardCheck, roles: ["UMUM", "KHUSUS"] },
      { href: "/documents", label: "Dokumen", icon: FileText, roles: ["UMUM", "KHUSUS"] },
      { href: "/approvals", label: "Persetujuan", icon: CheckSquare, roles: ["UMUM", "KHUSUS"], badge: true },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/people/pegawai", label: "Pegawai", icon: Users, roles: ["KHUSUS"] },
      { href: "/people/siswa", label: "Siswa", icon: GraduationCap, roles: ["UMUM", "KHUSUS"] },
    ],
  },
  {
    label: "Pengawasan",
    items: [
      { href: "/monitoring", label: "Monitoring", icon: Activity, roles: ["KHUSUS"] },
    ],
  },
];

const extraItems = {
  profile: { href: "/people/pegawai", label: "Profil Saya", icon: UserCircle },
  settings: { href: "/settings", label: "Pengaturan", icon: Settings, roles: ["KHUSUS"] },
};

interface AppSidebarProps {
  role: string;
  userId?: string;
  pendingCutiCount?: number;
}

export function AppSidebar({ role, userId, pendingCutiCount = 0 }: AppSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [portalUrl, setPortalUrl] = useState("");
  const [mounted, setMounted] = useState(false);

  // Validate SSO Session
  useSsoCheck();

  useEffect(() => {
    const envUrl = process.env.NEXT_PUBLIC_PORTAL_URL;
    const fallback = window.location.origin
      .replace(/\/\/tu\./, '//portal.')
      .replace(/:3001/, ':3000');
    setPortalUrl((envUrl || fallback) + '/hub');
    setMounted(true);
  }, []);

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border/40 bg-sidebar backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight block text-sidebar-foreground">
            AsyOps
          </span>
          <span className="text-[10px] text-muted-foreground leading-none">
            Backoffice Administration
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = item.href === "/dashboard"
                    ? pathname === "/dashboard" || pathname === "/"
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive && "text-sidebar-primary")} />
                      {item.label}
                      {item.badge && pendingCutiCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-500">
                          {pendingCutiCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        <Separator className="my-2" />

        {/* UMUM: my profile */}
        {role === "UMUM" && userId && (
          <Link
            href={`/people/pegawai/${userId}`}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname.startsWith(`/people/pegawai/${userId}`)
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <UserCircle className={cn("h-4 w-4", pathname.startsWith(`/people/pegawai/${userId}`) && "text-sidebar-primary")} />
            Profil Saya
          </Link>
        )}

        {/* KHUSUS: settings */}
        {role === "KHUSUS" && (
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname.startsWith("/settings")
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Settings className={cn("h-4 w-4", pathname.startsWith("/settings") && "text-sidebar-primary")} />
            Pengaturan
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground cursor-pointer"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted && (theme === "dark" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          ))}
          {mounted ? (theme === "dark" ? "Mode Terang" : "Mode Gelap") : "Ganti Tema"}
        </Button>
        <a
          href={portalUrl || "/hub"}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke AsyHub
        </a>
      </div>
    </aside>
  );
}
