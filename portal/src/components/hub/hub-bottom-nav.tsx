"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  LayoutGrid,
  Activity,
  UserCircle,
  HelpCircle,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";

const navItems = [
  { href: "/hub", label: "Home", icon: Home, exact: true },
  { href: "/hub/apps", label: "Apps", icon: LayoutGrid },
  { href: "/hub/activity", label: "Activity", icon: Activity },
  { href: "/hub/account", label: "Account", icon: UserCircle },
  { href: "/hub/support", label: "Support", icon: HelpCircle },
];

export function HubBottomNav() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [circleX, setCircleX] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const activeIndex = navItems.findIndex((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  const safeActive = activeIndex >= 0 ? activeIndex : 0;
  const ActiveIcon = navItems[safeActive].icon;

  // Compute circle X position based on active item's DOM position
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom pointer-events-none">
      <div className="relative mx-4 mb-3 pointer-events-auto">

        {/* Floating circle — sits above the bar */}
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
                "bg-gradient-to-br from-asy-accent to-[#4aa8ad] dark:from-asy-accent dark:to-[#5ab0b5]",
                "shadow-lg shadow-asy-accent/30 dark:shadow-asy-accent/20",
                "ring-[3.5px] ring-background",
                "active:scale-95 transition-transform duration-150",
              )}
            >
              <ActiveIcon className="h-[22px] w-[22px] text-white" strokeWidth={2} />
            </Link>
          </div>
        )}

        {/* Single continuous bar */}
        <div
          ref={barRef}
          className="flex items-center justify-around h-[56px] bg-white dark:bg-[#132428] rounded-2xl shadow-lg shadow-black/6 dark:shadow-black/25"
        >
          {navItems.map((item, index) => {
            const isActive = index === safeActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => { itemRefs.current[index] = el; }}
                className={cn(
                  "flex items-center justify-center w-14 h-14 rounded-xl",
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
