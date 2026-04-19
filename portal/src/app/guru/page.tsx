import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ArrowLeft, Rocket } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Portal Guru",
  description: "Aplikasi Portal Guru — SMPIT Asy-Syadzili",
};

export default function GuruPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-background to-teal-950/10" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <Card className="w-full max-w-lg border-emerald-500/20 bg-card/80 backdrop-blur-xl">
        <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>

          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Rocket className="h-3 w-3 mr-1" />
            In Development 🚀
          </Badge>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Portal Guru
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Modul jadwal mengajar, presensi kelas, input nilai, dan bimbingan santri.
              Sedang dalam pengembangan aktif — segera hadir!
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors mt-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Portal
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
