import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { EFilingManager } from "@/components/efiling-manager";

export const dynamic = "force-dynamic";

export default async function EFilingPage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <EFilingManager userId={user.id} role={user.role} userName={user.name} />
    </div>
  );
}
