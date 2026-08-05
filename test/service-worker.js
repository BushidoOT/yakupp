importScripts("./release.js");

const RELEASE = self.MESAHA_RELEASE || {
  build: 0,
  assetToken: "stable",
  cacheName: "orman-io-shell-stable",
  version: "stable",
};

const BASE_CACHE = RELEASE.cacheName || ("orman-io-shell-" + RELEASE.assetToken);
const CACHE_TOOL_BUILD = String(RELEASE.assetToken || RELEASE.build || "stable");
const PREFIXES = ["yakupp-suite-shell-", "orman-io-shell-"];
const CACHE_NAMES = Object.freeze({
  shared: BASE_CACHE + "-shared",
  orman: BASE_CACHE + "-orman",
  mesaha: BASE_CACHE + "-mesaha",
  istif: BASE_CACHE + "-istif",
  admin: BASE_CACHE + "-admin",
});
const CURRENT_CACHE_NAMES = Object.freeze(Object.values(CACHE_NAMES));
const CACHE_OBJECTS = new Map();

const CORE = [
  "./release.js",
  "./suite-audio.js",
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
  "./istif/ios-stability.js",
  "./istif/templates/orjinal.xlsx",
  "./istif/templates/ornek_doldurulmus.xlsx",
  "./js/mesaha-firebase.js",
  "./js/mesaha-google-auth-suite.js",
  "./js/mesaha-supabase-config.js",
  "./manifest.json",
  "./mesaha/admin.html",
  "./mesaha/css/app.css",
  "./mesaha/css/mesaha-home-settings-v73.css",
  "./mesaha/js/mesaha-core.js",
  "./mesaha/js/mesaha-home-settings-v73.js",
  "./mesaha/js/mesaha-entry-core.js",
  "./mesaha/css/mesaha-seflik-folder.css",
  "./mesaha/giris-log.html",
  "./mesaha/guncelle.html",
  "./mesaha/index.html",
  "./mesaha/js/mesaha-data-guard.js",
  "./mesaha/js/mesaha-backup-format.js",
  "./mesaha/js/mesaha-drive-bridge.js",
  "./mesaha/js/mesaha-error-log.js",
  "./mesaha/js/mesaha-filter-cutter-fix.js",
  "./mesaha/js/mesaha-filter-mirror.js",
  "./mesaha/js/mesaha-firebase.js",
  "./mesaha/js/mesaha-google-auth.js",
  "./mesaha/js/mesaha-hybrid-cloud.js",
  "./mesaha/js/mesaha-ios-actions.js",
  "./mesaha/js/mesaha-login-debug.js",
  "./mesaha/js/mesaha-offline-core.js",
  "./mesaha/js/mesaha-persistent-store.js",
  "./mesaha/js/mesaha-runtime.js",
  "./mesaha/js/mesaha-sound.js",
  "./mesaha/js/mesaha-xls-backup-converter.js",
  "./mesaha/js/mesaha-seflik-entry-repair.js",
  "./mesaha/js/mesaha-seflik-folder.js",
  "./mesaha/js/mesaha-seflik-governance.js",
  "./mesaha/js/mesaha-storage-health.js",
  "./mesaha/js/mesaha-supabase-config.js",
  "./mesaha/js/mesaha-terminal-local.js",
  "./mesaha/js/mesaha-update-manager.js",
  "./mesaha/js/mesaha-url-cleanup.js",
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
  "./suite-runtime-stabilizer.js",
  "./suite-sync-core.js",
  "./suite-ui.js",
  "./temizle.html",
  "./vendor/jspdf.umd.min.js",
];

const CRITICAL = [
  "./index.html",
  "./styles.css",
  "./app.js",
  "./release.js",
  "./suite-audio.js",
  "./suite-security.js",
  "./suite-cache-reset.js",
  "./suite-health.js",
  "./suite-runtime-stabilizer.js",
  "./suite-sync-core.js",
  "./suite-ui.js",
  "./manifest.json",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/mesaha_onay.wav",
  "./assets/mesaha_uyari.wav",
  "./mesaha/index.html",
  "./mesaha/css/app.css",
  "./mesaha/css/mesaha-seflik-folder.css",
  "./mesaha/manifest.json",
  "./mesaha/suite-bridge.js",
  "./mesaha/js/mesaha-runtime.js",
  "./mesaha/js/mesaha-core.js",
  "./mesaha/js/mesaha-entry-core.js",
  "./mesaha/js/mesaha-offline-core.js",
  "./mesaha/js/mesaha-persistent-store.js",
  "./mesaha/js/mesaha-sound.js",
  "./mesaha/js/mesaha-filter-mirror.js",
  "./mesaha/js/mesaha-xls-backup-converter.js",
  "./istif/index.html",
  "./istif/styles.css",
  "./istif/app.js",
  "./istif/manifest.json",
  "./istif/suite-bridge.js",
  "./istif/cloud-on-demand.js",
  "./istif/ios-stability.js",
  "./istif/templates/orjinal.xlsx",
  "./istif/templates/ornek_doldurulmus.xlsx",
  "./vendor/jspdf.umd.min.js",
];

const EXTERNAL = [];

function suiteCacheName(name) {
  return PREFIXES.some((prefix) => String(name || "").startsWith(prefix));
}

async function openNamedCache(name) {
  if (!CACHE_OBJECTS.has(name)) CACHE_OBJECTS.set(name, caches.open(name));
  return CACHE_OBJECTS.get(name);
}

function relativePath(value) {
  try {
    const scope = new URL(self.registration.scope);
    const url = value instanceof Request
      ? new URL(value.url)
      : new URL(String(value || "./"), scope);
    let path = url.pathname;
    if (path.startsWith(scope.pathname)) path = path.slice(scope.pathname.length);
    path = path.replace(/^\/+/, "");
    return "./" + path;
  } catch (_) {
    const text = String(value || "./").split(/[?#]/)[0].replace(/^\/+/, "");
    return text.startsWith("./") ? text : "./" + text;
  }
}

function bucketFor(value) {
  const path = relativePath(value).toLowerCase();
  if (path.startsWith("./mesaha/")) return "mesaha";
  if (path.startsWith("./istif/")) return "istif";
  if (path.startsWith("./yonetim/")) return "admin";
  if (
    path.startsWith("./assets/") ||
    path.startsWith("./js/") ||
    path.startsWith("./vendor/") ||
    /^\.\/suite-[^/]+\.js$/.test(path) ||
    path === "./release.js"
  ) return "shared";
  return "orman";
}

async function cacheFor(value) {
  return openNamedCache(CACHE_NAMES[bucketFor(value)] || CACHE_NAMES.orman);
}

async function legacyCacheNames() {
  const keys = await caches.keys();
  return keys.filter((name) => suiteCacheName(name) && !CURRENT_CACHE_NAMES.includes(name));
}

async function deleteOldCaches() {
  const old = await legacyCacheNames();
  await Promise.all(old.map((name) => caches.delete(name)));
  return old;
}

async function matchCurrent(value, options) {
  const opts = { ignoreSearch: true, ...(options || {}) };
  const primaryName = CACHE_NAMES[bucketFor(value)] || CACHE_NAMES.orman;
  const primary = await openNamedCache(primaryName);
  let hit = await primary.match(value, opts);
  if (hit) return hit;

  if (primaryName !== CACHE_NAMES.shared) {
    const shared = await openNamedCache(CACHE_NAMES.shared);
    hit = await shared.match(value, opts);
    if (hit) return hit;
  }

  for (const name of CURRENT_CACHE_NAMES) {
    if (name === primaryName || name === CACHE_NAMES.shared) continue;
    const cache = await openNamedCache(name);
    hit = await cache.match(value, opts);
    if (hit) return hit;
  }
  return null;
}

async function matchSuite(value, options) {
  const current = await matchCurrent(value, options);
  if (current) return current;
  const opts = { ignoreSearch: true, ...(options || {}) };
  for (const name of await legacyCacheNames()) {
    const cache = await caches.open(name);
    const hit = await cache.match(value, opts);
    if (hit) return hit;
  }
  return null;
}

async function putCurrent(value, response) {
  if (!response || (!response.ok && response.type !== "opaque")) return false;
  try {
    const cache = await cacheFor(value);
    await cache.put(value, response.clone());
    return true;
  } catch (_) {
    // Depolama kotası dolsa bile başarılı ağ yanıtını kullanıcıdan saklama.
    return false;
  }
}

async function notify(data) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  clients.forEach((client) => client.postMessage(data));
}

function reply(event, data) {
  try {
    if (event.ports && event.ports[0]) event.ports[0].postMessage(data);
  } catch (_) {}
}

async function fetchForCache(path) {
  const request = new Request(new URL(path, self.registration.scope).href, { cache: "reload" });
  const response = await fetchWithTimeout(request, 12000);
  if (!response || (!response.ok && response.type !== "opaque")) throw new Error(path);
  return [request, response];
}

async function missingFrom(list = CORE) {
  const missing = [];
  for (const path of list) {
    if (!(await matchCurrent(path, { ignoreSearch: true }))) missing.push(path);
  }
  return missing;
}

async function cachePass(paths, force = false) {
  let cursor = 0;
  let done = 0;
  const failed = [];
  const workerCount = Math.max(1, Math.min(5, paths.length));

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= paths.length) return;
      const path = paths[index];
      try {
        if (!force && (await matchCurrent(path, { ignoreSearch: true }))) {
          // Zaten güncel sürüm önbelleğinde.
        } else {
          const [request, response] = await fetchForCache(path);
          await putCurrent(request, response);
        }
      } catch (_) {
        failed.push(path);
      }
      done++;
      if (done % 6 === 0 || done === paths.length) {
        await notify({
          type: "CACHE_PROGRESS",
          percent: Math.round((done / Math.max(1, paths.length)) * 100),
          text: "Offline uygulamalar hazırlanıyor: " + done + "/" + paths.length,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, worker));
  return failed;
}

function appGroups() {
  return {
    orman: CORE.filter((path) => bucketFor(path) === "orman" || bucketFor(path) === "shared"),
    mesaha: CORE.filter((path) => bucketFor(path) === "mesaha" || bucketFor(path) === "shared"),
    istif: CORE.filter((path) => bucketFor(path) === "istif" || bucketFor(path) === "shared"),
    admin: CORE.filter((path) => bucketFor(path) === "admin" || bucketFor(path) === "shared"),
  };
}

async function buildStatus() {
  const missing = await missingFrom(CORE);
  const criticalMissing = await missingFrom(CRITICAL);
  const groups = appGroups();
  const apps = {};
  for (const [name, paths] of Object.entries(groups)) {
    const appMissing = await missingFrom(paths);
    apps[name] = { ready: appMissing.length === 0, missing: appMissing, totalCount: paths.length };
  }
  return {
    ready: missing.length === 0,
    missing,
    missingCount: missing.length,
    criticalMissing,
    cache: BASE_CACHE,
    caches: CACHE_NAMES,
    build: Number(RELEASE.build || 0),
    integrity: String(RELEASE.version || "stable"),
    criticalCount: CRITICAL.length,
    totalCount: CORE.length,
    apps,
  };
}

async function writeOfflineStatus(data) {
  const cache = await openNamedCache(CACHE_NAMES.shared);
  await cache.put(
    new Request(new URL("./offline-status.json", self.registration.scope).href),
    new Response(JSON.stringify({ ...data, at: new Date().toISOString() }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    }),
  );
}

async function cacheAll(force = false, cleanupOld = true) {
  let targets = force ? CORE.slice() : await missingFrom(CORE);
  if (targets.length) await cachePass(targets, force);

  let missing = await missingFrom(CORE);
  if (missing.length) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await cachePass(missing, false);
  }

  const data = await buildStatus();
  try { await writeOfflineStatus(data); } catch (_) {}
  if (data.ready && cleanupOld) await deleteOldCaches();
  await notify({
    type: data.ready ? "CACHE_READY" : "CACHE_INCOMPLETE",
    percent: data.ready ? 100 : 90,
    missing: data.missing,
    missingCount: data.missingCount,
    apps: data.apps,
  });
  return data;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    // Üç uygulamanın tüm çalışma kabuğunu kurulum sırasında hazırla.
    // Böylece service worker etkinleştiği anda Orman, Mesaha ve İstif çevrimdışı açılabilir.
    await cacheAll(true, false);
    const criticalMissing = await missingFrom(CRITICAL);
    if (criticalMissing.length) {
      throw new Error("Kritik offline dosyalar alınamadı: " + criticalMissing.join(", "));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const status = await buildStatus();
    // Yeni sürüm tamamen hazır değilse eski çalışan offline cache'i koru.
    if (status.ready) await deleteOldCaches();
    await self.clients.claim();
    await notify({
      type: status.ready ? "CACHE_READY" : "CACHE_INCOMPLETE",
      percent: status.ready ? 100 : 55,
      missing: status.missing,
      missingCount: status.missingCount,
      apps: status.apps,
      preservedPreviousCache: !status.ready,
    });
  })());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "CACHE_ALL" || data.type === "REPAIR_CACHE" || data.type === "WARM_CACHE") {
    event.waitUntil(cacheAll(false).then((result) => reply(event, {
      ok: result.ready,
      ...result,
      repaired: true,
      preserved: true,
    })));
  } else if (data.type === "CLEAR_APP_CACHE") {
    event.waitUntil((async () => {
      try {
        // Önce mevcut çalışan cache'i silmek yerine dosyaları güvenli biçimde yenile.
        // Ağ kesilirse eski offline sürüm kullanılabilir kalır.
        const result = await cacheAll(true);
        reply(event, { ok: result.ready, ...result, refreshed: true, preserved: true });
      } catch (error) {
        reply(event, { ok: false, preserved: true, error: String((error && error.message) || error) });
      }
    })());
  } else if (data.type === "GET_STATUS") {
    event.waitUntil(buildStatus().then((result) => reply(event, result)));
  } else if (data.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting().then(() => reply(event, { ok: true })));
  }
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
    const html = /<\/body>/i.test(text) ? text.replace(/<\/body>/i, tag + "</body>") : text + tag;
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
  const path = String((url && url.pathname) || "").replace(/\/+$/, "");
  if (/\/istif(?:\/|$)/.test(path)) return "./istif/index.html";
  if (/\/(?:mesaha\/)?yonetim(?:\/|$)/.test(path)) return "./yonetim/index.html";
  if (/\/mesaha(?:\/|$)/.test(path)) return "./mesaha/index.html";
  return "./index.html";
}

async function fetchWithTimeout(request, timeout = 5000) {
  if (typeof AbortController === "undefined") return fetch(request);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(new Request(request, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }
}

async function stale(request, fallback, event) {
  const hit = (await matchSuite(request, { ignoreSearch: true })) ||
    (fallback && (await matchSuite(fallback, { ignoreSearch: true })));
  const network = fetchWithTimeout(request, 7000)
    .then(async (response) => {
      if (response && (response.ok || response.type === "opaque")) await putCurrent(request, response);
      return response;
    })
    .catch(() => null);

  if (hit) {
    if (event && typeof event.waitUntil === "function") event.waitUntil(network.then(() => undefined).catch(() => undefined));
    return hit;
  }
  return (await network) ||
    (fallback && (await matchSuite(fallback, { ignoreSearch: true }))) ||
    Response.error();
}

async function networkFirst(request, timeout = 5000) {
  try {
    const fresh = await fetchWithTimeout(new Request(request, { cache: "no-store" }), timeout);
    if (fresh && fresh.ok) {
      await putCurrent(request, fresh);
      const url = new URL(request.url);
      if (/\/release\.js$/i.test(url.pathname)) {
        await putCurrent(new Request(new URL("./release.js", self.registration.scope).href), fresh);
      }
    }
    return fresh;
  } catch (_) {
    return (await matchSuite(request, { ignoreSearch: true })) || Response.error();
  }
}

async function navigationCacheFirst(event, url) {
  const request = event.request;
  const fallbackPath = appFallback(url);
  const cached = (await matchSuite(request, { ignoreSearch: true })) ||
    (await matchSuite(fallbackPath, { ignoreSearch: true }));

  const refresh = fetchWithTimeout(new Request(request, { cache: "no-store" }), 4500)
    .then(async (response) => {
      if (response && response.ok) await putCurrent(request, response);
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(refresh.then(() => undefined));
    return injectSuiteCacheTool(cached, url);
  }

  const fresh = await refresh;
  if (fresh && fresh.ok) return injectSuiteCacheTool(fresh, url);
  const fallback = await matchSuite(fallbackPath, { ignoreSearch: true });
  return injectSuiteCacheTool(fallback || Response.error(), url);
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    if (EXTERNAL.includes(url.href)) event.respondWith(stale(event.request, null, event));
    return;
  }

  if (/\/version\.json$/i.test(url.pathname)) {
    event.respondWith(networkFirst(event.request, 4500));
    return;
  }

  if (/\/release\.js$/i.test(url.pathname) &&
      (url.searchParams.has("update_check") || url.searchParams.has("remote") || url.searchParams.has("fresh"))) {
    event.respondWith(networkFirst(event.request, 4500));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(navigationCacheFirst(event, url));
    return;
  }

  event.respondWith(stale(event.request, null, event));
});
