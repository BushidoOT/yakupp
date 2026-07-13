(function () {
  "use strict";

  const VERSION = "8.0.0";
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
    folderCache: "mesaha_seflik_folder_cache_v529",
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
  async function post(url, action, data) {
    const body = {
      action,
      source: "mesaha-suite-v8",
      ...terminalAuth(),
      ...(data || {}),
    };
    const r = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.ok === false)
      throw new Error(
        clean(j.error || j.message) || "Sunucu hatası " + r.status,
      );
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
      #suiteFloatDockV8{position:fixed;left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right));bottom:var(--suite-float-bottom-v8,max(12px,env(safe-area-inset-bottom)));z-index:2147482500;display:none;align-items:stretch;justify-content:space-between;gap:8px;pointer-events:none;transition:bottom .16s ease,opacity .16s ease,transform .16s ease}
      #suiteFloatDockV8.is-visible{display:flex;opacity:1;transform:translateY(0)}
      #suiteFloatDockV8>button{pointer-events:auto;min-height:50px;max-width:230px;flex:1;border:1px solid rgba(255,255,255,.68);border-radius:16px;padding:10px 14px;display:none;align-items:center;justify-content:center;gap:8px;font:800 13px/1.1 system-ui;box-shadow:0 12px 30px rgba(9,45,29,.25);touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
      #suiteFloatDockV8>button.is-visible{display:flex}
      #suiteSyncFabV8{background:#174a32;color:#fff}
      #suiteHomeButtonV8{margin-left:auto;background:rgba(255,255,255,.97);color:#174a32}
      #suiteSyncFabV8 .suite-sync-icon{font-size:20px;line-height:1}
      #suiteSyncFabCountV8{min-width:18px;height:18px;padding:0 5px;display:none;place-items:center;border-radius:99px;background:#fff;color:#174a32;font-size:10px}
      @media(max-width:430px){#suiteFloatDockV8>button{min-width:0;max-width:none;padding:10px 11px;font-size:12px}#suiteFloatDockV8{gap:6px}}
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
      bottom = Math.max(10, Math.round(window.innerHeight - r.top + 8));
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

  async function syncManagement() {
    const list = pendingOps();
    if (!list.length) {
      clearDirty("suite");
      return { done: 0, left: 0 };
    }
    const remain = [];
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
        else if (item.type === "create_division")
          await edge("seflik_folder_create_division", {
            seflik: p.seflik,
            bolmeNo: p.bolmeNo,
            location: p.location || "",
          });
        else if (item.type === "delete_division")
          await edge("seflik_folder_delete_division", {
            seflik: p.seflik,
            bolmeNo: p.bolmeNo,
            confirmBolme: p.bolmeNo,
            permanent: true,
          });
        done++;
      } catch (e) {
        item.error = clean(e.message || e);
        remain.push(item);
      }
    }
    write(K.pending, remain);
    if (!remain.length) clearDirty("suite");
    return { done, left: remain.length };
  }
  async function syncMesaha() {
    const records = read(K.records, []);
    if (!Array.isArray(records)) return { done: 0 };
    const id = identity(),
      af = activeFolder(),
      seflik = clean((af && af.seflik) || id.seflik);
    if (!seflik || !records.length) {
      clearDirty("mesaha");
      return { done: 0 };
    }
    const groups = {};
    for (const r of records) {
      const b = clean(r.bolmeNo || r.bolme_no || id.bolme);
      if (!b) continue;
      (groups[b] || (groups[b] = [])).push(r);
    }
    let done = 0;
    for (const [bolme, rows] of Object.entries(groups)) {
      await edge("seflik_folder_create_division", {
        seflik,
        bolmeNo: bolme,
        location: "",
      });
      const token =
        "suitev8_" +
        fold(seflik) +
        "_" +
        fold(bolme) +
        "_" +
        Date.now().toString(36) +
        "_" +
        rows.length;
      for (let i = 0; i < rows.length; i += 150)
        await edge("seflik_folder_push", {
          seflik,
          bolmeNo: bolme,
          syncToken: token,
          records: rows.slice(i, i + 150),
          appVersion: "Mesaha Suite V8",
        });
      let backup = null,
        driveError = "";
      try {
        if (id.google)
          backup = await drive("backup_json", {
            seflik,
            appId: "mesaha",
            fileName: `Mesaha_${fold(seflik)}_${fold(bolme)}_${new Date().toISOString().slice(0, 10)}.json`,
            recordCount: rows.length,
            totalVolume: rows.reduce((s, r) => s + volume(r), 0),
            payload: {
              schema: "mesaha-suite-v8",
              app: "mesaha",
              seflik,
              bolme,
              createdAt: now(),
              records: rows,
            },
          });
      } catch (e) {
        driveError = clean(e.message || e);
      }
      await edge("seflik_folder_finish", {
        seflik,
        bolmeNo: bolme,
        syncToken: token,
        recordCount: rows.length,
        totalVolume: rows.reduce((s, r) => s + volume(r), 0),
        driveFileId: (backup && backup.fileId) || "",
        driveFileName: (backup && backup.fileName) || "",
        driveStatus: backup ? "saved" : id.google ? "error" : "not_connected",
        driveError,
        appVersion: "Mesaha Suite V8",
      });
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
  async function syncIstif() {
    const all = (await idbAll("records")).filter((r) => r && !r.isDemo),
      rows = all.filter((r) => r.syncStatus !== "synced");
    if (!rows.length) {
      clearDirty("istif");
      return { done: 0 };
    }
    const id = identity(),
      syncedBySeflik = {};
    let done = 0;
    for (const r of rows) {
      const seflik = clean(r.seflik || r.seflikName || id.seflik),
        bolme = clean(r.bolme || r.bolmeNo);
      if (!seflik || !bolme)
        throw new Error("İstif kaydında şeflik veya bölme eksik");
      await edge("seflik_folder_create_division", {
        seflik,
        bolmeNo: bolme,
        location: r.mevki || "",
      });
      r.driveFiles = Array.isArray(r.driveFiles) ? r.driveFiles : [];
      const photos = Array.isArray(r.photos) ? r.photos : [];
      for (let i = r.driveFiles.length; i < photos.length; i++) {
        if (!id.google)
          throw new Error(
            "Fotoğraflı istifleri göndermek için Suite hesabından Drive bağlayın",
          );
        const dataUrl = await dataUrlFromPhoto(photos[i]);
        if (!dataUrl) continue;
        const up = await drive("upload_photo", {
          seflik,
          recordDate: r.date || r.recordDate,
          bolmeNo: bolme,
          istifNo: r.istifNo,
          fileName: `${r.istifNo || "istif"}_${i + 1}.jpg`,
          dataUrl,
          mimeType: (photos[i] && photos[i].type) || "image/jpeg",
        });
        r.driveFiles.push(up);
        r.driveFolderId = up.folderId || r.driveFolderId;
        await idbPut("records", r);
      }
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
      r.syncStatus = "synced";
      r.updatedAt = now();
      await idbPut("records", r);
      (syncedBySeflik[seflik] || (syncedBySeflik[seflik] = [])).push(r);
      done++;
    }
    if (id.google)
      for (const seflik of Object.keys(syncedBySeflik))
        try {
          const payloadRows = all
            .filter(
              (r) => clean(r.seflik || r.seflikName || id.seflik) === seflik,
            )
            .map((r) => ({ ...r, photos: undefined }));
          await drive("backup_json", {
            seflik,
            appId: "istif",
            fileName: `Istif_${fold(seflik)}_${new Date().toISOString().slice(0, 10)}.json`,
            recordCount: payloadRows.length,
            totalVolume: payloadRows.reduce((s, r) => s + num(r.ster), 0),
            payload: {
              schema: "mesaha-suite-v8",
              app: "istif",
              seflik,
              createdAt: now(),
              records: payloadRows,
            },
          });
        } catch (e) {
          console.warn("[suite-v8] İstif Drive yedeği oluşturulamadı", e);
        }
    clearDirty("istif");
    return { done };
  }

  let syncing = false;
  async function syncAll(opts) {
    if (syncing) return { ok: false, busy: true };
    if (!navigator.onLine) {
      toast("İnternet yok. Değişiklikler cihazda güvende.", true);
      return { ok: false, offline: true };
    }
    syncing = true;
    updateButton();
    toast("Tüm uygulamalar senkronize ediliyor…");
    try {
      const before = dirtyState(),
        force =
          opts &&
          ["sync", "server", "manual", "suite", "floating-button"].includes(
            opts.source,
          );
      const management = await syncManagement();
      const mesaha =
        force || (before.mesaha && before.mesaha.dirty)
          ? await syncMesaha()
          : { done: 0, skipped: true };
      const istif =
        force || (before.istif && before.istif.dirty)
          ? await syncIstif()
          : { done: 0, skipped: true };
      const folder = await refreshFolderData({
        includeRecords: true,
        quiet: true,
        forceRecords: true,
      });
      write(K.last, { at: now(), management, mesaha, istif, folder });
      dispatch();
      toast("Suite, Mesaha İO ve İstif İO senkronize edildi.");
      try {
        window.dispatchEvent(
          new CustomEvent("mesaha-suite:sync-complete", {
            detail: { management, mesaha, istif, folder },
          }),
        );
      } catch {}
      return { ok: true, management, mesaha, istif, folder };
    } catch (e) {
      toast("Senkronizasyon tamamlanamadı: " + clean(e.message || e), true);
      throw e;
    } finally {
      syncing = false;
      updateButton();
    }
  }

  async function driveStatus() {
    const id = identity();
    if (!id.google) return { ok: true, connected: false, googleRequired: true };
    const x = await drive("status", { seflik: id.seflik });
    write(K.drive, x);
    return x;
  }
  async function driveConnect() {
    const id = identity();
    if (!id.google)
      throw new Error("Drive bağlantısı için Google ile giriş yapın");
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
  async function createSuiteBackup() {
    const id = identity();
    if (!id.google) throw new Error("Drive yedeği için Google ile giriş yapın");
    const mesaha = read(K.records, []),
      istif = (await idbAll("records")).map((r) => ({
        ...r,
        photos: undefined,
      }));
    const payload = {
      schema: "mesaha-suite-backup-v8",
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
    window.addEventListener("online", updateButton);
    window.addEventListener("offline", updateButton);
    const mo = new MutationObserver(queueDockPosition);
    mo.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["class", "style", "hidden"],
    });
    setInterval(queueDockPosition, 700);
  }

  const api = {
    version: VERSION,
    markDirty,
    clearDirty,
    isDirty,
    syncAll,
    driveStatus,
    driveConnect,
    driveFinish,
    driveDisconnect,
    createSuiteBackup,
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
    loadDivisionRecords,
  };
  window.MesahaSuiteSyncV8 = api;
  window.MesahaSuiteSyncV7 = api;
  function boot() {
    installButton();
    watchStorage();
    dispatch();
    updateButton();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
