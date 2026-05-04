import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { OpsPageHeader } from "@/components/ops/ops-page-header";
import { OpsStatBlock } from "@/components/ops/ops-stat-block";
import { OpsStatusBadge } from "@/components/ops/ops-status-badge";
import { OpsQueueItem } from "@/components/ops/ops-queue-item";
import {
  Users,
  ClipboardCheck,
  CalendarOff,
  FolderOpen,
  Clock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const isKhusus = user.accessLevel === "KHUSUS";

  if (isKhusus) {
    const [pegawaiCount, presensiHariIni, cutiPending, dokumenCount] =
      await Promise.all([
        db.pegawai.count(),
        db.presensi.count({
          where: {
            tanggal: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
            status: "HADIR",
          },
        }),
        db.cuti.count({ where: { status: "PENDING" } }),
        db.dokumen.count(),
      ]);

    const presensiRate = pegawaiCount > 0
      ? Math.round((presensiHariIni / pegawaiCount) * 100)
      : 0;

    const recentPresensi = await db.presensi.findMany({
      take: 6, orderBy: { createdAt: "desc" },
      include: { pegawai: { select: { namaLengkap: true, jabatan: true } } },
    });

    const pendingCuti = await db.cuti.findMany({
      where: { status: "PENDING" },
      include: { pegawai: { select: { namaLengkap: true, jabatan: true } } },
      orderBy: { createdAt: "desc" }, take: 5,
    });

    return (
      <div className="p-4 lg:p-6 space-y-6">
        <OpsPageHeader
          title="AsyOps"
          description={`${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
        />

        {/* Inline stats — not card-heavy */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <OpsStatBlock
            label="Pegawai"
            value={pegawaiCount}
            icon={<Users className="h-4 w-4 text-blue-500" />}
            sub="Aktif"
          />
          <OpsStatBlock
            label="Presensi Hari Ini"
            value={`${presensiHariIni}/${pegawaiCount}`}
            icon={<ClipboardCheck className="h-4 w-4 text-emerald-500" />}
            sub={`${presensiRate}%`}
            trend={presensiRate >= 90 ? "up" : "down"}
          />
          <OpsStatBlock
            label="Cuti Pending"
            value={cutiPending}
            icon={<CalendarOff className="h-4 w-4 text-amber-500" />}
            sub={cutiPending > 0 ? "Butuh approval" : "Tidak ada"}
            trend={cutiPending > 0 ? "attention" : "neutral"}
          />
          <OpsStatBlock
            label="Dokumen"
            value={dokumenCount}
            icon={<FolderOpen className="h-4 w-4 text-violet-500" />}
            sub="Total arsip"
          />
        </div>

        {/* Two-column: Recent + Pending */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent presensi */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Presensi Terbaru</h2>
              <Link href="/presensi" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                Lihat Semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50">
              {recentPresensi.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data presensi</p>
              ) : (
                recentPresensi.map((p) => (
                  <OpsQueueItem
                    key={p.id}
                    avatar={p.pegawai.namaLengkap.charAt(0)}
                    title={p.pegawai.namaLengkap}
                    subtitle={p.pegawai.jabatan}
                    meta={new Date(p.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    status={<OpsStatusBadge status={p.status} />}
                  />
                ))
              )}
            </div>
          </div>

          {/* Pending cuti */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Persetujuan Pending</h2>
              <Link href="/approvals" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                Lihat Semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50">
              {pendingCuti.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Tidak ada cuti pending</p>
              ) : (
                pendingCuti.map((c) => (
                  <OpsQueueItem
                    key={c.id}
                    avatar={c.pegawai.namaLengkap.charAt(0)}
                    title={c.pegawai.namaLengkap}
                    subtitle={`${c.jenisCuti} · ${c.lamaHari} hari`}
                    meta={new Date(c.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    status={<OpsStatusBadge status="PENDING" />}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── UMUM: Personal view ──
  const pegawai = await db.pegawai.findUnique({ where: { id: user.id } });
  const myPresensi = await db.presensi.findMany({
    where: { pegawaiId: user.id }, orderBy: { tanggal: "desc" }, take: 10,
  });
  const myCuti = await db.cuti.findMany({
    where: { pegawaiId: user.id }, orderBy: { createdAt: "desc" }, take: 5,
  });

  const presensiThisMonth = myPresensi.filter((p) => {
    const d = new Date(p.tanggal);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const hadirCount = presensiThisMonth.filter((p) => p.status === "HADIR").length;
  const izinCount = presensiThisMonth.filter((p) => p.status === "IZIN" || p.status === "SAKIT").length;
  const cutiPendingCount = myCuti.filter((c) => c.status === "PENDING").length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <OpsPageHeader
        title={`Halo, ${pegawai?.namaLengkap || user.name}`}
        description={`${pegawai?.jabatan || "Pegawai"} · SMPIT Asy-Syadzili`}
      />

      <div className="grid grid-cols-3 gap-3">
        <OpsStatBlock label="Hadir" value={hadirCount} icon={<ClipboardCheck className="h-4 w-4 text-emerald-500" />} sub="Bulan ini" />
        <OpsStatBlock label="Izin/Sakit" value={izinCount} icon={<CalendarOff className="h-4 w-4 text-amber-500" />} sub="Bulan ini" />
        <OpsStatBlock label="Cuti Pending" value={cutiPendingCount} icon={<Clock className="h-4 w-4 text-violet-500" />} sub="Menunggu" />
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50">
        <div className="px-4 py-3 border-b border-border/30">
          <h2 className="text-sm font-semibold">Riwayat Presensi</h2>
        </div>
        {myPresensi.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data presensi</p>
        ) : (
          myPresensi.slice(0, 7).map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border/20 last:border-0">
              <span className="text-xs text-muted-foreground">
                {new Date(p.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
              </span>
              <OpsStatusBadge status={p.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
