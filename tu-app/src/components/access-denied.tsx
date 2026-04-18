import Link from "next/link";
import { ShieldX } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <div className="text-center max-w-md animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <ShieldX className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Akses Ditolak</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini.
          Halaman ini hanya tersedia untuk pengguna dengan akses <strong>Khusus</strong>.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
