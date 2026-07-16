(function () {
  "use strict";
  const K = {
    session: "mesaha_supabase_v500_session",
    backup: "mesaha_supabase_v569_session_backup",
    access: "mesaha_google_access_v548",
    panel: "mesaha_panel_user_v316",
    settings: "cam_mesaha_ayarlar_v1",
    terminal: "mesaha_terminal_local_mode_v556",
    terminalOld: "mesaha_terminal_local_mode_v557",
    active: "mesaha_active_seflik_folder_v564",
    folderCache: "mesaha_suite_folder_cache_v4",
    oldFolderCache: "mesaha_suite_folder_cache_v2",
    foresters: "mesaha_suite_foresters_v4",
    divisions: "mesaha_suite_divisions_v4",
    divisionRecords: "mesaha_suite_division_records_v4",
    divisionReady: "mesaha_suite_division_ready_v4",
    pendingOps: "mesaha_suite_pending_ops_v4",
    lastServerSync: "mesaha_suite_last_server_sync_v4",
    mesahaFolderCache: "mesaha_seflik_folder_cache_v529",
    mesahaPendingDivisions: "mesaha_seflik_folder_pending_divisions_v530",
    mesahaLastBolme: "mesaha_seflik_folder_last_bolme_v529",
    istifShared: "shared-context-v034",
    yieldTargets: "mesaha_suite_yield_targets_v12",
    mesahaRecords: "cam_mesaha_kayitlari_v1",
    serverDeletedMesaha: "mesaha_suite_server_deleted_v28",
  };
  const $ = (id) => document.getElementById(id);
  const clean = (v) =>
    String(v == null ? "" : v)
      .trim()
      .replace(/\s+/g, " ");
  const fold = (v) =>
    clean(v)
      .toLocaleLowerCase("tr-TR")
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const emailKey = (v) => clean(v).toLocaleLowerCase("tr-TR");
  const stableKey = (v) => fold(v) || "yerel-" + Date.now().toString(36);
  const read = (k, f = {}) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "null") ?? f;
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
  const esc = (v) =>
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
  const now = () => new Date().toISOString();
  let folders = [],
    foresters = {},
    divisions = {},
    divisionRecords = {},
    divisionReady = {},
    pendingOps = [],
    busy = false,
    cacheReady = false,
    startupClosed = false,
    selectedYieldBolme = "",
    selectedYieldStats = null;

  const TELEGRAM_URL = "https://telegram.me/+LpsvthN4BM5kYWI0";
  const YOUTUBE_URL = "https://youtube.com/shorts/4yRRIRNptro?si=EgpHz-hQmnxFuqu2";
  const TELEGRAM_DAY_KEY = "mesaha_suite_telegram_daily_v12";
  const CURRENT_SUITE_BUILD = Number(window.MESAHA_RELEASE?.build || window.MESAHA_VERSION?.build || 0);
  const CURRENT_SUITE_LABEL = "Orman İO";
  let latestSuiteVersion = null, updateApplying = false, pendingDivisionDelete = null;

  function updateVersionCorner(remote) {
    const button = $("suiteUpdateButton");
    const newer = !!(remote && Number(remote.build) > CURRENT_SUITE_BUILD);
    if (button) {
      button.hidden = !newer;
      button.setAttribute("aria-hidden", newer ? "false" : "true");
    }
    document.body.classList.toggle("suite-update-available", newer);
  }
  function paintUpdateModal(remote) {
    if (!remote) return;
    const description = clean(remote.description || "Yeni uygulama sürümü ve iyileştirmeler hazır.");
    if ($("suiteUpdateVersionText")) $("suiteUpdateVersionText").textContent = "Yeni sürüm kullanıma hazır";
    if ($("suiteUpdateDescription")) $("suiteUpdateDescription").textContent = description + " Cihazdaki kayıtlarınız korunacaktır.";
    if ($("suiteUpdateStatus")) $("suiteUpdateStatus").textContent = "Güncelleme sırasında internet bağlantısını kapatmayın.";
  }
  function showUpdatePromptWhenFree(remote) {
    if (!remote || Number(remote.build) <= CURRENT_SUITE_BUILD) return;
    const key = "mesaha_suite_update_prompted_" + Number(remote.build);
    try { if (sessionStorage.getItem(key)) return; } catch (_) {}
    if (!startupClosed || document.body.classList.contains("modal-open")) {
      setTimeout(() => showUpdatePromptWhenFree(remote), 900);
      return;
    }
    try { sessionStorage.setItem(key, "1"); } catch (_) {}
    paintUpdateModal(remote);
    openModal("suiteUpdateModal");
  }
  async function checkSuiteUpdate(prompt = false) {
    updateVersionCorner(latestSuiteVersion);
    if (navigator.onLine === false) return false;
    try {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = setTimeout(() => { try { controller && controller.abort(); } catch (_) {} }, 5500);
      let response;
      try {
        response = await fetch("./release.js?update_check=" + Date.now(), { cache: "no-store", signal: controller ? controller.signal : undefined, headers: { "Cache-Control": "no-cache" } });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) throw new Error("Güncelleme bilgisi alınamadı");
      const remote = window.MesahaRelease.parse(await response.text());
      const build = Number(remote && remote.build || 0);
      latestSuiteVersion = build > CURRENT_SUITE_BUILD ? remote : null;
      updateVersionCorner(latestSuiteVersion);
      if (latestSuiteVersion && prompt) showUpdatePromptWhenFree(latestSuiteVersion);
      return !!latestSuiteVersion;
    } catch (_) {
      return false;
    }
  }
  function setUpdateProgress(percent, text) {
    const wrap = $("suiteUpdateProgress"), bar = $("suiteUpdateProgressBar"), status = $("suiteUpdateStatus");
    if (wrap) wrap.hidden = false;
    if (bar) bar.style.width = Math.max(5, Math.min(100, Number(percent) || 5)) + "%";
    if (status && text) status.textContent = text;
  }
  async function applySuiteUpdate() {
    if (updateApplying) return;
    if (navigator.onLine === false) return toast("Güncelleme için internet bağlantısı gerekli.", true);
    if (!latestSuiteVersion) {
      const found = await checkSuiteUpdate(false);
      if (!found) return toast("Yeni güncelleme bulunamadı.");
    }
    updateApplying = true;
    paintUpdateModal(latestSuiteVersion);
    openModal("suiteUpdateModal");
    const modal = $("suiteUpdateModal"), apply = $("suiteApplyUpdate");
    if (modal) modal.classList.add("is-updating");
    if (apply) { apply.disabled = true; apply.textContent = "Güncelleniyor…"; }
    try {
      setUpdateProgress(12, "Yeni sürüm denetleniyor…");
      let reg = await navigator.serviceWorker?.getRegistration("./");
      if (!reg && "serviceWorker" in navigator) reg = await navigator.serviceWorker.register("./service-worker.js?release=" + encodeURIComponent(window.MESAHA_RELEASE?.assetToken || "stable"), { scope: "./", updateViaCache: "none" });
      if (reg) {
        setUpdateProgress(28, "Yeni uygulama dosyaları alınıyor…");
        await reg.update();
        await new Promise((resolve) => setTimeout(resolve, 500));
        let worker = reg.waiting || reg.installing || reg.active || navigator.serviceWorker.controller;
        if (worker && worker.state !== "activated") worker = await waitForActiveWorker(reg, 20000);
        if (reg.waiting) {
          try { reg.waiting.postMessage({ type: "SKIP_WAITING" }); } catch (_) {}
          await new Promise((resolve) => {
            let finished = false;
            const done = () => { if (finished) return; finished = true; resolve(); };
            const timer = setTimeout(done, 8000);
            navigator.serviceWorker.addEventListener("controllerchange", () => { clearTimeout(timer); done(); }, { once: true });
          });
        }
        worker = navigator.serviceWorker.controller || reg.active || reg.waiting || worker;
        setUpdateProgress(58, "Offline uygulama dosyaları yenileniyor…");
        if (worker) {
          try { workerMessage(worker, "WARM_CACHE", 45000).catch(() => {}); } catch (_) {}
        }
      }
      setUpdateProgress(100, "Güncelleme tamamlandı. Uygulama yeniden açılıyor…");
      try { localStorage.setItem("mesaha_suite_last_update_build", String(latestSuiteVersion?.build || "")); } catch (_) {}
      setTimeout(() => location.replace("./?updated=" + encodeURIComponent(latestSuiteVersion?.build || Date.now()) + "&t=" + Date.now()), 700);
    } catch (error) {
      updateApplying = false;
      if (modal) modal.classList.remove("is-updating");
      if (apply) { apply.disabled = false; apply.textContent = "Tekrar Dene"; }
      setUpdateProgress(18, clean(error && error.message || error) || "Güncelleme tamamlanamadı.");
      toast("Güncelleme tamamlanamadı. Bağlantıyı kontrol edip tekrar deneyin.", true);
    }
  }
  function localDayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function maybeShowDailyTelegram() {
    try {
      if (localStorage.getItem(TELEGRAM_DAY_KEY) === localDayKey()) return;
      if (document.body.classList.contains("modal-open")) return setTimeout(maybeShowDailyTelegram, 1200);
      localStorage.setItem(TELEGRAM_DAY_KEY, localDayKey());
      openModal("suiteTelegramModal");
    } catch (_) {}
  }

  function startupEls(){return {overlay:$("suiteStartupOverlay"),title:$("suiteStartupTitle"),text:$("suiteStartupText"),bar:$("suiteStartupProgress"),counter:$("suiteStartupCounter"),retry:$("suiteStartupRetry")};}
  function showStartup(title,text,pct,retry){
    const e=startupEls(); startupClosed=false; document.body.classList.add("suite-starting");
    if(e.overlay)e.overlay.classList.remove("closed"); if(e.title&&title)e.title.textContent=title; if(e.text&&text)e.text.textContent=text;
    if(e.bar)e.bar.style.width=Math.max(3,Math.min(100,Number(pct)||3))+"%"; if(e.counter)e.counter.textContent=(Number(pct)||0)+"%"; if(e.retry)e.retry.hidden=!retry;
  }
  function closeStartup(delay){
    if(startupClosed)return; startupClosed=true; setTimeout(()=>{
      const e=startupEls();
      if(e.overlay)e.overlay.classList.add("closed");
      document.body.classList.remove("suite-starting");
      setTimeout(async () => {
        const updateFound = await checkSuiteUpdate(true);
        setTimeout(maybeShowDailyTelegram, updateFound ? 900 : 180);
      }, 420);
    },Math.max(0,Number(delay)||0));
  }

  function session() {
    const cached = read(K.session, null) || read(K.backup, null) || {};
    if (cached && cached.access_token) return cached;
    try {
      const api = window.mesahaSupabase || window.mesahaCloud || null;
      const live = api && typeof api.getStoredSession === "function" ? api.getStoredSession() : null;
      if (live && live.access_token) {
        write(K.session, live);
        write(K.backup, { ...live, backup_at: Date.now() });
        return live;
      }
    } catch (_) {}
    return cached || {};
  }
  function access() {
    return read(K.access, {}) || {};
  }
  function panel() {
    return read(K.panel, {}) || {};
  }
  function settings() {
    return read(K.settings, {}) || {};
  }
  function terminal() {
    const t = read(K.terminal, null) || read(K.terminalOld, null) || {};
    return t && t.active ? t : {};
  }
  function pairedTerminal() {
    const t = terminal();
    return !!(
      t.active &&
      t.source === "pair_code" &&
      (t.terminalCode || t.terminalToken || t.pairedUserId)
    );
  }
  function authType() {
    if (session().access_token || access().status === "approved")
      return "google";
    if (pairedTerminal()) return "terminal";
    if (terminal().active) return "guest";
    return "none";
  }
  function signedIn() {
    return authType() !== "none";
  }
  function cloudIdentity() {
    return authType() === "google" || authType() === "terminal";
  }
  function googleAuthApi() {
    return window.MesahaGoogleAuthV548 || window.MesahaGoogleAuthV648 || null;
  }
  async function supabaseRpc(name, params = {}) {
    const cfg = window.MESAHA_SUPABASE_CONFIG || {};
    const base = clean(cfg.url).replace(/\/+$/, "");
    const anon = clean(cfg.anonKey || cfg.anon_key);
    const token = clean(session().access_token);
    if (!base || !anon || !token)
      throw new Error("Google oturumu hazır değil.");
    const res = await fetch(base + "/rest/v1/rpc/" + encodeURIComponent(name), {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        apikey: anon,
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(params || {}),
    });
    const text = await res.text();
    let out = {};
    try {
      out = text ? JSON.parse(text) : {};
    } catch {
      out = {};
    }
    if (!res.ok)
      throw new Error(
        clean(out.message || out.error || text) || "Terminal işlemi başarısız.",
      );
    return out;
  }
  function dateText(v) {
    try {
      return v
        ? new Date(v).toLocaleString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-";
    } catch {
      return clean(v) || "-";
    }
  }
  async function createTerminalCodeSuite() {
    if (authType() !== "google")
      return toast("Terminal kodu için Google ile giriş yapın.", true);
    const btn = $("createTerminalCodeSuite");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Kod Oluşturuluyor…";
    }
    try {
      const out = await supabaseRpc("mesaha_create_terminal_code_v557", {
        p_label: "terminal",
        p_app_version: window.MesahaRelease?.telemetry("suite") || "Orman İO",
      });
      const t = out.terminal || out || {},
        code = clean(t.code),
        box = $("terminalCodeResultSuite");
      if (!code) throw new Error("Terminal kodu alınamadı.");
      if (box)
        box.innerHTML = `<div class="terminal-code-result"><small>TEK KULLANIMLIK TERMINAL KODU</small><strong>${esc(code)}</strong><span>${t.expires_at ? esc(dateText(t.expires_at)) + " tarihine kadar geçerli" : "Kısa süre geçerli"}</span><button type="button" class="secondary-button" data-copy-terminal-code="${esc(code)}">Kodu Kopyala</button></div>`;
      toast("Terminal kodu oluşturuldu.");
      await refreshTerminalDevicesSuite(true);
    } catch (e) {
      toast(e.message || String(e), true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Terminal Kodu Oluştur";
      }
    }
  }
  let terminalDevicesLoadedAt = 0;
  async function refreshTerminalDevicesSuite(silent = false) {
    const box = $("terminalDeviceListSuite");
    if (authType() !== "google") {
      if (box) box.innerHTML = "";
      return [];
    }
    if (box)
      box.innerHTML =
        '<div class="modal-note">Terminal cihazları kontrol ediliyor…</div>';
    try {
      const out = await supabaseRpc("mesaha_list_terminal_sessions_v577", {}),
        list = Array.isArray(out)
          ? out
          : Array.isArray(out.terminals)
            ? out.terminals
            : Array.isArray(out.items)
              ? out.items
              : [];
      if (box)
        box.innerHTML = list.length
          ? list
              .map((t) => {
                const d = t.used_device_info || t.device_info || {},
                  ua = clean(d.userAgent || d.user_agent),
                  label =
                    clean(t.label || d.os || d.platform) ||
                    (/iPhone|iPad|iPod/i.test(ua)
                      ? "iOS terminal"
                      : /Android/i.test(ua)
                        ? "Android terminal"
                        : "Terminal cihaz"),
                  code = clean(t.code);
                return `<article class="terminal-device-row"><div><strong>${esc(label)}</strong><small>${code ? esc(code) + " • " : ""}Giriş: ${esc(dateText(t.used_at || t.paired_at))}${t.last_cloud_at ? " • Son bağlantı: " + esc(dateText(t.last_cloud_at)) : ""}</small></div><button type="button" class="mini-button danger-mini" data-revoke-terminal-code="${esc(code)}">Çıkış Yap</button></article>`;
              })
              .join("")
          : '<div class="modal-note">Kod ile giriş yapan aktif terminal cihaz yok.</div>';
      terminalDevicesLoadedAt = Date.now();
      return list;
    } catch (e) {
      if (box)
        box.innerHTML = `<div class="modal-note warn">${esc(e.message || String(e))}</div>`;
      if (!silent) toast(e.message || String(e), true);
      return [];
    }
  }
  async function revokeTerminalDeviceSuite(code) {
    code = clean(code);
    if (!code) return;
    if (!confirm("Bu terminal cihazın oturumu kapatılsın mı?")) return;
    try {
      await supabaseRpc("mesaha_revoke_terminal_session_v577", {
        p_code: code,
      });
      toast("Terminal cihazın oturumu kapatıldı.");
      await refreshTerminalDevicesSuite(true);
    } catch (e) {
      toast(e.message || String(e), true);
    }
  }
  function terminalAuth() {
    const t = terminal();
    return pairedTerminal()
      ? {
          terminalCode: clean(t.terminalCode),
          terminalToken: clean(t.terminalToken),
          terminalPairedUserId: clean(t.pairedUserId),
          terminalPairedEmail: clean(t.pairedEmail),
          terminalDeviceId: clean(t.deviceId || t.terminalDeviceId || (() => { try { return localStorage.getItem("mesaha_supabase_v500_device") || ""; } catch (_) { return ""; } })()),
          deviceId: clean(t.deviceId || t.terminalDeviceId || (() => { try { return localStorage.getItem("mesaha_supabase_v500_device") || ""; } catch (_) { return ""; } })()),
        }
      : {};
  }
  function identity() {
    const s = session(),
      a = access(),
      p = panel(),
      t = terminal(),
      st = settings(),
      u = s.user || {},
      m = u.user_metadata || {};
    return {
      type: authType(),
      userId: clean(
        u.id ||
          a.user_id ||
          a.userId ||
          t.pairedUserId ||
          t.terminalCode ||
          t.deviceId ||
          "local",
      ),
      name: clean(
        p.googleFullName ||
          p.name ||
          a.name ||
          a.canonical_name ||
          t.name ||
          m.full_name ||
          m.name ||
          u.email,
      ),
      email: clean(a.email || p.googleEmail || t.pairedEmail || u.email),
      avatar: clean(
        p.googleAvatarUrl ||
          p.avatarUrl ||
          a.avatar_url ||
          a.picture ||
          t.avatarUrl ||
          m.avatar_url ||
          m.picture,
      ),
      seflik: clean(
        (read(K.active, {}) || {}).seflik ||
          p.activeSeflik ||
          p.seflik ||
          t.seflik ||
          st.seflik,
      ),
      bolme: clean(p.bolmeNo || t.bolmeNo || st.bolmeNo),
    };
  }
  function localeNumber(value) {
    let text = String(value == null ? "" : value)
      .trim()
      .replace(/\s+/g, "")
      .replace(/[mM]³|m3/gi, "")
      .replace(/[’'`´]/g, ",")
      .replace(/[^0-9,.-]/g, "");
    if (!text) return 0;
    const comma = text.lastIndexOf(","), dot = text.lastIndexOf(".");
    if (comma >= 0 && dot >= 0) {
      const decimal = comma > dot ? "," : ".";
      text = text.replace(decimal === "," ? /\./g : /,/g, "");
      text = text.replace(decimal, ".");
    } else if (comma >= 0) {
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      const parts = text.split(".");
      if (parts.length > 2) text = parts.slice(0, -1).join("") + "." + parts[parts.length - 1];
    }
    const n = Number(text);
    return Number.isFinite(n) ? n : 0;
  }
  function formatNumber(value, digits = 3) {
    return Number(value || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
  function mesahaRowVolume(row) {
    const d = localeNumber(row && (row.diameter || row.cap)),
      l = localeNumber(row && (row.length || row.boy)),
      q = Math.max(1, localeNumber(row && (row.quantity || row.adet || 1)));
    return d && l ? ((Math.PI * Math.pow(d / 100, 2)) / 4) * l * q : 0;
  }
  function divisionYieldKey(bolme) {
    return (activeKey() || "yerel") + "::" + clean(bolme);
  }
  function readYieldTarget(bolme) {
    const all = read(K.yieldTargets, {});
    const item = all[divisionYieldKey(bolme)];
    return item && typeof item === "object" ? localeNumber(item.dikili) : localeNumber(item);
  }
  function writeYieldTarget(bolme, dikili) {
    const all = read(K.yieldTargets, {});
    all[divisionYieldKey(bolme)] = {
      dikili: Number(dikili || 0),
      updatedAt: now(),
      seflik: activeFolder() ? activeFolder().seflik : "",
      bolme: clean(bolme),
    };
    write(K.yieldTargets, all);
  }
  const ISTIF_TOMBSTONE_SETTING_KEY = "deleted-records-v1";
  let istifDeletedIdsForYield = new Set();
  function istifTombstoneIds(value) {
    const source = value && typeof value === "object" ? value : {};
    const items = source.items && typeof source.items === "object" ? source.items : source;
    return new Set(Object.keys(items || {}).map(clean).filter(Boolean));
  }
  function readIstifRecords() {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open("mesaha-istif-prototype", 2);
        request.onerror = () => resolve([]);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("records"))
            db.createObjectStore("records", { keyPath: "id" });
          if (!db.objectStoreNames.contains("settings"))
            db.createObjectStore("settings", { keyPath: "key" });
        };
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("records")) {
            db.close();
            return resolve([]);
          }
          const stores = db.objectStoreNames.contains("settings")
            ? ["records", "settings"]
            : ["records"];
          const tx = db.transaction(stores, "readonly");
          const rowsRequest = tx.objectStore("records").getAll();
          const tombstoneRequest = stores.includes("settings")
            ? tx.objectStore("settings").get(ISTIF_TOMBSTONE_SETTING_KEY)
            : null;
          tx.oncomplete = () => {
            const rows = Array.isArray(rowsRequest.result) ? rowsRequest.result : [];
            const deletedIds = istifTombstoneIds(tombstoneRequest?.result?.value);
            istifDeletedIdsForYield = deletedIds;
            try { db.close(); } catch {}
            resolve(rows.filter((row) => row && !deletedIds.has(clean(row.id))));
          };
          tx.onerror = () => {
            try { db.close(); } catch {}
            resolve([]);
          };
          tx.onabort = tx.onerror;
        };
      } catch (_) {
        resolve([]);
      }
    });
  }

  async function divisionYieldStats(bolme) {
    const no = clean(bolme), af = activeFolder(), seflik = clean(af && af.seflik);
    const localMesaha = read(K.mesahaRecords, []);
    const mesahaRows = (Array.isArray(localMesaha) ? localMesaha : []).filter((r) => {
      const rb = clean(r && (r.bolmeNo || r.bolme_no || r.bolme));
      const rs = clean(r && (r.seflik || r.seflikName || r.folderSeflik));
      return rb === no && (!rs || !seflik || rs.toLocaleLowerCase("tr-TR") === seflik.toLocaleLowerCase("tr-TR"));
    });
    const folderKey = clean(af && (af.seflik_key || af.seflikKey)) || stableKey(seflik);
    const deletedMap = read(K.serverDeletedMesaha, {});
    const serverDeleteKey = `${folderKey}::${no}`;
    const serverDeleted = !!deletedMap[serverDeleteKey];
    const localAdet = serverDeleted ? 0 : mesahaRows.reduce((sum, r) => sum + Math.max(1, localeNumber(r.quantity || r.adet || 1)), 0);
    const localM3 = serverDeleted ? 0 : mesahaRows.reduce((sum, r) => sum + mesahaRowVolume(r), 0);
    let adet = localAdet, mesahaM3 = localM3;
    const division = currentDivisions().find((d) => clean(d.bolme_no) === no);
    if (division) {
      // Bağlantı varken sunucudaki ortak klasör özeti esas alınır. Yalnız henüz
      // gönderilmemiş cihaz kayıtları varsa yerel yüksek değer geçici olarak korunur.
      const serverAdet = localeNumber(division.record_count || division.recordCount);
      const serverM3 = localeNumber(division.total_volume || division.totalVolume);
      const dirtyMesaha = read("mesaha_suite_dirty_v8", {}).mesaha || {};
      const dirtyBolme = clean(dirtyMesaha.meta && (dirtyMesaha.meta.bolmeNo || dirtyMesaha.meta.bolme_no));
      const localPending = !serverDeleted && !!dirtyMesaha.dirty && (!dirtyBolme || dirtyBolme === no);
      if (navigator.onLine !== false) {
        adet = localPending ? Math.max(serverAdet, localAdet) : serverAdet;
        mesahaM3 = localPending ? Math.max(serverM3, localM3) : serverM3;
      } else {
        adet = serverDeleted ? serverAdet : Math.max(serverAdet, localAdet);
        mesahaM3 = serverDeleted ? serverM3 : Math.max(serverM3, localM3);
      }
    } else if (serverDeleted) {
      adet = 0;
      mesahaM3 = 0;
    }
    const localIstif = (await readIstifRecords()).filter((r) => {
      if (!r || r.isDemo) return false;
      const rb = clean(r.bolme || r.bolmeNo || r.bolme_no);
      const rs = clean(r.seflik || r.seflikName);
      return rb === no && (!rs || !seflik || rs.toLocaleLowerCase("tr-TR") === seflik.toLocaleLowerCase("tr-TR"));
    });
    let remoteIstif = [], remoteIstifAuthoritative = false;
    if (navigator.onLine !== false) {
      try {
        const api = window.MesahaSuiteSync || window.MesahaSuiteSyncV28 || window.MesahaSuiteSyncV27 || window.MesahaSuiteSyncV26 || window.MesahaSuiteSyncV22 || window.MesahaSuiteSyncV21 || window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10;
        if (api && typeof api.drive === "function" && af) {
          const out = await api.drive("record_list", {
            seflik,
            seflikKey: clean(af.seflik_key || af.seflikKey) || stableKey(seflik),
            bolmeNo: no,
          });
          remoteIstifAuthoritative = out.complete !== false && out.truncated !== true;
          remoteIstif = (Array.isArray(out && out.records) ? out.records : []).filter((r) =>
            clean(r.bolme_no || r.bolme || r.bolmeNo) === no &&
            !istifDeletedIdsForYield.has(clean(r.id || r.record_id)),
          );
        }
      } catch (_) {}
    }
    const mergedIstif = new Map();
    remoteIstif.forEach((r, index) => {
      const key = clean(r.id || r.record_id) || [clean(r.istif_no || r.istifNo), clean(r.record_date || r.date), index].join("::");
      mergedIstif.set(key, r);
    });
    localIstif.forEach((r, index) => {
      const pending = clean(r.syncStatus || r.sync_status) && clean(r.syncStatus || r.sync_status) !== "synced";
      if (remoteIstifAuthoritative && !pending) return;
      const key = clean(r.id || r.record_id) || [clean(r.istif_no || r.istifNo), clean(r.record_date || r.date), "local", index].join("::");
      if (!mergedIstif.has(key) || pending) mergedIstif.set(key, r);
    });
    const ster = [...mergedIstif.values()].reduce((sum, r) => sum + localeNumber(r.ster), 0);
    const sterM3 = ster * 0.75;
    return { bolme: no, adet, mesahaM3, ster, sterM3, toplamM3: mesahaM3 + sterM3 };
  }
  function paintYieldResult(stats, dikili) {
    if (!stats) return;
    const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };
    set("yieldTotalAdet", Math.round(stats.adet).toLocaleString("tr-TR") + " adet");
    set("yieldMesahaM3", formatNumber(stats.mesahaM3) + " m³");
    set("yieldTotalSter", formatNumber(stats.ster, 2) + " ster");
    set("yieldSterM3", formatNumber(stats.sterM3) + " m³");
    set("yieldProducedM3", formatNumber(stats.toplamM3) + " m³");
    const result = $("yieldPercent"), note = $("yieldResultNote");
    if (!result || !note) return;
    if (!(dikili > 0)) {
      result.textContent = "%—";
      result.className = "yield-percent neutral";
      note.textContent = "Verim yüzdesini görmek için dikili damga miktarını girin.";
      return;
    }
    const pct = (stats.toplamM3 / dikili) * 100;
    result.textContent = "%" + pct.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    result.className = "yield-percent " + (pct >= 90 ? "good" : pct >= 75 ? "medium" : "low");
    note.textContent = `${formatNumber(stats.toplamM3)} m³ ÷ ${formatNumber(dikili, 2)} m³ × 100`;
  }
  async function renderYieldModal() {
    const no = clean(selectedYieldBolme);
    if (!no) return;
    const title = $("yieldModalTitle");
    if (title) title.textContent = "Bölme " + no + " Verim Yüzdesi";
    const input = $("yieldStandingVolume");
    if (input) input.value = readYieldTarget(no) > 0 ? String(readYieldTarget(no)).replace(".", ",") : "";
    const loading = $("yieldLoading");
    if (loading) loading.hidden = false;
    selectedYieldStats = await divisionYieldStats(no);
    if (loading) loading.hidden = true;
    paintYieldResult(selectedYieldStats, localeNumber(input && input.value));
    if (input) input.oninput = () => paintYieldResult(selectedYieldStats, localeNumber(input.value));
  }
  function saveYieldCalculation() {
    const input = $("yieldStandingVolume"), dikili = localeNumber(input && input.value);
    if (!(dikili > 0)) return toast("Dikili damga miktarını m³ olarak girin.", true);
    writeYieldTarget(selectedYieldBolme, dikili);
    paintYieldResult(selectedYieldStats, dikili);
    toast("Bölme " + clean(selectedYieldBolme) + " dikili damga bilgisi kaydedildi.");
  }
  function toast(msg, bad = false) {
    const el = $("toast");
    if (!el) return;
    const message = String(msg == null ? "" : msg);
    try {
      if (window.OrmanIoAudio && (bad || window.OrmanIoAudio.shouldWarn(message, bad ? "bad" : "")))
        window.OrmanIoAudio.warning();
    } catch (_) {}
    el.textContent = message;
    el.classList.toggle("bad", bad);
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("show"), 3600);
  }
  let modalPageScrollY = 0;
  function hideAllModals() {
    document.querySelectorAll(".modal").forEach((x) => {
      x.hidden = true;
      x.setAttribute("hidden", "");
    });
    const b = $("modalBackdrop");
    if (b) {
      b.hidden = true;
      b.setAttribute("hidden", "");
    }
  }
  function lockModalPage() {
    if (document.body.classList.contains("modal-open")) return;
    modalPageScrollY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
    document.body.classList.add("modal-open");
    document.body.style.position = "fixed";
    document.body.style.top = `-${modalPageScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }
  function unlockModalPage() {
    const wasLocked = document.body.classList.contains("modal-open") || document.body.style.position === "fixed";
    document.body.classList.remove("modal-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    if (wasLocked) {
      try { window.scrollTo({ top: modalPageScrollY, left: 0, behavior: "auto" }); }
      catch (_) { window.scrollTo(0, modalPageScrollY); }
    }
  }
  function openModal(id) {
    hideAllModals();
    const back = $("modalBackdrop"), m = $(id);
    if (!back || !m) {
      unlockModalPage();
      return;
    }
    back.hidden = false;
    m.hidden = false;
    m.removeAttribute("hidden");
    back.removeAttribute("hidden");
    lockModalPage();
    if (id === "seflikModal") renderSeflikModal();
    if (id === "ormanciModal") renderOrmanciModal();
    if (id === "bolmeModal") renderBolmeModal();
    if (id === "yieldModal") renderYieldModal();
    setTimeout(() => {
      try {
        const f = m.querySelector("input,button,textarea,select");
        if (f && !f.disabled && f.offsetParent !== null) f.focus({ preventScroll: true });
      } catch {}
    }, 80);
  }
  function closeModals() {
    hideAllModals();
    unlockModalPage();
  }
  function avatarHTML(url, name, cls = "mini-avatar") {
    const initials =
      (clean(name) || "M")
        .split(/\s+/)
        .slice(0, 2)
        .map((x) => x[0])
        .join("")
        .toUpperCase() || "M";
    return url
      ? `<span class="${cls}"><img src="${esc(url)}" alt=""></span>`
      : `<span class="${cls}">${esc(initials)}</span>`;
  }
  function loadLocal() {
    folders = read(K.folderCache, read(K.oldFolderCache, []));
    if (!Array.isArray(folders)) folders = [];
    foresters = read(K.foresters, {});
    divisions = read(K.divisions, {});
    divisionRecords = read(K.divisionRecords, {});
    divisionReady = read(K.divisionReady, {});
    pendingOps = read(K.pendingOps, []);
    if (!Array.isArray(pendingOps)) pendingOps = [];
  }
  function saveLocal() {
    write(K.folderCache, folders);
    write(K.foresters, foresters);
    write(K.divisions, divisions);
    write(K.divisionRecords, divisionRecords);
    write(K.divisionReady, divisionReady);
    write(K.pendingOps, pendingOps);
    syncAppCaches();
  }
  function op(type, payload) {
    pendingOps.push({
      id:
        "op_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2),
      type,
      payload,
      createdAt: now(),
    });
    write(K.pendingOps, pendingOps);
    try {
      window.MesahaSuiteSyncV8 &&
        (window.MesahaSuiteSyncV10||window.MesahaSuiteSyncV9||window.MesahaSuiteSyncV8).markDirty("suite", { type: type });
    } catch {}
    updatePendingBadge();
  }
  let destructiveSyncTimer = 0;
  function autoSyncDestructive(label) {
    clearTimeout(destructiveSyncTimer);
    if (!navigator.onLine || !cloudIdentity()) {
      toast(
        cloudIdentity()
          ? `${label} cihazda uygulandı. İnternet geldiğinde senkronize edilecek.`
          : `${label} cihazda uygulandı. Google veya terminal koduyla giriş yapılana kadar yalnızca cihazda kalır.`,
      );
      return;
    }
    destructiveSyncTimer = setTimeout(async () => {
      try {
        const api = window.MesahaSuiteSync || window.MesahaSuiteSyncV28 || window.MesahaSuiteSyncV27 || window.MesahaSuiteSyncV26 || window.MesahaSuiteSyncV22 || window.MesahaSuiteSyncV21 || window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8;
        if (api && typeof api.syncAll === "function") await api.syncAll({ source: "delete-auto" });
        else await sendPendingToServer();
        toast(`${label} sunucuya da anında işlendi.`);
      } catch (e) {
        toast(`${label} cihazda uygulandı; sunucu işlemi bağlantı düzelince yeniden denenecek.`, true);
      }
    }, 120);
  }
  function updatePendingBadge() {
    const dot = $("notificationDot");
    if (dot) dot.style.display = pendingOps.length ? "block" : "none";
  }
  function normalizeFolder(raw) {
    const name = clean(raw && (raw.seflik || raw.name || raw.folderSeflik));
    if (!name) return null;
    return {
      ...raw,
      seflik: name,
      seflik_key: clean(raw.seflik_key || raw.seflikKey) || stableKey(name),
      role: clean(raw.role || raw.member_role || "owner"),
      is_creator:
        raw.is_creator !== false &&
        ["owner", "creator", "kurucu", ""].includes(
          clean(raw.role || "owner").toLocaleLowerCase("tr-TR"),
        ),
      updatedAt: raw.updatedAt || raw.updated_at || now(),
    };
  }
  function creatorFolder() {
    return (
      folders.find(
        (f) =>
          f &&
          !f.deleted &&
          (f.is_creator === true ||
            ["owner", "creator", "kurucu"].includes(
              clean(f.role).toLocaleLowerCase("tr-TR"),
            )),
      ) || null
    );
  }
  function canManageFolder(f = activeFolder()) {
    return !!(
      f &&
      (f.is_creator === true ||
        ["owner", "creator", "kurucu"].includes(
          clean(f.role).toLocaleLowerCase("tr-TR"),
        ))
    );
  }
  function activeFolder() {
    const a = read(K.active, {}),
      id = identity();
    return (
      folders.find(
        (f) =>
          f &&
          !f.deleted &&
          (clean(f.seflik_key || f.seflikKey) ===
            clean(a.seflik_key || a.seflikKey) ||
            clean(f.seflik).toLocaleLowerCase("tr-TR") ===
              clean(id.seflik).toLocaleLowerCase("tr-TR")),
      ) ||
      creatorFolder() ||
      folders.find((f) => !f.deleted) ||
      null
    );
  }
  function activeKey() {
    const f = activeFolder();
    return f ? clean(f.seflik_key || f.seflikKey) || stableKey(f.seflik) : "";
  }
  function setActive(f) {
    f = normalizeFolder(f);
    if (!f) return;
    const sf = f.seflik,
      key = f.seflik_key;
    write(K.active, {
      seflik: sf,
      seflik_key: key,
      role: f.role || "",
      creator: !!f.is_creator,
      updatedAt: now(),
    });
    const p = panel();
    p.seflik = sf;
    p.activeSeflik = sf;
    p.updatedAt = now();
    write(K.panel, p);
    const st = settings();
    st.seflik = sf;
    write(K.settings, st);
    try {
      window.dispatchEvent(new Event("mesaha:seflik-folder-active-changed"));
    } catch {}
  }
  function folderList() {
    return folders.filter((f) => f && !f.deleted);
  }
  function currentForesters() {
    const k = activeKey();
    return Array.isArray(foresters[k]) ? foresters[k] : [];
  }
  function currentDivisions() {
    const k = activeKey();
    return (Array.isArray(divisions[k]) ? divisions[k] : [])
      .filter((d) => d && !d.deleted)
      .sort((a, b) =>
        clean(a.bolme_no).localeCompare(clean(b.bolme_no), "tr", {
          numeric: true,
        }),
      );
  }
  function readyKey(folderKey, bolme) {
    return (folderKey || activeKey()) + "::" + clean(bolme);
  }
  function isDivisionReady(d) {
    return !!(
      d &&
      (d.offline_ready ||
        divisionReady[readyKey(d.seflik_key || activeKey(), d.bolme_no)])
    );
  }
  async function edge(action, data = {}) {
    const api = window.mesahaSupabase;
    if (!api || typeof api.edge !== "function")
      throw new Error("Sunucu bağlantısı hazır değil.");
    return api.edge(action, {
      source: "mesaha-suite",
      ...terminalAuth(),
      ...data,
    });
  }
  function localFolder() {
    if (authType() !== "guest") return null;
    const id = identity();
    if (!id.seflik || /^(Dosya|Şeflik seçilmedi)$/i.test(id.seflik))
      return null;
    return normalizeFolder({
      seflik: id.seflik,
      seflik_key:
        clean((read(K.active, {}) || {}).seflik_key) || stableKey(id.seflik),
      role: "owner",
      is_creator: true,
      is_local: true,
    });
  }
  async function loadFolders(force = false) {
    loadLocal();
    if (!signedIn()) {
      folders = [];
      render();
      return folders;
    }
    const lf = localFolder();
    if (
      lf &&
      !folders.some(
        (f) =>
          clean(f.seflik_key) === lf.seflik_key ||
          clean(f.seflik).toLocaleLowerCase("tr-TR") ===
            lf.seflik.toLocaleLowerCase("tr-TR"),
      )
    )
      folders.unshift(lf);
    if (!cloudIdentity() || navigator.onLine === false) {
      if (!activeFolder() && folders[0]) setActive(folders[0]);
      render();
      return folders;
    }
    try {
      const out = await edge("seflik_folder_list_my_sefliks", {
        seflik: identity().seflik,
        folderSeflik: identity().seflik,
      });
      const remote = (Array.isArray(out.folders) ? out.folders : [])
        .map(normalizeFolder)
        .filter(Boolean);
      if (remote.length) folders = remote;
      else folders = lf ? [lf] : [];
      if (folders.length) {
        const stored = read(K.active, {}) || {};
        const storedKey = clean(stored.seflik_key || stored.seflikKey);
        const storedName = clean(stored.seflik);
        const selected =
          folders.find((f) => storedKey && clean(f.seflik_key || f.seflikKey) === storedKey) ||
          folders.find((f) => storedName && fold(f.seflik) === fold(storedName)) ||
          creatorFolder() ||
          folders[0];
        if (selected) setActive(selected);
      } else clearActiveFolderContext();
      await loadMembersFromServer();
      await loadDivisionsFromServer();
      saveLocal();
      render();
      return folders;
    } catch (e) {
      if (force) toast("Şeflikler alınamadı: " + e.message, true);
      if (!activeFolder() && folders[0]) setActive(folders[0]);
      render();
      return folders;
    }
  }
  async function loadMembersFromServer() {
    const af = activeFolder();
    if (!af || !cloudIdentity() || navigator.onLine === false) return;
    try {
      const out = await edge("seflik_folder_list_members", {
        seflik: af.seflik,
        folderSeflik: af.seflik,
      });
      const list = (Array.isArray(out.members) ? out.members : [])
        .map((m) => ({
          id: emailKey(m.email) || clean(m.user_id || m.id || m.member_user_id),
          userId: clean(m.user_id || m.member_user_id),
          name: clean(m.name || m.canonical_name || m.email),
          email: emailKey(m.email),
          avatarUrl: clean(m.avatar_url || m.avatarUrl),
          role: clean(m.role || m.member_role || "member"),
          isSelf: !!m.is_self,
          updatedAt: now(),
        }))
        .filter((x) => x.name);
      foresters[af.seflik_key] = list;
    } catch {}
  }
  async function loadDivisionsFromServer() {
    const af = activeFolder();
    if (!af || !cloudIdentity() || navigator.onLine === false) return;
    try {
      const out = await edge("seflik_folder_list", {
        seflik: af.seflik,
        folderSeflik: af.seflik,
      });
      const hasAuthoritativeList = Array.isArray(out && out.divisions) || Array.isArray(out && out.summaries);
      if (!hasAuthoritativeList) return;
      const key = clean(af.seflik_key || af.seflikKey) || stableKey(af.seflik);
      const deleting = new Set((pendingOps || [])
        .filter((item) => item && item.type === "delete_division" && clean(item.payload && item.payload.seflik) === clean(af.seflik))
        .map((item) => clean(item.payload && item.payload.bolmeNo)));
      const remote = (Array.isArray(out.divisions) ? out.divisions : out.summaries)
        .map((d) => normalizeDivision(d, af))
        .filter((d) => d && !deleting.has(clean(d.bolme_no)));
      const old = currentDivisions();
      const oldByNo = new Map(old.map((d) => [clean(d.bolme_no), d]));
      const remoteNos = new Set(remote.map((d) => clean(d.bolme_no)));
      const localPendingCreates = old.filter((d) => {
        const no = clean(d && d.bolme_no);
        return no && !deleting.has(no) && !remoteNos.has(no) && !!(d.pending || d.local_pending);
      });
      const next = remote.map((d) => {
        const no = clean(d.bolme_no);
        return {
          ...(oldByNo.get(no) || {}),
          ...d,
          deleted: false,
          pending: false,
          local_pending: false,
        };
      }).concat(localPendingCreates);

      const nextNos = new Set(next.map((d) => clean(d.bolme_no)));
      const removed = old.filter((d) => {
        const no = clean(d && d.bolme_no);
        return no && !nextNos.has(no);
      });
      for (const d of removed) {
        const no = clean(d.bolme_no);
        const rk = readyKey(key, no);
        delete divisionReady[rk];
        delete divisionRecords[rk];
        if (divisionRecords[key] && typeof divisionRecords[key] === "object") delete divisionRecords[key][no];
        const yieldTargets = read(K.yieldTargets, {});
        if (yieldTargets[rk]) {
          delete yieldTargets[rk];
          write(K.yieldTargets, yieldTargets);
        }
      }
      divisions[key] = next;
      saveLocal();
      renderBolmeModal();
    } catch (error) {
      console.warn("[Orman İO] Bölme listesi yenilenemedi", error);
    }
  }
  function normalizeDivision(raw, folder) {
    folder = folder || activeFolder();
    const no = clean(raw && (raw.bolme_no || raw.bolmeNo || raw.bolme));
    if (!no || !folder) return null;
    const k = folder.seflik_key || stableKey(folder.seflik);
    return {
      ...raw,
      bolme_no: no,
      bolmeNo: no,
      seflik: folder.seflik,
      seflik_key: k,
      location: clean(raw.location || raw.mevki || raw.description),
      record_count: Number(raw.record_count || raw.recordCount || 0) || 0,
      total_volume: Number(raw.total_volume || raw.totalVolume || 0) || 0,
      created_by_name: clean(
        raw.created_by_name || raw.createdByName || identity().name,
      ),
      contributors: Array.isArray(raw.contributors) ? raw.contributors : [],
      status: raw.status || "open",
      created_at: raw.created_at || raw.createdAt || now(),
      updated_at: raw.updated_at || raw.updatedAt || now(),
      offline_ready: !!(raw.offline_ready || divisionReady[readyKey(k, no)]),
      pending: !!raw.pending,
      local_pending: !!raw.local_pending,
    };
  }
  function syncAppCaches() {
    const af = activeFolder();
    if (!af) {
      write(K.mesahaFolderCache, { at: now(), seflik: "", divisions: [] });
      write(K.mesahaPendingDivisions, { seflik: "", divisions: [] });
      try {
        localStorage.removeItem(K.mesahaLastBolme);
      } catch {}
      writeIstifSharedCache(null, []).catch(() => {});
      try {
        window.dispatchEvent(
          new CustomEvent("mesaha-suite:shared-data-updated", {
            detail: { seflik: "", divisions: [], source: "suite-root" },
          }),
        );
      } catch {}
      return;
    }
    const k = af.seflik_key || stableKey(af.seflik),
      dvs = currentDivisions()
        .map((d) => normalizeDivision(d, af))
        .filter(Boolean);
    const fNames = currentForesters()
      .map((x) => x.name)
      .filter(Boolean);
    write(K.mesahaFolderCache, {
      at: now(),
      seflik: af.seflik,
      divisions: dvs.map((d) => ({
        bolme_no: d.bolme_no,
        status: "open",
        record_count: d.record_count || 0,
        total_volume: d.total_volume || 0,
        contributors: fNames,
        created_by_name: d.created_by_name || identity().name,
        created_at: d.created_at,
        updated_at: d.updated_at,
        drive_backed_up: !!d.drive_backed_up,
        local_pending: !!d.pending,
        offline_ready: isDivisionReady(d),
      })),
    });
    write(K.mesahaPendingDivisions, {
      seflik: af.seflik,
      divisions: dvs
        .filter((d) => d.pending)
        .map((d) => ({
          bolme_no: d.bolme_no,
          status: "open",
          local_pending: true,
          created_by_name: d.created_by_name || identity().name,
          created_at: d.created_at,
          updated_at: d.updated_at,
        })),
    });
    const firstReady = dvs.find(isDivisionReady) || dvs[0];
    if (firstReady)
      localStorage.setItem(K.mesahaLastBolme, firstReady.bolme_no);
    writeIstifSharedCache(af, dvs, fNames).catch(() => {});
    try {
      window.dispatchEvent(
        new CustomEvent("mesaha-suite:shared-data-updated", {
          detail: { seflik: af.seflik, divisions: dvs, source: "suite-root" },
        }),
      );
    } catch {}
  }
  async function writeIstifSharedCache(af, dvs) {
    try {
      if (!("indexedDB" in window)) return;
      const req = indexedDB.open("mesaha-istif-prototype", 2);
      await new Promise((res, rej) => {
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("records"))
            db.createObjectStore("records", { keyPath: "id" });
          if (!db.objectStoreNames.contains("settings"))
            db.createObjectStore("settings", { keyPath: "key" });
        };
        req.onsuccess = res;
        req.onerror = () => rej(req.error);
      });
      const db = req.result;
      const tx = db.transaction("settings", "readwrite");
      const store = tx.objectStore("settings");
      const auth = identity(),
        key = af ? clean(af.seflik_key || af.seflikKey) : "",
        members = af ? currentForesters() : [];
      store.put({
        key: K.istifShared,
        value: {
          seflikler: folderList().map((f) => ({
            name: f.seflik,
            key: f.seflik_key,
            role: f.role,
            isCreator: !!f.is_creator,
          })),
          membersBySeflik: key ? { [key]: members } : {},
          customForestersBySeflik: key ? { [key]: members } : {},
          removedForestersBySeflik: {},
          suiteDivisions: Array.isArray(dvs) ? dvs : [],
          drive: {},
          auth: {
            status: signedIn() ? "cached" : "signed_out",
            name: auth.name,
            email: auth.email,
            avatarUrl: auth.avatar,
            userId: auth.userId,
          },
          updatedAt: now(),
        },
      });
      await new Promise((res, rej) => {
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
      try {
        db.close();
      } catch {}
    } catch {}
  }
  function render() {
    const id = identity(),
      has = signedIn(),
      t = id.type,
      af = activeFolder();
    const av = $("avatar");
    if (av)
      av.innerHTML = id.avatar
        ? `<img src="${esc(id.avatar)}" alt="">`
        : esc(
            (id.name || "M")
              .split(/\s+/)
              .slice(0, 2)
              .map((x) => x[0])
              .join("")
              .toUpperCase() || "M",
          );
    $("profileName") &&
      ($("profileName").textContent = has
        ? id.name || "Kullanıcı"
        : "Giriş yapılmadı");
    const office = $("profileOffice");
    if (office)
      office.lastChild.textContent =
        " " + (af ? af.seflik : id.seflik || "Şeflik seçilmedi");
    $("loginButtonTitle") &&
      ($("loginButtonTitle").textContent = has
        ? "Oturum Bilgileri"
        : "Giriş Yap");
    $("loginButtonSub") &&
      ($("loginButtonSub").textContent =
        t === "google"
          ? "Google hesabı bağlı"
          : t === "terminal"
            ? "Terminal kodu ile bağlı"
            : t === "guest"
              ? "Yerel misafir modu"
              : "Google veya terminal modu");
    const cr = creatorFolder();
    $("seflikCardSub") &&
      ($("seflikCardSub").textContent = cr
        ? cr.seflik + " • kurucu"
        : "Her kullanıcı yalnızca 1 şeflik");
    document.querySelectorAll("[data-app]").forEach((b) => {
      b.disabled = false;
      b.classList.toggle("is-locked", !has);
    });
    document
      .querySelectorAll(
        '[data-modal="seflik"],[data-modal="ormanci"],[data-modal="bolme"]',
      )
      .forEach((b) => {
        b.disabled = false;
        b.classList.toggle("is-locked", !has);
      });
    $("connectionText") &&
      ($("connectionText").textContent = navigator.onLine
        ? "Çevrimiçi"
        : "Çevrimdışı");
    $("connectionPill") &&
      $("connectionPill").classList.toggle("offline", !navigator.onLine);
    updatePendingBadge();
    renderAuthBox();
    paintTerminalPairCard();
    renderOpenModals();
    syncAppCaches();
  }
  function renderOpenModals() {
    if ($("seflikModal") && !$("seflikModal").hidden) renderSeflikModal();
    if ($("ormanciModal") && !$("ormanciModal").hidden) renderOrmanciModal();
    if ($("bolmeModal") && !$("bolmeModal").hidden) renderBolmeModal();
  }
  function renderAuthBox() {
    const id = identity(),
      box = $("authSessionBox"),
      wrap = $("logoutWrap"),
      googleBtn = $("googleLoginBtn"),
      guestBtn = $("guestLoginBtn"),
      tools = $("googleTerminalTools");
    if (!box || !wrap) return;
    const type = authType();
    const loginModal = $("loginModal"), loginTitle = loginModal && loginModal.querySelector(".modal-head h3"), loginKicker = loginModal && loginModal.querySelector(".modal-kicker");
    if (loginTitle) loginTitle.textContent = type === "google" ? "Oturum Bilgileri" : type === "terminal" ? "Terminal Oturumu" : type === "guest" ? "Misafir Oturumu" : "Giriş Seçimi";
    if (loginKicker) loginKicker.textContent = type === "google" ? "GOOGLE HESABI" : type === "terminal" ? "KODLA EŞLEŞMİŞ CİHAZ" : type === "guest" ? "YEREL TERMİNAL" : "ORTAK OTURUM";
    if (googleBtn) googleBtn.hidden = type === "google";
    if (guestBtn)
      guestBtn.hidden =
        type === "google" || type === "terminal" || type === "guest";
    if (tools) tools.hidden = type !== "google";
    const choices = $("authChoiceGrid");
    if (choices) choices.hidden = type === "google";
    if (!signedIn()) {
      box.innerHTML =
        '<div class="modal-note">Bir kez giriş yaptığınızda aynı oturum Mesaha İO ve İstif İO tarafından ortak kullanılır. Terminal cihazlar Misafir Modu üzerinden Google kullanıcısının oluşturduğu kodla eşleşir.</div>';
      wrap.innerHTML = "";
      return;
    }
    const label =
      type === "google"
        ? "Google hesabı"
        : type === "terminal"
          ? "Kodla eşleşmiş terminal"
          : "Yerel misafir";
    box.innerHTML = `<div class="auth-session-box profile-line"><div class="auth-session-avatar">${avatarHTML(id.avatar, id.name)}</div><div class="auth-session-copy"><span class="auth-session-kicker">AKTİF OTURUM</span><b>${esc(id.name || label)}</b><small>${esc(label)}</small>${id.email ? `<em>${esc(id.email)}</em>` : ""}${activeFolder() ? `<strong>${esc(activeFolder().seflik)}</strong>` : `<strong>Şeflik seçilmedi</strong>`}</div></div>`;
    wrap.innerHTML =
      '<button class="danger-button" id="logoutBtn">Oturumu Kapat</button>';
    $("logoutBtn").onclick = logout;
    if (type === "google")
      if (Date.now() - terminalDevicesLoadedAt > 30000)
        setTimeout(() => refreshTerminalDevicesSuite(true), 0);
  }
  function clearActiveFolderContext(nextFolder) {
    if (nextFolder) { setActive(nextFolder); return; }
    try { localStorage.removeItem(K.active); } catch {}
    const p = panel(); p.activeSeflik = ""; p.seflik = ""; p.bolmeNo = ""; p.updatedAt = now(); write(K.panel, p);
    const st = settings(); st.seflik = ""; st.bolmeNo = ""; write(K.settings, st);
    try { window.dispatchEvent(new Event("mesaha:seflik-folder-active-changed")); } catch {}
  }
  function purgeFolderLocalCaches(folder) {
    const key = clean(folder && (folder.seflik_key || folder.seflikKey)) || stableKey(folder && folder.seflik);
    if (!key) return;
    delete foresters[key]; delete divisions[key];
    Object.keys(divisionReady).forEach((k) => { if (k === key || k.startsWith(key + "::")) delete divisionReady[k]; });
    Object.keys(divisionRecords).forEach((k) => { if (k === key || k.startsWith(key + "::")) delete divisionRecords[k]; });
    const targets = read(K.yieldTargets, {}); Object.keys(targets).forEach((k) => { if (k === key || k.startsWith(key + "::")) delete targets[k]; }); write(K.yieldTargets, targets);
    pendingOps = pendingOps.filter((item) => {
      const p = item && item.payload || {};
      return clean(p.seflik_key || p.seflikKey) !== key && clean(p.seflik).toLocaleLowerCase("tr-TR") !== clean(folder.seflik).toLocaleLowerCase("tr-TR");
    });
    write(K.pendingOps, pendingOps);
    try { localStorage.removeItem("mesaha_istif_last_bolme_v14::" + key); } catch {}
    /* Mesaha kayıt deposu şeflik bazında ayrılmadığı için ayrılan şefliğin offline kayıtlarının
       başka şeflikte görünmemesi adına senkronizasyon doğrulandıktan sonra yerel kopya sıfırlanır. */
    try {
      localStorage.setItem("cam_mesaha_kayitlari_v1", "[]");
      ["cam_mesaha_kayitlari_v1_mirror_v515","cam_mesaha_kayitlari_v1_last_ok","cam_mesaha_kayitlari_v1_snapshot_v385","cam_mesaha_kayitlari_v1_mirror_meta_v515","mesaha_v527_records_meta"].forEach((k) => localStorage.removeItem(k));
      indexedDB.deleteDatabase("mesaha_io_storage_v527");
    } catch {}
    try {
      const request = indexedDB.open("mesaha-istif-prototype", 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("records"))
          db.createObjectStore("records", { keyPath: "id" });
        if (!db.objectStoreNames.contains("settings"))
          db.createObjectStore("settings", { keyPath: "key" });
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("records")) { db.close(); return; }
        const tx = db.transaction("records", "readwrite"), store = tx.objectStore("records"), cursor = store.openCursor();
        cursor.onsuccess = () => {
          const c = cursor.result; if (!c) return;
          const row = c.value || {}, rowKey = clean(row.seflikKey || row.seflik_key) || stableKey(row.seflik);
          if (rowKey === key) c.delete();
          c.continue();
        };
        tx.oncomplete = () => db.close(); tx.onerror = () => db.close();
      };
    } catch {}
  }
  async function leaveSeflik() {
    if (busy) return;
    const folder = activeFolder();
    if (!folder) return toast("Çıkılacak şeflik bulunamadı.", true);
    if (canManageFolder(folder)) return toast("Şeflik kurucusu şeflikten çıkamaz. Gerekirse Şefliği Sil işlemini kullanın.", true);
    if (!cloudIdentity() || navigator.onLine === false) return toast("Şeflikten çıkmak için internet bağlantısı gerekir.", true);
    const key = clean(folder.seflik_key || folder.seflikKey) || stableKey(folder.seflik);
    const syncApi = window.MesahaSuiteSyncV25 || window.MesahaSuiteSyncV24 || window.MesahaSuiteSyncV20;
    if (syncApi && typeof syncApi.isDirty === "function" && syncApi.isDirty()) return toast("Cihazda henüz senkronize edilmemiş kayıt veya işlem var. Önce Senkronize Et düğmesini kullanın.", true);
    const pendingForFolder = pendingOps.some((item) => {
      const p = item && item.payload || {};
      return clean(p.seflik_key || p.seflikKey) === key || clean(p.seflik).toLocaleLowerCase("tr-TR") === clean(folder.seflik).toLocaleLowerCase("tr-TR");
    });
    if (pendingForFolder) return toast("Bu şeflikte sunucuya gönderilmemiş işlem var. Önce Senkronize Et düğmesini kullanın.", true);
    if (!confirm(folder.seflik + " şefliğinden çıkılsın mı? Ortak kayıtlar sunucuda korunur; bu cihazdaki offline şeflik ve İstif kopyaları temizlenir.")) return;
    busy = true; renderSeflikModal();
    try {
      await edge("seflik_folder_leave", { seflik: folder.seflik, folderSeflik: folder.seflik, seflikKey: key });
      folders = folders.filter((f) => clean(f.seflik_key || f.seflikKey) !== key);
      purgeFolderLocalCaches(folder);
      const next = creatorFolder() || folders.find((f) => f && !f.deleted) || null;
      clearActiveFolderContext(next);
      saveLocal();
      await loadFolders(true);
      closeModals(); render();
      toast(folder.seflik + " şefliğinden çıkıldı.");
    } catch (e) { toast(e.message || String(e), true); }
    finally { busy = false; renderSeflikModal(); }
  }
  function renderSeflikModal() {
    const form = $("seflikForm");
    if (!form) return;
    let box = $("currentSeflikBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "currentSeflikBox";
      form.insertBefore(box, form.firstChild);
    }
    const list = folderList(),
      af = activeFolder(),
      cr = creatorFolder();
    const options = list.length
      ? `<label class="suite-select-label">Aktif Şeflik<select id="suiteFolderSelectV6">${list.map((f, i) => `<option value="${i}" ${af && clean(f.seflik_key) === clean(af.seflik_key) ? "selected" : ""}>${esc(f.seflik)}${canManageFolder(f) ? " • kurucu" : " • üye"}</option>`).join("")}</select></label>`
      : '<div class="modal-note">Henüz seçilebilecek şeflik yok.</div>';
    const current = af
      ? `<div class="manager-card"><div><small>Aktif Şeflik</small><b>${esc(af.seflik)}</b><span>${canManageFolder(af) ? "Bu şefliği yönetebilirsiniz." : "Bu şeflikte üyesiniz; yalnızca seçim yapabilirsiniz."}</span></div>${canManageFolder(af) ? `<div class="manager-actions"><button type="button" class="mini-button" data-action="rename-seflik">İsmini Düzenle</button><button type="button" class="mini-button danger-mini" data-action="delete-seflik">Şefliği Sil</button></div>` : `<div class="manager-actions"><button type="button" class="mini-button danger-mini" data-action="leave-seflik" ${busy ? "disabled" : ""}>Şeflikten Çık</button></div>`}</div>`
      : "";
    box.innerHTML = options + current;
    const sel = $("suiteFolderSelectV6");
    if (sel && !sel.__bound) {
      sel.__bound = true;
      sel.onchange = () => selectFolder(Number(sel.value));
    }
    const inp = $("seflikName"),
      sub = $("seflikSubmit"),
      note = $("seflikLimitNote");
    if (inp) {
      inp.disabled = !!cr;
      if (!cr) inp.value = "";
    }
    if (sub) {
      sub.disabled = !!cr;
      sub.textContent = cr ? "Şeflik Zaten Var" : "Şefliği Oluştur";
    }
    if (note) {
      note.classList.toggle("warn", !!cr);
      note.textContent = cr
        ? "Her kullanıcı yalnızca 1 şefliğin kurucusu olabilir. Üye olduğunuz diğer şeflikleri üstteki listeden seçebilirsiniz."
        : "Her kullanıcı yalnızca bir şefliğin kurucusu olabilir.";
    }
  }
  async function selectFolder(index) {
    const f = folderList()[index];
    if (!f) return;
    setActive(f);
    saveLocal();
    render();
    renderSeflikModal();
    if (cloudIdentity() && navigator.onLine) {
      toast("Şeflik bilgileri getiriliyor…");
      await loadMembersFromServer();
      await loadDivisionsFromServer();
      saveLocal();
      render();
      toast("Aktif şeflik değiştirildi.");
    } else toast("Aktif şeflik değiştirildi. Offline kayıtlar kullanılıyor.");
  }
  function renderOrmanciModal() {
    const form = $("ormanciForm");
    if (!form) return;
    let list = $("ormanciCurrentList");
    if (!list) {
      list = document.createElement("div");
      list.id = "ormanciCurrentList";
      list.className = "result-list current-list";
      form.insertBefore(
        list,
        $("ormanciSearch")?.closest("label") || form.firstChild,
      );
    }
    const rows = currentForesters(),
      manage = canManageFolder();
    list.innerHTML =
      '<div class="section-title"><b>Ekli Ormancılar</b><small>' +
      rows.length +
      " kişi</small></div>" +
      (rows.length
        ? rows
            .map(
              (m, i) =>
                `<div class="result-row person-row">${avatarHTML(m.avatarUrl, m.name)}<div class="grow"><b>${esc(m.name || "-")}</b><small>${esc(m.email || m.role || "Ormancı")}${m.pending ? " • sunucu bekliyor" : ""}</small></div>${manage && !m.isSelf && !["owner", "creator", "kurucu"].includes(clean(m.role).toLocaleLowerCase("tr-TR")) ? `<button class="mini-button danger-mini" type="button" data-remove-forester="${i}">Çıkar</button>` : ""}</div>`,
            )
            .join("")
        : '<div class="modal-note">Henüz ormancı eklenmedi.</div>');
    const search = $("ormanciSearch")?.closest("label"),
      submit = form.querySelector('button[type="submit"]');
    if (search) search.hidden = !manage;
    if (submit) submit.hidden = !manage;
    let note = $("ormanciManagedNoteV6");
    if (!note) {
      note = document.createElement("div");
      note.id = "ormanciManagedNoteV6";
      note.className = "modal-note";
      form.insertBefore(note, search || form.firstChild);
    }
    note.textContent = manage
      ? "Ormancı ekleme ve çıkarma yalnızca Orman İO üzerinden yapılır."
      : "Bu şeflikte üyesiniz. Ormancı listesinden yalnızca uygulama içindeki seçimlerde yararlanabilirsiniz.";
  }
  function renderBolmeModal() {
    const form = $("bolmeForm");
    if (!form) return;
    let list = $("bolmeCurrentList");
    if (!list) {
      list = document.createElement("div");
      list.id = "bolmeCurrentList";
      list.className = "result-list current-list";
      form.insertBefore(list, form.querySelector(".form-actions") || null);
    }
    const rows = currentDivisions(),
      manage = canManageFolder();
    list.innerHTML =
      '<div class="section-title"><b>Oluşturulan Bölmeler</b><small>' +
      rows.length +
      " bölme</small></div>" +
      (rows.length
        ? rows
            .map(
              (d, i) =>
                `<div class="result-row division-row"><span class="folder-dot ${isDivisionReady(d) ? "ready" : "wait"}">${isDivisionReady(d) ? "✓" : "↓"}</span><div class="grow"><b>Bölme ${esc(d.bolme_no)}</b><small>${isDivisionReady(d) ? "Offline hazır" : "Offline indirme gerekli"}${d.pending ? " • sunucu bekliyor" : ""}${d.location ? " • " + esc(d.location) : ""}</small></div><div class="division-actions"><button class="mini-button" type="button" data-download-division="${i}">Offline İndir</button><button class="mini-button yield-mini" type="button" data-yield-division="${i}">Verim Yüzdesi</button>${manage ? `<button class="mini-button danger-mini" type="button" data-delete-division="${i}">Sil</button>` : ""}</div></div>`,
            )
            .join("")
        : '<div class="modal-note">Henüz bölme oluşturulmadı.</div>') +
      '<button type="button" class="secondary-button wide-action" data-action="download-all-divisions">Tüm Bölmeleri Offline İndir</button>';
    form.querySelectorAll("label").forEach((el) => {
      if (el.querySelector("#bolmeNo,#bolmeLocation")) el.hidden = !manage;
    });
    const actions = form.querySelector(".form-actions");
    if (actions) actions.hidden = !manage;
    let note = $("bolmeManagedNoteV6");
    if (!note) {
      note = document.createElement("div");
      note.id = "bolmeManagedNoteV6";
      note.className = "modal-note";
      form.insertBefore(note, form.firstChild);
    }
    note.textContent = manage
      ? "Bölme oluşturma, silme ve offline indirme yalnızca Orman İO üzerinden yönetilir."
      : "Bu şeflikte üyesiniz. Bölmeleri silemez veya oluşturamazsınız; hazır bölmeleri indirebilirsiniz.";
  }
  async function logout() {
    if (!confirm("Oturum kapatılsın mı? Yerel kayıtlar silinmez.")) return;
    try {
      if (authType() === "google" && googleAuthApi())
        await googleAuthApi().logout();
    } catch {}
    [
      K.session,
      K.backup,
      K.access,
      K.terminal,
      K.terminalOld,
      K.folderCache,
      K.oldFolderCache,
    ].forEach((k) => localStorage.removeItem(k));
    folders = [];
    closeModals();
    render();
    toast("Oturum kapatıldı");
  }
  async function openGoogle() {
    closeModals();
    try {
      const api = googleAuthApi();
      if (!api) throw new Error("Google giriş modülü hazır değil.");
      await api.openGoogle();
    } catch (e) {
      toast(e.message, true);
    }
  }
  function openGuest() {
    closeModals();
    try {
      const api = googleAuthApi();
      if (!api) throw new Error("Terminal giriş modülü hazır değil.");
      api.openTerminal();
    } catch (e) {
      toast(e.message, true);
    }
  }
  function paintTerminalPairCard() {
    const card = $("suiteTerminalPair"), status = $("terminalPairStatusSuite"), input = $("terminalPairCodeSuite");
    if (!card) return;
    const type = authType();
    // Terminal kodu yalnız ilk açılışta veya elle açılmış yerel misafir modunda görünür.
    // Google ve daha önce kodla eşleşmiş terminal oturumlarında tekrar gösterilmez.
    const visible = type === "none" || type === "guest";
    card.hidden = !visible;
    card.setAttribute("aria-hidden", visible ? "false" : "true");
    if (!visible) {
      card.classList.remove("is-error", "is-busy");
      if (input) input.value = "";
      if (status) status.hidden = true;
      return;
    }
    if (input) input.placeholder = type === "guest" ? "Google kullanıcısının terminal kodu" : "A1B2-C3D4";
    if (status && !card.classList.contains("is-error")) status.hidden = true;
  }
  async function claimTerminalFromSuite() {
    const card = $("suiteTerminalPair"), input = $("terminalPairCodeSuite"), status = $("terminalPairStatusSuite"), button = $("terminalPairSubmitSuite");
    const code = clean(input && input.value).toUpperCase();
    if (code.replace(/[^A-Z0-9]/g, "").length < 8) return toast("Geçerli terminal kodunu yazın.", true);
    if (card) { card.classList.remove("is-error"); card.classList.add("is-busy"); }
    if (button) { button.disabled = true; button.textContent = "Bağlanıyor…"; }
    if (status) { status.hidden = false; status.textContent = "Google hesabı ve şeflik bilgileri alınıyor…"; }
    try {
      const api = googleAuthApi();
      if (!api || typeof api.claimTerminalCode !== "function") throw new Error("Terminal giriş modülü hazır değil.");
      await api.claimTerminalCode(code);
      if (input) input.value = "";
      loadLocal();
      render();
      closeModals();
      await loadFolders(true).catch(() => []);
      render();
      toast("Terminal cihaz Google kullanıcısına bağlandı.");
    } catch (error) {
      if (card) card.classList.add("is-error");
      if (status) { status.hidden = false; status.textContent = clean(error && error.message || error) || "Terminal kodu doğrulanamadı."; }
      toast(clean(error && error.message || error) || "Terminal kodu doğrulanamadı.", true);
    } finally {
      if (card) card.classList.remove("is-busy");
      if (button) { button.disabled = false; button.textContent = "Kodla Bağlan"; }
      paintTerminalPairCard();
    }
  }
  async function createSeflik(e) {
    e.preventDefault();
    if (busy) return;
    const name = clean($("seflikName") && $("seflikName").value);
    if (name.length < 2) return toast("Şeflik adını yazın.", true);
    if (creatorFolder())
      return toast("Bu kullanıcı zaten bir şeflik oluşturmuş.", true);
    const f = normalizeFolder({
      seflik: name,
      seflik_key: stableKey(name),
      role: "owner",
      is_creator: true,
      is_local: authType() === "guest",
      createdAt: now(),
    });
    folders = [f];
    foresters[f.seflik_key] = foresters[f.seflik_key] || [];
    divisions[f.seflik_key] = divisions[f.seflik_key] || [];
    setActive(f);
    op("create_seflik", { seflik: name, seflik_key: f.seflik_key });
    saveLocal();
    toast(
      "Şeflik oluşturuldu. Sunucuya göndermek için Sunucuya Gönder butonunu kullanın.",
    );
    render();
    renderSeflikModal();
  }
  function renameSeflik() {
    if (!canManageFolder())
      return toast(
        "Bu işlemi yalnızca şeflik kurucusu Orman İO üzerinden yapabilir.",
        true,
      );
    const f = creatorFolder();
    if (!f) return;
    const next = clean(prompt("Yeni şeflik adı:", f.seflik));
    if (!next || next === f.seflik) return;
    const oldKey = f.seflik_key,
      oldName = f.seflik,
      newKey = stableKey(next);
    f.seflik = next;
    f.seflik_key = newKey;
    f.updatedAt = now();
    foresters[newKey] = foresters[oldKey] || [];
    divisions[newKey] = (divisions[oldKey] || []).map((d) => ({
      ...d,
      seflik: next,
      seflik_key: newKey,
      updated_at: now(),
    }));
    delete foresters[oldKey];
    delete divisions[oldKey];
    Object.keys(divisionReady).forEach((k) => {
      if (k.startsWith(oldKey + "::")) {
        divisionReady[newKey + k.slice(oldKey.length)] = divisionReady[k];
        delete divisionReady[k];
      }
    });
    Object.keys(divisionRecords).forEach((k) => {
      if (k.startsWith(oldKey + "::")) {
        divisionRecords[newKey + k.slice(oldKey.length)] = divisionRecords[k];
        delete divisionRecords[k];
      }
    });
    const yieldTargets = read(K.yieldTargets, {});
    Object.keys(yieldTargets).forEach((k) => {
      if (k.startsWith(oldKey + "::")) {
        yieldTargets[newKey + k.slice(oldKey.length)] = yieldTargets[k];
        delete yieldTargets[k];
      }
    });
    write(K.yieldTargets, yieldTargets);
    setActive(f);
    op("rename_seflik", { oldName, oldKey, newName: next, newKey });
    saveLocal();
    toast("Şeflik ismi yerelde düzenlendi.");
    render();
  }
  function deleteSeflik() {
    if (!canManageFolder())
      return toast(
        "Bu işlemi yalnızca şeflik kurucusu Orman İO üzerinden yapabilir.",
        true,
      );
    const f = creatorFolder();
    if (!f) return;
    if (
      prompt(`${f.seflik} şefliği silinecek. Onay için şeflik adını yazın:`) !==
      f.seflik
    )
      return toast("Şeflik silinmedi.", true);
    folders = folders.filter((x) => x !== f);
    op("delete_seflik", { seflik: f.seflik, seflik_key: f.seflik_key });
    try {
      localStorage.removeItem(K.active);
    } catch {}
    saveLocal();
    toast("Şeflik silindi. Sunucu bağlantısı varsa otomatik olarak buluttan da siliniyor.");
    render();
    renderSeflikModal();
    autoSyncDestructive("Şeflik silme işlemi");
  }
  async function searchOrmanci(e) {
    e.preventDefault();
    const q = clean($("ormanciSearch") && $("ormanciSearch").value),
      box = $("ormanciResults");
    if (!box) return;
    if (q.length < 3) return toast("En az 3 harf yazın.", true);
    if (!cloudIdentity() || navigator.onLine === false) {
      box.innerHTML =
        '<div class="modal-note warn">Ormancı araması için Google hesabı veya terminal kodu ve internet gerekir. Yerel ekleme için isim/e-posta yazıp tekrar deneyebilirsiniz.</div>';
      return;
    }
    const af = activeFolder();
    if (!af) return toast("Önce şeflik oluşturun.", true);
    box.innerHTML = '<div class="modal-note">Kullanıcılar aranıyor…</div>';
    try {
      const out = await edge("seflik_folder_search_users", {
        query: q,
        seflik: af.seflik,
      });
      const users = Array.isArray(out.users) ? out.users : [];
      box.innerHTML = users.length
        ? users
            .map(
              (u, i) =>
                `<div class="result-row person-row">${avatarHTML(clean(u.avatar_url || u.avatarUrl), u.name || u.email)}<div class="grow"><b>${esc(u.name || "-")}</b><small>${esc(u.email || "Google kullanıcısı")}</small></div><button class="mini-button" data-add-user-index="${i}">Ekle</button></div>`,
            )
            .join("")
        : '<div class="modal-note">Kullanıcı bulunamadı. Kişinin önce Google ile giriş yapması gerekir.</div>';
      box
        .querySelectorAll("[data-add-user-index]")
        .forEach(
          (b) =>
            (b.onclick = () =>
              addOrmanci(users[Number(b.dataset.addUserIndex)] || {}, b)),
        );
    } catch (err) {
      box.innerHTML =
        '<div class="modal-note warn">' + esc(err.message) + "</div>";
    }
  }
  async function addOrmanci(u, btn) {
    if (!canManageFolder())
      return toast(
        "Bu işlemi yalnızca şeflik kurucusu Orman İO üzerinden yapabilir.",
        true,
      );
    const af = activeFolder();
    if (!af) return;
    const k = af.seflik_key;
    const item = {
      id: emailKey(u.email) || clean(u.user_id || u.userId) || "local_" + Date.now(),
      userId: clean(u.user_id || u.userId),
      name: clean(
        u.name || u.canonical_name || u.email || $("ormanciSearch")?.value,
      ),
      email: emailKey(u.email),
      avatarUrl: clean(u.avatar_url || u.avatarUrl || u.picture),
      role: "member",
      pending: true,
      updatedAt: now(),
    };
    if (!item.name) return toast("Kullanıcı adı alınamadı.", true);
    if (!item.email)
      return toast("Ormancı eklemek için kullanıcının e-posta adresi gerekli.", true);
    if (!item.userId)
      return toast("Ormancının önce Google ile giriş yapması gerekir.", true);
    const list = foresters[k] || [];
    if (
      list.some((x) =>
        emailKey(x.email) === item.email ||
        (!!item.userId && clean(x.userId || x.id) === item.userId)
      )
    )
      return toast(`Bu e-posta adresi zaten ekli: ${item.email}`, true);

    foresters[k] = [...list, item];
    saveLocal();
    render();
    renderOrmanciModal();
    if (btn) {
      btn.textContent = "Ekleniyor…";
      btn.disabled = true;
    }

    const payload = {
      seflik: af.seflik,
      folderSeflik: af.seflik,
      seflikKey: clean(af.seflik_key || af.seflikKey),
      seflik_key: clean(af.seflik_key || af.seflikKey),
      member_user_id: item.userId,
      member_email: item.email,
      email: item.email,
    };

    if (!cloudIdentity() || navigator.onLine === false) {
      op("add_member", {
        ...payload,
        name: item.name,
        email: item.email,
        avatarUrl: item.avatarUrl,
      });
      toast("Ormancı cihazda eklendi. İnternet gelince sunucuya gönderilecek.");
      return;
    }

    try {
      const out = await edge("seflik_folder_add_member", payload);
      const serverMember = out && out.member ? out.member : {};
      const updated = {
        ...item,
        id: emailKey(serverMember.email || item.email) || clean(serverMember.user_id || serverMember.id || item.id),
        userId: clean(serverMember.user_id || item.userId),
        name: clean(serverMember.name || item.name),
        email: emailKey(serverMember.email || item.email),
        avatarUrl: clean(serverMember.avatar_url || item.avatarUrl),
        pending: false,
        updatedAt: now(),
      };
      foresters[k] = (foresters[k] || []).map((x) =>
        emailKey(x.email) === item.email || clean(x.userId || x.id) === clean(item.userId || item.id) ? updated : x,
      );
      pendingOps = pendingOps.filter((opItem) => {
        if (!opItem || opItem.type !== "add_member") return true;
        const p = opItem.payload || {};
        return !(
          (emailKey(p.member_email || p.email) === item.email || clean(p.member_user_id) === item.userId) &&
          (clean(p.seflik_key || p.seflikKey) === clean(af.seflik_key || af.seflikKey) ||
            fold(p.seflik) === fold(af.seflik))
        );
      });
      saveLocal();
      await loadMembersFromServer();
      saveLocal();
      render();
      renderOrmanciModal();
      toast("Ormancı şefliğe eklendi. Kullanıcının cihazında şeflik otomatik görünecek.");
      if (btn) btn.textContent = "Eklendi";
      try {
        window.dispatchEvent(
          new CustomEvent("mesaha-suite:membership-changed", {
            detail: { seflik: af.seflik, seflikKey: k, memberUserId: item.userId },
          }),
        );
      } catch {}
    } catch (error) {
      op("add_member", {
        ...payload,
        name: item.name,
        email: item.email,
        avatarUrl: item.avatarUrl,
      });
      if (btn) {
        btn.textContent = "Bekliyor";
        btn.disabled = false;
      }
      toast(
        "Ormancı sunucuya eklenemedi; işlem bekleyenlere alındı: " +
          clean(error && error.message ? error.message : error),
        true,
      );
    }
  }
  function removeOrmanci(index) {
    if (!canManageFolder())
      return toast(
        "Bu işlemi yalnızca şeflik kurucusu Orman İO üzerinden yapabilir.",
        true,
      );
    const af = activeFolder();
    if (!af) return;
    const k = af.seflik_key,
      list = foresters[k] || [],
      m = list[index];
    if (!m) return;
    const memberEmail = emailKey(m.email);
    if (!memberEmail) return toast("Bu kullanıcı için e-posta bilgisi bulunamadı. Listeyi yenileyip tekrar deneyin.", true);
    if (!confirm(`${m.name || memberEmail} (${memberEmail}) şeflikten çıkarılsın mı?`)) return;
    foresters[k] = list.filter((_, i) => i !== index);
    op("remove_member", {
      seflik: af.seflik,
      seflik_key: k,
      member_user_id: m.userId,
      member_email: memberEmail,
      name: m.name,
      email: memberEmail,
    });
    saveLocal();
    toast("Ormancı çıkarıldı.");
    render();
    renderOrmanciModal();
    autoSyncDestructive("Ormancı çıkarma işlemi");
  }
  async function createBolme(e) {
    if (!canManageFolder())
      return toast(
        "Bu işlemi yalnızca şeflik kurucusu Orman İO üzerinden yapabilir.",
        true,
      );
    e.preventDefault();
    const no = clean($("bolmeNo") && $("bolmeNo").value),
      loc = clean($("bolmeLocation") && $("bolmeLocation").value),
      af = activeFolder();
    if (!no) return toast("Bölme numarasını yazın.", true);
    if (!af) return toast("Önce şeflik oluşturun.", true);
    const k = af.seflik_key,
      list = divisions[k] || [];
    if (list.some((d) => clean(d.bolme_no) === no && !d.deleted))
      return toast("Bu bölme zaten oluşturulmuş.", true);
    const d = normalizeDivision(
      {
        bolme_no: no,
        location: loc,
        record_count: 0,
        total_volume: 0,
        pending: true,
        created_by_name: identity().name,
      },
      af,
    );
    divisions[k] = [d, ...list];
    op("create_division", {
      seflik: af.seflik,
      seflik_key: k,
      bolmeNo: no,
      location: loc,
    });
    const st = settings();
    st.bolmeNo = no;
    write(K.settings, st);
    const p = panel();
    p.bolmeNo = no;
    write(K.panel, p);
    saveLocal();
    toast("Bölme oluşturuldu, offline indiriliyor…");
    if ($("bolmeNo")) $("bolmeNo").value = "";
    if ($("bolmeLocation")) $("bolmeLocation").value = "";
    render();
    renderBolmeModal();
    await downloadDivisionByBolme(no, true);
  }
  async function downloadDivision(idx, quiet = false) {
    const d = currentDivisions()[idx];
    if (d) return downloadDivisionByBolme(d.bolme_no, quiet);
  }
  async function downloadDivisionByBolme(no, quiet = false) {
    const af = activeFolder();
    if (!af || !no) return;
    const k = af.seflik_key;
    let rows = [];
    if (cloudIdentity() && navigator.onLine) {
      try {
        const out = await edge("seflik_folder_read", {
          seflik: af.seflik,
          folderSeflik: af.seflik,
          bolmeNo: no,
        });
        rows = Array.isArray(out.records) ? out.records : [];
      } catch {
        rows = [];
      }
    }
    divisionRecords[readyKey(k, no)] = rows;
    divisionReady[readyKey(k, no)] = {
      ready: true,
      at: now(),
      recordCount: rows.length,
    };
    divisions[k] = (divisions[k] || []).map((d) =>
      clean(d.bolme_no) === clean(no)
        ? {
            ...d,
            offline_ready: true,
            record_count: Math.max(d.record_count || 0, rows.length),
            updated_at: now(),
          }
        : d,
    );
    saveLocal();
    if (!quiet) toast("Bölme " + no + " offline kullanıma hazır.");
    render();
    renderBolmeModal();
  }
  async function downloadAllDivisions() {
    const rows = currentDivisions();
    if (!rows.length) return toast("İndirilecek bölme yok.", true);
    for (const d of rows) await downloadDivisionByBolme(d.bolme_no, true);
    toast(rows.length + " bölme offline kullanıma hazır.");
    render();
  }

  function suiteSyncApi() {
    return window.MesahaSuiteSync || window.MesahaSuiteSyncV28 || window.MesahaSuiteSyncV27 || window.MesahaSuiteSyncV26 || window.MesahaSuiteSyncV22 || window.MesahaSuiteSyncV21 || window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || null;
  }
  async function driveAction(action, data = {}) {
    const api = suiteSyncApi();
    if (!api || typeof api.drive !== "function") throw new Error("Drive sunucu bağlantısı hazır değil.");
    return api.drive(action, data);
  }
  async function readLocalIstifDivision(bolmeNo) {
    const no = clean(bolmeNo), out = { records: [], istifCount: 0, photoCount: 0 };
    if (!no || !("indexedDB" in window)) return out;
    try {
      const req = indexedDB.open("mesaha-istif-prototype", 2);
      const db = await new Promise((resolve, reject) => {
        req.onupgradeneeded = () => {
          const x = req.result;
          if (!x.objectStoreNames.contains("records")) x.createObjectStore("records", { keyPath: "id" });
          if (!x.objectStoreNames.contains("settings")) x.createObjectStore("settings", { keyPath: "key" });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const stores = db.objectStoreNames.contains("settings") ? ["records", "settings"] : ["records"];
      const result = await new Promise((resolve, reject) => {
        const tx = db.transaction(stores, "readonly");
        const rowsReq = tx.objectStore("records").getAll();
        const tombReq = stores.includes("settings") ? tx.objectStore("settings").get(ISTIF_TOMBSTONE_SETTING_KEY) : null;
        tx.oncomplete = () => resolve({ rows: Array.isArray(rowsReq.result) ? rowsReq.result : [], tombstones: tombReq?.result?.value });
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Yerel İstif kayıtları okunamadı"));
      });
      try { db.close(); } catch {}
      const deletedIds = istifTombstoneIds(result.tombstones);
      out.records = result.rows.filter((r) => r && !r.isDemo && !deletedIds.has(clean(r.id)) && clean(r.bolme || r.bolmeNo || r.bolme_no) === no);
      out.istifCount = out.records.length;
      out.photoCount = out.records.reduce((sum, r) => sum + Math.max(Number(r.photoCount || 0) || 0, Array.isArray(r.photos) ? r.photos.length : 0, Array.isArray(r.driveFiles) ? r.driveFiles.length : 0), 0);
    } catch {}
    return out;
  }

  async function deleteLocalIstifDivision(bolmeNo) {
    const local = await readLocalIstifDivision(bolmeNo);
    if (!local.records.length || !("indexedDB" in window)) return local;
    const req = indexedDB.open("mesaha-istif-prototype", 2);
    const db = await new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
    await new Promise((resolve, reject) => {
      const tx = db.transaction(["records", "settings"], "readwrite");
      const recordStore = tx.objectStore("records"), settingsStore = tx.objectStore("settings");
      const tombReq = settingsStore.get(ISTIF_TOMBSTONE_SETTING_KEY);
      tombReq.onsuccess = () => {
        const oldValue = tombReq.result?.value || {};
        const items = { ...((oldValue.items && typeof oldValue.items === "object") ? oldValue.items : oldValue) };
        const deletedAt = now();
        local.records.forEach((r) => {
          if (!r || r.id == null) return;
          const id = clean(r.id);
          recordStore.delete(r.id);
          if (id) items[id] = {
            id,
            deletedAt,
            seflikKey: clean(r.seflikKey || r.seflik_key),
            seflik: clean(r.seflik),
            bolme: clean(r.bolme || r.bolmeNo || r.bolme_no),
            istifNo: clean(r.istifNo || r.istif_no),
            reason: "division_delete",
          };
        });
        settingsStore.put({ key: ISTIF_TOMBSTONE_SETTING_KEY, value: { version: 1, updatedAt: deletedAt, items } });
      };
      tombReq.onerror = () => reject(tombReq.error);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Yerel İstif silme tamamlanamadı"));
    });
    try { db.close(); } catch {}
    try { window.dispatchEvent(new CustomEvent("mesaha-istif:division-deleted", { detail: { bolmeNo: clean(bolmeNo), count: local.istifCount } })); } catch {}
    return local;
  }

  async function divisionDeletePreview(row) {
    const local = await readLocalIstifDivision(row && row.bolme_no);
    const base = {
      mesahaCount: Number(row && row.record_count || 0) || 0,
      istifCount: local.istifCount,
      photoCount: local.photoCount,
      backupCount: 0,
      online: false,
      error: ""
    };
    if (!navigator.onLine || !cloudIdentity()) return base;
    try {
      const remote = await driveAction("division_delete_preview", { seflik: activeFolder()?.seflik || identity().seflik, bolmeNo: row.bolme_no });
      base.istifCount = Math.max(base.istifCount, Number(remote.istif_count || remote.istifCount || 0) || 0);
      base.photoCount = Math.max(base.photoCount, Number(remote.photo_count || remote.photoCount || 0) || 0);
      base.backupCount = Number(remote.backup_count || remote.backupCount || 0) || 0;
      base.online = true;
    } catch (e) { base.error = clean(e && e.message || e); }
    return base;
  }
  function paintDivisionDeleteModal() {
    const state = pendingDivisionDelete;
    if (!state) return;
    const d = state.row || {}, p = state.preview || {};
    if ($("divisionDeleteTitle")) $("divisionDeleteTitle").textContent = "Bölme " + clean(d.bolme_no) + " Silinecek";
    if ($("divisionDeleteLead")) $("divisionDeleteLead").textContent = "Bölme " + clean(d.bolme_no) + " ile birlikte aşağıdaki Mesaha, İstif, fotoğraf ve yedek verileri kalıcı olarak kaldırılacak.";
    if ($("divisionDeleteMesahaCount")) $("divisionDeleteMesahaCount").textContent = Number(p.mesahaCount || 0).toLocaleString("tr-TR") + " kayıt";
    if ($("divisionDeleteIstifCount")) $("divisionDeleteIstifCount").textContent = Number(p.istifCount || 0).toLocaleString("tr-TR") + " istif";
    if ($("divisionDeletePhotoCount")) $("divisionDeletePhotoCount").textContent = Number(p.photoCount || 0).toLocaleString("tr-TR") + " fotoğraf";
    if ($("divisionDeleteBackupCount")) $("divisionDeleteBackupCount").textContent = Number(p.backupCount || 0).toLocaleString("tr-TR") + " yedek";
    const status = $("divisionDeleteStatus");
    if (status) {
      status.classList.toggle("bad", !!p.error);
      status.textContent = p.loading ? "Sunucudaki İstif, fotoğraf ve yedekler hesaplanıyor…" : p.error ? "Sunucu özeti alınamadı. Yerel veriler gösteriliyor; bağlantı gelince sunucu silme işlemi yeniden denenecek." : p.online ? "Sunucu ve cihaz verileri birlikte hesaplandı." : "Çevrimdışı: cihazdaki kayıtlar hemen silinir; sunucu ve Drive verileri bağlantı gelince kalıcı olarak temizlenir.";
    }
    const input = $("divisionDeleteConfirmInput"); if (input && input.value !== state.typed) input.value = state.typed || "";
    const btn = $("divisionDeleteConfirmButton"); if (btn) btn.disabled = state.working || clean(state.typed) !== clean(d.bolme_no);
  }
  async function openDivisionDeleteModal(row, index) {
    pendingDivisionDelete = { row, index, typed: "", working: false, preview: { mesahaCount: Number(row.record_count || 0) || 0, istifCount: 0, photoCount: 0, backupCount: 0, loading: true } };
    openModal("divisionDeleteModal"); paintDivisionDeleteModal();
    const input = $("divisionDeleteConfirmInput");
    if (input) input.oninput = () => { if (!pendingDivisionDelete) return; pendingDivisionDelete.typed = input.value; paintDivisionDeleteModal(); };
    pendingDivisionDelete.preview = await divisionDeletePreview(row);
    paintDivisionDeleteModal();
  }
  async function confirmDivisionDelete() {
    const state = pendingDivisionDelete;
    if (!state || state.working) return;
    const af = activeFolder(), d = state.row, k = af && af.seflik_key;
    if (!af || !d || clean(state.typed) !== clean(d.bolme_no)) return toast("Onay için bölme numarasını doğru yazın.", true);
    state.working = true; paintDivisionDeleteModal();
    const btn = $("divisionDeleteConfirmButton"); if (btn) btn.textContent = "Kalıcı Olarak Siliniyor…";
    try {
      await deleteLocalIstifDivision(d.bolme_no);
      const list = divisions[k] || [];
      divisions[k] = list.filter((x) => clean(x.bolme_no) !== clean(d.bolme_no));
      delete divisionReady[readyKey(k, d.bolme_no)]; delete divisionRecords[readyKey(k, d.bolme_no)];
      const yieldTargets = read(K.yieldTargets, {}); delete yieldTargets[readyKey(k, d.bolme_no)]; write(K.yieldTargets, yieldTargets);
      op("delete_division", { seflik: af.seflik, seflik_key: k, bolmeNo: d.bolme_no, cascadeAssets: true });
      saveLocal(); closeModals(); pendingDivisionDelete = null; render(); renderBolmeModal();
      toast(navigator.onLine ? "Bölme ve bağlı veriler siliniyor…" : "Bölme cihazdan silindi. Sunucu ve Drive temizliği bağlantı gelince tamamlanacak.");
      autoSyncDestructive("Bölme ve bağlı verileri silme işlemi");
    } catch (e) {
      state.working = false; paintDivisionDeleteModal(); toast(clean(e && e.message || e) || "Bölme silinemedi.", true);
    } finally { if (btn) btn.textContent = "Bölmeyi ve Bağlı Verileri Sil"; }
  }

  function deleteDivision(index) {
    if (!canManageFolder()) return toast("Bu işlemi yalnızca şeflik kurucusu Orman İO üzerinden yapabilir.", true);
    const d = currentDivisions()[index];
    if (!d) return;
    openDivisionDeleteModal(d, index);
  }
  function showCleanupResult(result, bolmeNo) {
    const modal = $("cleanupResultModal");
    if (!modal || !result) return;
    const title = $("cleanupResultTitle");
    if (title) title.textContent = `Bölme ${clean(bolmeNo)} Temizlendi`;
    const set = (id, value, suffix = "") => {
      const node = $(id);
      if (node) node.textContent = `${Number(value || 0).toLocaleString("tr-TR")}${suffix}`;
    };
    set("cleanupResultIstif", result.istif_deleted || result.istifDeleted, " kayıt");
    set("cleanupResultPhotos", result.photo_drive_deleted || result.photoDriveDeleted, " dosya");
    set("cleanupResultBackups", result.backup_drive_deleted || result.backupDriveDeleted || result.backup_deleted || result.backupDeleted, " yedek");
    set("cleanupResultFolders", result.drive_folder_deleted || result.driveFolderDeleted, " klasör");
    const note = $("cleanupResultNote");
    if (note) note.textContent = "Sunucu kayıtları ile kurucunun Drive fotoğraf ve yedekleri başarıyla temizlendi.";
    openModal("cleanupResultModal");
  }

  async function sendPendingToServer() {
    if (!signedIn()) return toast("Önce giriş yapın.", true);
    if (!cloudIdentity())
      return toast(
        "Sunucuya göndermek için Google hesabı veya kodla eşleşmiş terminal gerekir.",
        true,
      );
    if (!navigator.onLine) return toast("İnternet bağlantısı yok.", true);
    if (!pendingOps.length) {
      toast("Gönderilecek yeni işlem yok.");
      await loadFolders(true);
      return;
    }
    busy = true;
    toast("Sunucuya gönderiliyor…");
    const remain = [];
    const cleanupResults = [];
    for (const item of pendingOps) {
      try {
        const p = item.payload || {};
        if (item.type === "create_seflik") {
          await edge("seflik_folder_create_seflik", { seflik: p.seflik });
        } else if (item.type === "delete_seflik") {
          await edge("seflik_folder_delete_seflik", {
            seflik: p.seflik,
            confirmSeflik: p.seflik,
          });
        } else if (item.type === "rename_seflik") {
          await edge("seflik_folder_rename_seflik", {
            seflik: p.oldName,
            oldSeflik: p.oldName,
            newSeflik: p.newName,
            new_seflik: p.newName,
          });
        } else if (item.type === "add_member") {
          if (!p.member_email && !p.email)
            throw new Error("Ormancı için e-posta adresi yok");
          await edge("seflik_folder_add_member", {
            seflik: p.seflik,
            member_user_id: p.member_user_id,
            member_email: p.member_email || p.email,
          });
        } else if (item.type === "remove_member") {
          if (p.member_email || p.email || p.member_user_id)
            await edge("seflik_folder_remove_member", {
              seflik: p.seflik,
              member_user_id: p.member_user_id,
              member_email: p.member_email || p.email,
            });
        } else if (item.type === "create_division") {
          await edge("seflik_folder_create_division", {
            seflik: p.seflik,
            bolmeNo: p.bolmeNo,
            location: p.location || "",
          });
        } else if (item.type === "delete_division") {
          const cleanup = await driveAction("division_delete_all", {
            seflik: p.seflik,
            bolmeNo: p.bolmeNo,
            confirmBolme: p.bolmeNo,
            permanent: true,
          });
          await edge("seflik_folder_delete_division", {
            seflik: p.seflik,
            bolmeNo: p.bolmeNo,
            confirmBolme: p.bolmeNo,
            permanent: true,
            personalDriveAssetsDeleted: true,
          });
          cleanupResults.push({ result: cleanup, bolmeNo: p.bolmeNo });
        }
      } catch (e) {
        item.error = String(e && e.message ? e.message : e);
        remain.push(item);
      }
    }
    pendingOps = remain;
    write(K.pendingOps, pendingOps);
    write(K.lastServerSync, { at: now(), remaining: pendingOps.length });
    await loadFolders(true);
    busy = false;
    toast(
      pendingOps.length
        ? "Bazı işlemler beklemede kaldı. Durum ekranından bakabilirsiniz."
        : "Tüm yeni işlemler sunucuya gönderildi.",
      !!pendingOps.length,
    );
    if (!pendingOps.length && cleanupResults.length) {
      const last = cleanupResults[cleanupResults.length - 1];
      showCleanupResult(last.result, last.bolmeNo);
    }
    render();
  }
  async function pingAdminProfile() {
    if (!navigator.onLine || !cloudIdentity() || !signedIn()) return;
    const id = identity(),
      af = activeFolder();
    try {
      await edge("profile_ping_suite", {
        name: id.name || id.email || "Kullanıcı",
        seflik: af?.seflik || id.seflik || "",
        bolmeNo: id.bolme || "",
        appVersion: window.MesahaRelease?.telemetry("suite") || "Orman İO",
        avatarUrl: id.avatar || "",
        deviceId:
          localStorage.getItem("mesaha_suite_device_v7") ||
          (() => {
            const x =
              "suite_" +
              Math.random().toString(36).slice(2) +
              Date.now().toString(36);
            localStorage.setItem("mesaha_suite_device_v7", x);
            return x;
          })(),
        deviceInfo: {
          appId: "suite",
          appName: "Orman İO",
          platform: navigator.platform || "",
          browser: navigator.userAgent || "",
          suiteVersion: String(window.MESAHA_RELEASE?.version || "stable"),
        },
      });
    } catch {}
  }
  async function syncNow() {
    if (!signedIn()) return toast("Önce giriş yapın.", true);
    if (!navigator.onLine) return toast("İnternet bağlantısı yok.", true);
    toast("Şeflik bilgileri güncelleniyor…");
    await loadFolders(true);
    toast("Şeflik bilgileri güncellendi.");
  }
  function showInfo(title, html, k = "BİLGİ") {
    $("infoModalTitle").textContent = title;
    $("infoKicker").textContent = k;
    $("infoContent").innerHTML = html;
    openModal("infoModal");
  }
  async function cleanupNestedWorkers() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      const rootScope = new URL("./", location.href).href;
      for (const reg of regs) {
        const scope = String(reg.scope || "");
        if (
          scope !== rootScope &&
          (scope.includes("/mesaha/") || scope.includes("/istif/"))
        )
          await reg.unregister();
      }
    } catch {}
  }
  function workerMessage(worker, type, timeout = 45000) {
    return new Promise((resolve) => {
      if (!worker) return resolve({ ready: false });
      const ch = new MessageChannel(),
        t = setTimeout(() => resolve({ ready: false, timeout: true }), timeout);
      ch.port1.onmessage = (e) => {
        clearTimeout(t);
        resolve(e.data || { ready: false });
      };
      try {
        worker.postMessage({ type }, [ch.port2]);
      } catch {
        clearTimeout(t);
        resolve({ ready: false });
      }
    });
  }
  async function waitForActiveWorker(reg, timeout=15000){
    const candidate=reg.installing||reg.waiting;
    if(candidate&&candidate.state!=="activated"){
      await new Promise((resolve)=>{let done=false;const finish=()=>{if(done)return;done=true;resolve();};const t=setTimeout(finish,timeout);candidate.addEventListener("statechange",()=>{if(candidate.state==="activated"||candidate.state==="redundant"){clearTimeout(t);finish();}});try{if(reg.waiting)reg.waiting.postMessage({type:"SKIP_WAITING"});}catch{}});
    }
    return reg.active||navigator.serviceWorker.controller||reg.waiting||reg.installing;
  }
  async function prepareOffline() {
    const online = navigator.onLine !== false;
    showStartup(online ? "Orman İO hazırlanıyor" : "Offline sürüm açılıyor", online ? "Uygulama açılıyor; çevrimdışı dosyalar arka planda kontrol ediliyor." : "Cihazdaki uygulama dosyaları kontrol ediliyor.", online ? 16 : 22, false);
    const failOpen = setTimeout(() => {
      setCacheStatus("Uygulama açıldı • offline hazırlık arka planda sürüyor", 55);
      closeStartup(0);
    }, online ? 3200 : 4200);
    if (!("serviceWorker" in navigator)) {
      clearTimeout(failOpen);
      setCacheStatus("Tarayıcı çevrimdışı kullanımı desteklemiyor", 0);
      closeStartup(350);
      return false;
    }
    try {
      await cleanupNestedWorkers();
      const reg = await navigator.serviceWorker.register("./service-worker.js?release=" + encodeURIComponent(window.MESAHA_RELEASE?.assetToken || "stable"), { scope: "./", updateViaCache: "none" });
      const worker = await Promise.race([
        waitForActiveWorker(reg, online ? 5000 : 3500),
        new Promise((resolve) => setTimeout(() => resolve(reg.active || navigator.serviceWorker.controller || null), online ? 5200 : 3700)),
      ]);
      let st = { ready: false, criticalMissing: [] };
      if (worker) {
        try { st = await workerMessage(worker, "GET_STATUS", online ? 2600 : 1800); } catch (_) {}
      }
      cacheReady = !!st.ready;
      clearTimeout(failOpen);
      if (cacheReady) {
        setCacheStatus("Mesaha İO ve İstif İO çevrimdışı kullanıma hazır", 100);
        closeStartup(180);
      } else {
        const criticalMissing = Array.isArray(st.criticalMissing) ? st.criticalMissing.length : 0;
        setCacheStatus(online ? "Uygulama açık • offline dosyalar arka planda hazırlanıyor" : criticalMissing ? "Offline dosyaların bir kısmı eksik" : "Cihazdaki son sürüm açıldı", online ? 62 : 45);
        closeStartup(250);
        if (online && worker) {
          setTimeout(() => { workerMessage(worker, "WARM_CACHE", 45000).then((result) => {
            cacheReady = !!result.ready;
            setCacheStatus(cacheReady ? "İki uygulama çevrimdışı kullanıma hazır" : "Offline hazırlık daha sonra devam edecek", cacheReady ? 100 : 72);
          }).catch(() => {}); }, 50);
        }
      }
      return cacheReady;
    } catch (e) {
      clearTimeout(failOpen);
      setCacheStatus("Uygulama açıldı • offline hazırlık sonra yeniden denenecek", 40);
      closeStartup(250);
      return false;
    }
  }
  function setCacheStatus(text, pct) {
    $("lastSync") && ($("lastSync").textContent = text);
    $("cacheToolText") &&
      ($("cacheToolText").textContent =
        pct >= 100 ? "İki uygulama hazır" : "Dosyalar hazırlanıyor");
    const bar = $("cacheProgressBar");
    if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + "%";
    $("lastSync") &&
      $("lastSync").classList.toggle("offline-ready", pct >= 100);
    if(!startupClosed){const e=startupEls();if(e.text)e.text.textContent=text;if(e.bar)e.bar.style.width=Math.max(3,Math.min(100,Number(pct)||3))+"%";if(e.counter)e.counter.textContent=Math.max(0,Math.min(100,Number(pct)||0))+"%";}
  }
  function ensureLoginThen(fn) {
    if (!signedIn()) {
      openModal("loginModal");
      toast("Önce Google veya terminal modu ile giriş yapın.", true);
      return false;
    }
    try {
      fn && fn();
    } catch (e) {
      toast(e.message || String(e), true);
    }
    return true;
  }
  function openSeflikModal() {
    return ensureLoginThen(() => openModal("seflikModal"));
  }
  function openOrmanciModal() {
    return ensureLoginThen(() => openModal("ormanciModal"));
  }
  function openBolmeModal() {
    return ensureLoginThen(() => {
      openModal("bolmeModal");
      if (cloudIdentity() && navigator.onLine !== false) {
        loadDivisionsFromServer()
          .then(() => { renderBolmeModal(); render(); })
          .catch(() => {});
      }
    });
  }
  async function goApp(app) {
    if (!signedIn()) {
      openModal("loginModal");
      toast("Uygulamayı açmak için önce giriş yapın.", true);
      return;
    }
    syncAppCaches();
    location.href = app === "mesaha" ? "./mesaha/" : "./istif/";
  }

  let legacyBackupsCache = [];
  function legacyDateText(item) {
    const raw = clean(item && item.created_at);
    if (!raw) return "-";
    try {
      return new Date(raw).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (_) { return raw; }
  }
  function legacySizeText(bytes) {
    const n = Number(bytes || 0);
    if (!n) return "-";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " KB";
    return (n / (1024 * 1024)).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " MB";
  }
  function legacySearchText(item) {
    return fold([item.username, item.seflik, item.bolme, item.file_name].filter(Boolean).join(" "));
  }
  function renderLegacyBackups() {
    const list = $("legacyBackupList"), summary = $("legacyBackupSummary"), input = $("legacyBackupSearch");
    if (!list) return;
    const q = fold(input && input.value || "");
    const rows = legacyBackupsCache.filter((item) => !q || legacySearchText(item).includes(q));
    if (summary) summary.textContent = rows.length + " yedek gösteriliyor • Toplam " + legacyBackupsCache.length;
    if (!rows.length) {
      list.innerHTML = '<div class="modal-note warn">Aramanıza uygun eski yedek bulunamadı.</div>';
      return;
    }
    list.innerHTML = rows.map((item) => {
      const user = clean(item.username) || "Kullanıcı adı yok";
      const office = clean(item.seflik) || "Şeflik yok";
      const bolme = clean(item.bolme) || "-";
      return `<article class="legacy-backup-row"><div class="legacy-backup-main"><div class="legacy-backup-icon">↶</div><div><strong>${esc(user)}</strong><small>${esc(office)} • Bölme ${esc(bolme)} • ${esc(legacyDateText(item))}</small><span>${esc(item.file_name || "Mesaha yedeği")} • ${esc(legacySizeText(item.size_bytes))}</span></div></div><div class="legacy-backup-actions"><a class="secondary-button" href="${esc(item.view_url)}" target="_blank" rel="noopener">Drive'da Aç</a><a class="primary-button" href="${esc(item.download_url)}" target="_blank" rel="noopener" download>İndir</a></div></article>`;
    }).join("");
  }
  async function loadLegacyBackups(force = false) {
    const list = $("legacyBackupList");
    if (list && (!legacyBackupsCache.length || force)) list.innerHTML = '<div class="modal-note">Herkese açık yedek arşivi yükleniyor…</div>';
    try {
      const res = await fetch("./legacy-backups.json?archive=20" + (force ? "&t=" + Date.now() : ""), { cache: force ? "no-store" : "default" });
      if (!res.ok) throw new Error("Eski yedek listesi alınamadı.");
      const data = await res.json();
      legacyBackupsCache = Array.isArray(data) ? data : Array.isArray(data.files) ? data.files : [];
      legacyBackupsCache.sort((a,b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
      renderLegacyBackups();
      return legacyBackupsCache;
    } catch (error) {
      if (list) list.innerHTML = `<div class="modal-note warn">${esc(error && error.message || "Eski yedekler yüklenemedi.")}</div>`;
      return [];
    }
  }
  function openLegacyBackups() {
    openModal("legacyBackupsModal");
    const input = $("legacyBackupSearch");
    if (input) input.value = "";
    loadLegacyBackups(false);
  }
  function showMyLegacyBackups() {
    const id = identity(), input = $("legacyBackupSearch");
    if (!input) return;
    input.value = clean(id.name || id.seflik || "");
    renderLegacyBackups();
    input.focus();
  }

  function guideModalHtml() {
    return `
      <div class="suite-guide-modal-grid">
        <section class="suite-guide-panel suite-guide-panel-mesaha">
          <div class="suite-guide-panel-head">
            <strong>Mesaha Gir</strong>
            <small>Hızlı mesaha kullanımı</small>
          </div>
          <ol>
            <li><b>Mesaha Gir</b> kartına dokunup giriş ekranını açın.</li>
            <li>Ağaç türü, ürün türü, boy, çap ve barkod bilgilerini girin.</li>
            <li><b>Kaydet</b> diyerek ölçüyü cihaza kaydedin.</li>
            <li><b>Ölçümler</b> sekmesinden kayıtları görüntüleyin, düzeltin veya silin.</li>
            <li><b>Mesaha Dosyasını İndir</b> ve <b>Beyan İndir</b> ile çıktı alın.</li>
            <li>Şeflik için önce Orman İO’dan bölmeyi offline indirip sonra <b>Şefliğe Gönder</b> kullanın.</li>
          </ol>
        </section>
        <section class="suite-guide-panel suite-guide-panel-istif">
          <div class="suite-guide-panel-head">
            <strong>İstif Al</strong>
            <small>İstif ve fotoğraf kullanımı</small>
          </div>
          <ol>
            <li><b>İstif Al</b> kartına dokunup uygulamayı açın.</li>
            <li>Orman İO’dan gelen uygun şeflik ve bölmeyi seçin.</li>
            <li>Yeni istif kaydı oluşturup fotoğrafı çekin ve bilgileri girin.</li>
            <li>Kayıtları cihazda güvenle saklayın; internet varsa buluta da gönderilir.</li>
            <li>Fotoğraflar otomatik inmez; gerekirse <b>İstifi Buluttan Getir</b> kullanın.</li>
            <li>Bekleyen kayıtları topluca göndermek için Orman İO’daki <b>Senkronizasyon</b> ve <b>Sunucuya Gönder</b> düğmelerini kullanın.</li>
          </ol>
        </section>
      </div>
      <div class="suite-guide-note-box">
        <strong>Kısa Not</strong>
        <p>Şeflik, bölme, Drive ve genel senkron işlemleri Orman İO ana menüsünden yönetilir. Yardım gerekirse Telegram destek grubunu kullanabilirsiniz.</p>
      </div>`;
  }

  function handleAction(target, ev) {
    if (!target) return false;
    const modal = target.getAttribute("data-modal"),
      app = target.getAttribute("data-app"),
      tool = target.getAttribute("data-tool"),
      id = target.id,
      action = target.getAttribute("data-action");
    if (
      modal ||
      app ||
      tool ||
      action ||
      id === "profileAction" ||
      id === "suiteUpdateButton" ||
      id === "suiteApplyUpdate" ||
      id === "notificationButton" ||
      id === "googleLoginBtn" ||
      id === "guestLoginBtn" ||
      id === "terminalPairSubmitSuite" ||
      id === "createTerminalCodeSuite" ||
      id === "refreshTerminalDevicesSuite" ||
      id === "yieldSaveButton" ||
      target.dataset.revokeTerminalCode != null ||
      target.dataset.copyTerminalCode != null ||
      target.dataset.yieldDivision != null ||
      target.classList.contains("modal-close") ||
      target.classList.contains("modal-cancel")
    ) {
      if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    }
    if (
      target.classList.contains("modal-close") ||
      target.classList.contains("modal-cancel")
    ) {
      closeModals();
      return true;
    }
    if (id === "profileAction" || modal === "login" || tool === "settings") {
      openModal("loginModal");
      return true;
    }
    if (modal === "seflik") return openSeflikModal(), true;
    if (modal === "ormanci") return openOrmanciModal(), true;
    if (modal === "bolme") return openBolmeModal(), true;
    if (app) {
      goApp(app);
      return true;
    }
    if (tool === "sync" || tool === "server") {
      if (window.MesahaSuiteSync || window.MesahaSuiteSyncV28 || window.MesahaSuiteSyncV27 || window.MesahaSuiteSyncV26 || window.MesahaSuiteSyncV22 || window.MesahaSuiteSyncV21 || window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8)
        (window.MesahaSuiteSync || window.MesahaSuiteSyncV28 || window.MesahaSuiteSyncV27 || window.MesahaSuiteSyncV26 || window.MesahaSuiteSyncV22 || window.MesahaSuiteSyncV21 || window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8).syncAll({ source: tool })
          .then(() => loadFolders(true))
          .catch(() => {});
      else sendPendingToServer();
      return true;
    }
    if (tool === "updates") {
      prepareOffline();
      return true;
    }
    if (tool === "guide") {
      showInfo(
        "Kılavuz",
        guideModalHtml(),
        "YARDIM"
      );
      return true;
    }
    if (id === "suiteUpdateButton") {
      if (latestSuiteVersion) { paintUpdateModal(latestSuiteVersion); openModal("suiteUpdateModal"); }
      else checkSuiteUpdate(true);
      return true;
    }
    if (id === "suiteApplyUpdate") {
      applySuiteUpdate();
      return true;
    }
    if (tool === "backups") {
      (window.MesahaSuiteBackupsV22 || window.MesahaSuiteBackupsV21 || window.MesahaSuiteBackupsV20 || window.MesahaSuiteBackupsV19 || window.MesahaSuiteBackupsV18 || window.MesahaSuiteBackupsV17 || window.MesahaSuiteBackupsV14 || window.MesahaSuiteBackupsV13 || window.MesahaSuiteBackupsV12 || window.MesahaSuiteBackupsV11 || window.MesahaSuiteBackupsV10 || window.MesahaSuiteBackupsV9 || window.MesahaSuiteBackupsV8) && (window.MesahaSuiteBackupsV22 || window.MesahaSuiteBackupsV21 || window.MesahaSuiteBackupsV20 || window.MesahaSuiteBackupsV19 || window.MesahaSuiteBackupsV18 || window.MesahaSuiteBackupsV17 || window.MesahaSuiteBackupsV14 || window.MesahaSuiteBackupsV13 || window.MesahaSuiteBackupsV12 || window.MesahaSuiteBackupsV11 || window.MesahaSuiteBackupsV10 || window.MesahaSuiteBackupsV9 || window.MesahaSuiteBackupsV8).open();
      return true;
    }
    if (tool === "legacy-backups") {
      openLegacyBackups();
      return true;
    }
    if (id === "legacyBackupMine") {
      showMyLegacyBackups();
      return true;
    }
    if (id === "legacyBackupAll") {
      const input = $("legacyBackupSearch");
      if (input) input.value = "";
      renderLegacyBackups();
      return true;
    }
    if (tool === "telegram") {
      window.open(TELEGRAM_URL, "_blank", "noopener");
      return true;
    }
    if (tool === "admin") {
      location.href = "./yonetim/";
      return true;
    }
    if (tool === "about") {
      showInfo(
        "Orman İO",
        `<p>Google veya terminal/misafir oturumu Mesaha İO ve İstif İO tarafından ortak kullanılır.</p><p><b>Bekleyen işlem:</b> ${pendingOps.length}</p><p>Bölmeler offline indirildikten sonra iki uygulamada kayıt eklemeye hazır olur.</p><div class="about-action-grid"><a class="about-telegram" href="${esc(TELEGRAM_URL)}" target="_blank" rel="noopener">✈ Telegram Destek</a><a class="about-youtube" href="${esc(YOUTUBE_URL)}" target="_blank" rel="noopener">▶ YouTube Anlatım</a></div>`,
      );
      return true;
    }
    if (id === "notificationButton") {
      showInfo(
        "Sistem Durumu",
        `<div class="info-stat"><span>Oturum</span><strong>${esc(authType())}</strong></div><div class="info-stat"><span>Şeflik</span><strong>${esc(activeFolder()?.seflik || "-")}</strong></div><div class="info-stat"><span>Ormancı</span><strong>${currentForesters().length}</strong></div><div class="info-stat"><span>Bölme</span><strong>${currentDivisions().length}</strong></div><div class="info-stat"><span>Sunucu bekleyen</span><strong>${pendingOps.length}</strong></div>`,
      );
      return true;
    }
    if (id === "googleLoginBtn") {
      openGoogle();
      return true;
    }
    if (id === "guestLoginBtn") {
      openGuest();
      return true;
    }
    if (id === "terminalPairSubmitSuite") {
      claimTerminalFromSuite();
      return true;
    }
    if (id === "createTerminalCodeSuite") {
      createTerminalCodeSuite();
      return true;
    }
    if (id === "refreshTerminalDevicesSuite") {
      refreshTerminalDevicesSuite(false);
      return true;
    }
    if (target.dataset.revokeTerminalCode != null) {
      revokeTerminalDeviceSuite(target.dataset.revokeTerminalCode);
      return true;
    }
    if (target.dataset.copyTerminalCode != null) {
      const code = clean(target.dataset.copyTerminalCode);
      if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard
          .writeText(code)
          .then(() => toast("Terminal kodu kopyalandı."));
      else {
        try {
          const ta = document.createElement("textarea");
          ta.value = code;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          toast("Terminal kodu kopyalandı.");
        } catch {}
      }
      return true;
    }
    if (action === "home-scroll") { window.scrollTo({ top: 0, behavior: "smooth" }); return true; }
    if (action === "rename-seflik") {
      renameSeflik();
      return true;
    }
    if (action === "delete-seflik") {
      deleteSeflik();
      return true;
    }
    if (action === "leave-seflik") {
      leaveSeflik();
      return true;
    }
    if (action === "download-all-divisions") {
      downloadAllDivisions();
      return true;
    }
    if (target.dataset.removeForester != null) {
      removeOrmanci(Number(target.dataset.removeForester));
      return true;
    }
    if (target.dataset.yieldDivision != null) {
      const row = currentDivisions()[Number(target.dataset.yieldDivision)];
      if (!row) return true;
      selectedYieldBolme = clean(row.bolme_no);
      openModal("yieldModal");
      return true;
    }
    if (id === "yieldSaveButton") {
      saveYieldCalculation();
      return true;
    }
    if (id === "divisionDeleteConfirmButton") {
      confirmDivisionDelete();
      return true;
    }
    if (target.dataset.downloadDivision != null) {
      downloadDivision(Number(target.dataset.downloadDivision));
      return true;
    }
    if (target.dataset.deleteDivision != null) {
      deleteDivision(Number(target.dataset.deleteDivision));
      return true;
    }
    return false;
  }
  function bind() {
    document.addEventListener(
      "click",
      (ev) => {
        const t =
          ev.target && ev.target.closest
            ? ev.target.closest(
                "button,[data-modal],[data-app],[data-tool],.modal-close,.modal-cancel",
              )
            : null;
        handleAction(t, ev);
      },
      true,
    );
    document.addEventListener(
      "pointerup",
      (ev) => {
        const t =
          ev.target && ev.target.closest
            ? ev.target.closest(
                "button,[data-modal],[data-app],[data-tool],.modal-close,.modal-cancel",
              )
            : null;
        if (t) {
          try {
            t.blur();
          } catch {}
        }
      },
      { passive: true, capture: true },
    );
    const modalBackdrop = $("modalBackdrop");
    if (modalBackdrop) modalBackdrop.addEventListener("click", (event) => {
      if (event.target === modalBackdrop) closeModals();
    }, { passive: true });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.querySelector(".modal:not([hidden])")) closeModals();
    });
    window.addEventListener("pageshow", () => {
      if (!document.querySelector(".modal:not([hidden])")) unlockModalPage();
    }, { passive: true });
    $("suiteStartupRetry")?.addEventListener("click",()=>prepareOffline());
    $("legacyBackupSearch")?.addEventListener("input", renderLegacyBackups);
    $("terminalPairCodeSuite")?.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); claimTerminalFromSuite(); } });
    $("seflikForm").onsubmit = createSeflik;
    $("ormanciForm").onsubmit = searchOrmanci;
    $("bolmeForm").onsubmit = createBolme;
    window.addEventListener("online", () => setTimeout(() => checkSuiteUpdate(true), 600));
    updateVersionCorner(null);
    window.MesahaSuiteUI = {
      openLogin: () => openModal("loginModal"),
      openSeflik: openSeflikModal,
      openOrmanci: openOrmanciModal,
      openBolme: openBolmeModal,
      goApp,
      prepareOffline,
      sendPendingToServer,
      loadFolders,
      syncAppCaches,
      toast,
      openModal,
      closeModals,
    };
    window.addEventListener("online", () => {
      render();
      setTimeout(() => loadFolders(true), 0);
      setTimeout(pingAdminProfile, 300);
    });
    window.addEventListener("offline", render);
    let membershipRefreshTimer = 0;
    const refreshMembershipContext = () => {
      if (!cloudIdentity() || navigator.onLine === false || document.hidden) return;
      clearTimeout(membershipRefreshTimer);
      membershipRefreshTimer = setTimeout(() => loadFolders(false).catch(() => {}), 120);
    };
    window.addEventListener("focus", refreshMembershipContext, { passive: true });
    window.addEventListener("pageshow", refreshMembershipContext, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshMembershipContext();
    });
    window.addEventListener("mesaha-suite:membership-changed", refreshMembershipContext);
    setInterval(() => {
      if (!document.hidden) refreshMembershipContext();
    }, 45000);
    window.addEventListener("storage", () => {
      loadLocal();
      render();
    });
    window.addEventListener("mesaha-suite:shared-data-updated", (event) => {
      if (event && event.detail && event.detail.source === "suite-root") return;
      loadLocal();
      render();
    });
    window.addEventListener("mesaha-suite:sync-complete", (event) => {
      loadLocal();
      const results = event?.detail?.management?.cleanupResults;
      if (Array.isArray(results) && results.length) {
        const last = results[results.length - 1];
        showCleanupResult(last.result, last.bolmeNo);
      }
      render();
    });
    [
      "mesaha:google-access-approved",
      "mesaha:user-login",
      "mesaha:terminal-mode-enabled",
    ].forEach((n) =>
      window.addEventListener(n, () =>
        setTimeout(() => {
          loadLocal();
          render();
          loadFolders(true);
          pingAdminProfile();
        }, 80),
      ),
    );
    navigator.serviceWorker?.addEventListener("message", (e) => {
      if (e.data?.type === "CACHE_PROGRESS")
        setCacheStatus(
          e.data.text || "Dosyalar hazırlanıyor",
          e.data.percent || 0,
        );
      if (e.data?.type === "CACHE_READY") {
        cacheReady = true;
        setCacheStatus("Mesaha İO ve İstif İO çevrimdışı kullanıma hazır", 100);
      }
    });
  }
  async function init() {
    loadLocal();
    bind();
    render();
    showStartup(navigator.onLine===false?"Offline sürüm açılıyor":"Orman İO hazırlanıyor",navigator.onLine===false?"Cihazdaki çevrimdışı uygulama dosyaları kontrol ediliyor.":"Mesaha İO ve İstif İO çevrimdışı kullanım için hazırlanıyor.",8,false);
    setCacheStatus("Offline uygulama dosyaları kontrol ediliyor", 8);
    setTimeout(() => prepareOffline(), 30);
    setTimeout(() => closeStartup(0), 5200);
    if (location.hash && /access_token=|error=/.test(location.hash)) {
      try {
        const api = googleAuthApi();
        if (api) await api.boot(true);
      } catch (e) {
        toast(e.message, true);
      }
    }
    setTimeout(() => loadFolders().then(render), 40);
    setTimeout(pingAdminProfile, 700);
    try {
      const query = new URLSearchParams(location.search);
      if (query.get("open") === "account") {
        query.delete("open");
        history.replaceState({}, "", location.pathname + (query.toString() ? "?" + query : "") + location.hash);
        setTimeout(() => openModal("loginModal"), 180);
      }
    } catch (_) {}
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  window.addEventListener("online", () => {
    const destructive = pendingOps.some((item) => ["delete_seflik", "delete_division", "remove_member"].includes(item && item.type));
    if (destructive) autoSyncDestructive("Bekleyen silme işlemleri");
  });
})();
