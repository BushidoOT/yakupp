/* Orman İO ortak uyarı sesi motoru — mobil tarayıcılarda gerçek dokunuş sonrası güvenli WAV oynatma. */
(function (root) {
  "use strict";
  if (root.OrmanIoAudio) return;

  var scriptUrl = "";
  try {
    scriptUrl = document.currentScript && document.currentScript.src ? document.currentScript.src : new URL("./suite-audio.js", location.href).href;
  } catch (_) {
    scriptUrl = "./suite-audio.js";
  }
  var sources = {
    success: new URL("./assets/mesaha_onay.wav", scriptUrl).href,
    warning: new URL("./assets/mesaha_uyari.wav", scriptUrl).href,
  };
  var audio = { success: null, warning: null };
  var gestureSeen = false;
  var lastAt = { success: 0, warning: 0 };

  function normalize(kind) {
    return /warn|error|bad|danger|delete|sil|hata|uyar/i.test(String(kind || "")) ? "warning" : "success";
  }
  function ensure(kind) {
    kind = normalize(kind);
    if (audio[kind]) return audio[kind];
    try {
      var item = new Audio(sources[kind]);
      item.preload = "auto";
      item.volume = 1;
      item.setAttribute("playsinline", "");
      try { item.load(); } catch (_) {}
      audio[kind] = item;
      return item;
    } catch (_) {
      return null;
    }
  }
  function warm(event) {
    if (event && event.isTrusted === false) return false;
    if (event && event.isTrusted === true) gestureSeen = true;
    if (!gestureSeen) return false;
    ["success", "warning"].forEach(function (kind) {
      var item = ensure(kind);
      if (!item || item.__ormanPrimed) return;
      try {
        item.muted = true;
        item.currentTime = 0;
        var promise = item.play();
        if (promise && typeof promise.then === "function") {
          promise.then(function () {
            item.__ormanPrimed = true;
            try { item.pause(); item.currentTime = 0; item.muted = false; } catch (_) {}
          }).catch(function () {
            try { item.muted = false; } catch (_) {}
          });
        }
      } catch (_) {
        try { item.muted = false; } catch (_e) {}
      }
    });
    return true;
  }
  function play(kind, force) {
    kind = normalize(kind);
    if (!gestureSeen) return false;
    var now = Date.now();
    if (!force && now - lastAt[kind] < 260) return false;
    lastAt[kind] = now;
    var item = ensure(kind);
    if (!item) return false;
    try {
      item.pause();
      item.currentTime = 0;
      item.muted = false;
      item.volume = 1;
      var promise = item.play();
      if (promise && typeof promise.catch === "function") promise.catch(function () {});
      return true;
    } catch (_) {
      return false;
    }
  }
  function negativeMessage(message, type) {
    if (/bad|error|danger|warning/i.test(String(type || ""))) return true;
    return /hata|başarısız|basarisiz|olmadı|olmadi|olamaz|geçersiz|gecersiz|eksik|gerekli|gerekir|bulunamadı|bulunamadi|yok|silme|silindi|silinecek|silinemedi|kaydedilemedi|okunamadı|okunamadi|yüklenmedi|yuklenmedi|çalışmıyor|calismiyor|kaldırıldı|kaldirildi|çıkarıldı|cikarildi|iptal|uyarı|uyari|reddedildi|bağlı değil|bagli degil|çevrimdışı|cevrimdisi/i.test(String(message || ""));
  }

  ["pointerdown", "touchstart", "mousedown", "keydown", "click"].forEach(function (name) {
    try { document.addEventListener(name, warm, { capture: true, passive: true }); } catch (_) {}
  });
  ensure("success");
  ensure("warning");

  root.OrmanIoAudio = Object.freeze({
    warm: warm,
    success: function () { return play("success", false); },
    warning: function () { return play("warning", false); },
    forceWarning: function () { return play("warning", true); },
    shouldWarn: negativeMessage,
    sources: sources,
  });
})(typeof window !== "undefined" ? window : this);
