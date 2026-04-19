import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { RoleCard } from "@/components/role-card";
import { Role } from "@prisma/client";

const roles: Role[] = [Role.TU, Role.RADIG, Role.Guru, Role.WaliSantri];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />

        {/* Role Cards Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Pilih Aplikasi Anda
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Masuk ke aplikasi sesuai peran Anda untuk mengakses fitur yang
                telah disesuaikan dengan kebutuhan masing-masing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {roles.map((role, index) => (
                <RoleCard key={role} role={role} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Kenapa Portal Asy-Syadzili?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Sistem terintegrasi yang dirancang untuk memudahkan seluruh
                civitas akademika sekolah.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  title: "Terintegrasi",
                  description:
                    "Semua aplikasi terhubung dalam satu ekosistem — data mengalir dari pendaftaran hingga kelulusan.",
                  emoji: "🔗",
                },
                {
                  title: "Aman & Terpercaya",
                  description:
                    "Autentikasi berlapis dan otorisasi berbasis peran menjaga keamanan data siswa dan guru.",
                  emoji: "🛡️",
                },
                {
                  title: "Mudah Digunakan",
                  description:
                    "Antarmuka modern dan responsif yang bisa diakses dari perangkat apa pun, kapan pun.",
                  emoji: "✨",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="text-center space-y-3 p-6 rounded-xl bg-card/50 border border-border/50 hover:border-border transition-colors"
                >
                  <div className="text-4xl">{feature.emoji}</div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
