"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  User,
  FileText,
  Upload,
  Pencil,
  Download,
  Trash2,
  ScrollText,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SkRiwayat {
  noSK: string;
  tanggal: string;
  jenis: string;
  perihal?: string;
  berlakuSampai?: string;
  keterangan?: string;
}

interface DokumenData {
  id: string;
  namaAsli: string;
  namaFile: string;
  ukuran: number;
  mimeType: string;
  createdAt: string;
}

interface PegawaiData {
  id: string;
  nip: string;
  namaLengkap: string;
  jabatan: string;
  accessLevel: string;
  username: string;
  noHp: string | null;
  alamat: string | null;
  skRiwayat: SkRiwayat[];
  kinerja: { skor?: number; grade?: string } | null;
  dokumen: DokumenData[];
  createdAt: string;
}

const tabs = [
  { id: "profil", label: "Profil", icon: User },
  { id: "sk", label: "Riwayat SK", icon: ScrollText },
  { id: "dokumen", label: "Dokumen", icon: FileText },
];

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0 py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground sm:w-40 shrink-0">{label}</span>
      <span className="text-sm">{value || "—"}</span>
    </div>
  );
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PegawaiDetail({ pegawai }: { pegawai: PegawaiData }) {
  const [activeTab, setActiveTab] = useState("profil");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File terlalu besar (maks 10MB)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kategori", "SK");

      const res = await fetch(`/api/pegawai/${pegawai.id}/dokumen`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal upload");

      toast.success("Dokumen berhasil diupload");
      router.refresh();
    } catch {
      toast.error("Gagal upload dokumen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Hapus dokumen ini?")) return;
    try {
      const res = await fetch(`/api/pegawai/${pegawai.id}/dokumen/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal hapus");
      toast.success("Dokumen dihapus");
      router.refresh();
    } catch {
      toast.error("Gagal menghapus dokumen");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/pegawai" className="mt-1 p-1.5 rounded-md hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{pegawai.namaLengkap}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span className="font-mono text-xs">{pegawai.nip}</span>
            <span>·</span>
            <span>{pegawai.jabatan}</span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                pegawai.accessLevel === "KHUSUS"
                  ? "bg-purple-500/10 text-purple-600"
                  : "bg-blue-500/10 text-blue-600"
              )}
            >
              {pegawai.accessLevel}
            </span>
          </div>
        </div>
        <Link href={`/pegawai/${pegawai.id}/edit`}>
          <Button variant="outline" size="sm" className="cursor-pointer">
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.id === "sk" && pegawai.skRiwayat.length > 0 && (
              <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                {pegawai.skRiwayat.length}
              </span>
            )}
            {tab.id === "dokumen" && pegawai.dokumen.length > 0 && (
              <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                {pegawai.dokumen.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Profil Tab */}
      {activeTab === "profil" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Informasi Pegawai
            </h3>
            <div className="rounded-lg border border-border/50 p-4">
              <InfoRow label="Nama Lengkap" value={pegawai.namaLengkap} />
              <InfoRow label="NIP" value={pegawai.nip} />
              <InfoRow label="Jabatan" value={pegawai.jabatan} />
              <InfoRow label="Username" value={pegawai.username} />
              <InfoRow label="Access Level" value={pegawai.accessLevel} />
              <InfoRow label="No. HP" value={pegawai.noHp} />
              <InfoRow label="Alamat" value={pegawai.alamat} />
            </div>
          </div>

          <div className="space-y-4">
            {pegawai.kinerja?.skor && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  e-Kinerja
                </h3>
                <div className="rounded-lg border border-border/50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20">
                      <span className="text-2xl font-bold text-emerald-600">
                        {pegawai.kinerja.skor}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Grade: {pegawai.kinerja.grade || "—"}</p>
                      <p className="text-xs text-muted-foreground">Skor kinerja terakhir</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Ringkasan
              </h3>
              <div className="rounded-lg border border-border/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Jumlah SK</span>
                  <span className="text-sm font-semibold">{pegawai.skRiwayat.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dokumen Terupload</span>
                  <span className="text-sm font-semibold">{pegawai.dokumen.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Terdaftar</span>
                  <span className="text-sm font-semibold">{formatDate(pegawai.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SK Timeline Tab */}
      {activeTab === "sk" && (
        <div className="space-y-4">
          {pegawai.skRiwayat.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada riwayat SK</p>
              <Link href={`/pegawai/${pegawai.id}/edit`}>
                <Button variant="outline" size="sm" className="mt-3 cursor-pointer">
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Tambah SK
                </Button>
              </Link>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />

              {pegawai.skRiwayat
                .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                .map((sk, i) => (
                  <div key={i} className="relative pl-10 pb-6 last:pb-0">
                    {/* Timeline dot */}
                    <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background shadow-sm" />

                    <div className="rounded-lg border border-border/50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{sk.noSK}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                              sk.jenis.toLowerCase().includes("pengangkatan")
                                ? "bg-emerald-500/10 text-emerald-600"
                                : sk.jenis.toLowerCase().includes("mutasi")
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-blue-500/10 text-blue-600"
                            )}>
                              {sk.jenis}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(sk.tanggal)}
                          </div>
                          {sk.berlakuSampai && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                              <Clock className="h-3 w-3" />
                              s/d {formatDate(sk.berlakuSampai)}
                            </div>
                          )}
                        </div>
                      </div>
                      {sk.perihal && (
                        <p className="text-sm mt-2 text-muted-foreground">{sk.perihal}</p>
                      )}
                      {sk.keterangan && (
                        <p className="text-xs mt-1 italic text-muted-foreground/70">{sk.keterangan}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Dokumen Tab */}
      {activeTab === "dokumen" && (
        <div className="space-y-4">
          {/* Upload button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pegawai.dokumen.length} dokumen SK
            </p>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="cursor-pointer"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {uploading ? "Mengupload..." : "Upload Dokumen"}
              </Button>
            </div>
          </div>

          {pegawai.dokumen.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada dokumen</p>
              <p className="text-xs mt-1">Upload file SK dalam format PDF, JPG, atau DOC</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pegawai.dokumen.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.namaAsli}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{formatFileSize(doc.ukuran)}</span>
                      <span>·</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/api/pegawai/${pegawai.id}/dokumen/${doc.id}`}
                      target="_blank"
                      className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
