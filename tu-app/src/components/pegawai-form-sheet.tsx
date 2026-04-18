"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SkRiwayat {
  noSK: string;
  tanggal: string;
  jenis: string;
}

interface PegawaiFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pegawai?: {
    id: string;
    nip: string;
    namaLengkap: string;
    jabatan: string;
    role: string;
    username: string;
    noHp: string;
    alamat: string;
    skRiwayat: SkRiwayat[];
  };
}

export function PegawaiFormSheet({
  open,
  onOpenChange,
  pegawai,
}: PegawaiFormSheetProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isNew = !pegawai?.id;
  const [loading, setLoading] = useState(false);
  const [skList, setSkList] = useState<SkRiwayat[]>(pegawai?.skRiwayat || []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body: any = {
      namaLengkap: fd.get("namaLengkap"),
      jabatan: fd.get("jabatan"),
      role: fd.get("role"),
      username: fd.get("username"),
      noHp: fd.get("noHp") || null,
      alamat: fd.get("alamat") || null,
      skRiwayat: skList.filter((sk) => sk.noSK),
    };
    if (isNew) body.nip = fd.get("nip");

    try {
      const url = isNew ? "/api/pegawai" : `/api/pegawai/${pegawai!.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      toast.success(isNew ? "Pegawai berhasil ditambahkan" : "Data berhasil diperbarui");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold">
          {isNew ? "Tambah Pegawai" : `Edit: ${pegawai?.namaLengkap}`}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-pointer"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form body — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* NIP */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">NIP {isNew && "*"}</Label>
          <Input
            name="nip"
            defaultValue={pegawai?.nip || ""}
            disabled={!isNew}
            required={isNew}
            placeholder="199001012020011001"
            className={`h-8 text-sm ${!isNew ? "bg-muted/50" : ""}`}
          />
        </div>

        {/* Nama */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Nama Lengkap *</Label>
          <Input
            name="namaLengkap"
            defaultValue={pegawai?.namaLengkap || ""}
            required
            placeholder="Dr. Ahmad Fauzi, S.Pd"
            className="h-8 text-sm"
          />
        </div>

        {/* Jabatan */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Jabatan *</Label>
          <Input
            name="jabatan"
            defaultValue={pegawai?.jabatan || ""}
            required
            placeholder="Guru BK"
            className="h-8 text-sm"
          />
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Hak Akses *</Label>
          <select
            name="role"
            defaultValue={pegawai?.role || "UMUM"}
            className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="UMUM">Umum — Akses Terbatas</option>
            <option value="KHUSUS">Khusus — Akses Penuh</option>
          </select>
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Username *</Label>
          <Input
            name="username"
            type="text"
            defaultValue={pegawai?.username || ""}
            required
            placeholder="username"
            className="h-8 text-sm"
          />
        </div>

        {/* No HP */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">No. HP</Label>
          <Input
            name="noHp"
            defaultValue={pegawai?.noHp || ""}
            placeholder="081234567890"
            className="h-8 text-sm"
          />
        </div>

        {/* Alamat */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Alamat</Label>
          <Textarea
            name="alamat"
            defaultValue={pegawai?.alamat || ""}
            placeholder="Jl. Contoh No. 123"
            rows={2}
            className="text-sm resize-none"
          />
        </div>

        {/* SK Riwayat */}
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Riwayat SK</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-primary cursor-pointer"
              onClick={() => setSkList([...skList, { noSK: "", tanggal: "", jenis: "" }])}
            >
              <Plus className="h-3 w-3 mr-1" /> Tambah
            </Button>
          </div>
          {skList.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-3">Belum ada SK</p>
          )}
          {skList.map((sk, i) => (
            <div key={i} className="p-2.5 rounded-md border border-border/50 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">SK #{i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-red-500 hover:bg-red-500/10 cursor-pointer"
                  onClick={() => setSkList(skList.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Input
                value={sk.noSK}
                onChange={(e) => {
                  const u = [...skList];
                  u[i] = { ...u[i], noSK: e.target.value };
                  setSkList(u);
                }}
                placeholder="No. SK"
                className="h-7 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={sk.tanggal}
                  onChange={(e) => {
                    const u = [...skList];
                    u[i] = { ...u[i], tanggal: e.target.value };
                    setSkList(u);
                  }}
                  className="h-7 text-xs"
                />
                <Input
                  value={sk.jenis}
                  onChange={(e) => {
                    const u = [...skList];
                    u[i] = { ...u[i], jenis: e.target.value };
                    setSkList(u);
                  }}
                  placeholder="Jenis SK"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {loading ? "Menyimpan..." : isNew ? "Tambah Pegawai" : "Simpan"}
        </Button>
      </div>
    </form>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-[420px] sm:max-w-[420px] p-0 [&>button]:hidden"
            : "h-[85vh] rounded-t-2xl p-0 [&>button]:hidden"
        }
      >
        {formContent}
      </SheetContent>
    </Sheet>
  );
}
