/**
 * SMPIT Sync Service — Webhook-based Real-time Sync
 * 
 * Listens for events from Portal and syncs user data to:
 *   - TU-App (PostgreSQL "Pegawai" table)
 *   - RADIG (MySQL "guru" table)
 * 
 * Endpoints:
 *   POST /sync        — Handle webhook event (user.created/updated/deleted)
 *   POST /sync/full   — Full reconciliation (reads Portal → pushes to TU+RADIG)
 *   GET  /health      — Health check
 */

const http = require("http");
const mysql = require("mysql2/promise");
const { Pool } = require("pg");
const cron = require("node-cron");

const PORT = parseInt(process.env.SYNC_PORT || "3002", 10);
const SYNC_SECRET = process.env.SYNC_SECRET || "dev-sync-secret";
const FULL_SYNC_INTERVAL = parseInt(process.env.FULL_SYNC_INTERVAL_MINUTES || "60", 10);

// ── Database connections ──
let mysqlPool;
let portalPool;
let tuPool;

async function initPools() {
  mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || "mysql",
    user: process.env.MYSQL_USER || "smpit",
    password: process.env.MYSQL_PASSWORD || "smpit_secret",
    database: process.env.MYSQL_DATABASE || "raporsmp",
    waitForConnections: true,
    connectionLimit: 3,
  });

  portalPool = new Pool({
    connectionString: process.env.PORTAL_DB_URL || "postgresql://smpit:smpit_secret@postgres:5432/portal_smpit",
    max: 3,
  });

  tuPool = new Pool({
    connectionString: process.env.TU_DB_URL || "postgresql://smpit:smpit_secret@postgres:5432/tu_smpit",
    max: 3,
  });

  await mysqlPool.query("SELECT 1");
  await portalPool.query("SELECT 1");
  await tuPool.query("SELECT 1");
  console.log("✅ All database connections established");
}

// ── Role Mapping ──
function portalRoleToTU(portalRole) {
  // Portal role → TU accessLevel
  if (portalRole === "RADIG" || portalRole === "TU") return "KHUSUS";
  return "UMUM";
}

function portalRoleToRADIG(portalRole) {
  // Portal role → RADIG role
  if (portalRole === "RADIG") return "admin";
  return "guru";
}

function portalRoleToTUJabatan(portalRole) {
  if (portalRole === "RADIG") return "Admin";
  if (portalRole === "TU") return "Tata Usaha";
  return "Guru";
}

// ── Convert Node bcrypt $2b$ to PHP compatible $2y$ for RADIG ──
function convertPasswordForPHP(nodeHash) {
  if (!nodeHash) return "$2y$12$placeholder";
  return nodeHash.replace(/^\$2b\$/, "$2y$");
}

// ── Sync single user to TU ──
async function syncUserToTU(user) {
  const client = await tuPool.connect();
  try {
    const tuAccessLevel = portalRoleToTU(user.role);
    const tuJabatan = portalRoleToTUJabatan(user.role);

    const result = await client.query(
      `INSERT INTO "Pegawai" (id, nip, "namaLengkap", jabatan, "role", username, "portalUserId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4::"AccessLevel", $5, $6, NOW(), NOW())
       ON CONFLICT ("portalUserId") DO UPDATE SET
         "namaLengkap" = EXCLUDED."namaLengkap",
         username = EXCLUDED.username,
         nip = EXCLUDED.nip,
         jabatan = EXCLUDED.jabatan,
         "role" = EXCLUDED."role",
         "updatedAt" = NOW()
       RETURNING (xmax = 0) AS is_new`,
      [user.nip || user.username, user.name || user.username, tuJabatan, tuAccessLevel, user.username, user.id]
    );
    return result.rows[0]?.is_new ? "created" : "updated";
  } catch (err) {
    if (err.code === "23505") {
      // Unique conflict on nip or username — try update by username
      await client.query(
        `UPDATE "Pegawai" SET nip = $1, "namaLengkap" = $2, jabatan = $3, "role" = $4::"AccessLevel", "portalUserId" = $5, "updatedAt" = NOW()
         WHERE username = $6`,
        [user.nip || user.username, user.name, portalRoleToTUJabatan(user.role), portalRoleToTU(user.role), user.id, user.username]
      );
      return "updated";
    }
    throw err;
  } finally {
    client.release();
  }
}

// ── Sync single user to RADIG ──
async function syncUserToRADIG(user) {
  // Skip TU-only users (they don't belong in RADIG)
  if (user.role === "TU") return "skipped";

  const radigRole = portalRoleToRADIG(user.role);
  const phpPassword = convertPasswordForPHP(user.hashedPassword);

  // Check if already exists by portal_user_id
  const [existing] = await mysqlPool.query(
    "SELECT id_guru FROM guru WHERE portal_user_id = ?",
    [user.id]
  );

  if (existing.length > 0) {
    await mysqlPool.query(
      "UPDATE guru SET nama_guru = ?, username = ?, password = ?, role = ?, nip = ? WHERE portal_user_id = ?",
      [user.name, user.username, phpPassword, radigRole, user.nip, user.id]
    );
    return "updated";
  }

  // Try by username
  const [existingByUsername] = await mysqlPool.query(
    "SELECT id_guru FROM guru WHERE username = ?",
    [user.username]
  );

  if (existingByUsername.length > 0) {
    await mysqlPool.query(
      "UPDATE guru SET nama_guru = ?, password = ?, role = ?, nip = ?, portal_user_id = ? WHERE username = ?",
      [user.name, phpPassword, radigRole, user.nip, user.id, user.username]
    );
    return "updated";
  }

  // Create new
  await mysqlPool.query(
    "INSERT INTO guru (nip, nama_guru, username, password, role, portal_user_id) VALUES (?, ?, ?, ?, ?, ?)",
    [user.nip || "", user.name, user.username, phpPassword, radigRole, user.id]
  );
  return "created";
}

// ── Delete user from TU ──
async function deleteUserFromTU(user) {
  const client = await tuPool.connect();
  try {
    const result = await client.query(
      `DELETE FROM "Pegawai" WHERE "portalUserId" = $1 OR username = $2 RETURNING username`,
      [user.id, user.username]
    );
    return result.rowCount || 0;
  } finally {
    client.release();
  }
}

// ── Delete user from RADIG ──
async function deleteUserFromRADIG(user) {
  const [result] = await mysqlPool.query(
    "DELETE FROM guru WHERE portal_user_id = ? OR username = ?",
    [user.id, user.username]
  );
  return result.affectedRows || 0;
}

// ── Handle webhook event ──
async function handleEvent(event, user) {
  const results = { tu: null, radig: null };

  switch (event) {
    case "user.created":
    case "user.updated":
      if (!user.isActive) {
        // Inactive = soft delete
        results.tu = `deleted:${await deleteUserFromTU(user)}`;
        results.radig = `deleted:${await deleteUserFromRADIG(user)}`;
      } else {
        results.tu = await syncUserToTU(user);
        results.radig = await syncUserToRADIG(user);
      }
      break;

    case "user.deleted":
      results.tu = `deleted:${await deleteUserFromTU(user)}`;
      results.radig = `deleted:${await deleteUserFromRADIG(user)}`;
      break;

    default:
      throw new Error(`Unknown event: ${event}`);
  }

  return results;
}

// ── Full reconciliation sync (Portal → TU + RADIG) ──
async function fullSync() {
  const startTime = Date.now();
  console.log(`\n🔄 [${new Date().toISOString()}] Starting full sync...`);

  const client = await portalPool.connect();
  try {
    const res = await client.query(
      `SELECT id, username, name, "hashedPassword", role, nip, "isActive" FROM "User" WHERE role IN ('RADIG', 'TU', 'Guru')`
    );
    const users = res.rows;
    console.log(`📥 Found ${users.length} users in Portal`);

    let tuCreated = 0, tuUpdated = 0, radigCreated = 0, radigUpdated = 0, skipped = 0;

    for (const user of users) {
      if (!user.isActive) { skipped++; continue; }

      try {
        const tuResult = await syncUserToTU(user);
        if (tuResult === "created") tuCreated++;
        else tuUpdated++;

        const radigResult = await syncUserToRADIG(user);
        if (radigResult === "created") radigCreated++;
        else if (radigResult === "updated") radigUpdated++;
        else skipped++;
      } catch (err) {
        console.error(`  ❌ Error syncing ${user.username}:`, err.message);
      }
    }

    // Delete users from TU/RADIG that no longer exist in Portal
    const portalUserIds = users.filter(u => u.isActive).map(u => u.id);
    if (portalUserIds.length > 0) {
      const tuDeleted = await client.query(
        `SELECT username FROM "User" WHERE id = ANY($1)`, [portalUserIds]
      );
      // We skip cascading deletes in full sync for safety
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`📤 TU: ${tuCreated} created, ${tuUpdated} updated`);
    console.log(`📤 RADIG: ${radigCreated} created, ${radigUpdated} updated, ${skipped} skipped`);
    console.log(`✅ Full sync completed in ${elapsed}s`);
  } finally {
    client.release();
  }
}

// ── HTTP Server ──
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => body += chunk);
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error("Invalid JSON")); }
    });
  });
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers for internal Docker network
  res.setHeader("Content-Type", "application/json");

  // Health check
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    return;
  }

  // Webhook: POST /sync
  if (req.method === "POST" && url.pathname === "/sync") {
    // Verify secret
    const secret = req.headers["x-sync-secret"];
    if (secret !== SYNC_SECRET) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "Invalid secret" }));
      return;
    }

    try {
      const { event, user } = await parseBody(req);
      if (!event || !user) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Missing event or user" }));
        return;
      }

      console.log(`📨 Webhook: ${event} → ${user.username}`);
      const results = await handleEvent(event, user);
      console.log(`   ✅ TU: ${results.tu}, RADIG: ${results.radig}`);

      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, results }));
    } catch (err) {
      console.error("Webhook error:", err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Full sync: POST /sync/full
  if (req.method === "POST" && url.pathname === "/sync/full") {
    const secret = req.headers["x-sync-secret"];
    if (secret !== SYNC_SECRET) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "Invalid secret" }));
      return;
    }

    try {
      await fullSync();
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, message: "Full sync completed" }));
    } catch (err) {
      console.error("Full sync error:", err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
}

// ── Entry point ──
async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  SMPIT Sync Service (Webhook Mode)");
  console.log(`  Port: ${PORT}`);
  console.log(`  Full sync interval: ${FULL_SYNC_INTERVAL}min`);
  console.log("═══════════════════════════════════════");

  await initPools();

  // Start HTTP server
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`🚀 Sync service listening on port ${PORT}`);
  });

  // Run initial full sync
  await fullSync();

  // Schedule periodic full sync as safety net
  if (FULL_SYNC_INTERVAL > 0) {
    const cronExpr = `*/${FULL_SYNC_INTERVAL} * * * *`;
    cron.schedule(cronExpr, fullSync);
    console.log(`⏰ Full sync scheduled: ${cronExpr}`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
