import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { notFound, redirect } from "next/navigation";
import { TemplatePrint } from "@/components/template-print";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintCutiPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const { id } = await params;

  // Fetch cuti data
  const cuti = await db.cuti.findUnique({
    where: { id },
    include: {
      pegawai: {
        select: { namaLengkap: true, nip: true, jabatan: true, username: true, noHp: true },
      },
    },
  });

  if (!cuti) return notFound();

  // Fetch active SURAT_IZIN template
  const template = await db.printTemplate.findFirst({
    where: { kategori: "SURAT_IZIN", isActive: true },
  });

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-8">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">Template Belum Dikonfigurasi</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Belum ada template &quot;Surat Izin&quot; yang aktif. Silakan buat dan aktifkan template di halaman <strong>Cetak Surat</strong> terlebih dahulu.
          </p>
          <a
            href="/cetak"
            className="inline-block mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Buka Halaman Template
          </a>
        </div>
      </div>
    );
  }

  // Build variable map from cuti data
  const variables: Record<string, string> = {
    namaLengkap: cuti.pegawai.namaLengkap,
    nip: cuti.pegawai.nip,
    jabatan: cuti.pegawai.jabatan,
    email: cuti.pegawai.username || "",
    noHp: cuti.pegawai.noHp || "",
    jenisCuti: cuti.jenisCuti,
    tanggalMulai: new Date(cuti.tanggalMulai).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    }),
    tanggalSelesai: new Date(cuti.tanggalSelesai).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    }),
    lamaHari: String(cuti.lamaHari),
    alasan: cuti.alasan,
    tanggalSekarang: new Date().toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    }),
    namaSekolah: "SMPIT Asy-Syadzili",
  };

  return (
    <TemplatePrint
      canvasData={template.canvasData as any}
      variables={variables}
      title={template.nama}
    />
  );
}
