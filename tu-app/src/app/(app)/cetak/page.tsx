import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TemplateManager } from "@/components/template-manager";
import { AccessDenied } from "@/components/access-denied";

export const dynamic = "force-dynamic";

export default async function CetakPage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  if (user.accessLevel !== "KHUSUS") return <AccessDenied />;

  const templates = await db.printTemplate.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Cetak Surat</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Kelola template percetakan dan assign ke halaman
        </p>
      </div>
      <TemplateManager
        initialTemplates={JSON.parse(JSON.stringify(templates))}
        userId={user.id}
      />
    </div>
  );
}
