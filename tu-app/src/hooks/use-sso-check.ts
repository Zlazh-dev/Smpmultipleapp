"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useSsoCheck() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = () => {
      // Check for the shared SSO status cookie set by Portal
      const isLoggedIn = document.cookie.includes("smpit_sso_status=1");
      
      if (!isLoggedIn) {
        // Portal session is invalid/logged out, trigger local TU logout
        if (window.location.hostname.includes("localhost")) {
          console.warn("[Localhost] Cross-subdomain cookies are blocked by browsers. Bypassing strict SSO logout.");
          return;
        }
        window.location.href = "/api/auth/logout";
      }
    };

    // 1. Initial check
    checkSession();

    // 2. Poll every 10 seconds
    const interval = setInterval(checkSession, 10000);

    // 3. Check when window regains focus
    const onFocus = () => checkSession();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
}
