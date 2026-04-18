"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, CalendarDays, Calendar } from "lucide-react";
import { toast } from "sonner";

export function PresensiLaporan() {
  const [exportingDaily, setExportingDaily] = useState(false);
  const [exportingMonthly, setExportingMonthly] = useState(false);

  const handleExportDaily = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setExportingDaily(true);
    const fd = new FormData(e.currentTarget);
    const tanggal = fd.get("tanggal") as string;
    if (!tanggal) { toast.error("Pilih tanggal"); setExportingDaily(false); return; }

    try {
      const res = await fetch(`/api/export?type=presensi&tanggal=${tanggal}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presensi_${tanggal}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export berhasil");
    } catch { toast.error("Export gagal"); }
    finally { setExportingDaily(false); }
  };

  const handleExportMonthly = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setExportingMonthly(true);
    const fd = new FormData(e.currentTarget);
    const bulan = fd.get("bulan") as string;
    if (!bulan) { toast.error("Pilih bulan"); setExportingMonthly(false); return; }

    try {
      const res = await fetch(`/api/export?type=presensi&bulan=${bulan}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presensi_${bulan}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export berhasil");
    } catch { toast.error("Export gagal"); }
    finally { setExportingMonthly(false); }
  };

  const handleExportPegawai = async () => {
    try {
      const res = await fetch("/api/export?type=pegawai");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data_pegawai.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export berhasil");
    } catch { toast.error("Export gagal"); }
  };

  const handleExportCuti = async () => {
    try {
      const res = await fetch("/api/export?type=cuti");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data_cuti.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export berhasil");
    } catch { toast.error("Export gagal"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up">
      {/* Daily Export */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Export Harian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleExportDaily} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal</Label>
              <Input type="date" name="tanggal" defaultValue={new Date().toISOString().split("T")[0]} className="h-8 text-sm" />
            </div>
            <Button type="submit" disabled={exportingDaily} className="w-full h-9 cursor-pointer" variant="outline">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {exportingDaily ? "Mengexport..." : "Export Presensi Harian"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Monthly Export */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Export Bulanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleExportMonthly} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Bulan</Label>
              <Input type="month" name="bulan" defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`} className="h-8 text-sm" />
            </div>
            <Button type="submit" disabled={exportingMonthly} className="w-full h-9 cursor-pointer" variant="outline">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {exportingMonthly ? "Mengexport..." : "Export Rekap Bulanan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Exports */}
      <Card className="border-border/50 lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" /> Export Lainnya
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportPegawai}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer text-left"
            >
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Download className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-semibold">Data Pegawai</p>
                <p className="text-[10px] text-muted-foreground">Export semua data pegawai ke Excel</p>
              </div>
            </button>
            <button
              onClick={handleExportCuti}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer text-left"
            >
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Download className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold">Data Cuti</p>
                <p className="text-[10px] text-muted-foreground">Export semua data cuti ke Excel</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
