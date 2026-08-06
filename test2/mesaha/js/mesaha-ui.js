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
    var display = byId("mesahaDateDisplay");
    if (!input || !display) return;
    display.textContent = formatDate(input.value);
    var card = input.closest(".home-date-card");
    if (card) card.setAttribute("aria-label", "Mesaha tarihi " + display.textContent);
  }

  function decorateSettings() {
    var map = [
      ["homeProductChecks", "settings-product-block"],
      ["homeTreeChecks", "settings-tree-block"],
      ["barcodeControlEnabled", "settings-barcode-block"],
      ["autoPaperLengthEnabled", "settings-automation-block"],
    ];
    map.forEach(function (row) {
      var node = byId(row[0]);
      var block = node && node.closest ? node.closest(".setting-block") : null;
      if (block) block.classList.add(row[1]);
    });
    var settingsView = byId("settingsView");
    if (settingsView) settingsView.setAttribute("data-modern-settings", "1");
  }

  function decorateEntry() {
    var view = byId("entryView");
    if (!view) return;
    view.setAttribute("data-modern-entry", "1");

    var productButtons = byId("productButtons");
    if (productButtons && productButtons.parentElement) {
      productButtons.parentElement.classList.add("product-entry-block");
    }

    var measure = view.querySelector(".measure-grid");
    if (measure) {
      var labels = Array.prototype.filter.call(measure.children || [], function (node) {
        return node && node.tagName === "LABEL";
      });
      if (labels[0]) labels[0].classList.add("measure-length-card");
      if (labels[1]) labels[1].classList.add("measure-diameter-card");
    }

    var barcode = view.querySelector(".barcode-save");
    if (barcode) barcode.classList.add("barcode-entry-block");

    var recent = view.querySelector(".recent-box");
    if (recent) recent.setAttribute("aria-label", "Son girilen barkodlar");
  }

  function bindDate() {
    var input = byId("mesahaDate");
    if (!input || input.__mesahaUIBound) return;
    input.__mesahaUIBound = true;
    ["input", "change"].forEach(function (name) {
      input.addEventListener(name, syncDate, { passive: true });
    });
  }

  function boot() {
    bindDate();
    syncDate();
    decorateSettings();
    decorateEntry();
  }

  root.MesahaUI = Object.freeze({
    syncDate: syncDate,
    refresh: boot,
    decorateEntry: decorateEntry,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener("pageshow", boot, { passive: true });
  window.addEventListener("mesaha:view-changed", function (event) {
    var view = event && event.detail ? event.detail.view : "";
    if (view === "home" || view === "settings" || view === "entry") {
      setTimeout(boot, 30);
    }
  }, { passive: true });

  [160, 600, 1400].forEach(function (delay) {
    setTimeout(boot, delay);
  });
})(window);
