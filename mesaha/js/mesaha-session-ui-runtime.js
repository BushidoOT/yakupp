/* source: mesaha-v87-full-account-drive-panel */
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
          PENDING_KEY = "mesaha_suite_pending_ops_v4",
          DRIVE_STATUS_KEY = "mesaha_suite_drive_status_v8",
          driveBusy = false,
          driveError = "",
          lastDriveRefreshAt = 0;
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
          var s = session();
          return !!(s && clean(s.access_token));
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
          if (googleActive())
            return {
              type: "Google hesabı",
              cls: "google",
              sub:
                clean(a.email || (s.user && s.user.email)) ||
                "Google ile doğrulanmış oturum açık.",
            };
          if (terminalPaired())
            return {
              type: "Terminal kodlu",
              cls: "terminal",
              sub: "Bu cihaz yerel terminal olarak eşleşmiş. Şeflik ve bulut işlemleri için Google ile giriş gerekir.",
            };
          if (t.active)
            return {
              type: "Terminal / Misafir",
              cls: "terminal",
              sub: "Bu cihaz yerel terminal modunda. Şeflik ve bulut işlemleri için Google ile giriş gerekir.",
            };
          return {
            type: "Yerel kullanım",
            cls: "",
            sub: "Şeflik ve bulut özellikleri için Google ile giriş gerekir.",
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
        function founderCanManageDrive(folder, status) {
          folder = folder || {};
          status = status || {};
          var role = clean(folder.role || folder.member_role).toLocaleLowerCase("tr-TR");
          return status.isOwner === true ||
            folder.is_creator === true || folder.isCreator === true || folder.creator === true ||
            ["owner", "creator", "kurucu"].indexOf(role) >= 0;
        }
        function driveApi() {
          return window.MesahaSuiteSync || window.MesahaSuiteSyncV31 || window.MesahaSuiteSyncV28 || window.MesahaSuiteSyncV27 || window.MesahaSuiteSyncV26 || window.MesahaSuiteSyncV22 || window.MesahaSuiteSyncV21 || null;
        }
        function sameDriveFolder(status, folder) {
          status = status || {};
          folder = folder || {};
          var statusFolderId = clean(status.seflikFolderId || status.seflik_folder_id),
            folderId = clean(folder.id || folder.folder_id || folder.folderId),
            statusKey = clean(status.seflikKey || status.seflik_key),
            folderKey = clean(folder.seflik_key || folder.seflikKey);
          if (statusFolderId && folderId) return statusFolderId === folderId;
          if (statusKey && folderKey) return statusKey === folderKey;
          return !clean(status.seflik) || fold(status.seflik) === fold(folder.seflik || folder.name);
        }
        function cachedDrive(folder) {
          var status = getJson(DRIVE_STATUS_KEY, null);
          return status && sameDriveFolder(status, folder) ? status : null;
        }
        function formatBytes(value) {
          var bytes = Number(value);
          if (!Number.isFinite(bytes) || bytes < 0) return "-";
          if (bytes < 1024) return Math.round(bytes) + " B";
          var units = ["KB", "MB", "GB", "TB"], size = bytes / 1024, unit = units[0];
          for (var i = 1; i < units.length && size >= 1024; i += 1) { size /= 1024; unit = units[i]; }
          return size.toLocaleString("tr-TR", { maximumFractionDigits: size >= 100 ? 0 : size >= 10 ? 1 : 2 }) + " " + unit;
        }
        function driveCardHtml(folder, online) {
          var status = cachedDrive(folder), loading = driveBusy && !status;
          if (loading) return '<section class="panel-drive-v87 loading"><div class="panel-drive-head-v87"><span class="panel-drive-logo-v87">△</span><div><small>ŞEFLİK GOOGLE DRIVE</small><b>Bağlantı kontrol ediliyor…</b></div></div></section>';
          if (!status) return '<section class="panel-drive-v87 unavailable"><div class="panel-drive-head-v87"><span class="panel-drive-logo-v87">△</span><div><small>ŞEFLİK GOOGLE DRIVE</small><b>' + esc(online ? (driveError || "Drive bilgisi henüz alınmadı") : "Offline • Son Drive bilgisi bulunamadı") + '</b></div></div><button type="button" class="panel-drive-refresh-v87" id="panelDriveRefreshV87">Durumu Yenile</button></section>';
          var connected = status.connected === true,
            isOwner = founderCanManageDrive(folder, status),
            canDisconnect = connected && founderCanManageDrive(folder, status),
            owner = clean(status.ownerName || status.name),
            ownerEmail = clean(status.ownerEmail || status.email),
            seflik = clean(status.seflik || folder.seflik || folder.name),
            folderName = clean(status.folderName),
            quota = status.quota || null,
            membership = isOwner ? "Kurucu" : "Şeflik üyesi",
            relation = isOwner ? "Bu hesap Drive bağlantısını yönetebilir" : "Kurucunun bağlı Drive alanı kullanılıyor",
            storage = quota ? (quota.remainingBytes == null ? "Sınırsız alan" : formatBytes(quota.remainingBytes) + " boş") : (connected ? "Alan bilgisi alınamadı" : "Drive bağlı değil"),
            statusText = connected ? "Drive bağlı" : (isOwner ? "Drive hesabı henüz bağlanmadı" : "Şeflik kurucusu Drive hesabını henüz bağlamadı");
          return '<section class="panel-drive-v87 ' + (connected ? "connected" : "disconnected") + '"><div class="panel-drive-head-v87"><span class="panel-drive-logo-v87">△</span><div><small>ŞEFLİK GOOGLE DRIVE</small><b>' + esc(statusText) + '</b><span>' + esc(relation) + '</span></div><i class="panel-drive-state-v87"></i></div><div class="panel-drive-grid-v87"><div><small>Drive Sahibi</small><strong>' + esc(owner || "Şeflik kurucusu") + '</strong><span>' + esc(ownerEmail || "E-posta bilgisi yok") + '</span></div><div><small>Aktif Şeflik</small><strong>' + esc(seflik || "Seçilmedi") + '</strong><span>' + esc(membership) + '</span></div><div><small>Drive Klasörü</small><strong>' + esc(folderName || (connected ? "Mesaha Suite klasörü" : "Oluşturulmadı")) + '</strong><span>' + esc(connected ? "Ortak Mesaha ve İstif alanı" : "Bağlantı bekleniyor") + '</span></div><div><small>Depolama</small><strong>' + esc(storage) + '</strong><span>' + esc(quota && quota.percent != null ? "%" + Number(quota.percent || 0).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " dolu" : (status.quotaError || "")) + '</span></div></div><div class="panel-drive-actions-v87"><button type="button" class="panel-drive-refresh-v87" id="panelDriveRefreshV87">' + (driveBusy ? "Kontrol ediliyor…" : "Durumu Yenile") + '</button>' + (!connected && isOwner && !status.googleRequired ? '<button type="button" class="panel-drive-connect-v87" id="panelDriveConnectV87">Drive Bağla</button>' : "") + (canDisconnect ? '<button type="button" class="panel-drive-disconnect-v90" id="panelDriveDisconnectV90">Drive Bağlantısını Kes</button>' : "") + '</div>' + (driveError ? '<p class="panel-drive-error-v87">' + esc(driveError) + '</p>' : "") + '</section>';
        }
        function bindDriveActions() {
          var refresh = $("panelDriveRefreshV87"), connect = $("panelDriveConnectV87"), disconnect = $("panelDriveDisconnectV90");
          if (refresh) refresh.onclick = function () { refreshDriveStatus(true); };
          if (connect) connect.onclick = function () {
            var api = driveApi();
            if (!api || typeof api.driveConnect !== "function") return toastStatus("Drive bağlantı modülü hazır değil.", "warning");
            connect.disabled = true;
            Promise.resolve(api.driveConnect()).then(function (out) {
              if (out && out.connected) refreshDriveStatus(true);
            }).catch(function (error) {
              driveError = clean(error && error.message || error);
              render();
            });
          };
          if (disconnect) disconnect.onclick = function () {
            var folder = activeFolder() || {}, status = cachedDrive(folder) || {}, api = driveApi();
            if (!founderCanManageDrive(folder, status)) return toastStatus("Drive bağlantısını yalnızca şeflik kurucusu kesebilir.", "warning");
            if (!api || typeof api.driveDisconnect !== "function") return toastStatus("Drive bağlantı modülü hazır değil.", "warning");
            if (navigator.onLine === false) return toastStatus("Drive bağlantısını kesmek için internet gerekli.", "warning");
            if (!confirm("Şefliğin kurucu Drive bağlantısı kaldırılsın mı? Mevcut Drive dosyaları silinmez; yeniden kullanmak için Drive hesabını tekrar bağlamanız gerekir.")) return;
            disconnect.disabled = true;
            disconnect.textContent = "Bağlantı kesiliyor…";
            driveError = "";
            Promise.resolve(api.driveDisconnect()).then(function () {
              lastDriveRefreshAt = 0;
              toastStatus("Şeflik Drive bağlantısı kaldırıldı.", "success");
              return refreshDriveStatus(true);
            }).catch(function (error) {
              driveError = clean(error && error.message || error || "Drive bağlantısı kaldırılamadı");
              render();
              toastStatus(driveError, "warning");
            });
          };
        }
        function refreshDriveStatus(force) {
          var api = driveApi();
          if (driveBusy || navigator.onLine === false || !api || typeof api.driveStatus !== "function") return Promise.resolve(cachedDrive(activeFolder()));
          if (!force && lastDriveRefreshAt && Date.now() - lastDriveRefreshAt < 15000) return Promise.resolve(cachedDrive(activeFolder()));
          driveBusy = true;
          driveError = "";
          render();
          return Promise.resolve(api.driveStatus()).then(function (status) {
            lastDriveRefreshAt = Date.now();
            if (status) {
              try { localStorage.setItem(DRIVE_STATUS_KEY, JSON.stringify(status)); } catch (e) {}
            }
            return status;
          }).catch(function (error) {
            driveError = clean(error && error.message || error || "Drive durumu alınamadı");
            return cachedDrive(activeFolder());
          }).finally(function () {
            driveBusy = false;
            render();
          });
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
            var before = card.querySelector(".panel-grid-v316") ||
              $("terminalCodePanelV557") || $("panelTelegramSectionV515");
            if (before && before.parentNode)
              before.parentNode.insertBefore(box, before);
            else card.appendChild(box);
          } else {
            var topAnchor = card.querySelector(".panel-grid-v316");
            if (topAnchor && box.nextSibling !== topAnchor)
              card.insertBefore(box, topAnchor);
          }
          card.classList.add("mesaha-panel-compact-v90");
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
          var user = s.user || {}, meta = user.user_metadata || {}, seflik = clean(folder.seflik || folder.name || panel.seflik || settings.seflik), bolme = clean(settings.bolmeNo || settings.bolme_no || panel.bolmeNo || panel.bolme_no), userId = clean(user.id || a.user_id || a.userId || t.pairedUserId || t.terminalCode), avatar = clean(a.avatar_url || a.google_avatar_url || meta.avatar_url || meta.picture || t.avatarUrl || t.avatar_url), device = clean(t.deviceName || t.label || navigator.platform || "Mobil cihaz");
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
            "</div><div class=\"panel-account-details-v84\">" + details.map(function (item) { return '<div><small>' + esc(item[0]) + '</small><strong>' + esc(item[1]) + '</strong></div>'; }).join("") + "</div>" + driveCardHtml(folder, online) + (userId ? '<details class="panel-account-id-v84"><summary>Hesap kimliği</summary><code>' + esc(userId) + '</code></details>' : "") + "<p>" +
            esc(l.sub) +
            '</p><button class="btn soft full logout" id="panelLogoutV563" type="button">Çıkış Yap</button>';
          var connection = $("panelConnectionV84");
          if (connection) connection.onclick = function () { toastStatus(online ? "Cihaz online; bulut ve şeflik senkronizasyonu kullanılabilir." : "Cihaz offline; kayıtlar cihazda korunuyor.", online ? "success" : "warning"); };
          bindDriveActions();
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
        function panelOpen() {
          var panel = $("userPanelOverlayV316");
          return !!(panel && !panel.classList.contains("hidden"));
        }
        function boot() {
          ensure();
          if (panelOpen()) refreshDriveStatus(false);
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
        ["mesaha:user-login", "mesaha:google-access-approved", "mesaha:terminal-mode-enabled", "mesaha-suite:shared-data-updated"].forEach(function (name) { window.addEventListener(name, boot, { passive: true }); });
        window.addEventListener("mesaha:seflik-folder-active-changed", function () {
          lastDriveRefreshAt = 0;
          driveError = "";
          boot();
        }, { passive: true });
        window.addEventListener("mesaha-suite:drive-status", function (event) {
          var status = event && event.detail;
          if (status) try { localStorage.setItem(DRIVE_STATUS_KEY, JSON.stringify(status)); } catch (e) {}
          driveError = "";
          render();
        }, { passive: true });
        if (window.MesahaUiHub)
          window.MesahaUiHub.watchClass("userPanelOverlayV316", function () {
            setTimeout(boot, 60);
          });
      })();
;
