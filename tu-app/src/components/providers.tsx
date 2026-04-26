"use client";

import { SessionProvider } from "next-auth/react";
import { IdleTimeoutProvider } from "./idle-timeout-provider";

export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <IdleTimeoutProvider>
        {children}
      </IdleTimeoutProvider>
    </SessionProvider>
  );
}
