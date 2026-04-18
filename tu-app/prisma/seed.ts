import { PrismaClient, PegawaiRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TU App database...\n");

  const hashedPassword = await bcrypt.hash("Smpit2026", 12);

  await prisma.pegawai.upsert({
    where: { nip: "superadmin-001" },
    update: {},
    create: {
      nip: "superadmin-001",
      namaLengkap: "Super Administrator",
      jabatan: "Administrator",
      role: PegawaiRole.KHUSUS,
      username: "superadmin",
    },
  });
  console.log("  ✓ superadmin account ready");

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
