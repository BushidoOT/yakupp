(function () {
  "use strict";
  if (window.MesahaSuiteSecurityV26) return;

  var SUPABASE_URL = "https://swrbpdpotmirnmtqnuba.supabase.co";
  var ANON_KEY = "sb_publishable_G_ZFeUouDxg57Nne5pflfQ_cVGpdMbR";
  var EDGE_URL = SUPABASE_URL + "/functions/v1/smooth-function";
  var SESSION_KEYS = ["mesaha_supabase_v500_session", "mesaha_supabase_v569_session_backup"];
  var TERMINAL_KEYS = ["mesaha_terminal_local_mode_v556", "mesaha_terminal_local_mode_v557"];
  var BLOCK_CACHE_KEY = "mesaha_suite_security_block_v26";
  var SHARED_DEVICE_KEY = "mesaha_suite_security_device_v26";
  var CHECK_INTERVAL = 20000;
  var running = false;
  var lastCheck = 0;
  var intervalId = 0;

  function clean(v) { return String(v == null ? "" : v).trim(); }
  function readJson(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key) || "null"); return v == null ? fallback : v; }
    catch (_) { return fallback; }
  }
  function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function removeKey(key) { try { localStorage.removeItem(key); } catch (_) {} }
  function unique(list) {
    var out = [];
    (list || []).forEach(function (v) { v = clean(v); if (v && out.indexOf(v) < 0) out.push(v); });
    return out;
  }
  function session() {
    for (var i = 0; i < SESSION_KEYS.length; i++) {
      var s = readJson(SESSION_KEYS[i], null);
      if (s && (s.access_token || s.refresh_token || (s.user && s.user.id))) return s;
    }
    return {};
  }
  function saveSession(s) {
    if (!s || !s.access_token) return;
    writeJson(SESSION_KEYS[0], s);
    writeJson(SESSION_KEYS[1], s);
  }
  function terminal() {
    for (var i = 0; i < TERMINAL_KEYS.length; i++) {
      var t = readJson(TERMINAL_KEYS[i], null);
      if (t && t.active) return t;
    }
    return {};
  }
  function sharedDeviceId() {
    var id = clean(localStorage.getItem(SHARED_DEVICE_KEY));
    if (!id) {
      id = "suite_sec_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem(SHARED_DEVICE_KEY, id); } catch (_) {}
    }
    return id;
  }
  function deviceIds() {
    var keys = [
      SHARED_DEVICE_KEY,
      "mesaha_suite_device_v7",
      "mesaha_supabase_v500_device",
      "mesaha_istif_device_v5"
    ];
    var out = [sharedDeviceId()];
    keys.forEach(function (key) { try { out.push(localStorage.getItem(key)); } catch (_) {} });
    var t = terminal();
    out.push(t.deviceId, t.usedByDeviceId, t.used_by_device_id);
    return unique(out);
  }
  function currentDeviceId() {
    var path = location.pathname || "";
    var preferred = path.indexOf("/istif/") >= 0 ? "mesaha_istif_device_v5" : path.indexOf("/mesaha/") >= 0 ? "mesaha_supabase_v500_device" : "mesaha_suite_device_v7";
    try { return clean(localStorage.getItem(preferred)) || sharedDeviceId(); } catch (_) { return sharedDeviceId(); }
  }
  function subjectKey() {
    var s = session(), t = terminal();
    var uid = clean(s && s.user && s.user.id);
    if (uid) return "user:" + uid;
    var owner = clean(t.pairedUserId || t.ownerUserId || t.owner_user_id);
    if (owner) return "user:" + owner;
    if (t.active && clean(t.terminalCode)) return "terminal:" + clean(t.terminalCode);
    return "device:" + currentDeviceId();
  }
  function cachedBlock() { return readJson(BLOCK_CACHE_KEY, null); }
  function cacheBlock(info) {
    var blockType = clean(info.block_type || info.type || info.blockType);
    writeJson(BLOCK_CACHE_KEY, {
      blocked: true,
      subject: (blockType === "device_id" || blockType === "ip") ? "device:" + currentDeviceId() : subjectKey(),
      blockType: blockType,
      reason: clean(info.reason || info.error || "Erişim yönetici tarafından kapatıldı."),
      checkedAt: Date.now()
    });
  }
  function clearCachedBlock() { removeKey(BLOCK_CACHE_KEY); }

  function ensureStyle() {
    if (document.getElementById("suiteSecurityStyleV26")) return;
    var style = document.createElement("style");
    style.id = "suiteSecurityStyleV26";
    style.textContent = "#suiteSecurityBlockV26{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:calc(22px + env(safe-area-inset-top)) 22px calc(22px + env(safe-area-inset-bottom));box-sizing:border-box;background:linear-gradient(145deg,#111827 0%,#450a0a 100%);color:#fff;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Arial,sans-serif;text-align:center}#suiteSecurityBlockV26 .suite-security-box{width:min(520px,100%);padding:28px 22px;border:1px solid rgba(255,255,255,.22);border-radius:30px;background:rgba(255,255,255,.10);box-shadow:0 24px 90px rgba(0,0,0,.38);backdrop-filter:blur(14px)}#suiteSecurityBlockV26 .suite-security-icon{width:76px;height:76px;margin:0 auto 16px;border-radius:25px;display:grid;place-items:center;background:#dc2626;font-size:44px;font-weight:1000}#suiteSecurityBlockV26 h1{margin:0 0 12px;font-size:28px;line-height:1.08;font-weight:1000;letter-spacing:-.03em}#suiteSecurityBlockV26 p{margin:0;color:#fee2e2;font-size:16px;line-height:1.48;font-weight:800}#suiteSecurityBlockV26 small{display:block;margin-top:14px;color:rgba(255,255,255,.68);font-size:12px;line-height:1.45;font-weight:800;overflow-wrap:anywhere}html.suite-security-blocked-v26,body.suite-security-blocked-v26{overflow:hidden!important;touch-action:none!important}";
    document.head.appendChild(style);
  }
  function showBlocked(info) {
    cacheBlock(info || {});
    ensureStyle();
    var overlay = document.getElementById("suiteSecurityBlockV26");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "suiteSecurityBlockV26";
      overlay.setAttribute("role", "alertdialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.innerHTML = '<div class="suite-security-box"><div class="suite-security-icon">×</div><h1>Erişim engellendi</h1><p>Bu kullanıcı, cihaz veya bağlantı yönetici tarafından engellendi. Orman İO, Mesaha İO ve İstif İO kullanılamaz.</p><small id="suiteSecurityReasonV26"></small></div>';
      (document.body || document.documentElement).appendChild(overlay);
    }
    var reason = document.getElementById("suiteSecurityReasonV26");
    if (reason) reason.textContent = clean(info && (info.reason || info.error)) || "Yönetici ile iletişime geçin.";
    document.documentElement.classList.add("suite-security-blocked-v26");
    if (document.body) document.body.classList.add("suite-security-blocked-v26");
  }
  function hideBlocked() {
    var overlay = document.getElementById("suiteSecurityBlockV26");
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.documentElement.classList.remove("suite-security-blocked-v26");
    if (document.body) document.body.classList.remove("suite-security-blocked-v26");
  }

  async function refreshSession(old) {
    if (!old || !old.refresh_token || navigator.onLine === false) return old || {};
    var response = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST", cache: "no-store",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY },
      body: JSON.stringify({ refresh_token: old.refresh_token })
    });
    var out = await response.json().catch(function () { return {}; });
    if (!response.ok || !out.access_token) return old || {};
    var next = {
      access_token: out.access_token,
      refresh_token: out.refresh_token || old.refresh_token,
      expires_at: out.expires_at || Math.floor(Date.now() / 1000) + Number(out.expires_in || 3600),
      token_type: out.token_type || old.token_type || "bearer",
      user: out.user || old.user || {}
    };
    saveSession(next);
    return next;
  }
  async function authData() {
    var s = session(), t = terminal();
    if (s.refresh_token && Number(s.expires_at || 0) * 1000 < Date.now() + 60000) {
      try { s = await refreshSession(s); } catch (_) {}
    }
    var terminalPayload = {};
    if (t && t.active && t.source === "pair_code") {
      terminalPayload = {
        terminalCode: clean(t.terminalCode),
        terminalToken: clean(t.terminalToken),
        terminalPairedUserId: clean(t.pairedUserId),
        terminalPairedEmail: clean(t.pairedEmail)
      };
    }
    return { token: clean(s.access_token) || ANON_KEY, terminalPayload: terminalPayload };
  }

  async function check(force) {
    if (running) return false;
    if (!force && Date.now() - lastCheck < 4000) return false;
    lastCheck = Date.now();
    var cached = cachedBlock();
    if (navigator.onLine === false) {
      if (cached && cached.blocked && (cached.subject === subjectKey() || String(cached.subject || "").indexOf("device:") === 0)) showBlocked(cached);
      return false;
    }
    running = true;
    try {
      var auth = await authData();
      var ids = deviceIds();
      var response = await fetch(EDGE_URL, {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: "Bearer " + auth.token },
        body: JSON.stringify(Object.assign({
          action: "security_check",
          source: "suite-security-v26",
          deviceId: currentDeviceId(),
          deviceIds: ids,
          appPath: location.pathname || ""
        }, auth.terminalPayload))
      });
      var body = await response.json().catch(function () { return {}; });
      if (body && body.blocked === true) {
        showBlocked(body);
        return true;
      }
      if (response.ok && body && body.ok !== false) {
        clearCachedBlock();
        hideBlocked();
        return false;
      }
      if (cached && cached.blocked && cached.subject === subjectKey()) showBlocked(cached);
      return false;
    } catch (_) {
      if (cached && cached.blocked && cached.subject === subjectKey()) showBlocked(cached);
      return false;
    } finally { running = false; }
  }

  function handleBlockedEvent(event) {
    var detail = event && event.detail ? event.detail : {};
    if (detail && detail.blocked === true) showBlocked(detail);
  }
  function boot() {
    var cached = cachedBlock();
    if (cached && cached.blocked && (cached.subject === subjectKey() || String(cached.subject || "").indexOf("device:") === 0)) showBlocked(cached);
    setTimeout(function () { check(true); }, 80);
    if (!intervalId) intervalId = setInterval(function () { if (!document.hidden) check(false); }, CHECK_INTERVAL);
  }

  window.addEventListener("online", function () { setTimeout(function () { check(true); }, 100); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) check(true); });
  window.addEventListener("storage", function (event) {
    if (!event || SESSION_KEYS.indexOf(event.key) >= 0 || TERMINAL_KEYS.indexOf(event.key) >= 0 || event.key === BLOCK_CACHE_KEY) check(true);
  });
  window.addEventListener("mesaha:security-blocked", handleBlockedEvent);
  window.addEventListener("mesaha:user-login", function () { setTimeout(function () { check(true); }, 100); });
  window.addEventListener("mesaha:google-access-approved", function () { setTimeout(function () { check(true); }, 100); });
  window.addEventListener("mesaha:terminal-mode-enabled", function () { setTimeout(function () { check(true); }, 100); });

  window.MesahaSuiteSecurityV26 = { check: check, showBlocked: showBlocked, hideBlocked: hideBlocked, version: "26.0.0" };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
