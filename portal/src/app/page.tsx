import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "Portal SMPIT Asy-Syadzili",
  description: "Portal Akademik Terpadu SMPIT Asy-Syadzili — Sistem terintegrasi untuk pengelolaan data guru, siswa, rapor digital, dan administrasi sekolah.",
};

export default function HomePage() {
  return (
    <div className="bg-black min-h-screen">
      <LandingPage />
    </div>
  );
}
