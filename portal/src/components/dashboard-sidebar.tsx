"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  ExternalLink,
  LogOut,
  GraduationCap,
  Users,
} from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";
import { apps, roleLabels } from "@/lib/config";
import type { Role } from "@prisma/client";

const roleColorMap = {
  TU: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  RADIG: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  Guru: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  WaliSantri: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
} as const;

interface DashboardSidebarProps {
  user: {
    id: string;
    name: string | null;
    role: Role;
  };
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      href: "/dashboard/guru",
      label: "Manajemen Guru",
      icon: Users,
      adminOnly: true,
    },
  ].filter((item) => !item.adminOnly || user.role === "RADIG");

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border/40 bg-card/30 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border/40">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight block">Portal</span>
          <span className="text-[10px] text-muted-foreground">SMPIT Asy-Syadzili</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <Separator className="my-3" />

        <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Aplikasi
        </p>

        {/* Show ALL apps — not filtered by role */}
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <a
              key={app.key}
              href={`/api/sso/redirect?app=${app.key}`}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Icon className="h-4 w-4" />
              {app.label}
              <ExternalLink className="h-3 w-3 ml-auto" />
            </a>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-border/40 p-3 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.name || "User"}
            </p>
            <Badge
              variant="outline"
              className={cn("text-[9px] px-1.5 py-0", roleColorMap[user.role])}
            >
              {roleLabels[user.role]}
            </Badge>
          </div>
          <ThemeToggle />
        </div>

        <form action={logoutAction}>
          <Button
            variant="ghost"
            type="submit"
            className="w-full justify-start text-muted-foreground hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
            size="sm"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </form>
      </div>
    </aside>
  );
}
