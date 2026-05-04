import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { OpsPageHeader } from "@/components/ops/ops-page-header";
import { ProfilSekolahForm } from "@/components/profil-sekolah-form";
import { OpsSettingsGroup } from "@/components/ops/ops-settings-group";
import { MapPin, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  if (user.accessLevel !== "KHUSUS") return <AccessDenied />;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <OpsPageHeader
        title="Pengaturan"
        description="Konfigurasi sistem dan operasional AsyOps."
      />

      {/* Quick links to sub-settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/settings/geofence" className="group flex items-center gap-3.5 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/50 transition-colors">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
            <MapPin className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Geofence & Presensi</p>
            <p className="text-xs text-muted-foreground">Atur lokasi, radius, dan jam kerja</p>
          </div>
        </Link>
      </div>

      {/* Profil Sekolah */}
      <OpsSettingsGroup title="Profil Sekolah" description="Identitas dan informasi dasar sekolah">
        <ProfilSekolahForm />
      </OpsSettingsGroup>
    </div>
  );
}
