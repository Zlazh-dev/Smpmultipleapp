import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { GeofenceSettingsForm } from "@/components/geofence-settings";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  if (user.role !== "KHUSUS") return <AccessDenied />;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Pengaturan Presensi</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Konfigurasi geofencing dan jam kerja
        </p>
      </div>
      <GeofenceSettingsForm />
    </div>
  );
}
