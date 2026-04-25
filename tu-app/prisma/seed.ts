import { PrismaClient, AccessLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TU App database...\n");

  const hashedPassword = await bcrypt.hash("Smpit2026", 12);

  await prisma.pegawai.upsert({
    where: { nip: "1970010120250101" },
    update: {},
    create: {
      nip: "1970010120250101",
      namaLengkap: "Super Administrator",
      jabatan: "Administrator",
      accessLevel: AccessLevel.KHUSUS,
      username: "superadmin",
    },
  });
  console.log("  ✓ superadmin account ready");

  // Guru dengan akses UMUM — untuk testing upload foto & presensi
  await prisma.pegawai.upsert({
    where: { nip: "1990010120260101" },
    update: {},
    create: {
      nip: "1990010120260101",
      namaLengkap: "Ahmad Fauzi, S.Pd",
      jabatan: "Guru",
      accessLevel: AccessLevel.UMUM,
      username: "guru1",
      noHp: "081234567890",
      alamat: "Jl. Pendidikan No. 10, Surabaya",
    },
  });
  console.log("  ✓ guru1 (UMUM) account ready");

  console.log("\n🌱 Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
