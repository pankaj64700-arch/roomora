/* RoomOra PWA service worker.
 * Cache only the app shell and same-origin static assets; never cache API/auth responses.
 */
const CACHE_PREFIX = "roomora-pwa";
const SHELL_CACHE = `${CACHE_PREFIX}-shell-v1`;
const ASSET_CACHE = `${CACHE_PREFIX}-assets-v1`;
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/roomora-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, ASSET_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put("/index.html", copy));
          }
          return response;
        })
        .catch(async () => (await caches.match("/index.html")) || (await caches.match("/")))
    );
    return;
  }

  // Keep authentication, database, and function/API requests network-only.
  if (url.pathname.startsWith("/rest/") || url.pathname.startsWith("/auth/") ||
      url.pathname.startsWith("/functions/") || url.pathname.includes("/api/")) return;

  const isStaticAsset = /\.(?:js|css|svg|png|jpg|jpeg|webp|ico|woff2?)$/i.test(url.pathname) ||
    url.pathname === "/manifest.webmanifest";
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
