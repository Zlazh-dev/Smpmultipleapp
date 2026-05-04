import { PageHeader } from "@/components/shared/page-header";
import { ContentSection } from "@/components/shared/content-section";
import { AnnouncementBanner } from "@/components/shared/announcement-banner";
import { BookOpen, MessageCircle, HelpCircle, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support" };

const faqItems = [
  { question: "Bagaimana jika saya lupa password?", answer: "Hubungi administrator sekolah untuk mereset password akun Anda." },
  { question: "Kenapa saya tidak bisa login?", answer: "Pastikan username dan password benar. Jika masih gagal, hubungi admin." },
  { question: "Siapa yang bisa membuat akun baru?", answer: "Hanya administrator melalui Admin Console." },
  { question: "Bagaimana cara mengakses aplikasi?", answer: "Klik app entry di Home atau Apps. Anda masuk otomatis melalui SSO." },
  { question: "Apakah perlu login ulang untuk setiap app?", answer: "Tidak. AsyHub menggunakan SSO. Login sekali, akses semua." },
];

const helpLinks = [
  { title: "Cara login dan SSO", description: "Panduan masuk ke AsyHub dan akses aplikasi", icon: BookOpen },
  { title: "Cara mengubah password", description: "Langkah memperbarui password akun", icon: BookOpen },
  { title: "Cara mengakses aplikasi", description: "Panduan app launcher untuk AsyTeach dan AsyOps", icon: BookOpen },
];

export default function SupportPage() {
  return (
    <div className="space-y-0">
      <PageHeader title="Bantuan" description="Pusat bantuan, FAQ, dan kontak dukungan." />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <ContentSection title="Pusat Bantuan" panel>
            <div className="space-y-0.5">
              {helpLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <div key={link.title} className="flex items-center gap-3.5 py-3 px-3 -mx-3 rounded-lg hover:bg-asy-surface-alt/40 transition-colors cursor-pointer">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-asy-surface-alt text-asy-accent">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{link.title}</p>
                      <p className="text-xs text-muted-foreground">{link.description}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </div>
                );
              })}
            </div>
          </ContentSection>

          <ContentSection title="Pertanyaan Umum (FAQ)" panel>
            <div className="space-y-1">
              {faqItems.map((item) => (
                <details key={item.question} className="group">
                  <summary className="flex items-center justify-between cursor-pointer py-2.5 text-sm hover:text-asy-accent transition-colors">
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground group-open:text-asy-accent shrink-0" />
                      <span>{item.question}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-90 shrink-0 ml-2" />
                  </summary>
                  <p className="text-sm text-muted-foreground pb-2 pl-[26px]">{item.answer}</p>
                </details>
              ))}
            </div>
          </ContentSection>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <ContentSection title="Hubungi Admin">
            <div className="rounded-xl border border-border/60 bg-asy-surface/40 p-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-asy-surface-alt">
                  <MessageCircle className="h-4 w-4 text-asy-accent" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Kontak Administrator</p>
                  <p className="text-xs text-muted-foreground">Jika mengalami masalah, hubungi admin sekolah.</p>
                </div>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Status Sistem">
            <AnnouncementBanner title="Semua layanan beroperasi normal" description="AsyHub, AsyTeach, dan AsyOps beroperasi tanpa gangguan." type="success" />
          </ContentSection>
        </div>
      </div>
    </div>
  );
}
