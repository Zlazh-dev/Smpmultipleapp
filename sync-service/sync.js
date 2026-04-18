/**
 * SMPIT Sync Service
 * 
 * Syncs guru data from RADIG (MySQL) → Portal (PostgreSQL) + TU (PostgreSQL)
 * Runs every SYNC_INTERVAL_MINUTES (default: 10)
 * 
 * NIP is the primary key for matching across all apps.
 * Password hashes are synced (PHP $2y$ → Node $2b$ compatible).
 */
const mysql = require("mysql2/promise");
const { Pool } = require("pg");
const cron = require("node-cron");

// ── Config ──
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL_MINUTES || "10", 10);
const DEFAULT_PASSWORD_HASH = process.env.DEFAULT_PASSWORD_HASH || "$2b$12$yHDmrGrZRzDVZgqQtU8PR.gYoyjs5j3s25Z7HQ1crvs6tWdYUFeOC"; // SmpIT2026

// ── Database connections ──
let mysqlPool;
let portalPool;
let tuPool;

async function initPools() {
  mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || "mysql",
    user: process.env.MYSQL_USER || "radig",
    password: process.env.MYSQL_PASSWORD || "radig_secret_2024",
    database: process.env.MYSQL_DATABASE || "raporsmp",
    waitForConnections: true,
    connectionLimit: 3,
  });

  portalPool = new Pool({
    connectionString: process.env.PORTAL_DB_URL || "postgresql://smpit:smpit_secret_2024@postgres:5432/portal_smpit",
    max: 3,
  });

  tuPool = new Pool({
    connectionString: process.env.TU_DB_URL || "postgresql://smpit:smpit_secret_2024@postgres:5432/tu_smpit",
    max: 3,
  });

  // Test connections
  const [mysqlRows] = await mysqlPool.query("SELECT 1");
  await portalPool.query("SELECT 1");
  await tuPool.query("SELECT 1");
  console.log("✅ All database connections established");
}

// ── Convert PHP bcrypt $2y$ to Node.js compatible $2b$ ──
function convertPasswordHash(phpHash) {
  if (!phpHash) return DEFAULT_PASSWORD_HASH;
  // PHP uses $2y$, bcryptjs uses $2a$ or $2b$ — they're identical algorithms
  return phpHash.replace(/^\$2y\$/, "$2b$");
}

// ── Sync guru from RADIG → Portal ──
async function syncToPortal(guruList) {
  const client = await portalPool.connect();
  let synced = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    for (const guru of guruList) {
      if (!guru.nip || !guru.username) {
        skipped++;
        continue;
      }

      const passwordHash = convertPasswordHash(guru.password);
      
      // Map RADIG role to Portal role
      // guru.role "admin" → Portal "RADIG" (admin RADIG)
      // guru.role "guru" → Portal "Guru"
      const portalRole = guru.role === "admin" ? "RADIG" : "Guru";

      try {
        const result = await client.query(
          `INSERT INTO "User" (id, username, name, "hashedPassword", role, nip, image, "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, NOW(), NOW())
           ON CONFLICT (nip) DO UPDATE SET
             username = EXCLUDED.username,
             name = EXCLUDED.name,
             "hashedPassword" = EXCLUDED."hashedPassword",
             image = EXCLUDED.image,
             "updatedAt" = NOW()
           RETURNING (xmax = 0) AS is_new`,
          [guru.username, guru.nama_guru, passwordHash, portalRole, guru.nip, guru.foto_guru || null]
        );

        if (result.rows[0]?.is_new) {
          created++;
        } else {
          updated++;
        }
      } catch (err) {
        if (err.code === "23505" && err.constraint?.includes("username")) {
          // Username conflict — update existing record by username
          await client.query(
            `UPDATE "User" SET nip = $1, name = $2, "hashedPassword" = $3, role = $4, image = $5, "updatedAt" = NOW()
             WHERE username = $6`,
            [guru.nip, guru.nama_guru, passwordHash, portalRole, guru.foto_guru || null, guru.username]
          );
          updated++;
        } else {
          throw err;
        }
      }
      synced++;
    }
  } finally {
    client.release();
  }

  return { synced, created, updated, skipped };
}

// ── Sync guru from RADIG → TU ──
async function syncToTU(guruList) {
  const client = await tuPool.connect();
  let synced = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    for (const guru of guruList) {
      if (!guru.nip || !guru.username) {
        skipped++;
        continue;
      }

      // Map RADIG role to TU role
      // admin → KHUSUS (full TU access), guru → UMUM (basic access)
      const tuRole = guru.role === "admin" ? "KHUSUS" : "UMUM";
      const jabatan = guru.role === "admin" ? "Admin" : "Guru";

      // TU uses cuid() IDs, try upsert by NIP first, handle username conflict
      try {
        const result = await client.query(
          `INSERT INTO "Pegawai" (id, nip, "namaLengkap", jabatan, role, username, "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4::"PegawaiRole", $5, NOW(), NOW())
           ON CONFLICT (nip) DO UPDATE SET
             "namaLengkap" = EXCLUDED."namaLengkap",
             username = EXCLUDED.username,
             jabatan = EXCLUDED.jabatan,
             role = EXCLUDED.role,
             "updatedAt" = NOW()
           RETURNING (xmax = 0) AS is_new`,
          [guru.nip, guru.nama_guru, jabatan, tuRole, guru.username]
        );
        if (result.rows[0]?.is_new) created++;
        else updated++;
      } catch (err) {
        if (err.code === "23505" && err.constraint?.includes("username")) {
          // Username already exists — update by username instead
          await client.query(
            `UPDATE "Pegawai" SET nip = $1, "namaLengkap" = $2, "updatedAt" = NOW()
             WHERE username = $3`,
            [guru.nip, guru.nama_guru, guru.username]
          );
          updated++;
        } else {
          throw err;
        }
      }
      synced++;
    }
  } finally {
    client.release();
  }

  return { synced, created, updated, skipped };
}

// ── Delete accounts from Portal that no longer exist in RADIG ──
async function deleteFromPortal(radigNips) {
  const client = await portalPool.connect();
  try {
    // Find Portal users synced from RADIG (role = 'Guru' or 'RADIG') that are NOT in RADIG anymore
    // Protect superadmin and manually created admin accounts
    const result = await client.query(
      `DELETE FROM "User"
       WHERE nip IS NOT NULL
         AND nip != ''
         AND role IN ('Guru', 'RADIG')
         AND nip NOT IN (SELECT unnest($1::text[]))
         AND username NOT IN ('superadmin')
       RETURNING username, nip`,
      [radigNips]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

// ── Delete accounts from TU that no longer exist in RADIG ──
async function deleteFromTU(radigNips) {
  const client = await tuPool.connect();
  try {
    // Delete TU Pegawai synced from RADIG that are NOT in RADIG anymore    
    // Protect superadmin and tu-admin (manually created accounts)
    const result = await client.query(
      `DELETE FROM "Pegawai"
       WHERE nip IS NOT NULL
         AND nip != ''
         AND username NOT IN ('superadmin', 'tu-admin')
         AND nip NOT IN (SELECT unnest($1::text[]))
       RETURNING username, nip`,
      [radigNips]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

// ── Main sync function ──
async function runSync() {
  const startTime = Date.now();
  console.log(`\n🔄 [${new Date().toISOString()}] Starting sync...`);

  try {
    // 1. Read all guru from RADIG
    const [guruList] = await mysqlPool.query(
      "SELECT id_guru, nip, nama_guru, username, password, role, foto_guru FROM guru WHERE nip IS NOT NULL AND nip != ''"
    );
    console.log(`📥 Found ${guruList.length} guru with NIP in RADIG`);

    // Collect all NIPs from RADIG for delete phase
    const radigNips = guruList.map(g => g.nip).filter(Boolean);

    // 2. Sync to Portal (upsert)
    const portalResult = await syncToPortal(guruList);
    console.log(`📤 Portal: ${portalResult.created} created, ${portalResult.updated} updated, ${portalResult.skipped} skipped`);

    // 3. Sync to TU (upsert)
    const tuResult = await syncToTU(guruList);
    console.log(`📤 TU:     ${tuResult.created} created, ${tuResult.updated} updated, ${tuResult.skipped} skipped`);

    // 4. Delete accounts that no longer exist in RADIG
    if (radigNips.length > 0) {
      const portalDeleted = await deleteFromPortal(radigNips);
      if (portalDeleted.length > 0) {
        console.log(`🗑️  Portal: deleted ${portalDeleted.length} → ${portalDeleted.map(d => d.username).join(', ')}`);
      }

      const tuDeleted = await deleteFromTU(radigNips);
      if (tuDeleted.length > 0) {
        console.log(`🗑️  TU:     deleted ${tuDeleted.length} → ${tuDeleted.map(d => d.username).join(', ')}`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Sync completed in ${elapsed}s`);
  } catch (err) {
    console.error("❌ Sync failed:", err.message);
    console.error(err.stack);
  }
}

// ── Entry point ──
async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  SMPIT Sync Service");
  console.log(`  Interval: every ${SYNC_INTERVAL} minutes`);
  console.log("═══════════════════════════════════════");

  await initPools();

  // Run once immediately
  await runSync();

  // If SYNC_ONCE mode, exit after first run
  if (process.env.SYNC_ONCE === "true") {
    console.log("SYNC_ONCE mode — exiting.");
    process.exit(0);
  }

  // Schedule periodic sync
  const cronExpr = `*/${SYNC_INTERVAL} * * * *`;
  cron.schedule(cronExpr, runSync);
  console.log(`⏰ Scheduled: ${cronExpr}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
