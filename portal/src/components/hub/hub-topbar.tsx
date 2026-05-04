"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { siteConfig } from "@/lib/config";

export function HubTopbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/95 backdrop-blur-lg sticky top-0 z-40">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
          <span className="text-xs font-bold text-white">A</span>
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight block leading-none">{siteConfig.shortName}</span>
          <span className="text-[9px] text-muted-foreground leading-none">SMPIT Asy-Syadzili</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 cursor-pointer"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </header>
  );
}
