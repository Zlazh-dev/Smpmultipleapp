"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CalendarOff,
  FolderOpen,
} from "lucide-react";

const allNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, roles: ["UMUM", "KHUSUS"] },
  { href: "/pegawai", label: "Pegawai", icon: Users, roles: ["KHUSUS"] },
  { href: "/presensi", label: "Presensi", icon: ClipboardCheck, roles: ["UMUM", "KHUSUS"] },
  { href: "/cuti", label: "Cuti", icon: CalendarOff, roles: ["UMUM", "KHUSUS"] },
  { href: "/efiling", label: "Filing", icon: FolderOpen, roles: ["UMUM", "KHUSUS"] },
];

interface BottomNavProps {
  role: string;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] transition-colors",
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
      </div>
    </nav>
  );
}
