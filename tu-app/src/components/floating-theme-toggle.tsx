"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * Floating theme toggle — small circle button fixed at top-right (mobile only).
 */
export function FloatingThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="md:hidden fixed top-4 right-4 z-50 flex items-center justify-center w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm shadow-md shadow-black/8 border border-border/40 text-muted-foreground hover:text-foreground transition-colors active:scale-95 cursor-pointer"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
