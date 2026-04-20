"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Search } from "lucide-react";
import { PegawaiFormSheet } from "@/components/pegawai-form-sheet";

interface Pegawai {
  id: string;
  nip: string;
  namaLengkap: string;
  jabatan: string;
  accessLevel: string;
  username: string;
  noHp: string | null;
  alamat: string | null;
  skRiwayat: any[];
  kinerja: { skor?: number; grade?: string } | null;
}

const columns: Column<Pegawai>[] = [
  {
    key: "namaLengkap",
    label: "Nama",
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold shrink-0">
          {row.namaLengkap.charAt(0)}
        </div>
        <span className="font-medium text-[13px]">{row.namaLengkap}</span>
      </div>
    ),
    mobileLabel: "Nama",
  },
  {
    key: "nip",
    label: "NIP",
    mono: true,
    className: "col-id",
  },
  {
    key: "jabatan",
    label: "Jabatan",
    render: (row) => (
      <Badge variant="secondary" className="text-[10px] font-normal">
        {row.jabatan}
      </Badge>
    ),
  },
  {
    key: "username",
    label: "Username",
    mono: true,
    className: "col-id",
    mobileHidden: true,
  },
  {
    key: "noHp",
    label: "No. HP",
    mono: true,
    className: "col-id",
    render: (row) => row.noHp || "—",
    mobileHidden: true,
  },
  {
    key: "kinerja",
    label: "Kinerja",
    render: (row) => {
      const k = row.kinerja;
      if (!k?.skor) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge
          variant="outline"
          className={
            k.skor >= 90
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]"
              : k.skor >= 75
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]"
          }
        >
          {k.skor} — {k.grade}
        </Badge>
      );
    },
  },
];

interface PegawaiTableProps {
  data: Pegawai[];
  jabatanList: string[];
  currentSearch: string;
  currentJabatan: string;
}

export function PegawaiTable({ data, jabatanList, currentSearch, currentJabatan }: PegawaiTableProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editPegawai, setEditPegawai] = useState<Pegawai | undefined>(undefined);

  const handleOpenEdit = (row: Pegawai) => {
    setEditPegawai(row);
    setSheetOpen(true);
  };

  const editColumn: Column<Pegawai> = {
    key: "actions",
    label: "",
    className: "!w-10",
    render: (row) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleOpenEdit(row);
        }}
        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    ),
    mobileHidden: true,
  };

  const toolbar = (
    <>
      <form className="contents" action="/pegawai">
        <div className="toolbar-search">
          <Search />
          <input
            name="q"
            placeholder="Cari nama, NIP, username..."
            defaultValue={currentSearch}
          />
        </div>
        <select name="jabatan" defaultValue={currentJabatan}>
          <option value="">Semua Jabatan</option>
          {jabatanList.map((j) => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
        <button type="submit" className="toolbar-btn toolbar-btn-ghost">
          Filter
        </button>
      </form>
      <div className="toolbar-spacer" />
      <button
        type="button"
        className="toolbar-btn toolbar-btn-primary"
        onClick={() => { setEditPegawai(undefined); setSheetOpen(true); }}
      >
        <Plus className="h-3.5 w-3.5" />
        Tambah
      </button>
    </>
  );

  return (
    <>
      <DataTable
        columns={[...columns, editColumn]}
        data={data}
        keyField="id"
        emptyMessage="Tidak ada data pegawai"
        onRowClick={(row) => router.push(`/pegawai/${row.id}`)}
        toolbar={toolbar}
        footerLeft={`${data.length} pegawai`}
        mobileCardRender={(row) => (
          <div
            className="mobile-card cursor-pointer"
            onClick={() => router.push(`/pegawai/${row.id}`)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                  {row.namaLengkap.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{row.namaLengkap}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{row.nip}</p>
                </div>
              </div>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">{row.jabatan}</Badge>
              {row.kinerja?.skor && (
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  {row.kinerja.skor}
                </Badge>
              )}
            </div>
          </div>
        )}
      />

      {editPegawai && (
        <PegawaiFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          pegawai={{
            id: editPegawai.id,
            nip: editPegawai.nip,
            namaLengkap: editPegawai.namaLengkap,
            jabatan: editPegawai.jabatan,
            accessLevel: editPegawai.accessLevel,
            username: editPegawai.username,
            noHp: editPegawai.noHp || "",
            alamat: (editPegawai.alamat as string) || "",
          }}
        />
      )}
    </>
  );
}
