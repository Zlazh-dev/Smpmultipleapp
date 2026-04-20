import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { CutiKanban } from "@/components/cuti-kanban";
import { CutiUserView } from "@/components/cuti-user-view";

export const dynamic = "force-dynamic";

export default async function CutiPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const isKhusus = user.accessLevel === "KHUSUS";

  if (isKhusus) {
    // KHUSUS: see all cuti, kanban board, approve/reject
    const cuti = await db.cuti.findMany({
      include: { pegawai: { select: { namaLengkap: true, jabatan: true } } },
      orderBy: { createdAt: "desc" },
    });
    const pegawai = await db.pegawai.findMany({
      select: { id: true, namaLengkap: true },
      orderBy: { namaLengkap: "asc" },
    });

    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="animate-fade-in">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Manajemen Cuti</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Drag kartu antar kolom untuk mengubah status
          </p>
        </div>
        <CutiKanban
          initialData={JSON.parse(JSON.stringify(cuti))}
          pegawaiList={JSON.parse(JSON.stringify(pegawai))}
        />
      </div>
    );
  }

  // UMUM: see only own cuti, submit new
  const myCuti = await db.cuti.findMany({
    where: { pegawaiId: user.id },
    include: { pegawai: { select: { namaLengkap: true, jabatan: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Cuti Saya</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Riwayat dan pengajuan cuti
        </p>
      </div>
      <CutiUserView
        data={JSON.parse(JSON.stringify(myCuti))}
        userId={user.id}
      />
    </div>
  );
}
