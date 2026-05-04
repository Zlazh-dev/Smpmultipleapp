import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { TeachPageHeader } from "@/components/teach/teach-page-header";
import { TeachActivityItem } from "@/components/teach/teach-activity-item";
import { OpsStatusBadge } from "@/components/ops/ops-status-badge";
import { ClipboardCheck, CalendarOff, CheckCircle, XCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotifPage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  // Build activity feed from recent attendance summaries + cuti events
  const [recentSummaries, recentCuti] = await Promise.all([
    db.dailyAttendanceSummary.findMany({
      where: { pegawaiId: user.id },
      orderBy: { date: "desc" },
      take: 10,
    }),
    db.cuti.findMany({
      where: { pegawaiId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { pegawai: { select: { namaLengkap: true } } },
    }),
  ]);

  // Merge into unified timeline
  type ActivityEntry = {
    id: string;
    type: "presensi" | "cuti";
    title: string;
    subtitle?: string;
    status: string;
    time: Date;
  };

  const activities: ActivityEntry[] = [
    ...recentSummaries.map((s) => ({
      id: s.id,
      type: "presensi" as const,
      title: `Presensi ${s.status.toLowerCase()}`,
      subtitle: new Date(s.date).toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long",
      }),
      status: s.status,
      time: new Date(s.updatedAt),
    })),
    ...recentCuti.map((c) => ({
      id: c.id,
      type: "cuti" as const,
      title: `Cuti ${c.jenisCuti}`,
      subtitle: c.status === "APPROVED"
        ? "Pengajuan disetujui"
        : c.status === "REJECTED"
          ? "Pengajuan ditolak"
          : "Menunggu persetujuan",
      status: c.status,
      time: new Date(c.updatedAt),
    })),
  ];

  // Sort by time descending
  activities.sort((a, b) => b.time.getTime() - a.time.getTime());
  const limited = activities.slice(0, 15);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <TeachPageHeader
        title="Notifikasi"
        description="Aktivitas dan update terbaru Anda"
      />

      <div className="rounded-xl border border-border/50 bg-card/50">
        {limited.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Belum ada aktivitas
          </p>
        ) : (
          limited.map((a) => (
            <TeachActivityItem
              key={`${a.type}-${a.id}`}
              icon={
                a.type === "presensi"
                  ? <ClipboardCheck className="h-4 w-4" />
                  : a.status === "APPROVED"
                    ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                    : a.status === "REJECTED"
                      ? <XCircle className="h-4 w-4 text-red-500" />
                      : <Clock className="h-4 w-4 text-amber-500" />
              }
              title={a.title}
              subtitle={a.subtitle}
              badge={<OpsStatusBadge status={a.status} />}
              time={a.time.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            />
          ))
        )}
      </div>
    </div>
  );
}
