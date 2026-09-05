(function (root) {
  "use strict";
  if (root.__istifStabilityV69) return;
  root.__istifStabilityV69 = true;

  var ready = false;
  var watchdog = 0;
  var lastFailure = "";

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, 700);
  }
  function esc(value) {
    return clean(value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }
  function isIos() {
    var ua = String(navigator.userAgent || "");
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1);
  }
  function appNode() {
    return document.getElementById("app");
  }
  function hideBoot() {
    var overlay = document.getElementById("bootOverlay");
    if (!overlay) return;
    overlay.classList.remove("show");
    overlay.hidden = true;
  }
  function recoveryHtml(message) {
    return '<main class="view"><section class="empty istif-recovery-v69">' +
      '<div class="istif-recovery-icon-v69">!</div>' +
      '<h2>İstif İO güvenli modda durdu</h2>' +
      '<p>' + esc(message || "Uygulama açılışı tamamlanamadı.") + '</p>' +
      '<div class="istif-recovery-actions-v69">' +
      '<button type="button" class="btn primary" data-istif-retry-v69>Tekrar Dene</button>' +
      '<button type="button" class="btn ghost" data-istif-repair-v69>Dosyaları Yenile</button>' +
      '<button type="button" class="btn ghost" data-istif-home-v69>Ana Menü</button>' +
      '</div><small>Cihazdaki istif ve ölçüm kayıtları silinmez.</small></section></main>';
  }
  function fail(message) {
    if (ready) return;
    lastFailure = clean(message) || "Uygulama açılışı tamamlanamadı.";
    hideBoot();
    var app = appNode();
    if (app) app.innerHTML = recoveryHtml(lastFailure);
    try { document.documentElement.setAttribute("data-istif-boot", "failed"); } catch (_) {}
  }
  function markReady() {
    ready = true;
    clearTimeout(watchdog);
    hideBoot();
    try { document.documentElement.setAttribute("data-istif-boot", "ready"); } catch (_) {}
  }
  function retry() {
    location.replace("./?retry=" + Date.now());
  }
  function repair() {
    var button = document.querySelector("[data-istif-repair-v69]");
    if (button) {
      button.disabled = true;
      button.textContent = "Yenileniyor…";
    }
    var runtime = root.OrmanIoRuntimeStabilityV66;
    var task = runtime && typeof runtime.repairOffline === "function" ? runtime.repairOffline() : Promise.resolve(null);
    Promise.resolve(task).catch(function () {}).then(function () {
      location.replace("./?repair=" + Date.now());
    });
  }
  function bindActions() {
    document.addEventListener("click", function (event) {
      var target = event.target && event.target.closest ? event.target.closest("[data-istif-retry-v69],[data-istif-repair-v69],[data-istif-home-v69]") : null;
      if (!target) return;
      event.preventDefault();
      if (target.hasAttribute("data-istif-retry-v69")) retry();
      else if (target.hasAttribute("data-istif-repair-v69")) repair();
      else location.href = "../?open=account";
    }, true);
  }

  function cleanupNestedWorker() {
    if (!(navigator.serviceWorker && typeof navigator.serviceWorker.getRegistrations === "function")) return;
    var key = "istif_nested_sw_cleanup_v69";
    var alreadyDone = false;
    try { alreadyDone = sessionStorage.getItem(key) === "1"; } catch (_) {}
    if (alreadyDone) return;
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      var removals = [];
      var removed = false;
      registrations.forEach(function (registration) {
        var scope = clean(registration && registration.scope);
        if (!/\/istif\/?$/i.test(scope)) return;
        removed = true;
        removals.push(Promise.resolve(registration.unregister()).catch(function () { return false; }));
      });
      return Promise.all(removals).then(function () { return removed; });
    }).then(function (removed) {
      try { sessionStorage.setItem(key, "1"); } catch (_) {}
      if (removed) location.replace("./?worker_cleanup=" + Date.now());
    }).catch(function () {
      try { sessionStorage.setItem(key, "1"); } catch (_) {}
    });
  }

  function start() {
    cleanupNestedWorker();
    if (isIos()) document.documentElement.classList.add("is-ios-istif-v69");
    document.documentElement.setAttribute("data-istif-boot", "loading");
    clearTimeout(watchdog);
    watchdog = setTimeout(function () {
      if (ready) return;
      var app = appNode();
      var text = clean(app && app.textContent);
      if (!text || /hazırlanıyor|açılıyor|yükleniyor/i.test(text)) {
        fail(lastFailure || "iOS yerel veritabanı veya uygulama dosyaları yanıt vermedi.");
      }
    }, 11500);
  }

  root.addEventListener("error", function (event) {
    if (ready) return;
    var source = clean(event && event.filename);
    var message = clean(event && (event.message || event.error && event.error.message));
    if (/\/istif\//i.test(source) || !appNode() || !clean(appNode().textContent)) {
      lastFailure = message || "İstif uygulama dosyası çalıştırılamadı.";
    }
  });
  root.addEventListener("unhandledrejection", function (event) {
    if (ready) return;
    var reason = event && event.reason;
    lastFailure = clean(reason && reason.message || reason) || lastFailure;
  });
  root.addEventListener("pageshow", function (event) {
    if (!event.persisted || ready) return;
    var app = appNode();
    if (!app || !clean(app.textContent)) retry();
  }, { passive: true });

  bindActions();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  root.IstifStabilityV69 = {
    ready: markReady,
    fail: fail,
    retry: retry,
    repair: repair,
    isIos: isIos
  };
})(window);
