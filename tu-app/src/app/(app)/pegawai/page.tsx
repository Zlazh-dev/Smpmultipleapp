import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { PegawaiTable } from "@/components/pegawai-table";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; jabatan?: string }>;
}

export default async function PegawaiPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  if (user.accessLevel !== "KHUSUS") return <AccessDenied />;
  const params = await searchParams;
  const { q, jabatan } = params;

  const where: any = {};
  if (q) {
    where.OR = [
      { namaLengkap: { contains: q, mode: "insensitive" } },
      { nip: { contains: q } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }
  if (jabatan) {
    where.jabatan = { contains: jabatan, mode: "insensitive" };
  }

  const pegawai = await db.pegawai.findMany({
    where,
    orderBy: { namaLengkap: "asc" },
  });

  const jabatanList = await db.pegawai.findMany({
    select: { jabatan: true },
    distinct: ["jabatan"],
  });

  return (
    <div className="p-4 lg:p-6 space-y-0">
      {/* Page Header */}
      <div className="page-header animate-fade-in">
        <div>
          <h1 className="page-header-title">Data Pegawai</h1>
          <p className="page-header-subtitle">
            Kelola data pegawai dan informasi kepegawaian
          </p>
        </div>
      </div>

      {/* Unified Table Card */}
      <PegawaiTable
        data={JSON.parse(JSON.stringify(pegawai))}
        jabatanList={jabatanList.map((j) => j.jabatan)}
        currentSearch={q || ""}
        currentJabatan={jabatan || ""}
      />
    </div>
  );
}
