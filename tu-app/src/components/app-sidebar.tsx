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
  Building2,
  Moon,
  Sun,
  ExternalLink,
  Printer,
  Settings,
  ArrowLeft,
  GraduationCap,
  UserCircle,
} from "lucide-react";
import { useTheme } from "next-themes";

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["UMUM", "KHUSUS"] },
  { href: "/pegawai", label: "Pegawai", icon: Users, roles: ["KHUSUS"] },
  { href: "/siswa", label: "Siswa", icon: GraduationCap, roles: ["UMUM", "KHUSUS"] },
  { href: "/presensi", label: "Presensi", icon: ClipboardCheck, roles: ["UMUM", "KHUSUS"] },
  { href: "/cuti", label: "Cuti", icon: CalendarOff, roles: ["UMUM", "KHUSUS"] },
  { href: "/cetak", label: "Cetak Surat", icon: Printer, roles: ["KHUSUS"] },
  { href: "/efiling", label: "e-Filing", icon: FolderOpen, roles: ["UMUM", "KHUSUS"] },
];

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
    // NEXT_PUBLIC_PORTAL_URL is baked at build time; fallback replaces subdomain for production
    const envUrl = process.env.NEXT_PUBLIC_PORTAL_URL;
    const fallback = window.location.origin
      .replace(/\/\/tu\./, '//portal.')  // production: tu.domain → portal.domain
      .replace(/:3001/, ':3000');          // dev: localhost:3001 → localhost:3000
    setPortalUrl((envUrl || fallback) + '/dashboard');
    setMounted(true);
  }, []);

  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border/40 bg-sidebar backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight block text-sidebar-foreground">
            Tata Usaha
          </span>
          <span className="text-[10px] text-muted-foreground leading-none">
            SMPIT Asy-Syadzili
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
              {item.label === "Cuti" && pendingCutiCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-500">
                  {pendingCutiCount}
                </span>
              )}
            </Link>
          );
        })}

        <Separator className="my-3" />

        <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Lainnya
        </p>

        {role === "UMUM" && userId && (
          <Link
            href={`/pegawai/${userId}`}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname.startsWith(`/pegawai/${userId}`)
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <UserCircle className={cn("h-4 w-4", pathname.startsWith(`/pegawai/${userId}`) && "text-sidebar-primary")} />
            Profil Saya
          </Link>
        )}

        {role === "KHUSUS" && (
          <Link
            href="/setting"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname.startsWith("/setting")
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Settings className={cn("h-4 w-4", pathname.startsWith("/setting") && "text-sidebar-primary")} />
            Setting
          </Link>
        )}

        <a
          href={portalUrl || "/"}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all"
        >
          <ExternalLink className="h-4 w-4" />
          Portal
        </a>
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
          href={portalUrl || "/dashboard"}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Portal
        </a>
      </div>
    </aside>
  );
}
