"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Plus, Printer, CalendarDays } from "lucide-react";
import { CutiFormSheet } from "@/components/cuti-form-sheet";
import { cn } from "@/lib/utils";

interface CutiItem {
  id: string;
  jenisCuti: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lamaHari: number;
  alasan: string;
  status: string;
  pegawai: { namaLengkap: string; jabatan: string };
}

const statusMap: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  PENDING: { label: "Pending", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  APPROVED: { label: "Disetujui", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  REJECTED: { label: "Ditolak", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

export function CutiUserView({ data, userId }: { data: CutiItem[]; userId: string }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      {/* Actions */}
      <div className="flex justify-end gap-2 animate-fade-in">
        <Button size="sm" className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" onClick={() => setShowForm(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Ajukan Cuti
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 animate-fade-in-up">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => {
          const config = statusMap[s];
          const count = data.filter((d) => d.status === s).length;
          return (
            <div key={s} className={cn("flex items-center justify-between px-3 py-2.5 rounded-md border border-border", config.bg)}>
              <span className="text-lg font-bold">{count}</span>
              <Badge className={cn("border-0 text-[10px]", config.bg, config.color)}>{config.label}</Badge>
            </div>
          );
        })}
      </div>

      {/* Cuti list */}
      <div className="space-y-2 animate-fade-in-up animation-delay-200">
        {data.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Belum ada pengajuan cuti
          </div>
        ) : (
          data.map((item) => {
            const config = statusMap[item.status];
            const StatusIcon = config.icon;
            return (
              <div key={item.id} className="p-3 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{item.jenisCuti}</Badge>
                    <span className="text-xs text-muted-foreground">{item.lamaHari} hari</span>
                  </div>
                  <Badge className={cn("border-0 text-[10px]", config.bg, config.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />{config.label}
                  </Badge>
                </div>
                <p className="text-sm">{item.alasan}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(item.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    {" — "}
                    {new Date(item.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  {item.status === "APPROVED" && (
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] cursor-pointer" onClick={() => window.open(`/print/cuti/${item.id}`, "_blank")}>
                      <Printer className="h-3 w-3 mr-1" /> Cetak
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <CutiFormSheet open={showForm} onOpenChange={setShowForm} pegawaiList={[]} fixedPegawaiId={userId} />
    </>
  );
}
