-- Reset Portal DB: Only superadmin account
-- All guru accounts will be synced from RADIG automatically

DROP TABLE IF EXISTS "User";

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "name" TEXT,
  "hashedPassword" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "nip" TEXT,
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_nip_key" ON "User"("nip");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_username_idx" ON "User"("username");

-- Superadmin account (password: SmpIT2026)
INSERT INTO "User" ("id", "username", "name", "hashedPassword", "role", "nip", "updatedAt") VALUES
  ('superadmin-001', 'superadmin', 'Super Administrator', '$2b$12$yHDmrGrZRzDVZgqQtU8PR.gYoyjs5j3s25Z7HQ1crvs6tWdYUFeOC', 'RADIG', NULL, CURRENT_TIMESTAMP);
