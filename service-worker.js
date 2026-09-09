/* Orman İO V97 — arazi offline ve otomatik veri kaybı koruması. */
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
  "./suite-identity.js",
  "./suite-offline-store.js",
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
  "./js/mesaha-google-auth.js",
  "./js/mesaha-supabase-config.js",
  "./manifest.json",
  "./mesaha/admin.html",
  "./mesaha/css/app.css",
  "./mesaha/css/mesaha-runtime.css",
  "./mesaha/css/mesaha-management-v81.css",
  "./mesaha/css/mesaha-ui.css",
  "./mesaha/js/mesaha-foundation.js",
  "./mesaha/js/mesaha-app-runtime.js",
  "./mesaha/js/mesaha-auth-ui-runtime.js",
  "./mesaha/js/mesaha-home-runtime.js",
  "./mesaha/js/mesaha-feature-runtime.js",
  "./mesaha/js/mesaha-offline-guard-runtime.js",
  "./mesaha/js/mesaha-cloud-ui-runtime.js",
  "./mesaha/js/mesaha-session-ui-runtime.js",
  "./mesaha/js/mesaha-filter-runtime.js",
  "./mesaha/js/mesaha-profile-runtime.js",
  "./mesaha/js/mesaha-layout-runtime.js",
  "./mesaha/js/mesaha-lazy-features.js",
  "./mesaha/js/mesaha-management-runtime-v81.js",
  "./mesaha/css/mesaha-seflik-folder.css",
  "./mesaha/giris-log.html",
  "./mesaha/guncelle.html",
  "./mesaha/index.html",
  "./mesaha/js/mesaha-cloud-runtime.js",
  "./mesaha/js/mesaha-final-runtime.js",
  "./mesaha/js/mesaha-offline-core.js",
  "./mesaha/js/mesaha-sound.js",
  "./mesaha/js/mesaha-xls-backup-converter.js",
  "./mesaha/js/mesaha-seflik-ui.js",
  "./mesaha/js/mesaha-record-tools.js",
  "./mesaha/js/mesaha-seflik-runtime.js",
  "./mesaha/js/mesaha-update-manager.js",
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
  "./suite-identity.js",
  "./suite-offline-store.js",
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
  "./mesaha/css/mesaha-runtime.css",
  "./mesaha/css/mesaha-management-v81.css",
  "./mesaha/css/mesaha-ui.css",
  "./mesaha/css/mesaha-seflik-folder.css",
  "./mesaha/manifest.json",
  "./mesaha/suite-bridge.js",
  "./mesaha/js/mesaha-foundation.js",
  "./mesaha/js/mesaha-app-runtime.js",
  "./mesaha/js/mesaha-auth-ui-runtime.js",
  "./mesaha/js/mesaha-home-runtime.js",
  "./mesaha/js/mesaha-feature-runtime.js",
  "./mesaha/js/mesaha-offline-guard-runtime.js",
  "./mesaha/js/mesaha-cloud-ui-runtime.js",
  "./mesaha/js/mesaha-session-ui-runtime.js",
  "./mesaha/js/mesaha-filter-runtime.js",
  "./mesaha/js/mesaha-profile-runtime.js",
  "./mesaha/js/mesaha-layout-runtime.js",
  "./mesaha/js/mesaha-lazy-features.js",
  "./mesaha/js/mesaha-management-runtime-v81.js",
  "./mesaha/js/mesaha-offline-core.js",
  "./mesaha/js/mesaha-sound.js",
  "./mesaha/js/mesaha-final-runtime.js",
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

const SHELL_CRITICAL = [
  "./index.html",
  "./styles.css",
  "./app.js",
  "./release.js",
  "./suite-audio.js",
  "./suite-runtime-stabilizer.js",
  "./suite-identity.js",
  "./suite-offline-store.js",
  "./suite-security.js",
  "./suite-sync-core.js",
  "./suite-ui.js",
  "./suite-health.js",
  "./suite-cache-reset.js",
  "./js/mesaha-supabase-config.js",
  "./js/mesaha-firebase.js",
  "./js/mesaha-google-auth.js",
  "./manifest.json",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/orman_io_hero.webp"
];


/* V97 ARAZI MODU: Service Worker yalnız ana kabukla aktive olmaz.
   Mesaha'nın saha girişinde gereken tüm Mesaha + ortak dosyalar atomik olarak
   hazır değilse yeni worker kurulmaz; varsa önceki eksiksiz sürüm çalışmaya devam eder. */
const MESAHA_FIELD_CRITICAL = Array.from(new Set(
  SHELL_CRITICAL.concat(CORE.filter((path) => {
    const bucket = bucketFor(path);
    return bucket === "mesaha" || bucket === "shared";
  }))
));

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

function cacheFamilyBase(name) {
  const text = String(name || "");
  const match = text.match(/^(.*)-(shared|orman|mesaha|istif|admin)$/);
  return match && suiteCacheName(text) ? match[1] : "";
}

function familyRank(base) {
  const text = String(base || "");
  const version = text.match(/(?:^|-)v(\d+)(?:\D|$)/i);
  const date = text.match(/(20\d{6})/);
  return (Number(date && date[1] || 0) * 100000) + Number(version && version[1] || 0);
}

async function legacyFamilyBases() {
  const keys = await caches.keys();
  const bases = [];
  keys.forEach((name) => {
    const base = cacheFamilyBase(name);
    if (base && base !== BASE_CACHE && !bases.includes(base)) bases.push(base);
  });
  return bases.sort((a, b) => familyRank(b) - familyRank(a));
}

// Bir önceki eksiksiz sürümü koru. Böylece yeni paket hazırlanırken eski çalışan
// uygulama tek parça fallback olarak kalır; daha eski nesiller depolama şişirmesin.
async function deleteOldCaches() {
  const bases = await legacyFamilyBases();
  const keep = new Set(bases.slice(0, 2));
  const keys = await caches.keys();
  const deletable = keys.filter((name) => {
    if (!suiteCacheName(name) || CURRENT_CACHE_NAMES.includes(name)) return false;
    const base = cacheFamilyBase(name);
    return base && !keep.has(base);
  });
  await Promise.all(deletable.map((name) => caches.delete(name)));
  invalidateGenerationState(false);
  return deletable;
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
  return null;
}

async function matchFamily(base, value, options) {
  if (!base) return null;
  const opts = { ignoreSearch: true, ...(options || {}) };
  const bucket = bucketFor(value);
  const primary = await caches.open(base + "-" + bucket);
  let hit = await primary.match(value, opts);
  if (hit) return hit;
  if (bucket !== "shared") {
    const shared = await caches.open(base + "-shared");
    hit = await shared.match(value, opts);
    if (hit) return hit;
  }
  return null;
}

function contextApp(value, fallback) {
  const pathApp = (input) => {
    const path = relativePath(input).toLowerCase();
    if (path.startsWith("./mesaha/")) return "mesaha";
    if (path.startsWith("./istif/")) return "istif";
    if (path.startsWith("./yonetim/")) return "admin";
    return "orman";
  };
  const directBucket = bucketFor(value);
  if (directBucket !== "shared") return directBucket;
  try {
    if (value instanceof Request && value.referrer) return pathApp(value.referrer);
  } catch (_) {}
  if (fallback) return pathApp(fallback);
  return "orman";
}

const APP_GENERATION_CACHE = new Map();
const CLIENT_GENERATION_CACHE = new Map();
function invalidateGenerationState(includeClients = false) {
  APP_GENERATION_CACHE.clear();
  if (includeClients) CLIENT_GENERATION_CACHE.clear();
}
function clientGenerationKey(clientId, app) {
  return String(clientId || "") + "::" + String(app || "orman");
}
function cleanupClientGenerations() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  CLIENT_GENERATION_CACHE.forEach((value, key) => { if (!value || Number(value.at || 0) < cutoff) CLIENT_GENERATION_CACHE.delete(key); });
}
async function generationForApp(app, force = false, clientId = "") {
  const name = String(app || "orman");
  const clientKey = clientId ? clientGenerationKey(clientId, name) : "";
  cleanupClientGenerations();
  if (!force && clientKey) {
    const pinned = CLIENT_GENERATION_CACHE.get(clientKey);
    if (pinned) return pinned;
  }
  const cached = APP_GENERATION_CACHE.get(name);
  if (!force && !clientKey && cached && Date.now() - cached.at < 30000) return cached;
  const groups = appGroups();
  const paths = groups[name] || groups.orman || [];
  const currentReady = (await missingFrom(paths)).length === 0;
  let legacyBase = "";
  if (!currentReady) {
    const bases = await legacyFamilyBases();
    for (const base of bases) {
      let complete = true;
      for (const path of paths) {
        if (!(await matchFamily(base, path, { ignoreSearch: true }))) { complete = false; break; }
      }
      if (complete) { legacyBase = base; break; }
    }
  }
  const result = { app: name, current: currentReady, legacy: legacyBase, at: Date.now() };
  APP_GENERATION_CACHE.set(name, result);
  if (clientKey) CLIENT_GENERATION_CACHE.set(clientKey, result);
  return result;
}

async function matchAtomic(value, fallback, options) {
  const raw = options && typeof options === "object" ? options : {};
  const clientId = String(raw._clientId || "");
  const forceGeneration = raw._forceGeneration === true;
  const cacheOptions = { ...raw };
  delete cacheOptions._clientId;
  delete cacheOptions._forceGeneration;
  const app = contextApp(value, fallback);
  const state = await generationForApp(app, forceGeneration, clientId);
  if (state.current) {
    return (await matchCurrent(value, cacheOptions)) || (fallback && await matchCurrent(fallback, cacheOptions)) || null;
  }
  const legacyBase = state.legacy;
  if (legacyBase) {
    return (await matchFamily(legacyBase, value, cacheOptions)) || (fallback && await matchFamily(legacyBase, fallback, cacheOptions)) || null;
  }
  return (await matchCurrent(value, cacheOptions)) || (fallback && await matchCurrent(fallback, cacheOptions)) || null;
}

async function matchSuite(value, options) {
  return matchAtomic(value, null, options);
}

async function putCurrent(value, response) {
  if (!response || (!response.ok && response.type !== "opaque")) return false;
  try {
    const cache = await cacheFor(value);
    await cache.put(value, response.clone());
    // Aktif sayfanın seçtiği nesli burada değiştirmiyoruz. Sonraki navigasyon
    // yeni cache'in eksiksizliğini tekrar ölçer ve atomik olarak yeni nesle geçer.
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

async function fetchForCache(path, timeoutMs) {
  const request = new Request(new URL(path, self.registration.scope).href, { cache: "reload" });
  const response = await fetchWithTimeout(request, Math.max(600, Math.min(12000, Number(timeoutMs) || 12000)));
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

function weakConnectionForWarmup() {
  try {
    const c = self.navigator && (self.navigator.connection || self.navigator.mozConnection || self.navigator.webkitConnection);
    if (!c) return false;
    if (c.saveData === true) return true;
    const type = String(c.effectiveType || "").toLowerCase();
    if (type === "slow-2g" || type === "2g") return true;
    const downlink = Number(c.downlink || 0);
    return downlink > 0 && downlink < 0.45;
  } catch (_) { return false; }
}

async function cachePass(paths, force = false, options = {}) {
  let cursor = 0;
  let done = 0;
  const failed = [];
  const startedAt = Number(options.startedAt || Date.now());
  const maxMs = Math.max(0, Number(options.maxMs || 0));
  const deadline = maxMs ? startedAt + maxMs : 0;
  const shouldStop = () => !!(deadline && Date.now() >= deadline) || (options.weakAware === true && weakConnectionForWarmup());
  const workerCount = Math.max(1, Math.min(options.weakAware ? 3 : 5, paths.length));

  async function worker() {
    while (true) {
      if (shouldStop()) return;
      const index = cursor++;
      if (index >= paths.length) return;
      const path = paths[index];
      try {
        if (!force && (await matchCurrent(path, { ignoreSearch: true }))) {
          // Zaten güncel sürüm önbelleğinde.
        } else {
          const remaining = deadline ? Math.max(600, deadline - Date.now()) : 12000;
          if (deadline && remaining <= 600) return;
          const [request, response] = await fetchForCache(path, remaining);
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
  return { failed, stopped: shouldStop(), done, total: paths.length, weak: options.weakAware === true && weakConnectionForWarmup(), timedOut: !!(deadline && Date.now() >= deadline) };
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
  const shellMissing = await missingFrom(SHELL_CRITICAL);
  const fieldMissing = await missingFrom(MESAHA_FIELD_CRITICAL);
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
    shellMissing,
    shellReady: shellMissing.length === 0,
    fieldMissing,
    fieldReady: fieldMissing.length === 0,
    fieldCriticalCount: MESAHA_FIELD_CRITICAL.length,
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

let CACHE_ALL_PROMISE = null;

async function runCacheAll(force = false, cleanupOld = true, options = {}) {
  const startedAt = Date.now();
  const passOptions = { ...(options || {}), startedAt };
  let pass = { stopped: false, weak: false, timedOut: false };
  let targets = force ? CORE.slice() : await missingFrom(CORE);
  if (targets.length) pass = await cachePass(targets, force, passOptions);

  let missing = await missingFrom(CORE);
  const canRetry = missing.length && !pass.stopped && !(passOptions.maxMs && Date.now() - startedAt >= Number(passOptions.maxMs));
  if (canRetry) {
    await new Promise((resolve) => setTimeout(resolve, 180));
    pass = await cachePass(missing, false, passOptions);
    missing = await missingFrom(CORE);
  }

  const data = { ...(await buildStatus()), warmupStopped: !!pass.stopped, weakConnection: !!pass.weak, timedOut: !!pass.timedOut };
  try { await writeOfflineStatus(data); } catch (_) {}
  if (data.ready) invalidateGenerationState(false);
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


const CACHE_APP_PROMISES = new Map();

async function cacheApp(appName, force = false, options = {}) {
  const name = String(appName || "").toLowerCase();
  const groups = appGroups();
  const paths = groups[name];
  if (!paths) return { ok: false, app: name, error: "Bilinmeyen uygulama" };
  if (CACHE_APP_PROMISES.has(name) && !force) return CACHE_APP_PROMISES.get(name);
  const promise = (async () => {
    const targets = force ? paths.slice() : await missingFrom(paths);
    let pass = { stopped: false, weak: false, timedOut: false, done: 0, total: targets.length };
    if (targets.length) pass = await cachePass(targets, force, { ...(options || {}), startedAt: Date.now() });
    const missing = await missingFrom(paths);
    const ready = missing.length === 0;
    if (ready) APP_GENERATION_CACHE.delete(name);
    const result = { ok: ready, app: name, ready, missing, totalCount: paths.length, warmupStopped: !!pass.stopped, weakConnection: !!pass.weak, timedOut: !!pass.timedOut };
    await notify({ type: result.ready ? "APP_CACHE_READY" : "APP_CACHE_INCOMPLETE", app: name, missing });
    return result;
  })().finally(() => CACHE_APP_PROMISES.delete(name));
  CACHE_APP_PROMISES.set(name, promise);
  return promise;
}
async function cacheAll(force = false, cleanupOld = true, options = {}) {
  if (CACHE_ALL_PROMISE) {
    if (!force) return CACHE_ALL_PROMISE;
    try { await CACHE_ALL_PROMISE; } catch (_) {}
  }
  CACHE_ALL_PROMISE = runCacheAll(force, cleanupOld, options).finally(() => {
    CACHE_ALL_PROMISE = null;
  });
  return CACHE_ALL_PROMISE;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    // Arazi güvenliği: Mesaha saha dosyaları tam hazır olmadan yeni worker aktive olmaz.
    await cachePass(MESAHA_FIELD_CRITICAL, false);
    const fieldMissing = await missingFrom(MESAHA_FIELD_CRITICAL);
    if (fieldMissing.length) {
      throw new Error("Mesaha arazi offline paketi alınamadı: " + fieldMissing.join(", "));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const status = await buildStatus();
    invalidateGenerationState(true);
    if (status.ready) await deleteOldCaches();
    await notify({
      type: status.ready ? "CACHE_READY" : "CACHE_INCOMPLETE",
      percent: status.ready ? 100 : (status.shellReady ? 62 : 35),
      missing: status.missing,
      missingCount: status.missingCount,
      shellReady: status.shellReady,
      apps: status.apps,
      preservedPreviousCache: !status.ready,
    });
  })());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "WARM_CACHE") {
    const source = String(data.source || "startup");
    const explicitMax = Number(data.maxMs || 0);
    const manual = /update|repair|manual|download|user/i.test(source);
    const maxMs = explicitMax > 0 ? explicitMax : (manual ? 45000 : 5000);
    event.waitUntil((async () => {
      // Kullanıcı elle güncelleme/indirme başlattıysa daha önceki 5 sn'lik startup
      // kuyruğunun sonucunu tekrar kullanma; onu bitirip tam hazırlığı ayrıca çalıştır.
      if (manual && CACHE_ALL_PROMISE) { try { await CACHE_ALL_PROMISE; } catch (_) {} }
      const result = await cacheAll(false, true, { maxMs, weakAware: !manual });
      reply(event, { ok: result.ready, ...result, repaired: true, preserved: true, source, maxMs });
    })());
  } else if (data.type === "CACHE_ALL" || data.type === "REPAIR_CACHE") {
    event.waitUntil(cacheAll(false).then((result) => reply(event, {
      ok: result.ready, ...result, repaired: true, preserved: true,
    })));
  } else if (data.type === "CACHE_APP") {
    const source = String(data.source || "app-startup");
    const manual = /update|repair|manual|download|user/i.test(source);
    const maxMs = Number(data.maxMs || 0) > 0 ? Number(data.maxMs) : (manual ? 45000 : 5000);
    event.waitUntil((async () => {
      const appName = String(data.app || "").toLowerCase();
      if (manual && CACHE_APP_PROMISES.has(appName)) { try { await CACHE_APP_PROMISES.get(appName); } catch (_) {} }
      const result = await cacheApp(appName, false, { maxMs, weakAware: !manual });
      reply(event, { ...result, source, maxMs });
    })());
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
  // Güncel sürüm cache'inde varsa hızlı aç ve ağı arka planda yenile.
  const clientId = event && event.clientId ? event.clientId : "";
  const current = await matchAtomic(request, fallback, { ignoreSearch: true, _clientId: clientId });
  const network = fetchWithTimeout(request, 7000)
    .then(async (response) => {
      if (response && (response.ok || response.type === "opaque")) await putCurrent(request, response);
      return response;
    })
    .catch(() => null);

  if (current) {
    if (event && typeof event.waitUntil === "function") event.waitUntil(network.then(() => undefined).catch(() => undefined));
    return current;
  }

  // Yeni cache boşsa önce ağı dene. Önceki sürüm cache'i yalnız gerçek offline yedektir;
  // böylece güncellemeden sonraki ilk açılışta eski CSS/JS gösterilmez.
  const fresh = await network;
  if (fresh) return fresh;
  return (await matchAtomic(request, fallback, { ignoreSearch: true, _clientId: clientId })) || Response.error();
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
  const clientId = String(event.resultingClientId || event.clientId || "");
  const atomicOptions = { ignoreSearch: true, _clientId: clientId, _forceGeneration: true };
  const current = await matchAtomic(request, fallbackPath, atomicOptions);

  const refresh = fetchWithTimeout(new Request(request, { cache: "no-store" }), 3500)
    .then(async (response) => {
      if (response && response.ok) await putCurrent(request, response);
      return response;
    })
    .catch(() => null);

  if (current) {
    event.waitUntil(refresh.then(() => undefined).catch(() => undefined));
    return injectSuiteCacheTool(current, url);
  }

  const fresh = await refresh;
  if (fresh && fresh.ok) return injectSuiteCacheTool(fresh, url);
  const fallback = await matchAtomic(request, fallbackPath, { ignoreSearch: true, _clientId: clientId });
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
