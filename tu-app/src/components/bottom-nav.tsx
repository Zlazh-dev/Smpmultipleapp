"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  MoreHorizontal,
  CalendarOff,
  FolderOpen,
  ArrowLeft,
  X,
  GraduationCap,
} from "lucide-react";

const mainItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, roles: ["UMUM", "KHUSUS"] },
  { href: "/pegawai", label: "Pegawai", icon: Users, roles: ["KHUSUS"] },
  { href: "/presensi", label: "Presensi", icon: ClipboardCheck, roles: ["UMUM", "KHUSUS"] },
];

const moreItems = [
  { href: "/siswa", label: "Data Siswa", icon: GraduationCap, roles: ["UMUM", "KHUSUS"] },
  { href: "/cuti", label: "Cuti", icon: CalendarOff, roles: ["UMUM", "KHUSUS"] },
  { href: "/efiling", label: "e-Filing", icon: FolderOpen, roles: ["UMUM", "KHUSUS"] },
];

interface BottomNavProps {
  role: string;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [portalUrl, setPortalUrl] = useState("");

  useEffect(() => {
    setPortalUrl(
      (process.env.NEXT_PUBLIC_PORTAL_URL || window.location.origin.replace(/:3001/, ":3000")) + "/dashboard"
    );
  }, []);

  const filteredMain = mainItems.filter((item) => item.roles.includes(role));
  const filteredMore = moreItems.filter((item) => item.roles.includes(role));

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  // Check if any "more" item is active
  const moreActive = filteredMore.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));

  return (
    <>
      {/* More popup overlay */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-bottom">
        {/* More popup menu */}
        {moreOpen && (
          <div
            ref={menuRef}
            className="absolute bottom-full left-0 right-0 bg-card border-t border-border/50 shadow-lg animate-slide-up"
          >
            <div className="p-2 space-y-1">
              {filteredMore.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="border-t border-border/40 my-1" />

              <a
                href={portalUrl || "/dashboard"}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Kembali ke Portal
              </a>
            </div>
          </div>
        )}

        {/* Main nav items */}
        <div className="flex items-center justify-around px-1 py-1">
          {filteredMain.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] transition-colors relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className={cn(
                  "text-[10px] leading-none",
                  isActive ? "font-semibold" : "font-medium"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] transition-colors relative",
              moreOpen || moreActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {moreOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <MoreHorizontal className={cn("h-5 w-5", moreActive && "text-primary")} />
            )}
            <span className={cn(
              "text-[10px] leading-none",
              (moreOpen || moreActive) ? "font-semibold" : "font-medium"
            )}>
              Lainnya
            </span>
            {moreActive && !moreOpen && (
              <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
