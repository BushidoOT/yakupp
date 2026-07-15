/* Mesaha İO yayın stabilizasyonu: klavye üstü Kaydet ve uyarı sesi merkezi. */
(function () {
  "use strict";
  if (window.__mesahaProductionStabilizerV586) return;
  window.__mesahaProductionStabilizerV586 = true;

  var raf = 0;
  var lastWarningAt = 0;
  var validIds = ["diameterInput", "lengthInput", "barcodeInput", "quantityInput"];

  function byId(id) { return document.getElementById(id); }
  function validInput(node) { return !!(node && validIds.indexOf(node.id) >= 0); }
  function entryOpen() {
    var entry = byId("entryView");
    return !!(entry && entry.classList.contains("active"));
  }
  function floatingOpen() {
    return entryOpen() && validInput(document.activeElement);
  }
  function viewportBox() {
    var vv = window.visualViewport;
    var pageTop = window.scrollY || document.documentElement.scrollTop || 0;
    var pageLeft = window.scrollX || document.documentElement.scrollLeft || 0;
    var width = document.documentElement.clientWidth || window.innerWidth || 360;
    var height = window.innerHeight || document.documentElement.clientHeight || 640;
    if (vv) {
      pageTop = Number.isFinite(vv.pageTop) ? vv.pageTop : pageTop + (Number(vv.offsetTop) || 0);
      pageLeft = Number.isFinite(vv.pageLeft) ? vv.pageLeft : pageLeft + (Number(vv.offsetLeft) || 0);
      width = Math.max(1, Number(vv.width) || width);
      height = Math.max(1, Number(vv.height) || height);
    }
    try {
      var virtualKeyboard = navigator.virtualKeyboard;
      var keyboardRect = virtualKeyboard && virtualKeyboard.boundingRect;
      if (keyboardRect && Number(keyboardRect.height) > 0) {
        var documentScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        var keyboardTop = documentScrollTop + Number(keyboardRect.y || 0);
        var visibleBottom = pageTop + height;
        if (keyboardTop > pageTop && keyboardTop < visibleBottom)
          height = Math.max(1, keyboardTop - pageTop);
      }
    } catch (_) {}
    return { top: pageTop, left: pageLeft, width: width, height: height };
  }
  function moveToBody(button) {
    if (!button || button.parentNode === document.body) return;
    try { document.body.appendChild(button); } catch (_) {}
  }
  function positionNow() {
    raf = 0;
    var button = byId("floatingSaveBtnV531");
    if (!button) return;
    moveToBody(button);
    var open = floatingOpen();
    document.body.classList.toggle("mesaha-floating-save-open-v537", open);
    document.documentElement.classList.toggle("mesaha-floating-save-open-v537", open);
    if (!open) {
      button.style.setProperty("display", "none", "important");
      return;
    }
    button.style.setProperty("display", "inline-flex", "important");
    button.style.setProperty("position", "absolute", "important");
    button.style.setProperty("bottom", "auto", "important");
    button.style.setProperty("right", "auto", "important");
    button.style.setProperty("transform", "none", "important");
    var box = viewportBox();
    var rect = button.getBoundingClientRect();
    var buttonWidth = Math.max(118, rect.width || button.offsetWidth || 142);
    var buttonHeight = Math.max(54, rect.height || button.offsetHeight || 58);
    var margin = box.width <= 380 ? 8 : 10;
    var top = Math.max(box.top + margin, box.top + box.height - buttonHeight - margin);
    var left = Math.max(box.left + margin, box.left + box.width - buttonWidth - margin);
    button.style.setProperty("top", Math.round(top) + "px", "important");
    button.style.setProperty("left", Math.round(left) + "px", "important");
  }
  function queuePosition() {
    if (raf) return;
    raf = requestAnimationFrame(positionNow);
  }
  function installPositioning() {
    var button = byId("floatingSaveBtnV531");
    if (!button) return false;
    moveToBody(button);
    queuePosition();
    ["focusin", "focusout", "scroll", "resize", "orientationchange"].forEach(function (name) {
      window.addEventListener(name, queuePosition, { passive: true, capture: name === "focusin" || name === "focusout" });
    });
    document.addEventListener("focusin", queuePosition, true);
    document.addEventListener("focusout", function () { setTimeout(queuePosition, 80); }, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", queuePosition, { passive: true });
      window.visualViewport.addEventListener("scroll", queuePosition, { passive: true });
    }
    try {
      if (navigator.virtualKeyboard && typeof navigator.virtualKeyboard.addEventListener === "function")
        navigator.virtualKeyboard.addEventListener("geometrychange", queuePosition, { passive: true });
    } catch (_) {}
    window.addEventListener("pageshow", queuePosition, { passive: true });
    return true;
  }
  function warningSound() {
    var now = Date.now();
    if (now - lastWarningAt < 240) return false;
    lastWarningAt = now;
    try {
      if (window.mesahaSound && typeof window.mesahaSound.warning === "function")
        return window.mesahaSound.warning();
      if (window.mesahaSoundFixV583 && typeof window.mesahaSoundFixV583.warning === "function")
        return window.mesahaSoundFixV583.warning();
    } catch (_) {}
    return false;
  }
  function isWarning(title, detail, kind) {
    var text = String(title || "") + " " + String(detail || "");
    if (/error|danger/i.test(String(kind || ""))) return true;
    return /hata|başarısız|basarisiz|olmadı|olmadi|olamaz|geçersiz|gecersiz|eksik|gerekli|gerekir|bulunamadı|bulunamadi|daha önce kayıtlı|silme|silindi|silinecek|silinemedi|kaydedilemedi|okunamadı|okunamadi|yüklenmedi|yuklenmedi|çalışmıyor|calismiyor|kaldırıldı|kaldirildi|iptal|uyarı|uyari|giriniz|seçiniz|seciniz|en az|en fazla|giremez|küçük olmaz|büyük olmaz|arasında olmalı|arasında olmali/i.test(text);
  }
  function wrapToast() {
    var current = window.mesahaFloatToastV315;
    if (typeof current !== "function" || current.__productionSoundWrapped) return false;
    function wrapped(title, detail, kind) {
      var result = current.apply(this, arguments);
      if (isWarning(title, detail, kind)) warningSound();
      return result;
    }
    wrapped.__productionSoundWrapped = true;
    wrapped.__original = current;
    window.mesahaFloatToastV315 = wrapped;
    return true;
  }
  function destructiveTarget(target) {
    var button = target && target.closest ? target.closest("button,[role='button'],[data-del],[data-delete]") : null;
    if (!button) return false;
    var text = String(button.textContent || button.getAttribute("aria-label") || "").trim();
    return /sil|kaldır|kaldir|temizle|çıkar|cikar|oturumu kapat/i.test(text) || button.matches("[data-del],[data-delete]");
  }
  function installDeleteWarning() {
    function onDestructive(event) {
      if (!event.isTrusted || !destructiveTarget(event.target)) return;
      try {
        if (window.mesahaSound && typeof window.mesahaSound.warm === "function") window.mesahaSound.warm(event);
      } catch (_) {}
      warningSound();
    }
    document.addEventListener("pointerup", onDestructive, true);
    document.addEventListener("click", onDestructive, true);
  }
  function ensureViewportMode() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    var content = meta.getAttribute("content") || "";
    if (!/interactive-widget=/i.test(content)) meta.setAttribute("content", content.replace(/\s+$/g, "") + ", interactive-widget=resizes-content");
  }
  function boot() {
    ensureViewportMode();
    installPositioning();
    installDeleteWarning();
    wrapToast();
    [120, 450, 1200].forEach(function (ms) {
      setTimeout(function () { wrapToast(); queuePosition(); }, ms);
    });
    window.MesahaProductionStabilizer = { positionSave: queuePosition, warning: warningSound };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
