/**
 * Sync utility — triggers webhook to sync service
 * Called after any user CRUD operation in Portal
 */

type SyncEvent = "user.created" | "user.updated" | "user.deleted";

interface SyncUser {
  id: string;
  username: string;
  name: string | null;
  nip: string | null;
  role: string;
  hashedPassword: string;
  isActive: boolean;
  image?: string | null;
}

export async function triggerSync(event: SyncEvent, user: SyncUser): Promise<void> {
  const syncUrl = process.env.SYNC_SERVICE_URL;
  const syncSecret = process.env.SYNC_SECRET;

  if (!syncUrl) {
    console.warn("SYNC_SERVICE_URL not set — skipping sync");
    return;
  }

  try {
    const res = await fetch(`${syncUrl}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sync-Secret": syncSecret || "",
      },
      body: JSON.stringify({ event, user }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!res.ok) {
      console.error(`Sync failed: ${res.status} ${await res.text()}`);
    } else {
      console.log(`Sync OK: ${event} → ${user.username}`);
    }
  } catch (err) {
    // Don't block the main operation if sync fails
    console.error("Sync error (non-blocking):", (err as Error).message);
  }
}
