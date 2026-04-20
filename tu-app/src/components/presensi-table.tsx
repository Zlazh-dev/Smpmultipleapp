"use client";

import { useState } from "react";
import { DataTable, Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, MapPin, Loader2, CheckCircle, Search, Calendar } from "lucide-react";
import { QrScannerDialog } from "@/components/qr-scanner";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PresensiRow {
  id: string;
  namaLengkap: string;
  nip: string;
  jabatan: string;
  status: string;
  keterangan: string | null;
  jamDatang: string | null;
  jamPulang: string | null;
}

interface BelumPresensi {
  id: string;
  namaLengkap: string;
  nip: string;
  jabatan: string;
}

const statusBadge = (status: string) => (
  <Badge
    className={
      status === "HADIR" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]"
      : status === "IZIN" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 text-[10px]"
      : status === "SAKIT" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[10px]"
      : "bg-red-500/15 text-red-600 dark:text-red-400 border-0 text-[10px]"
    }
  >
    {status}
  </Badge>
);

const columns: Column<PresensiRow>[] = [
  {
    key: "namaLengkap",
    label: "Nama",
    render: (row) => <span className="font-medium text-[13px]">{row.namaLengkap}</span>,
  },
  { key: "nip", label: "NIP", mono: true, className: "col-id" },
  {
    key: "jabatan",
    label: "Jabatan",
    render: (row) => (
      <Badge variant="secondary" className="text-[10px] font-normal">{row.jabatan}</Badge>
    ),
    mobileHidden: true,
  },
  {
    key: "status",
    label: "Status",
    render: (row) => statusBadge(row.status),
  },
  {
    key: "jamDatang",
    label: "Masuk",
    render: (row) => (
      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{row.jamDatang || "—"}</span>
    ),
  },
  {
    key: "jamPulang",
    label: "Pulang",
    render: (row) => (
      <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{row.jamPulang || "—"}</span>
    ),
  },
  {
    key: "keterangan",
    label: "Keterangan",
    render: (row) => (
      <span className="text-xs text-muted-foreground">{row.keterangan || "—"}</span>
    ),
    mobileHidden: true,
  },
];

export function PresensiTable({
  data,
  belumPresensi,
  isKhusus = true,
  userId,
  dateStr,
}: {
  data: PresensiRow[];
  belumPresensi: BelumPresensi[];
  isKhusus?: boolean;
  userId?: string;
  dateStr: string;
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(data.length > 0 && !isKhusus);
  const router = useRouter();

  // UMUM self-check-in with geofencing
  const handleSelfCheckIn = async () => {
    if (!userId) return;
    setCheckingIn(true);

    try {
      // Get GPS location
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation tidak didukung"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });

      const res = await fetch("/api/presensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegawaiId: userId,
          status: "HADIR",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Gagal presensi");
        return;
      }

      toast.success(`Presensi berhasil! Selamat datang, ${result.pegawai?.namaLengkap}`);
      setCheckedIn(true);
      router.refresh();
    } catch (err: any) {
      if (err.code === 1) {
        toast.error("Izin lokasi ditolak. Aktifkan GPS untuk presensi.");
      } else if (err.code === 2) {
        toast.error("Lokasi tidak tersedia. Pastikan GPS aktif.");
      } else if (err.code === 3) {
        toast.error("Waktu mendapatkan lokasi habis. Coba lagi.");
      } else {
        toast.error(err.message || "Gagal presensi");
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const toolbar = (
    <>
      <form className="contents" action="/presensi">
        <div className="toolbar-search" style={{ maxWidth: 180 }}>
          <Calendar />
          <input
            type="date"
            name="tanggal"
            defaultValue={dateStr}
            style={{ paddingLeft: 30 }}
          />
        </div>
        <button type="submit" className="toolbar-btn toolbar-btn-ghost">
          <Search className="h-3.5 w-3.5" />
          Filter
        </button>
      </form>
      <div className="toolbar-spacer" />
      {isKhusus && (
        <button
          type="button"
          className="toolbar-btn toolbar-btn-primary"
          onClick={() => setScannerOpen(true)}
        >
          <QrCode className="h-3.5 w-3.5" />
          Scan QR
        </button>
      )}
    </>
  );

  return (
    <>
      {/* UMUM: Self check-in button */}
      {!isKhusus && !checkedIn && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-center space-y-3 animate-fade-in-up mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Presensi Hari Ini</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Tekan tombol di bawah untuk mencatat kehadiran. Lokasi GPS Anda akan diverifikasi.
            </p>
          </div>
          <Button
            onClick={handleSelfCheckIn}
            disabled={checkingIn}
            className="h-10 px-6 cursor-pointer"
          >
            {checkingIn ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memverifikasi lokasi...</>
            ) : (
              <><MapPin className="h-4 w-4 mr-2" /> Presensi Sekarang</>
            )}
          </Button>
        </div>
      )}

      {!isKhusus && checkedIn && (
        <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2 animate-fade-in mb-4">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Anda sudah presensi hari ini
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        keyField="id"
        emptyMessage={isKhusus ? "Belum ada data presensi hari ini" : "Belum ada presensi untuk tanggal ini"}
        toolbar={toolbar}
        footerLeft={`${data.length} presensi`}
        mobileCardRender={(row) => (
          <div className="mobile-card">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm">{row.namaLengkap}</p>
              {statusBadge(row.status)}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">{row.nip} · {row.jabatan}</p>
            {row.jamDatang && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Masuk: {row.jamDatang} {row.jamPulang ? `· Pulang: ${row.jamPulang}` : ""}
              </p>
            )}
            {row.keterangan && (
              <p className="text-xs text-muted-foreground mt-1">{row.keterangan}</p>
            )}
          </div>
        )}
      />

      {/* Belum presensi — KHUSUS only */}
      {isKhusus && belumPresensi.length > 0 && (
        <div className="mt-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 animate-fade-in-up animation-delay-200">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
            Belum Presensi ({belumPresensi.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {belumPresensi.map((p) => (
              <Badge key={p.id} variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400">
                {p.namaLengkap}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* QR Scanner — KHUSUS only */}
      {isKhusus && <QrScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} />}
    </>
  );
}
