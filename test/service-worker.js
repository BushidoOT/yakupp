const CACHE_NAME = "mesaha-app-v169";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js",
  "./version.json",
  "./.nojekyll"
];

function timeoutPromise(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("network-timeout")), ms));
}

async function networkWithTimeout(request, ms) {
  return Promise.race([fetch(request, { cache: "reload" }), timeoutPromise(ms || 3000)]);
}

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
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isNavigation = request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");

  if (isNavigation) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedIndex = await cache.match("./index.html");
      try {
        const response = await networkWithTimeout(request, 3000);
        if (response && response.ok) cache.put("./index.html", response.clone()).catch(() => {});
        return response || cachedIndex || Response.error();
      } catch (err) {
        return cachedIndex || await caches.match("./") || new Response("Mesaha İO offline önbellek bulunamadı. İnternet varken bir kez güncelleyin.", {status: 503, headers: {"Content-Type":"text/plain; charset=utf-8"}});
      }
    })());
    return;
  }

  if (!sameOrigin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) {
      fetch(request).then((response) => {
        if (response && response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()).catch(() => {}));
      }).catch(() => {});
      return cached;
    }
    try {
      const response = await networkWithTimeout(request, 3000);
      if (response && response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()).catch(() => {}));
      return response;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
