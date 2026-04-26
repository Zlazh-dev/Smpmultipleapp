"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Total idle time before forcing logout (60 minutes)
const IDLE_TIMEOUT = 60 * 60 * 1000; 
// Time before timeout to show the prompt (55 minutes)
const PROMPT_TIMEOUT = 55 * 60 * 1000;
const COOKIE_NAME = "smpit_last_activity";

// Helper to get base domain for shared cookie
const getBaseDomain = () => {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (host.includes("localhost")) return "localhost";
  const parts = host.split(".");
  // Handle domain with two-part TLDs (like .sch.id, .co.id)
  if (parts.length >= 3 && parts[parts.length - 1] === "id" && ["sch", "co", "ac", "go", "or", "my", "web"].includes(parts[parts.length - 2])) {
    return `.${parts.slice(-3).join(".")}`;
  }
  if (parts.length >= 2) return `.${parts.slice(-2).join(".")}`;
  return host;
};

export function IdleTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [showPrompt, setShowPrompt] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const promptIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getSharedLastActivity = useCallback((): number => {
    if (typeof document === "undefined") return Date.now();
    const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
    if (match && match[2]) {
      return parseInt(match[2], 10);
    }
    return Date.now();
  }, []);

  const setSharedLastActivity = useCallback(() => {
    if (typeof document === "undefined") return;
    const baseDomain = getBaseDomain();
    const expires = new Date(Date.now() + IDLE_TIMEOUT).toUTCString();
    document.cookie = `${COOKIE_NAME}=${Date.now()}; domain=${baseDomain}; path=/; expires=${expires}; SameSite=Lax`;
  }, []);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    if (!showPrompt) {
      setSharedLastActivity();
    }
  }, [showPrompt, setSharedLastActivity]);

  // Listen for user activity
  useEffect(() => {
    if (status !== "authenticated") return;

    // Initialize cookie if not exists
    if (!document.cookie.includes(COOKIE_NAME)) {
      setSharedLastActivity();
    }

    const events = ["mousemove", "keydown", "wheel", "touchstart", "click"];
    
    // Throttle the activity updates to avoid excessive cookie writes (every 5 seconds)
    let throttleTimer: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (throttleTimer) return;
      updateActivity();
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, 5000);
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [status, updateActivity, setSharedLastActivity]);

  // Periodically check if idle
  useEffect(() => {
    if (status !== "authenticated") return;

    checkIntervalRef.current = setInterval(() => {
      const lastActivity = getSharedLastActivity();
      const now = Date.now();
      const idleTime = now - lastActivity;

      if (idleTime >= IDLE_TIMEOUT) {
        // Time's up, sign out
        signOut({ callbackUrl: "/login" });
      } else if (idleTime >= PROMPT_TIMEOUT && !showPrompt) {
        // Show prompt
        setShowPrompt(true);
        setRemainingTime(Math.ceil((IDLE_TIMEOUT - idleTime) / 1000));
      } else if (idleTime < PROMPT_TIMEOUT && showPrompt) {
        // Another tab updated the activity! Hide prompt automatically.
        setShowPrompt(false);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [status, showPrompt, getSharedLastActivity]);

  // Countdown timer for the prompt dialog
  useEffect(() => {
    if (showPrompt) {
      promptIntervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            signOut({ callbackUrl: "/login" });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (promptIntervalRef.current) clearInterval(promptIntervalRef.current);
    };
  }, [showPrompt]);

  const handleExtendSession = () => {
    setSharedLastActivity();
    setShowPrompt(false);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Only render dialog if authenticated
  if (status !== "authenticated") return <>{children}</>;

  return (
    <>
      {children}
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="sm:max-w-md" aria-describedby="session-timeout-desc">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-600">Sesi Hampir Habis</DialogTitle>
            <DialogDescription id="session-timeout-desc" className="text-base pt-2">
              Anda tidak melakukan aktivitas selama beberapa waktu. Sesi Anda akan berakhir dalam <span className="font-bold tabular-nums text-foreground">{formatTime(remainingTime)}</span>.
              <br /><br />
              Apakah Anda ingin memperpanjang sesi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
              Logout Sekarang
            </Button>
            <Button onClick={handleExtendSession} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
              Perpanjang Sesi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
