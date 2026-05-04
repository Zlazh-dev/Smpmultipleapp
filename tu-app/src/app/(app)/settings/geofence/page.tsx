import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { OpsPageHeader } from "@/components/ops/ops-page-header";
import { GeofenceSettingsForm } from "@/components/geofence-settings";

export const dynamic = "force-dynamic";

export default async function GeofenceSettingsPage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  if (user.accessLevel !== "KHUSUS") return <AccessDenied />;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <OpsPageHeader
        title="Geofence & Presensi"
        description="Atur lokasi, radius presensi, dan jam kerja."
      />
      <GeofenceSettingsForm />
    </div>
  );
}
