(function (root) {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function formatDate(value) {
    var raw = String(value || "").trim();
    var parts = raw.split("-");
    if (parts.length !== 3) return "Tarih seç";
    return parts[2] + "." + parts[1] + "." + parts[0];
  }

  function syncDate() {
    var input = byId("mesahaDate");
    var display = byId("mesahaDateDisplayV73");
    if (!input || !display) return;
    display.textContent = formatDate(input.value);
    var card = input.closest(".home-date-card-v73");
    if (card) card.setAttribute("aria-label", "Mesaha tarihi " + display.textContent);
  }

  function decorateSettings() {
    var map = [
      ["homeProductChecks", "settings-product-block-v73"],
      ["homeTreeChecks", "settings-tree-block-v73"],
      ["barcodeControlEnabled", "settings-barcode-block-v73"],
      ["autoPaperLengthEnabled", "settings-automation-block-v73"],
    ];
    map.forEach(function (row) {
      var node = byId(row[0]);
      var block = node && node.closest ? node.closest(".setting-block") : null;
      if (block) block.classList.add(row[1]);
    });
    var settingsView = byId("settingsView");
    if (settingsView) settingsView.setAttribute("data-modern-settings-v73", "1");
  }

  function bindDate() {
    var input = byId("mesahaDate");
    if (!input || input.__mesahaV73Bound) return;
    input.__mesahaV73Bound = true;
    ["input", "change"].forEach(function (name) {
      input.addEventListener(name, syncDate, { passive: true });
    });
  }

  function boot() {
    bindDate();
    syncDate();
    decorateSettings();
  }

  root.MesahaHomeV73 = Object.freeze({ syncDate: syncDate, refresh: boot });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener("pageshow", boot, { passive: true });
  window.addEventListener("mesaha:view-changed", function (event) {
    var view = event && event.detail ? event.detail.view : "";
    if (view === "home" || view === "settings") setTimeout(boot, 30);
  }, { passive: true });
  [160, 600, 1400].forEach(function (delay) { setTimeout(boot, delay); });
})(window);
