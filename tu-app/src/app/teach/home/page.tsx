import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { TeachPageHeader } from "@/components/teach/teach-page-header";
import { TeachStatusBlock } from "@/components/teach/teach-status-block";
import { TeachQuickAction } from "@/components/teach/teach-quick-action";
import { TeachActivityItem } from "@/components/teach/teach-activity-item";
import { OpsStatusBadge } from "@/components/ops/ops-status-badge";
import {
  ClipboardCheck,
  CalendarOff,
  FolderOpen,
  Bell,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeachHomePage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const pegawai = await db.pegawai.findUnique({ 
    where: { id: user.id },
    include: { faceEnrollment: true }
  });

  // Today's attendance from new CQRS summary
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const todaySummary = await db.dailyAttendanceSummary.findUnique({
    where: { pegawaiId_date: { pegawaiId: user.id, date: today } },
  });

  // Check cuti
  const activeCuti = await db.cuti.findFirst({
    where: {
      pegawaiId: user.id,
      status: "APPROVED",
      tanggalMulai: { lte: tomorrow },
      tanggalSelesai: { gte: today },
    },
  });

  const pendingCutiCount = await db.cuti.count({
    where: { pegawaiId: user.id, status: "PENDING" },
  });

  // Recent 5 attendance summaries
  const recentSummaries = await db.dailyAttendanceSummary.findMany({
    where: { pegawaiId: user.id },
    orderBy: { date: "desc" },
    take: 5,
  });

  // Attendance state
  const attendanceState = activeCuti
    ? "on_leave" as const
    : todaySummary?.status === "HADIR"
      ? "checked_in" as const
      : "not_checked" as const;

  const checkInTime = todaySummary?.checkInTime
    ? new Date(todaySummary.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <TeachPageHeader
        title={`Halo, ${pegawai?.namaLengkap || user.name}`}
        description={`${pegawai?.jabatan || "Guru"} · SMPIT Asy-Syadzili`}
      />

      {(!pegawai?.faceEnrollment || pegawai.faceEnrollment.status === "REJECTED") && (
        <Link href="/teach/profile" className="block">
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3 transition-colors hover:bg-amber-200/50 dark:hover:bg-amber-900/50">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-900 dark:text-amber-200 text-sm">Verifikasi Wajah Belum Selesai</h4>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                {pegawai?.faceEnrollment?.status === "REJECTED" 
                  ? "Foto wajah Anda ditolak admin. Silakan unggah ulang." 
                  : "Anda belum mendaftarkan foto wajah untuk presensi."}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* Today's status — prominent */}
      <TeachStatusBlock state={attendanceState} time={checkInTime} />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <TeachQuickAction
          href="/teach/attendance"
          icon={<ClipboardCheck className="h-5 w-5 text-emerald-600" />}
          label="Presensi"
          description="Cek status hari ini"
          color="bg-emerald-500/10"
        />
        <TeachQuickAction
          href="/teach/leave"
          icon={<CalendarOff className="h-5 w-5 text-amber-600" />}
          label="Ajukan Cuti"
          description={pendingCutiCount > 0 ? `${pendingCutiCount} pending` : "Buat pengajuan baru"}
          color="bg-amber-500/10"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TeachQuickAction
          href="/teach/efiling"
          icon={<FolderOpen className="h-5 w-5 text-violet-600" />}
          label="e-Filing"
          description="Dokumen pribadi"
          color="bg-violet-500/10"
        />
        <TeachQuickAction
          href="/teach/notif"
          icon={<Bell className="h-5 w-5 text-blue-600" />}
          label="Notifikasi"
          description="Update terbaru"
          color="bg-blue-500/10"
        />
      </div>

      {/* Recent presensi */}
      <div>
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Riwayat Presensi Terakhir
        </h2>
        <div className="rounded-xl border border-border/50 bg-card/50">
          {recentSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Belum ada data presensi
            </p>
          ) : (
            recentSummaries.map((s) => (
              <TeachActivityItem
                key={s.id}
                icon={<ClipboardCheck className="h-4 w-4" />}
                title={new Date(s.date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                subtitle={s.keterangan || undefined}
                badge={<OpsStatusBadge status={s.status} />}
                time={
                  s.checkInTime
                    ? new Date(s.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                    : undefined
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
