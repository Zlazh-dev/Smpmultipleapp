import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft, Rocket } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Portal Wali Santri",
  description: "Aplikasi Portal Wali Santri — SMPIT Asy-Syadzili",
};

export default function WaliPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-background to-orange-950/10" />
        <div className="absolute top-1/3 left-1/3 h-[400px] w-[400px] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <Card className="w-full max-w-lg border-amber-500/20 bg-card/80 backdrop-blur-xl">
        <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
            <Users className="h-8 w-8 text-white" />
          </div>

          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            <Rocket className="h-3 w-3 mr-1" />
            In Development 🚀
          </Badge>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Portal Wali Santri
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Modul pemantauan akademik, kehadiran, dan perkembangan putra/putri Anda.
              Sedang dalam pengembangan aktif — segera hadir!
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors mt-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Portal
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
