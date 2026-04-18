import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ClipboardCheck,
  CalendarOff,
  FolderOpen,
  TrendingUp,
  Clock,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const isKhusus = user.role === "KHUSUS";

  if (isKhusus) {
    // ── KHUSUS: Full admin dashboard ──
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

    const stats = [
      { title: "Total Pegawai", value: pegawaiCount, icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10", change: "Aktif", trend: "neutral" },
      { title: "Presensi Hari Ini", value: `${presensiHariIni}/${pegawaiCount}`, icon: ClipboardCheck, color: "text-emerald-500", bgColor: "bg-emerald-500/10", change: `${presensiRate}%`, trend: presensiRate >= 90 ? "up" : "down" },
      { title: "Cuti Pending", value: cutiPending, icon: CalendarOff, color: "text-amber-500", bgColor: "bg-amber-500/10", change: "Butuh approval", trend: cutiPending > 0 ? "attention" : "neutral" },
      { title: "Dokumen e-Filing", value: dokumenCount, icon: FolderOpen, color: "text-violet-500", bgColor: "bg-violet-500/10", change: "Total arsip", trend: "neutral" },
    ];

    const recentPresensi = await db.presensi.findMany({
      take: 8, orderBy: { createdAt: "desc" },
      include: { pegawai: { select: { namaLengkap: true, jabatan: true, nip: true } } },
    });

    const pendingCuti = await db.cuti.findMany({
      where: { status: "PENDING" },
      include: { pegawai: { select: { namaLengkap: true, jabatan: true } } },
      orderBy: { createdAt: "desc" }, take: 5,
    });

    return (
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard Tata Usaha
          </h1>
          <p className="text-muted-foreground mt-1">
            Ringkasan data kepegawaian SMPIT Asy-Syadzili
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={stat.title} className={`border-border/50 animate-fade-in-up animation-delay-${(i + 1) * 100}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs">
                  {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                  {stat.trend === "attention" && <Clock className="h-3 w-3 text-amber-500" />}
                  <span className="text-muted-foreground">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-3 border-border/50 animate-fade-in-up animation-delay-300">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Presensi Terbaru</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPresensi.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Belum ada data presensi</p>
                ) : (
                  recentPresensi.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">{p.pegawai.namaLengkap.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium">{p.pegawai.namaLengkap}</p>
                          <p className="text-[11px] text-muted-foreground">{p.pegawai.jabatan}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.status === "HADIR" ? "default" : "secondary"}
                          className={p.status === "HADIR" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0"
                            : p.status === "IZIN" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0"
                            : p.status === "SAKIT" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0"
                            : "bg-red-500/15 text-red-600 dark:text-red-400 border-0"}>{p.status}</Badge>
                        <span className="text-[10px] text-muted-foreground">{new Date(p.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-border/50 animate-fade-in-up animation-delay-400">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Cuti Pending</CardTitle>
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">{cutiPending}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingCuti.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada cuti pending</p>
                ) : (
                  pendingCuti.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-border/30 bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{c.pegawai.namaLengkap}</p>
                        <Badge variant="outline" className="text-[10px]">{c.jenisCuti}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.alasan}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{new Date(c.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} — {new Date(c.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                        <span>• {c.lamaHari} hari</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── UMUM: Personal dashboard ──
  const pegawai = await db.pegawai.findUnique({ where: { id: user.id } });

  const myPresensi = await db.presensi.findMany({
    where: { pegawaiId: user.id },
    orderBy: { tanggal: "desc" },
    take: 10,
  });

  const myCuti = await db.cuti.findMany({
    where: { pegawaiId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const presensiThisMonth = myPresensi.filter((p) => {
    const d = new Date(p.tanggal);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const hadirCount = presensiThisMonth.filter((p) => p.status === "HADIR").length;
  const izinCount = presensiThisMonth.filter((p) => p.status === "IZIN" || p.status === "SAKIT").length;
  const cutiAktif = myCuti.filter((c) => c.status === "APPROVED").length;
  const cutiPendingCount = myCuti.filter((c) => c.status === "PENDING").length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Selamat Datang, {pegawai?.namaLengkap || user.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {pegawai?.jabatan || "Pegawai"} • SMPIT Asy-Syadzili
        </p>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Hadir Bulan Ini", value: hadirCount, icon: ClipboardCheck, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
          { title: "Izin/Sakit", value: izinCount, icon: CalendarOff, color: "text-amber-500", bgColor: "bg-amber-500/10" },
          { title: "Cuti Aktif", value: cutiAktif, icon: CalendarOff, color: "text-blue-500", bgColor: "bg-blue-500/10" },
          { title: "Cuti Pending", value: cutiPendingCount, icon: Clock, color: "text-violet-500", bgColor: "bg-violet-500/10" },
        ].map((stat, i) => (
          <Card key={stat.title} className={`border-border/50 animate-fade-in-up animation-delay-${(i + 1) * 100}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Personal Info + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="border-border/50 animate-fade-in-up animation-delay-300">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Informasi Pribadi</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Nama Lengkap", value: pegawai?.namaLengkap || "-" },
                { label: "NIP", value: pegawai?.nip || "-" },
                { label: "Jabatan", value: pegawai?.jabatan || "-" },
                { label: "Username", value: pegawai?.username || "-" },
                { label: "No. HP", value: pegawai?.noHp || "-" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Presensi */}
        <Card className="border-border/50 animate-fade-in-up animation-delay-400">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Riwayat Presensi</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myPresensi.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Belum ada data presensi</p>
              ) : (
                myPresensi.slice(0, 7).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary"
                        className={p.status === "HADIR" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]"
                          : p.status === "IZIN" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 text-[10px]"
                          : p.status === "SAKIT" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[10px]"
                          : "bg-red-500/15 text-red-600 dark:text-red-400 border-0 text-[10px]"}>{p.status}</Badge>
                      {p.keterangan && <span className="text-[10px] text-muted-foreground">{p.keterangan}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
