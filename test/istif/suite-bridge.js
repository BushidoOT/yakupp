(function () {
  "use strict";
  const read = (k, f) => {
    try {
      const x = JSON.parse(localStorage.getItem(k) || "null");
      return x == null ? f : x;
    } catch {
      return f;
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  };
  const clean = (v) => String(v == null ? "" : v).trim();
  function valid() {
    const s =
        read("mesaha_supabase_v500_session", {}) ||
        read("mesaha_supabase_v569_session_backup", {}),
      a = read("mesaha_google_access_v548", {}),
      t =
        read("mesaha_terminal_local_mode_v556", null) ||
        read("mesaha_terminal_local_mode_v557", {});
    return !!(s.access_token || a.status === "approved" || (t && t.active));
  }
  function css() {
    if (document.getElementById("suiteIstifCssV8")) return;
    const s = document.createElement("style");
    s.id = "suiteIstifCssV8";
    s.textContent = `#bootOverlay,.boot-overlay,[data-action="refresh-shared"],[data-action="connect-drive"],[data-action="disconnect-drive"],[data-action="sync"],.drive-card,.drive-security{display:none!important}.suite-istif-note-v8{margin:10px 0;padding:11px 13px;border-radius:13px;background:#edf7f0;color:#28543d;font:700 12px/1.45 system-ui}`;
    document.head.appendChild(s);
  }
  function syncLocal() {
    const f = read("mesaha_active_seflik_folder_v564", {}),
      p = read("mesaha_panel_user_v316", {}),
      s = read("cam_mesaha_ayarlar_v1", {});
    if (f && f.seflik) {
      p.seflik = f.seflik;
      p.activeSeflik = f.seflik;
      s.seflik = f.seflik;
      write("mesaha_panel_user_v316", p);
      write("cam_mesaha_ayarlar_v1", s);
    }
  }
  function hide() {
    document
      .querySelectorAll(
        '[data-action="refresh-shared"],[data-action="connect-drive"],[data-action="disconnect-drive"],[data-action="sync"],.drive-card,.drive-security',
      )
      .forEach((x) => (x.style.display = "none"));
    document.querySelectorAll("button,a").forEach((el) => {
      const t = clean(el.textContent).toLocaleLowerCase("tr-TR");
      if (
        /şeflik oluştur|şeflik sil|ormancı ekle|ormancı çıkar|bölme oluştur|bölme sil|drive bağla|bağlantıyı kaldır|şeflikleri yenile/.test(
          t,
        )
      )
        el.style.display = "none";
    });
    const settings = document.querySelector(".settings-form,.settings-card");
    if (settings && !document.getElementById("suiteIstifNoteV8")) {
      const n = document.createElement("div");
      n.id = "suiteIstifNoteV8";
      n.className = "suite-istif-note-v8";
      n.textContent =
        "Şeflik, ormancı, bölme, Drive, yedek ve senkronizasyon işlemleri Suite ana menüsünden yönetilir. İstif İO içinde yalnızca Suite’ten gelen seçenekler kullanılır.";
      settings.insertBefore(n, settings.firstChild);
    }
  }
  let timer = 0;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      syncLocal();
      hide();
      window.MesahaSuiteSyncV8 && window.MesahaSuiteSyncV8.updateButton();
    }, 80);
  }
  function block(e) {
    const t =
      e.target.closest &&
      e.target.closest(
        '[data-action="refresh-shared"],[data-action="connect-drive"],[data-action="disconnect-drive"],[data-action="sync"]',
      );
    if (!t) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (t.matches('[data-action="sync"]'))
      window.MesahaSuiteSyncV8 &&
        window.MesahaSuiteSyncV8.syncAll({ source: "istif" });
    else location.href = "../";
  }
  if (!valid()) {
    location.replace("../");
    return;
  }
  window.MESAHA_SUITE_MODE = true;
  document.documentElement.dataset.suiteSubapp = "istif";
  css();
  syncLocal();
  const boot = () => {
    document.body.dataset.suiteSubapp = "istif";
    window.MesahaSuiteSyncV8 &&
      window.MesahaSuiteSyncV8.registerHomeButton(() => {
        location.href = "../";
      });
    schedule();
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  document.addEventListener("click", block, true);
  window.addEventListener("storage", schedule);
  window.addEventListener("mesaha-suite:shared-data-updated", schedule);
  window.addEventListener("mesaha-suite:sync-complete", schedule);
  const mo = new MutationObserver(schedule);
  document.addEventListener(
    "DOMContentLoaded",
    () =>
      mo.observe(document.getElementById("app") || document.body, {
        childList: true,
        subtree: true,
      }),
    { once: true },
  );
  setTimeout(schedule, 350);
  setTimeout(schedule, 1200);
})();
