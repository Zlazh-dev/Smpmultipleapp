import { db } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { PegawaiTable } from "@/components/pegawai-table";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; jabatan?: string }>;
}

export default async function PegawaiPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  if (user.role !== "KHUSUS") return <AccessDenied />;
  const params = await searchParams;
  const { q, jabatan } = params;

  const where: any = {};
  if (q) {
    where.OR = [
      { namaLengkap: { contains: q, mode: "insensitive" } },
      { nip: { contains: q } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }
  if (jabatan) {
    where.jabatan = { contains: jabatan, mode: "insensitive" };
  }

  const pegawai = await db.pegawai.findMany({
    where,
    orderBy: { namaLengkap: "asc" },
  });

  const jabatanList = await db.pegawai.findMany({
    select: { jabatan: true },
    distinct: ["jabatan"],
  });

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Data Pegawai</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {pegawai.length} pegawai terdaftar
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 animate-fade-in-up">
        <form className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Cari nama, NIP, username..."
              defaultValue={q || ""}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <select
            name="jabatan"
            defaultValue={jabatan || ""}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Semua Jabatan</option>
            {jabatanList.map((j) => (
              <option key={j.jabatan} value={j.jabatan}>{j.jabatan}</option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm" className="h-8 cursor-pointer">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>

      {/* Table with sheet (Tambah button is inside PegawaiTable toolbar) */}
      <PegawaiTable data={JSON.parse(JSON.stringify(pegawai))} />
    </div>
  );
}
