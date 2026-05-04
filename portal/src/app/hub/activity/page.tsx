import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ContentSection } from "@/components/shared/content-section";
import { FeedItem } from "@/components/shared/feed-item";
import { AnnouncementBanner } from "@/components/shared/announcement-banner";
import { LogIn, KeyRound, MonitorSmartphone, History } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity",
  description: "Aktivitas dan notifikasi akun Anda.",
};

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-0">
      <PageHeader
        title="Aktivitas"
        description="Notifikasi, riwayat akses, dan pengumuman sistem."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <ContentSection title="Notifikasi" panel>
            <div className="space-y-0.5">
              <FeedItem icon={<LogIn className="h-3.5 w-3.5" />} title="Login berhasil" description="Anda berhasil masuk ke AsyHub dari Chrome di Windows" timestamp="Baru saja" />
              <FeedItem icon={<MonitorSmartphone className="h-3.5 w-3.5" />} title="Sesi aktif terdeteksi" description="Perangkat baru terdeteksi di akun Anda" timestamp="Saat ini" />
              <FeedItem icon={<KeyRound className="h-3.5 w-3.5" />} title="Akun terdaftar" description="Akun Anda berhasil dibuat di AsyHub" timestamp="—" />
            </div>
          </ContentSection>

          <ContentSection title="Riwayat Akses" panel>
            <div className="space-y-0.5">
              <FeedItem icon={<History className="h-3.5 w-3.5" />} title="Akses AsyTeach" description="Masuk melalui SSO" timestamp="Hari ini" />
              <FeedItem icon={<History className="h-3.5 w-3.5" />} title="Akses AsyOps" description="Masuk melalui SSO" timestamp="Kemarin" />
            </div>
          </ContentSection>
        </div>

        <div className="lg:col-span-2">
          <ContentSection title="Pengumuman">
            <div className="space-y-3">
              <AnnouncementBanner title="Semua layanan beroperasi normal" description="Tidak ada jadwal maintenance." type="success" />
              <AnnouncementBanner title="AsyHub v1.0" description="Selamat datang di AsyHub — pusat identitas dan akses aplikasi." type="info" />
            </div>
          </ContentSection>
        </div>
      </div>
    </div>
  );
}
