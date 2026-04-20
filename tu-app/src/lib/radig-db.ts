import { PrismaClient } from "../../node_modules/.prisma/radig-client";

/**
 * RADIG MySQL client — READ-ONLY access to siswa, rapor, kelas, etc.
 * Do NOT use this client for write operations.
 */

const globalForRadig = globalThis as unknown as {
  radigDb: PrismaClient | undefined;
};

export const radigDb =
  globalForRadig.radigDb ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForRadig.radigDb = radigDb;
