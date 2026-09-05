/* source: mesaha-v504-user-panel-cleanup */
(function () {
        "use strict";
        function clean() {
          try {
            var sync = document.getElementById("panelSyncV316");
            if (sync) {
              sync.textContent = "";
              sync.style.display = "none";
              sync.setAttribute("hidden", "hidden");
            }
            ["userPanelCloseV316", "panelCloseInlineV393"].forEach(
              function (id) {
                var el = document.getElementById(id);
                if (el) {
                  el.style.display = "none";
                  el.setAttribute("hidden", "hidden");
                  el.onclick = null;
                }
              },
            );
            document
              .querySelectorAll(
                '#panelAdminOpenV316,[data-admin-open],[data-open-admin],[href*="admin.html"],[href*="yonetim"]',
              )
              .forEach(function (el) {
                el.remove();
              });
            var b = document.getElementById("panelAdminBroadcastsV400");
            if (b) b.remove();
            if (window.mesahaPanelV316) {
              window.mesahaPanelV316.openAdmin = function () {
                return false;
              };
            }
          } catch (e) {}
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", clean, { once: true });
        else clean();
        [160, 900].forEach(function (ms) { setTimeout(clean, ms); });
        window.addEventListener("mesaha:user-login", clean, { passive: true });
        window.addEventListener("pageshow", clean, { passive: true });
      })();
;

/* source: mesaha-v518-ip-profile-ping */
(function () {
        "use strict";
        if (window.__mesahaIpProfilePingV518) return;
        window.__mesahaIpProfilePingV518 = true;
        var SETTINGS_KEY = "cam_mesaha_ayarlar_v1",
          PANEL_KEY = "mesaha_panel_user_v316",
          SESSION_KEY = "mesaha_supabase_v500_session",
          IP_KEY = "mesaha_last_seen_ip_v518",
          DEV1 = "mesaha_cihaz_kodu_v1",
          DEV2 = "mesaha_supabase_v500_device";
        var TERMINAL_MODE_KEY = "mesaha_terminal_local_mode_v556";
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
        function fold(s) {
          return clean(s)
            .toLocaleLowerCase("tr-TR")
            .replace(/[ç]/g, "c")
            .replace(/[ğ]/g, "g")
            .replace(/[ı]/g, "i")
            .replace(/[ö]/g, "o")
            .replace(/[ş]/g, "s")
            .replace(/[ü]/g, "u");
        }
        function userKey(name, seflik) {
          return (
            (fold(name) + "__" + fold(seflik))
              .replace(/[^a-z0-9_-]+/g, "_")
              .slice(0, 120) || "bos"
          );
        }
        function readUser() {
          var u = getJson(PANEL_KEY, {}),
            st = getJson(SETTINGS_KEY, {});
          var g = clean(u.googleApproved && u.googleFullName);
          return {
            name: clean(g || u.name || st.ekipNot),
            seflik: clean(u.seflik || st.seflik),
            bolmeNo: clean(u.bolmeNo || st.bolmeNo),
            googleFullName: g,
            googleEmail: clean(u.googleEmail),
          };
        }
        function validIdentity(u) {
          u = u || {};
          if (
            window.MesahaRuntimeV527 &&
            typeof window.MesahaRuntimeV527.validIdentity === "function"
          )
            return window.MesahaRuntimeV527.validIdentity(u.name, u.seflik);
          var n = clean(u.name),
            sf = clean(u.seflik),
            ln = n.toLocaleLowerCase("tr-TR"),
            ls = sf.toLocaleLowerCase("tr-TR");
          return (
            n.length > 1 &&
            sf.length > 1 &&
            !/^(kullanıcı|kullanici|user|guest|misafir|boş|bos|-)$/.test(ln) &&
            !/^(şeflik|seflik|unknown|bilinmiyor|boş|bos|-)$/.test(ls)
          );
        }
        function token() {
          var s = getJson(SESSION_KEY, null);
          return clean(s && s.access_token);
        }
        function deviceId() {
          try {
            return clean(
              localStorage.getItem(DEV1) || localStorage.getItem(DEV2) || "",
            );
          } catch (e) {
            return "";
          }
        }
        function terminalMode() {
          try {
            var x = getJson(TERMINAL_MODE_KEY, null);
            return !!(x && x.active === true);
          } catch (e) {
            return false;
          }
        }
        function browserInfo() {
          var ua = navigator.userAgent || "",
            name = "Tarayıcı",
            ver = "";
          var m;
          if ((m = ua.match(/SamsungBrowser\/([\d.]+)/i))) {
            name = "Samsung Internet";
            ver = m[1];
          } else if ((m = ua.match(/Edg\/([\d.]+)/i))) {
            name = "Edge";
            ver = m[1];
          } else if ((m = ua.match(/Chrome\/([\d.]+)/i))) {
            name = "Chrome";
            ver = m[1];
          } else if ((m = ua.match(/CriOS\/([\d.]+)/i))) {
            name = "Chrome iOS";
            ver = m[1];
          } else if ((m = ua.match(/Firefox\/([\d.]+)/i))) {
            name = "Firefox";
            ver = m[1];
          } else if ((m = ua.match(/Version\/([\d.]+).*Safari/i))) {
            name = "Safari";
            ver = m[1];
          }
          return { browser: name, browserVersion: ver };
        }
        function deviceInfo() {
          var ua = navigator.userAgent || "",
            sw = (screen && screen.width) || "",
            sh = (screen && screen.height) || "",
            vw = window.innerWidth || "",
            vh = window.innerHeight || "",
            bi = browserInfo();
          var os = "Bilinmiyor";
          if (/Android/i.test(ua)) os = "Android";
          else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
          else if (/Windows/i.test(ua)) os = "Windows";
          else if (/Mac OS/i.test(ua)) os = "macOS";
          else if (/Linux/i.test(ua)) os = "Linux";
          return {
            deviceId: deviceId(),
            os: os,
            platform: navigator.platform || os,
            browser: bi.browser,
            browserVersion: bi.browserVersion,
            userAgent: ua,
            screen: sw + "x" + sh,
            viewport: vw + "x" + vh,
            language: navigator.language || "",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
            appVersion:
              (window.MESAHA_VERSION && window.MESAHA_VERSION.visibleVersion) ||
              "Mesaha İO",
            fileVersion:
              (window.MESAHA_VERSION && window.MESAHA_VERSION.version) ||
              "local",
          };
        }
        function renderIp() {
          var ip = "";
          try {
            ip = localStorage.getItem(IP_KEY) || "";
          } catch (e) {}
          var dev = $("panelDeviceV316"),
            u = readUser(),
            info = deviceInfo();
          if (dev)
            dev.value = [
              info.os,
              info.browser +
                (info.browserVersion ? " " + info.browserVersion : ""),
              info.screen,
            ]
              .filter(Boolean)
              .join(" • ");
          var grid = document.querySelector(
            "#userPanelOverlayV316 .panel-grid-v316",
          );
          if (grid && !$("panelIpV518")) {
            var lab = document.createElement("label");
            lab.className = "panel-field-v316 panel-ip-v518";
            lab.innerHTML =
              'IP Adresi<input id="panelIpV518" readonly type="text" placeholder="IP alınıyor…">';
            grid.appendChild(lab);
          }
          var inp = $("panelIpV518");
          if (inp) inp.value = ip || "IP alınıyor…";
          var tel = $("panelTelegramSectionV515");
          if (tel && !$("panelIpCardV518")) {
            var card = document.createElement("div");
            card.id = "panelIpCardV518";
            card.className = "mesaha-ip-card-v518";
            tel.parentNode.insertBefore(card, tel);
          }
          var c = $("panelIpCardV518");
          if (c)
            c.innerHTML =
              "<b>Bağlantı IP:</b> " +
              (ip || "Alınıyor…") +
              "<small>" +
              [
                u.name && u.seflik ? u.name + " • " + u.seflik : "",
                info.os + " • " + info.browser,
                info.screen,
              ]
                .filter(Boolean)
                .join(" / ") +
              "</small>";
        }
        var pingBusy = false,
          LAST_PING_KEY = "mesaha_profile_last_ping_v548";
        async function ping(reason, force) {
          if (window.MESAHA_SUITE_MODE) {
            renderIp();
            return true;
          }
          force =
            !!force ||
            /first_login|online|profile_saved/i.test(String(reason || ""));
          renderIp();
          if (terminalMode()) return false;
          var u = readUser();
          if (!validIdentity(u) || navigator.onLine === false || pingBusy)
            return false;
          var now = Date.now(),
            last = Number(localStorage.getItem(LAST_PING_KEY) || 0) || 0;
          if (!force && now - last < 240000) return true;
          pingBusy = true;
          try {
            var api =
              window.mesahaSupabaseV380 ||
              window.mesahaSupabaseV383 ||
              window.mesahaSupabase;
            if (!api || typeof api.edge !== "function") return false;
            var info = deviceInfo(),
              body = {
                userKey: userKey(u.name, u.seflik),
                name: u.name,
                seflik: u.seflik,
                bolmeNo: u.bolmeNo,
                deviceId: info.deviceId,
                deviceInfo: info,
                appVersion: info.appVersion,
                fileVersion: info.fileVersion,
                heartbeatReason: reason || "visible",
                source: "mesaha-v554-profile-heartbeat",
              };
            var j = await api.edge("profile_ping", body);
            if (j && j.ip) {
              try {
                localStorage.setItem(IP_KEY, j.ip);
              } catch (e) {}
            }
            try {
              localStorage.setItem(LAST_PING_KEY, String(Date.now()));
            } catch (e) {}
            renderIp();
            return !!(j && j.ok);
          } catch (e) {
            var pl = (e && e.payload) || {};
            if (
              pl.blocked === true &&
              /^(user_id|user_key|device_id|ip)$/i.test(
                clean(pl.block_type || pl.type || pl.blockType),
              ) &&
              typeof window.mesahaShowBlockedV547 === "function"
            ) {
              try {
                window.mesahaShowBlockedV547(
                  pl.reason || "Erişim yönetici tarafından kapatıldı.",
                );
              } catch (_e) {}
            }
            renderIp();
            return false;
          } finally {
            pingBusy = false;
          }
        }
        function bind() {
          renderIp();
          var heartbeatTimer = 0;
          function scheduleHeartbeat() {
            clearTimeout(heartbeatTimer);
            if (document.hidden || navigator.onLine === false) return;
            var u = window.MesahaUtils;
            if (u && u.lowPower && u.lowPower()) return;
            heartbeatTimer = setTimeout(function () {
              ping("periodic", false);
              scheduleHeartbeat();
            }, 1800000);
          }
          setTimeout(function () {
            ping("startup", true);
            scheduleHeartbeat();
          }, 1800);
          window.addEventListener(
            "online",
            function () {
              ping("online", true);
              scheduleHeartbeat();
            },
            { passive: true },
          );
          window.addEventListener(
            "offline",
            function () {
              clearTimeout(heartbeatTimer);
            },
            { passive: true },
          );
          document.addEventListener(
            "visibilitychange",
            function () {
              if (!document.hidden) ping("visible", false);
              scheduleHeartbeat();
            },
            { passive: true },
          );
          if (window.MesahaUiHub)
            window.MesahaUiHub.watchClass("userPanelOverlayV316", renderIp);
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", bind, { once: true });
        else bind();
        window.MesahaIpV518 = { ping: ping, render: renderIp };
      })();
;
