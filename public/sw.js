const CACHE_NAME = "vmdfix-v2";
const STATIC_ASSETS = ["/", "/index.html", "/icon.jpeg", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  // After install, open the app automatically
  e.waitUntil(
    self.clients.claim().then(() =>
      self.clients.matchAll({ type: "window" }).then((clients) => {
        if (clients.length > 0) {
          clients[0].focus();
        } else {
          self.clients.openWindow("/");
        }
      })
    )
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
