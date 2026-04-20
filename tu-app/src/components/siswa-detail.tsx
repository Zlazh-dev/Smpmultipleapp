"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  User,
  BookOpen,
  FileText,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";

interface SiswaData {
  id_siswa: number;
  nisn: string;
  nis: string | null;
  nama_lengkap: string;
  jenis_kelamin: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  nik: string | null;
  agama: string | null;
  alamat: string | null;
  nama_ayah: string | null;
  nama_ibu: string | null;
  status_siswa: string;
  sekolah_asal: string | null;
  diterima_tanggal: string | null;
  diterima_di_kelas: string | null;
  anak_ke: number | null;
  status_dalam_keluarga: string | null;
  telepon_siswa: string | null;
  pekerjaan_ayah: string | null;
  telepon_ayah: string | null;
  pekerjaan_ibu: string | null;
  telepon_ibu: string | null;
  nama_wali: string | null;
  telepon_wali: string | null;
  pekerjaan_wali: string | null;
  foto_siswa: string | null;
  kelas?: {
    nama_kelas: string;
    tahun_ajaran?: { tahun_ajaran: string } | null;
    wali_kelas?: { nama_guru: string } | null;
  } | null;
  rapor: RaporData[];
  catatan: CatatanData[];
}

interface RaporData {
  id_rapor: number;
  semester: number | null;
  id_tahun_ajaran: number | null;
  sakit: number | null;
  izin: number | null;
  tanpa_keterangan: number | null;
  catatan_wali_kelas: string | null;
  deskripsi_kokurikuler: string | null;
  deskripsi_ekstrakurikuler: string | null;
  status: string | null;
  tanggal_rapor: string | null;
  detail_akademik: { nilai_akhir: number | null; nilai_katrol: number | null; capaian_kompetensi: string | null; mapel: { nama_mapel: string } | null }[];
}

interface CatatanData {
  id_catatan: number;
  kategori_catatan: string;
  isi_catatan: string;
  tanggal_catatan: string;
}

const tabs = [
  { id: "profil", label: "Profil", icon: User },
  { id: "rapor", label: "Rapor", icon: BookOpen },
  { id: "kedisiplinan", label: "Kedisiplinan", icon: AlertTriangle },
];

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0 py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground sm:w-40 shrink-0">{label}</span>
      <span className="text-sm">{value || "-"}</span>
    </div>
  );
}

export function SiswaDetail({ siswa }: { siswa: SiswaData }) {
  const [activeTab, setActiveTab] = useState("profil");

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/siswa"
          className="mt-1 p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{siswa.nama_lengkap}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>NISN: {siswa.nisn}</span>
            {siswa.kelas && (
              <>
                <span>·</span>
                <span>Kelas {siswa.kelas.nama_kelas}</span>
              </>
            )}
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                siswa.status_siswa === "Aktif"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-red-500/10 text-red-500"
              )}
            >
              {siswa.status_siswa}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.id === "rapor" && siswa.rapor.length > 0 && (
              <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                {siswa.rapor.length}
              </span>
            )}
            {tab.id === "kedisiplinan" && siswa.catatan.length > 0 && (
              <span className="ml-1 text-[10px] bg-amber-500/15 text-amber-600 px-1.5 py-0.5 rounded-full">
                {siswa.catatan.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "profil" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Pribadi */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Data Pribadi
            </h3>
            <div className="rounded-lg border border-border/50 p-4">
              <InfoRow label="Nama Lengkap" value={siswa.nama_lengkap} />
              <InfoRow label="NISN" value={siswa.nisn} />
              <InfoRow label="NIS" value={siswa.nis} />
              <InfoRow label="NIK" value={siswa.nik} />
              <InfoRow label="Jenis Kelamin" value={siswa.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} />
              <InfoRow label="Tempat, Tgl Lahir" value={`${siswa.tempat_lahir || ""}, ${formatDate(siswa.tanggal_lahir)}`} />
              <InfoRow label="Agama" value={siswa.agama} />
              <InfoRow label="Alamat" value={siswa.alamat} />
              <InfoRow label="Telepon" value={siswa.telepon_siswa} />
              <InfoRow label="Anak Ke" value={siswa.anak_ke} />
              <InfoRow label="Status" value={siswa.status_dalam_keluarga} />
            </div>
          </div>

          {/* Data Sekolah + Orang Tua */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Data Sekolah
              </h3>
              <div className="rounded-lg border border-border/50 p-4">
                <InfoRow label="Kelas" value={siswa.kelas?.nama_kelas} />
                <InfoRow label="Wali Kelas" value={siswa.kelas?.wali_kelas?.nama_guru} />
                <InfoRow label="Tahun Ajaran" value={siswa.kelas?.tahun_ajaran?.tahun_ajaran} />
                <InfoRow label="Sekolah Asal" value={siswa.sekolah_asal} />
                <InfoRow label="Diterima Tanggal" value={formatDate(siswa.diterima_tanggal)} />
                <InfoRow label="Diterima di Kelas" value={siswa.diterima_di_kelas} />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Orang Tua / Wali
              </h3>
              <div className="rounded-lg border border-border/50 p-4">
                <InfoRow label="Ayah" value={siswa.nama_ayah} />
                <InfoRow label="Pekerjaan Ayah" value={siswa.pekerjaan_ayah} />
                <InfoRow label="Telepon Ayah" value={siswa.telepon_ayah} />
                <InfoRow label="Ibu" value={siswa.nama_ibu} />
                <InfoRow label="Pekerjaan Ibu" value={siswa.pekerjaan_ibu} />
                <InfoRow label="Telepon Ibu" value={siswa.telepon_ibu} />
                {siswa.nama_wali && (
                  <>
                    <InfoRow label="Wali" value={siswa.nama_wali} />
                    <InfoRow label="Pekerjaan Wali" value={siswa.pekerjaan_wali} />
                    <InfoRow label="Telepon Wali" value={siswa.telepon_wali} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "rapor" && (
        <div className="space-y-4">
          {siswa.rapor.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada data rapor</p>
            </div>
          ) : (
            siswa.rapor.map((r) => (
              <div key={r.id_rapor} className="rounded-lg border border-border/50 overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border/30 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Semester {r.semester}
                  </span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium",
                    r.status === "Final" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                  )}>
                    {r.status || "Draft"}
                  </span>
                </div>

                {/* Akademik */}
                {r.detail_akademik.length > 0 && (
                  <div className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Nilai Akademik</p>
                    <div className="data-table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Mata Pelajaran</th>
                            <th>Nilai</th>
                            <th className="hidden sm:table-cell">Capaian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.detail_akademik.map((d, i) => (
                            <tr key={i}>
                              <td>{d.mapel?.nama_mapel || "-"}</td>
                              <td className="font-semibold">{d.nilai_akhir ?? "-"}</td>
                              <td className="hidden sm:table-cell text-xs text-muted-foreground max-w-[300px] truncate">
                                {d.capaian_kompetensi || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Kehadiran */}
                <div className="px-4 pb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Sakit: <strong className="text-foreground">{r.sakit || 0}</strong></span>
                  <span>Izin: <strong className="text-foreground">{r.izin || 0}</strong></span>
                  <span>Tanpa Keterangan: <strong className="text-amber-500">{r.tanpa_keterangan || 0}</strong></span>
                </div>

                {r.catatan_wali_kelas && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground">Catatan Wali Kelas:</p>
                    <p className="text-sm italic mt-1">{r.catatan_wali_kelas}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "kedisiplinan" && (
        <div className="space-y-2">
          {siswa.catatan.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada catatan kedisiplinan</p>
            </div>
          ) : (
            siswa.catatan.map((c) => (
              <div key={c.id_catatan} className="rounded-lg border border-border/50 p-4 flex items-start gap-3">
                <div className={cn(
                  "h-2 w-2 rounded-full mt-1.5 shrink-0",
                  c.kategori_catatan === "Karakter" ? "bg-amber-500" :
                  c.kategori_catatan === "Akademik" ? "bg-blue-500" :
                  c.kategori_catatan === "Keterampilan" ? "bg-emerald-500" : "bg-purple-500"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                      c.kategori_catatan === "Karakter" ? "bg-amber-500/10 text-amber-600" :
                      c.kategori_catatan === "Akademik" ? "bg-blue-500/10 text-blue-600" :
                      c.kategori_catatan === "Keterampilan" ? "bg-emerald-500/10 text-emerald-600" :
                      "bg-purple-500/10 text-purple-600"
                    )}>
                      {c.kategori_catatan}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {c.tanggal_catatan ? new Date(c.tanggal_catatan).toLocaleDateString("id-ID") : ""}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{c.isi_catatan}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
