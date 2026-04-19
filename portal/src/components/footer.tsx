import { GraduationCap } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-background/50">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold">SMPIT Asy-Syadzili</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Portal terpadu untuk mengelola seluruh kegiatan akademik dan
              administrasi Sekolah Menengah Pertama Islam Terpadu Asy-Syadzili.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Aplikasi</h4>
            <ul className="space-y-2">
              {[
                "Tata Usaha",
                "Waka Kurikulum",
                "Portal Guru",
                "Portal Wali Santri",
              ].map((item) => (
                <li key={item}>
                  <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Kontak</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>📍 Jl. Pendidikan No. 1</p>
              <p>📧 info@sekolahasy.com</p>
              <p>📞 (021) 123-4567</p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {currentYear} SMPIT Asy-Syadzili. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ for pendidikan Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
