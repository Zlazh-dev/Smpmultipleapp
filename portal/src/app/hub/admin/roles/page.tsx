import { PageHeader } from "@/components/shared/page-header";
import { ContentSection } from "@/components/shared/content-section";
import { roleLabels, roleDescriptions, apps } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Users } from "lucide-react";
import type { Role } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roles — Admin Console",
};

const roles: Role[] = ["RADIG", "TU", "Guru", "WaliSantri"];

const roleBadgeColors: Record<string, string> = {
  RADIG: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
  TU: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  Guru: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  WaliSantri: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
};

const roleIconColors: Record<string, string> = {
  RADIG: "text-violet-500 bg-violet-500/10",
  TU: "text-blue-500 bg-blue-500/10",
  Guru: "text-emerald-500 bg-emerald-500/10",
  WaliSantri: "text-amber-500 bg-amber-500/10",
};

export default function AdminRolesPage() {
  return (
    <div className="space-y-0 px-6 lg:px-8 py-6">
      <PageHeader
        title="Roles"
        description="Definisi dan deskripsi role pengguna di AsyHub."
      />

      <ContentSection>
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role} className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-asy-surface/40">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${roleIconColors[role]}`}>
                {role === "RADIG" || role === "TU" ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">{roleLabels[role]}</h3>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleBadgeColors[role]}`}>
                    {role}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2.5">{roleDescriptions[role]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {apps
                    .filter((app) => app.allowedRoles.includes(role))
                    .map((app) => (
                      <Badge key={app.key} variant="outline" className="text-[10px]">
                        {app.label}
                      </Badge>
                    ))}
                  {!apps.some((app) => app.allowedRoles.includes(role)) && (
                    <span className="text-[10px] text-muted-foreground italic">Tidak ada akses</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ContentSection>
    </div>
  );
}
