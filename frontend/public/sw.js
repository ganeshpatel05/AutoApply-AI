const CACHE_NAME = "autoapply-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/manifest.webmanifest",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/maskable-icon-512x512.png",
  "/apple-touch-icon.png",
  "/favicon.svg"
];

// Install Event - Pre-cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle Navigation & Static Resource Caching
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-HTTP/HTTPS requests (chrome-extension, etc.)
  if (!url.protocol.startsWith("http")) return;

  // Handle SPA Navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match("/")) || (await cache.match("/index.html"));
        })
    );
    return;
  }

  // Handle API calls (/api/*) - Network first, fallback to offline notice JSON
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        return new Response(
          JSON.stringify({
            error: "Offline",
            message: "You are currently offline. Please check your connection.",
            offline: true
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" }
          }
        );
      })
    );
    return;
  }

  // Handle Static Assets - Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
