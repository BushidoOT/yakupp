const CACHE_NAME = "mesaha-app-v173-stabilizasyon";
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
  "./css/style.css?v=173",
  "./js/core.js?v=173",
  "./js/admin-cloud.js?v=173",
  "./js/tree-entry.js?v=173",
  "./js/ui-mobile.js?v=173",
  "./js/records-filters.js?v=173",
  "./js/backup-storage.js?v=173",
  "./js/keyboard-filters.js?v=173",
  "./js/cutters.js?v=173",
  "./js/stability-base.js?v=173",
  "./js/control-test.js?v=173",
  "./js/stability-admin.js?v=173",
  "./js/stabilize-v173.js?v=173"
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
