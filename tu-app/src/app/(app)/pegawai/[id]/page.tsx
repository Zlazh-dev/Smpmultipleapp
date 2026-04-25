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

  const { id } = await params;

  const isAdmin = user.accessLevel === "KHUSUS";
  const isSelf = user.id === id;

  // UMUM can only view their OWN profile; KHUSUS can view anyone
  if (!isAdmin && !isSelf) return <AccessDenied />;

  const [pegawai, templates] = await Promise.all([
    db.pegawai.findUnique({
      where: { id },
      include: {
        dokumen: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.printTemplate.findMany({
      select: { id: true, nama: true, kategori: true, canvasData: true },
      orderBy: { kategori: "asc" },
    }),
  ]);

  if (!pegawai) notFound();

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <PegawaiDetail
        pegawai={JSON.parse(JSON.stringify({
          ...pegawai,
          faceDescriptor: pegawai.faceDescriptor || [],
          facePhoto: pegawai.facePhoto || null,
          faceVerified: pegawai.faceVerified ?? false,
          skRiwayat: pegawai.skRiwayat || [],
          dokumen: pegawai.dokumen || [],
        }))}
        templates={JSON.parse(JSON.stringify(templates))}
        isSelf={isSelf}
        isAdmin={isAdmin}
      />
    </div>
  );
}
