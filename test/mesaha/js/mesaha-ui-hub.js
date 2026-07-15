"use strict";

/*
 * Aynı panelin class değişimini izleyen eski yamaları tek MutationObserver
 * altında toplar. Her abone yalnızca bir kez kaydolur; değişiklikler aynı
 * animation frame içinde gruplanır.
 */
(function installMesahaUiHub(root) {
  if (!root || root.MesahaUiHub) return;
  const classWatches = new Map();
  const scheduleFrame = typeof root.requestAnimationFrame === "function"
    ? root.requestAnimationFrame.bind(root)
    : function (callback) { return root.setTimeout(callback, 16); };

  function elementFor(idOrElement) {
    return typeof idOrElement === "string"
      ? document.getElementById(idOrElement)
      : idOrElement;
  }

  function watchClass(idOrElement, callback) {
    if (typeof callback !== "function") return function () {};
    const id = typeof idOrElement === "string" ? idOrElement : idOrElement?.id;
    const bind = function () {
      const element = elementFor(idOrElement);
      if (!element) return false;
      const key = id || element;
      let entry = classWatches.get(key);
      if (!entry) {
        entry = { element, callbacks: new Set(), queued: false, observer: null };
        entry.observer = new MutationObserver(function () {
          if (entry.queued) return;
          entry.queued = true;
          scheduleFrame(function () {
            entry.queued = false;
            entry.callbacks.forEach(function (fn) {
              try {
                fn(element);
              } catch (error) {
                try {
                  root.MesahaErrorLog?.error("ui-hub.class-watch", error);
                } catch (_) {}
              }
            });
          });
        });
        entry.observer.observe(element, {
          attributes: true,
          attributeFilter: ["class", "aria-hidden"],
        });
        classWatches.set(key, entry);
      }
      entry.callbacks.add(callback);
      return true;
    };

    if (!bind() && document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bind, { once: true });
    }

    return function unsubscribe() {
      const key = id || elementFor(idOrElement);
      const entry = classWatches.get(key);
      if (!entry) return;
      entry.callbacks.delete(callback);
      if (!entry.callbacks.size) {
        entry.observer.disconnect();
        classWatches.delete(key);
      }
    };
  }

  root.MesahaUiHub = Object.freeze({ watchClass });
})(typeof window !== "undefined" ? window : null);
