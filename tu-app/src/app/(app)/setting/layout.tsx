import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { SettingTabs } from "@/components/setting-tabs";

export const dynamic = "force-dynamic";

export default async function SettingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  if (user.accessLevel !== "KHUSUS") return <AccessDenied />;

  return (
    <div className="flex flex-col h-full">
      <SettingTabs />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
