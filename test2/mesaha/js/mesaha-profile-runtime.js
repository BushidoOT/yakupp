/* Mesaha İO V81 — yerel hesap paneli ve bağlantı göstergesi */
(function () {
  "use strict";
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch (_) { return {}; } }
  function clean(value) { return String(value == null ? "" : value).trim(); }
  function profile() {
    var panel = read("mesaha_panel_user_v316"), access = read("mesaha_google_access_v548"), terminal = read("mesaha_terminal_local_mode_v556"), session = read("mesaha_supabase_v500_session"), user = session.user || {}, meta = user.user_metadata || {};
    return {
      name: clean(panel.googleFullName || panel.name || access.canonical_name || access.name || terminal.name || meta.full_name || meta.name || user.email || "Kullanıcı"),
      avatar: clean(panel.googleAvatarUrl || panel.avatarUrl || access.avatar_url || access.google_avatar_url || terminal.avatarUrl || terminal.avatar_url || meta.avatar_url || meta.picture)
    };
  }
  function notify(message) { try { if (typeof window.toast === "function") return window.toast(message); } catch (_) {} }
  function updateOnline() {
    var online = navigator.onLine !== false, badge = document.getElementById("mesahaNetworkBadgeV81"), avatar = document.getElementById("mesahaAccountAvatar");
    [badge, avatar].forEach(function (node) { if (!node) return; node.classList.toggle("is-online", online); node.classList.toggle("is-offline", !online); });
    if (badge) { badge.textContent = online ? "Online" : "Offline"; badge.dataset.short = online ? "ON" : "OFF"; badge.setAttribute("aria-label", online ? "Bağlantı durumu: online" : "Bağlantı durumu: offline"); }
  }
  function openLocalPanel() {
    var trigger = document.getElementById("userPanelBtnV316");
    if (trigger) { trigger.click(); return; }
    var overlay = document.getElementById("userPanelOverlayV316"); if (overlay) overlay.classList.remove("hidden");
  }
  function paint() {
    var actions = document.querySelector(".top-actions-v316"); if (!actions) return;
    var old = document.getElementById("userPanelBtnV316"); if (old) old.hidden = true;
    var badge = document.getElementById("mesahaNetworkBadgeV81");
    if (!badge) { badge = document.createElement("button"); badge.id = "mesahaNetworkBadgeV81"; badge.type = "button"; badge.className = "mesaha-network-badge-v81"; badge.addEventListener("click", function () { notify(navigator.onLine !== false ? "Cihaz online; sunucu işlemleri kullanılabilir." : "Cihaz offline; ölçümler cihazda güvenle tutuluyor."); }); actions.appendChild(badge); }
    var button = document.getElementById("mesahaAccountAvatar");
    if (!button) { button = document.createElement("button"); button.id = "mesahaAccountAvatar"; button.type = "button"; button.setAttribute("aria-label", "Hesap ve aktif oturum bilgileri"); actions.appendChild(button); button.addEventListener("click", openLocalPanel, true); }
    var data = profile(), initials = clean(data.name).split(/\s+/).slice(0, 2).map(function (word) { return word.charAt(0); }).join("").toUpperCase();
    var media = data.avatar ? '<img src="' + data.avatar.replace(/"/g, "&quot;") + '" alt="" referrerpolicy="no-referrer">' : initials;
    button.innerHTML = '<span class="mesaha-avatar-media">' + media + '</span>';
    updateOnline();
  }
  function boot() { paint(); setTimeout(paint, 350); setTimeout(paint, 1400); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
  window.addEventListener("storage", paint);
  window.addEventListener("online", updateOnline, { passive: true });
  window.addEventListener("offline", updateOnline, { passive: true });
  ["mesaha:user-login", "mesaha:terminal-mode-enabled", "mesaha:google-access-approved", "pageshow"].forEach(function (name) { window.addEventListener(name, function () { setTimeout(paint, 50); }, { passive: true }); });
})();
