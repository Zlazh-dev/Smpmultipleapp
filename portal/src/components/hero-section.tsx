"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-teal-50/30 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/10" />
        <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[100px] dark:bg-emerald-500/5" />
        <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-teal-500/10 blur-[100px] dark:bg-teal-500/5" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20 md:py-32 lg:py-40">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-fade-in">
            <Sparkles className="h-3 w-3" />
            Portal Terintegrasi untuk Sekolah Modern
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in-up">
            <span className="block">Selamat Datang di</span>
            <span className="block mt-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400">
              Portal SMPIT Asy-Syadzili
            </span>
          </h1>

          {/* Description */}
          <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed animate-fade-in-up animation-delay-200">
            Satu pintu akses untuk seluruh kebutuhan akademik — dari administrasi
            Tata Usaha, pengelolaan kurikulum, aktivitas guru, hingga pemantauan
            wali santri. Semua terintegrasi, aman, dan mudah digunakan.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up animation-delay-400">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 h-12 px-8 text-base cursor-pointer"
              >
                Masuk ke Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-8 sm:pt-12 w-full max-w-2xl animate-fade-in-up animation-delay-600">
            {[
              { value: "4", label: "Aplikasi" },
              { value: "50+", label: "Guru Aktif" },
              { value: "500+", label: "Santri" },
              { value: "99%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label} className="text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
