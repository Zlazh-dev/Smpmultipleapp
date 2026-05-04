import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ContentSection } from "@/components/shared/content-section";
import { SettingsGroup } from "@/components/shared/settings-group";
import { roleLabels } from "@/lib/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MonitorSmartphone, Shield, ChevronRight,
  GraduationCap, Briefcase, ShieldCheck, Users, UserCircle,
} from "lucide-react";
import type { Role } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account" };

const roleIcons: Record<string, typeof GraduationCap> = {
  Guru: GraduationCap, TU: Briefcase, RADIG: ShieldCheck, WaliSantri: Users,
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { user } = session;
  const RoleIcon = roleIcons[user.role] || UserCircle;

  return (
    <div className="space-y-0">
      <PageHeader title="Akun Saya" description="Kelola profil, keamanan, dan sesi akun Anda." />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <ContentSection>
            <div className="flex items-center gap-4 p-5 rounded-xl border border-border/60 bg-asy-surface/40">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-asy-accent text-asy-fg-on-accent text-lg font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-base font-semibold">{user.name || "User"}</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RoleIcon className="h-3.5 w-3.5 text-asy-accent" />
                  <span className="text-xs">{roleLabels[user.role]}</span>
                  <span className="text-[10px]">·</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            </div>
          </ContentSection>

          <SettingsGroup title="Detail Akun" items={[
            { label: "Username", value: <span className="font-mono text-xs">{(user as any).username || "—"}</span> },
            { label: "NIP", value: <span className="font-mono text-xs">{(user as any).nip || "—"}</span> },
            { label: "Email", value: (user as any).email || "—" },
            { label: "Role", value: roleLabels[user.role] },
          ]} />

          <div className="rounded-xl border border-border/60 bg-asy-surface/40 p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Keamanan</h3>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm">Password</p>
                  <p className="text-xs text-muted-foreground">Terakhir diubah: —</p>
                </div>
              </div>
              <button className="text-xs font-medium text-asy-accent hover:text-asy-accent-hover transition-colors flex items-center gap-1">
                Ubah <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <ContentSection title="Sesi Aktif">
            <div className="rounded-xl border border-border/60 bg-asy-surface/40 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-asy-surface-alt">
                  <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Browser saat ini</p>
                  <p className="text-xs text-muted-foreground">Sesi aktif sejak login terakhir</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              </div>
            </div>
          </ContentSection>
        </div>
      </div>
    </div>
  );
}
