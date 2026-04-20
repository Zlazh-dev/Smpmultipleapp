"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, X, Plus, Trash2, User, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface SkRiwayat {
  noSK: string;
  tanggal: string;
  jenis: string;
  perihal: string;
  berlakuSampai: string;
  keterangan: string;
}

interface PegawaiFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pegawai?: {
    id: string;
    nip: string;
    namaLengkap: string;
    jabatan: string;
    accessLevel: string;
    username: string;
    noHp: string;
    alamat: string;
    skRiwayat: SkRiwayat[];
  };
}

const emptySk: SkRiwayat = { noSK: "", tanggal: "", jenis: "", perihal: "", berlakuSampai: "", keterangan: "" };

export function PegawaiFormSheet({ open, onOpenChange, pegawai }: PegawaiFormSheetProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isNew = !pegawai?.id;
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"data" | "sk">("data");
  const [skList, setSkList] = useState<SkRiwayat[]>(pegawai?.skRiwayat || []);

  useEffect(() => {
    if (open) {
      setSkList(pegawai?.skRiwayat || []);
      setTab("data");
    }
  }, [open, pegawai]);

  const updateSk = (i: number, field: keyof SkRiwayat, value: string) => {
    const u = [...skList];
    u[i] = { ...u[i], [field]: value };
    setSkList(u);
  };

  const [form, setForm] = useState({
    nip: pegawai?.nip || "",
    namaLengkap: pegawai?.namaLengkap || "",
    jabatan: pegawai?.jabatan || "",
    accessLevel: pegawai?.accessLevel || "UMUM",
    username: pegawai?.username || "",
    noHp: pegawai?.noHp || "",
    alamat: pegawai?.alamat || "",
  });

  useEffect(() => {
    if (open && pegawai) {
      setForm({
        nip: pegawai.nip || "",
        namaLengkap: pegawai.namaLengkap || "",
        jabatan: pegawai.jabatan || "",
        accessLevel: pegawai.accessLevel || "UMUM",
        username: pegawai.username || "",
        noHp: pegawai.noHp || "",
        alamat: pegawai.alamat || "",
      });
    }
  }, [open, pegawai]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const body: any = {
      namaLengkap: form.namaLengkap,
      jabatan: form.jabatan,
      accessLevel: form.accessLevel,
      username: form.username,
      noHp: form.noHp || null,
      alamat: form.alamat || null,
      skRiwayat: skList.filter((sk) => sk.noSK),
    };
    if (isNew) body.nip = form.nip;

    try {
      const url = isNew ? "/api/pegawai" : `/api/pegawai/${pegawai!.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(isNew ? "Pegawai ditambahkan" : "Data diperbarui");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "data" as const, label: "Data Pegawai", icon: User },
    { id: "sk" as const, label: "Riwayat SK", icon: ScrollText },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-[480px] sm:max-w-[480px] p-0 [&>button]:hidden"
            : "h-[90vh] rounded-t-2xl p-0 [&>button]:hidden"
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">
              {isNew ? "Tambah Pegawai" : pegawai?.namaLengkap}
            </h2>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border/50 px-5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                  tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon className="h-3 w-3" />
                {t.label}
                {t.id === "sk" && skList.length > 0 && (
                  <span className="ml-1 text-[9px] bg-muted px-1 py-0.5 rounded-full">{skList.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {tab === "data" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">NIP {isNew && "*"}</Label>
                  <Input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} disabled={!isNew} required={isNew} className={`h-8 text-sm ${!isNew ? "bg-muted/50" : ""}`} />
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
              </>
            )}

            {tab === "sk" && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{skList.length} SK tercatat</p>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs cursor-pointer"
                    onClick={() => setSkList([...skList, { ...emptySk }])}>
                    <Plus className="h-3 w-3 mr-1" /> Tambah SK
                  </Button>
                </div>

                {skList.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ScrollText className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Belum ada riwayat SK</p>
                  </div>
                )}

                {skList.map((sk, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground">SK #{i + 1}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-red-500 hover:bg-red-500/10 cursor-pointer"
                        onClick={() => setSkList(skList.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px]">No. SK *</Label>
                        <Input value={sk.noSK} onChange={(e) => updateSk(i, "noSK", e.target.value)} className="h-7 text-xs" placeholder="001/KS/2026" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Tanggal *</Label>
                        <Input type="date" value={sk.tanggal} onChange={(e) => updateSk(i, "tanggal", e.target.value)} className="h-7 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Jenis *</Label>
                        <Input value={sk.jenis} onChange={(e) => updateSk(i, "jenis", e.target.value)} className="h-7 text-xs" placeholder="Pengangkatan" />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px]">Perihal</Label>
                        <Input value={sk.perihal} onChange={(e) => updateSk(i, "perihal", e.target.value)} className="h-7 text-xs" placeholder="Tentang penetapan..." />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Berlaku Sampai</Label>
                        <Input type="date" value={sk.berlakuSampai} onChange={(e) => updateSk(i, "berlakuSampai", e.target.value)} className="h-7 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Keterangan</Label>
                        <Input value={sk.keterangan} onChange={(e) => updateSk(i, "keterangan", e.target.value)} className="h-7 text-xs" placeholder="Catatan" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
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
