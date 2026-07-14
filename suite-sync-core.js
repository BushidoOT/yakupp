(function () {
  "use strict";

  const VERSION = "27.0.0";
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
    return read(K.session, null) || read(K.backupSession, null) || {};
  }
  function terminal() {
    const t = read(K.terminal, null) || read(K.terminalOld, null) || {};
    return t && t.active ? t : {};
  }
  function identity() {
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
  function authHeaders() {
    const s = session();
    return {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: "Bearer " + clean(s.access_token || ANON_KEY),
    };
  }
  function terminalAuth() {
    const t = terminal();
    return t && t.source === "pair_code"
      ? {
          terminalCode: clean(t.terminalCode),
          terminalToken: clean(t.terminalToken),
          terminalPairedUserId: clean(t.pairedUserId),
          terminalPairedEmail: clean(t.pairedEmail),
        }
      : {};
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
  async function post(url, action, data) {
    const body = {
      action,
      source: "mesaha-suite-v27",
      ...terminalAuth(),
      ...(data || {}),
    };
    const r = await fetchWithTimeout(url, {
      method: "POST",
      cache: "no-store",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }, 30000);
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.ok === false) {
      if (j && j.blocked === true) { try { window.dispatchEvent(new CustomEvent("mesaha:security-blocked", { detail: j })); } catch (_) {} }
      const error = new Error(clean(j.error || j.message) || "Sunucu hatası " + r.status);
      error.status = r.status;
      error.code = clean(j.code || j.errorCode || "");
      error.retryable = j.retryable === true;
      error.detail = clean(j.detail || "");
      error.requestId = clean(j.requestId || "");
      error.retryAfter = num(j.retry_after || j.retryAfter);
      throw error;
    }
    return j;
  }
  const edge = (action, data) => post(SMOOTH, action, data);
  const drive = (action, data) => post(DRIVE, action, data);

  function dirtyState() {
    const d = read(K.dirty, {});
    return d && typeof d === "object" ? d : {};
  }
  function markDirty(app, meta) {
    const d = dirtyState();
    d[app || "suite"] = { dirty: true, at: now(), meta: meta || {} };
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
      #suiteFloatDockV8>button{pointer-events:auto;height:36px!important;min-height:36px!important;max-height:36px!important;flex:none;border:1px solid rgba(255,255,255,.72);border-radius:10px;padding:0 8px!important;display:none;align-items:center;justify-content:center;gap:4px;font:850 9.5px/1 system-ui!important;box-shadow:0 6px 15px rgba(9,45,29,.16);touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
      #suiteFloatDockV8>button.is-visible{display:flex}
      #suiteSyncFabV8{width:126px;background:#174a32;color:#fff}
      #suiteHomeButtonV8{width:86px;margin-left:auto;background:rgba(255,255,255,.98);color:#174a32}
      #suiteSyncFabV8 .suite-sync-icon{font-size:13px;line-height:1}
      #suiteSyncFabCountV8{min-width:17px;height:17px;padding:0 4px;display:none;place-items:center;border-radius:99px;background:#fff;color:#174a32;font-size:9px}
      @media(max-width:430px){#suiteFloatDockV8>button{height:34px!important;min-height:34px!important;max-height:34px!important;padding:0 7px!important;font-size:9px!important}#suiteSyncFabV8{width:118px}#suiteHomeButtonV8{width:80px}#suiteFloatDockV8{gap:5px}}
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
    if (document.getElementById("suiteSyncFabV8")) return;
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
      b.innerHTML = '<span aria-hidden="true">⌂</span><b>Suite</b>';
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

  function volume(r) {
    const d = num(r.diameter || r.cap),
      l = num(r.length || r.boy),
      q = Math.max(1, num(r.quantity || r.adet || 1));
    return d && l ? ((Math.PI * Math.pow(d / 100, 2)) / 4) * l * q : 0;
  }
  function activeFolder() {
    const a = read(K.active, {}),
      fs = read(K.folders, []);
    return (
      (Array.isArray(fs) ? fs : []).find(
        (f) =>
          f &&
          !f.deleted &&
          (clean(f.seflik_key || f.seflikKey) ===
            clean(a.seflik_key || a.seflikKey) ||
            clean(f.seflik) === clean(a.seflik)),
      ) || (clean(a.seflik) ? a : null)
    );
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
    if (!af) return { ok: false, reason: "no-folder" };
    if (navigator.onLine === false) return { ok: false, offline: true };
    const key = clean(af.seflik_key || af.seflikKey) || fold(af.seflik);
    const divisionsStore = read(K.divisions, {}),
      recordsStore = read(K.divisionRecords, {}),
      forestersStore = read(K.foresters, {});
    let list = Array.isArray(divisionsStore[key]) ? divisionsStore[key] : [];
    try {
      const out = await edge("seflik_folder_list", {
        seflik: af.seflik,
        folderSeflik: af.seflik,
      });
      const remote = (
        Array.isArray(out.divisions)
          ? out.divisions
          : Array.isArray(out.summaries)
            ? out.summaries
            : []
      )
        .map((d) => normalizeDivision(d, af))
        .filter(Boolean);
      if (remote.length || options.force) {
        const localPending = list.filter(
          (d) =>
            d &&
            (d.pending || d.local_pending) &&
            !remote.some((r) => clean(r.bolme_no) === clean(d.bolme_no)),
        );
        list = [...remote, ...localPending];
        divisionsStore[key] = list;
        write(K.divisions, divisionsStore);
      }
    } catch (e) {
      if (!options.quiet) throw e;
    }
    try {
      const out = await edge("seflik_folder_list_members", {
        seflik: af.seflik,
        folderSeflik: af.seflik,
      });
      const members = (Array.isArray(out.members) ? out.members : [])
        .map((m) => ({
          id: clean(m.user_id || m.id || m.email || m.name),
          userId: clean(m.user_id || m.member_user_id),
          name: clean(m.name || m.canonical_name || m.email),
          email: clean(m.email),
          avatarUrl: clean(m.avatar_url || m.avatarUrl),
          role: clean(m.role || m.member_role || "member"),
          isSelf: !!m.is_self,
          updatedAt: now(),
        }))
        .filter((m) => m.name);
      forestersStore[key] = members;
      write(K.foresters, forestersStore);
    } catch {}
    if (options.includeRecords) {
      recordsStore[key] =
        recordsStore[key] && typeof recordsStore[key] === "object"
          ? recordsStore[key]
          : {};
      for (const d of list) {
        const no = clean(d.bolme_no),
          cached = recordsStore[key][no],
          expected = num(d.record_count);
        const stale =
          options.forceRecords ||
          !Array.isArray(cached) ||
          (expected >= 0 && cached.length !== expected);
        if (!stale) continue;
        try {
          const out = await edge("seflik_folder_read", {
            seflik: af.seflik,
            folderSeflik: af.seflik,
            bolmeNo: no,
          });
          recordsStore[key][no] = Array.isArray(out.records) ? out.records : [];
          d.record_count = recordsStore[key][no].length;
          d.total_volume = num(
            out.total_volume ||
              d.total_volume ||
              recordsStore[key][no].reduce(
                (s, row) => s + volume(row.record_data || row),
                0,
              ),
          );
        } catch (e) {
          if (options.forceRecords && !options.quiet) throw e;
        }
      }
      write(K.divisionRecords, recordsStore);
      divisionsStore[key] = list;
      write(K.divisions, divisionsStore);
    }
    syncFolderCache(af, list);
    return { ok: true, divisions: list, records: recordsStore[key] || {} };
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
    store[key] = store[key] || {};
    store[key][no] = Array.isArray(out.records) ? out.records : [];
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

  function duplicateLike(error) {
    const text = clean(error && (error.message || error.error || error));
    return /already|exists|duplicate|unique|23505|mevcut|zaten|aynı bölme/i.test(text);
  }
  function pendingKey(item) {
    const p = (item && item.payload) || {};
    return [item && item.type, fold(p.seflik || p.oldName || ""), fold(p.bolmeNo || p.newName || p.member_user_id || "")].join("::");
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
    if (!af) throw new Error("Önce Suite ana menüsünden şeflik seçin");
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
            member_user_id: p.member_user_id,
          });
        else if (item.type === "remove_member")
          await edge("seflik_folder_remove_member", {
            seflik: p.seflik,
            member_user_id: p.member_user_id,
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
  function mergeMesahaRows(baseRows, incomingRows) {
    const map = new Map();
    const put = (row, i, source) => map.set(mesahaRecordKey(row, source + "_" + i), { ...(row && row.record_data ? row.record_data : (row || {})) });
    (Array.isArray(baseRows) ? baseRows : []).forEach((row, i) => put(row, i, "remote"));
    (Array.isArray(incomingRows) ? incomingRows : []).forEach((row, i) => put(row, i, "local"));
    return Array.from(map.values());
  }
  function syncTokenFingerprint(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const first = list[0] || {}, last = list[list.length - 1] || {};
    return [
      list.length,
      clean(first.barcode || first.barkodNo || first.barkod_no || first.id),
      clean(last.barcode || last.barkodNo || last.barkod_no || last.id),
      clean(last.updatedAt || last.updated_at || first.updatedAt || first.updated_at),
    ].join("|");
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
    const id = identity(), af = activeFolder(), seflik = clean((af && af.seflik) || id.seflik);
    if (!seflik || !records.length) { clearDirty("mesaha"); return { done: 0 }; }
    const groups = {};
    for (const r of records) {
      const b = clean(r.bolmeNo || r.bolme_no || id.bolme);
      if (!b) continue;
      (groups[b] || (groups[b] = [])).push(r);
    }
    let done = 0;
    for (const [bolme, localRows] of Object.entries(groups)) {
      try { await edge("seflik_folder_create_division", { seflik, bolmeNo: bolme, location: "" }); }
      catch (e) { if (!duplicateLike(e)) throw e; }
      let remoteRows = [];
      try {
        const remote = await edge("seflik_folder_read", { seflik, folderSeflik: seflik, bolmeNo: bolme });
        remoteRows = Array.isArray(remote.records) ? remote.records : [];
      } catch (e) { console.warn("[suite-v27] Ortak kayıtlar alınamadı; yerel kayıtlarla devam ediliyor", e); }
      const rows = mergeMesahaRows(remoteRows, localRows).map((r) => ({ ...r, seflik, bolmeNo: bolme, bolme_no: bolme }));
      const token = stableSyncToken(seflik, bolme, rows);
      for (let i = 0; i < rows.length; i += 150)
        await edge("seflik_folder_push", { seflik, bolmeNo: bolme, syncToken: token, records: rows.slice(i, i + 150), appVersion: "Mesaha Suite V27", mergeMode: "barcode" });
      let backup = null, driveError = "";
      try {
        if (id.google)
          backup = await drive("backup_json", {
            seflik, appId: "mesaha",
            fileName: `Mesaha_${fold(seflik)}_${fold(bolme)}_${new Date().toISOString().slice(0, 10)}.json`,
            recordCount: rows.length, totalVolume: rows.reduce((sum, r) => sum + volume(r), 0),
            payload: { schema: "mesaha-suite-v27", app: "mesaha", seflik, bolme, createdAt: now(), records: rows },
          });
      } catch (e) { driveError = clean(e.message || e); }
      await edge("seflik_folder_finish", {
        seflik, bolmeNo: bolme, syncToken: token, recordCount: rows.length,
        totalVolume: rows.reduce((sum, r) => sum + volume(r), 0),
        driveFileId: (backup && backup.fileId) || "", driveFileName: (backup && backup.fileName) || "",
        driveStatus: backup ? "saved" : id.google ? "error" : "not_connected", driveError,
        appVersion: "Mesaha Suite V27", mergeMode: "barcode",
      });
      clearStableSyncToken(seflik, bolme);
      done += rows.length;
    }
    clearDirty("mesaha");
    return { done };
  }
  function openDb() {
    return new Promise((resolve, reject) => {
      const q = indexedDB.open("mesaha-istif-prototype", 1);
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
    const all = (await idbAll("records")).filter((r) => r && !r.isDemo),
      rows = all.filter((r) => r.syncStatus !== "synced");
    if (!rows.length) {
      clearDirty("istif");
      return { done: 0, failed: 0, retryable: 0, pending: 0 };
    }
    const id = identity(),
      syncedBySeflik = {};
    let done = 0, failed = 0, retryableFailures = 0;
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
    if (id.google)
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
              schema: "mesaha-suite-v27",
              app: "istif",
              seflik,
              createdAt: now(),
              records: payloadRows,
            },
          });
        } catch (e) {
          console.warn("[suite-v27] İstif Drive yedeği oluşturulamadı", e);
        }
    const pending = (await idbAll("records")).filter((r) => r && !r.isDemo && r.syncStatus !== "synced").length;
    if (pending) markDirty("istif", { pending, failed, retryable: retryableFailures });
    else clearDirty("istif");
    return { done, failed, retryable: retryableFailures, pending };
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
      if (!id.google) throw edgeError;
      out = await drive("record_list", { seflik, seflikKey });
    }

    const remote = (Array.isArray(out && out.records) ? out.records : [])
      .map(normalizeRemoteIstifRecord)
      .filter(Boolean);
    if (!remote.length) return { received: 0, changed: 0 };

    const local = await idbAll("records");
    const byId = new Map(local.map((record) => [clean(record && record.id), record]));
    let changed = 0;
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
    return { received: remote.length, changed };
  }

  let syncing = false;
  let autoRetryTimer = 0;
  let autoRetryAttempt = 0;
  function scheduleAutoRetry(delayMs = 15000, reset = false) {
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
      const istifPull = await pullIstifRecords();
      const folder = await refreshFolderData({
        includeRecords: true,
        quiet: true,
        forceRecords: true,
      });
      write(K.last, { at: now(), management, mesaha, istif, istifPull, folder });
      dispatch();
      if (istif && istif.failed) {
        toast(`${istif.failed} İstif kaydı veya fotoğrafı cihazda bekliyor. Ayrıntıyı İstif İO'da görebilirsiniz.`, true);
        if (istif.retryable) scheduleAutoRetry(nextAutoRetryDelay());
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
      return { ok: true, management, mesaha, istif, istifPull, folder };
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
    const id = identity();
    if (!id.google) return { ok: true, connected: false, googleRequired: true };
    const x = await drive("status", { seflik: id.seflik });
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
    if (!id.google)
      throw new Error("Drive bağlantısı için Google ile giriş yapın");
    const status = await driveStatus();
    if (status && status.isOwner === false)
      throw new Error("Drive hesabını yalnızca şeflik kurucusu bağlayabilir");
    const redirect = location.origin + location.pathname.replace(/[^/]*$/, "");
    const x = await drive("oauth_start", {
      seflik: id.seflik,
      redirectUri: redirect,
    });
    if (!x.authorizationUrl)
      throw new Error("Google bağlantı adresi alınamadı");
    location.href = x.authorizationUrl;
  }
  async function driveFinish(code, state) {
    const redirect = location.origin + location.pathname.replace(/[^/]*$/, "");
    const x = await drive("oauth_finish", {
      code,
      state,
      redirectUri: redirect,
      seflik: identity().seflik,
    });
    write(K.drive, x);
    return x;
  }
  async function driveDisconnect() {
    const x = await drive("disconnect", { seflik: identity().seflik });
    write(K.drive, { connected: false });
    return x;
  }
  async function createMesahaBackup(options) {
    options = options || {};
    const id = identity(), af = activeFolder();
    if (!id.google) { openDriveSetup(); throw new Error("Drive yedeği için Google ile giriş yapın"); }
    await ensureDriveConnected({ redirect: true });
    const seflik = clean((af && af.seflik) || id.seflik), selected = clean(options.bolmeNo || "");
    if (!seflik) throw new Error("Önce şeflik seçin");
    const all = read(K.records, []), rows = (Array.isArray(all) ? all : []).filter((r) => !selected || clean(r.bolmeNo || r.bolme_no || id.bolme) === selected);
    if (!rows.length) throw new Error(selected ? `Bölme ${selected} için yedeklenecek Mesaha kaydı yok` : "Yedeklenecek Mesaha kaydı yok");
    return drive("backup_json", {
      seflik, appId: "mesaha",
      fileName: `Mesaha_${fold(seflik)}_${selected ? fold(selected) + "_" : ""}${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      recordCount: rows.length, totalVolume: rows.reduce((sum, r) => sum + volume(r), 0),
      payload: { schema: "mesaha-suite-v27", app: "mesaha", seflik, bolme: selected, createdAt: now(), settings: read(K.settings, {}), records: rows },
    });
  }
  async function restoreMesahaBackup(id, mode) {
    const out = await readBackup(id), p = out.payload || out.data || out || {};
    const incoming = Array.isArray(p.mesahaRecords) ? p.mesahaRecords : Array.isArray(p.records) ? p.records : [];
    if (!incoming.length) throw new Error("Bu yedekte Mesaha kaydı bulunamadı");
    const current = read(K.records, []), result = mode === "replace" ? incoming : (() => {
      const map = new Map((Array.isArray(current) ? current : []).map((r) => [String(r.id || r.barcode || Math.random()), r]));
      incoming.forEach((r) => map.set(String(r.id || r.barcode || Math.random()), r));
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
    if (!id.google) { openDriveSetup(); throw new Error("Drive yedeği için Google ile giriş yapın"); }
    await ensureDriveConnected({ redirect: true });
    const mesaha = read(K.records, []),
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
    const total = payload.mesahaRecords.reduce((s, r) => s + volume(r), 0);
    return drive("backup_json", {
      seflik: id.seflik,
      appId: "suite",
      fileName: `Mesaha_Suite_${fold(id.seflik || id.name)}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      recordCount: payload.mesahaRecords.length + payload.istifRecords.length,
      totalVolume: total,
      payload,
    });
  }
  const listBackups = () => drive("backup_list", { seflik: identity().seflik });
  const readBackup = (id) =>
    drive("backup_read", { id, seflik: identity().seflik });
  const deleteBackup = (id) =>
    drive("backup_delete", { id, seflik: identity().seflik });

  function watchStorage() {
    const orig = Storage.prototype.setItem;
    if (!orig.__suiteV8) {
      const wrapped = function (k, v) {
        const old = this.getItem(k),
          out = orig.call(this, k, v);
        if (
          this === localStorage &&
          k === K.records &&
          old !== String(v) &&
          !window.__suiteRemoteHydrating
        )
          markDirty("mesaha", { key: k });
        return out;
      };
      wrapped.__suiteV8 = true;
      Storage.prototype.setItem = wrapped;
    }
    window.addEventListener("storage", () => {
      dispatch();
      queueDockPosition();
    });
    window.addEventListener("mesaha:records-saved", () => {
      if (!window.__suiteRemoteHydrating) markDirty("mesaha");
    });
    window.addEventListener("mesaha:record-saved", () => {
      if (!window.__suiteRemoteHydrating) markDirty("mesaha");
    });
    window.addEventListener("mesaha:record-deleted", () => {
      if (!window.__suiteRemoteHydrating) markDirty("mesaha");
    });
    window.addEventListener("mesaha-istif:changed", () => markDirty("istif"));
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
    window.addEventListener("online", () => { updateButton(); scheduleAutoRetry(1800, true); });
    window.addEventListener("offline", () => { updateButton(); clearTimeout(autoRetryTimer); });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && navigator.onLine !== false && isDirty()) scheduleAutoRetry(2500, true);
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
    edge,
    drive,
    updateButton,
    getDock,
    registerHomeButton,
    positionDock,
    refreshFolderData,
    pullIstifRecords,
    loadDivisionRecords,
  };
  window.MesahaSuiteSyncV27 = window.MesahaSuiteSyncV26 = window.MesahaSuiteSyncV25 = window.MesahaSuiteSyncV24 = window.MesahaSuiteSyncV22 = window.MesahaSuiteSyncV21 = api;
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
    installButton();
    watchStorage();
    dispatch();
    updateButton();
    if (navigator.onLine !== false && isDirty()) scheduleAutoRetry(4200, true);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
