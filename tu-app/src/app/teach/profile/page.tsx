import { Suspense } from "react";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { FaceEnrollment } from "@/components/face-enrollment";
import { Briefcase, Phone, MapPin, Mail, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const pegawai = await db.pegawai.findUnique({
    where: { id: user.id },
    include: { faceEnrollment: true },
  });

  if (!pegawai) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Profil tidak ditemukan</p>
          <p className="text-sm mt-1">Harap hubungi admin.</p>
        </div>
      </div>
    );
  }

  const enrollmentData = {
    id: pegawai.faceEnrollment?.id || undefined,
    status: (pegawai.faceEnrollment?.status || "NOT_REGISTERED") as "NOT_REGISTERED" | "SUBMITTED" | "APPROVED" | "REJECTED",
    approvedPhotoUrl: pegawai.faceEnrollment?.approvedPhotoUrl || undefined,
    pendingPhotoUrl: pegawai.faceEnrollment?.pendingPhotoUrl || undefined,
    rejectionReason: pegawai.faceEnrollment?.rejectionReason || undefined,
  };

  const infoItems = [
    { icon: Briefcase, label: "Jabatan", value: pegawai.jabatan || "Guru" },
    { icon: Mail, label: "Username", value: user.username },
    { icon: Phone, label: "No. HP", value: pegawai.noHp || "-" },
    { icon: MapPin, label: "Alamat", value: pegawai.alamat || "-" },
  ];

  return (
    <div className="flex-1">
      {/* =========== MOBILE LAYOUT =========== */}
      <div className="md:hidden min-h-screen flex flex-col">
        {/* Top section — light/gradient bg */}
        <div className="relative flex-shrink-0 bg-gradient-to-b from-emerald-50 via-teal-50/50 to-background dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-background pt-8 pb-6">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          
          <div className="relative z-10 flex flex-col items-center px-4">
            {/* Circular face photo */}
            <Suspense fallback={<div className="w-32 h-32 rounded-full bg-muted animate-pulse" />}>
              <FaceEnrollment initialData={enrollmentData} />
            </Suspense>

            {/* Name + NIP */}
            <h1 className="mt-4 text-lg font-bold text-center">{pegawai.namaLengkap}</h1>
            <p className="text-sm text-muted-foreground font-mono">{pegawai.nip || "NIP Belum Diatur"}</p>
            
            {/* Role badge */}
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <Shield className="w-3 h-3" />
              {pegawai.jabatan || "Guru"}
            </div>
          </div>
        </div>

        {/* Bottom section — dark card with info */}
        <div className="flex-1 -mt-1 bg-gray-900 dark:bg-gray-950 rounded-t-[28px] relative z-10 pt-6 pb-24">
          <div className="px-5 space-y-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-4 px-1">Informasi Pribadi</h3>
            
            {infoItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium text-gray-100 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========== DESKTOP LAYOUT =========== */}
      <div className="hidden md:flex flex-col items-center max-w-4xl mx-auto p-8 gap-8">
        {/* Header */}
        <div className="w-full">
          <h2 className="text-2xl font-bold tracking-tight">Profil Saya</h2>
          <p className="text-sm text-muted-foreground mt-1">Kelola informasi pribadi dan verifikasi wajah Anda.</p>
        </div>

        <div className="w-full grid grid-cols-[1fr_2fr] gap-8 items-start">
          {/* Left — Avatar card */}
          <div className="bg-card border rounded-2xl p-8 flex flex-col items-center sticky top-8 shadow-sm">
            <Suspense fallback={<div className="w-40 h-40 rounded-full bg-muted animate-pulse" />}>
              <FaceEnrollment initialData={enrollmentData} />
            </Suspense>
            <h3 className="mt-5 font-bold text-lg text-center">{pegawai.namaLengkap}</h3>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">{pegawai.nip || "NIP Belum Diatur"}</p>
            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <Shield className="w-3 h-3" />
              {pegawai.jabatan || "Guru"}
            </div>
          </div>

          {/* Right — Info card */}
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h3 className="font-semibold">Informasi Pribadi</h3>
            </div>
            <div className="divide-y">
              {[
                { label: "Nama Lengkap", value: pegawai.namaLengkap },
                { label: "NIP", value: pegawai.nip || "-", mono: true },
                ...infoItems.map(item => ({ label: item.label, value: item.value })),
              ].map((row, i) => (
                <div key={i} className="flex items-center px-6 py-4 hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-muted-foreground w-36 shrink-0">{row.label}</span>
                  <span className={`text-sm font-medium ${'mono' in row && row.mono ? "font-mono" : ""}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
