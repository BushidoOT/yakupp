(function (root) {
  "use strict";
  if (root.OrmanSuiteIdentity) return;

  var K = Object.freeze({
    session: "mesaha_supabase_v500_session",
    backupSession: "mesaha_supabase_v569_session_backup",
    access: "mesaha_google_access_v548",
    terminal: "mesaha_terminal_local_mode_v556",
    terminalOld: "mesaha_terminal_local_mode_v557",
    panel: "mesaha_panel_user_v316",
    settings: "cam_mesaha_ayarlar_v1",
    active: "mesaha_active_seflik_folder_v564",
    folders: "mesaha_suite_folder_cache_v4",
    device: "mesaha_supabase_v500_device"
  });

  function clean(value) {
    return String(value == null ? "" : value).trim().replace(/\s+/g, " ");
  }
  function fold(value) {
    return clean(value)
      .toLocaleLowerCase("tr-TR")
      .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
      .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function read(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || "null");
      return value == null ? fallback : value;
    } catch (_) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function validSession(value) {
    return !!(value && typeof value === "object" && clean(value.access_token));
  }
  function session() {
    var primary = read(K.session, null);
    if (validSession(primary)) return primary;
    var backup = read(K.backupSession, null);
    if (validSession(backup)) {
      write(K.session, backup);
      return backup;
    }
    try {
      var engine = root.mesahaSupabase || root.mesahaCloud || null;
      var live = engine && typeof engine.getStoredSession === "function" ? engine.getStoredSession() : null;
      if (validSession(live)) {
        write(K.session, live);
        write(K.backupSession, Object.assign({}, live, { backup_at: Date.now() }));
        return live;
      }
    } catch (_) {}
    return null;
  }
  function validTerminal(value) {
    return !!(value && typeof value === "object" && value.active === true);
  }
  function terminal() {
    var current = read(K.terminal, null);
    if (validTerminal(current)) return current;
    var old = read(K.terminalOld, null);
    if (validTerminal(old)) {
      write(K.terminal, old);
      try { localStorage.removeItem(K.terminalOld); } catch (_) {}
      return old;
    }
    return {};
  }
  function pairedTerminal() {
    var value = terminal();
    return !!(
      value.active === true &&
      clean(value.source) === "pair_code" &&
      clean(value.pairedUserId || value.owner_user_id) &&
      clean(value.terminalCode || value.code || value.terminalToken || value.token)
    );
  }
  function deviceId() {
    var value = terminal();
    return clean(value.deviceId || value.device_id || value.terminalDeviceId || (function () {
      try { return localStorage.getItem(K.device) || ""; } catch (_) { return ""; }
    })());
  }
  function terminalAuthPayload() {
    if (!pairedTerminal()) return {};
    var value = terminal();
    return {
      terminalCode: clean(value.terminalCode || value.code || value.p_terminal_code),
      terminalToken: clean(value.terminalToken || value.token || value.terminal_token),
      terminalPairedUserId: clean(value.pairedUserId || value.owner_user_id),
      terminalPairedEmail: clean(value.pairedEmail || value.owner_email),
      terminalDeviceId: deviceId(),
      deviceId: deviceId()
    };
  }
  function authType() {
    /* Terminal eşleşmesi aktifse cihazın gerçek çalışma kimliği terminaldir.
       Tarayıcıda kalmış eski Google oturumu terminal yetkisini gölgeleyemez. */
    if (pairedTerminal()) return "terminal";
    if (validSession(session())) return "google";
    if (validTerminal(terminal())) return "guest";
    var access = read(K.access, {}) || {};
    if (clean(access.status).toLocaleLowerCase("tr-TR") === "approved") return "cached";
    return "none";
  }
  function cloudAllowed() {
    var type = authType();
    return type === "google" || type === "terminal";
  }
  function activeFolder() {
    var active = read(K.active, {}) || {};
    var folders = read(K.folders, []);
    if (!Array.isArray(folders)) folders = [];
    var activeId = clean(active.id || active.folder_id || active.folderId);
    var activeKey = clean(active.seflik_key || active.seflikKey);
    var activeName = clean(active.seflik);
    return folders.find(function (folder) {
      if (!folder || folder.deleted) return false;
      var folderId = clean(folder.id || folder.folder_id || folder.folderId);
      var folderKey = clean(folder.seflik_key || folder.seflikKey);
      var folderName = clean(folder.seflik || folder.name);
      return !!(
        (activeId && folderId === activeId) ||
        (activeKey && folderKey === activeKey) ||
        (activeName && fold(folderName) === fold(activeName))
      );
    }) || (activeName || activeKey || activeId ? active : null);
  }
  function identity() {
    var storedSession = session() || {};
    var user = storedSession.user || {};
    var metadata = user.user_metadata || {};
    var access = read(K.access, {}) || {};
    var panel = read(K.panel, {}) || {};
    var term = terminal();
    var settings = read(K.settings, {}) || {};
    var active = read(K.active, {}) || {};
    var folder = activeFolder() || active;
    var seflik = clean(folder.seflik || folder.name || active.seflik || panel.activeSeflik || panel.seflik || term.seflik || settings.seflik);
    var seflikKey = clean(folder.seflik_key || folder.seflikKey || active.seflik_key || active.seflikKey || panel.activeSeflikKey || panel.seflikKey || settings.seflikKey || settings.seflik_key) || fold(seflik);
    var type = authType();
    var terminalMode = type === "terminal";
    return {
      type: type,
      userId: clean(terminalMode ? (term.pairedUserId || term.owner_user_id || term.terminalCode || term.deviceId || "local") : (user.id || access.user_id || access.userId || "local")),
      name: clean(terminalMode ? (term.name || term.pairedName || term.owner_name || term.pairedEmail || "Terminal") : (panel.googleFullName || panel.name || access.name || access.canonical_name || metadata.full_name || metadata.name || user.email || "Kullanıcı")),
      email: clean(terminalMode ? (term.pairedEmail || term.owner_email) : (access.email || panel.googleEmail || user.email)),
      avatar: clean(terminalMode ? term.avatarUrl : (panel.googleAvatarUrl || panel.avatarUrl || access.avatar_url || access.picture || metadata.avatar_url || metadata.picture)),
      seflik: seflik,
      seflikKey: seflikKey,
      folderId: clean(folder.id || folder.folder_id || folder.folderId || active.folder_id || active.folderId),
      role: clean(folder.role || active.role),
      bolme: clean(panel.bolmeNo || term.bolmeNo || settings.bolmeNo),
      google: type === "google" && validSession(storedSession),
      terminal: type === "terminal"
    };
  }
  function folderContext() {
    var id = identity();
    return { seflik: id.seflik, seflikKey: id.seflikKey, folderId: id.folderId };
  }
  function folderFromPayload(payload) {
    var data = payload && typeof payload === "object" ? payload : {};
    if (data.folder && typeof data.folder === "object") return data.folder;
    if (data.active_folder && typeof data.active_folder === "object") return data.active_folder;
    var rows = Array.isArray(data.folders) ? data.folders.filter(Boolean) : [];
    if (!rows.length) return {};
    var current = identity();
    var wantedId = clean(data.active_folder_id || data.activeFolderId || current.folderId);
    var wantedKey = clean(data.active_seflik_key || data.activeSeflikKey || current.seflikKey);
    var wantedName = clean(data.active_seflik || data.activeSeflik || current.seflik);
    return rows.find(function (row) {
      return !!(
        (wantedId && clean(row.id || row.folder_id || row.folderId) === wantedId) ||
        (wantedKey && clean(row.seflik_key || row.seflikKey || row.key) === wantedKey) ||
        (wantedName && fold(row.seflik || row.name) === fold(wantedName))
      );
    }) || (rows.length === 1 ? rows[0] : {});
  }
  function applyCanonicalContext(payload) {
    var data = payload && typeof payload === "object" ? payload : {};
    var access = data.access && typeof data.access === "object" ? data.access : {};
    var folder = folderFromPayload(data);
    var seflik = clean(data.seflik || access.seflik || access.canonical_seflik || folder.seflik || folder.name);
    var seflikKey = clean(data.seflikKey || data.seflik_key || access.seflikKey || access.seflik_key || folder.seflik_key || folder.seflikKey || folder.key);
    var folderId = clean(data.seflikFolderId || data.seflik_folder_id || access.seflikFolderId || access.seflik_folder_id || folder.id || folder.folder_id || folder.folderId);
    if (!seflik && !seflikKey && !folderId) return false;
    var current = read(K.active, {}) || {};
    var next = Object.assign({}, current, {
      seflik: seflik || clean(current.seflik),
      seflik_key: seflikKey || clean(current.seflik_key || current.seflikKey) || fold(seflik),
      folder_id: folderId || clean(current.folder_id || current.folderId),
      role: clean(data.membershipRole || access.role || folder.role || current.role),
      creator: Object.prototype.hasOwnProperty.call(data, "isOwner") ? data.isOwner === true : (folder.is_creator === true || folder.isCreator === true || current.creator === true),
      owner_user_id: clean(data.ownerUserId || access.owner_user_id || folder.owner_user_id || folder.created_by_user_id || current.owner_user_id),
      owner_email: clean(data.ownerEmail || access.owner_email || folder.owner_email || folder.created_by_email || current.owner_email),
      owner_name: clean(data.ownerName || access.owner_name || folder.owner_name || folder.created_by_name || current.owner_name),
      updatedAt: Date.now()
    });
    write(K.active, next);
    var panel = read(K.panel, {}) || {};
    panel.seflik = next.seflik; panel.activeSeflik = next.seflik;
    panel.seflikKey = next.seflik_key; panel.activeSeflikKey = next.seflik_key;
    panel.updatedAt = Date.now(); write(K.panel, panel);
    var settings = read(K.settings, {}) || {};
    settings.seflik = next.seflik; settings.seflikKey = next.seflik_key; settings.seflik_key = next.seflik_key;
    write(K.settings, settings);
    return next;
  }

  root.OrmanSuiteIdentity = Object.freeze({
    version: "1.0.0",
    keys: K,
    clean: clean,
    fold: fold,
    read: read,
    write: write,
    session: session,
    terminal: terminal,
    pairedTerminal: pairedTerminal,
    terminalAuthPayload: terminalAuthPayload,
    authType: authType,
    cloudAllowed: cloudAllowed,
    identity: identity,
    activeFolder: activeFolder,
    folderContext: folderContext,
    applyCanonicalContext: applyCanonicalContext
  });
})(window);
