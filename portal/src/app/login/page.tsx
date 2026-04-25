import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Masuk — Portal SMPIT Asy-Syadzili",
  description: "Masuk ke Portal SMPIT Asy-Syadzili untuk mengakses aplikasi sekolah.",
};

export default function LoginPage() {
  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-full overflow-hidden bg-background">
      {/* ── Left: Login form ────────────────────────── */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </section>

      {/* ── Right: Aurora panel ─────────────────────── */}
      <section className="hidden md:block flex-1 relative p-4">
        <div className="login-slide-right login-delay-300 absolute inset-4 rounded-3xl overflow-hidden hero-aurora">
          {/* Aurora waves */}
          <div className="hero-wave hero-wave-1" />
          <div className="hero-wave hero-wave-2" />
          <div className="hero-wave hero-wave-3" />
          <div className="hero-wave hero-wave-4" />
          <div className="hero-wave hero-wave-5" />

          {/* Grain overlay */}
          <div className="hero-aurora-grain" />

          {/* Bottom info card */}
          <div className="absolute bottom-8 left-8 right-8 z-10">
            <div className="login-testimonial login-delay-1000 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">SMPIT Asy-Syadzili</p>
                  <p className="text-white/60 text-xs">Portal Akademik Terpadu</p>
                </div>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Platform terintegrasi untuk pengelolaan data guru, siswa, rapor digital, dan administrasi sekolah secara digital.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
