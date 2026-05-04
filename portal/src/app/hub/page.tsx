import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAppsForRole, isAdminRole } from "@/lib/config";
import { WelcomeHeader } from "@/components/hub/welcome-header";
import { ContentSection } from "@/components/shared/content-section";
import { AppEntry } from "@/components/shared/app-entry";
import { AppList } from "@/components/shared/app-list";
import { AnnouncementBanner } from "@/components/shared/announcement-banner";
import { FeedItem } from "@/components/shared/feed-item";
import { LogIn, KeyRound, MonitorSmartphone, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function HubHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { user } = session;
  const userApps = getAppsForRole(user.role);
  const isAdmin = isAdminRole(user.role);

  return (
    <div className="space-y-0">
      <WelcomeHeader name={user.name} role={user.role} />

      <div className="pt-4">
        <AnnouncementBanner title="Semua layanan beroperasi normal" type="success" />
      </div>

      {/* Two-column: Apps (left) + Activity (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left — App launcher — 3/5 */}
        <div className="lg:col-span-3">
          <ContentSection title="Aplikasi">
            <AppList>
              {userApps.map((app) => {
                const Icon = app.icon;
                return (
                  <AppEntry
                    key={app.key}
                    name={app.label}
                    description={app.description}
                    icon={Icon}
                    color={app.color}
                    status={app.status}
                    ssoUrl={`/api/sso/redirect?app=${app.ssoKey}`}
                  />
                );
              })}
            </AppList>

            {isAdmin && (
              <div className="mt-4">
                <Link href="/hub/admin" className="group flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-asy-surface/50 hover:bg-asy-surface-alt/50 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-asy-selected">
                    <ShieldCheck className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Admin Console</p>
                    <p className="text-xs text-muted-foreground">Kelola pengguna & sistem</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </ContentSection>
        </div>

        {/* Right — Activity — 2/5 */}
        <div className="lg:col-span-2">
          <ContentSection
            title="Aktivitas Terbaru"
            headerAction={
              <Link href="/hub/activity" className="text-xs text-asy-accent hover:text-asy-accent-hover font-medium flex items-center gap-0.5">
                Lihat Semua <ChevronRight className="h-3 w-3" />
              </Link>
            }
            panel
          >
            <div className="space-y-0.5">
              <FeedItem icon={<LogIn className="h-3.5 w-3.5" />} title="Login berhasil" description="Anda masuk ke AsyHub" timestamp="Baru saja" />
              <FeedItem icon={<MonitorSmartphone className="h-3.5 w-3.5" />} title="Sesi aktif" description="Chrome di Windows" timestamp="Saat ini" />
              <FeedItem icon={<KeyRound className="h-3.5 w-3.5" />} title="Akun terdaftar" description="Akun Anda dibuat di AsyHub" timestamp="—" />
            </div>
          </ContentSection>
        </div>
      </div>
    </div>
  );
}
