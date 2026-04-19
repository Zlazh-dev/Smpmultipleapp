import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RADIG — PSB & Manajemen Santri",
  description: "Aplikasi RADIG — Pendaftaran Santri Baru & Manajemen Data Santri",
};

export default function RadigPage() {
  const radigUrl = process.env.NEXT_PUBLIC_RADIG_URL || "http://localhost:3002";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-background to-purple-950/10" />
        <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[120px]" />
      </div>

      <Card className="w-full max-w-lg border-violet-500/20 bg-card/80 backdrop-blur-xl">
        <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Radio className="h-8 w-8 text-white" />
          </div>

          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
            Aktif
          </Badge>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Aplikasi RADIG
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Pendaftaran santri baru (PSB), manajemen data santri, jadwal pelajaran,
              dan pengelolaan khidmah.
            </p>
          </div>

          <a
            href={radigUrl}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25"
          >
            Buka Aplikasi RADIG
            <ExternalLink className="h-4 w-4" />
          </a>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors mt-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Portal
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
