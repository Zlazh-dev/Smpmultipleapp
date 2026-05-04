import { PageHeader } from "@/components/shared/page-header";
import { ContentSection } from "@/components/shared/content-section";
import { apps, roleLabels } from "@/lib/config";
import { AppBadge } from "@/components/shared/app-badge";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "App Access — Admin Console",
};

export default function AdminAppAccessPage() {
  return (
    <div className="space-y-0 px-6 lg:px-8 py-6">
      <PageHeader
        title="App Access"
        description="Konfigurasi akses aplikasi berdasarkan role."
      />

      <ContentSection>
        <div className="space-y-3">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <div key={app.key} className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-asy-surface/40">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ${app.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="text-sm font-semibold">{app.label}</h3>
                    <AppBadge status={app.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2.5">{app.description}</p>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Roles dengan akses:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {app.allowedRoles.map((role) => (
                        <Badge key={role} variant="outline" className="text-[10px]">
                          {roleLabels[role]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ContentSection>
    </div>
  );
}
