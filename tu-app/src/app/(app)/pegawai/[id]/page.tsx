import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PegawaiDetail } from "@/components/pegawai-detail";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pegawai = await db.pegawai.findUnique({
    where: { id },
    select: { namaLengkap: true },
  });
  return { title: pegawai ? `${pegawai.namaLengkap} — Pegawai` : "Pegawai Tidak Ditemukan" };
}

export default async function PegawaiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  if (user.accessLevel !== "KHUSUS") return <AccessDenied />;

  const { id } = await params;

  const pegawai = await db.pegawai.findUnique({
    where: { id },
    include: {
      dokumen: {
        where: { kategori: "SK" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!pegawai) notFound();

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <PegawaiDetail
        pegawai={JSON.parse(JSON.stringify({
          ...pegawai,
          skRiwayat: pegawai.skRiwayat || [],
          dokumen: pegawai.dokumen || [],
        }))}
      />
    </div>
  );
}
