import { PageHeader } from "@/components/shared/page-header";
import { ContentSection } from "@/components/shared/content-section";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Logs — Admin Console",
};

export default function AdminAuditPage() {
  return (
    <div className="space-y-0 px-6 lg:px-8 py-6">
      <PageHeader
        title="Audit Logs"
        description="Log aktivitas sistem dan perubahan pengguna."
      />

      <ContentSection>
        <div className="rounded-xl border border-border/60 bg-asy-surface/40 p-8">
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="Belum ada log aktivitas"
            description="Log aktivitas akan muncul di sini ketika fitur audit log diaktifkan. Fitur ini mencatat login, perubahan pengguna, dan aksi admin."
          />
        </div>
      </ContentSection>
    </div>
  );
}
