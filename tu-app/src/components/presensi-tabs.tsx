"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClipboardCheck, Settings, FileSpreadsheet, UserCheck } from "lucide-react";

const tabs = [
  { href: "/presensi", label: "Presensi", icon: ClipboardCheck, exact: true },
  { href: "/presensi/validasi-wajah", label: "Validasi Wajah", icon: UserCheck },
  { href: "/presensi/pengaturan", label: "Pengaturan", icon: Settings },
  { href: "/presensi/laporan", label: "Laporan", icon: FileSpreadsheet },
];

export function PresensiTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-card/50 px-2 sm:px-4 lg:px-6 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-0.5 -mb-px min-w-max">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
