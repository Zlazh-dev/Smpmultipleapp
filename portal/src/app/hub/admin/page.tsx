import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { ContentSection } from "@/components/shared/content-section";
import { FeedItem } from "@/components/shared/feed-item";
import { Users, ShieldCheck, UserPlus, ChevronRight, LayoutGrid, Settings } from "lucide-react";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [totalUsers, roleCountsRaw] = await Promise.all([
    db.user.count(),
    db.user.groupBy({ by: ["role"], _count: { role: true } }),
  ]);

  const roleCounts = Object.fromEntries(
    roleCountsRaw.map((r) => [r.role, r._count.role])
  );

  return (
    <div className="space-y-0 px-6 lg:px-8 py-6">
      <PageHeader title="Admin Console" description="Kelola pengguna, roles, dan pengaturan sistem AsyHub." />

      <ContentSection>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: totalUsers, icon: Users },
            { label: "Guru", value: roleCounts["Guru"] || 0, icon: Users },
            { label: "TU", value: roleCounts["TU"] || 0, icon: ShieldCheck },
            { label: "Admin", value: roleCounts["RADIG"] || 0, icon: ShieldCheck },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/60 bg-asy-surface/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-asy-surface text-asy-accent">
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </ContentSection>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <ContentSection title="Aksi Cepat">
            <div className="space-y-2">
              {[
                { href: "/hub/admin/users", label: "Manajemen Users", desc: "Tambah, edit, hapus akun", icon: Users },
                { href: "/hub/admin/roles", label: "Roles & Akses", desc: "Konfigurasi role", icon: ShieldCheck },
                { href: "/hub/admin/app-access", label: "App Access", desc: "Atur akses aplikasi", icon: LayoutGrid },
                { href: "/hub/admin/settings", label: "Settings", desc: "Konfigurasi sistem", icon: Settings },
              ].map((action) => (
                <Link key={action.href} href={action.href} className="group flex items-center gap-3.5 p-3.5 rounded-xl border border-border/60 bg-asy-surface/40 hover:bg-asy-surface-alt/50 hover:border-asy-accent/30 transition-all">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-asy-surface text-asy-accent">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </ContentSection>
        </div>

        <div className="lg:col-span-3">
          <ContentSection
            title="Pengguna Terbaru"
            headerAction={
              <Link href="/hub/admin/users" className="text-xs text-asy-accent hover:text-asy-accent-hover font-medium flex items-center gap-0.5">
                Lihat Semua <ChevronRight className="h-3 w-3" />
              </Link>
            }
            panel
          >
            <RecentUsers />
          </ContentSection>
        </div>
      </div>
    </div>
  );
}

async function RecentUsers() {
  const recentUsers = await db.user.findMany({
    select: { id: true, name: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-0.5">
      {recentUsers.map((user) => (
        <FeedItem
          key={user.id}
          icon={<UserPlus className="h-3.5 w-3.5" />}
          title={user.name || user.username}
          description={`${user.role} · @${user.username}`}
          timestamp={user.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
        />
      ))}
    </div>
  );
}
