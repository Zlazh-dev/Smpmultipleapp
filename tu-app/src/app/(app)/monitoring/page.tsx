import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { OpsPageHeader } from "@/components/ops/ops-page-header";
import { OpsStatBlock } from "@/components/ops/ops-stat-block";
import { OpsStatusBadge } from "@/components/ops/ops-status-badge";
import { OpsQueueItem } from "@/components/ops/ops-queue-item";
import { OpsEmptyState } from "@/components/ops/ops-empty-state";
import { ClipboardCheck, AlertTriangle, TrendingUp, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MonitoringPage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  if (user.accessLevel !== "KHUSUS") return <AccessDenied />;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [pegawaiCount, presensiToday, cutiApproved] = await Promise.all([
    db.pegawai.count(),
    db.presensi.findMany({
      where: { tanggal: { gte: today, lt: tomorrow } },
      include: { pegawai: { select: { id: true, namaLengkap: true, jabatan: true } } },
    }),
    db.cuti.findMany({
      where: { status: "APPROVED", tanggalMulai: { lte: tomorrow }, tanggalSelesai: { gte: today } },
      include: { pegawai: { select: { id: true, namaLengkap: true } } },
    }),
  ]);

  const checkedInIds = new Set(presensiToday.map((p) => p.pegawaiId));
  const cutiIds = new Set(cutiApproved.map((c) => c.pegawaiId));
  const hadirCount = presensiToday.filter((p) => p.status === "HADIR").length;
  const absentCount = pegawaiCount - checkedInIds.size - cutiIds.size;
  const rate = pegawaiCount > 0 ? Math.round((hadirCount / pegawaiCount) * 100) : 0;

  // Get staff who haven't checked in (not on cuti)
  const allPegawai = await db.pegawai.findMany({
    where: { accessLevel: "UMUM" },
    select: { id: true, namaLengkap: true, jabatan: true },
    orderBy: { namaLengkap: "asc" },
  });
  const absent = allPegawai.filter((p) => !checkedInIds.has(p.id) && !cutiIds.has(p.id));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <OpsPageHeader
        title="Monitoring"
        description="Pantau kehadiran dan aktivitas operasional hari ini."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <OpsStatBlock label="Hadir" value={hadirCount} icon={<ClipboardCheck className="h-4 w-4 text-emerald-500" />} sub={`${rate}%`} trend={rate >= 90 ? "up" : "down"} />
        <OpsStatBlock label="Belum Presensi" value={absentCount > 0 ? absentCount : 0} icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} sub={absentCount > 0 ? "Perlu dicek" : "Semua hadir"} trend={absentCount > 0 ? "attention" : "neutral"} />
        <OpsStatBlock label="Sedang Cuti" value={cutiApproved.length} icon={<Users className="h-4 w-4 text-blue-500" />} sub="Hari ini" />
        <OpsStatBlock label="Total Pegawai" value={pegawaiCount} icon={<Users className="h-4 w-4 text-muted-foreground" />} sub="Terdaftar" />
      </div>

      {/* Exception list: who hasn't checked in */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Belum Presensi Hari Ini
        </h2>
        <div className="rounded-xl border border-border/50 bg-card/50">
          {absent.length === 0 ? (
            <OpsEmptyState
              icon={<ClipboardCheck className="h-6 w-6" />}
              title="Semua pegawai sudah presensi"
              description="Tidak ada pegawai yang belum melakukan presensi hari ini."
            />
          ) : (
            absent.map((p) => (
              <OpsQueueItem
                key={p.id}
                avatar={p.namaLengkap.charAt(0)}
                title={p.namaLengkap}
                subtitle={p.jabatan}
                status={<OpsStatusBadge status="ALFA" label="Belum" />}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
