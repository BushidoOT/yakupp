"use strict";

/* Senkronizasyon sağlığı ve canlı sistem telemetrisi */
(function () {
  const VERSION = String(window.MESAHA_RELEASE?.version || "stable");
  const TOOL_ID = "suiteHealthTool";
  const MODAL_ID = "suiteHealthModal";
  const DEVICE_KEY = "mesaha_suite_health_device";
  const LEGACY_DEVICE_KEY = "mesaha_suite_health_device_v31";
  const LAST_PING_KEY = "mesaha_suite_health_last_ping";
  const LEGACY_LAST_PING_KEY = "mesaha_suite_health_last_ping_v31";
  const PING_INTERVAL = 10 * 60 * 1000;
  const K = {
    dirty: "mesaha_suite_dirty_v8",
    pending: "mesaha_suite_pending_ops_v4",
    last: "mesaha_suite_last_full_sync_v8",
    drive: "mesaha_suite_drive_status_v8",
    mesahaRecords: "cam_mesaha_kayitlari_v1",
    active: "mesaha_active_seflik_folder_v564",
    panel: "mesaha_panel_user_v316",
    terminal: "mesaha_terminal_local_mode_v556",
    terminalOld: "mesaha_terminal_local_mode_v557",
  };

  const clean = (value) => String(value == null ? "" : value).trim();
  const esc = (value) => clean(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  };

  function api() {
    return window.MesahaSuiteSync || window.MesahaSuiteSyncV28 || window.MesahaSuiteSyncV27 || window.MesahaSuiteSyncV26 || window.MesahaSuiteSyncV22 || null;
  }

  function toast(message, bad) {
    if (window.MesahaSuiteUI && typeof window.MesahaSuiteUI.toast === "function") {
      window.MesahaSuiteUI.toast(message, bad);
      return;
    }
    alert(message);
  }

  function deviceId() {
    let id = clean(localStorage.getItem(DEVICE_KEY) || localStorage.getItem(LEGACY_DEVICE_KEY));
    if (id) return id;
    try {
      id = crypto.randomUUID();
    } catch (_) {
      id = "health_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    }
    try { localStorage.setItem(DEVICE_KEY, id); } catch (_) {}
    return id;
  }

  function platformInfo() {
    const ua = navigator.userAgent || "";
    const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);
    const standalone = !!(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    let browser = "Tarayıcı";
    if (/EdgA|EdgiOS|Edg\//i.test(ua)) browser = "Edge";
    else if (/CriOS/i.test(ua)) browser = "Chrome iOS";
    else if (/Chrome/i.test(ua)) browser = "Chrome";
    else if (/FxiOS/i.test(ua)) browser = "Firefox iOS";
    else if (/Safari/i.test(ua)) browser = "Safari";
    return {
      deviceId: deviceId(),
      platform: ios ? "iOS" : android ? "Android" : clean(navigator.platform || "Web"),
      os: ios ? "iOS" : android ? "Android" : clean(navigator.platform || "Web"),
      browser,
      standalone,
      userAgent: ua.slice(0, 500),
      appId: "suite",
      appName: "Orman İO",
      appVersion: window.MesahaRelease?.telemetry("suite") || "Orman İO",
      suiteVersion: String(window.MESAHA_RELEASE?.version || "stable"),
    };
  }

  function formatDate(value) {
    const text = clean(value);
    if (!text) return "Henüz yok";
    try {
      return new Date(text).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
    } catch (_) {
      return text;
    }
  }

  function formatBytes(value) {
    const bytes = Number(value || 0);
    if (!Number.isFinite(bytes) || bytes < 0) return "—";
    if (bytes < 1024) return Math.round(bytes) + " B";
    const units = ["KB", "MB", "GB", "TB"];
    let size = bytes / 1024;
    let unit = units[0];
    for (let i = 1; i < units.length && size >= 1024; i += 1) {
      size /= 1024;
      unit = units[i];
    }
    return size.toLocaleString("tr-TR", { maximumFractionDigits: size >= 100 ? 0 : size >= 10 ? 1 : 2 }) + " " + unit;
  }

  function manualMesahaDirty(item) {
    const meta = item && item.meta && typeof item.meta === "object" ? item.meta : {};
    return !!(item && item.dirty && (
      meta.resubmit === true ||
      meta.manual === true ||
      meta.manualSend === true ||
      meta.sefligeGonder === true ||
      meta.source === "manual" ||
      meta.source === "seflige-gonder" ||
      (meta.drive === true && meta.merge === true)
    ));
  }

  function openIstifDb() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) return resolve(null);
      const req = indexedDB.open("mesaha-istif-prototype", 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("records")) db.createObjectStore("records", { keyPath: "id" });
        if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "key" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("İstif veritabanı açılamadı"));
    });
  }

  async function istifRows() {
    try {
      const db = await openIstifDb();
      if (!db) return [];
      return await new Promise((resolve) => {
        if (!db.objectStoreNames.contains("records")) {
          db.close();
          return resolve([]);
        }
        const request = db.transaction("records", "readonly").objectStore("records").getAll();
        request.onsuccess = () => {
          const rows = Array.isArray(request.result) ? request.result : [];
          try { db.close(); } catch (_) {}
          resolve(rows);
        };
        request.onerror = () => {
          try { db.close(); } catch (_) {}
          resolve([]);
        };
      });
    } catch (_) {
      return [];
    }
  }

  function summarizeIstif(rows) {
    const real = (Array.isArray(rows) ? rows : []).filter((row) => row && !row.isDemo);
    let pendingRecords = 0;
    let failedRecords = 0;
    let pendingPhotos = 0;
    let failedPhotos = 0;
    let uploadingPhotos = 0;
    let uploadedPhotos = 0;
    const errors = [];
    real.forEach((row) => {
      const status = clean(row.syncStatus || "local");
      if (status !== "synced") pendingRecords += 1;
      if (["upload_failed", "sync_failed"].includes(status) || clean(row.syncError)) failedRecords += 1;
      if (clean(row.syncError)) errors.push({ id: clean(row.id), istifNo: clean(row.istifNo), message: clean(row.syncError), code: clean(row.syncErrorCode), retryable: row.syncRetryable === true });
      const files = Array.isArray(row.driveFiles) ? row.driveFiles : [];
      const states = Array.isArray(row.photoUploadStates) ? row.photoUploadStates : [];
      const total = Math.max(Number(row.photoCount || 0), Array.isArray(row.photos) ? row.photos.length : 0, files.length, states.length);
      for (let index = 0; index < total; index += 1) {
        const state = files[index] ? "uploaded" : clean(states[index] && states[index].status || "pending");
        if (state === "uploaded") uploadedPhotos += 1;
        else if (state === "failed") failedPhotos += 1;
        else if (state === "uploading") uploadingPhotos += 1;
        else pendingPhotos += 1;
      }
    });
    return {
      totalRecords: real.length,
      pendingRecords,
      failedRecords,
      pendingPhotos,
      failedPhotos,
      uploadingPhotos,
      uploadedPhotos,
      errors: errors.slice(0, 20),
    };
  }

  async function collectHealth() {
    const dirty = read(K.dirty, {});
    const pendingOps = read(K.pending, []);
    const last = read(K.last, {});
    const drive = read(K.drive, {});
    const mesahaRecords = read(K.mesahaRecords, []);
    const active = read(K.active, {});
    const panel = read(K.panel, {});
    const terminal = read(K.terminal, null) || read(K.terminalOld, null) || {};
    const istif = summarizeIstif(await istifRows());
    const manualPending = manualMesahaDirty(dirty && dirty.mesaha);
    const suitePending = Array.isArray(pendingOps) ? pendingOps.length : 0;
    const driveQuota = drive && drive.quota && typeof drive.quota === "object" ? drive.quota : null;
    const lastError = clean(last && last.error) || clean(last && last.istif && last.istif.error) || clean(last && last.mesaha && last.mesaha.error);
    const issueCount = suitePending + (manualPending ? 1 : 0) + istif.pendingRecords + istif.failedPhotos + (lastError ? 1 : 0);
    const level = !navigator.onLine ? "offline" : (istif.failedPhotos || istif.failedRecords || lastError ? "error" : issueCount ? "warning" : "healthy");
    const identity = api() && typeof api().identity === "function" ? api().identity() : {};
    return {
      generatedAt: new Date().toISOString(),
      level,
      online: navigator.onLine !== false,
      identity: {
        userId: clean(identity.userId || terminal.pairedUserId),
        name: clean(identity.name || panel.googleFullName || panel.name || terminal.name),
        email: clean(identity.email || panel.googleEmail || terminal.pairedEmail),
        seflik: clean(identity.seflik || active.seflik || panel.activeSeflik || panel.seflik || terminal.seflik),
        seflikKey: clean(identity.seflikKey || active.seflik_key || active.seflikKey),
        authType: terminal && terminal.source === "pair_code" ? "terminal" : identity.google ? "google" : terminal && terminal.active ? "guest" : "none",
      },
      device: platformInfo(),
      mesaha: {
        localRecords: Array.isArray(mesahaRecords) ? mesahaRecords.length : 0,
        manualPending,
        mode: "manual-send-only",
      },
      suite: {
        pendingOperations: suitePending,
        dirtyApps: Object.keys(dirty || {}).filter((key) => dirty[key] && dirty[key].dirty),
      },
      istif,
      lastSync: {
        at: clean(last && (last.at || last.updatedAt)),
        ok: !lastError,
        error: lastError,
        data: last && typeof last === "object" ? last : {},
      },
      drive: {
        connected: drive && drive.connected === true,
        ownerName: clean(drive && drive.ownerName),
        ownerEmail: clean(drive && drive.ownerEmail),
        isOwner: drive && drive.isOwner !== false,
        quota: driveQuota,
        quotaError: clean(drive && drive.quotaError),
        updatedAt: clean(drive && drive.updatedAt),
      },
      issueCount,
    };
  }


  function dashboardTime(value) {
    const text = clean(value);
    if (!text) return "Henüz yok";
    try { return new Date(text).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }); }
    catch (_) { return text; }
  }

  function renderDashboard(health) {
    const ring = document.getElementById("suiteHealthScoreRing");
    const issues = Math.max(0, Number(health.issueCount || 0));
    const score = health.level === "offline" ? 35 : health.level === "error" ? Math.max(45, 72 - issues * 4) : health.level === "warning" ? Math.max(70, 94 - issues * 3) : 100;
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    if (ring) {
      ring.style.setProperty("--health-score", String(score));
      setText("suiteHealthScore", score + "%");
      setText("healthPendingRecords", String(Number(health.istif.pendingRecords || 0) + (health.mesaha.manualPending ? 1 : 0)));
      setText("healthPendingPhotos", String(Number(health.istif.pendingPhotos || 0) + Number(health.istif.uploadingPhotos || 0) + Number(health.istif.failedPhotos || 0)));
      setText("healthSuiteOps", String(Number(health.suite.pendingOperations || 0)));
      setText("healthLastSync", dashboardTime(health.lastSync.at));
      setText("healthLastError", health.lastSync.error || health.istif.failedPhotos || health.istif.failedRecords ? (health.lastSync.error || "İstif/fotoğraf hatası") : "Hata yok");
    }

    const system = document.getElementById("heroSystemStatus");
    if (system) {
      system.classList.toggle("warn", health.level === "warning" || health.level === "offline");
      system.classList.toggle("bad", health.level === "error");
      system.lastChild.textContent = health.level === "healthy" ? "Sistem sağlıklı" : health.level === "offline" ? "Cihaz çevrimdışı" : health.level === "error" ? "Hata kontrolü gerekli" : "Bekleyen işlem var";
    }
    const server = document.getElementById("heroServerStatus");
    if (server) {
      server.classList.toggle("warn", !health.online);
      server.lastChild.textContent = health.online ? "Sunucu online" : "Sunucu çevrimdışı";
    }
    const backup = document.getElementById("heroBackupStatus");
    if (backup) {
      backup.classList.toggle("warn", !health.drive.connected || !!health.drive.quotaError);
      backup.lastChild.textContent = health.drive.connected ? "Yedek aktif" : "Drive bağlı değil";
    }

    const quota = health.drive.quota;
    setText("dashboardDriveName", health.drive.ownerName || health.drive.ownerEmail || "Google Drive");
    setText("dashboardDriveConnection", health.drive.connected ? "Bağlandı" : (health.online ? "Drive bağlantısı bulunamadı" : "Çevrimdışı"));
    const bar = document.getElementById("dashboardDriveBar");
    if (quota) {
      const percent = quota.percent == null ? 0 : Math.max(0, Math.min(100, Number(quota.percent) || 0));
      const usageText = quota.limitBytes == null ? formatBytes(quota.usageBytes) + " kullanılıyor" : formatBytes(quota.usageBytes) + " / " + formatBytes(quota.limitBytes);
      setText("dashboardDriveUsage", usageText);
      if (bar) bar.style.width = percent + "%";
    } else {
      setText("dashboardDriveUsage", health.drive.quotaError || "Alan bilgisi bekleniyor");
      if (bar) bar.style.width = "16%";
    }

    const activity = document.getElementById("suiteActivityDashboard");
    if (activity) {
      const photoPending = Number(health.istif.pendingPhotos || 0) + Number(health.istif.uploadingPhotos || 0) + Number(health.istif.failedPhotos || 0);
      activity.innerHTML = `
        <div class="activity-row"><span class="activity-icon">↻</span><div><strong>${health.lastSync.at ? "Son senkronizasyon tamamlandı" : "Henüz tam senkronizasyon yok"}</strong><small>${health.lastSync.error ? esc(health.lastSync.error) : "Şeflik ve cihaz durumu güncel"}</small></div><time>${esc(dashboardTime(health.lastSync.at))}</time></div>
        <div class="activity-row"><span class="activity-icon">▧</span><div><strong>${photoPending ? photoPending + " fotoğraf bekliyor" : "Fotoğraf kuyruğu temiz"}</strong><small>${health.istif.failedPhotos ? health.istif.failedPhotos + " başarısız fotoğraf yeniden denenebilir" : "İstif fotoğraflarında hata yok"}</small></div><time>${photoPending ? "Bekliyor" : "Hazır"}</time></div>
        <div class="activity-row"><span class="activity-icon">☁</span><div><strong>${health.drive.connected ? "Drive bağlantısı aktif" : "Drive bağlantısı gerekli"}</strong><small>${esc(health.drive.ownerEmail || health.drive.ownerName || "Şeflik kurucu hesabı")}</small></div><time>${esc(dashboardTime(health.drive.updatedAt))}</time></div>`;
    }
  }

  function installStyle() {
    if (document.getElementById("suiteHealthCss")) return;
    const style = document.createElement("style");
    style.id = "suiteHealthCss";
    style.textContent = `
      #${TOOL_ID}.suite-health-tool svg{stroke:#17623b!important}
      #${MODAL_ID}{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:end center;padding:12px;background:rgba(15,39,28,.42);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      #${MODAL_ID}[hidden]{display:none!important}
      #${MODAL_ID} .suite-health-sheet{width:min(780px,100%);max-height:min(92dvh,860px);overflow:auto;background:#f7faf8;border:1px solid rgba(255,255,255,.85);border-radius:28px 28px 20px 20px;box-shadow:0 28px 90px rgba(10,44,29,.28);padding:18px;padding-bottom:calc(18px + env(safe-area-inset-bottom,0px))}
      #${MODAL_ID} .suite-health-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;position:sticky;top:-18px;z-index:3;margin:-18px -18px 14px;padding:18px;background:rgba(247,250,248,.96);border-bottom:1px solid #dce9e1;backdrop-filter:blur(12px)}
      #${MODAL_ID} .suite-health-head small{display:block;color:#54806b;font:850 10px/1.2 system-ui;letter-spacing:.12em}
      #${MODAL_ID} .suite-health-head h2{margin:4px 0 0;color:#153b2b;font:900 24px/1.1 system-ui}
      #${MODAL_ID} .suite-health-close{width:42px;height:42px;border:0;border-radius:14px;background:#e9f1ec;color:#244f3b;font:900 25px/1 system-ui;touch-action:manipulation}
      #${MODAL_ID} .suite-health-hero{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:13px;padding:15px;border:1px solid #dce9e1;border-radius:19px;background:#fff;box-shadow:0 10px 28px rgba(20,68,44,.06)}
      #${MODAL_ID} .suite-health-dot{width:47px;height:47px;border-radius:16px;display:grid;place-items:center;background:#e6f5ec;color:#17623b;font:900 24px/1 system-ui}
      #${MODAL_ID} .suite-health-hero.warning .suite-health-dot{background:#fff3d4;color:#8a5a00}
      #${MODAL_ID} .suite-health-hero.error .suite-health-dot{background:#fee9e9;color:#a82626}
      #${MODAL_ID} .suite-health-hero.offline .suite-health-dot{background:#edf0f2;color:#56636d}
      #${MODAL_ID} .suite-health-hero h3{margin:0;color:#163d2c;font:900 17px/1.2 system-ui}
      #${MODAL_ID} .suite-health-hero p{margin:4px 0 0;color:#617269;font:650 12px/1.45 system-ui}
      #${MODAL_ID} .suite-health-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:11px}
      #${MODAL_ID} .suite-health-card{border:1px solid #dce9e1;border-radius:18px;background:#fff;padding:13px;min-width:0}
      #${MODAL_ID} .suite-health-card>small{display:block;color:#668075;font:800 10px/1.2 system-ui;text-transform:uppercase;letter-spacing:.05em}
      #${MODAL_ID} .suite-health-card>strong{display:block;margin-top:6px;color:#173d2d;font:900 22px/1.1 system-ui}
      #${MODAL_ID} .suite-health-card>span{display:block;margin-top:5px;color:#66786f;font:650 11px/1.4 system-ui}
      #${MODAL_ID} .suite-health-section{margin-top:12px;border:1px solid #dce9e1;border-radius:19px;background:#fff;padding:14px}
      #${MODAL_ID} .suite-health-section h3{margin:0 0 10px;color:#173d2d;font:900 15px/1.2 system-ui}
      #${MODAL_ID} .suite-health-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #edf3ef;color:#536b60;font:700 12px/1.35 system-ui}
      #${MODAL_ID} .suite-health-row:last-child{border-bottom:0}
      #${MODAL_ID} .suite-health-row b{color:#173d2d;text-align:right;word-break:break-word}
      #${MODAL_ID} .suite-health-error{margin-top:8px;padding:10px;border-radius:13px;background:#fff1f1;color:#8e2828;font:700 11px/1.45 system-ui}
      #${MODAL_ID} .suite-health-note{margin-top:12px;padding:11px 13px;border-radius:15px;background:#edf7f1;color:#2f5e47;font:700 11px/1.45 system-ui}
      #${MODAL_ID} .suite-health-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:13px}
      #${MODAL_ID} .suite-health-actions button{min-height:48px;border:1px solid #cfe0d6;border-radius:14px;background:#fff;color:#214d38;font:900 13px/1.2 system-ui;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      #${MODAL_ID} .suite-health-actions button.primary{background:#17623b;border-color:#17623b;color:#fff}
      #${MODAL_ID} .suite-health-actions button[disabled]{opacity:.55}
      @media(max-width:520px){#${MODAL_ID}{padding:0;place-items:end stretch}#${MODAL_ID} .suite-health-sheet{width:100%;max-height:94dvh;border-radius:25px 25px 0 0;padding:15px;padding-bottom:calc(15px + env(safe-area-inset-bottom,0px))}#${MODAL_ID} .suite-health-head{top:-15px;margin:-15px -15px 12px;padding:15px}#${MODAL_ID} .suite-health-grid{grid-template-columns:1fr 1fr}#${MODAL_ID} .suite-health-card{padding:11px}#${MODAL_ID} .suite-health-card>strong{font-size:19px}}
      @media(max-width:360px){#${MODAL_ID} .suite-health-grid,#${MODAL_ID} .suite-health-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;
    modal = document.createElement("section");
    modal.id = MODAL_ID;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = '<div class="suite-health-sheet" role="dialog" aria-modal="true" aria-labelledby="suiteHealthTitle"><div class="suite-health-head"><div><small>SENKRONİZASYON SAĞLIĞI</small><h2 id="suiteHealthTitle">Sistem Durumu</h2></div><button type="button" class="suite-health-close" data-health-close aria-label="Kapat">×</button></div><div id="suiteHealthContent"><div class="suite-health-note">Durum kontrol ediliyor…</div></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest("[data-health-close]")) closeModal();
    });
    return modal;
  }

  function renderHealth(health) {
    const content = document.getElementById("suiteHealthContent");
    if (!content) return;
    const levelTexts = {
      healthy: ["Sistem sağlıklı", "Bekleyen veya hatalı işlem bulunmuyor."],
      warning: ["Bekleyen işlemler var", "Bağlantı kurulduğunda gönderilebilecek kayıtlar bulunuyor."],
      error: ["Müdahale gereken hata var", "Başarısız İstif veya fotoğraf yüklemelerini kontrol edin."],
      offline: ["Cihaz çevrimdışı", "Yerel kayıtlar kullanılabilir; sunucu kontrolü bağlantı gelince yapılır."],
    };
    const label = levelTexts[health.level] || levelTexts.warning;
    const quota = health.drive.quota;
    const driveText = !health.drive.connected
      ? "Bağlı değil"
      : quota
        ? (quota.remainingBytes == null ? "Ortak / sınırsız" : formatBytes(quota.remainingBytes) + " boş")
        : "Alan bilgisi bekleniyor";
    const errors = health.istif.errors || [];
    content.innerHTML = `
      <section class="suite-health-hero ${esc(health.level)}">
        <div class="suite-health-dot">${health.level === "healthy" ? "✓" : health.level === "warning" ? "!" : health.level === "error" ? "×" : "⌁"}</div>
        <div><h3>${esc(label[0])}</h3><p>${esc(label[1])}</p></div>
      </section>
      <div class="suite-health-grid">
        <article class="suite-health-card"><small>Mesaha İO</small><strong>${Number(health.mesaha.localRecords || 0).toLocaleString("tr-TR")}</strong><span>${health.mesaha.manualPending ? "Şefliğe gönderim bekliyor" : "Yerel kayıt • otomatik gönderilmez"}</span></article>
        <article class="suite-health-card"><small>İstif bekleyen</small><strong>${Number(health.istif.pendingRecords || 0).toLocaleString("tr-TR")}</strong><span>${health.istif.failedRecords ? health.istif.failedRecords + " hatalı kayıt" : "Kayıt kuyruğu"}</span></article>
        <article class="suite-health-card"><small>Fotoğraf hatası</small><strong>${Number(health.istif.failedPhotos || 0).toLocaleString("tr-TR")}</strong><span>${health.istif.pendingPhotos + health.istif.uploadingPhotos} fotoğraf cihazda/bekliyor</span></article>
        <article class="suite-health-card"><small>Orman İO işlemleri</small><strong>${Number(health.suite.pendingOperations || 0).toLocaleString("tr-TR")}</strong><span>Şeflik, kullanıcı ve bölme kuyruğu</span></article>
      </div>
      <section class="suite-health-section">
        <h3>Bağlantı ve son işlem</h3>
        <div class="suite-health-row"><span>İnternet</span><b>${health.online ? "Bağlı" : "Çevrimdışı"}</b></div>
        <div class="suite-health-row"><span>Son tam senkronizasyon</span><b>${esc(formatDate(health.lastSync.at))}</b></div>
        <div class="suite-health-row"><span>Drive</span><b>${esc(driveText)}</b></div>
        <div class="suite-health-row"><span>Cihaz</span><b>${esc(health.device.platform + " • " + health.device.browser)}</b></div>
        ${health.lastSync.error ? `<div class="suite-health-error">${esc(health.lastSync.error)}</div>` : ""}
      </section>
      ${errors.length ? `<section class="suite-health-section"><h3>Son İstif hataları</h3>${errors.slice(0, 8).map((item) => `<div class="suite-health-row"><span>${esc(item.istifNo || "İstif")}</span><b>${esc(item.message)}</b></div>`).join("")}</section>` : ""}
      <div class="suite-health-note">Mesaha İO kayıtları artık kayıt girildiğinde otomatik senkron kuyruğuna eklenmez. Kullanıcı özellikle <b>Şefliğe Gönder</b> dediğinde sunucuya gönderilir.</div>
      <div class="suite-health-actions">
        <button type="button" id="suiteHealthRefresh">Durumu Yenile</button>
        <button type="button" id="suiteHealthSync" class="primary" ${!health.online || !health.issueCount ? "disabled" : ""}>Bekleyenleri Gönder</button>
      </div>`;
    document.getElementById("suiteHealthRefresh")?.addEventListener("click", () => refreshModal(true));
    document.getElementById("suiteHealthSync")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      if (!api() || typeof api().syncAll !== "function") return toast("Senkronizasyon bağlantısı hazır değil.", true);
      button.disabled = true;
      button.textContent = "Gönderiliyor…";
      try {
        await api().syncAll({ source: "health-screen" });
        await refreshModal(true);
      } catch (error) {
        toast(clean(error && error.message || error), true);
        button.disabled = false;
        button.textContent = "Bekleyenleri Gönder";
      }
    });
  }

  async function refreshModal(sendPing) {
    const content = document.getElementById("suiteHealthContent");
    if (content) content.innerHTML = '<div class="suite-health-note">Mesaha, İstif, Drive ve senkronizasyon kuyruğu kontrol ediliyor…</div>';
    const health = await collectHealth();
    renderHealth(health);
    renderDashboard(health);
    if (sendPing) sendHealthPing(health, true).catch(() => {});
    return health;
  }

  function openModal() {
    const modal = ensureModal();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    refreshModal(true).catch((error) => toast(clean(error && error.message || error), true));
  }

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function reliablePress(button, handler) {
    let last = 0;
    const fire = (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      const now = Date.now();
      if (now - last < 550) return;
      last = now;
      handler();
    };
    if (window.PointerEvent) button.addEventListener("pointerup", fire, { capture: true });
    button.addEventListener("click", fire, { capture: true });
  }

  function installButton() {
    const oldButton = document.getElementById(TOOL_ID);
    if (oldButton && oldButton.parentNode) oldButton.parentNode.removeChild(oldButton);
    return false;
  }

  async function refreshDriveSnapshot() {
    try {
      if (!api() || typeof api().driveStatus !== "function") return false;
      await api().driveStatus();
      return true;
    } catch (_) {
      return false;
    }
  }

  async function sendHealthPing(existingHealth, force) {
    if (navigator.onLine === false || !api() || typeof api().edge !== "function") return false;
    const lastPing = Number(localStorage.getItem(LAST_PING_KEY) || localStorage.getItem(LEGACY_LAST_PING_KEY) || 0);
    if (!force && lastPing && Date.now() - lastPing < PING_INTERVAL) return false;
    const health = existingHealth || await collectHealth();
    const id = health.identity || {};
    const payload = {
      name: id.name,
      seflik: id.seflik,
      userKey: id.seflikKey ? clean(id.name).toLocaleLowerCase("tr-TR").replace(/\s+/g, "_") + "__" + id.seflikKey : "",
      deviceId: health.device.deviceId,
      appVersion: health.device.appVersion,
      deviceInfo: health.device,
      health: {
        generatedAt: health.generatedAt,
        level: health.level,
        online: health.online,
        authType: id.authType,
        mesaha: health.mesaha,
        suite: health.suite,
        istif: {
          totalRecords: health.istif.totalRecords,
          pendingRecords: health.istif.pendingRecords,
          failedRecords: health.istif.failedRecords,
          pendingPhotos: health.istif.pendingPhotos,
          failedPhotos: health.istif.failedPhotos,
          uploadingPhotos: health.istif.uploadingPhotos,
          uploadedPhotos: health.istif.uploadedPhotos,
          errors: health.istif.errors.slice(0, 8),
        },
        lastSync: {
          at: health.lastSync.at,
          ok: health.lastSync.ok,
          error: health.lastSync.error,
        },
        drive: health.drive,
        issueCount: health.issueCount,
      },
    };
    try {
      await api().edge("sync_health_ping", payload);
      localStorage.setItem(LAST_PING_KEY, String(Date.now()));
      return true;
    } catch (_) {
      return false;
    }
  }

  async function boot() {
    installStyle();
    ensureModal();
    ["suiteHealthDetails", "suiteHealthInlineDetails"].forEach((id) => { const button = document.getElementById(id); if (button) reliablePress(button, openModal); });
    installButton();
    const refreshAndRender = async (forcePing) => {
      try { await refreshDriveSnapshot(); } catch (_) {}
      try {
        const health = await collectHealth();
        renderDashboard(health);
        await sendHealthPing(health, !!forcePing);
      } catch (_) {}
    };
    setTimeout(() => refreshAndRender(false), 700);
    window.addEventListener("online", () => setTimeout(() => refreshAndRender(true), 1400));
    window.addEventListener("mesaha-suite:sync-complete", () => setTimeout(() => refreshAndRender(true), 500));
    window.addEventListener("mesaha-istif:changed", () => setTimeout(() => refreshAndRender(false), 900));
    window.addEventListener("storage", (event) => {
      if (event && event.key === K.drive) setTimeout(() => refreshAndRender(false), 120);
    });
    window.addEventListener("mesaha-suite:drive-status", () => setTimeout(() => refreshAndRender(false), 80));
    setInterval(() => refreshAndRender(false), PING_INTERVAL);
  }

  window.MesahaSuiteHealth = { version: VERSION, collect: collectHealth, open: openModal, ping: () => collectHealth().then((health) => { renderDashboard(health); return sendHealthPing(health, true); }) };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
