import { radigDb } from "@/lib/radig-db";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { SiswaTable } from "@/components/siswa-table";

export const metadata = { title: "Data Siswa — TU App" };

export default async function SiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const role = user?.accessLevel || "UMUM";

  const kelasId = params.kelas ? parseInt(params.kelas) : undefined;
  const status = params.status || "Aktif";
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const limit = 50;

  // For UMUM users (guru), scope to their wali kelas only
  let scopedKelasIds: number[] | null = null;
  let guruNama: string | null = null;

  if (role === "UMUM" && user) {
    // Find Pegawai to get portalUserId and NIP
    const pegawai = await db.pegawai.findFirst({
      where: { username: user.username },
      select: { portalUserId: true, nip: true },
    });

    if (pegawai) {
      // Primary: match via portal_user_id
      let guru = pegawai.portalUserId
        ? await radigDb.guru.findFirst({
            where: { portal_user_id: pegawai.portalUserId },
            select: { id_guru: true, nama_guru: true },
          })
        : null;

      // Fallback: match via NIP
      if (!guru && pegawai.nip) {
        guru = await radigDb.guru.findFirst({
          where: { nip: pegawai.nip },
          select: { id_guru: true, nama_guru: true },
        });
      }

      if (guru) {
        guruNama = guru.nama_guru;
        const guruKelas = await radigDb.kelas.findMany({
          where: {
            id_wali_kelas: guru.id_guru,
            tahun_ajaran: { status: "Aktif" },
          },
          select: { id_kelas: true },
        });
        scopedKelasIds = guruKelas.map((k: any) => k.id_kelas);
      }
    }

    // If no matching guru/kelas found, show empty
    if (!scopedKelasIds || scopedKelasIds.length === 0) {
      return (
        <div className="p-4 md:p-6 space-y-0 animate-fade-in">
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Data Siswa</h1>
              <p className="page-header-subtitle">
                Anda belum ditugaskan sebagai wali kelas di tahun ajaran aktif.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  const where: any = {};
  if (status) where.status_siswa = status;

  // Apply kelas scope
  if (scopedKelasIds) {
    // UMUM: force scope to wali kelas, ignore kelas filter from params
    where.id_kelas = { in: scopedKelasIds };
  } else if (kelasId) {
    where.id_kelas = kelasId;
  }

  if (search) {
    where.OR = [
      { nama_lengkap: { contains: search } },
      { nisn: { contains: search } },
      { nis: { contains: search } },
    ];
  }

  const [siswa, total, kelasList] = await Promise.all([
    radigDb.siswa.findMany({
      where,
      include: {
        kelas: { include: { tahun_ajaran: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nama_lengkap: "asc" },
    }),
    radigDb.siswa.count({ where }),
    radigDb.kelas.findMany({
      where: scopedKelasIds ? { id_kelas: { in: scopedKelasIds } } : undefined,
      include: { tahun_ajaran: true, _count: { select: { siswa: true } } },
      orderBy: [{ id_tahun_ajaran: "desc" }, { nama_kelas: "asc" }],
    }),
  ]);

  // Filter active tahun ajaran kelas for dropdown
  const activeKelas = kelasList.filter(
    (k: any) => String(k.tahun_ajaran?.status) === "Aktif"
  );

  const subtitle = role === "UMUM" && guruNama
    ? `Kelas wali Anda (${guruNama})`
    : `Data siswa dari RADIG`;

  return (
    <div className="p-4 md:p-6 space-y-0 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Data Siswa</h1>
          <p className="page-header-subtitle">{subtitle}</p>
        </div>
      </div>

      {/* Unified Table Card */}
      <SiswaTable
        siswa={JSON.parse(JSON.stringify(siswa))}
        kelasList={JSON.parse(JSON.stringify(activeKelas))}
        total={total}
        page={page}
        limit={limit}
        currentKelas={params.kelas || ""}
        currentStatus={status}
        currentSearch={search}
      />
    </div>
  );
}

