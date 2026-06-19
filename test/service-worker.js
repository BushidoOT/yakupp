const CACHE_NAME = "mesaha-app-v172-stabil-mimari-admin";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js",
  "./version.json",
  "./.nojekyll",
  "./mesaha_logo.png",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/mesaha_logo.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./css/style.css?v=172",
  "./js/core.js?v=172",
  "./js/admin-cloud.js?v=172",
  "./js/tree-entry.js?v=172",
  "./js/ui-mobile.js?v=172",
  "./js/records-filters.js?v=172",
  "./js/backup-storage.js?v=172",
  "./js/keyboard-filters.js?v=172",
  "./js/cutters.js?v=172",
  "./js/stability-base.js?v=172",
  "./js/control-test.js?v=172",
  "./js/stability-admin.js?v=172"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS).catch(() => cache.addAll(["./", "./index.html", "./manifest.json", "./service-worker.js"])))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : null)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data && event.data.type === "CLEAR_MESAHA_CACHE") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isNavigation = request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  if (isNavigation) {
    event.respondWith(
      fetch(request, { cache: "reload" }).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy).catch(() => {}));
        return response;
      }).catch(() => caches.match("./index.html").then((cached) => cached || caches.match("./")))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy).catch(() => {}));
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
