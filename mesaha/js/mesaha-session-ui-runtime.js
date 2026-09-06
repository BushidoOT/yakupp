/* source: mesaha-v563-user-panel-logout-terminal-badge */
(function () {
        "use strict";
        if (window.__mesahaV563PanelSession) return;
        window.__mesahaV563PanelSession = true;
        var TERMINAL_KEY = "mesaha_terminal_local_mode_v556",
          TERMINAL_OLD = "mesaha_terminal_local_mode_v557",
          SESSION_KEY = "mesaha_supabase_v500_session",
          ACCESS_KEY = "mesaha_google_access_v548",
          PANEL_KEY = "mesaha_panel_user_v316",
          SETTINGS_KEY = "cam_mesaha_ayarlar_v1",
          ACTIVE_FOLDER_KEY = "mesaha_active_seflik_folder_v564",
          FOLDERS_KEY = "mesaha_suite_folder_cache_v4",
          PENDING_KEY = "mesaha_suite_pending_ops_v4";
        function $(id) {
          return document.getElementById(id);
        }
        function clean(v) {
          return String(v == null ? "" : v).trim();
        }
        function getJson(k, f) {
          try {
            var v = localStorage.getItem(k);
            return v ? JSON.parse(v) : f;
          } catch (e) {
            return f;
          }
        }
        function terminal() {
          var x =
            getJson(TERMINAL_KEY, null) || getJson(TERMINAL_OLD, null) || {};
          return x && x.active ? x : {};
        }
        function session() {
          return getJson(SESSION_KEY, null) || {};
        }
        function access() {
          return getJson(ACCESS_KEY, null) || {};
        }
        function googleActive() {
          var s = session(),
            a = access();
          return !!(
            (s && s.access_token) ||
            (a && a.status === "approved" && a.user_id)
          );
        }
        function terminalPaired() {
          var t = terminal();
          return !!(
            t.active &&
            t.source === "pair_code" &&
            (t.pairedUserId || t.terminalToken || t.terminalCode)
          );
        }
        function label() {
          var t = terminal(),
            a = access(),
            s = session();
          if (terminalPaired())
            return {
              type: "Terminal kodlu",
              cls: "terminal",
              sub: "Bu cihaz terminal kodu ile kullanıcıya eşleşmiş. Bulut yedekleri eşleşen kullanıcı adına çalışır.",
            };
          if (t.active)
            return {
              type: "Terminal / Misafir",
              cls: "terminal",
              sub: "Bu cihaz yerel terminal modunda. Bulut için terminal kodu veya Google gerekir.",
            };
          if (googleActive())
            return {
              type: "Google hesabı",
              cls: "google",
              sub:
                clean(a.email || (s.user && s.user.email)) ||
                "Google ile doğrulanmış oturum açık.",
            };
          return {
            type: "Yerel kullanım",
            cls: "",
            sub: "Bulut özellikleri için Google ile giriş veya terminal kodu gerekir.",
          };
        }
        function fold(v) {
          return clean(v).toLocaleLowerCase("tr-TR").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        }
        function activeFolder() {
          var active = getJson(ACTIVE_FOLDER_KEY, {}) || {}, folders = getJson(FOLDERS_KEY, []);
          if (!Array.isArray(folders)) folders = [];
          var id = clean(active.id || active.folder_id || active.folderId), key = clean(active.seflik_key || active.seflikKey), name = clean(active.seflik || active.name);
          return folders.find(function (row) { return id && clean(row && (row.id || row.folder_id || row.folderId)) === id; }) ||
            folders.find(function (row) { return key && clean(row && (row.seflik_key || row.seflikKey)) === key; }) ||
            folders.find(function (row) { return name && fold(row && (row.seflik || row.name)) === fold(name); }) || active;
        }
        function roleText(folder) {
          var role = clean(folder && (folder.role || folder.member_role)).toLocaleLowerCase("tr-TR");
          if (folder && (folder.is_creator === true || folder.isCreator === true || folder.creator === true) || ["owner", "creator", "kurucu"].indexOf(role) >= 0) return "Kurucu";
          if (["admin", "manager", "yönetici", "yonetici"].indexOf(role) >= 0) return "Yönetici";
          return role ? role.charAt(0).toLocaleUpperCase("tr-TR") + role.slice(1) : "Üye";
        }
        function toastStatus(message, kind) {
          try { if (typeof window.mesahaFloatToastV315 === "function") return window.mesahaFloatToastV315(message, "", kind || "success"); } catch (_) {}
          try { if (typeof window.toast === "function") return window.toast(message); } catch (_) {}
        }
        function ensure() {
          var card = document.querySelector(
            "#userPanelOverlayV316 .panel-card-v316",
          );
          if (!card) return;
          var box = $("panelSessionV563");
          if (!box) {
            box = document.createElement("div");
            box.id = "panelSessionV563";
            box.className = "panel-session-v563";
            var before =
              $("terminalCodePanelV557") || $("panelTelegramSectionV515");
            if (before && before.parentNode)
              before.parentNode.insertBefore(box, before);
            else card.appendChild(box);
          }
          render();
        }
        function render() {
          var box = $("panelSessionV563");
          if (!box) return;
          var l = label(),
            t = terminal(),
            a = access(),
            s = session();
          var name = clean(
            t.name ||
              a.canonical_name ||
              a.requested_name ||
              (s.user &&
                ((s.user.user_metadata && s.user.user_metadata.full_name) ||
                  s.user.email)) ||
              "",
          );
          var email = clean(
            t.pairedEmail || a.email || (s.user && s.user.email) || "",
          );
          var panel = getJson(PANEL_KEY, {}) || {}, settings = getJson(SETTINGS_KEY, {}) || {}, folder = activeFolder() || {}, pending = getJson(PENDING_KEY, []), online = navigator.onLine !== false;
          if (!Array.isArray(pending)) pending = [];
          var user = s.user || {}, meta = user.user_metadata || {}, seflik = clean(folder.seflik || folder.name || panel.seflik || settings.seflik), bolme = clean(settings.bolmeNo || settings.bolme_no || panel.bolmeNo || panel.bolme_no), userId = clean(user.id || a.user_id || a.userId || t.pairedUserId || t.terminalCode), avatar = clean(t.avatarUrl || t.avatar_url || a.avatar_url || a.google_avatar_url || meta.avatar_url || meta.picture), device = clean(t.deviceName || t.label || navigator.platform || "Mobil cihaz");
          var details = [
            ["Ad Soyad", name || "Belirtilmedi"],
            ["E-posta", email || "Terminal / yerel oturum"],
            ["Aktif Şeflik", seflik || "Seçilmedi"],
            ["Şeflik Yetkisi", seflik ? roleText(folder) : "-"],
            ["Aktif Bölme", bolme || "Seçilmedi"],
            ["Oturum Türü", l.type],
            ["Cihaz", device],
            ["Bekleyen İşlem", pending.length.toLocaleString("tr-TR")]
          ];
          box.innerHTML =
            '<div class="panel-account-head-v84"><div class="panel-account-avatar-v84">' + (avatar ? '<img src="' + esc(avatar) + '" alt="" referrerpolicy="no-referrer">' : esc((name || "K").split(/\s+/).slice(0, 2).map(function (word) { return word.charAt(0); }).join("").toLocaleUpperCase("tr-TR"))) + '</div><div><small>AKTİF HESAP</small><b>' + esc(name || "Kullanıcı") + '</b><span>' + esc(email || l.type) + '</span></div><button type="button" id="panelConnectionV84" class="panel-connection-v84 ' + (online ? "online" : "offline") + '"><i></i>' + (online ? "Online" : "Offline") + '</button></div><div class="row"><span class="pill ' +
            l.cls +
            '">' +
            (l.cls === "google" ? "G" : l.cls === "terminal" ? "⌁" : "•") +
            " " +
            l.type +
            "</span>" +
            (name ? '<span class="pill">' + esc(name) + "</span>" : "") +
            (email ? '<span class="pill">' + esc(email) + "</span>" : "") +
            "</div><div class=\"panel-account-details-v84\">" + details.map(function (item) { return '<div><small>' + esc(item[0]) + '</small><strong>' + esc(item[1]) + '</strong></div>'; }).join("") + "</div>" + (userId ? '<details class="panel-account-id-v84"><summary>Hesap kimliği</summary><code>' + esc(userId) + '</code></details>' : "") + "<p>" +
            esc(l.sub) +
            '</p><button class="btn soft full logout" id="panelLogoutV563" type="button">Çıkış Yap</button>';
          var connection = $("panelConnectionV84");
          if (connection) connection.onclick = function () { toastStatus(online ? "Cihaz online; bulut ve şeflik senkronizasyonu kullanılabilir." : "Cihaz offline; kayıtlar cihazda korunuyor.", online ? "success" : "warning"); };
          var b = $("panelLogoutV563");
          if (b && !b.__bound) {
            b.__bound = true;
            b.addEventListener("click", doLogout, true);
          }
        }
        function esc(v) {
          return clean(v).replace(/[&<>"']/g, function (m) {
            return {
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            }[m];
          });
        }
        async function doLogout(ev) {
          try {
            ev && ev.preventDefault();
            ev && ev.stopPropagation();
          } catch (e) {}
          if (!confirm("Bu cihazdaki oturum kapatılsın mı? Kayıtlar silinmez."))
            return;
          var b = $("panelLogoutV563");
          if (b) {
            b.disabled = true;
            b.textContent = "Çıkış yapılıyor…";
          }
          try {
            if (
              window.MesahaGoogleAuthV548 &&
              typeof window.MesahaGoogleAuthV548.logout === "function" &&
              googleActive()
            ) {
              await window.MesahaGoogleAuthV548.logout();
              return;
            }
          } catch (e) {}
          try {
            if (
              window.mesahaSupabaseV380 &&
              typeof window.mesahaSupabaseV380.signOut === "function"
            )
              await window.mesahaSupabaseV380.signOut("local");
          } catch (e) {}
          [
            "mesaha_supabase_v500_session",
            "mesaha_google_access_v548",
            "mesaha_terminal_local_mode_v556",
            "mesaha_terminal_local_mode_v557",
            "mesaha_google_email_exists_retry_v553",
            "mesaha_plain_google_oauth_v553",
          ].forEach(function (k) {
            try {
              localStorage.removeItem(k);
            } catch (e) {}
          });
          try {
            var p = getJson(PANEL_KEY, {});
            delete p.googleUserId;
            delete p.googleEmail;
            delete p.googleFullName;
            delete p.googleApproved;
            delete p.terminalMode;
            delete p.terminalPairedUserId;
            delete p.terminalPairedEmail;
            localStorage.setItem(PANEL_KEY, JSON.stringify(p));
          } catch (e) {}
          location.replace("./index.html?logout=" + Date.now());
        }
        function boot() {
          ensure();
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        [300, 900, 1800, 3500].forEach(function (ms) {
          setTimeout(boot, ms);
        });
        window.addEventListener("storage", boot);
        window.addEventListener("pageshow", function () {
          setTimeout(boot, 80);
        });
        window.addEventListener("online", boot, { passive: true });
        window.addEventListener("offline", boot, { passive: true });
        ["mesaha:user-login", "mesaha:google-access-approved", "mesaha:terminal-mode-enabled", "mesaha:seflik-folder-active-changed", "mesaha-suite:shared-data-updated"].forEach(function (name) { window.addEventListener(name, boot, { passive: true }); });
        if (window.MesahaUiHub)
          window.MesahaUiHub.watchClass("userPanelOverlayV316", function () {
            setTimeout(boot, 60);
          });
      })();
;
