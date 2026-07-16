(function (root) {
  "use strict";
  const DATA = /*MESAHA_RELEASE_DATA_START*/{
  "build": 44,
  "version": "44.0.0",
  "channel": "stable",
  "releasedAt": "2026-07-16T08:12:00+03:00",
  "assetToken": "orman-io-stable-20260716-6",
  "cacheName": "orman-io-shell-stable-20260716-6",
  "apps": {
    "suite": {
      "label": "Orman İO",
      "version": "44.0.0"
    },
    "mesaha": {
      "label": "Mesaha İO",
      "version": "5.89"
    },
    "istif": {
      "label": "İstif İO",
      "version": "0.3.14"
    },
    "admin": {
      "label": "Orman İO Yönetim",
      "version": "42.0.0"
    }
  },
  "description": "Şefliğe Gönder ekranının cihaz kayıtlarını yalnız gecikmeli localStorage kopyasından okuması düzeltildi; canlı Mesaha state ve IndexedDB kalıcı depo kayıtları öncelikli okunarak cihazdaki kayıt adedi ve gönderim doğru hale getirildi."
}/*MESAHA_RELEASE_DATA_END*/;
  const APP_NAMES = DATA.apps || {};
  const SCRIPT_URL = (() => {
    try {
      if (typeof document !== "undefined" && document.currentScript && document.currentScript.src) return document.currentScript.src;
      if (root.location && root.location.href) return new URL("./release.js", root.location.href).href;
    } catch (_) {}
    return "release.js";
  })();

  function appInfo(name) {
    return APP_NAMES[name] || APP_NAMES.suite || { label: "Orman İO", version: DATA.version };
  }

  function buildVersionObject(name) {
    const info = appInfo(name);
    return Object.freeze({
      version: String(info.version || DATA.version || "stable"),
      build: Number(DATA.build || 0),
      visibleVersion: String(info.label || "Orman İO"),
      shortVersion: String(info.label || "Orman İO"),
      app: String(info.label || "Orman İO"),
      cacheName: String(DATA.cacheName || "yakupp-suite-shell-stable"),
      assetToken: String(DATA.assetToken || "stable"),
      channel: String(DATA.channel || "stable")
    });
  }

  function parse(text) {
    const match = String(text || "").match(/\/\*MESAHA_RELEASE_DATA_START\*\/([\s\S]*?)\/\*MESAHA_RELEASE_DATA_END\*\//);
    if (!match) throw new Error("Güncelleme merkezi okunamadı.");
    return JSON.parse(match[1]);
  }

  function enforceCleanUi(label) {
    if (typeof document === "undefined") return;
    const selectors = [
      "#suiteVersionCorner", "#suiteVersionLabel", "#versionLabel", "#versionText",
      ".version-card", ".version-chip-v407", "[data-version-label]"
    ];
    const hide = () => selectors.forEach((selector) =>
      document.querySelectorAll(selector).forEach((node) => {
        node.hidden = true;
        node.setAttribute("aria-hidden", "true");
        node.style.setProperty("display", "none", "important");
      })
    );
    const keepTitle = () => {
      if (document.title !== label) document.title = label;
    };
    const run = () => { hide(); keepTitle(); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
    else run();
    try {
      const observer = new MutationObserver(run);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch (_) {}
  }

  async function fetchRemote(options) {
    const settings = options && typeof options === "object" ? options : {};
    const ownController = !settings.signal && typeof AbortController !== "undefined" ? new AbortController() : null;
    const signal = settings.signal || (ownController && ownController.signal) || undefined;
    const timeout = ownController ? setTimeout(() => { try { ownController.abort(); } catch (_) {} }, 6500) : 0;
    let response;
    try {
      response = await fetch(SCRIPT_URL + (SCRIPT_URL.includes("?") ? "&" : "?") + "remote=" + Date.now(), {
        cache: "no-store",
        signal,
        headers: { "Cache-Control": "no-cache" }
      });
    } finally {
      if (timeout) clearTimeout(timeout);
    }
    if (!response.ok) throw new Error("Güncelleme merkezi alınamadı.");
    const remote = parse(await response.text());
    const appName = settings.app || (root.MESAHA_VERSION && root.MESAHA_VERSION.app === "İstif İO" ? "istif" : "mesaha");
    const info = (remote.apps && remote.apps[appName]) || (remote.apps && remote.apps.suite) || {};
    return {
      ...remote,
      visibleVersion: String(info.label || "Mesaha İO"),
      shortVersion: String(info.label || "Mesaha İO"),
      app: String(info.label || "Mesaha İO")
    };
  }

  const api = Object.freeze({
    current: DATA,
    parse,
    fetchRemote,
    forApp: buildVersionObject,
    telemetry(name) {
      const info = appInfo(name);
      return `${String(info.label || name || "app")}@${String(info.version || DATA.version || "stable")}`;
    },
    use(name) {
      const version = buildVersionObject(name);
      root.MESAHA_VERSION = version;
      if (typeof document !== "undefined") enforceCleanUi(version.visibleVersion);
      return version;
    }
  });

  root.MESAHA_RELEASE = Object.freeze(DATA);
  root.MESAHA_RELEASE_URL = SCRIPT_URL;
  root.MesahaRelease = api;
  root.MESAHA_VERSION = buildVersionObject("suite");
  root.MesahaVersion = Object.freeze({
    fetchRemote,
    applyToDocument() {
      if (typeof document !== "undefined") enforceCleanUi((root.MESAHA_VERSION && root.MESAHA_VERSION.visibleVersion) || "Mesaha İO");
      return root.MESAHA_VERSION;
    },
    get current() { return root.MESAHA_VERSION; }
  });
})(typeof self !== "undefined" ? self : window);
