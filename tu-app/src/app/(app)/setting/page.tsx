import { ProfilSekolahForm } from "@/components/profil-sekolah-form";

export const dynamic = "force-dynamic";

export default function SettingPage() {
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-bold">Profil Sekolah</h1>
        <p className="text-xs text-muted-foreground">Kelola identitas dan informasi dasar sekolah</p>
      </div>
      <ProfilSekolahForm />
    </div>
  );
}
