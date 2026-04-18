import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { PresensiLaporan } from "@/components/presensi-laporan";

export const dynamic = "force-dynamic";

export default async function LaporanPresensiPage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  if (user.role !== "KHUSUS") return <AccessDenied />;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Laporan Presensi</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Rekap dan export data presensi
        </p>
      </div>
      <PresensiLaporan />
    </div>
  );
}
