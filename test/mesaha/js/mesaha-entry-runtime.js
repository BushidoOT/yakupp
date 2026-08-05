/* Mesaha İO V70 — tek klavye, Kaydet, ürün kuralı ve bildirim motoru. */
(function installMesahaEntryRuntime(root) {
  "use strict";
  if (!root || root.MesahaEntryRuntimeV70) return;

  var INPUT_IDS = ["diameterInput", "lengthInput", "barcodeInput", "quantityInput"];
  var THEMES = {
    Tomruk: { key: "tomruk", label: "Tomruk", min: 1.5, max: 50 },
    "Maden Direk": { key: "maden", label: "Maden", min: 0.01, max: 50 },
    "Kağıtlık": { key: "kagit", label: "Kağıtlık", min: 0.01, max: 50 },
    "Sanayi Odunu": { key: "sanayi", label: "Sanayi", min: 0.5, max: 1.45 },
    "Tel Direk": { key: "tel", label: "Tel", min: 6.5, max: 25 },
  };
  var frame = 0;
  var hideTimer = 0;
  var toastTimer = 0;
  var lastFire = 0;
  var lastTouch = 0;
  var saveBusy = false;
  var warningAt = 0;
  var bound = false;

  function byId(id) { return document.getElementById(id); }
  function clean(value) { return String(value == null ? "" : value).trim(); }
  function normalizeProduct(value) {
    var name = clean(value).toLocaleLowerCase("tr-TR");
    if (name === "tomruk") return "Tomruk";
    if (/^maden( direk| direği| diregi)?$/.test(name)) return "Maden Direk";
    if (/^ka(ğ|g)ıtlık( odun)?$/.test(name)) return "Kağıtlık";
    if (name === "sanayi" || name === "sanayi odunu") return "Sanayi Odunu";
    if (/^tel( direk| direği| diregi)?$/.test(name)) return "Tel Direk";
    return THEMES[value] ? value : "Tomruk";
  }
  function currentProduct() {
    try {
      return normalizeProduct(root.state && root.state.settings && root.state.settings.currentProduct);
    } catch (_) { return "Tomruk"; }
  }
  function entryOpen() {
    var entry = byId("entryView");
    return !!(entry && entry.classList.contains("active"));
  }
  function validInput(node) { return !!(node && INPUT_IDS.indexOf(node.id) >= 0); }
  function focusedInput() { return validInput(document.activeElement); }
  function keyboardInset() {
    try {
      var vv = root.visualViewport;
      if (!vv) return 0;
      return Math.max(0, Math.round(root.innerHeight - vv.height - vv.offsetTop));
    } catch (_) { return 0; }
  }
  function saveWidth() {
    var width = Math.max(280, document.documentElement.clientWidth || root.innerWidth || 360);
    return Math.round(Math.max(112, Math.min(154, width * 0.31)));
  }
  function setVar(name, value) {
    document.documentElement.style.setProperty(name, value);
  }
  function moveFloatingToBody() {
    var button = byId("floatingSaveBtnV531");
    if (button && button.parentNode !== document.body) {
      try { document.body.appendChild(button); } catch (_) {}
    }
    return button;
  }
  function applyLengthRule() {
    var input = byId("lengthInput");
    if (!input) return;
    var product = currentProduct();
    var theme = THEMES[product] || THEMES.Tomruk;
    input.min = String(theme.min);
    input.max = String(theme.max);
    input.step = "0.01";
    input.dataset.productRule = product;
    if (product === "Tomruk") {
      input.setAttribute("aria-description", "Tomruk boyu en az 1,50 metre olmalıdır.");
    } else input.removeAttribute("aria-description");
  }
  function syncLayoutNow() {
    frame = 0;
    var original = byId("saveBtn");
    var floating = moveFloatingToBody();
    if (!original || !floating) return;
    var open = entryOpen() && focusedInput();
    var inset = open ? keyboardInset() : 0;
    var right = (document.documentElement.clientWidth || root.innerWidth || 360) <= 380 ? 8 : 10;
    var width = saveWidth();
    setVar("--mesaha-keyboard-inset-v70", inset + "px");
    setVar("--mesaha-save-right-v70", right + "px");
    setVar("--mesaha-save-width-v70", width + "px");
    document.body.classList.toggle("mesaha-entry-controls-open-v70", open);
    document.documentElement.classList.toggle("mesaha-entry-controls-open-v70", open);
    document.body.classList.toggle("mesaha-floating-save-open-v537", open);
    document.documentElement.classList.toggle("mesaha-floating-save-open-v537", open);
    floating.disabled = !!original.disabled;
    floating.setAttribute("aria-busy", original.getAttribute("aria-busy") === "true" ? "true" : "false");
    floating.textContent = clean(original.textContent) || "Kaydet";
    applyLengthRule();
    syncModalViewport();
  }
  function scheduleLayout() {
    if (frame) return;
    frame = (root.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); })(syncLayoutNow);
  }
  function fireSave(event, source) {
    if (event) {
      try {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      } catch (_) {}
    }
    var now = Date.now();
    source = source || "click";
    if (source === "click" && now - lastTouch < 850) return false;
    if (saveBusy || now - lastFire < 230) return false;
    var original = byId("saveBtn");
    if (!original || original.disabled || original.getAttribute("aria-busy") === "true") return false;
    lastFire = now;
    if (source === "touch") lastTouch = now;
    saveBusy = true;
    try { original.click(); }
    catch (_) {
      try { if (typeof root.saveEntry === "function") root.saveEntry(); } catch (_error) {}
    }
    setTimeout(function () { saveBusy = false; scheduleLayout(); }, 180);
    return false;
  }
  function bindFloating() {
    var button = moveFloatingToBody();
    var original = byId("saveBtn");
    if (!button || !original || button.__mesahaV70Bound) return;
    button.__mesahaV70Bound = true;
    button.__v537Bound = true;
    button.__v531Bound = true;
    if (root.PointerEvent) {
      button.addEventListener("pointerdown", function (event) {
        if (event.pointerType !== "mouse") {
          try { event.preventDefault(); event.stopPropagation(); } catch (_) {}
        }
      }, { passive: false, capture: true });
      button.addEventListener("pointerup", function (event) {
        if (event.pointerType !== "mouse") return fireSave(event, "touch");
      }, { passive: false, capture: true });
      button.addEventListener("click", function (event) {
        return fireSave(event, "click");
      }, { passive: false, capture: true });
    } else {
      button.addEventListener("touchstart", function (event) {
        try { event.preventDefault(); event.stopPropagation(); } catch (_) {}
      }, { passive: false, capture: true });
      button.addEventListener("touchend", function (event) {
        return fireSave(event, "touch");
      }, { passive: false, capture: true });
      button.addEventListener("click", function (event) {
        return fireSave(event, "click");
      }, { passive: false, capture: true });
    }
    if (root.MutationObserver) {
      new MutationObserver(scheduleLayout).observe(original, {
        attributes: true,
        attributeFilter: ["disabled", "aria-busy"],
        childList: true,
        subtree: true,
      });
    }
  }
  function ensureToast() {
    var oldIds = ["saveFloatToastV310", "saveFloatToastV313", "saveFloatToastV314"];
    oldIds.forEach(function (id) {
      var old = byId(id);
      if (old && old.id !== "mesahaEntryToastV70") old.remove();
    });
    var toast = byId("mesahaEntryToastV70");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "mesahaEntryToastV70";
      toast.className = "mesaha-entry-toast-v70";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.innerHTML = '<span class="ico">✓</span><span class="txt"><b></b><small></small></span>';
      document.body.appendChild(toast);
    }
    return toast;
  }
  function showToast(title, detail, type, product) {
    var toast = ensureToast();
    var kind = clean(type || "warning").toLowerCase();
    var productName = product ? normalizeProduct(product) : "";
    var productTheme = productName && THEMES[productName];
    toast.className = "mesaha-entry-toast-v70 " +
      (kind === "success" ? "is-success" : kind === "error" ? "is-error" : "is-warning") +
      (productTheme ? " product-" + productTheme.key : "");
    var icon = toast.querySelector(".ico");
    var heading = toast.querySelector("b");
    var small = toast.querySelector("small");
    if (icon) icon.textContent = kind === "success" ? "✓" : kind === "error" ? "!" : "⚠";
    if (heading) heading.textContent = clean(title) || (kind === "success" ? "Kayıt tamamlandı" : "Uyarı");
    if (small) small.textContent = clean(detail) || (kind === "success" ? "Eklendi" : "Kontrol et");
    scheduleLayout();
    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, kind === "success" ? 2800 : 3300);
    return toast;
  }
  function savedToast(record, wasEditing) {
    var rec = record || {};
    var product = normalizeProduct(rec.productType);
    var theme = THEMES[product] || THEMES.Tomruk;
    var title = [
      clean(rec.barcode),
      clean(rec.diameter) ? clean(rec.diameter) + "Ç" : "",
      clean(rec.length) ? clean(rec.length) + "B" : "",
      theme.label,
    ].filter(Boolean).join(" ");
    return showToast(title || "Kayıt", wasEditing ? "Güncellendi" : "Eklendi", "success", product);
  }
  function warningSound() {
    var now = Date.now();
    if (now - warningAt < 260) return false;
    warningAt = now;
    try {
      if (root.mesahaSound && typeof root.mesahaSound.warning === "function") return root.mesahaSound.warning();
      if (root.mesahaSoundFixV583 && typeof root.mesahaSoundFixV583.warning === "function") return root.mesahaSoundFixV583.warning();
    } catch (_) {}
    return false;
  }
  function destructiveTarget(target) {
    var button = target && target.closest ? target.closest("button,[role='button'],[data-del],[data-delete]") : null;
    if (!button) return false;
    var text = clean(button.textContent || button.getAttribute("aria-label"));
    return /sil|kaldır|kaldir|temizle|çıkar|cikar|oturumu kapat/i.test(text) || button.matches("[data-del],[data-delete]");
  }
  function modalOpen() {
    var overlay = byId("seflikSendOverlayV529");
    return !!(overlay && !overlay.classList.contains("hidden") && overlay.getAttribute("aria-hidden") !== "true");
  }
  function syncModalViewport() {
    var overlay = byId("seflikSendOverlayV529");
    var open = modalOpen();
    if (document.body) document.body.classList.toggle("seflik-send-open-v531", open);
    if (!overlay || !open) return;
    var vv = root.visualViewport;
    var height = Math.max(280, Math.round(vv ? vv.height : root.innerHeight));
    var top = Math.max(0, Math.round(vv ? vv.offsetTop : 0));
    setVar("--seflik-vv-height-v531", height + "px");
    setVar("--seflik-vv-top-v531", top + "px");
  }
  function applyTodayAndDraft() {
    try {
      var state = root.state && root.state.settings;
      if (state) {
        var date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        var today = date.toISOString().slice(0, 10);
        state.mesahaDate = today;
        var dateInput = byId("mesahaDate");
        if (dateInput && dateInput.value !== today) dateInput.value = today;
        var lengthInput = byId("lengthInput");
        if (lengthInput && state.length && !lengthInput.value) lengthInput.value = state.length;
      }
    } catch (_) {}
  }
  async function checkUpdateStatus() {
    var box = byId("updateStatusBox");
    if (!box) return;
    function set(text, cls) {
      box.classList.remove("update-available", "update-ok", "update-offline");
      if (cls) box.classList.add(cls);
      box.textContent = text;
    }
    if (root.MESAHA_SUITE_MODE) return set("Güncelleme ve offline hazırlık Orman İO tarafından yönetilir.", "update-ok");
    if (!navigator.onLine) return set("Offline: sürüm kontrolü internet gelince yapılır.", "update-offline");
    try {
      if (!root.MesahaVersion || typeof root.MesahaVersion.fetchRemote !== "function") throw new Error("Sürüm merkezi hazır değil");
      var remote = await root.MesahaVersion.fetchRemote();
      var current = root.MESAHA_VERSION || {};
      var newer = Number(remote.build || 0) > Number(current.build || 0);
      var label = remote.visibleVersion || remote.app || remote.version || "Yeni sürüm";
      set(newer ? "Yeni sürüm hazır: " + label + " — Güncelle butonuna bas." : "Uygulama güncel: " + (current.visibleVersion || label), newer ? "update-available" : "update-ok");
    } catch (_) {
      var local = root.MESAHA_VERSION || {};
      set("Uygulama yerelden doğrulandı: " + (local.visibleVersion || local.shortVersion || "Mesaha İO"), "update-ok");
    }
  }
  function ensureViewportMode() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    var content = meta.getAttribute("content") || "";
    if (!/interactive-widget=/i.test(content)) meta.setAttribute("content", content.replace(/\s+$/g, "") + ", interactive-widget=resizes-content");
  }
  function bind() {
    if (bound) return;
    bound = true;
    ensureViewportMode();
    bindFloating();
    ensureToast();
    applyTodayAndDraft();
    applyLengthRule();
    document.addEventListener("focusin", function (event) {
      if (!validInput(event.target)) return;
      clearTimeout(hideTimer);
      scheduleLayout();
    }, true);
    document.addEventListener("focusout", function () {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(scheduleLayout, 180);
    }, true);
    document.addEventListener("click", function (event) {
      if (event.target && event.target.closest && event.target.closest("#productButtons [data-product]")) {
        setTimeout(function () { applyLengthRule(); scheduleLayout(); }, 0);
      }
    }, true);
    document.addEventListener("pointerup", function (event) {
      if (event.isTrusted && destructiveTarget(event.target)) warningSound();
    }, true);
    root.addEventListener("mesaha:product-selected", function () {
      applyLengthRule();
      scheduleLayout();
    }, { passive: true });
    root.addEventListener("mesaha:settings-saved", applyLengthRule, { passive: true });
    root.addEventListener("mesaha:entry-save-complete", function () {
      saveBusy = false;
      scheduleLayout();
    }, { passive: true });
    root.addEventListener("online", checkUpdateStatus, { passive: true });
    root.addEventListener("offline", checkUpdateStatus, { passive: true });
    root.addEventListener("resize", scheduleLayout, { passive: true });
    root.addEventListener("orientationchange", scheduleLayout, { passive: true });
    root.addEventListener("pageshow", function () {
      applyTodayAndDraft();
      scheduleLayout();
    }, { passive: true });
    if (root.visualViewport) {
      root.visualViewport.addEventListener("resize", scheduleLayout, { passive: true });
      root.visualViewport.addEventListener("scroll", scheduleLayout, { passive: true });
    }
    try {
      if (navigator.virtualKeyboard && typeof navigator.virtualKeyboard.addEventListener === "function") {
        navigator.virtualKeyboard.addEventListener("geometrychange", scheduleLayout, { passive: true });
      }
    } catch (_) {}
    var overlay = byId("seflikSendOverlayV529");
    if (overlay && root.MesahaUiHub) root.MesahaUiHub.watchClass(overlay, syncModalViewport);
    var entry = byId("entryView");
    if (entry && root.MesahaUiHub) root.MesahaUiHub.watchClass(entry, scheduleLayout);
    setTimeout(checkUpdateStatus, 1200);
    scheduleLayout();
  }

  root.mesahaFloatToastV314 = showToast;
  root.mesahaFloatToastV315 = showToast;
  root.mesahaV310SavedToast = savedToast;
  root.MesahaProductionStabilizer = {
    positionSave: scheduleLayout,
    warning: warningSound,
  };
  root.MesahaV537 = {
    fireFloatingSave: fireSave,
    syncFloatingSave: scheduleLayout,
    syncModalViewport: syncModalViewport,
  };
  root.MesahaEntryRuntimeV70 = Object.freeze({
    sync: scheduleLayout,
    showToast: showToast,
    savedToast: savedToast,
    applyLengthRule: applyLengthRule,
    fireSave: fireSave,
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})(typeof window !== "undefined" ? window : null);
