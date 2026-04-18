"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Save, Upload, File } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";

interface CutiFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pegawaiList: { id: string; namaLengkap: string }[];
  /** If provided, locks to this pegawai (UMUM role) */
  fixedPegawaiId?: string;
}

export function CutiFormSheet({
  open,
  onOpenChange,
  pegawaiList,
  fixedPegawaiId,
}: CutiFormSheetProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [loading, setLoading] = useState(false);
  const [jenisCuti, setJenisCuti] = useState("");
  const [buktiFile, setBuktiFile] = useState<File | null>(null);

  const needsBukti = jenisCuti === "Sakit" || jenisCuti === "Melahirkan";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    // Upload bukti file if present
    let buktiPath: string | null = null;
    if (buktiFile && needsBukti) {
      const uploadFd = new FormData();
      uploadFd.append("file", buktiFile);
      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadFd });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          buktiPath = uploadData.path;
        }
      } catch {
        // Non-blocking: bukti upload is optional
      }
    }

    const body = {
      pegawaiId: fixedPegawaiId || fd.get("pegawaiId"),
      jenisCuti: fd.get("jenisCuti"),
      tanggalMulai: fd.get("tanggalMulai"),
      tanggalSelesai: fd.get("tanggalSelesai"),
      alasan: fd.get("alasan"),
      dokBukti: buktiPath,
    };

    try {
      const res = await fetch("/api/cuti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success("Pengajuan cuti berhasil");
      onOpenChange(false);
      setJenisCuti("");
      setBuktiFile(null);
      router.refresh();
    } catch {
      toast.error("Gagal mengajukan cuti");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-[400px] sm:max-w-[400px] p-0 [&>button]:hidden"
            : "h-[85vh] rounded-t-2xl p-0 [&>button]:hidden"
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold">Ajukan Cuti</h2>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Pegawai selector — hidden for UMUM */}
            {!fixedPegawaiId ? (
              <div className="space-y-1.5">
                <Label className="text-xs">Pegawai *</Label>
                <select
                  name="pegawaiId"
                  required
                  className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Pilih pegawai...</option>
                  {pegawaiList.map((p) => (
                    <option key={p.id} value={p.id}>{p.namaLengkap}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label className="text-xs">Jenis Cuti *</Label>
              <select
                name="jenisCuti"
                required
                value={jenisCuti}
                onChange={(e) => setJenisCuti(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Pilih jenis...</option>
                <option value="Tahunan">Tahunan</option>
                <option value="Sakit">Sakit</option>
                <option value="Melahirkan">Melahirkan</option>
                <option value="Penting">Keperluan Penting</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Mulai *</Label>
                <Input type="date" name="tanggalMulai" required className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Selesai *</Label>
                <Input type="date" name="tanggalSelesai" required className="h-8 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Alasan</Label>
              <Input name="alasan" placeholder="Alasan cuti..." className="h-8 text-sm" />
            </div>

            {/* Bukti upload — shown for Sakit/Melahirkan */}
            {needsBukti && (
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Bukti {jenisCuti === "Sakit" ? "Surat Dokter" : "Dokumen Pendukung"} 
                  <span className="text-muted-foreground ml-1">(opsional)</span>
                </Label>
                {buktiFile ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30">
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs truncate flex-1">{buktiFile.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {(buktiFile.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => setBuktiFile(null)}
                      className="p-0.5 rounded hover:bg-red-500/10 text-red-500 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 h-16 w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Upload foto/PDF bukti
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.size > 5 * 1024 * 1024) {
                            toast.error("Maks 5MB");
                            return;
                          }
                          setBuktiFile(f);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border bg-muted/30">
            <Button type="submit" disabled={loading} className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {loading ? "Mengajukan..." : "Ajukan Cuti"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
