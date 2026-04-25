"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

const COOKIE_NAME = "app-theme";

function getCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  // Production: *.sekolahasy.com → share via .sekolahasy.com
  if (host.endsWith(".sekolahasy.com")) return ".sekolahasy.com";
  // Dev: *.localhost → share via .localhost (works in Chrome/Edge/Firefox)
  if (host.endsWith(".localhost") || host === "localhost") return ".localhost";
  return undefined;
}

function setThemeCookie(theme: string) {
  const maxAge = 365 * 24 * 60 * 60;
  const domain = getCookieDomain();
  let cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (domain) cookie += `; domain=${domain}`;
  document.cookie = cookie;
}

function getThemeCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : null;
}

/** Syncs next-themes state with a cross-subdomain cookie */
function ThemeCookieSync() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const initialized = React.useRef(false);

  // On mount: read cookie and apply if different
  React.useEffect(() => {
    const cookieTheme = getThemeCookie();
    if (cookieTheme && cookieTheme !== theme) {
      setTheme(cookieTheme);
    }
    initialized.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On theme change: write to cookie
  React.useEffect(() => {
    if (initialized.current && theme) {
      setThemeCookie(theme);
    }
  }, [theme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeCookieSync />
      {children}
    </NextThemesProvider>
  );
}
