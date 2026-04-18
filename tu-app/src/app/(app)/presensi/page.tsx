import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { PresensiTable } from "@/components/presensi-table";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ tanggal?: string }>;
}

export default async function PresensiPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const isKhusus = user.role === "KHUSUS";
  const params = await searchParams;
  const today = new Date();
  const filterDate = params.tanggal ? new Date(params.tanggal) : today;
  filterDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(filterDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // KHUSUS: all presensi, UMUM: own only
  const whereClause: any = { tanggal: { gte: filterDate, lt: nextDay } };
  if (!isKhusus) {
    whereClause.pegawaiId = user.id;
  }

  const presensi = await db.presensi.findMany({
    where: whereClause,
    include: {
      pegawai: { select: { namaLengkap: true, nip: true, jabatan: true } },
    },
    orderBy: { pegawai: { namaLengkap: "asc" } },
  });

  // Cuti integration: find approved cuti covering this date
  const cutiWhere: any = {
    status: "APPROVED",
    tanggalMulai: { lte: nextDay },
    tanggalSelesai: { gte: filterDate },
  };
  if (!isKhusus) cutiWhere.pegawaiId = user.id;

  const approvedCuti = await db.cuti.findMany({
    where: cutiWhere,
    include: { pegawai: { select: { id: true, namaLengkap: true, nip: true, jabatan: true } } },
  });

  const cutiPegawaiIds = new Set(approvedCuti.map((c) => c.pegawaiId));

  // Belum presensi (KHUSUS only): exclude those who already checked in AND those on cuti
  let belumPresensi: any[] = [];
  if (isKhusus) {
    const allPegawai = await db.pegawai.findMany({
      select: { id: true, namaLengkap: true, nip: true, jabatan: true },
      orderBy: { namaLengkap: "asc" },
    });
    const checkedInIds = new Set(presensi.map((p) => p.pegawaiId));
    belumPresensi = allPegawai.filter((p) => !checkedInIds.has(p.id) && !cutiPegawaiIds.has(p.id));
  }

  // Build flat presensi list, adding cuti entries as virtual "IZIN" rows
  const flatPresensi = presensi.map((p) => ({
    id: p.id,
    namaLengkap: p.pegawai.namaLengkap,
    nip: p.pegawai.nip,
    jabatan: p.pegawai.jabatan,
    status: p.status,
    keterangan: p.keterangan,
    jamDatang: p.jamDatang ? new Date(p.jamDatang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : null,
    jamPulang: p.jamPulang ? new Date(p.jamPulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : null,
  }));

  // Add approved cuti as IZIN entries (if not already checked in)
  const checkedInIds = new Set(presensi.map((p) => p.pegawaiId));
  for (const cuti of approvedCuti) {
    if (!checkedInIds.has(cuti.pegawaiId)) {
      flatPresensi.push({
        id: `cuti-${cuti.id}`,
        namaLengkap: cuti.pegawai.namaLengkap,
        nip: cuti.pegawai.nip,
        jabatan: cuti.pegawai.jabatan,
        status: "IZIN",
        keterangan: `Cuti ${cuti.jenisCuti}`,
        jamDatang: null,
        jamPulang: null,
      });
    }
  }

  // Sort by name
  flatPresensi.sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));

  const statusCounts = {
    HADIR: flatPresensi.filter((p) => p.status === "HADIR").length,
    IZIN: flatPresensi.filter((p) => p.status === "IZIN").length,
    SAKIT: flatPresensi.filter((p) => p.status === "SAKIT").length,
    ALFA: flatPresensi.filter((p) => p.status === "ALFA").length,
  };

  const dateStr = filterDate.toISOString().split("T")[0];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isKhusus ? "Presensi Harian" : "Presensi Saya"}
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {filterDate.toLocaleDateString("id-ID", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Date + Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 animate-fade-in-up">
        <form className="col-span-2 sm:col-span-1 flex gap-1.5">
          <Input type="date" name="tanggal" defaultValue={dateStr} className="h-8 text-xs" />
          <Button type="submit" variant="secondary" size="sm" className="h-8 px-2 cursor-pointer">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </form>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-card">
            <span className="text-lg font-bold">{count}</span>
            <Badge
              className={
                status === "HADIR" ? "bg-emerald-500/15 text-emerald-500 border-0 text-[10px]"
                : status === "IZIN" ? "bg-blue-500/15 text-blue-500 border-0 text-[10px]"
                : status === "SAKIT" ? "bg-amber-500/15 text-amber-500 border-0 text-[10px]"
                : "bg-red-500/15 text-red-500 border-0 text-[10px]"
              }
            >
              {status}
            </Badge>
          </div>
        ))}
      </div>

      {/* Table */}
      <PresensiTable
        data={JSON.parse(JSON.stringify(flatPresensi))}
        belumPresensi={JSON.parse(JSON.stringify(belumPresensi))}
        isKhusus={isKhusus}
        userId={user.id}
      />
    </div>
  );
}
