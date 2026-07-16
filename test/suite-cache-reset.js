(function () {
  "use strict";

  const TOOL_ID = "suiteCacheReset";
  const STYLE_ID = "suiteCacheResetStyle";
  const OVERLAY_ID = "suiteCacheResetOverlay";
  const DONE_KEY = "mesaha_suite_cache_reset_done";
  const CACHE_PREFIXES = ["yakupp-suite-shell-", "orman-io-shell-"];
  let busy = false;
  let lastPressAt = 0;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isStandalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;

  function toast(message, bad) {
    try {
      if (window.MesahaSuiteUI && typeof window.MesahaSuiteUI.toast === "function") {
        window.MesahaSuiteUI.toast(message, !!bad);
        return;
      }
    } catch (_) {}
    try { alert(message); } catch (_) {}
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${TOOL_ID}{touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
      #${TOOL_ID} svg{stroke:#a15d12}
      #${TOOL_ID}.is-busy{opacity:.68;pointer-events:none}
      #${OVERLAY_ID}{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:max(20px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));background:rgba(7,33,24,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      #${OVERLAY_ID}[hidden]{display:none!important}
      #${OVERLAY_ID} .suite-cache-card{width:min(390px,100%);border-radius:22px;background:#fff;padding:22px 20px;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.28)}
      #${OVERLAY_ID} .suite-cache-spinner{width:42px;height:42px;margin:0 auto 15px;border:4px solid #dcebe3;border-top-color:#19613f;border-radius:50%;animation:suiteCacheSpin .8s linear infinite}
      #${OVERLAY_ID} h3{margin:0 0 8px;color:#173d2d;font:850 20px/1.2 system-ui}
      #${OVERLAY_ID} p{margin:0;color:#587064;font:650 13px/1.5 system-ui}
      #${OVERLAY_ID} small{display:block;margin-top:12px;color:#8a5a18;font:750 11px/1.35 system-ui}
      @keyframes suiteCacheSpin{to{transform:rotate(360deg)}}
      @media(max-width:430px){#${OVERLAY_ID} .suite-cache-card{border-radius:19px;padding:20px 17px}#${OVERLAY_ID} h3{font-size:18px}}
      @media(prefers-reduced-motion:reduce){#${OVERLAY_ID} .suite-cache-spinner{animation-duration:1.8s}}
    `;
    document.head.appendChild(style);
  }

  function platformLabel() {
    if (isIOS) return isStandalone ? "iOS ana ekran uygulaması" : "iPhone / iPad Safari";
    if (isAndroid) return isStandalone ? "Android ana ekran uygulaması" : "Android Chrome";
    return "tarayıcı";
  }

  function ensureOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.hidden = true;
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "assertive");
    overlay.innerHTML = `
      <section class="suite-cache-card">
        <div class="suite-cache-spinner" aria-hidden="true"></div>
        <h3 id="suiteCacheResetTitle">Önbellek temizleniyor</h3>
        <p id="suiteCacheResetText">Uygulama dosyaları güvenli şekilde yenileniyor.</p>
        <small>Kayıtlar, oturum ve bulut bilgileri korunur.</small>
      </section>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function setProgress(title, text) {
    const overlay = ensureOverlay();
    overlay.hidden = false;
    const h = document.getElementById("suiteCacheResetTitle");
    const p = document.getElementById("suiteCacheResetText");
    if (h && title) h.textContent = title;
    if (p && text) p.textContent = text;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function withTimeout(promise, ms, label) {
    let timer = 0;
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(label || "İşlem zaman aşımına uğradı.")), ms);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function deleteWindowCaches() {
    if (!("caches" in window)) return { deleted: 0, unsupported: true };
    const keys = await caches.keys();
    const targets = keys.filter((key) => CACHE_PREFIXES.some((prefix) => key.indexOf(prefix) === 0));
    const results = await Promise.all(targets.map((key) => caches.delete(key).catch(() => false)));
    return { deleted: results.filter(Boolean).length, total: targets.length };
  }

  function messageWorker(worker, payload, timeoutMs) {
    if (!worker || typeof worker.postMessage !== "function" || typeof MessageChannel === "undefined") {
      return Promise.reject(new Error("Service Worker hazır değil."));
    }
    return withTimeout(
      new Promise((resolve, reject) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          const data = event.data || {};
          if (data.ok === false) reject(new Error(data.error || "Önbellek yenilenemedi."));
          else resolve(data);
        };
        try {
          worker.postMessage(payload, [channel.port2]);
        } catch (error) {
          reject(error);
        }
      }),
      timeoutMs || 90000,
      "Önbellek hazırlığı uzun sürdü.",
    );
  }

  async function currentRegistration() {
    if (!("serviceWorker" in navigator)) return null;
    try {
      return (await navigator.serviceWorker.getRegistration("./")) ||
        (await navigator.serviceWorker.getRegistration()) || null;
    } catch (_) {
      return null;
    }
  }

  async function refreshServiceWorker() {
    const registration = await currentRegistration();
    if (!registration) return { registration: null, worker: navigator.serviceWorker && navigator.serviceWorker.controller };
    try { await withTimeout(registration.update(), 18000, "Güncel uygulama dosyası alınamadı."); } catch (_) {}
    const waiting = registration.waiting;
    if (waiting) {
      try { waiting.postMessage({ type: "SKIP_WAITING" }); } catch (_) {}
      await Promise.race([
        new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true })),
        wait(3500),
      ]);
    }
    return {
      registration,
      worker: navigator.serviceWorker.controller || registration.active || registration.waiting || registration.installing || null,
    };
  }

  async function clearAndWarm() {
    setProgress("Önbellek temizleniyor", `${platformLabel()} için eski uygulama dosyaları kaldırılıyor.`);
    const sw = await refreshServiceWorker();
    let workerResult = null;
    try {
      workerResult = await messageWorker(sw.worker, { type: "CLEAR_APP_CACHE", source: "suite-button" }, 120000);
    } catch (_) {
      await deleteWindowCaches();
      if (sw.registration) {
        try { await withTimeout(sw.registration.update(), 18000); } catch (_) {}
      }
    }

    setProgress("Uygulama hazırlanıyor", "Mesaha İO ve İstif İO dosyaları yeniden indiriliyor.");
    if (!workerResult || workerResult.ready !== true) {
      const fresh = await refreshServiceWorker();
      try {
        await messageWorker(fresh.worker, { type: "CACHE_ALL", source: "suite-button" }, 120000);
      } catch (_) {
        // Eski Safari sürümlerinde MessageChannel yanıt vermese de sayfa yenilemesi
        // ağdan güncel dosyaları alır. Kullanıcı verileri hiçbir aşamada silinmez.
      }
    }
    return true;
  }

  function cleanReloadUrl() {
    const url = new URL("./", location.href);
    url.searchParams.set("cache_reset", String(Date.now()));
    url.hash = "";
    return url.href;
  }

  async function runReset() {
    if (busy) return;
    if (navigator.onLine === false) {
      toast("Önbelleği güvenli yenilemek için internet bağlantısı gerekli.", true);
      return;
    }
    const confirmed = confirm(
      "Orman İO uygulama önbelleği temizlenip güncel dosyalar yeniden indirilsin mi?\n\n" +
      "Mesaha ve İstif kayıtları, Google/terminal oturumu, şeflikler ve offline bölmeler SİLİNMEZ.",
    );
    if (!confirmed) return;

    busy = true;
    const button = document.getElementById(TOOL_ID);
    if (button) {
      button.classList.add("is-busy");
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    }
    try {
      await clearAndWarm();
      try {
        localStorage.setItem(DONE_KEY, JSON.stringify({ at: Date.now(), platform: platformLabel() }));
      } catch (_) {}
      setProgress("Temizleme tamamlandı", "Uygulama güncel dosyalarla yeniden açılıyor.");
      await wait(isIOS ? 900 : 500);
      location.replace(cleanReloadUrl());
    } catch (error) {
      const overlay = document.getElementById(OVERLAY_ID);
      if (overlay) overlay.hidden = true;
      busy = false;
      if (button) {
        button.classList.remove("is-busy");
        button.disabled = false;
        button.removeAttribute("aria-busy");
      }
      toast("Önbellek temizlenemedi: " + String((error && error.message) || error), true);
    }
  }

  function bindReliablePress(button) {
    const fire = (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      const now = Date.now();
      if (now - lastPressAt < 650) return;
      lastPressAt = now;
      runReset();
    };
    if (window.PointerEvent) button.addEventListener("pointerup", fire, { capture: true });
    button.addEventListener("click", fire, { capture: true });
  }

  function installButton() {
    if (document.getElementById(TOOL_ID)) return true;
    const strip = document.querySelector(".tool-strip");
    if (!strip) return false;
    const button = document.createElement("button");
    button.id = TOOL_ID;
    button.type = "button";
    button.className = "suite-cache-reset-tool";
    button.setAttribute("aria-label", "Uygulama önbelleğini temizle");
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
      </svg>
      <strong>Önbelleği Temizle</strong>
      <small>Kayıtları koruyarak yenile</small>`;
    const offlineButton = strip.querySelector('[data-tool="updates"]');
    if (offlineButton && offlineButton.nextSibling) strip.insertBefore(button, offlineButton.nextSibling);
    else strip.appendChild(button);
    bindReliablePress(button);
    return true;
  }

  function showDoneNotice() {
    let value = null;
    try {
      value = JSON.parse(localStorage.getItem(DONE_KEY) || "null");
      localStorage.removeItem(DONE_KEY);
    } catch (_) {}
    if (!value) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if ((window.MesahaSuiteUI && typeof window.MesahaSuiteUI.toast === "function") || attempts > 15) {
        clearInterval(timer);
        toast("Önbellek temizlendi. Güncel uygulama dosyaları hazır.");
      }
    }, 180);
  }

  function boot() {
    installStyle();
    ensureOverlay();
    if (!installButton()) {
      const observer = new MutationObserver(() => {
        if (installButton()) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 15000);
    }
    showDoneNotice();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
