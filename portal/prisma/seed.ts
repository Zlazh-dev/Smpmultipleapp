import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("Smpit2026", 12);

  await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      username: "superadmin",
      name: "Super Administrator",
      role: Role.RADIG,
      nip: null,
      hashedPassword,
    },
  });
  console.log("✓ superadmin account ready");

  // Guru dengan role Guru — untuk testing face upload & presensi
  await prisma.user.upsert({
    where: { username: "guru1" },
    update: {},
    create: {
      username: "guru1",
      name: "Ahmad Fauzi, S.Pd",
      role: Role.Guru,
      nip: "1990010120260101",
      hashedPassword,
    },
  });
  console.log("✓ guru1 (Guru) account ready");

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
