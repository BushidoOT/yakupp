/* source: mesaha-v453-offline-entry-guard */
(function () {
        "use strict";
        if (window.__mesahaV543OfflineBootGuard) return;
        window.__mesahaV543OfflineBootGuard = true;
        function boot() {
          try {
            document.documentElement.setAttribute(
              "data-mesaha-offline-entry-guard",
              "543",
            );
            var s = document.getElementById("startup");
            setTimeout(function () {
              if (s) s.classList.add("hide");
            }, 2600);
          } catch (e) {}
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        window.addEventListener("pageshow", boot, { passive: true });
      })();
;
