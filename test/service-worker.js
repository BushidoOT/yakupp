importScripts("./release.js");
const RELEASE = self.MESAHA_RELEASE || { build: 0, assetToken: "stable", cacheName: "yakupp-suite-shell-stable", version: "stable" };
const CACHE = RELEASE.cacheName || ("yakupp-suite-shell-" + RELEASE.assetToken);
const CACHE_TOOL_BUILD = String(RELEASE.assetToken || RELEASE.build || "stable");
const PREFIXES = ["yakupp-suite-shell-", "orman-io-shell-"];
const CORE = [
  "./release.js",
  "./app.js",
  "./assets/hero_forest_cover.webp",
  "./assets/orman_io_hero.webp",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/mesaha_logo.png",
  "./assets/mesaha_onay.wav",
  "./assets/mesaha_uyari.wav",
  "./index.html",
  "./legacy-backups.json",
  "./istif/app.js",
  "./istif/assets/istif-default.svg",
  "./istif/assets/mesaha-fallback.svg",
  "./istif/index.html",
  "./istif/manifest.json",
  "./istif/styles.css",
  "./istif/suite-bridge.js",
  "./istif/cloud-on-demand.js",
  "./istif/templates/orjinal.xlsx",
  "./istif/templates/ornek_doldurulmus.xlsx",
  "./js/mesaha-firebase.js",
  "./js/mesaha-google-auth-suite.js",
  "./js/mesaha-supabase-config.js",
  "./manifest.json",
  "./mesaha/admin.html",
  "./mesaha/css/app.css",
  "./mesaha/css/mesaha-seflik-folder.css",
  "./mesaha/giris-log.html",
  "./mesaha/guncelle.html",
  "./mesaha/index.html",
  "./mesaha/js/mesaha-data-guard.js",
  "./mesaha/js/mesaha-drive-bridge.js",
  "./mesaha/js/mesaha-early-optimizer.js",
  "./mesaha/js/mesaha-error-log.js",
  "./mesaha/js/mesaha-fast-tap-nav.js",
  "./mesaha/js/mesaha-filter-cutter-fix.js",
  "./mesaha/js/mesaha-firebase.js",
  "./mesaha/js/mesaha-google-auth.js",
  "./mesaha/js/mesaha-hybrid-cloud.js",
  "./mesaha/js/mesaha-ios-actions.js",
  "./mesaha/js/mesaha-ios-performance.js",
  "./mesaha/js/mesaha-ios-touch.js",
  "./mesaha/js/mesaha-login-debug.js",
  "./mesaha/js/mesaha-offline-core.js",
  "./mesaha/js/mesaha-persistent-store.js",
  "./mesaha/js/mesaha-product-touch.js",
  "./mesaha/js/mesaha-records-performance.js",
  "./mesaha/js/mesaha-render-storage.js",
  "./mesaha/js/mesaha-runtime.js",
  "./mesaha/js/mesaha-sound.js",
  "./mesaha/js/mesaha-save-focus.js",
  "./mesaha/js/mesaha-seflik-entry-repair.js",
  "./mesaha/js/mesaha-seflik-folder.js",
  "./mesaha/js/mesaha-seflik-governance.js",
  "./mesaha/js/mesaha-stability-core.js",
  "./mesaha/js/mesaha-storage-health.js",
  "./mesaha/js/mesaha-supabase-config.js",
  "./mesaha/js/mesaha-terminal-local.js",
  "./mesaha/js/mesaha-update-manager.js",
  "./mesaha/js/mesaha-url-cleanup.js",
  "./mesaha/js/mesaha-utils.js",
  "./mesaha/manifest.json",
  "./mesaha/suite-bridge.js",
  "./mesaha/temizle.html",
  "./yonetim/admin.css",
  "./yonetim/admin-system-report.css",
  "./yonetim/admin-system-report.js",
  "./yonetim/admin.js",
  "./yonetim/index.html",
  "./styles.css",
  "./suite-security.js",
  "./suite-cache-reset.js",
  "./suite-health.js",
  "./suite-sync-core.js",
  "./suite-ui.js",
  "./temizle.html",
];
const CRITICAL = [
  "./index.html",
  "./styles.css",
  "./app.js",
  "./suite-security.js",
  "./suite-cache-reset.js",
  "./suite-health.js",
  "./suite-sync-core.js",
  "./suite-ui.js",
  "./manifest.json",
  "./assets/icon-192.png",
  "./mesaha/index.html",
  "./mesaha/css/app.css",
  "./mesaha/js/mesaha-runtime.js",
  "./mesaha/js/mesaha-sound.js",
  "./mesaha/js/mesaha-save-focus.js",
  "./mesaha/suite-bridge.js",
  "./istif/index.html",
  "./istif/styles.css",
  "./istif/app.js",
  "./istif/suite-bridge.js",
  "./istif/cloud-on-demand.js",
];
const EXTERNAL = [];
async function notify(data) {
  const cs = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });
  cs.forEach((c) => c.postMessage(data));
}
function reply(e, data) {
  try {
    if (e.ports && e.ports[0]) e.ports[0].postMessage(data);
  } catch (_e) {}
}
async function fetchForCache(path) {
  const req = new Request(path, { cache: "reload" });
  const res = await fetch(req);
  if (!res || (!res.ok && res.type !== "opaque")) throw new Error(path);
  return [req, res];
}
async function missingFrom(cache, list = CORE) {
  const missing = [];
  for (const path of list)
    if (!(await cache.match(path, { ignoreSearch: true }))) missing.push(path);
  return missing;
}
async function cachePass(cache, paths) {
  let cursor = 0;
  let done = 0;
  const failed = [];
  const workerCount = Math.max(1, Math.min(4, paths.length));
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= paths.length) return;
      const path = paths[index];
      try {
        const [req, res] = await fetchForCache(path);
        await cache.put(req, res.clone());
      } catch (_error) {
        failed.push(path);
      }
      done++;
      if (done % 6 === 0 || done === paths.length) {
        await notify({
          type: "CACHE_PROGRESS",
          percent: Math.round((done / Math.max(1, paths.length)) * 100),
          text: "Orman İO dosyaları hazırlanıyor: " + done + "/" + paths.length,
        });
      }
    }
  }
  await Promise.all(Array.from({ length: workerCount }, worker));
  return failed;
}
async function cacheCritical() {
  const cache = await caches.open(CACHE);
  const missing = await missingFrom(cache, CRITICAL);
  if (missing.length) await cachePass(cache, missing);
  return !(await missingFrom(cache, CRITICAL)).length;
}
async function cacheAll() {
  const cache = await caches.open(CACHE);
  let missing = await missingFrom(cache);
  if (missing.length) await cachePass(cache, missing);
  missing = await missingFrom(cache);
  if (missing.length) {
    await new Promise((r) => setTimeout(r, 250));
    await cachePass(cache, missing);
  }
  missing = await missingFrom(cache);
  const criticalMissing = await missingFrom(cache, CRITICAL),
    ready = !missing.length;
  const data = {
    ready,
    cache: CACHE,
    missing,
    missingCount: missing.length,
    criticalMissing,
    at: new Date().toISOString(),
    build: Number(RELEASE.build || 0),
    integrity: String(RELEASE.version || "stable"),
    criticalCount: CRITICAL.length,
    totalCount: CORE.length,
  };
  await cache.put(
    "./offline-status.json",
    new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    }),
  );
  await notify({
    type: ready ? "CACHE_READY" : "CACHE_INCOMPLETE",
    percent: ready ? 100 : 90,
    missing,
    missingCount: missing.length,
  });
  return data;
}
async function status() {
  const cache = await caches.open(CACHE),
    missing = await missingFrom(cache),
    criticalMissing = await missingFrom(cache, CRITICAL);
  return {
    ready: !missing.length,
    missing,
    missingCount: missing.length,
    criticalMissing,
    cache: CACHE,
    build: Number(RELEASE.build || 0),
    integrity: String(RELEASE.version || "stable"),
    criticalCount: CRITICAL.length,
    totalCount: CORE.length,
  };
}
self.addEventListener("install", (e) =>
  e.waitUntil(cacheCritical().then(() => self.skipWaiting())),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => PREFIXES.some((prefix) => k.startsWith(prefix)) && k !== CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
      const st = await status();
      await notify({
        type: st.ready ? "CACHE_READY" : "CACHE_INCOMPLETE",
        percent: st.ready ? 100 : 35,
        missing: st.missing,
        missingCount: st.missingCount,
      });
      // iOS ana ekran PWA ve Android Chrome, yeni worker etkinleştiğinde açık
      // sayfayı bir kez yenilesin. Böylece önbellek aracı ilk güncellemede gelir.
      const openClients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
      for (const client of openClients) {
        try {
          const url = new URL(client.url);
          const path = url.pathname.replace(/\/+$/, "");
          const isRoot = !/\/(?:mesaha|istif|yonetim)(?:\/|$)/i.test(path) && !/\/temizle\.html$/i.test(path);
          if (isRoot && url.searchParams.get("sw_refresh") !== CACHE_TOOL_BUILD) {
            url.searchParams.set("sw_refresh", CACHE_TOOL_BUILD);
            await client.navigate(url.href);
          }
        } catch (_) {}
      }
    })(),
  ),
);
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (
    d.type === "CACHE_ALL" ||
    d.type === "REPAIR_CACHE" ||
    d.type === "WARM_CACHE"
  )
    e.waitUntil(
      cacheAll().then((x) =>
        reply(e, { ok: x.ready, ...x, repaired: true, preserved: true }),
      ),
    );
  else if (d.type === "CLEAR_APP_CACHE")
    e.waitUntil(
      (async () => {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.filter((key) => PREFIXES.some((prefix) => key.startsWith(prefix))).map((key) => caches.delete(key)));
          const result = await cacheAll();
          reply(e, { ok: true, ...result, cleared: true, preserved: true });
        } catch (error) {
          reply(e, { ok: false, error: String((error && error.message) || error) });
        }
      })(),
    );
  else if (d.type === "GET_STATUS")
    e.waitUntil(status().then((x) => reply(e, x)));
  else if (d.type === "SKIP_WAITING")
    e.waitUntil(self.skipWaiting().then(() => reply(e, { ok: true })));
});
function isSuiteRootNavigation(url) {
  const path = String((url && url.pathname) || "").replace(/\/+$/, "");
  return (
    !/\/(?:mesaha|istif|yonetim)(?:\/|$)/i.test(path) &&
    !/\/temizle\.html$/i.test(path) &&
    !/\/guncelle\.html$/i.test(path)
  );
}
async function injectSuiteCacheTool(response, url) {
  if (!response || !response.ok || !isSuiteRootNavigation(url)) return response;
  const type = String(response.headers.get("content-type") || "");
  if (type && !/text\/html/i.test(type)) return response;
  try {
    const text = await response.clone().text();
    if (/suite-cache-reset\.js/i.test(text)) return response;
    const tag = '<script src="./suite-cache-reset.js" defer><\/script>';
    const html = /<\/body>/i.test(text)
      ? text.replace(/<\/body>/i, tag + "</body>")
      : text + tag;
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("cache-control", "no-cache");
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  } catch (_) {
    return response;
  }
}
function appFallback(url) {
  const p = String((url && url.pathname) || "").replace(/\/+$/, "");
  if (/\/istif(?:\/|$)/.test(p)) return "./istif/index.html";
  if (/\/(?:mesaha\/)?yonetim(?:\/|$)/.test(p)) return "./yonetim/index.html";
  if (/\/mesaha(?:\/|$)/.test(p)) return "./mesaha/index.html";
  return "./index.html";
}
async function stale(req, fallback) {
  const cache = await caches.open(CACHE),
    hit =
      (await cache.match(req, { ignoreSearch: true })) ||
      (fallback && (await cache.match(fallback, { ignoreSearch: true })));
  const net = fetch(req)
    .then(async (r) => {
      if (r && (r.ok || r.type === "opaque")) await cache.put(req, r.clone());
      return r;
    })
    .catch(() => null);
  if (hit) {
    net.catch(() => {});
    return hit;
  }
  return (
    (await net) ||
    (fallback && (await cache.match(fallback, { ignoreSearch: true }))) ||
    Response.error()
  );
}
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(new Request(req, { cache: "no-store" }));
    if (fresh && fresh.ok) await cache.put(req, fresh.clone());
    return fresh;
  } catch (_) {
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin) {
    if (EXTERNAL.includes(u.href)) e.respondWith(stale(e.request));
    return;
  }
  if (/\/version\.json$/.test(u.pathname)) {
    e.respondWith(networkFirst(e.request));
    return;
  }
  if (e.request.mode === "navigate") {
    e.respondWith((async () => {
      const fresh = await networkFirst(e.request);
      if (fresh && fresh.ok) return injectSuiteCacheTool(fresh, u);
      const cache = await caches.open(CACHE);
      const fallback = (await cache.match(appFallback(u), { ignoreSearch: true })) || Response.error();
      return injectSuiteCacheTool(fallback, u);
    })());
  } else e.respondWith(stale(e.request));
});
