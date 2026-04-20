"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, GraduationCap, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiswaRow {
  id_siswa: number;
  nisn: string;
  nis: string | null;
  nama_lengkap: string;
  jenis_kelamin: string | null;
  status_siswa: string;
  kelas?: {
    nama_kelas: string;
    tahun_ajaran?: { tahun_ajaran: string } | null;
  } | null;
}

interface KelasOption {
  id_kelas: number;
  nama_kelas: string;
  _count: { siswa: number };
}

interface SiswaTableProps {
  siswa: SiswaRow[];
  kelasList: KelasOption[];
  total: number;
  page: number;
  limit: number;
  currentKelas: string;
  currentStatus: string;
  currentSearch: string;
}

export function SiswaTable({
  siswa,
  kelasList,
  total,
  page,
  limit,
  currentKelas,
  currentStatus,
  currentSearch,
}: SiswaTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const totalPages = Math.ceil(total / limit);

  const navigate = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      const merged = {
        kelas: currentKelas,
        status: currentStatus,
        search: currentSearch,
        page: String(page),
        ...params,
      };
      Object.entries(merged).forEach(([k, v]) => {
        if (v) sp.set(k, v);
      });
      router.push(`/siswa?${sp.toString()}`);
    },
    [router, currentKelas, currentStatus, currentSearch, page]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search, page: "1" });
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NISN, atau NIS..."
            className="pl-9 h-9 text-sm"
          />
        </form>
        <select
          value={currentKelas}
          onChange={(e) => navigate({ kelas: e.target.value, page: "1" })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Semua Kelas</option>
          {kelasList.map((k) => (
            <option key={k.id_kelas} value={String(k.id_kelas)}>
              {k.nama_kelas} ({k._count.siswa})
            </option>
          ))}
        </select>
        <select
          value={currentStatus}
          onChange={(e) => navigate({ status: e.target.value, page: "1" })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="Aktif">Aktif</option>
          <option value="Lulus">Lulus</option>
          <option value="Pindah">Pindah</option>
          <option value="Keluar">Keluar</option>
          <option value="">Semua</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="row-num">#</th>
              <th>Nama Lengkap</th>
              <th>NISN</th>
              <th>NIS</th>
              <th>Kelas</th>
              <th>L/P</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {siswa.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  Tidak ada data siswa ditemukan
                </td>
              </tr>
            ) : (
              siswa.map((s, i) => (
                <tr key={s.id_siswa}>
                  <td className="row-num">{(page - 1) * limit + i + 1}</td>
                  <td>
                    <Link
                      href={`/siswa/${s.id_siswa}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {s.nama_lengkap}
                    </Link>
                  </td>
                  <td className="col-mono">{s.nisn}</td>
                  <td className="col-mono">{s.nis || "-"}</td>
                  <td>{s.kelas?.nama_kelas || "-"}</td>
                  <td>{s.jenis_kelamin || "-"}</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        s.status_siswa === "Aktif"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : s.status_siswa === "Lulus"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {s.status_siswa}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {siswa.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Tidak ada data siswa ditemukan
          </div>
        ) : (
          siswa.map((s) => (
            <Link
              key={s.id_siswa}
              href={`/siswa/${s.id_siswa}`}
              className="mobile-card flex items-center gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.nama_lengkap}</p>
                <p className="text-[11px] text-muted-foreground">
                  {s.nisn} · {s.kelas?.nama_kelas || "Tanpa Kelas"}
                </p>
              </div>
              <span
                className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  s.status_siswa === "Aktif"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {s.jenis_kelamin || ""}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Halaman {page} dari {totalPages} ({total} siswa)
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={page <= 1}
              onClick={() => navigate({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={page >= totalPages}
              onClick={() => navigate({ page: String(page + 1) })}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
