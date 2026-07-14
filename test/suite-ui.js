(function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    clean = (v) => String(v == null ? "" : v).trim(),
    esc = (v) =>
      clean(v).replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[m],
      );
  let loaded = false,
    items = [];
  function api() {
    return window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8;
  }
  function toast(m, b) {
    window.MesahaSuiteUI && window.MesahaSuiteUI.toast
      ? window.MesahaSuiteUI.toast(m, b)
      : alert(m);
  }
  function inject() {
    if (document.getElementById("backupsModalV8")) return;
    const account = document.getElementById("authSessionBox");
    if (account)
      account.insertAdjacentHTML(
        "afterend",
        `<section class="drive-account-card-v8" id="driveAccountCardV8"><div class="drive-account-head-v8"><span class="choice-icon drive-choice-icon"><svg class="google-drive-logo" viewBox="0 0 64 56" aria-hidden="true"><path fill="#0F9D58" d="M22 2h20l20 34H42z"/><path fill="#F4B400" d="M22 2 2 36l10 18 20-34z"/><path fill="#4285F4" d="M12 54 2 36h40l20 0-10 18z"/></svg></span><div><strong>Kişisel Google Drive</strong><small id="driveAccountTextV8">Bağlantı kontrol edilmedi</small></div></div><div class="drive-account-actions-v8"><button class="secondary-button" id="driveRefreshV8" type="button">Durumu Yenile</button><button class="primary-button" id="driveConnectV8" type="button">Drive Bağla</button><button class="secondary-button" id="driveDisconnectV8" type="button" hidden>Bağlantıyı Kes</button><a class="secondary-button" id="driveOpenV8" target="_blank" rel="noopener" hidden>Drive Aç</a></div><p>Mesaha ve İstif yedekleri yalnızca giriş yapan kullanıcının kendi Drive hesabında tutulur. Yönetim paneli dosyanın içeriğini değil, yalnızca yedek metadatasını görür.</p></section>`,
      );
    document.body.insertAdjacentHTML(
      "beforeend",
      `<section class="modal backups-modal-v8" id="backupsModalV8" hidden><div class="modal-head"><div><span class="modal-kicker">KİŞİSEL DRIVE</span><h3>Yedekler</h3></div><button class="modal-close" data-close-backups-v8 type="button">×</button></div><div class="backup-toolbar-v8"><button class="primary-button" id="backupNowV8" type="button">Şimdi Yedekle</button><button class="secondary-button" id="backupRefreshV8" type="button">Listeyi Yenile</button></div><div class="modal-note">Suite yedeği; Mesaha kayıtlarını, İstif kayıtlarını, şeflik ve offline bölme bilgilerini birlikte saklar.</div><div id="backupListV8" class="backup-list-v8"><div class="modal-note">Yedekler yükleniyor…</div></div></section>`,
    );
    bind();
    handleCallback();
    refreshDrive(true).catch(() => {});
    handleDriveOpenRequest();
  }
  function bind() {
    $("driveRefreshV8")?.addEventListener("click", () => refreshDrive(false));
    $("driveConnectV8")?.addEventListener("click", () =>
      api()
        .driveConnect()
        .catch((e) => toast(e.message, true)),
    );
    $("driveDisconnectV8")?.addEventListener("click", async () => {
      if (
        !confirm(
          "Bu cihazdaki kişisel Drive bağlantısı kaldırılsın mı? Drive dosyaları silinmez.",
        )
      )
        return;
      try {
        await api().driveDisconnect();
        await refreshDrive(true);
        toast("Drive bağlantısı kaldırıldı.");
      } catch (e) {
        toast(e.message, true);
      }
    });
    $("backupNowV8")?.addEventListener("click", create);
    $("backupRefreshV8")?.addEventListener("click", load);
    document.addEventListener(
      "click",
      (e) => {
        const t = e.target.closest("[data-close-backups-v8]");
        if (t) close();
        const del = e.target.closest("[data-backup-delete-v8]");
        if (del) remove(del.dataset.backupDeleteV8);
        const restore = e.target.closest("[data-backup-restore-v8]");
        if (restore) restoreBackup(restore.dataset.backupRestoreV8);
      },
      true,
    );
  }
  async function refreshDrive(silent) {
    const text = $("driveAccountTextV8"),
      connect = $("driveConnectV8"),
      disc = $("driveDisconnectV8"),
      open = $("driveOpenV8");
    if (!api()) return;
    try {
      if (text) text.textContent = "Drive bağlantısı kontrol ediliyor…";
      const s = await api().driveStatus();
      if (s.googleRequired) {
        text.textContent = "Drive için Google ile giriş yapın";
        connect.hidden = false;
        disc.hidden = true;
        open.hidden = true;
        return s;
      }
      if (s.connected) {
        text.textContent = `Bağlı • ${clean(s.ownerEmail || s.email || "Google Drive")}`;
        connect.hidden = true;
        disc.hidden = false;
        if (s.folderUrl) {
          open.href = s.folderUrl;
          open.hidden = false;
        } else open.hidden = true;
      } else {
        text.textContent = "Kişisel Drive bağlı değil";
        connect.hidden = false;
        disc.hidden = true;
        open.hidden = true;
      }
      return s;
    } catch (e) {
      if (text) text.textContent = "Drive durumu alınamadı";
      if (!silent) toast(e.message, true);
      throw e;
    }
  }
  function openDriveAccountCard() {
    if (window.MesahaSuiteUI && typeof window.MesahaSuiteUI.openLogin === "function")
      window.MesahaSuiteUI.openLogin();
    setTimeout(() => {
      const card = $("driveAccountCardV8");
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
      const connect = $("driveConnectV8");
      if (connect && !connect.hidden) connect.focus({ preventScroll: true });
    }, 160);
  }
  function handleDriveOpenRequest() {
    const q = new URLSearchParams(location.search);
    let requested = q.get("open") === "drive";
    try {
      requested = requested || (localStorage.getItem("mesaha_suite_open_drive_v14") === "1" || localStorage.getItem("mesaha_suite_open_drive_v13") === "1");
      localStorage.removeItem("mesaha_suite_open_drive_v14");
      localStorage.removeItem("mesaha_suite_open_drive_v13");
    } catch {}
    if (!requested) return;
    q.delete("open");
    history.replaceState({}, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash);
    openDriveAccountCard();
    refreshDrive(true).catch(() => {});
  }
  async function handleCallback() {
    const q = new URLSearchParams(location.search),
      code = q.get("code"),
      state = q.get("state");
    if (!code || !state || !api()) return;
    try {
      toast("Google Drive bağlantısı tamamlanıyor…");
      await api().driveFinish(code, state);
      q.delete("code");
      q.delete("state");
      q.delete("scope");
      q.delete("authuser");
      q.delete("prompt");
      history.replaceState(
        {},
        "",
        location.pathname + (q.toString() ? "?" + q : "") + location.hash,
      );
      await refreshDrive(true);
      toast("Kişisel Drive hesabı bağlandı.");
    } catch (e) {
      toast("Drive bağlantısı tamamlanamadı: " + e.message, true);
    }
  }
  function open() {
    if (!api()) return;
    const m = $("backupsModalV8"),
      b = $("modalBackdrop");
    if (b) {
      b.hidden = false;
      b.removeAttribute("hidden");
    }
    if (m) {
      m.hidden = false;
      m.removeAttribute("hidden");
    }
    document.body.classList.add("modal-open");
    load();
  }
  function close() {
    const m = $("backupsModalV8");
    if (m) {
      m.hidden = true;
      m.setAttribute("hidden", "");
    }
    const b = $("modalBackdrop");
    if (b) {
      b.hidden = true;
      b.setAttribute("hidden", "");
    }
    document.body.classList.remove("modal-open");
  }
  async function load() {
    const box = $("backupListV8");
    if (!box) return;
    box.innerHTML = '<div class="modal-note">Yedekler yükleniyor…</div>';
    try {
      const out = await api().listBackups();
      items = Array.isArray(out.items)
        ? out.items
        : Array.isArray(out.backups)
          ? out.backups
          : [];
      render();
    } catch (e) {
      box.innerHTML = `<div class="modal-note bad">${esc(e.message)}</div>`;
    }
  }
  function render() {
    const box = $("backupListV8");
    if (!box) return;
    if (!items.length) {
      box.innerHTML =
        '<div class="modal-note">Bu Google Drive hesabında henüz Suite yedeği yok.</div>';
      return;
    }
    box.innerHTML = items
      .map((x) => {
        const id = clean(x.id || x.backup_id),
          date = new Date(
            x.created_at || x.createdAt || Date.now(),
          ).toLocaleString("tr-TR"),
          link = clean(x.web_view_link || x.webViewLink || x.driveLink);
        return `<article class="backup-row-v8"><div><strong>${esc(x.file_name || x.fileName || "Mesaha Suite yedeği")}</strong><small>${esc(date)} • ${Number(x.record_count || x.recordCount || 0).toLocaleString("tr-TR")} kayıt • ${Number(x.total_volume || x.totalVolume || 0).toLocaleString("tr-TR", { maximumFractionDigits: 3 })} m³</small><span>${esc(x.app_id || x.appId || "suite")} • ${esc(x.seflik || "")}</span></div><div class="backup-row-actions-v8">${link ? `<a class="secondary-button" href="${esc(link)}" target="_blank" rel="noopener">Drive</a>` : ""}<button class="secondary-button" data-backup-restore-v8="${esc(id)}" type="button">Geri Yükle</button><button class="danger-button-v8" data-backup-delete-v8="${esc(id)}" type="button">Sil</button></div></article>`;
      })
      .join("");
  }
  async function create() {
    const b = $("backupNowV8");
    if (b) b.disabled = true;
    try {
      await api().createSuiteBackup();
      toast("Suite yedeği kişisel Drive hesabına kaydedildi.");
      await load();
    } catch (e) {
      if (e && (e.code === "DRIVE_NOT_CONNECTED" || e.code === "GOOGLE_REQUIRED")) {
        api().openDriveSetup && api().openDriveSetup();
      } else toast(e.message, true);
    } finally {
      if (b) b.disabled = false;
    }
  }
  async function remove(id) {
    if (
      !confirm("Bu yedek kişisel Drive hesabınızdan kalıcı olarak silinsin mi?")
    )
      return;
    try {
      await api().deleteBackup(id);
      toast("Yedek silindi.");
      await load();
    } catch (e) {
      toast(e.message, true);
    }
  }
  function openDb() {
    return new Promise((res, rej) => {
      const q = indexedDB.open("mesaha-istif-prototype", 1);
      q.onupgradeneeded = () => {
        const db = q.result;
        if (!db.objectStoreNames.contains("records"))
          db.createObjectStore("records", { keyPath: "id" });
        if (!db.objectStoreNames.contains("settings"))
          db.createObjectStore("settings", { keyPath: "key" });
      };
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
  }
  async function putIstif(records) {
    if (!Array.isArray(records) || !records.length) return;
    const db = await openDb();
    await new Promise((res, rej) => {
      if (!db.objectStoreNames.contains("records")) {
        db.close();
        return res();
      }
      const tx = db.transaction("records", "readwrite"),
        st = tx.objectStore("records");
      records.forEach((r) => st.put(r));
      tx.oncomplete = () => {
        db.close();
        res();
      };
      tx.onerror = () => {
        db.close();
        rej(tx.error);
      };
    });
  }
  async function restoreBackup(id) {
    if (
      !confirm(
        "Bu yedek mevcut yerel verilerle birleştirilsin mi? Aynı kimlikteki kayıtlar yedekteki sürümle güncellenir.",
      )
    )
      return;
    try {
      const out = await api().readBackup(id),
        p = out.payload || out.data || {};
      const old = (() => {
        try {
          return JSON.parse(
            localStorage.getItem("cam_mesaha_kayitlari_v1") || "[]",
          );
        } catch {
          return [];
        }
      })();
      const map = new Map(
        (Array.isArray(old) ? old : []).map((r) => [
          String(r.id || r.barcode),
          r,
        ]),
      );
      (p.mesahaRecords || p.records || []).forEach((r) =>
        map.set(String(r.id || r.barcode), r),
      );
      localStorage.setItem(
        "cam_mesaha_kayitlari_v1",
        JSON.stringify([...map.values()]),
      );
      if (p.suite) {
        if (p.suite.folders)
          localStorage.setItem(
            "mesaha_suite_folder_cache_v4",
            JSON.stringify(p.suite.folders),
          );
        if (p.suite.divisions)
          localStorage.setItem(
            "mesaha_suite_divisions_v4",
            JSON.stringify(p.suite.divisions),
          );
        if (p.suite.divisionReady)
          localStorage.setItem(
            "mesaha_suite_division_ready_v4",
            JSON.stringify(p.suite.divisionReady),
          );
        if (p.suite.yieldTargets)
          localStorage.setItem(
            "mesaha_suite_yield_targets_v12",
            JSON.stringify(p.suite.yieldTargets),
          );
      }
      await putIstif(p.istifRecords || []);
      api().markDirty("mesaha", { restore: true });
      api().markDirty("istif", { restore: true });
      toast(
        "Yedek yerel verilere birleştirildi. Senkronize Et ile sunucuya gönderebilirsiniz.",
      );
      close();
      setTimeout(() => location.reload(), 500);
    } catch (e) {
      toast("Yedek geri yüklenemedi: " + e.message, true);
    }
  }
  window.MesahaSuiteBackupsV14 = window.MesahaSuiteBackupsV13 = window.MesahaSuiteBackupsV12 = window.MesahaSuiteBackupsV11 = window.MesahaSuiteBackupsV10 = window.MesahaSuiteBackupsV9 = window.MesahaSuiteBackupsV8 = { open, close, load, refreshDrive };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", inject, { once: true });
  else inject();
})();
