import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TU Dashboard",
  description: "Dashboard Tata Usaha — SMPIT Asy-Syadzili",
};

export default function TUDashboardSubPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">📊 Dashboard TU</h1>
        <p className="text-muted-foreground">
          Halaman dashboard Tata Usaha — akan berisi data presensi, administrasi, dll.
        </p>
        <p className="text-xs text-muted-foreground">
          Path: /tu/dashboard (internal rewrite dari tu.sekolahasy.com/dashboard)
        </p>
      </div>
    </div>
  );
}
