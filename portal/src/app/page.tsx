import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "AsyHub — SMPIT Asy-Syadzili",
  description: "AsyHub — Pusat identitas dan akses aplikasi SMPIT Asy-Syadzili. Login, kelola akun, dan akses semua aplikasi sekolah.",
};

export default function HomePage() {
  return (
    <div className="bg-black min-h-screen">
      <LandingPage />
    </div>
  );
}
