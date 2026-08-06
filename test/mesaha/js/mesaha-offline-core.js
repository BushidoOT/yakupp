/* Mesaha İO çevrimdışı çekirdeği — sürüm bilgisi release.js merkezinden alınır. */
(function (root) {
  "use strict";
  if (root.__mesahaOfflineCore) return;
  root.__mesahaOfflineCore = true;

  const META = root.MESAHA_VERSION || { app: "Mesaha İO", visibleVersion: "Mesaha İO", build: 0, assetToken: "stable", cacheName: "yakupp-suite-shell-stable" };
  const $ = (id) => document.getElementById(id);

  function cleanUi() {
    try { document.title = "Mesaha İO"; } catch (_) {}
    try {
      document.querySelectorAll("#versionText,.version-card,.version-chip-v407").forEach((node) => {
        node.hidden = true;
        node.style.setProperty("display", "none", "important");
      });
    } catch (_) {}
  }

  function setOnlineClass() {
    const online = navigator.onLine !== false;
    try {
      document.documentElement.classList.toggle("mesaha-online", online);
      document.documentElement.classList.toggle("mesaha-offline", !online);
      if (document.body) {
        document.body.classList.toggle("mesaha-online", online);
        document.body.classList.toggle("mesaha-offline", !online);
      }
      if (online) localStorage.setItem("mesaha_last_online_ms", String(Date.now()));
    } catch (_) {}
  }

  function connectionSaveData() {
    try {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return !!(connection && connection.saveData);
    } catch (_) { return false; }
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;
    const url = new URL("../service-worker.js", location.href);
    url.searchParams.set("release", String(root.MESAHA_RELEASE?.assetToken || "stable"));
    const registration = await navigator.serviceWorker.register(url.href, { scope: "../", updateViaCache: "none" });
    try {
      const last = Number(localStorage.getItem("mesaha_sw_update_check_current") || 0);
      if (navigator.onLine && Date.now() - last > 15 * 60 * 1000) {
        localStorage.setItem("mesaha_sw_update_check_current", String(Date.now()));
        registration.update().catch(() => {});
      }
    } catch (_) {}
    return registration;
  }

  async function warmCache() {
    if (!navigator.onLine || connectionSaveData() || !("serviceWorker" in navigator)) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const worker = registration.active || navigator.serviceWorker.controller;
      if (worker) worker.postMessage({ type: "CACHE_ALL", source: "mesaha-offline-core" });
      return true;
    } catch (_) { return false; }
  }

  function boot() {
    cleanUi();
    setOnlineClass();
    registerServiceWorker().then(warmCache).catch(() => {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  window.addEventListener("online", () => { setOnlineClass(); registerServiceWorker().then(warmCache).catch(() => {}); }, { passive: true });
  window.addEventListener("offline", setOnlineClass, { passive: true });
  window.addEventListener("pageshow", () => { cleanUi(); setOnlineClass(); }, { passive: true });

  const api = {
    meta: META,
    cacheName: META.cacheName,
    warmCache,
    online: () => navigator.onLine !== false,
    canManualUpdate() {
      const key = "mesaha_manual_update_guard_current";
      const last = Number(localStorage.getItem(key) || 0);
      if (Date.now() - last < 30000) return false;
      localStorage.setItem(key, String(Date.now()));
      return true;
    },
    canProbe() {
      const key = "mesaha_update_probe_guard_current";
      const last = Number(localStorage.getItem(key) || 0);
      if (Date.now() - last < 45000) return false;
      localStorage.setItem(key, String(Date.now()));
      return true;
    }
  };
  root.MesahaOfflineCore = api;
  root.MesahaOfflineCoreV383 = api;
  root.MesahaOfflineCoreV387 = api;
})(window);
