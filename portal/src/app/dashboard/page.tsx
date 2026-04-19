import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apps, roleLabels } from "@/lib/config";
import { ExternalLink } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="space-y-2 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Selamat Datang, {user.name || "User"} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Pilih aplikasi di bawah untuk mulai bekerja.
            </p>
          </div>
          <Badge
            variant="outline"
            className="self-start sm:self-center text-sm px-3 py-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          >
            {roleLabels[user.role]}
          </Badge>
        </div>
      </div>

      {/* All Apps Grid */}
      <div className="space-y-4 animate-fade-in-up">
        <h2 className="text-lg font-semibold">Aplikasi Tersedia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <Card
                key={app.key}
                className="group border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* App Icon */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${app.color} shadow-lg`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* App Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">{app.label}</h3>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {app.description}
                      </p>

                      {/* Action */}
                      <a
                        href={`/api/sso/redirect?app=${app.key}`}
                        className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
                      >
                        Buka {app.shortLabel}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-200">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Info Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium truncate ml-2">{(user as any).username}</span>
              </div>
              <Separator />
              {(user as any).nip && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">NIP</span>
                    <span className="font-mono text-xs truncate ml-2">{(user as any).nip}</span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
          <CardHeader>
            <CardTitle className="text-lg">Cara Kerja SSO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Anda cukup <strong>login sekali</strong> di Portal. Saat membuka aplikasi TU atau RADIG, 
              sistem akan otomatis memverifikasi identitas Anda menggunakan token aman.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Klik &quot;Buka TU&quot; atau &quot;Buka RADIG&quot; untuk masuk otomatis</li>
              <li>NIP digunakan sebagai penghubung antar aplikasi</li>
              <li>Jika akun belum ada di TU, otomatis dibuat</li>
              <li>Jika akun belum ada di RADIG, hubungi admin</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
