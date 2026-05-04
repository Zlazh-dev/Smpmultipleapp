"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSsoCheck } from "@/hooks/use-sso-check";
import { Button } from "@/components/ui/button";
import {
  Home,
  ClipboardCheck,
  CalendarOff,
  FolderOpen,
  Bell,
  GraduationCap,
  Moon,
  Sun,
  ArrowLeft,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";

const navItems = [
  { href: "/teach/home", label: "Beranda", icon: Home },
  { href: "/teach/attendance", label: "Presensi", icon: ClipboardCheck },
  { href: "/teach/leave", label: "Cuti", icon: CalendarOff },
  { href: "/teach/efiling", label: "e-Filing", icon: FolderOpen },
  { href: "/teach/notif", label: "Notifikasi", icon: Bell },
  { href: "/teach/profile", label: "Profil Saya", icon: User },
];

export function TeachSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [portalUrl, setPortalUrl] = useState("");
  const [mounted, setMounted] = useState(false);

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
    <aside className="flex h-screen w-56 flex-col border-r border-border/40 bg-sidebar backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight block text-sidebar-foreground">
            AsyTeach
          </span>
          <span className="text-[10px] text-muted-foreground leading-none">
            Teacher Workspace
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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
              <item.icon className={cn("h-4 w-4", isActive && "text-emerald-600 dark:text-emerald-400")} />
              {item.label}
            </Link>
          );
        })}
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
