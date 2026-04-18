import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PegawaiEditForm } from "@/components/pegawai-edit-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PegawaiEditPage({ params }: PageProps) {
  const { id } = await params;

  const pegawai = await db.pegawai.findUnique({ where: { id } });
  if (!pegawai) notFound();

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Edit Pegawai</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {pegawai.namaLengkap} — {pegawai.nip}
        </p>
      </div>

      <PegawaiEditForm pegawai={{
        ...pegawai,
        noHp: pegawai.noHp ?? "",
        alamat: pegawai.alamat ?? "",
        skRiwayat: pegawai.skRiwayat as any[],
        kinerja: pegawai.kinerja as Record<string, any> | null,
      }} />
    </div>
  );
}
