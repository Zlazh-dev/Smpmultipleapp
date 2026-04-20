"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Radio,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";

interface PortalBottomNavProps {
  role: string;
}

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, adminOnly: false },
  { href: "/dashboard/guru", label: "Guru", icon: Users, adminOnly: true },
  { href: "#tu", label: "TU", icon: Building2, adminOnly: false, sso: "tu" },
  { href: "#radig", label: "RADIG", icon: Radio, adminOnly: false, sso: "radig" },
];

export function PortalBottomNav({ role }: PortalBottomNavProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => !item.adminOnly || role === "RADIG");

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur-lg safe-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {items.map((item) => {
          const isActive = item.sso ? false : (pathname === item.href);
          const href = item.sso ? `/api/sso/redirect?app=${item.sso}` : item.href;

          const El = item.sso ? "a" : Link;

          return (
            <El
              key={item.label}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[48px] transition-colors relative",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-emerald-600 dark:text-emerald-400")} />
              <span className={cn(
                "text-[10px] leading-none",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-emerald-500" />
              )}
            </El>
          );
        })}

        {/* Logout */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[48px] text-muted-foreground hover:text-red-500 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] leading-none font-medium">Keluar</span>
          </button>
        </form>
      </div>
    </nav>
  );
}
