const CACHE_NAME = "mesaha-app-v169-moduler-stabil";
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
  "./css/style.css?v=169",
  "./js/app-01.js?v=169",
  "./js/app-02.js?v=169",
  "./js/app-03.js?v=169",
  "./js/app-04.js?v=169",
  "./js/app-05.js?v=169",
  "./js/app-06.js?v=169",
  "./js/app-07.js?v=169",
  "./js/app-08.js?v=169",
  "./js/app-09.js?v=169",
  "./js/app-10.js?v=169",
  "./js/app-11.js?v=169",
  "./js/app-12.js?v=169",
  "./js/app-13.js?v=169",
  "./js/app-14.js?v=169",
  "./js/app-15.js?v=169",
  "./js/app-16.js?v=169",
  "./js/app-17.js?v=169",
  "./js/app-18.js?v=169",
  "./js/app-19.js?v=169",
  "./js/app-20.js?v=169",
  "./js/app-21.js?v=169",
  "./js/app-22.js?v=169",
  "./js/app-99-filter-order-lock.js?v=169",
  "./assets/mesaha_logo.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS).catch(() => cache.addAll(["./", "./index.html", "./manifest.json", "./service-worker.js", "./css/style.css?v=169"])))
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
