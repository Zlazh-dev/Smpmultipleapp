"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { IdleTimeoutProvider } from "./idle-timeout-provider";
import { useEffect } from "react";

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

// Internal component to sync NextAuth session state to a shared cookie
function SsoStatusSync({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    const baseDomain = getBaseDomain();
    if (status === "authenticated") {
      // Set a shared cookie indicating the user is logged in to Portal
      document.cookie = `smpit_sso_status=1; domain=${baseDomain}; path=/; SameSite=Lax`;
    } else if (status === "unauthenticated") {
      // Clear the shared cookie when logged out
      document.cookie = `smpit_sso_status=; domain=${baseDomain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  }, [status]);

  return <>{children}</>;
}

export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SsoStatusSync>
        <IdleTimeoutProvider>
          {children}
        </IdleTimeoutProvider>
      </SsoStatusSync>
    </SessionProvider>
  );
}
