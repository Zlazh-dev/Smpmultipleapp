import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowLeft, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tata Usaha — Administrasi Sekolah",
  description: "Aplikasi Tata Usaha — SMPIT Asy-Syadzili",
};

export default function TUPage() {
  const tuUrl = process.env.NEXT_PUBLIC_TU_URL || "http://localhost:3001";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-background to-indigo-950/10" />
        <div className="absolute top-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <Card className="w-full max-w-lg border-blue-500/20 bg-card/80 backdrop-blur-xl">
        <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Building2 className="h-8 w-8 text-white" />
          </div>

          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
            Aktif
          </Badge>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Aplikasi Tata Usaha
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Presensi geofencing, data pegawai, cetak surat, e-filing,
              dan manajemen cuti.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-xs pt-2">
            {[
              "Presensi GPS",
              "Data Pegawai",
              "Cetak Surat",
              "e-Filing",
              "Manajemen Cuti",
              "Profil Sekolah",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-1.5 p-2 rounded-lg border border-border/50 bg-muted/30"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <a
            href={tuUrl}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
          >
            Buka Aplikasi TU
            <ExternalLink className="h-4 w-4" />
          </a>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors mt-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Portal
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
