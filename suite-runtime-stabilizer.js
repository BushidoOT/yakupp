(function (root) {
  "use strict";
  if (root.__ormanIoRuntimeStabilizerV66) return;
  root.__ormanIoRuntimeStabilizerV66 = true;

  var ERROR_KEY = "orman_io_runtime_errors_v66";
  var PERSIST_KEY = "orman_io_storage_persist_v66";
  var MAX_ERRORS = 24;
  var scriptUrl = (document.currentScript && document.currentScript.src) || location.href;
  var rootBase = new URL("./", scriptUrl);
  var workerUrl = new URL("./service-worker.js", rootBase);
  var repairPromise = null;
  var onlineTimer = 0;

  function clean(value, max) {
    var text = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    return text.slice(0, max || 500);
  }
  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }
  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }
  function appName() {
    var path = String(location.pathname || "").toLowerCase();
    if (/\/mesaha(?:\/|$)/.test(path)) return "mesaha";
    if (/\/istif(?:\/|$)/.test(path)) return "istif";
    if (/\/yonetim(?:\/|$)/.test(path)) return "admin";
    return "orman";
  }
  function errorText(error) {
    if (!error) return "Bilinmeyen hata";
    return clean(error.message || error.reason || error, 700);
  }
  function rememberError(kind, error, meta) {
    var message = errorText(error);
    if (!message || /ResizeObserver loop/i.test(message)) return;
    var rows = readJson(ERROR_KEY, []);
    if (!Array.isArray(rows)) rows = [];
    var last = rows.length ? rows[rows.length - 1] : null;
    var signature = kind + "|" + message + "|" + clean(meta && meta.source, 180);
    if (last && last.signature === signature && Date.now() - Number(last.time || 0) < 3000) return;
    rows.push({
      time: Date.now(),
      at: new Date().toISOString(),
      app: appName(),
      kind: clean(kind, 40),
      message: message,
      source: clean(meta && meta.source, 220),
      line: Number(meta && meta.line || 0),
      column: Number(meta && meta.column || 0),
      version: clean(root.MESAHA_RELEASE && root.MESAHA_RELEASE.version, 40),
      signature: signature
    });
    if (rows.length > MAX_ERRORS) rows = rows.slice(rows.length - MAX_ERRORS);
    writeJson(ERROR_KEY, rows);
  }
  function postMessage(worker, type, timeout) {
    return new Promise(function (resolve) {
      if (!worker || typeof MessageChannel === "undefined") return resolve(null);
      var channel = new MessageChannel();
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        resolve(null);
      }, Math.max(1000, Number(timeout || 5000)));
      channel.port1.onmessage = function (event) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(event.data || null);
      };
      try {
        worker.postMessage({ type: type }, [channel.port2]);
      } catch (_) {
        clearTimeout(timer);
        resolve(null);
      }
    });
  }
  async function cleanupNestedWorkers() {
    if (!("serviceWorker" in navigator)) return 0;
    var registrations = await navigator.serviceWorker.getRegistrations();
    var rootScope = rootBase.href;
    var removed = 0;
    for (var i = 0; i < registrations.length; i += 1) {
      var registration = registrations[i];
      var scope = String(registration.scope || "");
      if (scope === rootScope || scope.indexOf(rootScope) !== 0) continue;
      if (/\/(?:mesaha|istif|yonetim)\/$/i.test(scope)) {
        try {
          if (await registration.unregister()) removed += 1;
        } catch (_) {}
      }
    }
    return removed;
  }
  async function ensureRootWorker() {
    if (repairPromise) return repairPromise;
    repairPromise = (async function () {
      if (!("serviceWorker" in navigator) || !window.isSecureContext) return { ok: false, unsupported: true };
      await cleanupNestedWorkers();
      var registration = await navigator.serviceWorker.getRegistration(rootBase.href);
      if (!registration) {
        registration = await navigator.serviceWorker.register(
          workerUrl.href + "?release=" + encodeURIComponent((root.MESAHA_RELEASE && root.MESAHA_RELEASE.assetToken) || "stable"),
          { scope: rootBase.href, updateViaCache: "none" }
        );
      }
      try {
        if (navigator.onLine !== false && !sessionStorage.getItem("orman_io_sw_update_v66")) {
          sessionStorage.setItem("orman_io_sw_update_v66", "1");
          await registration.update();
        }
      } catch (_) {}
      var worker = navigator.serviceWorker.controller || registration.active || registration.waiting || registration.installing;
      if (!worker) {
        try { await navigator.serviceWorker.ready; } catch (_) {}
        worker = navigator.serviceWorker.controller || registration.active || registration.waiting;
      }
      // Yalnız durumu oku. Büyük cache hazırlığını app.js / ilgili uygulama çekirdeği
      // tek bir yerden başlatır; burada ikinci kez WARM_CACHE çağrısı yapılmaz.
      var status = await postMessage(worker, "GET_STATUS", 2200);
      return { ok: true, registration: registration, status: status };
    })().catch(function (error) {
      rememberError("service-worker", error, { source: workerUrl.href });
      return { ok: false, error: errorText(error) };
    }).finally(function () {
      setTimeout(function () { repairPromise = null; }, 1500);
    });
    return repairPromise;
  }
  async function requestPersistentStorage() {
    if (!navigator.storage || typeof navigator.storage.persist !== "function") return false;
    var saved = readJson(PERSIST_KEY, null);
    if (saved && saved.done) return !!saved.persisted;
    try {
      var current = typeof navigator.storage.persisted === "function" ? await navigator.storage.persisted() : false;
      var persisted = current || await navigator.storage.persist();
      writeJson(PERSIST_KEY, { done: true, persisted: !!persisted, at: new Date().toISOString() });
      return !!persisted;
    } catch (error) {
      writeJson(PERSIST_KEY, { done: true, persisted: false, at: new Date().toISOString(), error: errorText(error) });
      return false;
    }
  }
  function bindPersistenceGesture() {
    var fired = false;
    function run(event) {
      if (fired || (event && event.isTrusted === false)) return;
      fired = true;
      requestPersistentStorage();
      document.removeEventListener("pointerup", run, true);
      document.removeEventListener("click", run, true);
    }
    document.addEventListener("pointerup", run, { capture: true, passive: true });
    document.addEventListener("click", run, { capture: true, passive: true });
  }
  function scheduleOnlineRepair() {
    clearTimeout(onlineTimer);
    onlineTimer = setTimeout(function () { ensureRootWorker(); }, 700);
  }

  window.addEventListener("error", function (event) {
    rememberError("error", event.error || event.message, {
      source: event.filename,
      line: event.lineno,
      column: event.colno
    });
  });
  window.addEventListener("unhandledrejection", function (event) {
    rememberError("promise", event.reason, { source: "unhandledrejection" });
  });
  window.addEventListener("online", scheduleOnlineRepair, { passive: true });
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      try { window.dispatchEvent(new CustomEvent("ormanio:page-restored", { detail: { app: appName() } })); } catch (_) {}
      scheduleOnlineRepair();
    }
  }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      try { window.dispatchEvent(new CustomEvent("ormanio:resume", { detail: { app: appName() } })); } catch (_) {}
    }
  }, { passive: true });

  bindPersistenceGesture();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(ensureRootWorker, 900); }, { once: true });
  } else {
    setTimeout(ensureRootWorker, 900);
  }

  root.OrmanIoRuntimeStabilityV66 = {
    app: appName,
    errors: function () { return readJson(ERROR_KEY, []); },
    clearErrors: function () { try { localStorage.removeItem(ERROR_KEY); } catch (_) {} },
    repairOffline: ensureRootWorker,
    persistStorage: requestPersistentStorage,
    cleanupWorkers: cleanupNestedWorkers
  };
})(window);
