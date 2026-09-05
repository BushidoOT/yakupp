/* source: mesaha-no-cutter-filter-fix */
(function () {
        "use strict";
        if (window.__mesahaV572NoCutterFilterFix) return;
        window.__mesahaV572NoCutterFilterFix = true;
        var SPECIAL = "Kesimci kaydı yok";
        function clean(v) {
          return String(v == null ? "" : v)
            .trim()
            .replace(/\s+/g, " ");
        }
        function settings() {
          try {
            if (window.state) {
              if (!window.state.settings) window.state.settings = {};
              return window.state.settings;
            }
          } catch (e) {}
          try {
            return (
              JSON.parse(
                localStorage.getItem("cam_mesaha_ayarlar_v1") || "{}",
              ) || {}
            );
          } catch (e) {
            return {};
          }
        }
        function save() {
          try {
            if (window.__flushSettings)
              return window.__flushSettings("no-cutter-filter");
            if (window.saveSettings) return window.saveSettings();
            localStorage.setItem(
              "cam_mesaha_ayarlar_v1",
              JSON.stringify(settings()),
            );
          } catch (e) {}
        }
        function isNoCutterButton(el) {
          return (
            el &&
            el.getAttribute &&
            clean(el.getAttribute("data-cutter-filter")) === SPECIAL
          );
        }
        function applyNoCutterFilter(ev) {
          var btn =
            ev.target &&
            ev.target.closest &&
            ev.target.closest("[data-cutter-filter]");
          if (!isNoCutterButton(btn)) return;
          try {
            if (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
            }
          } catch (e) {}
          var st = settings();
          st.cutterFilter = SPECIAL;
          save();
          try {
            if (typeof window.invalidateRecordStatsV447 === "function")
              window.invalidateRecordStatsV447();
          } catch (e) {}
          try {
            if (typeof window.renderRecords === "function")
              window.renderRecords();
            else if (typeof window.renderAll === "function") window.renderAll();
          } catch (e) {}
          try {
            window.dispatchEvent(
              new CustomEvent("mesaha:settings-saved", {
                detail: { source: "no-cutter-filter" },
              }),
            );
          } catch (e) {}
          setTimeout(function () {
            try {
              var st2 = settings();
              if (clean(st2.cutterFilter) !== SPECIAL) {
                st2.cutterFilter = SPECIAL;
                save();
              }
              if (typeof window.renderRecords === "function")
                window.renderRecords();
            } catch (e) {}
          }, 80);
        }
        document.addEventListener("click", applyNoCutterFilter, true);
        document.addEventListener("touchend", applyNoCutterFilter, true);
      })();
;
