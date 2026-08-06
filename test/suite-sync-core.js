(function () {
  "use strict";

  const VERSION = String(window.MESAHA_RELEASE?.version || "stable");
  const SUPABASE_URL = "https://swrbpdpotmirnmtqnuba.supabase.co";
  const ANON_KEY = "sb_publishable_G_ZFeUouDxg57Nne5pflfQ_cVGpdMbR";
  const SMOOTH = SUPABASE_URL + "/functions/v1/smooth-function";
  const DRIVE = SUPABASE_URL + "/functions/v1/istif-drive";
  const K = {
    session: "mesaha_supabase_v500_session",
    backupSession: "mesaha_supabase_v569_session_backup",
    access: "mesaha_google_access_v548",
    terminal: "mesaha_terminal_local_mode_v556",
    terminalOld: "mesaha_terminal_local_mode_v557",
    panel: "mesaha_panel_user_v316",
    settings: "cam_mesaha_ayarlar_v1",
    active: "mesaha_active_seflik_folder_v564",
    folders: "mesaha_suite_folder_cache_v4",
    foresters: "mesaha_suite_foresters_v4",
    divisions: "mesaha_suite_divisions_v4",
    divisionRecords: "mesaha_suite_division_records_v4",
    ready: "mesaha_suite_division_ready_v4",
    pending: "mesaha_suite_pending_ops_v4",
    dirty: "mesaha_suite_dirty_v8",
    last: "mesaha_suite_last_full_sync_v8",
    drive: "mesaha_suite_drive_status_v8",
    records: "cam_mesaha_kayitlari_v1",
    yieldTargets: "mesaha_suite_yield_targets_v12",
    folderCache: "mesaha_seflik_folder_cache_v529",
    syncTokens: "mesaha_suite_sync_tokens_v19",
    serverDeletedMesaha: "mesaha_suite_server_deleted_v28",
    istifTombstones: "deleted-records-v1",
  };

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
  const now = () => new Date().toISOString();
  const num = (v) => {
    const n = Number(String(v == null ? "" : v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  function session() {
    const shared = window.OrmanSuiteIdentity;
    if (shared && typeof shared.session === "function") return shared.session() || {};
    const primary = read(K.session, null);
    if (primary && primary.access_token) return primary;
    const backup = read(K.backupSession, null);
    if (backup && backup.access_token) { write(K.session, backup); return backup; }
    return {};
  }
  function terminal() {
    const shared = window.OrmanSuiteIdentity;
    if (shared && typeof shared.terminal === "function") return shared.terminal() || {};
    const primary = read(K.terminal, null);
    if (primary && primary.active) return primary;
    const old = read(K.terminalOld, null);
    if (old && old.active) { write(K.terminal, old); return old; }
    return {};
  }
  function identity() {
    const shared = window.OrmanSuiteIdentity;
    if (shared && typeof shared.identity === "function") return shared.identity();
    const s = session(),
      u = s.user || {},
      m = u.user_metadata || {},
      a = read(K.access, {}),
      p = read(K.panel, {}),
      t = terminal(),
      st = read(K.settings, {}),
      af = read(K.active, {});
    return {
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
          u.email ||
          "Kullanıcı",
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
        af.seflik || p.activeSeflik || p.seflik || t.seflik || st.seflik,
      ),
      seflikKey:
        clean(af.seflik_key || af.seflikKey) ||
        fold(af.seflik || p.activeSeflik || p.seflik || t.seflik || st.seflik),
      bolme: clean(p.bolmeNo || t.bolmeNo || st.bolmeNo),
      google: !!s.access_token,
    };
  }
  function cloudSyncAllowed() {
    const shared = window.OrmanSuiteIdentity;
    if (shared && typeof shared.cloudAllowed === "function") return shared.cloudAllowed();
    const t = terminal(), id = identity();
    return !!(id.google || (t && t.source === "pair_code" && t.pairedUserId && (t.terminalCode || t.terminalToken)));
  }
  function floatingSyncAllowed() {
    let path = "";
    try { path = String(location.pathname || "").toLowerCase(); } catch (_) {}
    /* Mesaha ekranında yüzen senkron düğmesi kullanılmaz. Senkronizasyon
       Orman İO ana ekranından veya İstif uygulamasından yönetilir. */
    if (/\/mesaha(?:\/|$)/.test(path)) return false;
    if (!/\/(?:mesaha|istif)(?:\/|$)/.test(path)) return false;
    return cloudSyncAllowed();
  }
  function authEngine() {
    return window.mesahaSupabase || window.mesahaSupabaseV383 || window.mesahaSupabaseV380 || window.mesahaCloud || null;
  }
  function googleSessionNeedsRefresh(force) {
    const s = session();
    if (!s || !s.refresh_token || navigator.onLine === false) return false;
    if (force) return true;
    const expiresAt = Number(s.expires_at || 0) * 1000;
    return !expiresAt || expiresAt <= Date.now() + 120000;
  }
  async function refreshGoogleSession(force) {
    if (!googleSessionNeedsRefresh(force)) return session();
    const engine = authEngine();
    const current = engine && typeof engine.getStoredSession === "function" ? engine.getStoredSession() : session();
    if (!current || !current.refresh_token || !engine || typeof engine.refreshSession !== "function") return current || session();
    try {
      const fresh = await engine.refreshSession(current);
      if (fresh && fresh.access_token) {
        try { window.dispatchEvent(new CustomEvent("mesaha:auth-session-restored", { detail: { userId: fresh.user && fresh.user.id, source: "suite-drive-refresh" } })); } catch {}
        return fresh;
      }
    } catch (error) {
      if (force) throw error;
    }
    return session();
  }
  function authHeaders(terminalRequest) {
    const s = session();
    const token = terminalRequest ? ANON_KEY : clean(s.access_token || ANON_KEY);
    return {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: "Bearer " + token,
    };
  }
  function isAuthSessionFailure(status, payload) {
    const message = clean(payload && (payload.error || payload.message || payload.reason));
    const code = clean(payload && (payload.code || payload.errorCode));
    return Number(status) === 401 ||
      ["AUTH_SESSION_INVALID", "JWT_EXPIRED", "INVALID_JWT"].includes(code) ||
      /oturum doğrulanamadı|oturum gecersiz|oturum geçersiz|jwt|token.*(?:expired|invalid|geçersiz|süresi)/i.test(message);
  }
  function terminalAuth() {
    const shared = window.OrmanSuiteIdentity;
    if (shared && typeof shared.terminalAuthPayload === "function") return shared.terminalAuthPayload();
    const t = terminal();
    return t && t.source === "pair_code" && t.pairedUserId ? {
      terminalCode: clean(t.terminalCode), terminalToken: clean(t.terminalToken),
      terminalPairedUserId: clean(t.pairedUserId), terminalPairedEmail: clean(t.pairedEmail),
      terminalDeviceId: clean(t.deviceId || t.terminalDeviceId), deviceId: clean(t.deviceId || t.terminalDeviceId)
    } : {};
  }
  function networkError(message, code) {
    const error = new Error(message);
    error.code = code || "NETWORK_ERROR";
    return error;
  }
  async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), Math.max(1000, timeoutMs || 20000)) : null;
    try {
      return await fetch(url, { ...(options || {}), ...(controller ? { signal: controller.signal } : {}) });
    } catch (error) {
      if (error && error.name === "AbortError") throw networkError("Bağlantı zaman aşımına uğradı", "NETWORK_TIMEOUT");
      if (navigator.onLine === false) throw networkError("İnternet bağlantısı yok", "OFFLINE");
      throw networkError("Sunucuya ulaşılamadı", "NETWORK_WEAK");
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  async function checkSyncConnection(timeoutMs) {
    if (navigator.onLine === false) throw networkError("İnternet yok", "OFFLINE");
    const response = await fetchWithTimeout(SMOOTH, {
      method: "OPTIONS",
      cache: "no-store",
    }, timeoutMs || 5000);
    if (!response || !response.ok) throw networkError("Bağlantı zayıf", "NETWORK_WEAK");
    return true;
  }
  let contextRepairPromise = null;
  function isFolderContextFailure(status, payload) {
    const code = clean(payload && (payload.code || payload.errorCode)).toUpperCase();
    const message = clean(payload && (payload.error || payload.message)).toLocaleLowerCase("tr-TR");
    return ["SEFLIK_CONTEXT_MISSING", "SEFLIK_NOT_FOUND", "SEFLIK_ACCESS_DENIED", "SEFLIK_OWNER_NOT_FOUND", "FOLDER_NOT_FOUND", "FOLDER_ACCESS_DENIED"].includes(code) ||
      (Number(status) >= 400 && /(şeflik|seflik|klasör|folder).*(bulunamad|erişim|eksik|uyuş|eşleş)/i.test(message));
  }
  async function repairFolderContextDirect() {
    if (contextRepairPromise) return contextRepairPromise;
    contextRepairPromise = (async () => {
      if (!cloudSyncAllowed() || navigator.onLine === false) return false;
      const terminalPayload = terminalAuth();
      const terminalRequest = !!clean(terminalPayload.terminalCode || terminalPayload.terminalToken);
      if (!terminalRequest) {
        try { await refreshGoogleSession(false); } catch {}
      }
      const old = folderContext();
      const response = await fetchWithTimeout(SMOOTH, {
        method: "POST",
        cache: "no-store",
        headers: authHeaders(terminalRequest),
        body: JSON.stringify({
          action: "seflik_folder_list_my_sefliks",
          source: "mesaha-suite-v51-context-repair",
          ...terminalPayload,
          seflik: old.seflik || identity().seflik,
          folderSeflik: old.seflik || identity().seflik,
          seflikKey: old.seflikKey || identity().seflikKey,
          seflik_key: old.seflikKey || identity().seflikKey,
          folderId: old.folderId || "",
        }),
      }, 20000);
      const out = await response.json().catch(() => ({}));
      if (!response.ok || out.ok === false) return false;
      const list = Array.isArray(out.folders) ? out.folders.filter(Boolean) : [];
      if (!list.length) return false;
      const active = read(K.active, {}) || {};
      const activeKey = clean(active.seflik_key || active.seflikKey);
      const activeId = clean(active.folder_id || active.folderId);
      const activeName = clean(active.seflik);
      const chosen = list.find((f) => activeId && clean(f.id || f.folder_id || f.folderId) === activeId) ||
        list.find((f) => activeKey && clean(f.seflik_key || f.seflikKey) === activeKey) ||
        list.find((f) => activeName && fold(f.seflik || f.name) === fold(activeName)) ||
        (list.length === 1 ? list[0] : null);
      if (!chosen) {
        const error = new Error("Birden fazla şeflik bulundu. Senkronizasyon için aktif şefliği seçin.");
        error.code = "ACTIVE_SEFLIK_REQUIRED";
        error.retryable = false;
        throw error;
      }
      applyCanonicalServerContext({
        ...out,
        folder: chosen,
        seflik: chosen.seflik || chosen.name,
        seflikKey: chosen.seflik_key || chosen.seflikKey,
        seflikFolderId: chosen.id || chosen.folder_id || chosen.folderId,
        membershipRole: chosen.role,
        isOwner: chosen.is_creator === true || chosen.isCreator === true,
      });
      return true;
    })().finally(() => { contextRepairPromise = null; });
    return contextRepairPromise;
  }
  async function post(url, action, data) {
    const terminalPayload = terminalAuth();
    const body = {
      action,
      source: "mesaha-suite-v51",
      ...terminalPayload,
      ...(data || {}),
    };
    const terminalRequest = !!clean(terminalPayload.terminalCode || terminalPayload.terminalToken);
    if (!terminalRequest) {
      try { await refreshGoogleSession(false); } catch {}
    }
    let r, j;
    let authRetried = false, contextRetried = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      r = await fetchWithTimeout(url, {
        method: "POST",
        cache: "no-store",
        headers: authHeaders(terminalRequest),
        body: JSON.stringify(body),
      }, 30000);
      j = await r.json().catch(() => ({}));
      if (r.ok && j.ok !== false) {
        try { applyCanonicalServerContext(j); } catch (_) {}
        return j;
      }
      if (!terminalRequest && !authRetried && isAuthSessionFailure(r.status, j)) {
        authRetried = true;
        try {
          await refreshGoogleSession(true);
          continue;
        } catch (refreshError) {
          const error = new Error("Google oturumu yenilenemedi. Orman İO hesabını kapatıp tekrar giriş yapın.");
          error.status = Number(refreshError && refreshError.status) || r.status;
          error.code = "AUTH_REFRESH_FAILED";
          error.retryable = false;
          throw error;
        }
      }
      if (!contextRetried && action !== "seflik_folder_list_my_sefliks" && isFolderContextFailure(r.status, j)) {
        contextRetried = true;
        try {
          if (await repairFolderContextDirect()) {
            const ctx = folderContext();
            if (ctx.seflik) { body.seflik = ctx.seflik; body.folderSeflik = ctx.seflik; }
            if (ctx.seflikKey) { body.seflikKey = ctx.seflikKey; body.seflik_key = ctx.seflikKey; }
            if (ctx.folderId) body.folderId = ctx.folderId;
            continue;
          }
        } catch (_) {}
      }
      break;
    }
    if (j && j.blocked === true) { try { window.dispatchEvent(new CustomEvent("mesaha:security-blocked", { detail: j })); } catch (_) {} }
    const error = new Error(clean(j && (j.error || j.message)) || "Sunucu hatası " + (r && r.status));
    error.status = r && r.status;
    error.code = clean(j && (j.code || j.errorCode) || "");
    error.retryable = j && j.retryable === true;
    error.detail = clean(j && j.detail || "");
    error.requestId = clean(j && j.requestId || "");
    error.retryAfter = num(j && (j.retry_after || j.retryAfter));
    throw error;
  }
  const edge = (action, data) => post(SMOOTH, action, contextualize(action, data, false));
  const drive = (action, data) => post(DRIVE, action, contextualize(action, data, true));

  function dirtyState() {
    const d = read(K.dirty, {});
    return d && typeof d === "object" ? d : {};
  }
  function mesahaManualDirtyMeta(meta) {
    const m = meta && typeof meta === "object" ? meta : {};
    return !!(
      m.resubmit === true ||
      m.manual === true ||
      m.manualSend === true ||
      m.sefligeGonder === true ||
      m.restore === true ||
      m.source === "manual" ||
      m.source === "seflige-gonder" ||
      (m.drive === true && m.merge === true)
    );
  }
  function sanitizeMesahaDirtyState() {
    const d = dirtyState();
    if (d.mesaha && d.mesaha.dirty && !mesahaManualDirtyMeta(d.mesaha.meta)) {
      delete d.mesaha;
      write(K.dirty, d);
      return true;
    }
    return false;
  }
  function markDirty(app, meta) {
    const target = app || "suite";
    const d = dirtyState();
    /* V31: Mesaha kayıtları yerel çalışır. Kayıt ekleme/düzenleme/silme,
       kullanıcı Şefliğe Gönder demeden yüzen senkron düğmesini açmaz. */
    if (target === "mesaha" && !mesahaManualDirtyMeta(meta)) {
      if (d.mesaha && !mesahaManualDirtyMeta(d.mesaha.meta)) delete d.mesaha;
      write(K.dirty, d);
      dispatch();
      return d;
    }
    d[target] = { dirty: true, at: now(), meta: meta || {} };
    write(K.dirty, d);
    dispatch();
    return d;
  }
  function clearDirty(app) {
    const d = dirtyState();
    if (app) delete d[app];
    else Object.keys(d).forEach((k) => delete d[k]);
    write(K.dirty, d);
    dispatch();
  }
  function mesahaDeleteKey(seflik, bolmeNo) {
    const af = activeFolder();
    const key = clean(af && (af.seflik_key || af.seflikKey)) || fold(seflik);
    return `${key}::${clean(bolmeNo)}`;
  }
  function suppressMesahaDivision(bolmeNo) {
    const af = activeFolder(), no = clean(bolmeNo);
    if (!af || !no) return false;
    const state = read(K.serverDeletedMesaha, {});
    state[mesahaDeleteKey(af.seflik, no)] = { at: now(), seflik: af.seflik, bolmeNo: no };
    write(K.serverDeletedMesaha, state);
    return true;
  }
  function allowMesahaDivisionResubmit(bolmeNo) {
    const af = activeFolder(), no = clean(bolmeNo);
    if (!af || !no) return false;
    const state = read(K.serverDeletedMesaha, {}), key = mesahaDeleteKey(af.seflik, no);
    if (state[key]) { delete state[key]; write(K.serverDeletedMesaha, state); }
    return true;
  }
  function mesahaDivisionSuppressed(seflik, bolmeNo) {
    const state = read(K.serverDeletedMesaha, {});
    return !!state[mesahaDeleteKey(seflik, bolmeNo)];
  }
  function reconcileMesahaSuppressions(seflik, list) {
    const state = read(K.serverDeletedMesaha, {});
    let changed = false;
    for (const row of Array.isArray(list) ? list : []) {
      if (num(row && (row.record_count || row.recordCount)) <= 0) continue;
      const key = mesahaDeleteKey(seflik, row.bolme_no || row.bolmeNo);
      if (state[key]) { delete state[key]; changed = true; }
    }
    if (changed) write(K.serverDeletedMesaha, state);
    return changed;
  }
  function pendingOps() {
    const x = read(K.pending, []);
    return Array.isArray(x) ? x : [];
  }
  function isDirty() {
    return (
      pendingOps().length > 0 ||
      Object.values(dirtyState()).some((x) => x && x.dirty)
    );
  }
  function dispatch() {
    try {
      window.dispatchEvent(
        new CustomEvent("mesaha-suite:sync-state", {
          detail: {
            dirty: isDirty(),
            pending: pendingOps().length,
            state: dirtyState(),
          },
        }),
      );
    } catch {}
    updateButton();
  }

  function toast(msg, bad) {
    if (
      window.MesahaSuiteUI &&
      typeof window.MesahaSuiteUI.toast === "function"
    )
      return window.MesahaSuiteUI.toast(msg, bad);
    let el = document.getElementById("suiteSyncToastV8");
    if (!el) {
      el = document.createElement("div");
      el.id = "suiteSyncToastV8";
      el.style.cssText =
        "position:fixed;left:50%;bottom:var(--suite-float-bottom-v8,90px);transform:translate(-50%,8px);z-index:2147483647;max-width:min(380px,calc(100vw - 28px));padding:11px 14px;border-radius:14px;background:#163f30;color:white;font:600 13px system-ui;box-shadow:0 12px 36px #0003;opacity:0;transition:.18s;pointer-events:none";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.background = bad ? "#8f2d2d" : "#163f30";
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translate(-50%,0)";
    });
    clearTimeout(toast.t);
    toast.t = setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translate(-50%,8px)";
    }, 3600);
  }

  let viewportBase = 0,
    lastDockBottom = -1,
    dockPositionQueued = false;
  function keyboardOpen() {
    const vv = window.visualViewport;
    if (vv) {
      viewportBase = Math.max(viewportBase, vv.height || 0);
      return viewportBase - (vv.height || 0) > 120;
    }
    const a = document.activeElement;
    return !!(
      a &&
      (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable) &&
      window.matchMedia &&
      window.matchMedia("(pointer: coarse)").matches
    );
  }
  function injectDockCss() {
    if (document.getElementById("suiteFloatCssV8")) return;
    const s = document.createElement("style");
    s.id = "suiteFloatCssV8";
    s.textContent = `
      #suiteFloatDockV8{position:fixed;left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));bottom:var(--suite-float-bottom-v8,max(10px,env(safe-area-inset-bottom)));z-index:2147482500;display:none;align-items:center;justify-content:space-between;gap:6px;pointer-events:none;transition:bottom .14s ease,opacity .14s ease,transform .14s ease}
      #suiteFloatDockV8.is-visible{display:flex;opacity:1;transform:translateY(0)}
      #suiteFloatDockV8>button{pointer-events:auto;height:42px!important;min-height:42px!important;max-height:42px!important;flex:none;border:1px solid rgba(255,255,255,.72);border-radius:12px;padding:0 11px!important;display:none;align-items:center;justify-content:center;gap:6px;font:900 11.5px/1 system-ui!important;box-shadow:0 6px 15px rgba(9,45,29,.16);touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
      #suiteFloatDockV8>button.is-visible{display:flex}
      #suiteSyncFabV8{width:126px;background:#174a32;color:#fff}
      #suiteHomeButtonV8{width:122px;margin-left:auto;background:rgba(255,255,255,.98);color:#174a32}
      #suiteSyncFabV8 .suite-sync-icon{font-size:13px;line-height:1}
      #suiteSyncFabCountV8{min-width:17px;height:17px;padding:0 4px;display:none;place-items:center;border-radius:99px;background:#fff;color:#174a32;font-size:9px}
      @media(max-width:430px){#suiteFloatDockV8>button{height:40px!important;min-height:40px!important;max-height:40px!important;padding:0 9px!important;font-size:10.5px!important}#suiteSyncFabV8{width:124px}#suiteHomeButtonV8{width:112px}#suiteFloatDockV8{gap:5px}}
    `;
    document.head.appendChild(s);
  }
  function getDock() {
    injectDockCss();
    let d = document.getElementById("suiteFloatDockV8");
    if (!d) {
      d = document.createElement("div");
      d.id = "suiteFloatDockV8";
      document.body.appendChild(d);
    }
    return d;
  }
  function isVisible(el) {
    if (!el) return false;
    const cs = getComputedStyle(el),
      r = el.getBoundingClientRect();
    return (
      cs.display !== "none" &&
      cs.visibility !== "hidden" &&
      Number(cs.opacity || 1) > 0.02 &&
      r.width > 30 &&
      r.height > 24 &&
      r.bottom > 0 &&
      r.top < window.innerHeight
    );
  }
  function bottomNav() {
    const selectors = [
      "#bottomNav",
      ".bottom-nav",
      ".mobile-bottom-nav",
      ".app-bottom-nav",
      "nav[role='tablist']",
    ];
    for (const sel of selectors)
      for (const el of document.querySelectorAll(sel))
        if (isVisible(el)) return el;
    return null;
  }
  function isSubApp() {
    return !!(
      document.documentElement.dataset.suiteSubapp ||
      (document.body && document.body.dataset.suiteSubapp)
    );
  }
  function positionDock() {
    const d = document.getElementById("suiteFloatDockV8");
    if (!d) return;
    const nav = bottomNav(),
      sub = isSubApp(),
      kb = keyboardOpen();
    let bottom = 12;
    if (nav) {
      const r = nav.getBoundingClientRect();
      bottom = Math.max(8, Math.round(window.innerHeight - r.top + 6));
    }
    if (bottom !== lastDockBottom) {
      lastDockBottom = bottom;
      document.documentElement.style.setProperty(
        "--suite-float-bottom-v8",
        bottom + "px",
      );
    }
    const any = !!d.querySelector("button.is-visible");
    const allowed = !kb && any && (!sub || !!nav);
    if (d.classList.contains("is-visible") !== allowed)
      d.classList.toggle("is-visible", allowed);
    const pointer = allowed ? "auto" : "none";
    if (d.style.pointerEvents !== pointer) d.style.pointerEvents = pointer;
  }
  function queueDockPosition() {
    if (dockPositionQueued) return;
    dockPositionQueued = true;
    requestAnimationFrame(() => {
      dockPositionQueued = false;
      positionDock();
    });
  }
  function reliablePress(btn, fn) {
    let last = 0;
    const fire = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const n = Date.now();
      if (n - last < 500) return;
      last = n;
      try {
        btn.blur();
      } catch {}
      Promise.resolve()
        .then(fn)
        .catch((err) => toast(clean((err && err.message) || err), true));
    };
    btn.addEventListener("pointerup", fire, { capture: true });
    btn.addEventListener("click", fire, { capture: true });
  }
  function installButton() {
    const existing = document.getElementById("suiteSyncFabV8");
    if (!floatingSyncAllowed()) {
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      return;
    }
    if (existing) return;
    const b = document.createElement("button");
    b.id = "suiteSyncFabV8";
    b.type = "button";
    b.innerHTML =
      '<span class="suite-sync-icon" aria-hidden="true">↻</span><b>Senkronize Et</b><small id="suiteSyncFabCountV8"></small>';
    reliablePress(b, () => syncAll({ source: "floating-button" }));
    getDock().appendChild(b);
    updateButton();
  }
  function registerHomeButton(handler) {
    let b = document.getElementById("suiteHomeButtonV8");
    if (!b) {
      b = document.createElement("button");
      b.id = "suiteHomeButtonV8";
      b.type = "button";
      b.innerHTML = '<span aria-hidden="true">⌂</span><b>Orman İO</b>';
      getDock().appendChild(b);
      reliablePress(
        b,
        handler ||
          (() => {
            location.href = "../";
          }),
      );
    }
    b.classList.add("is-visible");
    positionDock();
    return b;
  }
  function updateButton() {
    if (!floatingSyncAllowed()) {
      const stale = document.getElementById("suiteSyncFabV8");
      if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
      positionDock();
      return;
    }
    const b = document.getElementById("suiteSyncFabV8");
    if (!b) return;
    const count =
      pendingOps().length +
      Object.values(dirtyState()).filter((x) => x && x.dirty).length;
    b.classList.toggle("is-visible", isDirty());
    const c = document.getElementById("suiteSyncFabCountV8");
    if (c) {
      c.textContent = String(count);
      c.style.display = count ? "grid" : "none";
    }
    positionDock();
  }

  const round3 = (value) => Number((Number(value) || 0).toFixed(3));
  function recordQuantity(r) {
    const raw = num(r && (r.quantity ?? r.adet ?? r.count ?? 1));
    return Math.max(1, Math.round(raw || 1));
  }
  function volume(r) {
    const d = num(r && (r.diameter ?? r.cap ?? r.diameterCm)),
      l = num(r && (r.length ?? r.boy ?? r.lengthM)),
      q = recordQuantity(r || {});
    if (d > 0 && l > 0) return round3(((Math.PI * Math.pow(d / 100, 2)) / 4) * l * q);
    const explicit = num(r && (r.sourceVolumeM3 ?? r.totalVolume ?? r.total_volume ?? r.volume ?? r.hacim));
    return round3(explicit);
  }
  function canonicalMesahaStats(input) {
    const list = Array.isArray(input) ? input : [];
    const unique = new Map();
    list.forEach((raw, index) => {
      const r = raw && typeof raw === "object" ? raw : null;
      if (!r || r.deleted === true || r.isDeleted === true || clean(r.status).toLocaleLowerCase("tr-TR") === "deleted") return;
      const key = clean(r.barcode || r.barkod || r.barkodNo || r.barkod_no || r.id || r.recordId || r.record_id) ||
        [clean(r.treeType || r.tree_type), clean(r.productType || r.product_type), clean(r.diameter || r.cap), clean(r.length || r.boy), clean(r.productionDate), index].join("|");
      unique.set(key.toLocaleUpperCase("tr-TR"), r);
    });
    let itemCount = 0, totalVolume = 0;
    const treeTotals = {}, productTotals = {};
    for (const r of unique.values()) {
      const quantity = recordQuantity(r), rowM3 = volume(r);
      itemCount += quantity; totalVolume += rowM3;
      const tree = clean(r.treeType || r.tree_type || r.species || r.agacTuru || r.agacAdi || "Belirsiz") || "Belirsiz";
      const product = clean(r.productType || r.product_type || r.odunTuru || r.odunAdi || "Belirsiz") || "Belirsiz";
      const add = (target, name) => {
        const old = target[name] || { adet: 0, count: 0, m3: 0 };
        old.adet += quantity; old.count += quantity; old.m3 = round3(old.m3 + rowM3); target[name] = old;
      };
      add(treeTotals, tree); add(productTotals, product);
    }
    return {
      rowCount: unique.size,
      itemCount,
      recordCount: itemCount,
      adet: itemCount,
      totalVolume: round3(totalVolume),
      totalM3: round3(totalVolume),
      m3: round3(totalVolume),
      treeTotals,
      productTotals,
      records: [...unique.values()],
    };
  }
  async function sendExactBackupStats(stats, backupResult, scope) {
    if (!stats || !stats.rowCount || navigator.onLine === false || !cloudSyncAllowed()) return false;
    const id = identity(), ctx = folderContext();
    const backupId = clean(backupResult && (backupResult.fileId || backupResult.backup?.id || backupResult.id)) || String(Date.now());
    try {
      await edge("stats_sync", {
        reason: "drive-backup",
        idempotencyKey: ["drive-backup", backupId, stats.rowCount, stats.itemCount, stats.totalVolume].join(":"),
        name: id.name,
        seflik: ctx.seflik || id.seflik,
        seflikKey: ctx.seflikKey || id.seflikKey,
        folderId: ctx.folderId,
        bolmeNo: clean(scope && scope.bolmeNo),
        operationRowCount: stats.rowCount,
        operationItemCount: stats.itemCount,
        operationTotalVolume: stats.totalVolume,
        recordCount: stats.itemCount,
        totalRecords: stats.itemCount,
        adet: stats.itemCount,
        totalM3: stats.totalVolume,
        m3: stats.totalVolume,
        treeTotals: stats.treeTotals,
        productTotals: stats.productTotals,
        scopeText: clean(scope && scope.text) || "Drive yedeği",
        scopeMode: "drive-backup",
        backupFileId: backupId,
        appVersion: VERSION,
        source: "mesaha-suite-v51-exact-backup-stats",
      });
      return true;
    } catch (_) { return false; }
  }
  function activeFolder() {
    const shared = window.OrmanSuiteIdentity;
    if (shared && typeof shared.activeFolder === "function") return shared.activeFolder();
    const a = read(K.active, {}) || {}, fs = read(K.folders, []);
    const rows = (Array.isArray(fs) ? fs : []).filter((f) => f && !f.deleted);
    const activeId = clean(a.folder_id || a.folderId);
    const activeKey = clean(a.seflik_key || a.seflikKey);
    const activeName = clean(a.seflik);
    return rows.find((f) => activeId && clean(f.id || f.folder_id || f.folderId) === activeId) ||
      rows.find((f) => activeKey && clean(f.seflik_key || f.seflikKey) === activeKey) ||
      rows.find((f) => activeName && fold(f.seflik || f.name) === fold(activeName)) ||
      (activeName || activeKey || activeId ? a : null);
  }
  function folderContext() {
    const af = activeFolder(), id = identity();
    const seflik = clean((af && af.seflik) || id.seflik);
    return {
      seflik,
      seflikKey:
        clean(af && (af.seflik_key || af.seflikKey)) ||
        clean(id.seflikKey) ||
        fold(seflik),
      folderId: clean(af && (af.id || af.folder_id || af.folderId)),
    };
  }
  function applyCanonicalServerContext(payload) {
    const shared = window.OrmanSuiteIdentity;
    const canonical = shared && typeof shared.applyCanonicalContext === "function"
      ? shared.applyCanonicalContext(payload)
      : null;
    const data = payload && typeof payload === "object" ? payload : {};
    const access = data.access && typeof data.access === "object" ? data.access : {};
    let folder = data.folder && typeof data.folder === "object" ? data.folder : {};
    if (!Object.keys(folder).length && Array.isArray(data.folders)) {
      const active = read(K.active, {}) || {};
      const activeKey = clean(data.active_seflik_key || active.seflik_key || active.seflikKey);
      const activeId = clean(data.active_folder_id || active.folder_id || active.folderId);
      const activeName = clean(data.active_seflik || active.seflik);
      folder = data.folders.find((row) => row && (
        (activeId && clean(row.id || row.folder_id || row.folderId) === activeId) ||
        (activeKey && clean(row.seflik_key || row.seflikKey) === activeKey) ||
        (activeName && fold(row.seflik || row.name) === fold(activeName))
      )) || (data.folders.length === 1 ? data.folders[0] : {});
    }
    const seflik = clean((canonical && canonical.seflik) || data.seflik || access.seflik || access.canonical_seflik || folder.seflik || folder.name);
    const seflikKey = clean((canonical && canonical.seflik_key) || data.seflikKey || data.seflik_key || access.seflikKey || access.seflik_key || folder.seflik_key || folder.seflikKey || folder.key);
    const folderId = clean((canonical && canonical.folder_id) || data.seflikFolderId || data.seflik_folder_id || access.seflikFolderId || access.seflik_folder_id || folder.id || folder.folder_id || folder.folderId);
    if (!seflik && !seflikKey && !folderId) return false;
    const currentActive = read(K.active, {}) || {};
    const next = {
      ...currentActive,
      seflik: seflik || clean(currentActive.seflik),
      seflik_key: seflikKey || clean(currentActive.seflik_key || currentActive.seflikKey) || fold(seflik),
      folder_id: folderId || clean(currentActive.folder_id || currentActive.folderId),
      role: clean(data.membershipRole || access.role || folder.role || currentActive.role),
      creator: Object.prototype.hasOwnProperty.call(data, "isOwner") ? data.isOwner === true : (folder.is_creator === true || folder.isCreator === true || currentActive.creator === true),
      owner_user_id: clean(data.ownerUserId || access.owner_user_id || folder.owner_user_id || folder.created_by_user_id || currentActive.owner_user_id),
      owner_email: clean(data.ownerEmail || access.owner_email || folder.owner_email || folder.created_by_email || currentActive.owner_email),
      owner_name: clean(data.ownerName || access.owner_name || folder.owner_name || folder.created_by_name || currentActive.owner_name),
      updatedAt: Date.now(),
    };
    write(K.active, next);
    const folders = read(K.folders, []);
    if (Array.isArray(folders)) {
      let found = folders.find((item) => item && (
        (next.folder_id && clean(item.id || item.folder_id || item.folderId) === next.folder_id) ||
        (next.seflik_key && clean(item.seflik_key || item.seflikKey) === next.seflik_key) ||
        (next.seflik && fold(item.seflik) === fold(next.seflik))
      ));
      const merged = {
        ...(found || {}), id: next.folder_id || clean(found && (found.id || found.folder_id || found.folderId)),
        seflik: next.seflik, seflik_key: next.seflik_key,
        role: next.role || clean(found && found.role), is_creator: next.creator,
        owner_user_id: next.owner_user_id, owner_email: next.owner_email, owner_name: next.owner_name,
        updatedAt: Date.now(),
      };
      if (found) Object.assign(found, merged); else folders.unshift(merged);
      write(K.folders, folders);
    }
    const panel = read(K.panel, {}) || {};
    panel.seflik = next.seflik; panel.activeSeflik = next.seflik;
    panel.seflikKey = next.seflik_key; panel.activeSeflikKey = next.seflik_key;
    panel.updatedAt = Date.now(); write(K.panel, panel);
    const settings = read(K.settings, {}) || {};
    settings.seflik = next.seflik; settings.seflikKey = next.seflik_key; settings.seflik_key = next.seflik_key;
    write(K.settings, settings);
    try { window.dispatchEvent(new CustomEvent("mesaha-suite:folder-context", { detail: next })); } catch {}
    return true;
  }

  function contextualize(action, data, isDrive) {
    const out = { ...(data || {}) };
    const ctx = folderContext();
    const explicitName = clean(out.seflik || out.folderSeflik || out.seflikFolder);
    const sameContext = !explicitName || !ctx.seflik || fold(explicitName) === fold(ctx.seflik);
    const needsFolder = !!isDrive || /^seflik_folder_/.test(clean(action)) || /^istif_record_/.test(clean(action));
    if (!needsFolder) return out;
    if (!out.seflik && ctx.seflik) out.seflik = ctx.seflik;
    if (!out.folderSeflik && clean(out.seflik)) out.folderSeflik = clean(out.seflik);
    if (!out.seflikKey && !out.seflik_key) {
      const key = sameContext ? ctx.seflikKey : fold(explicitName);
      if (key) {
        out.seflikKey = key;
        out.seflik_key = key;
      }
    } else {
      const key = clean(out.seflikKey || out.seflik_key);
      if (key) {
        out.seflikKey = key;
        out.seflik_key = key;
      }
    }
    if (!out.folderId && sameContext && ctx.folderId) out.folderId = ctx.folderId;
    return out;
  }
  function normalizeDivision(raw, af) {
    const no = clean(raw && (raw.bolme_no || raw.bolmeNo || raw.bolme));
    if (!no || !af) return null;
    return {
      ...raw,
      bolme_no: no,
      bolmeNo: no,
      seflik: af.seflik,
      seflik_key: clean(af.seflik_key || af.seflikKey) || fold(af.seflik),
      record_count: num(raw.record_count || raw.recordCount),
      total_volume: num(raw.total_volume || raw.totalVolume),
      updated_at: raw.updated_at || raw.updatedAt || now(),
      status: raw.status || "open",
    };
  }
  function syncFolderCache(af, list) {
    write(K.folderCache, {
      at: now(),
      seflik: af ? af.seflik : "",
      divisions: (list || []).map((d) => ({
        ...d,
        bolme_no: d.bolme_no,
        record_count: num(d.record_count),
        total_volume: num(d.total_volume),
      })),
    });
    try {
      window.dispatchEvent(
        new CustomEvent("mesaha-suite:shared-data-updated", {
          detail: { seflik: (af && af.seflik) || "", divisions: list || [] },
        }),
      );
    } catch {}
  }
  async function refreshFolderData(options) {
    options = options || {};
    const af = activeFolder();
    if (!af) return { ok: false, complete: false, reason: "no-folder" };
    if (navigator.onLine === false) return { ok: false, complete: false, offline: true };
    const key = clean(af.seflik_key || af.seflikKey) || fold(af.seflik);
    const divisionsStore = read(K.divisions, {}), recordsStore = read(K.divisionRecords, {}), forestersStore = read(K.foresters, {});
    let list = Array.isArray(divisionsStore[key]) ? divisionsStore[key] : [];
    const errors = [];
    let truncated = false;
    try {
      const out = await edge("seflik_folder_list", { seflik: af.seflik, folderSeflik: af.seflik });
      const hasRemoteList = Array.isArray(out && out.divisions) || Array.isArray(out && out.summaries);
      if (!hasRemoteList) throw new Error("Sunucu geçerli bölme listesi döndürmedi");
      const authoritative = authoritativeSyncResponse(out);
      truncated = truncated || !authoritative;
      const remote = (Array.isArray(out?.divisions) ? out.divisions : out.summaries).map((d) => normalizeDivision(d, af)).filter(Boolean);
      const oldByNo = new Map((Array.isArray(list) ? list : []).map((d) => [clean(d && (d.bolme_no || d.bolmeNo)), d]));
      const remoteNos = new Set(remote.map((d) => clean(d.bolme_no)));
      const localPending = list.filter((d) => d && (d.pending || d.local_pending) && !remoteNos.has(clean(d.bolme_no || d.bolmeNo)));
      const remoteMerged = remote.map((d) => {
        const no = clean(d.bolme_no);
        return { ...(oldByNo.get(no) || {}), ...d, deleted: false, pending: false, local_pending: false };
      });
      const preservedMissing = authoritative ? [] : list.filter((d) => {
        const no = clean(d && (d.bolme_no || d.bolmeNo));
        return no && !remoteNos.has(no) && !(d.pending || d.local_pending);
      });
      list = remoteMerged.concat(localPending, preservedMissing);
      const nextNos = new Set(list.map((d) => clean(d && (d.bolme_no || d.bolmeNo))));
      if (authoritative) {
        const readyStore = read(K.ready, {}), yieldStore = read(K.yieldTargets, {});
        for (const [no, oldRow] of oldByNo.entries()) {
          if (!no || nextNos.has(no) || (oldRow && (oldRow.pending || oldRow.local_pending))) continue;
          if (recordsStore[key] && typeof recordsStore[key] === "object") delete recordsStore[key][no];
          delete readyStore[`${key}::${no}`];
          delete yieldStore[`${key}::${no}`];
        }
        write(K.ready, readyStore);
        write(K.yieldTargets, yieldStore);
        reconcileMesahaSuppressions(af.seflik, remote);
      }
      divisionsStore[key] = list;
      write(K.divisions, divisionsStore);
      write(K.divisionRecords, recordsStore);
    } catch (e) {
      errors.push(clean(e?.message || e) || "Bölme listesi alınamadı");
      if (options.strict || !options.quiet) throw e;
    }
    try {
      const out = await edge("seflik_folder_list_members", { seflik: af.seflik, folderSeflik: af.seflik });
      const members = (Array.isArray(out.members) ? out.members : []).map((m) => ({
        id: clean(m.email).toLocaleLowerCase("tr-TR") || clean(m.user_id || m.id), userId: clean(m.user_id || m.member_user_id),
        name: clean(m.name || m.canonical_name || m.email), email: clean(m.email).toLocaleLowerCase("tr-TR"),
        avatarUrl: clean(m.avatar_url || m.avatarUrl), role: clean(m.role || m.member_role || "member"), isSelf: !!m.is_self, updatedAt: now(),
      })).filter((m) => m.name);
      const authoritativeMembers = authoritativeSyncResponse(out);
      if (authoritativeMembers) forestersStore[key] = members;
      else if (members.length) {
        const oldMembers = Array.isArray(forestersStore[key]) ? forestersStore[key] : [];
        const mergedMembers = new Map(oldMembers.map((row) => [clean(row.email).toLocaleLowerCase("tr-TR") || clean(row.userId || row.id), row]));
        members.forEach((row) => {
          const memberKey = clean(row.email).toLocaleLowerCase("tr-TR") || clean(row.userId || row.id);
          if (memberKey) mergedMembers.set(memberKey, { ...(mergedMembers.get(memberKey) || {}), ...row });
        });
        forestersStore[key] = Array.from(mergedMembers.values());
      }
      write(K.foresters, forestersStore);
    } catch (e) {
      errors.push(clean(e?.message || e) || "Üye listesi alınamadı");
      if (options.strict) throw e;
    }
    if (options.includeRecords) {
      recordsStore[key] = recordsStore[key] && typeof recordsStore[key] === "object" ? recordsStore[key] : {};
      for (const d of list) {
        const no = clean(d.bolme_no), cached = recordsStore[key][no], expected = num(d.record_count);
        const stale = options.forceRecords || !Array.isArray(cached) || (expected >= 0 && cached.length !== expected);
        if (!stale) continue;
        try {
          const out = await edge("seflik_folder_read", { seflik: af.seflik, folderSeflik: af.seflik, bolmeNo: no });
          if (!Array.isArray(out.records)) throw new Error(`Bölme ${no} geçerli kayıt listesi döndürmedi`);
          if (!authoritativeSyncResponse(out)) {
            truncated = true;
            throw new Error(`Bölme ${no} verisi eksik geldi; eski offline kayıt korundu`);
          }
          recordsStore[key][no] = out.records;
          d.record_count = out.records.length;
          d.total_volume = num(out.total_volume || d.total_volume || out.records.reduce((s, row) => s + volume(row.record_data || row), 0));
        } catch (e) {
          errors.push(clean(e?.message || e) || `Bölme ${no} indirilemedi`);
          if (options.strict || (options.forceRecords && !options.quiet)) throw e;
        }
      }
      write(K.divisionRecords, recordsStore);
      divisionsStore[key] = list;
      write(K.divisions, divisionsStore);
    }
    syncFolderCache(af, list);
    const result = { ok: errors.length === 0 && !truncated, complete: errors.length === 0 && !truncated, truncated, divisions: list, records: recordsStore[key] || {}, errors, error: errors[0] || "" };
    if (options.strict && !result.ok) throw new Error(result.error || "Offline veri hazırlığı tamamlanamadı");
    return result;
  }
  async function loadDivisionRecords(bolmeNo, force) {
    const af = activeFolder();
    if (!af) throw new Error("Aktif şeflik bulunamadı");
    const key = clean(af.seflik_key || af.seflikKey) || fold(af.seflik),
      no = clean(bolmeNo),
      store = read(K.divisionRecords, {});
    if (!force && store[key] && Array.isArray(store[key][no]))
      return store[key][no];
    if (navigator.onLine === false)
      return store[key] && Array.isArray(store[key][no]) ? store[key][no] : [];
    const out = await edge("seflik_folder_read", {
      seflik: af.seflik,
      folderSeflik: af.seflik,
      bolmeNo: no,
    });
    if (!Array.isArray(out.records)) throw new Error("Sunucu geçerli bölme kayıtları döndürmedi");
    if (!authoritativeSyncResponse(out))
      throw new Error("Bölme verisi doğrulanamadı; mevcut offline kayıt korundu. Önce V68 sunucu fonksiyonlarını yayınlayın.");
    store[key] = store[key] || {};
    store[key][no] = out.records;
    write(K.divisionRecords, store);
    try {
      window.dispatchEvent(
        new CustomEvent("mesaha-suite:shared-data-updated", {
          detail: { seflik: af.seflik, bolmeNo: no },
        }),
      );
    } catch {}
    return store[key][no];
  }

  function clearDivisionRecordCache(bolmeNo) {
    const af = activeFolder();
    if (!af) return false;
    const key = clean(af.seflik_key || af.seflikKey) || fold(af.seflik), no = clean(bolmeNo);
    const recordsStore = read(K.divisionRecords, {}), divisionsStore = read(K.divisions, {});
    if (recordsStore[key] && typeof recordsStore[key] === "object") delete recordsStore[key][no];
    write(K.divisionRecords, recordsStore);
    if (Array.isArray(divisionsStore[key])) {
      divisionsStore[key] = divisionsStore[key].map((d) => clean(d && (d.bolme_no || d.bolmeNo)) === no ? { ...d, record_count: 0, recordCount: 0, total_volume: 0, totalVolume: 0, contributors: [], drive_backed_up: false, updated_at: now() } : d);
      write(K.divisions, divisionsStore);
      syncFolderCache(af, divisionsStore[key]);
    }
    return true;
  }
  async function deleteMesahaDivisionRecords(bolmeNo) {
    const af = activeFolder();
    if (!af) throw new Error("Aktif şeflik bulunamadı");
    const no = clean(bolmeNo);
    if (!no) throw new Error("Bölme numarası gerekli");
    const out = await edge("seflik_folder_delete_records", {
      seflik: af.seflik,
      folderSeflik: af.seflik,
      seflikKey: clean(af.seflik_key || af.seflikKey),
      bolmeNo: no,
      confirmBolme: no,
    });
    clearDivisionRecordCache(no);
    suppressMesahaDivision(no);
    const localSettings = read(K.settings, {});
    if (clean(localSettings.bolmeNo || localSettings.bolme_no) === no) clearDirty("mesaha");
    try { window.dispatchEvent(new CustomEvent("mesaha-suite:mesaha-deleted", { detail: { seflik: af.seflik, bolmeNo: no, result: out } })); } catch {}
    return out;
  }

  function duplicateLike(error) {
    const text = clean(error && (error.message || error.error || error));
    return /already|exists|duplicate|unique|23505|mevcut|zaten|aynı bölme/i.test(text);
  }
  function pendingKey(item) {
    const p = (item && item.payload) || {};
    return [item && item.type, fold(p.seflik || p.oldName || ""), fold(p.bolmeNo || p.newName || p.member_email || p.email || p.member_user_id || "")].join("::");
  }
  function enqueuePending(type, payload) {
    const list = pendingOps(), item = { id: "suite_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8), type, payload: payload || {}, createdAt: now() };
    const key = pendingKey(item), index = list.findIndex((x) => pendingKey(x) === key);
    if (index >= 0) list[index] = { ...list[index], payload: { ...(list[index].payload || {}), ...(payload || {}) }, updatedAt: now() };
    else list.push(item);
    write(K.pending, list);
    markDirty("suite", { type, ...(payload || {}) });
    return index >= 0 ? list[index] : item;
  }
  function createOfflineDivision(bolmeNo, location, options) {
    const af = activeFolder();
    if (!af) throw new Error("Önce Orman İO ana menüsünden şeflik seçin");
    const no = clean(bolmeNo), loc = clean(location), key = clean(af.seflik_key || af.seflikKey) || fold(af.seflik);
    if (!no) throw new Error("Bölme numarasını yazın");
    const store = read(K.divisions, {}), ready = read(K.ready, {}), list = Array.isArray(store[key]) ? store[key] : [];
    const match = list.findIndex((d) => d && !d.deleted && fold(d.bolme_no || d.bolmeNo) === fold(no));
    const existing = match >= 0 ? list[match] : null;
    const serverKnown = !!(existing && !existing.pending && !existing.local_pending);
    const row = {
      ...(existing || {}), bolme_no: clean(existing && (existing.bolme_no || existing.bolmeNo)) || no,
      bolmeNo: clean(existing && (existing.bolme_no || existing.bolmeNo)) || no,
      seflik: af.seflik, seflik_key: key, location: loc || clean(existing && existing.location), status: "open", deleted: false,
      offline_ready: true, pending: serverKnown ? !!existing.pending : true, local_pending: serverKnown ? !!existing.local_pending : true,
      updated_at: now(), created_at: (existing && (existing.created_at || existing.createdAt)) || now(),
      created_by_name: clean(existing && (existing.created_by_name || existing.createdByName)) || identity().name,
    };
    if (match >= 0) list[match] = row; else list.unshift(row);
    store[key] = list; ready[`${key}::${row.bolme_no}`] = { ready: true, at: now(), recordCount: num(row.record_count) };
    write(K.divisions, store); write(K.ready, ready);
    const st = read(K.settings, {}), pn = read(K.panel, {}); st.bolmeNo = row.bolme_no; pn.bolmeNo = row.bolme_no; write(K.settings, st); write(K.panel, pn);
    if (!serverKnown) enqueuePending("create_division", { seflik: af.seflik, seflik_key: key, bolmeNo: row.bolme_no, location: row.location || "" });
    syncFolderCache(af, list);
    try { window.dispatchEvent(new CustomEvent("mesaha-suite:shared-data-updated", { detail: { seflik: af.seflik, bolmeNo: row.bolme_no, created: match < 0, merged: match >= 0 } })); } catch {}
    return { ok: true, created: match < 0, merged: match >= 0, serverKnown, division: row };
  }

  function enrichPendingMemberPayload(item) {
    if (!item || !["add_member", "remove_member"].includes(clean(item.type))) return item;
    const p = item.payload && typeof item.payload === "object" ? item.payload : (item.payload = {});
    if (clean(p.member_email || p.email)) return item;
    const userId = clean(p.member_user_id || p.user_id);
    if (!userId) return item;
    const stores = read(K.foresters, {});
    const rows = Object.values(stores && typeof stores === "object" ? stores : {}).flatMap((list) => Array.isArray(list) ? list : []);
    const match = rows.find((row) => row && clean(row.userId || row.user_id || row.id) === userId && clean(row.email));
    if (match) {
      p.member_email = lower(match.email);
      p.email = lower(match.email);
      item.updatedAt = now();
    }
    return item;
  }
  async function syncManagement() {
    const list = pendingOps();
    if (!list.length) {
      clearDirty("suite");
      return { done: 0, left: 0 };
    }
    const remain = [];
    const cleanupResults = [];
    let done = 0;
    for (const item of list) {
      try {
        enrichPendingMemberPayload(item);
        const p = item.payload || {};
        if (item.type === "create_seflik")
          await edge("seflik_folder_create_seflik", { seflik: p.seflik });
        else if (item.type === "delete_seflik")
          await edge("seflik_folder_delete_seflik", {
            seflik: p.seflik,
            confirmSeflik: p.seflik,
          });
        else if (item.type === "rename_seflik")
          await edge("seflik_folder_rename_seflik", {
            seflik: p.oldName,
            oldSeflik: p.oldName,
            newSeflik: p.newName,
            new_seflik: p.newName,
          });
        else if (item.type === "add_member")
          await edge("seflik_folder_add_member", {
            seflik: p.seflik,
            folderSeflik: p.seflik,
            seflikKey: p.seflikKey || p.seflik_key,
            seflik_key: p.seflik_key || p.seflikKey,
            member_user_id: p.member_user_id,
            member_email: p.member_email || p.email,
          });
        else if (item.type === "remove_member")
          await edge("seflik_folder_remove_member", {
            seflik: p.seflik,
            folderSeflik: p.seflik,
            seflikKey: p.seflikKey || p.seflik_key,
            seflik_key: p.seflik_key || p.seflikKey,
            member_user_id: p.member_user_id,
            member_email: p.member_email || p.email,
          });
        else if (item.type === "create_division") {
          try {
            await edge("seflik_folder_create_division", {
              seflik: p.seflik,
              bolmeNo: p.bolmeNo,
              location: p.location || "",
            });
          } catch (e) {
            if (!duplicateLike(e)) throw e;
          }
        }
        else if (item.type === "delete_division") {
          const cleanup = await drive("division_delete_all", {
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
          cleanupResults.push({ result: cleanup, bolmeNo: p.bolmeNo, seflik: p.seflik });
        }
        done++;
      } catch (e) {
        item.error = clean(e.message || e);
        remain.push(item);
      }
    }
    write(K.pending, remain);
    if (!remain.length) clearDirty("suite");
    return { done, left: remain.length, cleanupResults };
  }
  function mesahaRecordKey(row, index) {
    const r = row && row.record_data && typeof row.record_data === "object" ? row.record_data : (row || {});
    const barcode = clean(r.barcode || r.barkodNo || r.barkod_no || (row && row.barcode));
    if (barcode) return "barcode::" + barcode.toLocaleUpperCase("tr-TR");
    const id = clean(r.id || r.recordId || (row && (row.record_key || row.id)));
    return id ? "id::" + id : "row::" + String(index == null ? Math.random() : index);
  }
  function mesahaRowTimestamp(row) {
    const source = row && row.record_data && typeof row.record_data === "object" ? row.record_data : (row || {});
    const raw = clean(source.updatedAt || source.updated_at || source.createdAt || source.created_at || row?.updated_at || row?.created_at);
    const value = raw ? Date.parse(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  }
  function mergeMesahaRows(baseRows, incomingRows) {
    const map = new Map();
    const put = (row, i, sourceName) => {
      const normalized = { ...(row && row.record_data ? row.record_data : (row || {})) };
      const key = mesahaRecordKey(normalized, sourceName + "_" + i);
      const current = map.get(key);
      if (!current) {
        map.set(key, { row: normalized, source: sourceName });
        return;
      }
      const currentTime = mesahaRowTimestamp(current.row);
      const incomingTime = mesahaRowTimestamp(normalized);
      if (incomingTime > currentTime || (incomingTime === currentTime && sourceName === "local")) {
        map.set(key, { row: normalized, source: sourceName });
      }
    };
    (Array.isArray(baseRows) ? baseRows : []).forEach((row, i) => put(row, i, "remote"));
    (Array.isArray(incomingRows) ? incomingRows : []).forEach((row, i) => put(row, i, "local"));
    return Array.from(map.values()).map((entry) => entry.row);
  }
  function syncTokenFingerprint(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const signatures = list.map((row, index) => {
      const r = row && row.record_data && typeof row.record_data === "object" ? row.record_data : (row || {});
      return [
        mesahaRecordKey(r, index), clean(r.updatedAt || r.updated_at || r.createdAt || r.created_at),
        clean(r.diameter || r.cap), clean(r.length || r.boy), clean(r.quantity || r.adet),
        clean(r.productType || r.product_type), clean(r.treeType || r.tree_type), clean(r.cutter || r.kesimci)
      ].join("|");
    }).sort();
    let hash = 2166136261;
    const text = signatures.join("\n");
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return list.length + "|" + (hash >>> 0).toString(36);
  }

  function stableSyncToken(seflik, bolme, rows) {
    const key = fold(seflik) + "::" + fold(bolme);
    const fingerprint = syncTokenFingerprint(rows);
    const store = read(K.syncTokens, {});
    const existing = store[key];
    if (existing && existing.fingerprint === fingerprint && existing.token) return existing.token;
    const token = "suitev22_" + fold(seflik) + "_" + fold(bolme) + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    store[key] = { token, fingerprint, at: now() };
    write(K.syncTokens, store);
    return token;
  }
  function clearStableSyncToken(seflik, bolme) {
    const key = fold(seflik) + "::" + fold(bolme);
    const store = read(K.syncTokens, {});
    if (store[key]) { delete store[key]; write(K.syncTokens, store); }
  }
  async function syncMesaha() {
    const records = read(K.records, []);
    if (!Array.isArray(records)) return { done: 0 };
    const id = identity();
    const currentFolder = activeFolder();
    const fallbackSeflik = clean((currentFolder && currentFolder.seflik) || id.seflik);
    if (!records.length) { clearDirty("mesaha"); return { done: 0 }; }

    const groups = new Map();
    for (const record of records) {
      if (!record || typeof record !== "object") continue;
      const seflik = clean(record.seflik || record.folderSeflik || fallbackSeflik);
      const bolme = clean(record.bolmeNo || record.bolme_no || id.bolme);
      if (!seflik || !bolme) continue;
      const key = fold(seflik) + "::" + fold(bolme);
      if (!groups.has(key)) groups.set(key, { seflik, bolme, rows: [] });
      groups.get(key).rows.push(record);
    }
    if (!groups.size) {
      markDirty("mesaha", { resubmit: true, source: "seflige-gonder", error: "Mesaha kayıtlarında şeflik veya bölme bilgisi eksik", code: "RECORD_CONTEXT_MISSING" });
      return { done: 0, failed: records.length, errors: [{ error: "Şeflik veya bölme bilgisi eksik" }] };
    }

    let done = 0, suppressed = 0, backupFailed = 0, failedGroups = 0;
    const suppressedBolmeler = [], backupErrors = [], errors = [];
    for (const group of groups.values()) {
      const seflik = group.seflik, bolme = group.bolme, localRows = group.rows;
      if (mesahaDivisionSuppressed(seflik, bolme)) {
        suppressed += localRows.length;
        suppressedBolmeler.push(bolme);
        continue;
      }
      try {
        try { await edge("seflik_folder_create_division", { seflik, folderSeflik: seflik, bolmeNo: bolme, location: "" }); }
        catch (error) { if (!duplicateLike(error)) throw error; }

        const remote = await edge("seflik_folder_read", { seflik, folderSeflik: seflik, bolmeNo: bolme });
        if (!Array.isArray(remote.records)) throw new Error("Sunucu geçerli Mesaha kayıtları döndürmedi");
        if (!authoritativeSyncResponse(remote)) {
          const incomplete = new Error("Sunucudaki Mesaha kayıtları tam liste sözleşmesiyle doğrulanamadı; yerel kayıtlar korunarak gönderim ertelendi");
          incomplete.code = "REMOTE_MESAHA_INCOMPLETE";
          incomplete.retryable = true;
          throw incomplete;
        }
        const rows = mergeMesahaRows(remote.records, localRows).map((row) => ({ ...row, seflik, bolmeNo: bolme, bolme_no: bolme }));
        const token = stableSyncToken(seflik, bolme, rows);
        for (let i = 0; i < rows.length; i += 150) {
          await edge("seflik_folder_push", {
            seflik, folderSeflik: seflik, bolmeNo: bolme, syncToken: token,
            records: rows.slice(i, i + 150), appVersion: (window.MesahaRelease?.telemetry("suite") || "Orman İO"), mergeMode: "barcode"
          });
        }
        let backup = null, driveError = "";
        try {
          if (cloudSyncAllowed()) {
            backup = await drive("backup_json", {
              seflik, folderSeflik: seflik, appId: "mesaha",
              fileName: `Mesaha_${fold(seflik)}_${fold(bolme)}_${new Date().toISOString().slice(0, 10)}.json`,
              recordCount: rows.length, totalVolume: rows.reduce((sum, row) => sum + volume(row), 0),
              payload: { schema: "mesaha-suite-v31", app: "mesaha", seflik, bolme, createdAt: now(), records: rows },
            });
          }
        } catch (error) {
          driveError = clean(error?.message || error);
          if (cloudSyncAllowed()) {
            backupFailed += 1;
            backupErrors.push({ seflik, bolme, error: driveError || "Mesaha Drive yedeği oluşturulamadı" });
          }
        }
        await edge("seflik_folder_finish", {
          seflik, folderSeflik: seflik, bolmeNo: bolme, syncToken: token,
          recordCount: rows.length, totalVolume: rows.reduce((sum, row) => sum + volume(row), 0),
          driveFileId: (backup && backup.fileId) || "", driveFileName: (backup && backup.fileName) || "",
          driveStatus: backup ? "ok" : cloudSyncAllowed() ? "failed" : "not_connected", driveError,
          appVersion: (window.MesahaRelease?.telemetry("suite") || "Orman İO"), mergeMode: "barcode",
        });
        clearStableSyncToken(seflik, bolme);
        done += rows.length;
      } catch (error) {
        failedGroups += 1;
        const meta = syncErrorMeta(error);
        errors.push({ seflik, bolme, recordCount: localRows.length, error: meta.message, code: meta.code, retryable: meta.retryable });
      }
    }
    if (failedGroups || backupFailed) {
      markDirty("mesaha", { resubmit: true, source: "seflige-gonder", failedGroups, errors, backupFailed, backupErrors, backupRetry: backupFailed > 0 });
    } else clearDirty("mesaha");
    if (suppressedBolmeler.length) toast(`Sunucudan silinen Bölme ${suppressedBolmeler.join(", ")} kayıtları otomatik yeniden gönderilmedi. Yeniden yüklemek için Şefliğe Gönder düğmesini kullanın.`);
    return { done, suppressed, suppressedBolmeler, failedGroups, errors, backupFailed, backupErrors };
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const q = indexedDB.open("mesaha-istif-prototype", 2);
      q.onerror = () => reject(q.error);
      q.onupgradeneeded = () => {
        const db = q.result;
        if (!db.objectStoreNames.contains("records"))
          db.createObjectStore("records", { keyPath: "id" });
        if (!db.objectStoreNames.contains("settings"))
          db.createObjectStore("settings", { keyPath: "key" });
      };
      q.onsuccess = () => resolve(q.result);
    });
  }
  async function idbAll(store) {
    try {
      const db = await openDb();
      return await new Promise((res, rej) => {
        if (!db.objectStoreNames.contains(store)) {
          db.close();
          return res([]);
        }
        const tx = db.transaction(store, "readonly"),
          q = tx.objectStore(store).getAll();
        q.onsuccess = () => {
          const x = q.result || [];
          db.close();
          res(x);
        };
        q.onerror = () => {
          db.close();
          rej(q.error);
        };
      });
    } catch {
      return [];
    }
  }
  async function idbPut(store, value) {
    const db = await openDb();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(value);
      tx.oncomplete = () => {
        db.close();
        res(true);
      };
      tx.onerror = () => {
        db.close();
        rej(tx.error);
      };
    });
  }
  async function idbDelete(store, key) {
    const db = await openDb();
    return new Promise((res, rej) => {
      if (!db.objectStoreNames.contains(store)) { db.close(); return res(false); }
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => { db.close(); res(true); };
      tx.onerror = () => { db.close(); rej(tx.error); };
    });
  }

  function tombstoneItems(value) {
    const source = value && typeof value === "object" ? value : {};
    return source.items && typeof source.items === "object" ? source.items : source;
  }
  async function istifTombstoneIds() {
    const settings = await idbAll("settings");
    const row = settings.find((item) => item && item.key === K.istifTombstones);
    return new Set(Object.keys(tombstoneItems(row && row.value)).map(clean).filter(Boolean));
  }
  async function deleteIstifWithTombstone(record, reason) {
    const id = clean(record && record.id);
    if (!id) return false;
    const db = await openDb();
    return new Promise((res, rej) => {
      if (!db.objectStoreNames.contains("records") || !db.objectStoreNames.contains("settings")) {
        db.close();
        return rej(new Error("İstif silme deposu hazır değil"));
      }
      const tx = db.transaction(["records", "settings"], "readwrite");
      const settingsStore = tx.objectStore("settings");
      const get = settingsStore.get(K.istifTombstones);
      get.onsuccess = () => {
        const previous = get.result && get.result.value;
        const items = { ...tombstoneItems(previous) };
        const deletedAt = now();
        items[id] = {
          id,
          deletedAt,
          seflikKey: clean(record.seflikKey || record.seflik_key),
          seflik: clean(record.seflik),
          bolme: clean(record.bolme || record.bolmeNo || record.bolme_no),
          istifNo: clean(record.istifNo || record.istif_no),
          reason: clean(reason || "server_authoritative_missing"),
        };
        tx.objectStore("records").delete(id);
        settingsStore.put({
          key: K.istifTombstones,
          value: { version: 1, updatedAt: deletedAt, items },
        });
      };
      get.onerror = () => rej(get.error);
      tx.oncomplete = () => { db.close(); res(true); };
      tx.onerror = () => { db.close(); rej(tx.error); };
      tx.onabort = () => { db.close(); rej(tx.error || new Error("İstif silme izi yazılamadı")); };
    });
  }
  function dataUrlFromPhoto(photo) {
    if (!photo) return Promise.resolve("");
    if (typeof photo.dataUrl === "string")
      return Promise.resolve(photo.dataUrl);
    if (typeof photo === "string" && photo.startsWith("data:"))
      return Promise.resolve(photo);
    const blob =
      photo.blob instanceof Blob
        ? photo.blob
        : photo instanceof Blob
          ? photo
          : null;
    if (!blob) return Promise.resolve("");
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result || ""));
      fr.onerror = () => rej(fr.error);
      fr.readAsDataURL(blob);
    });
  }
  function photoUploadStateList(record, photoCount) {
    const states = Array.isArray(record.photoUploadStates) ? record.photoUploadStates.map((item) => ({ ...(item || {}) })) : [];
    const files = Array.isArray(record.driveFiles) ? record.driveFiles : [];
    const count = Math.max(0, photoCount || 0, files.length);
    for (let index = 0; index < count; index += 1) {
      const existing = states[index] || {};
      states[index] = {
        index,
        status: files[index] ? "uploaded" : clean(existing.status || "pending"),
        attempts: num(existing.attempts),
        fileId: clean((files[index] && (files[index].id || files[index].fileId || files[index].file_id)) || existing.fileId),
        error: clean(existing.error),
        code: clean(existing.code),
        retryable: existing.retryable === true,
        updatedAt: clean(existing.updatedAt || now()),
      };
    }
    return states;
  }
  function setPhotoUploadState(record, index, patch) {
    const count = Math.max(Array.isArray(record.photos) ? record.photos.length : 0, Array.isArray(record.driveFiles) ? record.driveFiles.length : 0, index + 1);
    const states = photoUploadStateList(record, count);
    states[index] = { ...(states[index] || { index }), ...(patch || {}), index, updatedAt: now() };
    record.photoUploadStates = states;
  }
  function syncErrorMeta(error) {
    const message = clean(error && error.message || error) || "Senkronizasyon tamamlanamadı";
    const code = clean(error && error.code);
    const retryable = !!(error && error.retryable) || ["NETWORK_TIMEOUT", "NETWORK_WEAK", "DRIVE_RATE_LIMIT", "DRIVE_TEMPORARY", "DRIVE_NETWORK"].includes(code);
    return { message, code, retryable };
  }

  async function syncIstif() {
    const deletedIds = await istifTombstoneIds();
    const raw = (await idbAll("records")).filter((r) => r && !r.isDemo);
    for (const record of raw) {
      if (deletedIds.has(clean(record.id))) await idbDelete("records", record.id);
    }
    const all = raw.filter((r) => !deletedIds.has(clean(r.id))),
      rows = all.filter((r) => r.syncStatus !== "synced" || (Array.isArray(r.pendingDriveDeleteIds) && r.pendingDriveDeleteIds.length)),
      priorIstifMeta = (dirtyState().istif && dirtyState().istif.meta) || {},
      backupRetry = priorIstifMeta.backupFailed > 0 || priorIstifMeta.backupRetry === true;
    if (!rows.length && !backupRetry) {
      clearDirty("istif");
      return { done: 0, failed: 0, retryable: 0, pending: 0, backupFailed: 0, backupErrors: [] };
    }
    const id = identity(),
      syncedBySeflik = {};
    if (backupRetry) {
      for (const record of all) {
        const seflik = clean(record.seflik || record.seflikName || id.seflik);
        if (seflik) syncedBySeflik[seflik] = syncedBySeflik[seflik] || [];
      }
    }
    let done = 0, failed = 0, retryableFailures = 0, backupFailed = 0;
    const backupErrors = [];
    for (const r of rows) {
      const seflik = clean(r.seflik || r.seflikName || id.seflik),
        bolme = clean(r.bolme || r.bolmeNo);
      if (!seflik || !bolme) {
        r.syncStatus = "sync_failed";
        r.syncError = "İstif kaydında şeflik veya bölme eksik";
        r.syncErrorCode = "RECORD_CONTEXT_MISSING";
        r.syncRetryable = false;
        await idbPut("records", r);
        failed += 1;
        continue;
      }
      const pendingDriveDeleteIds = Array.from(new Set((Array.isArray(r.pendingDriveDeleteIds) ? r.pendingDriveDeleteIds : []).map(clean).filter(Boolean)));
      if (pendingDriveDeleteIds.length) {
        try {
          await drive("delete_drive_files", {
            seflik,
            seflikKey: clean(r.seflikKey || r.seflik_key) || fold(seflik),
            recordId: r.id,
            istifNo: r.istifNo,
            bolmeNo: bolme,
            fileIds: pendingDriveDeleteIds,
          });
          r.pendingDriveDeleteIds = [];
          await idbPut("records", r);
        } catch (error) {
          const meta = syncErrorMeta(error);
          r.syncStatus = "sync_failed";
          r.syncError = `Kaldırılan Drive fotoğrafları temizlenemedi: ${meta.message}`;
          r.syncErrorCode = meta.code || "DRIVE_DELETE_PENDING";
          r.syncRetryable = meta.retryable !== false;
          r.updatedAt = now();
          await idbPut("records", r);
          failed += 1;
          if (r.syncRetryable) retryableFailures += 1;
          continue;
        }
      }
      try {
        await edge("seflik_folder_create_division", {
          seflik,
          bolmeNo: bolme,
          location: r.mevki || "",
        });
      } catch (e) {
        if (!duplicateLike(e)) {
          const meta = syncErrorMeta(e);
          r.syncStatus = "sync_failed";
          r.syncError = meta.message;
          r.syncErrorCode = meta.code;
          r.syncRetryable = meta.retryable;
          r.updatedAt = now();
          await idbPut("records", r);
          failed += 1;
          if (meta.retryable) retryableFailures += 1;
          continue;
        }
      }
      r.driveFiles = Array.isArray(r.driveFiles) ? r.driveFiles : [];
      const photos = Array.isArray(r.photos) ? r.photos : [];
      r.photoUploadStates = photoUploadStateList(r, photos.length);
      r.syncStatus = "syncing";
      r.syncError = "";
      r.syncErrorCode = "";
      r.syncRetryable = false;
      await idbPut("records", r);
      let uploadFailed = false;
      for (let i = 0; i < photos.length; i++) {
        if (r.driveFiles[i]) {
          setPhotoUploadState(r, i, { status: "uploaded", fileId: clean(r.driveFiles[i].id || r.driveFiles[i].fileId || r.driveFiles[i].file_id), error: "", code: "", retryable: false });
          continue;
        }
        const currentState = r.photoUploadStates[i] || {};
        setPhotoUploadState(r, i, { status: "uploading", attempts: num(currentState.attempts) + 1, error: "", code: "", retryable: false });
        r.syncStatus = "syncing";
        await idbPut("records", r);
        try {
          const dataUrl = await dataUrlFromPhoto(photos[i]);
          if (!dataUrl) throw new Error("Fotoğraf verisi okunamadı");
          const up = await drive("upload_photo", {
            seflik,
            recordDate: r.date || r.recordDate,
            bolmeNo: bolme,
            istifNo: r.istifNo,
            fileName: `${r.istifNo || "istif"}_${i + 1}.jpg`,
            dataUrl,
            mimeType: (photos[i] && photos[i].type) || "image/jpeg",
            size: (photos[i] && (photos[i].size || photos[i].blob && photos[i].blob.size)) || 0,
          });
          r.driveFiles[i] = up;
          r.driveFolderId = up.folderId || r.driveFolderId;
          setPhotoUploadState(r, i, { status: "uploaded", fileId: clean(up.id || up.fileId || up.file_id), error: "", code: "", retryable: false });
          await idbPut("records", r);
        } catch (error) {
          const meta = syncErrorMeta(error);
          setPhotoUploadState(r, i, { status: "failed", error: meta.message, code: meta.code, retryable: meta.retryable });
          r.syncStatus = "upload_failed";
          r.syncError = meta.message;
          r.syncErrorCode = meta.code;
          r.syncRetryable = meta.retryable;
          r.updatedAt = now();
          await idbPut("records", r);
          failed += 1;
          if (meta.retryable) retryableFailures += 1;
          uploadFailed = true;
          break;
        }
      }
      if (uploadFailed) continue;
      r.syncStatus = "drive_synced";
      r.syncError = "";
      r.syncErrorCode = "";
      r.syncRetryable = false;
      await idbPut("records", r);
      try {
        await edge("istif_record_upsert", {
          seflik,
          record: {
            id: String(r.id),
            ormanci: r.ormanci || "",
            record_date: r.date || "",
            bolme_no: bolme,
            istif_no: r.istifNo || "",
            wood_type: r.type || "",
            ster: num(r.ster),
            coordinates: r.coordinates || null,
            mevki: r.mevki || null,
            description: r.description || null,
            barcode_no: r.barcode || null,
            photo_count: photos.length || r.photoCount || 0,
            drive_folder_id: r.driveFolderId || null,
            drive_files: r.driveFiles || [],
            is_sent: !!(r.isSent || r.is_sent),
            sent_at: r.sentAt || null,
            sent_by: r.sentBy || r.sent_by || null,
            created_at: r.createdAt || now(),
            updated_at: now(),
          },
        });
      } catch (error) {
        const meta = syncErrorMeta(error);
        r.syncStatus = "drive_synced";
        r.syncError = `Fotoğraflar Drive'a yüklendi; Supabase kaydı bekliyor: ${meta.message}`;
        r.syncErrorCode = meta.code || "SUPABASE_PENDING";
        r.syncRetryable = meta.retryable !== false;
        r.updatedAt = now();
        await idbPut("records", r);
        failed += 1;
        if (r.syncRetryable) retryableFailures += 1;
        continue;
      }
      r.syncStatus = "synced";
      r.syncError = "";
      r.syncErrorCode = "";
      r.syncRetryable = false;
      r.updatedAt = now();
      r.photoUploadStates = photoUploadStateList(r, photos.length).map((state) => ({ ...state, status: "uploaded", error: "", code: "", retryable: false, updatedAt: now() }));
      await idbPut("records", r);
      (syncedBySeflik[seflik] || (syncedBySeflik[seflik] = [])).push(r);
      done++;
    }
    if (cloudSyncAllowed())
      for (const seflik of Object.keys(syncedBySeflik))
        try {
          const latest = (await idbAll("records")).filter((r) => r && !r.isDemo);
          const payloadRows = latest
            .filter((r) => clean(r.seflik || r.seflikName || id.seflik) === seflik)
            .map((r) => ({ ...r, photos: undefined }));
          await drive("backup_json", {
            seflik,
            appId: "istif",
            fileName: `Istif_${fold(seflik)}_${new Date().toISOString().slice(0, 10)}.json`,
            recordCount: payloadRows.length,
            totalVolume: payloadRows.reduce((sum, r) => sum + num(r.ster), 0),
            payload: {
              schema: "mesaha-suite-v31",
              app: "istif",
              seflik,
              createdAt: now(),
              records: payloadRows,
            },
          });
        } catch (e) {
          backupFailed += 1;
          backupErrors.push({ seflik, error: clean(e?.message || e) || "Drive yedeği oluşturulamadı" });
          console.warn("[suite-v68] İstif Drive yedeği oluşturulamadı", e);
        }
    const pending = (await idbAll("records")).filter((r) => r && !r.isDemo && r.syncStatus !== "synced").length;
    if (pending || backupFailed)
      markDirty("istif", {
        pending,
        failed,
        retryable: retryableFailures,
        backupFailed,
        backupRetry: backupFailed > 0,
        backupErrors,
      });
    else clearDirty("istif");
    return { done, failed, retryable: retryableFailures, pending, backupFailed, backupErrors };
  }

  function normalizeRemoteIstifRecord(row) {
    row = row && typeof row === "object" ? row : {};
    const id = clean(row.id || row.record_id);
    if (!id) return null;
    const driveFiles = Array.isArray(row.drive_files)
      ? row.drive_files
      : Array.isArray(row.driveFiles)
        ? row.driveFiles
        : [];
    return {
      id,
      userId: clean(row.user_id || row.userId),
      seflikKey: clean(row.seflik_key || row.seflikKey),
      seflik: clean(row.seflik || row.folder_seflik),
      ormanci: clean(row.ormanci || row.forester || row.forester_name),
      date: clean(row.record_date || row.date),
      bolme: clean(row.bolme_no || row.bolme || row.bolmeNo),
      istifNo: clean(row.istif_no || row.istifNo),
      type: clean(row.wood_type || row.type),
      ster: clean(row.ster || row.miktar || row.quantity),
      coordinates: clean(row.coordinates || row.coordinate || row.kordinat),
      mevki: clean(row.mevki || row.location_note),
      description: clean(row.description || row.aciklama),
      barcode: clean(row.barcode_no || row.barcode),
      photos: [],
      photoCount: num(row.photo_count || driveFiles.length),
      driveFolderId: clean(row.drive_folder_id || row.driveFolderId),
      driveFiles,
      photoUploadStates: driveFiles.map((file, index) => ({ index, status: "uploaded", fileId: clean(file && (file.id || file.fileId || file.file_id)), attempts: 0, error: "", code: "", retryable: false, updatedAt: clean(row.updated_at || row.updatedAt || now()) })),
      syncStatus: "synced",
      syncError: "",
      syncErrorCode: "",
      syncRetryable: false,
      isSent: row.is_sent === true || row.isSent === true,
      sentAt: clean(row.sent_at || row.sentAt),
      sentBy: clean(row.sent_by || row.sentBy),
      createdAt: clean(row.created_at || row.createdAt || now()),
      updatedAt: clean(row.updated_at || row.updatedAt || now()),
      remoteOnly: true,
    };
  }
  function authoritativeSyncResponse(out) {
    return !!(out && out.sync_contract === "orman-io-sync-v68" && out.complete === true && out.partial !== true && out.truncated !== true);
  }

  function authoritativeIstifList(out) {
    return !!(
      out &&
      out.sync_contract === "orman-io-sync-v68" &&
      out.complete === true &&
      out.partial !== true &&
      out.truncated !== true &&
      (!Array.isArray(out.query_errors) || out.query_errors.length === 0) &&
      (out.expected_queries == null || Number(out.successful_queries) === Number(out.expected_queries))
    );
  }
  async function pullIstifRecords() {
    if (navigator.onLine === false) return { received: 0, changed: 0, offline: true };
    const af = activeFolder(), id = identity();
    const seflik = clean((af && af.seflik) || id.seflik);
    const seflikKey = clean(af && (af.seflik_key || af.seflikKey)) || id.seflikKey || fold(seflik);
    if (!seflik) return { received: 0, changed: 0, skipped: true };

    let out;
    try {
      out = await edge("istif_record_list", {
        seflik,
        folderSeflik: seflik,
        seflikKey,
      });
    } catch (edgeError) {
      // Eski smooth-function henüz dağıtılmadıysa Google oturumlarında
      // istif-drive record_list ile geriye uyumlu şekilde kayıtları çek.
      if (!cloudSyncAllowed()) throw edgeError;
      out = await drive("record_list", { seflik, seflikKey });
    }

    const deletedIds = await istifTombstoneIds();
    const remote = (Array.isArray(out && out.records) ? out.records : [])
      .map(normalizeRemoteIstifRecord)
      .filter((record) => record && !deletedIds.has(clean(record.id)));
    const authoritative = authoritativeIstifList(out);

    const rawLocal = await idbAll("records");
    for (const record of rawLocal) {
      if (record && deletedIds.has(clean(record.id))) await idbDelete("records", record.id);
    }
    const local = rawLocal.filter((record) => record && !deletedIds.has(clean(record.id)));
    const byId = new Map(local.map((record) => [clean(record && record.id), record]));
    const remoteIds = new Set(remote.map((record) => clean(record.id)));
    let changed = 0;
    for (const localRecord of local) {
      if (!authoritative || !localRecord || localRecord.isDemo || remoteIds.has(clean(localRecord.id))) continue;
      const localKey = clean(localRecord.seflikKey || localRecord.seflik_key) || fold(localRecord.seflik);
      const sameFolder = (seflikKey && localKey === seflikKey) || (seflik && fold(localRecord.seflik) === fold(seflik));
      const pending = clean(localRecord.syncStatus) && clean(localRecord.syncStatus) !== "synced";
      if (sameFolder && !pending) {
        await deleteIstifWithTombstone(localRecord, "server_authoritative_missing");
        deletedIds.add(clean(localRecord.id));
        byId.delete(clean(localRecord.id));
        changed++;
      }
    }
    for (const remoteRecord of remote) {
      const current = byId.get(remoteRecord.id);
      const localPending =
        current &&
        !current.isDemo &&
        current.syncStatus &&
        current.syncStatus !== "synced";
      if (localPending) continue;
      const merged = {
        ...(current || {}),
        ...remoteRecord,
        photos:
          Array.isArray(current && current.photos) && current.photos.length
            ? current.photos
            : [],
        photoCount: Math.max(
          num(remoteRecord.photoCount),
          num(current && current.photoCount),
          Array.isArray(current && current.photos) ? current.photos.length : 0,
        ),
        driveFiles:
          Array.isArray(remoteRecord.driveFiles) && remoteRecord.driveFiles.length
            ? remoteRecord.driveFiles
            : (current && current.driveFiles) || [],
        syncStatus: "synced",
        remoteOnly:
          !current ||
          !(Array.isArray(current.photos) && current.photos.length),
      };
      await idbPut("records", merged);
      byId.set(merged.id, merged);
      changed++;
    }
    return {
      received: remote.length,
      changed,
      authoritative,
      complete: out?.complete === true,
      partial: out?.partial === true || !authoritative,
      truncated: out?.truncated === true,
      syncContract: clean(out?.sync_contract),
    };
  }

  let syncing = false;
  let autoRetryTimer = 0;
  let autoRetryAttempt = 0;
  function stopGuestSync() {
    clearTimeout(autoRetryTimer);
    autoRetryTimer = 0;
    autoRetryAttempt = 0;
    const button = document.getElementById("suiteSyncFabV8");
    if (button && button.parentNode) button.parentNode.removeChild(button);
    positionDock();
  }
  function scheduleAutoRetry(delayMs = 15000, reset = false) {
    if (!cloudSyncAllowed()) {
      stopGuestSync();
      return;
    }
    if (navigator.onLine === false) return;
    if (reset) autoRetryAttempt = 0;
    clearTimeout(autoRetryTimer);
    const delay = Math.max(1200, Math.min(5 * 60 * 1000, delayMs || 15000));
    autoRetryTimer = setTimeout(() => {
      if (syncing || navigator.onLine === false || !isDirty()) return;
      autoRetryAttempt += 1;
      syncAll({ source: "auto-retry" }).catch(() => {});
    }, delay);
  }
  function nextAutoRetryDelay() {
    return Math.min(5 * 60 * 1000, 15000 * (2 ** Math.min(autoRetryAttempt, 4)));
  }
  function setSyncButtonBusy(active, label) {
    const button = document.getElementById("suiteSyncFabV8");
    if (!button) return;
    button.disabled = !!active;
    button.setAttribute("aria-busy", active ? "true" : "false");
    const text = button.querySelector("b");
    if (text) text.textContent = label || (active ? "Senkronize ediliyor" : "Senkronize Et");
  }
  async function syncAll(opts) {
    if (!cloudSyncAllowed()) {
      stopGuestSync();
      return { ok: false, skipped: true, authRequired: true, guest: true };
    }
    if (syncing) {
      toast("Senkronizasyon zaten devam ediyor.");
      return { ok: false, busy: true };
    }
    if (navigator.onLine === false) {
      toast("İnternet yok. Senkronizasyon yapılamadı.", true);
      return { ok: false, offline: true };
    }
    syncing = true;
    setSyncButtonBusy(true, "Bağlantı kontrolü");
    updateButton();
    try {
      try {
        await checkSyncConnection(5000);
      } catch (connectionError) {
        if (connectionError && connectionError.code === "OFFLINE") {
          toast("İnternet yok. Senkronizasyon yapılamadı.", true);
          return { ok: false, offline: true };
        }
        toast("Senkronizasyon başarısız. Bağlantı zayıf.", true);
        return { ok: false, weakConnection: true };
      }
      setSyncButtonBusy(true, "Senkronize ediliyor");
      toast("Değişiklikler sunucuya senkronize ediliyor…");
      const before = dirtyState();
      const force = !!(opts && opts.force === true);
      const management = await syncManagement();
      const mesaha =
        force || (before.mesaha && before.mesaha.dirty)
          ? await syncMesaha()
          : { done: 0, skipped: true };
      const istif =
        force || (before.istif && before.istif.dirty)
          ? await syncIstif()
          : { done: 0, skipped: true };
      let istifPull;
      try {
        istifPull = await pullIstifRecords();
      } catch (pullError) {
        const pullMessage = clean(pullError && pullError.message || pullError);
        if (/şefliğe erişiminiz yok|şeflik klasörünü sadece içindeki kullanıcılar|şeflik bulunamadı/i.test(pullMessage)) {
          istifPull = { ok: false, skipped: true, accessRefreshRequired: true, error: pullMessage };
        } else throw pullError;
      }
      const folder = await refreshFolderData({
        includeRecords: true,
        quiet: true,
        forceRecords: true,
      });
      write(K.last, { at: now(), management, mesaha, istif, istifPull, folder });
      dispatch();
      if (management && management.left) {
        const pending = pendingOps();
        const firstError = clean(pending[0] && pending[0].error);
        toast(
          `${management.left} yönetim işlemi sunucuda bekliyor${firstError ? ": " + firstError : "."}`,
          true,
        );
        scheduleAutoRetry(nextAutoRetryDelay());
      } else if (mesaha && (mesaha.failedGroups || mesaha.failed)) {
        const failedCount = Number(mesaha.failedGroups || mesaha.failed || 0);
        const firstError = clean(mesaha.errors && mesaha.errors[0] && mesaha.errors[0].error);
        toast(`${failedCount} Mesaha grubu gönderilemedi${firstError ? ": " + firstError : "."} Yerel kayıtlar korunuyor.`, true);
        if (Array.isArray(mesaha.errors) && mesaha.errors.some((item) => item && item.retryable === true)) scheduleAutoRetry(nextAutoRetryDelay());
      } else if (mesaha && mesaha.backupFailed) {
        toast(`${mesaha.backupFailed} bölme için Mesaha Drive JSON yedeği oluşturulamadı. Sunucu kayıtları korundu; yedekleme tekrar denenecek.`, true);
        scheduleAutoRetry(nextAutoRetryDelay());
      } else if (istif && istif.failed) {
        toast(`${istif.failed} İstif kaydı veya fotoğrafı cihazda bekliyor. Ayrıntıyı İstif İO'da görebilirsiniz.`, true);
        if (istif.retryable) scheduleAutoRetry(nextAutoRetryDelay());
      } else if (istifPull && istifPull.accessRefreshRequired) {
        autoRetryAttempt = 0;
        clearTimeout(autoRetryTimer);
        toast("Yönetim ve Mesaha senkronlandı. İstif erişimi sunucuda yeniden doğrulanacak.", true);
      } else if (istif && istif.backupFailed) {
        toast(`${istif.backupFailed} şeflik için İstif Drive JSON yedeği oluşturulamadı. Kayıtlar sunucuda, yedekleme tekrar denenecek.`, true);
        scheduleAutoRetry(nextAutoRetryDelay());
      } else if (istifPull && (istifPull.partial || istifPull.truncated || istifPull.complete === false)) {
        toast("Gönderim tamamlandı; ancak İstif sunucu listesi eksiksiz doğrulanamadı. Yerel kayıtlar korunarak bırakıldı.", true);
      } else if (folder && (folder.complete === false || folder.truncated === true)) {
        toast("Gönderim tamamlandı; ancak Mesaha offline verisinin tamamı doğrulanamadı. Eski cihaz verileri korundu.", true);
      } else {
        autoRetryAttempt = 0;
        clearTimeout(autoRetryTimer);
        toast("Senkronizasyon tamamlandı.");
      }
      try {
        window.dispatchEvent(
          new CustomEvent("mesaha-suite:sync-complete", {
            detail: { management, mesaha, istif, istifPull, folder },
          }),
        );
      } catch {}
      const partial = !!(
        (management && management.left) ||
        (mesaha && (mesaha.failedGroups || mesaha.failed || mesaha.backupFailed)) ||
        (istif && (istif.failed || istif.backupFailed)) ||
        (istifPull && (istifPull.accessRefreshRequired || istifPull.partial || istifPull.truncated || istifPull.complete === false)) ||
        (folder && (folder.complete === false || folder.truncated === true))
      );
      return { ok: !partial, partial, management, mesaha, istif, istifPull, folder, message: partial ? "Senkronizasyon kısmen tamamlandı; cihazdaki veriler korundu." : "Senkronizasyon tamamlandı." };
    } catch (e) {
      const code = clean(e && e.code);
      const message = clean(e && e.message || e);
      if (navigator.onLine === false || code === "OFFLINE") {
        toast("İnternet yok. Senkronizasyon yapılamadı.", true);
        return { ok: false, offline: true };
      }
      if (code === "NETWORK_TIMEOUT" || code === "NETWORK_WEAK") {
        toast("Senkronizasyon başarısız. Bağlantı zayıf.", true);
        scheduleAutoRetry(nextAutoRetryDelay());
        return { ok: false, weakConnection: true };
      }
      if (e && e.retryable) scheduleAutoRetry(nextAutoRetryDelay());
      toast("Senkronizasyon tamamlanamadı: " + message, true);
      throw e;
    } finally {
      syncing = false;
      setSyncButtonBusy(false, "Senkronize Et");
      updateButton();
    }
  }

  function suiteRootUrlForDrive() {
    const u = new URL(location.href);
    u.hash = "";
    u.search = "";
    u.pathname = u.pathname
      .replace(/\/(?:mesaha|istif)(?:\/.*)?$/i, "/")
      .replace(/[^/]*$/, "");
    if (!u.pathname.endsWith("/")) u.pathname += "/";
    u.searchParams.set("open", "drive");
    return u.href;
  }
  function openDriveSetup() {
    try { localStorage.setItem("mesaha_suite_open_drive_v14", "1"); } catch {}
    const nested = /\/(?:mesaha|istif)\//i.test(location.pathname);
    if (!nested && window.MesahaSuiteUI && typeof window.MesahaSuiteUI.openLogin === "function") {
      window.MesahaSuiteUI.openLogin();
      setTimeout(() => {
        const card = document.getElementById("driveAccountCardV8");
        if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
        const button = document.getElementById("driveConnectV8");
        if (button && !button.hidden) button.focus({ preventScroll: true });
      }, 140);
      return true;
    }
    location.href = suiteRootUrlForDrive();
    return true;
  }
  async function driveStatus() {
    const id = identity(), ctx = folderContext();
    if (!cloudSyncAllowed()) return { ok: true, connected: false, googleRequired: true };
    const x = await drive("status", {
      seflik: ctx.seflik || id.seflik,
      seflikKey: ctx.seflikKey || id.seflikKey,
      seflik_key: ctx.seflikKey || id.seflikKey,
      folderId: ctx.folderId,
    });
    write(K.drive, x);
    return x;
  }
  async function ensureDriveConnected(options) {
    const opts = options || {};
    const status = await driveStatus();
    if (status && status.connected) return status;
    const memberWithoutOwnerDrive = status && status.isOwner === false;
    const error = new Error(
      status && status.googleRequired
        ? "Drive bağlantısı için önce Google ile giriş yapın"
        : memberWithoutOwnerDrive
          ? "Şeflik kurucusu Google Drive hesabını henüz bağlamadı"
          : "Şeflik Google Drive hesabı bağlı değil",
    );
    error.code = status && status.googleRequired
      ? "GOOGLE_REQUIRED"
      : memberWithoutOwnerDrive
        ? "OWNER_DRIVE_NOT_CONNECTED"
        : "DRIVE_NOT_CONNECTED";
    if (opts.redirect !== false && !memberWithoutOwnerDrive) openDriveSetup();
    throw error;
  }
  async function driveConnect() {
    const id = identity();
    if (!cloudSyncAllowed())
      throw new Error("Drive bağlantısı için Google ile giriş yapın veya terminal koduyla eşleşin");
    const status = await driveStatus();
    if (status && status.isOwner === false)
      throw new Error("Drive hesabını yalnızca şeflik kurucusu bağlayabilir");
    const redirect = location.origin + location.pathname.replace(/[^/]*$/, "");
    const ctx = folderContext();
    const x = await drive("oauth_start", {
      seflik: ctx.seflik || id.seflik,
      seflikKey: ctx.seflikKey || id.seflikKey,
      folderId: ctx.folderId,
      redirectUri: redirect,
    });
    if (!x.authorizationUrl)
      throw new Error("Google bağlantı adresi alınamadı");
    location.href = x.authorizationUrl;
  }
  async function driveFinish(code, state) {
    const redirect = location.origin + location.pathname.replace(/[^/]*$/, "");
    const ctx = folderContext();
    const x = await drive("oauth_finish", {
      code,
      state,
      redirectUri: redirect,
      seflik: ctx.seflik || identity().seflik,
      seflikKey: ctx.seflikKey || identity().seflikKey,
      folderId: ctx.folderId,
    });
    write(K.drive, x);
    return x;
  }
  async function driveDisconnect() {
    const ctx = folderContext();
    const x = await drive("disconnect", { seflik: ctx.seflik || identity().seflik, seflikKey: ctx.seflikKey || identity().seflikKey, folderId: ctx.folderId });
    write(K.drive, { connected: false });
    return x;
  }
  async function currentMesahaRecordsReady() {
    try {
      const store = window.MesahaStorageV527;
      if (store && typeof store.flush === "function") await store.flush();
      if (store && typeof store.lastCommittedRecords === "function") {
        const rows = store.lastCommittedRecords();
        if (Array.isArray(rows)) return rows.slice();
      }
      if (store && typeof store.bootstrapRecords === "function") {
        const rows = store.bootstrapRecords();
        if (Array.isArray(rows)) return rows.slice();
      }
    } catch (_) {}
    try { if (window.state && Array.isArray(window.state.records)) return window.state.records.slice(); } catch (_) {}
    const rows = read(K.records, []);
    return Array.isArray(rows) ? rows : [];
  }
  async function createMesahaBackup(options) {
    options = options || {};
    const id = identity(), af = activeFolder();
    if (!cloudSyncAllowed()) { openDriveSetup(); throw new Error("Drive yedeği için Google ile giriş yapın veya terminal koduyla eşleşin"); }
    await ensureDriveConnected({ redirect: true });
    const seflik = clean((af && af.seflik) || id.seflik), selected = clean(options.bolmeNo || "");
    if (!seflik) throw new Error("Önce şeflik seçin");
    const all = Array.isArray(options.records) ? options.records.slice() : await currentMesahaRecordsReady(),
      selectedRows = (Array.isArray(all) ? all : []).filter((r) => !selected || clean(r.bolmeNo || r.bolme_no || id.bolme) === selected);
    const stats = canonicalMesahaStats(selectedRows);
    if (!stats.rowCount) throw new Error(selected ? `Bölme ${selected} için yedeklenecek Mesaha kaydı yok` : "Yedeklenecek Mesaha kaydı yok");
    const result = await drive("backup_json", {
      seflik, appId: "mesaha",
      fileName: `Mesaha_${fold(seflik)}_${selected ? fold(selected) + "_" : ""}${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      recordCount: stats.itemCount,
      rowCount: stats.rowCount,
      itemCount: stats.itemCount,
      totalVolume: stats.totalVolume,
      treeTotals: stats.treeTotals,
      productTotals: stats.productTotals,
      payload: { schema: "mesaha-suite-v51", app: "mesaha", seflik, bolme: selected, createdAt: now(), settings: read(K.settings, {}), records: stats.records },
    });
    await sendExactBackupStats(stats, result, { bolmeNo: selected, text: selected ? `Bölme ${selected} Drive yedeği` : "Mesaha Drive yedeği" });
    return result;
  }
  async function restoreMesahaBackup(id, mode) {
    const out = await readBackup(id), p = out.payload || out.data || out || {};
    const incoming = Array.isArray(p.mesahaRecords) ? p.mesahaRecords : Array.isArray(p.records) ? p.records : [];
    if (!incoming.length) throw new Error("Bu yedekte Mesaha kaydı bulunamadı");
    const current = read(K.records, []), result = mode === "replace" ? incoming : (() => {
      const map = new Map((Array.isArray(current) ? current : []).map((r) => [String(r.barcode || r.barkod || r.barkodNo || r.barkod_no || r.id || Math.random()), r]));
      incoming.forEach((r) => map.set(String(r.barcode || r.barkod || r.barkodNo || r.barkod_no || r.id || Math.random()), r));
      return [...map.values()];
    })();
    window.__suiteRemoteHydrating = true;
    try {
      write(K.records, result);
      if (p.settings && typeof p.settings === "object") write(K.settings, { ...read(K.settings, {}), ...p.settings });
      if (window.state) { window.state.records = result; if (p.settings) window.state.settings = { ...(window.state.settings || {}), ...p.settings }; }
    } finally { setTimeout(() => { window.__suiteRemoteHydrating = false; }, 300); }
    markDirty("mesaha", { restore: true, backupId: id, mode: mode || "merge" });
    return { ok: true, count: result.length, imported: incoming.length };
  }

  async function createSuiteBackup() {
    const id = identity();
    if (!cloudSyncAllowed()) { openDriveSetup(); throw new Error("Drive yedeği için Google ile giriş yapın veya terminal koduyla eşleşin"); }
    await ensureDriveConnected({ redirect: true });
    const mesaha = await currentMesahaRecordsReady(),
      istif = (await idbAll("records")).map((r) => ({
        ...r,
        photos: undefined,
      }));
    const payload = {
      schema: "mesaha-suite-backup-v22",
      createdAt: now(),
      user: { id: id.userId, name: id.name, email: id.email },
      seflik: id.seflik,
      mesahaRecords: Array.isArray(mesaha) ? mesaha : [],
      istifRecords: Array.isArray(istif) ? istif : [],
      suite: {
        folders: read(K.folders, []),
        divisions: read(K.divisions, {}),
        divisionReady: read(K.ready, {}),
        divisionRecords: read(K.divisionRecords, {}),
        yieldTargets: read(K.yieldTargets, {}),
      },
    };
    const stats = canonicalMesahaStats(payload.mesahaRecords);
    payload.mesahaRecords = stats.records;
    payload.stats = {
      mesahaRowCount: stats.rowCount,
      mesahaItemCount: stats.itemCount,
      mesahaTotalVolume: stats.totalVolume,
      treeTotals: stats.treeTotals,
      productTotals: stats.productTotals,
      istifRowCount: payload.istifRecords.length,
    };
    const result = await drive("backup_json", {
      seflik: id.seflik,
      appId: "suite",
      fileName: `Mesaha_Suite_${fold(id.seflik || id.name)}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      recordCount: stats.itemCount,
      rowCount: stats.rowCount,
      itemCount: stats.itemCount,
      totalVolume: stats.totalVolume,
      treeTotals: stats.treeTotals,
      productTotals: stats.productTotals,
      istifRowCount: payload.istifRecords.length,
      payload,
    });
    if (stats.rowCount) await sendExactBackupStats(stats, result, { text: "Orman İO tam Drive yedeği" });
    return result;
  }
  const backupContext = () => { const ctx = folderContext(); return { seflik: ctx.seflik || identity().seflik, seflikKey: ctx.seflikKey || identity().seflikKey, folderId: ctx.folderId }; };
  const listBackups = () => drive("backup_list", backupContext());
  const readBackup = (id) => drive("backup_read", { id, ...backupContext() });
  const deleteBackup = (id) => drive("backup_delete", { id, ...backupContext() });

  function watchStorage() {
    const orig = Storage.prototype.setItem;
    if (!orig.__suiteV8) {
      const wrapped = function (k, v) {
        const old = this.getItem(k),
          out = orig.call(this, k, v);
        /* V31: Yerel Mesaha kayıt değişiklikleri otomatik bulut kuyruğu değildir.
           Gönderim yalnız Şefliğe Gönder işlemi tarafından açıkça başlatılır. */
        if (
          this === localStorage &&
          k === K.records &&
          old !== String(v) &&
          !window.__suiteRemoteHydrating
        ) {
          try { window.dispatchEvent(new CustomEvent("mesaha-suite:local-mesaha-changed", { detail: { key: k } })); } catch {}
        }
        return out;
      };
      wrapped.__suiteV8 = true;
      Storage.prototype.setItem = wrapped;
    }
    window.addEventListener("storage", () => {
      dispatch();
      queueDockPosition();
    });
    ["mesaha:records-saved", "mesaha:record-saved", "mesaha:record-deleted"].forEach((eventName) => {
      window.addEventListener(eventName, (event) => {
        if (window.__suiteRemoteHydrating) return;
        /* Sağlık ekranı yerel kayıt sayısını yeniler; senkron kuyruğu açılmaz. */
        try { window.dispatchEvent(new CustomEvent("mesaha-suite:local-mesaha-changed", { detail: { eventName, source: event && event.detail } })); } catch {}
        sanitizeMesahaDirtyState();
        dispatch();
      });
    });
    window.addEventListener("mesaha-istif:changed", (event) => {
      // Sunucu silmesi tamamlandıktan sonra yazılan tombstone yeni bir yükleme
      // kuyruğu değildir; yalnız ekran ve sağlık özetini yeniler.
      if (event && event.detail && event.detail.tombstone === true) {
        dispatch();
        return;
      }
      markDirty("istif");
    });
    window.addEventListener("focusin", queueDockPosition, true);
    window.addEventListener(
      "focusout",
      () => setTimeout(queueDockPosition, 120),
      true,
    );
    window.visualViewport &&
      window.visualViewport.addEventListener("resize", queueDockPosition);
    window.addEventListener("resize", queueDockPosition, { passive: true });
    window.addEventListener("scroll", queueDockPosition, {
      passive: true,
      capture: true,
    });
    window.addEventListener("orientationchange", () =>
      setTimeout(() => {
        viewportBase = window.visualViewport ? window.visualViewport.height : 0;
        positionDock();
      }, 450),
    );
    window.addEventListener("online", () => {
      updateButton();
      if (cloudSyncAllowed()) scheduleAutoRetry(1800, true);
      else stopGuestSync();
    });
    window.addEventListener("offline", () => { updateButton(); clearTimeout(autoRetryTimer); });
    document.addEventListener("visibilitychange", () => {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine !== false &&
        isDirty() &&
        cloudSyncAllowed()
      )
        scheduleAutoRetry(2500, true);
      else if (!cloudSyncAllowed()) stopGuestSync();
    });
    const mo = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.type === "childList"))
        queueDockPosition();
    });
    const dockRoot = document.getElementById("app") || document.body;
    if (dockRoot)
      mo.observe(dockRoot, { childList: true, subtree: true });
    // Kaydırma, klavye ve görünüm olayları zaten anlık konumlandırır.
    // Seyrek kontrol yalnızca tarayıcıların kaçırdığı alt menü değişiklikleri içindir.
    setInterval(queueDockPosition, 2500);
  }

  const api = {
    version: VERSION,
    markDirty,
    clearDirty,
    isDirty,
    canCloudSync: cloudSyncAllowed,
    syncAll,
    driveStatus,
    ensureDriveConnected,
    openDriveSetup,
    driveConnect,
    driveFinish,
    driveDisconnect,
    createSuiteBackup,
    createMesahaBackup,
    restoreMesahaBackup,
    createOfflineDivision,
    enqueuePending,
    listBackups,
    readBackup,
    deleteBackup,
    identity,
    applyCanonicalServerContext,
    repairFolderContext: repairFolderContextDirect,
    canonicalMesahaStats,
    edge,
    drive,
    updateButton,
    getDock,
    registerHomeButton,
    positionDock,
    refreshFolderData,
    pullIstifRecords,
    loadDivisionRecords,
    clearDivisionRecordCache,
    deleteMesahaDivisionRecords,
    allowMesahaDivisionResubmit,
  };
  window.MesahaSuiteSync = api;
  window.MesahaSuiteSyncV31 = window.MesahaSuiteSyncV28 = window.MesahaSuiteSyncV27 = window.MesahaSuiteSyncV26 = window.MesahaSuiteSyncV25 = window.MesahaSuiteSyncV24 = window.MesahaSuiteSyncV22 = window.MesahaSuiteSyncV21 = api;
  window.MesahaSuiteSyncV20 = api;
  window.MesahaSuiteSyncV19 = api;
  window.MesahaSuiteSyncV18 = api;
  window.MesahaSuiteSyncV17 = api;
  window.MesahaSuiteSyncV14 = api;
  window.MesahaSuiteSyncV13 = api;
  window.MesahaSuiteSyncV12 = api;
  window.MesahaSuiteSyncV11 = api;
  window.MesahaSuiteSyncV10 = api;
  window.MesahaSuiteSyncV9 = api;
  window.MesahaSuiteSyncV8 = api;
  window.MesahaSuiteSyncV7 = api;
  function boot() {
    sanitizeMesahaDirtyState();
    installButton();
    watchStorage();
    dispatch();
    updateButton();
    if (navigator.onLine !== false && cloudSyncAllowed()) {
      setTimeout(() => repairFolderContextDirect().catch(() => {}), 900);
      if (isDirty()) scheduleAutoRetry(4200, true);
    } else if (!cloudSyncAllowed()) stopGuestSync();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
