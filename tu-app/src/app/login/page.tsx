import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-background to-indigo-950/20" />
        <div className="absolute top-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TU App Login</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Masuk ke Sistem Tata Usaha SMPIT Asy-Syadzili
          </p>
        </div>

        <Suspense fallback={<div className="h-64 animate-pulse bg-muted/30 rounded-xl" />}>
          <LoginForm />
        </Suspense>

        {/* Demo credentials */}
        <div className="mt-6 p-4 rounded-lg border border-border/50 bg-muted/30 animate-fade-in-up animation-delay-400">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2">Demo Accounts:</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
            <div>ahmad.fauzi@sekolahasy.com</div><div>123456</div>
            <div>siti.nur@sekolahasy.com</div><div>123456</div>
            <div>bambang.susilo@sekolahasy.com</div><div>123456</div>
            <div>rizki.pratama@sekolahasy.com</div><div>123456</div>
          </div>
        </div>
      </div>
    </div>
  );
}
