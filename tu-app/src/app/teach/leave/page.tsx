import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { TeachPageHeader } from "@/components/teach/teach-page-header";
import { CutiUserView } from "@/components/cuti-user-view";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const myCuti = await db.cuti.findMany({
    where: { pegawaiId: user.id },
    include: { pegawai: { select: { namaLengkap: true, jabatan: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <TeachPageHeader
        title="Cuti"
        description="Ajukan dan pantau status cuti Anda"
      />
      <CutiUserView
        data={JSON.parse(JSON.stringify(myCuti))}
        userId={user.id}
      />
    </div>
  );
}
