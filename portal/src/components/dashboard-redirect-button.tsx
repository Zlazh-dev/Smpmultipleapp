"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface DashboardRedirectButtonProps {
  appUrl: string;
  roleLabel: string;
}

/**
 * Maps app URL to the SSO redirect parameter.
 * Instead of going directly to the app URL, we route through
 * /api/sso/redirect which generates a JWT token.
 */
function getAppKey(appUrl: string): string | null {
  if (appUrl.includes("tu.")) return "tu";
  if (appUrl.includes("radig.")) return "radig";
  return null;
}

export function DashboardRedirectButton({
  appUrl,
  roleLabel,
}: DashboardRedirectButtonProps) {
  const handleClick = () => {
    const appKey = getAppKey(appUrl);
    if (appKey) {
      // Route through SSO endpoint for JWT-based auth
      window.location.replace(`/api/sso/redirect?app=${appKey}`);
    } else {
      // Fallback for apps without SSO (guru, wali — future)
      window.location.replace(appUrl);
    }
  };

  return (
    <Button
      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 cursor-pointer"
      onClick={handleClick}
    >
      Buka {roleLabel}
      <ExternalLink className="ml-2 h-4 w-4" />
    </Button>
  );
}
