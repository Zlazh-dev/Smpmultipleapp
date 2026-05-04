"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  ShieldCheck,
  LayoutGrid,
  FileText,
  Settings,
} from "lucide-react";

const adminNavItems = [
  { href: "/hub/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/hub/admin/users", label: "Users", icon: Users },
  { href: "/hub/admin/roles", label: "Roles", icon: ShieldCheck },
  { href: "/hub/admin/app-access", label: "App Access", icon: LayoutGrid },
  { href: "/hub/admin/audit", label: "Audit Logs", icon: FileText },
  { href: "/hub/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border/40 bg-asy-surface/30 backdrop-blur-sm px-6 lg:px-8">
      <div className="flex items-center gap-1 overflow-x-auto py-1 -mb-px scrollbar-none">
        {adminNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && !item.exact;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                isActive
                  ? "border-asy-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
