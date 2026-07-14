/* Mesaha İO V5.83 — iOS/Android kayıt sonrası klavye ve ölçü alanı odak koruması. */
(function () {
  "use strict";
  if (window.__mesahaSaveFocusV583) return;
  window.__mesahaSaveFocusV583 = true;

  var INPUT_IDS = [
    "diameterInput",
    "lengthInput",
    "barcodeInput",
    "quantityInput",
  ];
  var lastInput = null;
  var lastSelection = null;
  var timers = [];
  var restoreToken = 0;

  function isMeasureInput(element) {
    return !!(element && INPUT_IDS.indexOf(element.id) >= 0);
  }

  function entryOpen() {
    var entry = document.getElementById("entryView");
    return !!(
      entry &&
      (entry.classList.contains("active") ||
        (document.body && document.body.classList.contains("entry-open")))
    );
  }

  function saveButtonFrom(target) {
    return target && target.closest
      ? target.closest("#floatingSaveBtnV531,#saveBtn")
      : null;
  }

  function isTouchLike(event) {
    if (!event) return false;
    if (event.type === "touchstart" || event.type === "touchend") return true;
    if (event.pointerType) return event.pointerType !== "mouse";
    try {
      return !!(
        window.matchMedia &&
        window.matchMedia("(hover: none) and (pointer: coarse)").matches
      );
    } catch (_error) {
      return false;
    }
  }

  function remember(input) {
    if (!isMeasureInput(input)) return;
    lastInput = input;
    try {
      lastSelection = {
        start: input.selectionStart,
        end: input.selectionEnd,
        direction: input.selectionDirection || "none",
      };
    } catch (_error) {
      lastSelection = null;
    }
  }

  function targetAfterSave() {
    var diameter = document.getElementById("diameterInput");
    if (diameter && !diameter.disabled && !diameter.readOnly) return diameter;
    if (
      lastInput &&
      document.documentElement.contains(lastInput) &&
      !lastInput.disabled &&
      !lastInput.readOnly
    )
      return lastInput;
    return null;
  }

  function focusElement(element, initialize) {
    if (!element || !entryOpen() || document.hidden) return false;
    try {
      element.focus({ preventScroll: true });
    } catch (_error) {
      try {
        element.focus();
      } catch (_innerError) {
        return false;
      }
    }
    try {
      if (initialize && element.id === "diameterInput") {
        element.setSelectionRange(0, 0);
      } else {
        var end = String(element.value || "").length;
        element.setSelectionRange(end, end);
      }
    } catch (_error) {}
    try {
      if (window.MesahaV537 && window.MesahaV537.syncFloatingSave)
        window.MesahaV537.syncFloatingSave();
    } catch (_error) {}
    return document.activeElement === element;
  }

  function clearTimers() {
    timers.forEach(function (timer) {
      clearTimeout(timer);
    });
    timers = [];
  }

  function restore(reason) {
    if (!entryOpen()) return false;
    clearTimers();
    var token = ++restoreToken;
    var element = targetAfterSave();
    if (!element) return false;

    /* Değer yalnız bir kez temizlenir. Gecikmeli iOS odak denemeleri, kullanıcı
       yazmaya başladıktan sonra yeni çapı silmez veya imleci başa taşımaz. */
    if (element.id === "diameterInput") element.value = "";
    var focusedOnce = false;

    var run = function () {
      if (token !== restoreToken || !entryOpen() || document.hidden) return;
      var active = document.activeElement;
      if (focusedOnce && active === element) return;
      if (focusedOnce && isMeasureInput(active) && active !== element) {
        clearTimers();
        return;
      }
      if (focusElement(element, !focusedOnce)) focusedOnce = true;
    };

    run();
    try {
      requestAnimationFrame(run);
    } catch (_error) {}
    [35, 90, 180, 320, 520].forEach(function (delay) {
      timers.push(setTimeout(run, delay));
    });
    try {
      window.dispatchEvent(
        new CustomEvent("mesaha:save-focus-restored", {
          detail: { reason: reason || "save", inputId: element.id },
        }),
      );
    } catch (_error) {}
    return true;
  }

  function preserveOnSavePress(event) {
    if (!saveButtonFrom(event.target) || !entryOpen()) return;
    var active = document.activeElement;
    if (!isMeasureInput(active)) active = lastInput;
    if (!isMeasureInput(active)) return;
    remember(active);

    /* Masaüstü fare tıklamasını değiştirme. Dokunmatik cihazda düğmenin odağı
       almasını engeller; mevcut pointerup/touchend kayıt işleyicisi çalışır. */
    if (!isTouchLike(event)) return;
    try {
      if (event.cancelable) event.preventDefault();
    } catch (_error) {}
    try {
      if (window.mesahaSound && window.mesahaSound.warm)
        window.mesahaSound.warm(event);
    } catch (_error) {}
  }

  document.addEventListener(
    "focusin",
    function (event) {
      if (isMeasureInput(event.target)) remember(event.target);
    },
    true,
  );
  document.addEventListener(
    "input",
    function (event) {
      if (isMeasureInput(event.target)) remember(event.target);
    },
    true,
  );
  document.addEventListener("pointerdown", preserveOnSavePress, {
    capture: true,
    passive: false,
  });
  document.addEventListener("touchstart", preserveOnSavePress, {
    capture: true,
    passive: false,
  });
  window.addEventListener(
    "mesaha:entry-save-complete",
    function () {
      restore("entry-save-complete");
    },
    { passive: true },
  );
  window.addEventListener(
    "pageshow",
    function () {
      if (entryOpen() && isMeasureInput(document.activeElement))
        remember(document.activeElement);
    },
    { passive: true },
  );
  document.addEventListener(
    "visibilitychange",
    function () {
      if (document.hidden) {
        restoreToken++;
        clearTimers();
      }
    },
    { passive: true },
  );

  window.MesahaSaveFocusV583 = {
    remember: remember,
    restore: restore,
    activeInput: function () {
      return isMeasureInput(document.activeElement)
        ? document.activeElement
        : lastInput;
    },
  };
})();
