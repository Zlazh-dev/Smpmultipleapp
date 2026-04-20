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

interface PegawaiFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pegawai: {
    id: string;
    nip: string;
    namaLengkap: string;
    jabatan: string;
    accessLevel: string;
    username: string;
    noHp: string;
    alamat: string;
  };
}

export function PegawaiFormSheet({ open, onOpenChange, pegawai }: PegawaiFormSheetProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    namaLengkap: "", jabatan: "", accessLevel: "UMUM",
    username: "", noHp: "", alamat: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        namaLengkap: pegawai.namaLengkap || "",
        jabatan: pegawai.jabatan || "",
        accessLevel: pegawai.accessLevel || "UMUM",
        username: pegawai.username || "",
        noHp: pegawai.noHp || "",
        alamat: pegawai.alamat || "",
      });
    }
  }, [open, pegawai]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/pegawai/${pegawai.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Data diperbarui");
      onOpenChange(false);
      router.refresh();
    } catch { toast.error("Gagal menyimpan"); }
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
            <h2 className="text-sm font-semibold">Edit Data Pegawai</h2>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">NIP</Label>
              <Input value={pegawai.nip} disabled className="h-8 text-sm bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Lengkap *</Label>
              <Input value={form.namaLengkap} onChange={(e) => setForm({ ...form, namaLengkap: e.target.value })} required className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Jabatan *</Label>
              <Input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} required className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hak Akses *</Label>
              <select value={form.accessLevel} onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}
                className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="UMUM">Umum — Akses Terbatas</option>
                <option value="KHUSUS">Khusus — Akses Penuh</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Username *</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">No. HP</Label>
              <Input value={form.noHp} onChange={(e) => setForm({ ...form, noHp: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Alamat</Label>
              <Textarea value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} rows={2} className="text-sm resize-none" />
            </div>
          </div>

          <div className="px-5 py-3 border-t border-border bg-muted/30">
            <Button type="submit" disabled={loading} className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
