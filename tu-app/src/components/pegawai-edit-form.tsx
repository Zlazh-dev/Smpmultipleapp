"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface SkRiwayat {
  noSK: string;
  tanggal: string;
  jenis: string;
}

interface PegawaiData {
  id: string;
  nip: string;
  namaLengkap: string;
  jabatan: string;
  username: string;
  noHp: string;
  alamat: string;
  skRiwayat: SkRiwayat[];
  kinerja: Record<string, any> | null;
}

export function PegawaiEditForm({ pegawai, isNew }: { pegawai: PegawaiData; isNew?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [skList, setSkList] = useState<SkRiwayat[]>(pegawai.skRiwayat || []);

  const addSk = () => {
    setSkList([...skList, { noSK: "", tanggal: "", jenis: "" }]);
  };

  const removeSk = (index: number) => {
    setSkList(skList.filter((_, i) => i !== index));
  };

  const updateSk = (index: number, field: keyof SkRiwayat, value: string) => {
    const updated = [...skList];
    updated[index] = { ...updated[index], [field]: value };
    setSkList(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body: any = {
      namaLengkap: formData.get("namaLengkap"),
      jabatan: formData.get("jabatan"),
      username: formData.get("username"),
      noHp: formData.get("noHp") || null,
      alamat: formData.get("alamat") || null,
      skRiwayat: skList.filter((sk) => sk.noSK),
    };
    if (isNew) body.nip = formData.get("nip");

    try {
      const url = isNew ? "/api/pegawai" : `/api/pegawai/${pegawai.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      toast.success(isNew ? "Pegawai berhasil ditambahkan" : "Data pegawai berhasil diperbarui");
      router.push("/pegawai");
      router.refresh();
    } catch {
      toast.error("Gagal menyimpan data pegawai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
      {/* Basic Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nip">NIP {isNew && "*"}</Label>
            <Input id="nip" name="nip" defaultValue={pegawai.nip} disabled={!isNew} className={!isNew ? "bg-muted/50" : ""} required={isNew} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
            <Input id="namaLengkap" name="namaLengkap" defaultValue={pegawai.namaLengkap} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jabatan">Jabatan *</Label>
            <Input id="jabatan" name="jabatan" defaultValue={pegawai.jabatan} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input id="username" name="username" type="text" defaultValue={pegawai.username} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="noHp">No. HP</Label>
            <Input id="noHp" name="noHp" defaultValue={pegawai.noHp} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Textarea id="alamat" name="alamat" defaultValue={pegawai.alamat} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* SK Riwayat */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Riwayat SK</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addSk} className="cursor-pointer">
              <Plus className="mr-1 h-3 w-3" />
              Tambah SK
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {skList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat SK</p>
          ) : (
            skList.map((sk, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-lg border border-border/30 bg-muted/20">
                <div className="space-y-1">
                  <Label className="text-xs">No. SK</Label>
                  <Input
                    value={sk.noSK}
                    onChange={(e) => updateSk(i, "noSK", e.target.value)}
                    placeholder="001/KS/2026"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tanggal</Label>
                  <Input
                    type="date"
                    value={sk.tanggal}
                    onChange={(e) => updateSk(i, "tanggal", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Jenis</Label>
                  <Input
                    value={sk.jenis}
                    onChange={(e) => updateSk(i, "jenis", e.target.value)}
                    placeholder="Pengangkatan"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                    onClick={() => removeSk(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href="/pegawai">
          <Button variant="ghost" type="button" className="cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Menyimpan..." : isNew ? "Tambah Pegawai" : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
