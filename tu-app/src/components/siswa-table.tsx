"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, User } from "lucide-react";
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

  /* ── Toolbar (inside the card) ── */
  const toolbar = (
    <>
      <form onSubmit={handleSearch} className="toolbar-search">
        <Search />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, NISN, NIS..."
        />
      </form>
      <select
        value={currentKelas}
        onChange={(e) => navigate({ kelas: e.target.value, page: "1" })}
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
      >
        <option value="Aktif">Aktif</option>
        <option value="Lulus">Lulus</option>
        <option value="Pindah">Pindah</option>
        <option value="Keluar">Keluar</option>
        <option value="">Semua</option>
      </select>
    </>
  );

  /* ── Status badge helper ── */
  const statusBadge = (s: string) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
        s === "Aktif"
          ? "bg-emerald-500/10 text-emerald-600"
          : s === "Lulus"
          ? "bg-blue-500/10 text-blue-600"
          : "bg-red-500/10 text-red-500"
      }`}
    >
      {s}
    </span>
  );

  return (
    <div className="space-y-0 animate-fade-in-up">
      {/* Unified Card: toolbar + table + footer */}
      <div className="data-table-wrapper">
        {/* Toolbar */}
        <div className="table-toolbar">{toolbar}</div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
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
                  <td colSpan={7} className="!text-center !py-16 !text-muted-foreground !text-sm">
                    Tidak ada data siswa ditemukan
                  </td>
                </tr>
              ) : (
                siswa.map((s, i) => (
                  <tr
                    key={s.id_siswa}
                    className="cursor-pointer"
                    onClick={() => router.push(`/siswa/${s.id_siswa}`)}
                  >
                    <td className="row-num">{(page - 1) * limit + i + 1}</td>
                    <td>
                      <span className="font-medium text-[13px]">{s.nama_lengkap}</span>
                    </td>
                    <td className="col-mono col-id">{s.nisn}</td>
                    <td className="col-mono col-id">{s.nis || "—"}</td>
                    <td>{s.kelas?.nama_kelas || "—"}</td>
                    <td>{s.jenis_kelamin || "—"}</td>
                    <td>{statusBadge(s.status_siswa)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-2 p-3">
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
                {statusBadge(s.status_siswa)}
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="data-table-footer">
          <span>
            {total} siswa · Halaman {page}/{totalPages}
          </span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={page <= 1}
                onClick={() => navigate({ page: String(page - 1) })}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={page >= totalPages}
                onClick={() => navigate({ page: String(page + 1) })}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
