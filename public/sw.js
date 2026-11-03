/* LIFTLOG service worker
 * Aturan privasi cache:
 *  - Halaman aplikasi (berisi data privat) TIDAK PERNAH disimpan ke cache.
 *  - Navigasi: network-first; saat offline hanya /offline (statis) yang ditampilkan.
 *  - /api/* tidak pernah di-cache; respons gagal dikirim 503 agar app bisa antre offline.
 *  - Hanya aset statis bertanda hash (_next/static, ikon, css, js publik) yang di-cache.
 */

const VERSION = "liftlog-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|webp|svg|ico)$/.test(url.pathname)
  );
}

function isApi(url) {
  return url.pathname.startsWith("/api/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API privat: network-only, jangan pernah mampir ke cache.
  if (isApi(url)) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            JSON.stringify({ ok: false, error: "offline" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          )
      )
    );
    return;
  }

  // Aset statis: cache-first dengan penyegaran latar belakang.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => undefined);
        return cached ?? (await network) ?? Response.error();
      })()
    );
    return;
  }

  // Navigasi halaman: network-first. HTML privat TIDAK disimpan.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request, { cache: "no-store" });
          return res;
        } catch {
          const offline = await caches.match(OFFLINE_URL);
          return (
            offline ??
            new Response("Anda sedang offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })()
    );
    return;
  }

  // Lainnya (mis. /uploads lokal saat dev): network-only.
  event.respondWith(fetch(request).catch(() => Response.error()));
});

// Sinkronisasi saat koneksi pulih: beri tahu semua tab agar flush antrean.
self.addEventListener("message", (event) => {
  if (event.data === "LIFTLOG_SYNC_NOW") {
    event.waitUntil(
      self.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
        for (const client of list) client.postMessage("LIFTLOG_FLUSH_QUEUE");
      })
    );
  }
});
