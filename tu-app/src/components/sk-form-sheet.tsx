"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface SkData {
  noSK: string;
  tanggal: string;
  jenis: string;
  perihal: string;
  berlakuSampai: string;
  keterangan: string;
}

interface SKFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pegawaiId: string;
  allSk: SkData[];
  editIndex?: number; // undefined = add new, number = edit existing
}

const emptySk: SkData = { noSK: "", tanggal: "", jenis: "", perihal: "", berlakuSampai: "", keterangan: "" };

export function SKFormSheet({ open, onOpenChange, pegawaiId, allSk, editIndex }: SKFormSheetProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [loading, setLoading] = useState(false);
  const isEdit = editIndex !== undefined;
  const [form, setForm] = useState<SkData>({ ...emptySk });

  useEffect(() => {
    if (open) {
      setForm(isEdit && allSk[editIndex!] ? { ...allSk[editIndex!] } : { ...emptySk });
    }
  }, [open, editIndex, allSk, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.noSK || !form.tanggal || !form.jenis) {
      toast.error("No. SK, Tanggal, dan Jenis wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const updated = [...allSk];
      if (isEdit) {
        updated[editIndex!] = { ...form };
      } else {
        updated.push({ ...form });
      }

      const res = await fetch(`/api/pegawai/${pegawaiId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skRiwayat: updated }),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "SK diperbarui" : "SK berhasil ditambahkan");
      onOpenChange(false);
      router.refresh();
    } catch { toast.error("Gagal menyimpan SK"); }
    finally { setLoading(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={isDesktop ? "w-[420px] sm:max-w-[420px] p-0 [&>button]:hidden" : "h-[85vh] rounded-t-2xl p-0 [&>button]:hidden"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">{isEdit ? "Edit SK" : "Tambah SK Baru"}</h2>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">No. SK *</Label>
              <Input value={form.noSK} onChange={(e) => setForm({ ...form, noSK: e.target.value })} placeholder="001/KS/2026" required className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tanggal SK *</Label>
                <Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} required className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jenis SK *</Label>
                <Input value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })} placeholder="Pengangkatan" required className="h-8 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Perihal</Label>
              <Textarea value={form.perihal} onChange={(e) => setForm({ ...form, perihal: e.target.value })} placeholder="Tentang penetapan..." rows={2} className="text-sm resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Berlaku Sampai</Label>
                <Input type="date" value={form.berlakuSampai} onChange={(e) => setForm({ ...form, berlakuSampai: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Keterangan</Label>
                <Input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Catatan" className="h-8 text-sm" />
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-border bg-muted/30">
            <Button type="submit" disabled={loading} className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {loading ? "Menyimpan..." : isEdit ? "Perbarui SK" : "Tambah SK"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
