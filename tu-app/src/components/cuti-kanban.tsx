"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Clock, CheckCircle, XCircle, GripVertical, CalendarDays, Printer } from "lucide-react";
import { CutiFormSheet } from "@/components/cuti-form-sheet";

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

interface PegawaiOption {
  id: string;
  namaLengkap: string;
}

type CutiStatus = "PENDING" | "APPROVED" | "REJECTED";

const statusConfig: Record<CutiStatus, {
  label: string;
  icon: any;
  color: string;
  borderColor: string;
  bgColor: string;
}> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-500",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
  },
  APPROVED: {
    label: "Disetujui",
    icon: CheckCircle,
    color: "text-emerald-500",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
  },
  REJECTED: {
    label: "Ditolak",
    icon: XCircle,
    color: "text-red-500",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/5",
  },
};

export function CutiKanban({
  initialData,
  pegawaiList,
}: {
  initialData: CutiItem[];
  pegawaiList: PegawaiOption[];
}) {
  const [items, setItems] = useState(initialData);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const columns: CutiStatus[] = ["PENDING", "APPROVED", "REJECTED"];

  const handleDragStart = (id: string) => setDragItem(id);
  const handleDragEnd = () => setDragItem(null);

  const handleDrop = async (targetStatus: CutiStatus) => {
    if (!dragItem) return;

    const item = items.find((i) => i.id === dragItem);
    if (!item || item.status === targetStatus) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === dragItem ? { ...i, status: targetStatus } : i))
    );

    try {
      const res = await fetch(`/api/cuti/${dragItem}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) throw new Error();

      toast.success(
        `${item.pegawai.namaLengkap} → ${statusConfig[targetStatus].label}`
      );
    } catch {
      // Revert
      setItems((prev) =>
        prev.map((i) => (i.id === dragItem ? { ...i, status: item.status } : i))
      );
      toast.error("Gagal mengubah status");
    }

    setDragItem(null);
  };

  return (
    <>
      {/* Create button */}
      <div className="flex justify-end mb-2 animate-fade-in">
        <Button
          size="sm"
          className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Ajukan Cuti
        </Button>
      </div>

      {/* Kanban columns — desktop */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 animate-fade-in-up">
        {columns.map((status) => {
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          const columnItems = items.filter((i) => i.status === status);

          return (
            <div
              key={status}
              className={cn(
                "rounded-lg border p-3 min-h-[300px] transition-colors",
                config.borderColor,
                config.bgColor,
                dragItem && "border-dashed"
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                <StatusIcon className={cn("h-4 w-4", config.color)} />
                <span className="text-sm font-semibold">{config.label}</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {columnItems.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {columnItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "p-3 rounded-md border border-border bg-card cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
                      dragItem === item.id && "opacity-50 scale-95"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.pegawai.namaLengkap}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="outline" className="text-[9px]">{item.jenisCuti}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {item.lamaHari}h
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">
                          {item.alasan}
                        </p>
                        <div className="flex items-center gap-1 mt-1.5 text-[9px] text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(item.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          {" — "}
                          {new Date(item.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                      {item.status === "APPROVED" && (
                        <button
                          className="mt-1.5 flex items-center gap-1 text-[9px] text-primary hover:underline cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); window.open(`/print/cuti/${item.id}`, "_blank"); }}
                        >
                          <Printer className="h-3 w-3" /> Cetak Surat
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {columnItems.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-6">Kosong</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile — stacked cards with action buttons */}
      <div className="md:hidden space-y-3 animate-fade-in-up">
        {items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">Tidak ada data cuti</p>
        ) : (
          items.map((item) => {
            const config = statusConfig[item.status as CutiStatus];
            const StatusIcon = config.icon;

            return (
              <div key={item.id} className="mobile-card space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.pegawai.namaLengkap}</p>
                    <p className="text-[10px] text-muted-foreground">{item.pegawai.jabatan}</p>
                  </div>
                  <Badge className={cn("text-[10px] border-0", config.bgColor, config.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px]">{item.jenisCuti}</Badge>
                  <span className="text-muted-foreground">
                    {new Date(item.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    {" — "}
                    {new Date(item.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    {" · "}{item.lamaHari} hari
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.alasan}</p>

                {/* Mobile action buttons */}
                {item.status === "PENDING" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                      onClick={async () => {
                        const res = await fetch(`/api/cuti/${item.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "APPROVED" }),
                        });
                        if (res.ok) {
                          setItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, status: "APPROVED" } : i))
                          );
                          toast.success("Cuti disetujui");
                        }
                      }}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Setuju
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10 cursor-pointer"
                      onClick={async () => {
                        const res = await fetch(`/api/cuti/${item.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "REJECTED" }),
                        });
                        if (res.ok) {
                          setItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, status: "REJECTED" } : i))
                          );
                          toast.success("Cuti ditolak");
                        }
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Tolak
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Sheet */}
      <CutiFormSheet open={showCreate} onOpenChange={setShowCreate} pegawaiList={pegawaiList} />
    </>
  );
}
