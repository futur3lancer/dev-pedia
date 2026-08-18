// DevPedia service worker — installability + offline app-shell fallback lang.
// Sadyang HINDI nito ni-ca-cache ang articles/API responses (data caching
// scope) — bump lang ang CACHE_NAME kapag binago ang APP_SHELL list.
const CACHE_NAME = "devpedia-shell-v1";
const APP_SHELL = ["/offline.html", "/manifest.json", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Network-first para sa navigation lang (pagbukas ng page/route). Kapag
// online, laging fresh mula sa server — hindi ito offline-first cache.
// Kapag nabigo lang ang fetch (walang koneksyon), doon lang bumaba sa
// offline fallback shell. API routes, RSC data requests, at static assets
// ay dumadaan lang nang normal (hindi na-intercept) dahil ang mga 'yon ay
// laging nangangailangan ng fresh/authenticated data mula sa Supabase.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match("/offline.html").then((cached) => cached ?? Response.error())
    )
  );
});
