/* source: mesaha-v563-user-panel-logout-terminal-badge */
(function () {
        "use strict";
        if (window.__mesahaV563PanelSession) return;
        window.__mesahaV563PanelSession = true;
        var TERMINAL_KEY = "mesaha_terminal_local_mode_v556",
          TERMINAL_OLD = "mesaha_terminal_local_mode_v557",
          SESSION_KEY = "mesaha_supabase_v500_session",
          ACCESS_KEY = "mesaha_google_access_v548",
          PANEL_KEY = "mesaha_panel_user_v316";
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
          box.innerHTML =
            '<b>Oturum Durumu</b><div class="row"><span class="pill ' +
            l.cls +
            '">' +
            (l.cls === "google" ? "G" : l.cls === "terminal" ? "⌁" : "•") +
            " " +
            l.type +
            "</span>" +
            (name ? '<span class="pill">' + esc(name) + "</span>" : "") +
            (email ? '<span class="pill">' + esc(email) + "</span>" : "") +
            "</div><p>" +
            esc(l.sub) +
            '</p><button class="btn soft full logout" id="panelLogoutV563" type="button">Çıkış Yap</button>';
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
        if (window.MesahaUiHub)
          window.MesahaUiHub.watchClass("userPanelOverlayV316", function () {
            setTimeout(boot, 60);
          });
      })();
;
