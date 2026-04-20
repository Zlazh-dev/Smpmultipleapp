import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { PresensiTabs } from "@/components/presensi-tabs";

export const dynamic = "force-dynamic";

export default async function PresensiLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const isKhusus = user.accessLevel === "KHUSUS";

  return (
    <div className="flex flex-col h-full">
      {isKhusus && <PresensiTabs />}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
