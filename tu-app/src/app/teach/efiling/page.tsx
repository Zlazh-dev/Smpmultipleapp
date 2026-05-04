import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { TeachPageHeader } from "@/components/teach/teach-page-header";
import { EFilingManager } from "@/components/efiling-manager";

export const dynamic = "force-dynamic";

export default async function TeachEFilingPage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 lg:p-6 pb-2">
        <TeachPageHeader
          title="e-Filing"
          description="Kelola dokumen dan arsip pribadi Anda"
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <EFilingManager userId={user.id} role={user.accessLevel} userName={user.name} />
      </div>
    </div>
  );
}
