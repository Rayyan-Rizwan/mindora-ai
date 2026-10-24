/*
 * Mindora service worker (safe minimal PWA).
 *
 * Rules that MUST stay true:
 *  - Never cache API responses (anything under /api/).
 *  - Never cache authenticated/auth endpoints (/login, /reset-password, ...).
 *  - Only cache same-origin GET responses for static build assets (hashed
 *    files under /assets/) and the installable shell files.
 *  - Navigation requests always go to the network; there is no offline
 *    fallback page (the app requires the API for anything useful).
 */

const CACHE_NAME = "mindora-static-v1";
const ALLOW_PATH_PREFIXES = ["/assets/"];
const ALLOW_EXACT = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg", "/icon-maskable.svg"];
const DENY_PREFIXES = ["/api/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(ALLOW_EXACT.filter((url) => url !== "/index.html"))
      )
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  if (DENY_PREFIXES.some((prefix) => path.startsWith(prefix))) return;

  const cacheable =
    ALLOW_PATH_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
    ALLOW_EXACT.includes(path);

  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            void caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached);

      return cached ?? network;
    })
  );
});
