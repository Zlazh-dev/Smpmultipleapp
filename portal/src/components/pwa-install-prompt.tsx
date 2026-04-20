"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-prompt-dismissed";
// Dismissed permanently — user already saw it and chose "Nanti Saja"

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if dismissed permanently or already installed as PWA
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    // Already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so it doesn't compete with page load
      setTimeout(() => setShow(true), 2000);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "true");
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 z-50 animate-fade-in-up">
      <div className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Pasang Aplikasi Portal</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Akses lebih cepat langsung dari layar utama perangkat Anda.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={handleInstall}
            >
              <Download className="h-3 w-3 mr-1" />
              Pasang
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={handleDismiss}
            >
              Nanti Saja
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
