"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  ClipboardCheck,
  CalendarOff,
  FolderOpen,
  Bell,
  User,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";

const navItems = [
  { href: "/teach/home", label: "Beranda", icon: Home },
  { href: "/teach/attendance", label: "Presensi", icon: ClipboardCheck },
  { href: "/teach/leave", label: "Cuti", icon: CalendarOff },
  { href: "/teach/efiling", label: "e-Filing", icon: FolderOpen },
  { href: "/teach/notif", label: "Notifikasi", icon: Bell },
  { href: "/teach/profile", label: "Profil Saya", icon: User },
];

export function TeachBottomNav() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [circleX, setCircleX] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const activeIndex = navItems.findIndex((item) => pathname.startsWith(item.href));
  const safeActive = activeIndex >= 0 ? activeIndex : 0;
  const ActiveIcon = navItems[safeActive].icon;

  useEffect(() => {
    const updatePosition = () => {
      const el = itemRefs.current[safeActive];
      const bar = barRef.current;
      if (!el || !bar) return;
      const barRect = bar.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const centerX = elRect.left + elRect.width / 2 - barRect.left;
      setCircleX(centerX);
      if (!mounted) setMounted(true);
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [safeActive, mounted]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom pointer-events-none">
      <div className="relative mx-4 mb-3 pointer-events-auto">

        {/* Floating circle */}
        {circleX !== null && (
          <div
            className="absolute z-10 -top-[22px]"
            style={{
              left: circleX,
              transform: "translateX(-50%)",
              transition: mounted ? "left 0.35s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          >
            <Link
              href={navItems[safeActive].href}
              className={cn(
                "flex items-center justify-center w-[52px] h-[52px] rounded-full",
                "bg-gradient-to-br from-emerald-500 to-teal-600",
                "shadow-lg shadow-emerald-500/30",
                "ring-[3.5px] ring-white dark:ring-[#0c1e1a]",
                "active:scale-95 transition-transform duration-150",
              )}
            >
              <ActiveIcon className="h-[22px] w-[22px] text-white" strokeWidth={2} />
            </Link>
          </div>
        )}

        {/* Bar */}
        <div
          ref={barRef}
          className="flex items-center justify-around h-[56px] bg-white dark:bg-[#132820] rounded-2xl shadow-lg shadow-black/6 dark:shadow-black/25"
        >
          {navItems.map((item, index) => {
            const isActive = index === safeActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => { itemRefs.current[index] = el; }}
                className={cn(
                  "flex items-center justify-center w-12 h-14 rounded-xl",
                  "transition-opacity duration-300",
                  isActive ? "opacity-0" : "opacity-100"
                )}
              >
                <item.icon
                  className="h-[22px] w-[22px] text-gray-300 dark:text-gray-600"
                  strokeWidth={1.4}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
