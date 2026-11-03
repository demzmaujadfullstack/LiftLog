import { offlineDb, type SyncItem } from "./db";

let syncing = false;

/**
 * Sinkronisasi foreground: kirim semua item antrean ke endpoint masing-masing.
 * Idempotency key ikut terkirim dalam payload sehingga server menolak duplikat.
 */
export async function syncPendingQueue(): Promise<{ synced: number; failed: number }> {
  if (syncing || typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }
  syncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const queue = await offlineDb.getQueue();
    queue.sort((a, b) => a.createdAt - b.createdAt);

    for (const item of queue) {
      try {
        const res = await fetch(item.endpoint, {
          method: item.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });

        if (res.ok || res.status === 409) {
          // 409 = idempotency key sudah diproses server → anggap sukses
          if (item.id !== undefined) await offlineDb.removeQueued(item.id);
          synced += 1;
        } else if (res.status >= 400 && res.status < 500) {
          // error permanen (validasi) — buang agar tidak nyangkut, catat errornya
          if (item.id !== undefined) await offlineDb.removeQueued(item.id);
          failed += 1;
        } else {
          await markAttempt(item, `HTTP ${res.status}`);
          failed += 1;
        }
      } catch (e) {
        await markAttempt(item, e instanceof Error ? e.message : "network error");
        failed += 1;
        if (!navigator.onLine) break; // koneksi putus lagi, hentikan
      }
    }
  } finally {
    syncing = false;
  }

  return { synced, failed };
}

async function markAttempt(item: SyncItem, error: string) {
  item.attempts += 1;
  item.lastError = error;
  if (item.attempts >= 8 && item.id !== undefined) {
    // terlalu banyak kegagalan — buang dari antrean agar tidak memblokir selamanya
    await offlineDb.removeQueued(item.id);
    return;
  }
  await offlineDb.updateQueued(item);
}

export function newIdempotencyKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
