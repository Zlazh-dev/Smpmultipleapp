import { radigDb } from "@/lib/radig-db";
import { notFound } from "next/navigation";
import { SiswaDetail } from "@/components/siswa-detail";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const siswa = await radigDb.siswa.findUnique({
    where: { id_siswa: parseInt(id) },
    select: { nama_lengkap: true },
  });
  return { title: siswa ? `${siswa.nama_lengkap} — Data Siswa` : "Siswa Tidak Ditemukan" };
}

export default async function SiswaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const siswaId = parseInt(id);

  if (isNaN(siswaId)) notFound();

  const siswa = await radigDb.siswa.findUnique({
    where: { id_siswa: siswaId },
    include: {
      kelas: {
        include: {
          tahun_ajaran: true,
          wali_kelas: true,
        },
      },
      rapor: {
        include: {
          detail_akademik: {
            include: { mapel: true },
          },
        },
        orderBy: [{ id_tahun_ajaran: "desc" }, { semester: "desc" }],
      },
      catatan: {
        orderBy: { tanggal_catatan: "desc" },
      },
    },
  });

  if (!siswa) notFound();

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <SiswaDetail siswa={JSON.parse(JSON.stringify(siswa))} />
    </div>
  );
}
