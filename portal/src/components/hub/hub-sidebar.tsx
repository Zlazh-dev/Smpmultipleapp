"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Home,
  LayoutGrid,
  Activity,
  UserCircle,
  HelpCircle,
  ShieldCheck,
  LogOut,
  GraduationCap,
  Briefcase,
  Users,
} from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";
import { isAdminRole, siteConfig } from "@/lib/config";
import type { Role } from "@prisma/client";

const roleIcons: Record<string, typeof GraduationCap> = {
  Guru: GraduationCap,
  TU: Briefcase,
  RADIG: ShieldCheck,
  WaliSantri: Users,
};

const navItems = [
  { href: "/hub", label: "Home", icon: Home, exact: true },
  { href: "/hub/apps", label: "Apps", icon: LayoutGrid },
  { href: "/hub/activity", label: "Activity", icon: Activity },
  { href: "/hub/account", label: "Account", icon: UserCircle },
  { href: "/hub/support", label: "Support", icon: HelpCircle },
];

interface HubSidebarProps {
  user: {
    id: string;
    name: string | null;
    role: Role;
  };
}

export function HubSidebar({ user }: HubSidebarProps) {
  const pathname = usePathname();
  const RoleIcon = roleIcons[user.role] || UserCircle;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border/40 bg-sidebar">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border/40">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-asy-accent">
          <span className="text-sm font-bold text-asy-fg-on-accent">A</span>
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight block">{siteConfig.shortName}</span>
          <span className="text-[10px] text-muted-foreground">SMPIT Asy-Syadzili</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-asy-selected text-foreground"
                  : "text-muted-foreground hover:bg-asy-surface-alt/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {isAdminRole(user.role) && (
          <>
            <Separator className="my-3" />
            <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Admin
            </p>
            <Link
              href="/hub/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/hub/admin")
                  ? "bg-asy-selected text-foreground"
                  : "text-muted-foreground hover:bg-asy-surface-alt/50 hover:text-foreground"
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Console
            </Link>
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="border-t border-border/40 p-3 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-asy-accent text-asy-fg-on-accent text-xs">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <p className="text-sm font-medium truncate">
              {user.name || "User"}
            </p>
            <RoleIcon className="h-3.5 w-3.5 text-asy-accent shrink-0" />
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
