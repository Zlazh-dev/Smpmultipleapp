import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { OpsPageHeader } from "@/components/ops/ops-page-header";
import { FileText, FolderOpen, Printer } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const sections = [
  {
    href: "/documents/efiling",
    title: "e-Filing",
    description: "Kelola folder dan arsip dokumen digital",
    icon: FolderOpen,
    color: "text-violet-500 bg-violet-500/10",
    roles: ["UMUM", "KHUSUS"],
  },
  {
    href: "/documents/cetak",
    title: "Cetak Surat",
    description: "Template dan pencetakan surat resmi",
    icon: Printer,
    color: "text-blue-500 bg-blue-500/10",
    roles: ["KHUSUS"],
  },
];

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  const role = user.accessLevel;

  const visible = sections.filter((s) => s.roles.includes(role));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <OpsPageHeader
        title="Dokumen"
        description="Kelola arsip, surat, dan template dokumen."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group flex items-center gap-4 p-5 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/50 hover:border-border transition-all"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${section.color}`}>
              <section.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{section.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
