import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAppsForRole, getRestrictedAppsForRole } from "@/lib/config";
import { PageHeader } from "@/components/shared/page-header";
import { ContentSection } from "@/components/shared/content-section";
import { AppEntry } from "@/components/shared/app-entry";
import { AppList } from "@/components/shared/app-list";
import { EmptyState } from "@/components/shared/empty-state";
import { LayoutGrid } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apps",
  description: "Semua aplikasi yang tersedia di AsyHub.",
};

export default async function AppsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { user } = session;
  const myApps = getAppsForRole(user.role);
  const otherApps = getRestrictedAppsForRole(user.role);

  return (
    <div className="space-y-0">
      <PageHeader
        title="Aplikasi"
        description="Semua aplikasi yang dapat Anda akses dari AsyHub."
      />

      {/* My Apps */}
      <ContentSection title="Aplikasi Saya">
        {myApps.length > 0 ? (
          <AppList>
            {myApps.map((app) => {
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
        ) : (
          <div className="rounded-xl border border-border/60 bg-asy-surface/40 p-8">
            <EmptyState
              icon={<LayoutGrid className="h-6 w-6" />}
              title="Belum ada aplikasi"
              description="Anda belum memiliki akses ke aplikasi apapun. Hubungi administrator."
            />
          </div>
        )}
      </ContentSection>

      {/* Other Apps */}
      {otherApps.length > 0 && (
        <ContentSection title="Aplikasi Lainnya">
          <AppList>
            {otherApps.map((app) => {
              const Icon = app.icon;
              return (
                <AppEntry
                  key={app.key}
                  name={app.label}
                  description={app.description}
                  icon={Icon}
                  color={app.color}
                  status="restricted"
                  ssoUrl="#"
                />
              );
            })}
          </AppList>
        </ContentSection>
      )}
    </div>
  );
}
