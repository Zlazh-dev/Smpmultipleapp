import { PageHeader } from "@/components/shared/page-header";
import { ContentSection } from "@/components/shared/content-section";
import { SettingsGroup } from "@/components/shared/settings-group";
import { AnnouncementBanner } from "@/components/shared/announcement-banner";
import { siteConfig } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Admin Console",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-0 px-6 lg:px-8 py-6">
      <PageHeader
        title="System Settings"
        description="Konfigurasi sistem AsyHub."
      />

      <ContentSection>
        <div className="space-y-4">
          <SettingsGroup
            title="Informasi Sistem"
            items={[
              { label: "Nama Aplikasi", value: siteConfig.name },
              { label: "Domain", value: siteConfig.domain },
              { label: "Versi", value: "1.0.0" },
              { label: "Environment", value: process.env.NODE_ENV || "development" },
            ]}
          />

          <SettingsGroup
            title="SSO Configuration"
            items={[
              { label: "JWT Issuer", value: "portal-smpit" },
              { label: "Token Expiry", value: "60 seconds" },
              { label: "Session Strategy", value: "JWT" },
              { label: "Session Max Age", value: "30 days" },
            ]}
          />

          <AnnouncementBanner
            title="Pengaturan lanjutan akan segera hadir"
            description="Konfigurasi maintenance mode, notifikasi, dan integrasi akan tersedia di versi berikutnya."
            type="info"
          />
        </div>
      </ContentSection>
    </div>
  );
}
