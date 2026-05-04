"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSsoCheck } from "@/hooks/use-sso-check";
import {
  LayoutDashboard,
  ClipboardCheck,
  CheckSquare,
  MoreHorizontal,
  FileText,
  Users,
  GraduationCap,
  Activity,
  Settings,
  ArrowLeft,
  X,
  UserCircle,
} from "lucide-react";

const mainItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, roles: ["UMUM", "KHUSUS"], exact: true },
  { href: "/presensi", label: "Presensi", icon: ClipboardCheck, roles: ["UMUM", "KHUSUS"] },
  { href: "/approvals", label: "Approval", icon: CheckSquare, roles: ["UMUM", "KHUSUS"] },
];

const moreItems = [
  { href: "/documents", label: "Dokumen", icon: FileText, roles: ["UMUM", "KHUSUS"] },
  { href: "/people/pegawai", label: "Pegawai", icon: Users, roles: ["KHUSUS"] },
  { href: "/people/siswa", label: "Siswa", icon: GraduationCap, roles: ["UMUM", "KHUSUS"] },
  { href: "/monitoring", label: "Monitoring", icon: Activity, roles: ["KHUSUS"] },
  { href: "/settings", label: "Pengaturan", icon: Settings, roles: ["KHUSUS"] },
];

interface BottomNavProps {
  role: string;
  userId?: string;
}

export function BottomNav({ role, userId }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);
  const [circleX, setCircleX] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [portalUrl, setPortalUrl] = useState("");

  useSsoCheck();

  useEffect(() => {
    const envUrl = process.env.NEXT_PUBLIC_PORTAL_URL;
    const fallback = window.location.origin
      .replace(/\/\/tu\./, '//portal.')
      .replace(/:3001/, ':3000');
    setPortalUrl((envUrl || fallback) + '/hub');
  }, []);

  const filteredMain = mainItems.filter((item) => item.roles.includes(role));
  const filteredMore = moreItems.filter((item) => item.roles.includes(role));

  // All visible items = main items + "More" button
  const allVisibleCount = filteredMain.length + 1; // +1 for More button

  // Active index among visible items (main items only; More = last)
  const moreActive = filteredMore.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));

  const activeMainIndex = filteredMain.findIndex((item) =>
    item.exact
      ? pathname === item.href || pathname === "/"
      : pathname.startsWith(item.href)
  );

  // When more menu is open, circle moves to More button.
  // When a "more" item is active (but menu closed), circle also shows on More button.
  const activeIndex = moreOpen
    ? filteredMain.length
    : moreActive
      ? filteredMain.length
      : (activeMainIndex >= 0 ? activeMainIndex : -1);
  const hasActive = activeIndex >= 0;

  const ActiveIcon = hasActive
    ? activeIndex < filteredMain.length
      ? filteredMain[activeIndex].icon
      : moreOpen ? X : MoreHorizontal
    : null;

  // Compute circle position
  useEffect(() => {
    const updatePosition = () => {
      const el = itemRefs.current[activeIndex];
      const bar = barRef.current;
      if (!el || !bar || !hasActive) return;
      const barRect = bar.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const centerX = elRect.left + elRect.width / 2 - barRect.left;
      setCircleX(centerX);
      if (!mounted) setMounted(true);
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [activeIndex, mounted, hasActive, moreOpen]);

  // Close more on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  return (
    <>
      {/* More popup overlay */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom pointer-events-none">
        {/* More popup menu */}
        {moreOpen && (
          <div
            ref={menuRef}
            className="pointer-events-auto mx-4 mb-1 bg-white dark:bg-[#1a2e33] rounded-2xl shadow-lg border border-border/30 animate-slide-up"
          >
            <div className="p-2 space-y-0.5">
              {filteredMore.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}

              {role === "UMUM" && userId && (
                <>
                  <div className="border-t border-border/30 my-1" />
                  <Link
                    href={`/people/pegawai/${userId}`}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      pathname.startsWith(`/people/pegawai/${userId}`)
                        ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <UserCircle className="h-5 w-5" />
                    Profil Saya
                  </Link>
                </>
              )}

              <div className="border-t border-border/30 my-1" />
              <a
                href={portalUrl || "/hub"}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Kembali ke AsyHub
              </a>
            </div>
          </div>
        )}

        <div className="relative mx-4 mb-3 pointer-events-auto">
          {/* Floating circle — slides above the bar */}
          {circleX !== null && hasActive && (
            <div
              className="absolute z-10 -top-[22px]"
              style={{
                left: circleX,
                transform: "translateX(-50%)",
                transition: mounted ? "left 0.35s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
              }}
            >
              {activeIndex < filteredMain.length ? (
                <Link
                  href={filteredMain[activeIndex].href}
                  className={cn(
                    "flex items-center justify-center w-[52px] h-[52px] rounded-full",
                    "bg-gradient-to-br from-indigo-500 to-blue-600",
                    "shadow-lg shadow-indigo-500/30",
                    "ring-[3.5px] ring-white dark:ring-[#0c1a1e]",
                    "active:scale-95 transition-transform duration-150",
                  )}
                >
                  {ActiveIcon && <ActiveIcon className="h-[22px] w-[22px] text-white" strokeWidth={2} />}
                </Link>
              ) : (
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={cn(
                    "flex items-center justify-center w-[52px] h-[52px] rounded-full cursor-pointer",
                    "bg-gradient-to-br from-indigo-500 to-blue-600",
                    "shadow-lg shadow-indigo-500/30",
                    "ring-[3.5px] ring-white dark:ring-[#0c1a1e]",
                    "active:scale-95 transition-transform duration-150",
                  )}
                >
                  {moreOpen ? (
                    <X className="h-[22px] w-[22px] text-white" strokeWidth={2} />
                  ) : (
                    <MoreHorizontal className="h-[22px] w-[22px] text-white" strokeWidth={2} />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Single continuous bar */}
          <div
            ref={barRef}
            className="flex items-center justify-around h-[56px] bg-white dark:bg-[#1a2e33] rounded-2xl shadow-lg shadow-black/6 dark:shadow-black/25"
          >
            {filteredMain.map((item, index) => {
              const isActive = index === activeIndex;
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

            {/* More button */}
            <button
              ref={(el) => { itemRefs.current[filteredMain.length] = el; }}
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                "flex items-center justify-center w-14 h-14 rounded-xl cursor-pointer",
                "transition-opacity duration-300",
                activeIndex === filteredMain.length ? "opacity-0" : "opacity-100"
              )}
            >
              <MoreHorizontal
                className="h-[22px] w-[22px] text-gray-300 dark:text-gray-600"
                strokeWidth={1.4}
              />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
