import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { TeachPageHeader } from "@/components/teach/teach-page-header";
import { TeachStatusBlock } from "@/components/teach/teach-status-block";
import { TeachStatRow } from "@/components/teach/teach-stat-row";
import { TeachActivityItem } from "@/components/teach/teach-activity-item";
import { OpsStatusBadge } from "@/components/ops/ops-status-badge";
import { ClipboardCheck, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  // Today's summary from CQRS
  const todaySummary = await db.dailyAttendanceSummary.findUnique({
    where: { pegawaiId_date: { pegawaiId: user.id, date: today } },
  });

  // Cuti check (canonical leave source)
  const activeCuti = await db.cuti.findFirst({
    where: {
      pegawaiId: user.id,
      status: "APPROVED",
      tanggalMulai: { lte: tomorrow },
      tanggalSelesai: { gte: today },
    },
  });

  // This month's summaries (exclude LIBUR from stats)
  const monthStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
  const monthEnd = new Date(today.getUTCFullYear(), today.getUTCMonth() + 1, 1);

  const monthSummaries = await db.dailyAttendanceSummary.findMany({
    where: {
      pegawaiId: user.id,
      date: { gte: monthStart, lt: monthEnd },
      status: { not: "LIBUR" },
    },
    orderBy: { date: "asc" },
  });

  const stats = {
    hadir: monthSummaries.filter((s) => s.status === "HADIR").length,
    izin: monthSummaries.filter((s) => s.status === "IZIN").length,
    sakit: monthSummaries.filter((s) => s.status === "SAKIT").length,
    alfa: monthSummaries.filter((s) => s.status === "ALFA").length,
  };

  // Recent 14-day history
  const recent = await db.dailyAttendanceSummary.findMany({
    where: { pegawaiId: user.id },
    orderBy: { date: "desc" },
    take: 14,
  });

  const attendanceState = activeCuti
    ? "on_leave" as const
    : todaySummary?.status === "HADIR"
      ? "checked_in" as const
      : "not_checked" as const;

  const checkInTime = todaySummary?.checkInTime
    ? new Date(todaySummary.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : null;

  const monthName = today.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <TeachPageHeader
        title="Presensi"
        description={today.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      />

      {/* Today's status */}
      <TeachStatusBlock state={attendanceState} time={checkInTime} />

      {/* Check-in action — only shown when not yet checked in */}
      {attendanceState === "not_checked" && (
        <Link
          href="/presensi/checkin"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98] transition-all"
        >
          <ClipboardCheck className="h-5 w-5" />
          Presensi Sekarang
        </Link>
      )}

      {/* Month summary */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Ringkasan {monthName}</h2>
        <div className="rounded-xl border border-border/50 bg-card/50">
          <TeachStatRow label="Hadir" value={stats.hadir} icon={<CheckCircle className="h-3.5 w-3.5 text-emerald-500" />} />
          <TeachStatRow label="Izin" value={stats.izin} icon={<Calendar className="h-3.5 w-3.5 text-blue-500" />} />
          <TeachStatRow label="Sakit" value={stats.sakit} icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />} />
          <TeachStatRow label="Alfa" value={stats.alfa} icon={<AlertTriangle className="h-3.5 w-3.5 text-red-500" />} />
        </div>
      </div>

      {/* Recent history */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Riwayat 14 Hari Terakhir</h2>
        <div className="rounded-xl border border-border/50 bg-card/50">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Belum ada data presensi
            </p>
          ) : (
            recent.map((s) => (
              <TeachActivityItem
                key={s.id}
                icon={<ClipboardCheck className="h-4 w-4" />}
                title={new Date(s.date).toLocaleDateString("id-ID", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
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
