import type { Metadata } from "next";
import { RegisterForm } from "@/components/register-form";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Daftar akun baru untuk mengakses Portal SMPIT Asy-Syadzili.",
};

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-teal-50/30 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20" />
        <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[120px] dark:bg-emerald-500/5 animate-glow-pulse" />
        <div className="absolute bottom-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-teal-500/10 blur-[100px] dark:bg-teal-500/5 animate-glow-pulse animation-delay-200" />
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <span className="hidden sm:inline font-medium">Portal SMPIT</span>
      </Link>

      <div className="w-full max-w-md animate-fade-in-up">
        <RegisterForm />
      </div>
    </div>
  );
}
