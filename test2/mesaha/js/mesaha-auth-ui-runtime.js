/* source: mesaha-v427-supabase-guard */
(function () {
        "use strict";
        if (
          window.mesahaSupabaseV380 &&
          typeof window.mesahaSupabaseV380.ready === "function"
        ) {
          window.mesahaSupabase = window.mesahaSupabaseV380;
          window.mesahaSupabaseV383 = window.mesahaSupabaseV380;
        }
      })();
;

/* source: mesaha-inline-v316-user-admin-panel */
/* v316: Kullanıcı Paneli + Supabase eşitleme */
      (function () {
        "use strict";
        const STORAGE_KEY = "cam_mesaha_kayitlari_v1";
        const SETTINGS_KEY = "cam_mesaha_ayarlar_v1";
        const PANEL_USER_KEY = "mesaha_panel_user_v316";
        const USAGE_KEY = "mesaha_usage_stats_v316";
        const DEVICE_ID_KEY = "mesaha_cihaz_kodu_v1";
        const FIREBASE_CONFIG =
          (window.mesahaSupabaseV380 && window.mesahaSupabaseV380.config) || {};
        const FIREBASE_SDK_VERSION =
          (window.mesahaSupabaseV380 && window.mesahaSupabaseV380.sdkVersion) ||
          "9.23.0";
        let firebaseReadyPromise = null;
        let lastTick = Date.now();
        function $(id) {
          return document.getElementById(id);
        }
        function clean(v) {
          return String(v == null ? "" : v).trim();
        }
        function trDate() {
          const d = new Date();
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          return d.toISOString().slice(0, 10);
        }
        function trText() {
          return new Date().toLocaleString("tr-TR");
        }
        function esc(s) {
          return String(s == null ? "" : s).replace(
            /[&<>"']/g,
            (m) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[m],
          );
        }
        const jsonGet =
          (window.MesahaUtils && window.MesahaUtils.jsonGet) ||
          function (key, fallback) {
            try {
              const v = localStorage.getItem(key);
              return v ? JSON.parse(v) : fallback;
            } catch {
              return fallback;
            }
          };
        const jsonSet =
          (window.MesahaUtils && window.MesahaUtils.jsonSet) ||
          function (key, value) {
            try {
              localStorage.setItem(key, JSON.stringify(value));
              return true;
            } catch {
              return false;
            }
          };
        function records() {
          try {
            if (window.state && Array.isArray(window.state.records)) return window.state.records.slice();
            const store = window.MesahaStorageV527;
            if (store && typeof store.lastCommittedRecords === "function") {
              const committed = store.lastCommittedRecords();
              if (Array.isArray(committed)) return committed.slice();
            }
          } catch (_) {}
          const r = jsonGet(STORAGE_KEY, []);
          return Array.isArray(r) ? r : [];
        }
        function settings() {
          return Object.assign(
            { ekipNot: "", seflik: "", bolmeNo: "" },
            jsonGet(SETTINGS_KEY, {}),
          );
        }
        function saveSettings(s) {
          try {
            if (window.state && window.state.settings)
              Object.assign(window.state.settings, s || {});
            if (window.MesahaStorageV527)
              return window.MesahaStorageV527.saveSettings(
                window.state && window.state.settings
                  ? window.state.settings
                  : s || {},
                { reason: "panel-settings" },
              );
          } catch (e) {}
          return jsonSet(SETTINGS_KEY, s || {});
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
        function getDeviceId() {
          let id = "";
          try {
            id = localStorage.getItem(DEVICE_ID_KEY) || "";
          } catch {}
          if (!id) {
            id = [
              "cihaz",
              Date.now().toString(36),
              Math.random().toString(36).slice(2, 8),
            ].join("_");
            try {
              localStorage.setItem(DEVICE_ID_KEY, id);
            } catch {}
          }
          return id;
        }
        function deviceInfo() {
          const ua = navigator.userAgent || "";
          const plat = navigator.platform || "";
          const sw = screen && screen.width ? screen.width : "?";
          const sh = screen && screen.height ? screen.height : "?";
          const vw =
            window.innerWidth || document.documentElement.clientWidth || "?";
          const vh =
            window.innerHeight || document.documentElement.clientHeight || "?";
          const touch =
            "ontouchstart" in window || navigator.maxTouchPoints > 0;
          const small = Math.min(Number(sw) || 0, Number(sh) || 0);
          let type = "Bilgisayar";
          if (/Tablet|iPad/i.test(ua) || (touch && small >= 700))
            type = "Tablet";
          else if (/Mobi|Android|iPhone|iPod/i.test(ua) || touch)
            type = "Telefon";
          let os = "Bilinmiyor";
          if (/Android/i.test(ua)) os = "Android";
          else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
          else if (/Windows/i.test(ua)) os = "Windows";
          else if (/Mac OS/i.test(ua)) os = "macOS";
          else if (/Linux/i.test(ua)) os = "Linux";
          let browser = "Tarayıcı";
          if (/Edg\//i.test(ua)) browser = "Edge";
          else if (/OPR\//i.test(ua)) browser = "Opera";
          else if (/Chrome\//i.test(ua)) browser = "Chrome";
          else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua))
            browser = "Safari";
          else if (/Firefox\//i.test(ua)) browser = "Firefox";
          const screenText = sw + "x" + sh;
          const viewport = vw + "x" + vh;
          const label =
            type + " • " + os + " • " + browser + " • " + screenText;
          return {
            deviceId: getDeviceId(),
            userAgent: ua,
            platform: plat,
            screen: screenText,
            viewport,
            pixelRatio: window.devicePixelRatio || 1,
            language: navigator.language || "",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
            deviceType: type,
            os,
            browser,
            lastDevice: label,
            appVersion:
              (window.MESAHA_VERSION && window.MESAHA_VERSION.visibleVersion) ||
              "Mesaha İO",
            fileVersion:
              (window.MESAHA_VERSION && window.MESAHA_VERSION.version) ||
              "local",
          };
        }
        function readPanelUser() {
          const u = jsonGet(PANEL_USER_KEY, {});
          return {
            name: clean(u.name),
            seflik: clean(u.seflik),
            bolmeNo: clean(u.bolmeNo),
          };
        }
        function writePanelUser(u) {
          const current = settings();
          const name = clean(u.name),
            seflik = clean(u.seflik);
          const next = Object.assign({}, current, {
            ekipNot: name,
            seflik: seflik,
            bolmeNo: clean(u.bolmeNo) || "",
          });
          saveSettings(next);
          jsonSet(PANEL_USER_KEY, {
            name: next.ekipNot,
            seflik: next.seflik,
            bolmeNo: next.bolmeNo,
            updatedAt: new Date().toISOString(),
          });
          try {
            localStorage.setItem("mesaha_user_confirmed_v319", "1");
          } catch {}
          ["ekipNot", "seflik", "bolmeNo"].forEach((id) => {
            const el = $(id);
            if (el) {
              el.value = next[id] || "";
              try {
                el.dispatchEvent(new Event("input", { bubbles: true }));
              } catch {}
            }
          });
          try {
            if (typeof window.renderUser === "function") window.renderUser();
          } catch {}
          const badge = $("userBadge");
          if (badge) {
            badge.textContent =
              next.ekipNot && next.seflik
                ? next.ekipNot + " • " + next.seflik
                : "Giriş Yap";
            badge.classList.toggle(
              "login-needed",
              !(next.ekipNot && next.seflik),
            );
          }
          return true;
        }
        function volume(r) {
          const d = Number(String(r.diameter || r.cap || 0).replace(",", "."));
          const l = Number(String(r.length || r.boy || 0).replace(",", "."));
          const q = Number(r.quantity || r.adet || 1);
          if (!d || !l) return 0;
          return Math.round((((Math.PI * Math.pow(d / 100, 2)) / 4) * l * q) * 1000 + Number.EPSILON) / 1000;
        }
        function dateMsOf(r) {
          const raw =
            r.createdAt ||
            r.updatedAt ||
            r.productionDate ||
            r.uretimTarihi ||
            "";
          const ms = Date.parse(raw);
          return Number.isFinite(ms) ? ms : 0;
        }
        function weekKey(d) {
          const x = new Date(d);
          const first = new Date(x.getFullYear(), 0, 1);
          const days = Math.floor((x - first) / 86400000);
          return (
            x.getFullYear() +
            "-W" +
            String(Math.ceil((days + first.getDay() + 1) / 7)).padStart(2, "0")
          );
        }
        function summarize(resetAtMs) {
          const list = records();
          const today = trDate();
          const wk = weekKey(new Date());
          const statsList = resetAtMs
            ? list.filter((r) => dateMsOf(r) > resetAtMs)
            : list.slice();
          const sum = {
            recordCount: statsList.length,
            adet: 0,
            m3: 0,
            todayRecords: 0,
            todayM3: 0,
            weekRecordCount: 0,
            weekM3: 0,
            treeTotals: {},
            productTotals: {},
          };
          statsList.forEach((r) => {
            const q = Number(r.quantity || r.adet || 1);
            const m = volume(r);
            sum.adet += q;
            sum.m3 += m;
            const d = (
              r.productionDate ||
              r.uretimTarihi ||
              r.createdAt ||
              ""
            ).slice(0, 10);
            if (d === today) {
              sum.todayRecords++;
              sum.todayM3 += m;
            }
            if (weekKey(new Date(dateMsOf(r) || Date.now())) === wk) {
              sum.weekRecordCount++;
              sum.weekM3 += m;
            }
            const tree =
              clean(r.treeType || r.agacTuru || r.agacAdi || "Belirsiz") ||
              "Belirsiz";
            const prod =
              clean(r.productType || r.odunTuru || r.odunAdi || "Belirsiz") ||
              "Belirsiz";
            sum.treeTotals[tree] = (sum.treeTotals[tree] || 0) + m;
            sum.productTotals[prod] = (sum.productTotals[prod] || 0) + m;
          });
          sum.m3 = Number(sum.m3.toFixed(3));
          sum.todayM3 = Number(sum.todayM3.toFixed(3));
          sum.weekM3 = Number(sum.weekM3.toFixed(3));
          return sum;
        }
        function loadUsage() {
          const u = jsonGet(USAGE_KEY, {});
          const today = trDate();
          if (u.day !== today) {
            u.day = today;
            u.todayLoginCount = 0;
            u.todayMs = 0;
          }
          if (!sessionStorage.getItem("mesaha_v316_login_counted")) {
            u.todayLoginCount = Number(u.todayLoginCount || 0) + 1;
            u.totalLoginCount = Number(u.totalLoginCount || 0) + 1;
            sessionStorage.setItem("mesaha_v316_login_counted", "1");
          }
          u.totalMs = Number(u.totalMs || 0);
          u.todayMs = Number(u.todayMs || 0);
          u.lastSeen = trText();
          jsonSet(USAGE_KEY, u);
          return u;
        }
        function flushUsage() {
          const u = loadUsage();
          const now = Date.now();
          const diff = Math.max(0, now - lastTick);
          lastTick = now;
          u.totalMs = Number(u.totalMs || 0) + diff;
          u.todayMs = Number(u.todayMs || 0) + diff;
          u.lastSeen = trText();
          u.lastSeenMs = now;
          jsonSet(USAGE_KEY, u);
          return u;
        }
        function fmtM3(n) {
          return (
            Number(n || 0).toLocaleString("tr-TR", {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            }) + " m³"
          );
        }
        function fmtMs(ms) {
          ms = Number(ms || 0);
          const h = Math.floor(ms / 3600000);
          const m = Math.floor((ms % 3600000) / 60000);
          if (h) return h + " sa " + m + " dk";
          return Math.max(0, m) + " dk";
        }
        function toast(title, sub, kind) {
          if (typeof window.mesahaFloatToastV315 === "function")
            window.mesahaFloatToastV315(title, sub || "", kind || "warning");
          else if (typeof window.toast === "function") window.toast(title);
        }
        function loadScript(src) {
          return new Promise((resolve, reject) => {
            if (document.querySelector('script[src="' + src + '"]'))
              return resolve();
            const s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = () =>
              reject(new Error("Supabase bağlantı motoru yüklenemedi"));
            document.head.appendChild(s);
          });
        }
        async function firebaseReady() {
          return await window.mesahaSupabaseV380.ready();
        }
        async function resetAtMs() {
          try {
            const { db } = await firebaseReady();
            const doc = await db
              .collection("adminSettings")
              .doc("statsReset")
              .get();
            const d = doc.exists ? doc.data() || {} : {};
            return Number(d.resetAtMs || 0);
          } catch {
            return Number(
              localStorage.getItem("mesaha_stats_reset_at_v316") || 0,
            );
          }
        }
        async function syncUser(reason) {
          try {
            if (
              window.MesahaIpV518 &&
              typeof window.MesahaIpV518.ping === "function"
            )
              return await window.MesahaIpV518.ping(
                reason || "legacy-sync",
                true,
              );
          } catch (e) {}
          return false;
        }
        function setSyncText(t) {
          const el = $("panelSyncTextV316");
          if (el) el.textContent = t;
        }
        function renderPanelStats() {
          const usage = flushUsage();
          const stats = summarize(
            Number(localStorage.getItem("mesaha_stats_reset_at_v316") || 0),
          );
          const u = readPanelUser();
          const box = $("panelStatsV316");
          if (box)
            box.innerHTML = [
              ["Toplam Kayıt", stats.recordCount.toLocaleString("tr-TR")],
              ["Toplam m³", fmtM3(stats.m3)],
              [
                "Bugün Giriş",
                Number(usage.todayLoginCount || 0).toLocaleString("tr-TR"),
              ],
              ["Bugün Süre", fmtMs(usage.todayMs)],
              ["Toplam Süre", fmtMs(usage.totalMs)],
              ["Son Görülme", usage.lastSeen || "-"],
            ]
              .map(
                (a) =>
                  '<div class="panel-stat-v316"><small>' +
                  a[0] +
                  "</small><b>" +
                  a[1] +
                  "</b></div>",
              )
              .join("");
          const dev = $("panelDeviceV316");
          if (dev)
            dev.value =
              (deviceInfo().platform || "Cihaz") +
              " • " +
              (deviceInfo().screen || "");
          const n = $("panelNameV316"),
            s = $("panelSeflikV316"),
            b = $("panelBolmeV316");
          if (n) n.value = u.name;
          if (s) s.value = u.seflik;
          if (b) b.value = u.bolmeNo;
        }
        function openPanel() {
          renderPanelStats();
          const ov = $("userPanelOverlayV316");
          if (ov) ov.classList.remove("hidden");
          setSyncText("Kullanıcı ve cihaz bilgisi güvenli şekilde kaydedilir");
        }
        function closePanel() {
          const ov = $("userPanelOverlayV316");
          if (ov) ov.classList.add("hidden");
        }
        function savePanel() {
          const name = clean(($("panelNameV316") || {}).value),
            seflik = clean(($("panelSeflikV316") || {}).value);
          if (!name || !seflik) {
            toast(
              "Kullanıcı adı ve şeflik gerekli.",
              "İlk giriş için doldur",
              "warning",
            );
            return;
          }
          writePanelUser({
            name: name,
            seflik: seflik,
            bolmeNo: ($("panelBolmeV316") || {}).value,
          });
          renderPanelStats();
          setSyncText(
            "Kullanıcı yerelde kaydedildi • mesaha verisi yalnızca Mesaha/Yedek işlemlerinde gönderilir",
          );
          toast(
            "Kullanıcı bilgileri kaydedildi.",
            "Mesaha verisi gereksiz yere gönderilmez",
            "success",
          );
        }
        async function cloudBackup() {
          var h = window.MesahaHybridCloudV508;
          if (h && typeof h.backup === "function") return h.backup();
          throw new Error("Güvenli bulut motoru hazırlanıyor");
        }
        async function openCloudRestore() {
          const ov = $("cloudRestoreOverlayV316");
          const list = $("cloudRestoreListV316");
          const info = $("cloudRestoreInfoV316");
          if (ov) ov.classList.remove("hidden");
          if (list)
            list.innerHTML =
              '<div class="cloud-item-v316">Yedekler yükleniyor…</div>';
          try {
            const user = readPanelUser();
            const key = userKey(user.name, user.seflik);
            const { db } = await firebaseReady();
            const snap = await db
              .collection("backups")
              .where("userKey", "==", key)
              .get();
            const arr = [];
            snap.forEach((doc) => {
              const d = doc.data() || {};
              arr.push(Object.assign({ docId: doc.id }, d));
            });
            arr.sort(
              (a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0),
            );
            if (info) info.textContent = arr.length + " yedek bulundu";
            if (!arr.length) {
              if (list)
                list.innerHTML =
                  '<div class="cloud-item-v316">Bulutta yedek bulunamadı.</div>';
              return;
            }
            if (list)
              list.innerHTML = arr
                .slice(0, 30)
                .map(
                  (b, i) =>
                    '<div class="cloud-item-v316"><b>' +
                    esc(b.fileName || "Mesaha yedeği") +
                    "</b><small>" +
                    esc(b.createdAt || "-") +
                    " • " +
                    Number(b.recordCount || 0) +
                    ' kayıt</small><button class="btn primary" data-cloud-restore="' +
                    esc(b.docId) +
                    '" type="button">Bu Yedeği Yükle</button></div>',
                )
                .join("");
          } catch (e) {
            if (info) info.textContent = "Yedekler alınamadı";
            if (list)
              list.innerHTML =
                '<div class="cloud-item-v316">' +
                esc(e && e.message ? e.message : "İnterneti kontrol et") +
                "</div>";
          }
        }
        async function restoreCloud(id) {
          if (!id) return;
          if (
            !confirm(
              "Bu bulut yedeği mevcut kayıtların yerine yüklenecek. Devam edilsin mi?",
            )
          )
            return;
          try {
            const { db } = await firebaseReady();
            const ref = db.collection("backups").doc(id);
            const doc = await ref.get();
            if (!doc.exists) throw new Error("Yedek bulunamadı");
            const d = doc.data() || {};
            let payload =
              d.payload || (d.payloadText ? JSON.parse(d.payloadText) : null);
            let recs = [];
            if (d.recordsChunked) {
              const chunks = await ref.collection("chunks").get();
              const arr = [];
              chunks.forEach((c) => {
                const cd = c.data() || {};
                arr.push({
                  index: Number(cd.index || 0),
                  records: Array.isArray(cd.records) ? cd.records : [],
                });
              });
              arr.sort((a, b) => a.index - b.index);
              recs = arr.flatMap((x) => x.records);
              payload = payload || {};
            } else {
              if (!payload || !Array.isArray(payload.records))
                throw new Error("Yedek formatı geçersiz");
              recs = payload.records;
            }
            if (!Array.isArray(recs))
              throw new Error("Yedek kayıtları okunamadı");
            const merged =
              payload && payload.settings
                ? Object.assign({}, settings(), payload.settings)
                : Object.assign({}, settings());
            const rr = window.MesahaStorageV527
              ? await window.MesahaStorageV527.replaceAll(recs, merged, {
                  reason: "legacy-cloud-restore",
                })
              : { ok: false };
            if (!rr || rr.ok === false)
              throw new Error("Yedek kalıcı depolamaya yazılamadı");
            toast("Bulut yedeği yüklendi.", "Sayfa yenileniyor", "success");
            setTimeout(() => location.reload(), 700);
          } catch (e) {
            toast(
              "Bulut yedeği yüklenemedi.",
              e && e.message ? e.message : "Hata",
              "error",
            );
          }
        }
        function sendSupport() {}
        function bind() {
          loadUsage();
          const badge = $("userBadge");
          if (badge) {
            badge.setAttribute("title", "Kullanıcı Paneli");
            badge.addEventListener("click", openPanel);
          }
          const btn = $("userPanelBtnV316");
          if (btn) btn.addEventListener("click", openPanel);
          const x = $("userPanelCloseV316");
          if (x) x.addEventListener("click", closePanel);
          const x2 = $("panelClose2V316");
          if (x2) x2.addEventListener("click", closePanel);
          const save = $("panelSaveV316");
          if (save) save.addEventListener("click", savePanel);
          const sync = $("panelSyncV316");
          if (sync)
            sync.addEventListener("click", () => {
              setSyncText(
                "Mesaha verisi sadece Mesaha dosyası / Yedek Al / Buluta Yedekle işlemlerinde gönderilir",
              );
              toast(
                "Hazır.",
                "Gereksiz otomatik istatistik gönderimi kapalı",
                "success",
              );
            });
          if (!window.MESAHA_SUITE_MODE) {
            const cb = $("cloudBackupBtnV316");
            if (cb) cb.addEventListener("click", cloudBackup);
            const cr = $("cloudRestoreBtnV316");
            if (cr) cr.addEventListener("click", openCloudRestore);
          }
          const crc = $("cloudRestoreCloseV316");
          if (crc)
            crc.addEventListener("click", () => {
              const ov = $("cloudRestoreOverlayV316");
              if (ov) ov.classList.add("hidden");
            });
          const list = $("cloudRestoreListV316");
          if (list)
            list.addEventListener("click", (e) => {
              const b = e.target.closest("[data-cloud-restore]");
              if (b) restoreCloud(b.getAttribute("data-cloud-restore"));
            });
          window.addEventListener("pagehide", flushUsage);
          setSyncText(
            "Otomatik istatistik kapalı • Mesaha/Yedek işleminde gönderilir",
          ); /* v519: otomatik startup/online/visible/periodic admin istatistik sync kapalı */
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", bind, { once: true });
        else bind();
        window.mesahaPanelV316 = {
          open: openPanel,
          sync: syncUser,
          cloudBackup,
          openCloudRestore,
        };
      })();
;

/* source: mesaha-inline-v323-online-firebase */
/* Eski çevrimiçi motor emekliye ayrıldı. Güncel Hybrid Cloud/Drive köprüsü bu uyumluluk nesnesini doldurur. */
      (function () {
        "use strict";
        window.mesahaOnlineV317 = window.mesahaOnlineV317 || {};
      })();
;

/* source: mesaha-inline-v319-user-backup-delete */
/* Eski yedek yöneticisi emekliye ayrıldı. Güncel Hybrid Cloud/Drive köprüsü aynı API'yi devralır. */
      (function () {
        "use strict";
        window.mesahaUserBackupsV318 = window.mesahaUserBackupsV318 || {};
      })();
;

/* source: mesaha-inline-v319-first-login-gate */
/* v319: İlk kullanıcı girişinde otomatik Yakup/Yaylacık yazma kapatıldı */
      (function () {
        "use strict";
        const PANEL_KEY = "mesaha_panel_user_v316";
        const SETTINGS_KEY = "cam_mesaha_ayarlar_v1";
        function $(id) {
          return document.getElementById(id);
        }
        function clean(v) {
          return String(v == null ? "" : v).trim();
        }
        const jsonGet =
          (window.MesahaUtils && window.MesahaUtils.jsonGet) ||
          function (k, f) {
            try {
              const v = localStorage.getItem(k);
              return v ? JSON.parse(v) : f;
            } catch {
              return f;
            }
          };
        const jsonSet =
          (window.MesahaUtils && window.MesahaUtils.jsonSet) ||
          function (k, v) {
            try {
              localStorage.setItem(k, JSON.stringify(v));
              return true;
            } catch {
              return false;
            }
          };
        function validUser(name, seflik) {
          if (
            window.MesahaRuntimeV527 &&
            typeof window.MesahaRuntimeV527.validIdentity === "function"
          )
            return window.MesahaRuntimeV527.validIdentity(name, seflik);
          name = clean(name);
          seflik = clean(seflik);
          const n = name.toLocaleLowerCase("tr-TR"),
            sf = seflik.toLocaleLowerCase("tr-TR");
          return (
            name.length > 1 &&
            seflik.length > 1 &&
            !/^(kullanıcı|kullanici|user|guest|misafir|boş|bos|-)$/.test(n) &&
            !/^(şeflik|seflik|unknown|bilinmiyor|boş|bos|-)$/.test(sf)
          );
        }
        function savedUser() {
          const u = jsonGet(PANEL_KEY, {});
          if (validUser(u.name, u.seflik)) return u;
          const list = [];
          try {
            if (window.state && window.state.settings)
              list.push(window.state.settings);
          } catch {}
          try {
            if (
              window.MesahaStorageV527 &&
              typeof window.MesahaStorageV527.lastCommittedSettings ===
                "function"
            )
              list.push(window.MesahaStorageV527.lastCommittedSettings());
          } catch {}
          list.push(jsonGet(SETTINGS_KEY, {}));
          for (const st of list) {
            if (st && validUser(st.ekipNot, st.seflik))
              return {
                name: clean(st.ekipNot),
                seflik: clean(st.seflik),
                bolmeNo: clean(st.bolmeNo),
                fromSettings: true,
              };
          }
          return {};
        }
        function hasUser() {
          const u = savedUser();
          return validUser(u.name, u.seflik);
        }
        function notify(t, s, k) {
          try {
            if (typeof window.mesahaFloatToastV315 === "function")
              return window.mesahaFloatToastV315(t, s || "", k || "warning");
          } catch {}
          try {
            if (typeof window.toast === "function") return window.toast(t);
          } catch {}
        }
        function clearFakeDefaultsOnFresh() {
          /* Eski örnek kullanıcı temizliği artık veri yazmaz. Açılışta localStorage henüz
       çoğalmamış olabilir; boş değer kaydetmek IndexedDB'deki gerçek profili ezebilirdi. */
          return;
        }
        function apply() {
          clearFakeDefaultsOnFresh();
          const badge = $("userBadge");
          const btn = $("userPanelBtnV316");
          const title = $("userPanelTitleV316");
          const sync = $("panelSyncTextV316");
          const n = $("panelNameV316"),
            sf = $("panelSeflikV316"),
            b = $("panelBolmeV316");
          if (!hasUser()) {
            if (badge) {
              badge.textContent = "Giriş Yap";
              badge.classList.add("login-needed");
              badge.title = "İlk giriş için kullanıcı bilgisi gir";
            }
            if (btn && window.MesahaSeflikGovernanceApi)
              window.MesahaSeflikGovernanceApi.renderTopProfile();
            if (title) title.textContent = "İlk Giriş";
            if (sync)
              sync.textContent =
                "Kullanıcı adı ve şeflik girilmeden bulut eşitleme başlamaz";
            if (n && !n.__v319Touched) {
              n.value = "";
            }
            if (sf && !sf.__v319Touched) {
              sf.value = "";
            }
            if (b && !b.__v319Touched) {
              b.value = "";
            }
          } else {
            const u = savedUser();
            if (badge) {
              badge.textContent = clean(u.name) + " • " + clean(u.seflik);
              badge.classList.remove("login-needed");
            }
            if (btn && window.MesahaSeflikGovernanceApi)
              window.MesahaSeflikGovernanceApi.renderTopProfile();
            if (title) title.textContent = "Kullanıcı Paneli";
          }
        }
        function openLoginOnce() {
          if (window.__mesahaGoogleAuthV548) return;
          if (hasUser()) return;
          if (sessionStorage.getItem("mesaha_v319_login_prompted")) return;
          sessionStorage.setItem("mesaha_v319_login_prompted", "1");
          try {
            if (
              window.mesahaFirstLoginV321 &&
              typeof window.mesahaFirstLoginV321.open === "function"
            )
              return window.mesahaFirstLoginV321.open();
          } catch {}
          const ov = $("firstLoginOverlayV321");
          if (ov) {
            ov.classList.remove("hidden");
            setTimeout(() => {
              try {
                ($("firstLoginNameV321") || {}).focus();
              } catch {}
            }, 120);
          }
        }
        function bindTouchFlags() {
          ["panelNameV316", "panelSeflikV316", "panelBolmeV316"].forEach(
            (id) => {
              const el = $(id);
              if (el && !el.__v319Touch) {
                el.__v319Touch = true;
                el.addEventListener("input", () => {
                  el.__v319Touched = true;
                });
              }
            },
          );
        }
        function closeRecoveredLogin() {
          if (!hasUser()) return;
          const ov = $("firstLoginOverlayV321");
          if (ov) ov.classList.add("hidden");
          try {
            sessionStorage.removeItem("mesaha_v319_login_prompted");
          } catch {}
        }
        function refreshAfterRecovery() {
          apply();
          closeRecoveredLogin();
        }
        function boot() {
          apply();
          bindTouchFlags();
          setTimeout(apply, 300);
          setTimeout(openLoginOnce, 1500);
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        [
          "mesaha:storage-recovered",
          "mesaha:settings-saved",
          "mesaha:identity-restored",
        ].forEach((evt) =>
          window.addEventListener(evt, refreshAfterRecovery, { passive: true }),
        );
        [600, 1400, 3000, 5500].forEach((ms) =>
          setTimeout(refreshAfterRecovery, ms),
        );
        window.mesahaLoginGateV319 = {
          apply: apply,
          hasUser: hasUser,
          open: openLoginOnce,
        };
      })();
;

/* source: mesaha-inline-v321-first-login-simple */
/* V5.32: İlk kayıt/giriş düğmesi yerel kayıtla anında tamamlanır; ağ veya IndexedDB beklenmez. */
      (function () {
        "use strict";
        const PANEL_KEY = "mesaha_panel_user_v316";
        const SETTINGS_KEY = "cam_mesaha_ayarlar_v1";
        let saveBusy = false;
        function $(id) {
          return document.getElementById(id);
        }
        function clean(v) {
          return String(v == null ? "" : v)
            .trim()
            .replace(/\s+/g, " ");
        }
        function jsonGet(k, f) {
          try {
            const v = localStorage.getItem(k);
            return v ? JSON.parse(v) : f;
          } catch (e) {
            return f;
          }
        }
        function jsonSet(k, v) {
          try {
            localStorage.setItem(k, JSON.stringify(v));
            return true;
          } catch (e) {
            return false;
          }
        }
        function validIdentity(name, seflik) {
          try {
            if (
              window.MesahaRuntimeV527 &&
              typeof window.MesahaRuntimeV527.validIdentity === "function"
            )
              return window.MesahaRuntimeV527.validIdentity(name, seflik);
          } catch (e) {}
          name = clean(name);
          seflik = clean(seflik);
          if (name.length < 2 || seflik.length < 2) return false;
          const n = name.toLocaleLowerCase("tr-TR"),
            s = seflik.toLocaleLowerCase("tr-TR");
          return (
            !/^(kullanıcı|kullanici|user|guest|misafir|boş|bos|-)$/.test(n) &&
            !/^(şeflik|seflik|unknown|bilinmiyor|boş|bos|-)$/.test(s)
          );
        }
        function hasUser() {
          const u = jsonGet(PANEL_KEY, {});
          return validIdentity(u.name, u.seflik);
        }
        function toast(t, s, k) {
          try {
            if (typeof window.mesahaFloatToastV315 === "function")
              return window.mesahaFloatToastV315(t, s || "", k || "warning");
          } catch (e) {}
          try {
            if (typeof window.toast === "function")
              return window.toast(t, s || "", k || "warning");
          } catch (e) {}
          try {
            alert([t, s].filter(Boolean).join("\n"));
          } catch (e) {}
        }
        function log(kind, err, extra) {
          try {
            if (window.MesahaErrorLog)
              window.MesahaErrorLog.error(kind, err, extra || {});
          } catch (e) {}
        }
        function closeBigPanel() {
          const big = $("userPanelOverlayV316");
          if (big) big.classList.add("hidden");
        }
        function open() {
          if (window.__mesahaGoogleAuthV548) return;
          if (hasUser()) return;
          closeBigPanel();
          const ov = $("firstLoginOverlayV321");
          if (!ov) return;
          ov.classList.remove("hidden");
          setTimeout(() => {
            try {
              ($("firstLoginNameV321") || {}).focus();
            } catch (e) {}
          }, 100);
        }
        function close() {
          const ov = $("firstLoginOverlayV321");
          if (ov) ov.classList.add("hidden");
        }
        function setField(id, value) {
          const el = $(id);
          if (!el) return;
          el.value = value || "";
          try {
            el.dispatchEvent(new Event("input", { bubbles: true }));
          } catch (e) {}
        }
        function finishUi(name, seflik, settings) {
          setField("ekipNot", name);
          setField("seflik", seflik);
          setField("panelNameV316", name);
          setField("panelSeflikV316", seflik);
          if (settings && settings.bolmeNo)
            setField("panelBolmeV316", settings.bolmeNo);
          const badge = $("userBadge");
          if (badge) {
            badge.textContent = name + " • " + seflik;
            badge.classList.remove("login-needed");
            badge.title = "Kullanıcı panelini aç";
          }
          const btn = $("userPanelBtnV316");
          if (btn && window.MesahaSeflikGovernanceApi)
            window.MesahaSeflikGovernanceApi.renderTopProfile();
          const title = $("userPanelTitleV316");
          if (title) title.textContent = "Kullanıcı Paneli";
          closeBigPanel();
          close();
          try {
            sessionStorage.removeItem("mesaha_v319_login_prompted");
          } catch (e) {}
          try {
            if (window.mesahaLoginGateV319) window.mesahaLoginGateV319.apply();
          } catch (e) {}
          try {
            if (typeof window.renderUser === "function") window.renderUser();
          } catch (e) {}
          try {
            window.dispatchEvent(
              new CustomEvent("mesaha:user-login", {
                detail: { name, seflik },
              }),
            );
          } catch (e) {}
        }
        function backgroundDurableSave(settings, name, seflik) {
          try {
            if (
              !window.MesahaStorageV527 ||
              typeof window.MesahaStorageV527.saveSettings !== "function"
            )
              return;
            const work = window.MesahaStorageV527.saveSettings(settings, {
              reason: "first-login-v532",
            });
            let durableTimer = 0;
            const timeout = new Promise((resolve) => {
              durableTimer = setTimeout(
                () =>
                  resolve({
                    ok: false,
                    timeout: true,
                    error: "Depolama doğrulaması zaman aşımına uğradı",
                  }),
                5000,
              );
            });
            Promise.race([Promise.resolve(work), timeout])
              .then((result) => {
                if (!result || result.ok === false) {
                  log(
                    "first-login.durable-save",
                    new Error(
                      (result && result.error) ||
                        "Kalıcı depolama doğrulanamadı",
                    ),
                    { name, seflik, timeout: !!(result && result.timeout) },
                  );
                  toast(
                    "Giriş tamamlandı.",
                    "Güvenli depolama arka planda tekrar doğrulanacak.",
                    "warning",
                  );
                }
              })
              .catch((err) =>
                log("first-login.durable-save", err, { name, seflik }),
              )
              .finally(() => {
                if (durableTimer) clearTimeout(durableTimer);
              });
          } catch (err) {
            log("first-login.durable-save-start", err, { name, seflik });
          }
        }
        function save() {
          if (window.__mesahaGoogleAuthV548) return;
          if (saveBusy) return;
          const name = clean(($("firstLoginNameV321") || {}).value),
            seflik = clean(($("firstLoginSeflikV321") || {}).value);
          if (!validIdentity(name, seflik)) {
            toast(
              "Geçerli kullanıcı adı ve şeflik gerekli.",
              "Boş veya genel ad kullanılamaz.",
              "warning",
            );
            return;
          }
          const button = $("firstLoginSaveV321");
          saveBusy = true;
          if (button) {
            button.disabled = true;
            button.setAttribute("aria-busy", "true");
            button.dataset.oldText = button.textContent || "Giriş Yap";
            button.textContent = "Kaydediliyor…";
          }
          try {
            const current = jsonGet(SETTINGS_KEY, {}),
              settings = Object.assign({}, current, {
                ekipNot: name,
                seflik: seflik,
              });
            if (window.state && window.state.settings)
              Object.assign(window.state.settings, settings);
            const effective =
              window.state && window.state.settings
                ? window.state.settings
                : settings;
            let installId = "";
            try {
              if (
                window.MesahaRuntimeV527 &&
                typeof window.MesahaRuntimeV527.installIdentity === "function"
              )
                installId = clean(
                  window.MesahaRuntimeV527.installIdentity().id,
                );
            } catch (e) {}
            const settingsOk = jsonSet(SETTINGS_KEY, effective);
            const panelOk = jsonSet(PANEL_KEY, {
              name,
              seflik,
              bolmeNo: clean(effective.bolmeNo || ""),
              updatedAt: new Date().toISOString(),
              installId: installId || undefined,
            });
            try {
              localStorage.setItem("mesaha_user_confirmed_v319", "1");
              if (installId)
                localStorage.setItem("mesaha_install_id_v527", installId);
            } catch (e) {}
            if (!settingsOk || !panelOk)
              throw new Error("Tarayıcı yerel depolamasına yazılamadı");
            finishUi(name, seflik, effective);
            toast(
              "Giriş yapıldı.",
              "Kullanıcı bilgileri kaydedildi.",
              "success",
            );
            backgroundDurableSave(effective, name, seflik);
            setTimeout(() => {
              try {
                if (window.MesahaIpV518)
                  window.MesahaIpV518.ping("profile_ping_first_login");
              } catch (e) {}
            }, 400);
          } catch (err) {
            log("first-login.save", err, { name, seflik });
            toast(
              "Giriş kaydedilemedi.",
              "Tarayıcı depolama iznini ve boş alanı kontrol edin.",
              "error",
            );
            open();
          } finally {
            saveBusy = false;
            if (button) {
              button.disabled = false;
              button.removeAttribute("aria-busy");
              button.textContent = button.dataset.oldText || "Giriş Yap";
            }
          }
        }
        function bind() {
          const saveBtn = $("firstLoginSaveV321");
          if (saveBtn && !saveBtn.__v532) {
            saveBtn.__v532 = true;
            saveBtn.addEventListener(
              "click",
              function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                save();
              },
              true,
            );
          }
          ["firstLoginNameV321", "firstLoginSeflikV321"].forEach((id) => {
            const el = $(id);
            if (el && !el.__v532) {
              el.__v532 = true;
              el.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
              });
            }
          });
          if (!hasUser()) {
            closeBigPanel();
            const badge = $("userBadge");
            if (badge) {
              badge.textContent = "Giriş Yap";
              badge.classList.add("login-needed");
            }
            const btn = $("userPanelBtnV316");
            if (btn && window.MesahaSeflikGovernanceApi)
              window.MesahaSeflikGovernanceApi.renderTopProfile();
            setTimeout(open, 350);
          } else close();
        }
        window.mesahaFirstLoginV321 = { open, close, save, hasUser };
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", bind, { once: true });
        else bind();
        [1000, 2500, 5000].forEach((ms) =>
          setTimeout(() => {
            if (!hasUser()) closeBigPanel();
          }, ms),
        );
      })();
;

/* source: mesaha-inline-v323-export-send-final */
/* v323: Aktif süre cihazda hesaplanır. İstatistik sadece Mesaha Dosyasını İndir basılınca gönderilir. Offline XLS akışı asla engellenmez. */
      (function () {
        "use strict";
        const STORAGE_KEY = "cam_mesaha_kayitlari_v1";
        const SETTINGS_KEY = "cam_mesaha_ayarlar_v1";
        const PANEL_KEY = "mesaha_panel_user_v316";
        const USAGE_KEY = "mesaha_usage_stats_v316";
        const DEVICE_ID_KEY = "mesaha_cihaz_kodu_v1";
        const FIREBASE_CONFIG =
          (window.mesahaSupabaseV380 && window.mesahaSupabaseV380.config) || {};
        const SDK = "10.12.2";
        const APP_VERSION =
          (window.MESAHA_VERSION && window.MESAHA_VERSION.visibleVersion) ||
          "Mesaha İO";
        const FILE_VERSION =
          (window.MESAHA_VERSION && window.MESAHA_VERSION.version) || "local";
        let readyPromise = null;
        let lastTick = Date.now();
        function $(id) {
          return document.getElementById(id);
        }
        function clean(v) {
          return String(v == null ? "" : v).trim();
        }
        const jsonGet =
          (window.MesahaUtils && window.MesahaUtils.jsonGet) ||
          function (k, f) {
            try {
              const v = localStorage.getItem(k);
              return v ? JSON.parse(v) : f;
            } catch {
              return f;
            }
          };
        const jsonSet =
          (window.MesahaUtils && window.MesahaUtils.jsonSet) ||
          function (k, v) {
            try {
              localStorage.setItem(k, JSON.stringify(v));
              return true;
            } catch {
              return false;
            }
          };
        function trDate() {
          const d = new Date();
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          return d.toISOString().slice(0, 10);
        }
        function trText() {
          return new Date().toLocaleString("tr-TR");
        }
        function esc(v) {
          return String(v == null ? "" : v).replace(
            /[&<>'"]/g,
            (m) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;",
              })[m],
          );
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
          const u = jsonGet(PANEL_KEY, {});
          return {
            name: clean(u.name),
            seflik: clean(u.seflik),
            bolmeNo: clean(u.bolmeNo),
          };
        }
        function records() {
          const r = jsonGet(STORAGE_KEY, []);
          return Array.isArray(r) ? r : [];
        }
        function settings() {
          return Object.assign(
            {
              seflik: "",
              bolmeNo: "",
              treeFilter: "Tümü",
              cutterFilter: "Tümü",
            },
            jsonGet(SETTINGS_KEY, {}),
          );
        }
        function num(v) {
          const n = Number(String(v || 0).replace(",", "."));
          return Number.isFinite(n) ? n : 0;
        }
        function volume(r) {
          const d = num(r.diameter || r.cap),
            l = num(r.length || r.boy),
            q = num(r.quantity || r.adet || 1);
          if (!d || !l) return 0;
          return Math.round((((Math.PI * Math.pow(d / 100, 2)) / 4) * l * q) * 1000 + Number.EPSILON) / 1000;
        }
        function weekKey(d) {
          const x = new Date(d);
          x.setHours(0, 0, 0, 0);
          x.setDate(x.getDate() + 3 - ((x.getDay() + 6) % 7));
          const w1 = new Date(x.getFullYear(), 0, 4);
          return (
            x.getFullYear() +
            "-W" +
            String(
              1 +
                Math.round(
                  ((x - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7,
                ),
            ).padStart(2, "0")
          );
        }
        function deviceId() {
          let id = localStorage.getItem(DEVICE_ID_KEY);
          if (!id) {
            id = [
              "cihaz",
              Date.now().toString(36),
              Math.random().toString(36).slice(2, 8),
            ].join("_");
            try {
              localStorage.setItem(DEVICE_ID_KEY, id);
            } catch {}
          }
          return id;
        }
        function deviceInfo() {
          return {
            deviceId: deviceId(),
            platform: navigator.platform || "",
            userAgent: navigator.userAgent || "",
            screen:
              (screen && screen.width ? screen.width : "?") +
              "x" +
              (screen && screen.height ? screen.height : "?"),
            appVersion: APP_VERSION,
            fileVersion: FILE_VERSION,
          };
        }
        function loadUsage() {
          const u = jsonGet(USAGE_KEY, {}),
            today = trDate();
          if (u.day !== today) {
            u.day = today;
            u.todayLoginCount = 0;
            u.todayMs = 0;
          }
          if (!sessionStorage.getItem("mesaha_v323_login_counted")) {
            if (
              !sessionStorage.getItem("mesaha_v319_login_counted") &&
              !sessionStorage.getItem("mesaha_v316_login_counted")
            ) {
              u.todayLoginCount = Number(u.todayLoginCount || 0) + 1;
              u.totalLoginCount = Number(u.totalLoginCount || 0) + 1;
            }
            sessionStorage.setItem("mesaha_v323_login_counted", "1");
          }
          u.totalMs = Number(u.totalMs || 0);
          u.todayMs = Number(u.todayMs || 0);
          u.lastSeen = trText();
          u.lastSeenMs = Date.now();
          jsonSet(USAGE_KEY, u);
          return u;
        }
        function isActive() {
          return document.visibilityState !== "hidden";
        }
        function flushUsage() {
          const u = loadUsage();
          const now = Date.now();
          let diff = Math.max(0, now - lastTick);
          lastTick = now;
          if (isActive()) {
            diff = Math.min(diff, 60000);
            u.totalMs = Number(u.totalMs || 0) + diff;
            u.todayMs = Number(u.todayMs || 0) + diff;
          }
          u.lastSeen = trText();
          u.lastSeenMs = now;
          jsonSet(USAGE_KEY, u);
          return u;
        }
        function round3Stats(value) {
          return Number((Number(value) || 0).toFixed(3));
        }
        function statsQuantity(r) {
          const q = Number(r && (r.quantity ?? r.adet ?? r.count ?? 1));
          return Math.max(1, Math.round(Number.isFinite(q) && q > 0 ? q : 1));
        }
        function statsRowVolume(r) {
          const d = Number(r && (r.diameter ?? r.cap ?? r.diameterCm)),
            l = Number(r && (r.length ?? r.boy ?? r.lengthM)),
            q = statsQuantity(r || {});
          if (Number.isFinite(d) && d > 0 && Number.isFinite(l) && l > 0)
            return round3Stats((Math.PI * Math.pow(d / 100, 2) / 4) * l * q);
          const explicit = Number(r && (r.sourceVolumeM3 ?? r.totalVolume ?? r.total_volume ?? r.volume ?? r.hacim));
          return round3Stats(Number.isFinite(explicit) ? explicit : 0);
        }
        function canonicalStatsRecords(list) {
          const source = Array.isArray(list) ? list : records();
          const map = new Map();
          source.forEach((raw, index) => {
            if (!raw || typeof raw !== "object" || raw.deleted === true || raw.isDeleted === true || clean(raw.status).toLocaleLowerCase("tr-TR") === "deleted") return;
            const key = clean(raw.barcode || raw.barkod || raw.barkodNo || raw.barkod_no || raw.id || raw.recordId || raw.record_id) ||
              [clean(raw.treeType || raw.tree_type), clean(raw.productType || raw.product_type), clean(raw.diameter || raw.cap), clean(raw.length || raw.boy), clean(raw.productionDate), index].join("|");
            map.set(key.toLocaleUpperCase("tr-TR"), raw);
          });
          return [...map.values()];
        }
        function summarize(list) {
          const all = canonicalStatsRecords(list),
            today = trDate(), wk = weekKey(new Date());
          const treeTotals = {}, productTotals = {};
          let itemCount = 0, m3 = 0, todayRecords = 0, todayM3 = 0, weekRecordCount = 0, weekM3 = 0;
          all.forEach((r) => {
            const q = statsQuantity(r), vol = statsRowVolume(r);
            itemCount += q; m3 += vol;
            const tree = clean(r.treeType || r.tree_type || r.species || r.agacTuru || r.agacAdi || "Belirsiz") || "Belirsiz";
            const prod = clean(r.productType || r.product_type || r.odunTuru || r.odunAdi || "Belirsiz") || "Belirsiz";
            const add = (target, name) => {
              const old = target[name] || { adet: 0, count: 0, m3: 0 };
              old.adet += q; old.count += q; old.m3 = round3Stats(old.m3 + vol); target[name] = old;
            };
            add(treeTotals, tree); add(productTotals, prod);
            const dt = String(r.productionDate || r.createdAt || "").slice(0, 10);
            if (dt === today) { todayRecords += q; todayM3 += vol; }
            const dateValue = r.productionDate || r.createdAt;
            if (dateValue && weekKey(new Date(dateValue)) === wk) { weekRecordCount += q; weekM3 += vol; }
          });
          return {
            rowCount: all.length,
            itemCount,
            recordCount: itemCount,
            adet: itemCount,
            m3: round3Stats(m3),
            totalM3: round3Stats(m3),
            todayRecords,
            todayM3: round3Stats(todayM3),
            dayM3: round3Stats(todayM3),
            weekKey: wk,
            weekRecordCount,
            weekM3: round3Stats(weekM3),
            treeTotals,
            productTotals,
            records: all,
          };
        }
        function setSyncText(t) {
          const el = $("panelSyncTextV316");
          if (el) {
            el.textContent = t;
            el.classList.add("export-only-v323");
          }
        }
        function notify(t, d, type) {
          try {
            if (typeof window.mesahaFloatToastV315 === "function")
              window.mesahaFloatToastV315(t, d || "", type || "success");
            else if (typeof window.toast === "function") window.toast(t);
          } catch {}
        }
        function errText(e) {
          const m = String(e && e.message ? e.message : e || "Hata");
          if (/permission|insufficient/i.test(m))
            return "Supabase RLS/policy kontrol et";
          if (/network|offline|internet/i.test(m))
            return "İnternet bağlantısı yok";
          if (/timeout/i.test(m)) return "Bağlantı zaman aşımı";
          return m.slice(0, 140);
        }
        function loadScript(src) {
          return new Promise((res, rej) => {
            if (document.querySelector('script[src="' + src + '"]'))
              return res();
            const s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.crossOrigin = "anonymous";
            s.onload = res;
            s.onerror = () =>
              rej(new Error("Supabase bağlantı motoru yüklenemedi"));
            document.head.appendChild(s);
          });
        }
        function withTimeout(p, ms, label) {
          let timer = 0;
          return Promise.race([
            Promise.resolve(p),
            new Promise((_, rej) => {
              timer = setTimeout(
                () => rej(new Error((label || "İşlem") + " zaman aşımı")),
                ms,
              );
            }),
          ]).finally(() => {
            if (timer) clearTimeout(timer);
          });
        }
        async function ready() {
          return await window.mesahaSupabaseV380.ready();
        }
        const ALLOWED_REASONS = {
          "mesaha-download": "mesaha-download",
          "xls-download": "mesaha-download",
          "xls-download-v392": "mesaha-download",
          "xls-download-legacy": "mesaha-download",
          "local-backup": "local-backup",
          "backup-local": "local-backup",
          "cloud-backup": "cloud-backup",
          "drive-backup": "drive-backup",
        };
        function operationKey(reason, user, list, scope) {
          const stats = summarize(list);
          let hash = 2166136261;
          stats.records.forEach((r) => {
            const token = [clean(r.barcode || r.barkod || r.barkodNo || r.barkod_no || r.id || ""), statsQuantity(r), clean(r.diameter || r.cap), clean(r.length || r.boy), statsRowVolume(r), clean(r.updatedAt || r.productionDate || r.createdAt || "")].join("|");
            for (let i = 0; i < token.length; i += 1) { hash ^= token.charCodeAt(i); hash = Math.imul(hash, 16777619); }
          });
          return [reason, userKey(user.name, user.seflik), stats.rowCount, stats.itemCount, stats.m3.toFixed(3), (hash >>> 0).toString(36), clean((scope && scope.idempotencyKey) || "")].join(":").slice(0, 240);
        }
        async function send(reason, scope) {
          const approved =
            ALLOWED_REASONS[clean(reason).toLocaleLowerCase("tr-TR")];
          if (!approved) return false;
          const user = readUser(),
            usage = flushUsage(),
            fullList = records(),
            fullStats = summarize(fullList),
            scopeList =
              scope && Array.isArray(scope.list) ? scope.list : fullList,
            scopeStats = summarize(scopeList);
          if (!user.name || !user.seflik) {
            setSyncText("Kullanıcı girişi yok • istatistik gönderilmedi");
            return false;
          }
          if (!navigator.onLine) {
            setSyncText(
              "Offline: işlem tamamlandı, istatistik daha sonra gönderilecek",
            );
            return false;
          }
          try {
            setSyncText("İstatistik gönderiliyor…");
            const api =
              window.mesahaSupabaseV380 ||
              window.mesahaSupabaseV383 ||
              window.mesahaSupabase;
            if (!api || typeof api.edge !== "function")
              throw new Error("Güvenli sunucu bağlantısı hazır değil");
            const info = deviceInfo(),
              now = Date.now(),
              key = userKey(user.name, user.seflik);
            const idempotencyKey =
              clean(scope && scope.idempotencyKey) ||
              operationKey(approved, user, scopeList, scope);
            const payload = {
              reason: approved,
              idempotencyKey,
              userKey: key,
              name: user.name,
              seflik: user.seflik,
              bolmeNo: user.bolmeNo,
              operationRowCount: scopeStats.rowCount,
              operationItemCount: scopeStats.itemCount,
              operationTotalVolume: scopeStats.m3,
              rowCount: scopeStats.rowCount,
              itemCount: scopeStats.itemCount,
              recordCount: scopeStats.itemCount,
              totalRecords: scopeStats.itemCount,
              adet: scopeStats.itemCount,
              totalM3: scopeStats.m3,
              m3: scopeStats.m3,
              treeTotals: scopeStats.treeTotals,
              productTotals: scopeStats.productTotals,
              lastExportRowCount: scopeStats.rowCount,
              lastExportRecordCount: scopeStats.itemCount,
              lastExportM3: scopeStats.m3,
              lastExportTreeTotals: scopeStats.treeTotals,
              lastExportProductTotals: scopeStats.productTotals,
              fullSnapshotRowCount: fullStats.rowCount,
              fullSnapshotItemCount: fullStats.itemCount,
              fullSnapshotM3: fullStats.m3,
              todayRecords: fullStats.todayRecords,
              todayM3: fullStats.todayM3,
              dayM3: fullStats.todayM3,
              weekKey: fullStats.weekKey,
              weekRecordCount: fullStats.weekRecordCount,
              weekM3: fullStats.weekM3,
              scopeText: (scope && scope.text) || approved,
              scopeMode: (scope && scope.mode) || approved,
              usageMs: Number(usage.totalMs || 0),
              todayUsageMs: Number(usage.todayMs || 0),
              deviceId: info.deviceId,
              deviceInfo: info,
              appVersion: APP_VERSION,
              fileVersion: FILE_VERSION,
              updatedAt: trText(),
              updatedAtMs: now,
              source: "mesaha-v593-exact-operation-stats",
            };
            await withTimeout(
              api.edge("stats_sync", payload),
              15000,
              "İstatistik gönderimi",
            );
            setSyncText(
              "İstatistik güncellendi • " +
                new Date().toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
            );
            return true;
          } catch (e) {
            setSyncText(
              "İşlem tamamlandı • istatistik gönderimi olmadı: " + errText(e),
            );
            return false;
          }
        }
        var usageTimer = 0;
        function scheduleUsage() {
          clearTimeout(usageTimer);
          if (document.hidden) return;
          usageTimer = setTimeout(function () {
            flushUsage();
            scheduleUsage();
          }, 300000);
        }
        function boot() {
          loadUsage();
          setSyncText(
            "İstatistikler sadece Mesaha/Yedek işlemlerinde gönderilir",
          );
          scheduleUsage();
          window.addEventListener(
            "visibilitychange",
            function () {
              flushUsage();
              scheduleUsage();
            },
            { passive: true },
          );
          window.addEventListener("pagehide", flushUsage, { passive: true });
          window.mesahaExportStatsV323 = {
            send,
            flush: flushUsage,
            readUsage: () => jsonGet(USAGE_KEY, {}),
          };
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
      })();
;

/* source: mesaha-lovable-exact-pass-v325-2 */
(function () {
        "use strict";
        function $(id) {
          return document.getElementById(id);
        }
        function qs(s, root) {
          return (root || document).querySelector(s);
        }
        const qsa =
          (window.MesahaUtils && window.MesahaUtils.qsa) ||
          function (s, root) {
            return Array.prototype.slice.call(
              (root || document).querySelectorAll(s),
            );
          };
        function ready(fn) {
          document.readyState === "loading"
            ? document.addEventListener("DOMContentLoaded", fn, { once: true })
            : fn();
        }
        function setText(el, t) {
          if (el && el.textContent !== t) el.textContent = t;
        }
        function norm(s) {
          return String(s || "")
            .trim()
            .toLocaleLowerCase("tr-TR");
        }
        var productFilter = "Tümü";
        var products = [
          ["Tümü", "all", ""],
          ["Tomruk", "tomruk", "Tomruk"],
          ["Maden", "maden", "Maden"],
          ["Kağıtlık", "kagit", "Kağıtlık"],
          ["Sanayi", "sanayi", "Sanayi"],
          ["Tel", "tel", "Tel"],
        ];
        function productLabelOf(r) {
          var raw = String((r && r.productType) || "");
          if (window.productInfo) {
            try {
              return String(window.productInfo(raw).label || raw);
            } catch (e) {}
          }
          var x = norm(raw);
          if (x.indexOf("maden") > -1) return "Maden";
          if (x.indexOf("kağı") > -1 || x.indexOf("kagit") > -1)
            return "Kağıtlık";
          if (x.indexOf("sanayi") > -1) return "Sanayi";
          if (x.indexOf("tel") > -1) return "Tel";
          return "Tomruk";
        }
        function records() {
          try {
            return window.state && Array.isArray(window.state.records)
              ? window.state.records
              : [];
          } catch (e) {
            return [];
          }
        }
        function rebuildTop() {
          var user = $("userBadge");
          if (
            user &&
            (!user.textContent || /Giriş Yap|Giris Yap/i.test(user.textContent))
          )
            user.textContent = "Giriş Yap";
          var top = qs(".topbar");
          var vi = window.MESAHA_VERSION || {};
          setText(
            $("versionText"),
            vi.visibleVersion || vi.shortVersion || "Mesaha İO",
          );
          var title = qs("title");
          if (title)
            title.textContent =
              vi.name ||
              "Mesaha İO " + (vi.visibleVersion || vi.shortVersion || "");
        }
        function rebuildBottomNav() {
          var nav = $("bottomNav");
          if (!nav) return;
          var defs = [
            ["home", "⌂", "Ana Menü"],
            ["records", "◷", "Ölçümler"],
            ["beyan", "↓", "Beyan"],
            ["seflikFolder", "▰", "Şeflik"],
            ["settings", "⚙", "Ayarlar"],
          ];
          defs.forEach(function (d) {
            var b = nav.querySelector('[data-nav="' + d[0] + '"]');
            if (!b) {
              b = document.createElement("button");
              b.type = "button";
              b.dataset.nav = d[0];
              nav.appendChild(b);
            }
            b.innerHTML = "<span>" + d[1] + "</span><b>" + d[2] + "</b>";
          });
          qsa("button", nav).forEach(function (b) {
            if (
              !defs.some(function (d) {
                return d[0] === b.dataset.nav;
              })
            )
              b.remove();
          });
          if (!nav.__v325) {
            nav.__v325 = true;
            nav.addEventListener(
              "click",
              function (e) {
                var b = e.target.closest("[data-nav]");
                if (!b) return;
                if (b.dataset.nav === "settings") {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                  showLocal("settings");
                }
              },
              true,
            );
          }
        }
        function ensureSettingsControlsStable() {
          var stateObj = window.state && window.state.settings ? window.state.settings : null;
          var productBox = $("homeProductChecks");
          var treeBox = $("homeTreeChecks");
          var productsStable = [
            ["Tomruk", "Tomruk"],
            ["Maden Direk", "Maden"],
            ["Kağıtlık", "Kağıtlık"],
            ["Sanayi Odunu", "Sanayi"],
            ["Tel Direk", "Tel"]
          ];
          var treesStable = ["Karaçam", "Kayın", "Sarıçam", "Sedir", "Göknar", "Kızılçam"];
          if (stateObj) {
            if (!Array.isArray(stateObj.visibleProducts) || !stateObj.visibleProducts.length)
              stateObj.visibleProducts = ["Tomruk", "Maden Direk", "Kağıtlık"];
            if (!Array.isArray(stateObj.visibleTrees) || !stateObj.visibleTrees.length)
              stateObj.visibleTrees = treesStable.slice();
          }
          function card(kind, value, label, checked) {
            var productMeta = {
              "Tomruk": ["choice-product-tomruk", "T", "21 cm+ • 1,50 m+"],
              "Maden Direk": ["choice-product-maden", "M", "20 cm ve altı"],
              "Kağıtlık": ["choice-product-kagit", "K", "Serbest çap standardı"],
              "Sanayi Odunu": ["choice-product-sanayi", "S", "12 cm+ • 0,50–1,45 m"],
              "Tel Direk": ["choice-product-tel", "TD", "12–40 cm • 6,5–25 m"]
            };
            var meta = kind === "product" && productMeta[value] ? productMeta[value] : ["choice-tree", String(label || value || "A").trim().charAt(0).toLocaleUpperCase("tr-TR"), "Hızlı girişte göster"];
            var safeValue = value.replace(/&/g,"&amp;").replace(/"/g,"&quot;");
            return '<label class="check-card setting-choice ' + meta[0] + '"><input type="checkbox" data-check-kind="' + kind + '" value="' + safeValue + '" ' + (checked ? "checked" : "") + '><span class="choice-icon" aria-hidden="true">' + meta[1] + '</span><span class="choice-copy"><b>' + label + '</b><small>' + meta[2] + '</small></span><span class="choice-switch" aria-hidden="true"></span></label>';
          }
          // Önce ana uygulamanın kendi render fonksiyonuna fırsat verilir; eski cihazda
          // render çalışmadıysa aşağıdaki güvenli yedek liste devreye girer.
          try { if (typeof window.renderAll === "function") window.renderAll(); } catch (_) {}
          if (productBox && !productBox.querySelector("input")) {
            var activeProducts = stateObj && stateObj.visibleProducts || ["Tomruk", "Maden Direk", "Kağıtlık"];
            productBox.innerHTML = productsStable.map(function (p) { return card("product", p[0], p[1], activeProducts.indexOf(p[0]) >= 0); }).join("");
          }
          if (treeBox && !treeBox.querySelector("input")) {
            var activeTrees = stateObj && stateObj.visibleTrees || treesStable;
            treeBox.innerHTML = treesStable.map(function (t) { return card("tree", t, t, activeTrees.indexOf(t) >= 0); }).join("");
          }
          [productBox, treeBox].forEach(function (box) {
            if (!box || box.__stableSettingsBound) return;
            box.__stableSettingsBound = true;
            box.addEventListener("change", function (event) {
              var input = event.target && event.target.closest && event.target.closest("input[data-check-kind]");
              if (!input || !window.state || !window.state.settings) return;
              var kind = input.getAttribute("data-check-kind");
              var checked = Array.prototype.slice.call(box.querySelectorAll('input[data-check-kind="' + kind + '"]:checked')).map(function (el) { return el.value; });
              if (!checked.length) { input.checked = true; return; }
              if (kind === "product") {
                window.state.settings.visibleProducts = checked;
                if (checked.indexOf(window.state.settings.currentProduct) < 0) window.state.settings.currentProduct = checked[0];
                try { localStorage.setItem("mesaha_last_products_stable", JSON.stringify(checked)); } catch (_) {}
              } else {
                window.state.settings.visibleTrees = checked;
                if (checked.indexOf(window.state.settings.currentTree) < 0) window.state.settings.currentTree = checked[0];
                try { localStorage.setItem("mesaha_last_trees_stable", JSON.stringify(checked)); } catch (_) {}
              }
              try { if (typeof window.saveSettings === "function") window.saveSettings(); } catch (_) {}
            });
          });
        }
        function buildSettingsView() {
          var main = qs("#app main");
          if (!main) return;
          var view = $("settingsView");
          if (!view) {
            view = document.createElement("section");
            view.id = "settingsView";
            view.className = "view";
            main.appendChild(view);
          }
          if (!qs(".settings-title-v325", view)) {
            var title = document.createElement("div");
            title.className = "settings-title-v325";
            title.innerHTML = '<button class="back" type="button">←</button><h2>Ayarlar</h2>';
            view.prepend(title);
            title.querySelector("button").addEventListener("click", function () { showLocal("home"); });
          }
          var options = $("settingsOptionsCardStable");
          if (!options) {
            options = document.createElement("section");
            options.id = "settingsOptionsCardStable";
            options.className = "card settings-card settings-options-card-stable";
            options.innerHTML = "<h2>Giriş Seçenekleri</h2>";
            view.appendChild(options);
          }
          ["homeProductChecks", "homeTreeChecks", "barcodeControlEnabled", "autoPaperLengthEnabled", "autoProductStandardEnabled"].forEach(function (id) {
            var target = $(id);
            var block = target && target.closest ? target.closest(".setting-block") : null;
            if (block && block.parentNode !== options) options.appendChild(block);
          });
          var homeSettings = qs("#homeView .home-settings-source");
          if (homeSettings) {
            homeSettings.hidden = true;
            homeSettings.setAttribute("aria-hidden", "true");
          }
          ["sound-card", "maintenance-card"].forEach(function (cls) {
            var el = qs("#homeView ." + cls) || qs("#settingsView ." + cls);
            if (el) view.appendChild(el);
          });
          qsa("#settingsView .setting-block").forEach(function (block) {
            block.hidden = false;
            block.style.removeProperty("display");
          });
          setTimeout(ensureSettingsControlsStable, 20);
          setTimeout(ensureSettingsControlsStable, 180);
        }
        function polishHome() {
          var h = qs(".hero-card h1");
          if (h) {
            var raw = "";
            try {
              var u =
                JSON.parse(
                  localStorage.getItem("mesaha_panel_user_v316") || "{}",
                ) || {};
              raw = (u.name || "").trim();
            } catch (e) {}
            if (!raw) {
              try {
                var a =
                  JSON.parse(
                    localStorage.getItem("cam_mesaha_ayarlar_v1") || "{}",
                  ) || {};
                raw = (a.ekipNot || "").trim();
              } catch (e) {}
            }
            h.textContent = raw ? "Merhaba, " + raw : "Merhaba";
          }

          var file = qs(".file-card .section-head span");
          if (file) file.textContent = "Düzenle";
          var sec = qs(".summary-card .section-head h2");
          if (sec && sec.textContent.indexOf("Ölçüm Özeti") === -1)
            sec.textContent = "Ölçüm Özeti";
          // Ana sayfa sırası referansa göre kalsın: hero, bağlantı/giriş, dosya, tarih, özet, detay.
          var home = $("homeView");
          if (home) {
            var order = [
              ".hero-card",
              ".home-action-grid",
              ".seflik-folder-home-shortcut",
              ".file-card",
              ".summary-card",
              ".detail-summary-card",
            ];
            order.forEach(function (sel) {
              var el = qs(sel, home);
              if (el) home.appendChild(el);
            });
          }
        }
        function buildProductFilter() {
          var toolbar = qs(".record-toolbar");
          if (!toolbar) return;
          if (!$("productFilterV325")) {
            var bar = document.createElement("div");
            bar.id = "productFilterV325";
            bar.className = "product-filter-v325";
            bar.innerHTML = products
              .map(function (p, i) {
                return (
                  '<button type="button" data-prod="' +
                  p[0] +
                  '" class="' +
                  (i === 0 ? "active " : "") +
                  p[1] +
                  '">' +
                  p[0] +
                  "</button>"
                );
              })
              .join("");
            var search = $("recordSearch");
            if (search && search.parentNode === toolbar)
              toolbar.insertBefore(bar, search.nextSibling);
            else toolbar.prepend(bar);
            bar.addEventListener("click", function (e) {
              var b = e.target.closest("[data-prod]");
              if (!b) return;
              productFilter = b.dataset.prod;
              qsa("button", bar).forEach(function (x) {
                x.classList.toggle("active", x === b);
              });
              filterRecordCards();
            });
          }
        }
        function filterRecordCards() {
          var list = records();
          var active = productFilter;
          qsa("#recordList .record-card").forEach(function (card) {
            if (active === "Tümü") {
              card.style.display = "";
              return;
            }
            var txt = card.textContent || "";
            card.style.display =
              txt
                .toLocaleLowerCase("tr-TR")
                .indexOf(active.toLocaleLowerCase("tr-TR")) > -1
                ? ""
                : "none";
          });
          var empty = qs("#recordList>p.hint");
          if (empty && !$("emptyNewBtnV325")) {
            var btn = document.createElement("button");
            btn.id = "emptyNewBtnV325";
            btn.className = "empty-new-btn-v325";
            btn.type = "button";
            btn.textContent = "Yeni Mesaha Gir";
            empty.appendChild(btn);
            btn.addEventListener("click", function () {
              if (window.openEntry) window.openEntry();
            });
          }
        }
        function polishRecords() {
          var head = qs(".records-card>.section-head h2");
          if (head) head.textContent = "Ölçümler";
          buildProductFilter();
          filterRecordCards();
          var restore = $("restoreBtn");
          if (restore) restore.textContent = "Yedek Yükle";
          var backup = $("backupBtn");
          if (backup) backup.textContent = "Yedek Al";
        }
        function showLocal(view) {
          if (view === "settings") {
            try { if (typeof window.renderAll === "function") window.renderAll(); } catch (_) {}
            setTimeout(ensureSettingsControlsStable, 10);
            setTimeout(ensureSettingsControlsStable, 160);
          }
          [
            "home",
            "entry",
            "records",
            "beyan",
            "seflikFolder",
            "guide",
            "settings",
          ].forEach(function (v) {
            var el = $(v + "View");
            if (el) el.classList.toggle("active", v === view);
          });
          document.body.classList.toggle("entry-open", view === "entry");
          qsa("#bottomNav button").forEach(function (b) {
            b.classList.toggle("active", b.dataset.nav === view);
          });
          try {
            if (
              (view === "records" || view === "beyan") &&
              window.mesahaV303 &&
              window.mesahaV303.records
            )
              window.mesahaV303.records();
            else if ((view === "records" || view === "beyan") && window.renderRecords)
              window.renderRecords();
          } catch (e) {}
          try {
            if (view === "home" && window.renderAll) window.renderAll();
          } catch (e) {}
          setTimeout(function () {
            rebuildTop();
            polishHome();
            polishRecords();
          }, 80);
        }
        function patchShowView() {
          if (window.__mesahaShowV325) return;
          window.__mesahaShowV325 = true;
          var old = window.showView;
          window.showView = function (view) {
            if (view === "settings") {
              showLocal("settings");
              return;
            }
            if (typeof old === "function") {
              old(view);
            } else showLocal(view);
            setTimeout(function () {
              qsa("#bottomNav button").forEach(function (b) {
                b.classList.toggle("active", b.dataset.nav === view);
              });
              var sv = $("settingsView");
              if (sv && view !== "settings") sv.classList.remove("active");
              polishHome();
              polishRecords();
            }, 80);
          };
        }
        function observeRecords() {
          var rl = $("recordList");
          if (!rl || rl.__obsV325) return;
          rl.__obsV325 = true;
          new MutationObserver(function () {
            filterRecordCards();
          }).observe(rl, { childList: true, subtree: false });
        }
        function init() {
          rebuildTop();
          rebuildBottomNav();
          buildSettingsView();
          ensureSettingsControlsStable();
          polishHome();
          polishRecords();
          patchShowView();
          observeRecords();
        }
        ready(function () {
          setTimeout(init, 900);
          setTimeout(init, 1800);
          window.addEventListener("online", rebuildTop);
          window.addEventListener("offline", rebuildTop);
        });
      })();
;

/* source: mesaha-v326-user-request-fixes-2 */
(function () {
        "use strict";
        function $(id) {
          return document.getElementById(id);
        }
        function qs(sel, root) {
          return (root || document).querySelector(sel);
        }
        function esc(s) {
          return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
            return {
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            }[m];
          });
        }
        function patchCutterNote() {
          var row = qs("#entryView .cutter-row");
          if (row && !$("cutterScrollNoteV326")) {
            var note = document.createElement("div");
            note.id = "cutterScrollNoteV326";
            note.className = "cutter-scroll-note-v326";
            note.innerHTML =
              "<b>↔</b><span>Kesimcileri görmek için sola kaydırın.</span>";
            row.insertAdjacentElement("afterend", note);
          }
        }
        function simplifyPanel() {
          var bol = $("panelBolmeV316");
          if (bol) {
            var wrap = bol.closest("label") || bol.parentElement;
            if (wrap) {
              wrap.classList.add("panel-bolme-hidden-v326");
              wrap.style.display = "none";
            }
          }
          var stats = $("panelStatsV316");
          if (stats) {
            stats.innerHTML = "";
            stats.style.display = "none";
          }
        }
        function overlay() {
          var ov = $("cloudBusyOverlayV326");
          if (!ov) {
            ov = document.createElement("div");
            ov.id = "cloudBusyOverlayV326";
            ov.className = "mesaha-blocking-overlay-v326";
            ov.innerHTML =
              '<div class="mesaha-blocking-card-v326"><div class="mesaha-blocking-spinner-v326"></div><h3 id="cloudBusyTitleV326">Buluta yükleniyor…</h3><p id="cloudBusyTextV326">Yedek tamamen bitene kadar bekleyin. Tekrar tıklamanıza gerek yok.</p></div>';
            document.body.appendChild(ov);
          }
          return ov;
        }
        function showOverlay(title, text) {
          var ov = overlay();
          var t = $("cloudBusyTitleV326"),
            p = $("cloudBusyTextV326");
          if (t) t.textContent = title || "Buluta yükleniyor…";
          if (p)
            p.textContent =
              text ||
              "Yedek tamamen bitene kadar bekleyin. Tekrar tıklamanıza gerek yok.";
          ov.classList.add("active");
        }
        function hideOverlay() {
          var ov = $("cloudBusyOverlayV326");
          if (ov) ov.classList.remove("active");
        }
        var cloudBusy = false;
        async function handleCloudBackupClick(e) {
          if (window.MESAHA_SUITE_MODE) return;
          var btn =
            e.target && e.target.closest
              ? e.target.closest("#cloudBackupBtnV316")
              : null;
          if (!btn) return;
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (cloudBusy) return;
          cloudBusy = true;
          var oldText = btn.textContent;
          document.body.classList.add("cloud-busy-v326");
          btn.disabled = true;
          btn.textContent = "Buluta yükleniyor…";
          showOverlay(
            "Buluta yükleniyor…",
            "Yedek tamamen bitene kadar bekleyin. Tekrar tıklamanıza gerek yok.",
          );
          try {
            if (
              window.mesahaPanelV316 &&
              typeof window.mesahaPanelV316.cloudBackup === "function"
            ) {
              await window.mesahaPanelV316.cloudBackup();
            } else {
              throw new Error(
                "Bulut yedek sistemi hazır değil. Sayfayı yenileyip tekrar deneyin.",
              );
            }
            showOverlay("Buluta yüklendi", "Yedekleme tamamlandı.");
            setTimeout(hideOverlay, 650);
          } catch (err) {
            var msg =
              err && err.message ? err.message : "İnterneti kontrol edin.";
            showOverlay("Buluta yüklenemedi", msg);
            if (window.toast)
              try {
                window.toast("Buluta yüklenemedi.", msg, "error");
              } catch (_e) {}
            setTimeout(hideOverlay, 1300);
          } finally {
            setTimeout(function () {
              cloudBusy = false;
              document.body.classList.remove("cloud-busy-v326");
              btn.disabled = false;
              btn.textContent = oldText || "Buluta Yükle";
            }, 700);
          }
        }
        function boot() {
          patchCutterNote();
          simplifyPanel();
          document.addEventListener("click", handleCloudBackupClick, true);
          // Panel ve kesimci alanları statik kurulur. Eski tüm-body gözlemcisi
          // her kayıt çiziminde çalıştığı için kaldırıldı; ilk kurulum ve güvenli
          // gecikmeli kontroller yeterlidir.
          setTimeout(function () {
            patchCutterNote();
            simplifyPanel();
          }, 900);
          setTimeout(function () {
            patchCutterNote();
            simplifyPanel();
          }, 1800);
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
      })();
;

/* source: mesaha-v354-lovable-clean-light-finales-2 */
(function () {
        "use strict";
        function $(id) {
          return document.getElementById(id);
        }
        const qsa =
          (window.MesahaUtils && window.MesahaUtils.qsa) ||
          function (sel, root) {
            return Array.prototype.slice.call(
              (root || document).querySelectorAll(sel),
            );
          };
        function qs(sel, root) {
          return (root || document).querySelector(sel);
        }
        function ready(fn) {
          document.readyState === "loading"
            ? document.addEventListener("DOMContentLoaded", fn, { once: true })
            : fn();
        }
        function setVersions() {
          var vi = window.MESAHA_VERSION || {},
            display = vi.visibleVersion || vi.shortVersion || "Mesaha İO";
          var vt = $("versionText");
          if (vt) vt.textContent = display;
          qsa(".version-card b").forEach(function (b) {
            b.textContent = display;
          });
          qsa(".version-card small").forEach(function (s) {
            s.textContent = "";
          });
          if (document.title)
            document.title = vi.name || "Mesaha İO " + display;
        }
        function robustShow(view) {
          [
            "home",
            "entry",
            "records",
            "beyan",
            "seflikFolder",
            "guide",
            "settings",
          ].forEach(function (v) {
            var el = $(v + "View");
            if (el) {
              el.classList.toggle("active", v === view);
              el.style.display = v === view ? "block" : "none";
            }
          });
          document.body.classList.toggle("entry-open", view === "entry");
          qsa("#bottomNav button").forEach(function (b) {
            b.classList.toggle("active", b.dataset.nav === view);
          });
          if (view === "records") {
            try {
              if (window.mesahaV303 && window.mesahaV303.records)
                window.mesahaV303.records();
              else if (window.renderRecords) window.renderRecords();
            } catch (e) {}
          }
          if (view === "home") {
            try {
              if (window.renderAll) window.renderAll();
            } catch (e) {}
          }
          window.scrollTo({ top: 0, behavior: "instant" });
          setTimeout(function () {
            [
              "home",
              "entry",
              "records",
              "seflikFolder",
              "guide",
              "settings",
            ].forEach(function (v) {
              var el = $(v + "View");
              if (el) {
                el.classList.toggle("active", v === view);
                el.style.display = v === view ? "block" : "none";
              }
            });
            qsa("#bottomNav button").forEach(function (b) {
              b.classList.toggle("active", b.dataset.nav === view);
            });
            setVersions();
          }, 120);
        }
        function patchBottomNav() {
          var nav = $("bottomNav");
          if (!nav || nav.__v330HardNav) return;
          nav.__v330HardNav = true;
          nav.addEventListener(
            "click",
            function (e) {
              var b = e.target.closest("[data-nav]");
              if (!b) return;
              var view = b.dataset.nav;
              if (["home", "records", "guide", "settings"].indexOf(view) > -1) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                robustShow(view);
              }
            },
            true,
          );
        }
        function patchDateBlock() {
          var date = $("mesahaDate");
          if (date) {
            var wrap = date.closest(".setting-block") || date.parentElement;
            if (wrap) wrap.classList.add("date-block-v330");
          }
        }
        function patchProductButtons() {
          var grid = $("productButtons");
          if (!grid) return;
          qsa(".product-btn", grid).forEach(function (btn) {
            btn.setAttribute(
              "aria-pressed",
              btn.classList.contains("active") ? "true" : "false",
            );
            if (!btn.__v330Click) {
              btn.__v330Click = true;
              btn.addEventListener(
                "click",
                function () {
                  setTimeout(function () {
                    qsa(".product-btn", grid).forEach(function (x) {
                      x.setAttribute(
                        "aria-pressed",
                        x.classList.contains("active") ? "true" : "false",
                      );
                    });
                  }, 40);
                },
                true,
              );
            }
          });
        }
        function init() {
          setVersions();
          patchBottomNav();
          patchDateBlock();
          patchProductButtons();
        }
        ready(function () {
          init();
          setTimeout(init, 800);
          setTimeout(init, 1800);
          document.addEventListener(
            "click",
            function () {
              setTimeout(patchProductButtons, 60);
            },
            true,
          );
        });
      })();
;

/* source: mesaha-guide-clean-yayin-clean-script */
(function () {
        "use strict";
        var info = window.MESAHA_VERSION || {};
        var DISPLAY = info.visibleVersion || info.shortVersion || "Mesaha İO";
        var BUILD = Number(info.build || 0) || 0;
        window.MESAHA_VERSION_TEXT = DISPLAY;
        window.MESAHA_VERSION_SHORT = DISPLAY;
        function $(id) {
          return document.getElementById(id);
        }
        const qsa =
          (window.MesahaUtils && window.MesahaUtils.qsa) ||
          function (sel, root) {
            return Array.prototype.slice.call(
              (root || document).querySelectorAll(sel),
            );
          };
        function esc(v) {
          return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
            return {
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#039;",
            }[ch];
          });
        }
        function txt(id, fallback) {
          var el = $(id);
          return el
            ? String(el.textContent || el.value || fallback || "").trim()
            : fallback || "";
        }
        function val(id, fallback) {
          var el = $(id);
          return el
            ? String(el.value || fallback || "").trim()
            : fallback || "";
        }
        function dateFile() {
          var d = new Date();
          return (
            d.getFullYear() +
            String(d.getMonth() + 1).padStart(2, "0") +
            String(d.getDate()).padStart(2, "0") +
            "_" +
            String(d.getHours()).padStart(2, "0") +
            String(d.getMinutes()).padStart(2, "0")
          );
        }
        function escFile(v) {
          return (
            String(v || "")
              .replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ_-]+/g, "_")
              .replace(/^_+|_+$/g, "") || "Beyan"
          );
        }
        function applyVersion() {
          document.title = "Mesaha İO " + DISPLAY;
          var apple = document.querySelector(
            'meta[name="apple-mobile-web-app-title"]',
          );
          if (apple) apple.setAttribute("content", "Mesaha İO");
          var st = document.querySelector("#startup strong");
          if (st) st.textContent = DISPLAY;
          var vt = $("versionText");
          if (vt) vt.textContent = DISPLAY;
          qsa(".version-card b").forEach(function (b) {
            if (/^v?\d|^V\d|^v3\.|^V3\./.test((b.textContent || "").trim()))
              b.textContent = DISPLAY;
          });
          qsa(".version-card small").forEach(function (s) {
            s.textContent = "";
          });
          var box = $("updateStatusBox");
          if (
            box &&
            /Yeni sürüm hazır|güncelleme|Sürüm kontrol/.test(
              box.textContent || "",
            )
          ) {
            box.className = "update-status-box update-ok";
            box.textContent = "Uygulama güncel: " + DISPLAY;
          }
          var btn = $("printBtn");
          if (btn) {
            btn.textContent = "Beyan İndir";
            btn.setAttribute("aria-label", "Beyan PDF indir");
            btn.setAttribute("title", "Beyan PDF indir");
          }
        }
        function notify(t, d, k) {
          try {
            if (typeof window.mesahaFloatToastV315 === "function")
              return window.mesahaFloatToastV315(t, d || "", k || "success");
          } catch (e) {}
          try {
            if (typeof window.toast === "function") return window.toast(t);
          } catch (e) {}
        }
        function getPdfData() {
          try {
            if (window.mesahaV305 && window.mesahaV305.updateBeyanTotals)
              window.mesahaV305.updateBeyanTotals();
          } catch (e) {}
          var products = [];
          qsa("#productTotals .prod-total").forEach(function (card) {
            var nodes = qsa("small,b", card)
              .map(function (n) {
                return (n.textContent || "").trim();
              })
              .filter(Boolean);
            products.push({
              label: nodes[0] || "Ürün",
              m3: nodes[1] || "0 m³",
              adet: nodes[2] || "0 adet",
            });
          });
          if (!products.length)
            products = [
              { label: "Tomruk", m3: "0 m³", adet: "0 adet" },
              { label: "Maden", m3: "0 m³", adet: "0 adet" },
              { label: "Kağıtlık", m3: "0 m³", adet: "0 adet" },
              { label: "Sanayi", m3: "0 m³", adet: "0 adet" },
              { label: "Tel", m3: "0 m³", adet: "0 adet" },
            ];
          return {
            totalM3: txt("recTotalM3", "0 m³"),
            totalCount: txt("recTotalCount", "0"),
            recCount: txt("recordCountPill", "0 kayıt"),
            date: val("mesahaDate", new Date().toISOString().slice(0, 10)),
            tree: txt("treeFilterText", "Seçili: Tümü").replace(
              /^Seçili:\s*/,
              "",
            ),
            cutter: txt("cutterFilterText", "Seçili: Tümü").replace(
              /^Seçili:\s*/,
              "",
            ),
            bolme: val("bolmeNo", "-") || "-",
            seflik: val("seflik", "-") || "-",
            scope: txt("exportScopeInfo", "İndirilecek: Tüm kayıtlar"),
            products: products,
          };
        }
        function colorFor(label) {
          label = String(label || "").toLocaleLowerCase("tr-TR");
          if (label.indexOf("tomruk") > -1) return [148, 115, 20];
          if (label.indexOf("maden") > -1) return [66, 113, 154];
          if (label.indexOf("kağıt") > -1 || label.indexOf("kagit") > -1)
            return [170, 70, 70];
          if (label.indexOf("sanayi") > -1) return [55, 145, 93];
          if (label.indexOf("tel") > -1) return [115, 80, 170];
          return [100, 116, 139];
        }
        function makePdf(data) {
          if (!window.jspdf || !window.jspdf.jsPDF)
            throw new Error("PDF modülü yüklenemedi");
          var doc = new window.jspdf.jsPDF({
            orientation: "portrait",
            unit: "pt",
            format: "a4",
            compress: true,
          });
          function pdfSafe(v) {
            return String(v == null ? "" : v)
              .replace(/[İI]/g, "I")
              .replace(/[ı]/g, "i")
              .replace(/[Şş]/g, function (ch) {
                return ch === "Ş" ? "S" : "s";
              })
              .replace(/[Ğğ]/g, function (ch) {
                return ch === "Ğ" ? "G" : "g";
              })
              .replace(/[Üü]/g, function (ch) {
                return ch === "Ü" ? "U" : "u";
              })
              .replace(/[Öö]/g, function (ch) {
                return ch === "Ö" ? "O" : "o";
              })
              .replace(/[Çç]/g, function (ch) {
                return ch === "Ç" ? "C" : "c";
              })
              .replace(/³/g, "3")
              .replace(/²/g, "2")
              .replace(/•/g, "-")
              .replace(/[‘’]/g, "'")
              .replace(/[“”]/g, '"')
              .replace(/[–—]/g, "-")
              .replace(/\s+/g, " ")
              .trim();
          }
          var __text = doc.text.bind(doc);
          doc.text = function (value, x, y, options) {
            if (Array.isArray(value)) value = value.map(pdfSafe);
            else value = pdfSafe(value);
            return __text(value, x, y, options || {});
          };
          var w = doc.internal.pageSize.getWidth(),
            margin = 46,
            y = 52;
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, w, 842, "F");
          try {
            doc.addImage(
              "../assets/mesaha_logo.png",
              "PNG",
              margin,
              y - 9,
              34,
              34,
            );
          } catch (e) {}
          doc.setFont("helvetica", "bold");
          doc.setFontSize(19);
          doc.setTextColor(31, 41, 55);
          doc.text("BEYAN ÖZETİ", margin + 44, y + 7);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          doc.text(
            "Mesaha İO • " + new Date().toLocaleDateString("tr-TR"),
            margin + 44,
            y + 22,
          );
          doc.setDrawColor(31, 41, 55);
          doc.setLineWidth(1.4);
          doc.line(margin, y + 38, w - margin, y + 38);
          y += 54;
          function box(x, y, bw, bh, title, value) {
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.9);
            doc.roundedRect(x, y, bw, bh, 8, 8);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(title, x + 9, y + 15);
            doc.setFontSize(15);
            doc.setTextColor(17, 24, 39);
            doc.text(String(value || "-"), x + 9, y + 39, {
              maxWidth: bw - 18,
            });
          }
          var gap = 8,
            bw = (w - margin * 2 - gap * 3) / 4,
            bh = 50;
          [
            [
              ["Toplam m³", data.totalM3],
              ["Toplam Adet", data.totalCount],
              ["Kayıt", data.recCount],
              ["Mesaha Tarihi", data.date],
            ],
            [
              ["Ağaç filtresi", data.tree || "Tümü"],
              ["Kesimci filtresi", data.cutter || "Tümü"],
              ["Bölme No", data.bolme],
              ["Şeflik", data.seflik],
            ],
          ].forEach(function (row) {
            row.forEach(function (item, i) {
              box(margin + i * (bw + gap), y, bw, bh, item[0], item[1]);
            });
            y += bh + 10;
          });
          var pw = (w - margin * 2 - gap) / 2,
            ph = 62;
          data.products.forEach(function (p, i) {
            var x = margin + (i % 2) * (pw + gap),
              yy = y + Math.floor(i / 2) * (ph + 9),
              c = colorFor(p.label);
            doc.setDrawColor(203, 213, 225);
            doc.roundedRect(x, yy, pw, ph, 8, 8);
            doc.setFillColor(c[0], c[1], c[2]);
            doc.rect(x, yy, 6, ph, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(p.label, x + 13, yy + 16);
            doc.setFontSize(15);
            doc.setTextColor(17, 24, 39);
            doc.text(p.m3, x + 13, yy + 39);
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text(p.adet, x + 13, yy + 53);
          });
          y += Math.ceil(data.products.length / 2) * (ph + 9) + 12;
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(51, 65, 85);
          doc.text(data.scope || "İndirilecek: Tüm kayıtlar", margin, y);
          /* v414: PDF alt site/tarih/sayfa bilgisi kaldırıldı. */
          return doc;
        }
        function loadScript(src) {
          return new Promise(function (resolve, reject) {
            var s = document.createElement("script");
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }
        async function ensurePdfLib() {
          if (window.jspdf && window.jspdf.jsPDF) return;
          await loadScript(
            "../vendor/jspdf.umd.min.js",
          );
        }
        var running = false;
        async function downloadBeyanPdf(ev) {
          if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          }
          if (running) return false;
          running = true;
          var btn = $("printBtn");
          try {
            if (btn) {
              btn.disabled = true;
              btn.textContent = "PDF hazırlanıyor…";
            }
            await ensurePdfLib();
            var data = getPdfData();
            var doc = makePdf(data);
            doc.save(
              "Beyan_Ozeti_" +
                escFile(data.bolme) +
                "_" +
                escFile(data.seflik) +
                "_" +
                dateFile() +
                ".pdf",
            );
            notify(
              "Beyan PDF indirildi.",
              "Yazdırılabilir PDF hazır",
              "success",
            );
          } catch (e) {
            notify(
              "Beyan PDF indirilemedi.",
              (e && e.message) || "Tekrar deneyin",
              "error",
            );
          } finally {
            running = false;
            if (btn) {
              btn.disabled = false;
              btn.textContent = "Beyan İndir";
            }
          }
          return false;
        }
        function bind() {
          var btn = $("printBtn");
          if (btn && !btn.__guideCleanPdfBound) {
            btn.__guideCleanPdfBound = true;
            ["click"].forEach(function (t) {
              btn.addEventListener(t, downloadBeyanPdf, {
                capture: true,
                passive: false,
              });
            });
          }
        }
        function boot() {
          applyVersion();
          bind();
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        [150, 600, 1400, 2600].forEach(function (ms) {
          setTimeout(boot, ms);
        });
        /* V5.27: sürüm metni merkezi update-manager/offline-core tarafından yönetilir. */
      })();
;

/* source: mesaha-v354-lovable-clean-light-final-2 */
(function () {
        "use strict";
        var PANEL_KEY = "mesaha_panel_user_v316";
        function $(id) {
          return document.getElementById(id);
        }
        const qsa =
          (window.MesahaUtils && window.MesahaUtils.qsa) ||
          function (sel, root) {
            return Array.prototype.slice.call(
              (root || document).querySelectorAll(sel),
            );
          };
        function clean(v) {
          return String(v || "").trim();
        }
        function titleName(name) {
          name = clean(name);
          if (!name) return "";
          return name
            .split(/\s+/)
            .map(function (part) {
              return part
                ? part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1)
                : "";
            })
            .join(" ");
        }
        function readUser() {
          try {
            var u = JSON.parse(localStorage.getItem(PANEL_KEY) || "{}") || {};
            return {
              name: clean(u.name),
              seflik: clean(u.seflik),
              bolmeNo: clean(u.bolmeNo),
            };
          } catch (e) {
            return { name: "", seflik: "", bolmeNo: "" };
          }
        }
        function applyUserTexts() {
          var u = readUser();
          var display = titleName(u.name);
          var hero = document.querySelector(".hero-card h1");
          if (hero)
            hero.textContent = display ? "Merhaba, " + display : "Merhaba";
          var badge = $("userBadge");
          if (badge) {
            if (u.name && u.seflik) {
              badge.textContent =
                titleName(u.name) + " • " + titleName(u.seflik);
              badge.classList.remove("login-needed");
            } else if (/Giriş Yap|Giris Yap/i.test(badge.textContent || "")) {
              badge.textContent = "Giriş Yap";
              badge.classList.add("login-needed");
            }
          }
          qsa(".first-login-logo-v321 img").forEach(function (img) {
            if (!/assets\/mesaha_logo\.png/.test(img.getAttribute("src") || ""))
              img.setAttribute("src", "../assets/mesaha_logo.png");
            img.setAttribute("alt", "Mesaha İO");
          });
        }
        function wrapStorage() {
          if (window.__mesahaV340StorageWrapped) return;
          window.__mesahaV340StorageWrapped = true;
          var oldSet = localStorage.setItem;
          localStorage.setItem = function (k, v) {
            var r = oldSet.apply(this, arguments);
            if (k === PANEL_KEY) setTimeout(applyUserTexts, 30);
            return r;
          };
        }
        function boot() {
          wrapStorage();
          applyUserTexts();
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        [80, 250, 700, 1300, 2600, 5000].forEach(function (ms) {
          setTimeout(applyUserTexts, ms);
        });
        window.addEventListener("storage", applyUserTexts);
        document.addEventListener(
          "visibilitychange",
          function () {
            if (!document.hidden) applyUserTexts();
          },
          { passive: true },
        );
      })();
;

/* source: mesaha-v354-lovable-clean-light-final-4 */
(function () {
        "use strict";
        function $(id) {
          return document.getElementById(id);
        }
        function qsa(sel) {
          return Array.prototype.slice.call(document.querySelectorAll(sel));
        }
        function applyVersion() {
          var mv = window.MESAHA_VERSION || {};
          var display = mv.visibleVersion || mv.shortVersion || "Mesaha İO";
          var app = mv.app || "Mesaha İO";
          document.title = app + " " + display;
          var apple = document.querySelector(
            'meta[name="apple-mobile-web-app-title"]',
          );
          if (apple) apple.setAttribute("content", app);
          var vt = $("versionText");
          if (vt) vt.textContent = display;
          var st = document.querySelector("#startup strong");
          if (st) st.textContent = display;
          qsa(".version-card b").forEach(function (b) {
            b.textContent = display;
          });
          qsa(".version-card small").forEach(function (s) {
            s.textContent = "";
          });
        }
        function bindBadgePanel() {
          var badge = $("userBadge"),
            btn = $("userPanelBtnV316");
          if (badge && btn && !badge.__v527PanelBound) {
            badge.__v527PanelBound = true;
            badge.addEventListener(
              "click",
              function (ev) {
                ev.preventDefault();
                btn.click();
              },
              true,
            );
          }
        }
        function boot() {
          applyVersion();
          bindBadgePanel();
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        [100, 500, 1500].forEach(function (ms) {
          setTimeout(boot, ms);
        });
      })();
;

/* source: mesaha-v351-light-only-clean-script */
(function () {
        "use strict";
        var META = window.MESAHA_VERSION || {
          app: "Mesaha İO",
          version: "local",
          build: 0,
          visibleVersion: "Mesaha İO",
          shortVersion: "Mesaha İO",
          name: "Mesaha İO",
          cacheName: "mesaha-app-local",
          assetVersion: "",
        };
        function $(id) {
          return document.getElementById(id);
        }
        function all(s, r) {
          return Array.prototype.slice.call(
            (r || document).querySelectorAll(s),
          );
        }
        function clean() {
          document.documentElement.classList.remove("light");
          document.body.classList.remove("light");
          try {
            localStorage.removeItem("mesaha_removed_theme_key");
          } catch (e) {}
          try {
            var s = window.state && window.state.settings;
            if (s && Object.prototype.hasOwnProperty.call(s, "theme"))
              delete s.theme;
          } catch (e) {}
          var b = $("removedThemeButton");
          if (b) b.remove();
          all('[aria-label="Tema"],#removedOnlinePillV350').forEach(
            function (x) {
              x.remove();
            },
          );
          var top = document.querySelector(".topbar");
          var actions = document.querySelector(".top-actions-v316");
          var panel = $("userPanelBtnV316");
          if (top && panel) {
            if (!actions) {
              actions = document.createElement("div");
              actions.className = "top-actions-v316";
              top.appendChild(actions);
            }
            if (panel.parentNode !== actions) actions.appendChild(panel);
            actions.style.display = "flex";
          }
          var badge = $("userBadge");
          if (badge) badge.style.display = "none";
          window.MESAHA_VERSION = META;
          window.MESAHA_VERSION_TEXT = META.visibleVersion;
          window.MESAHA_VERSION_SHORT = META.shortVersion;
          document.title = "Mesaha İO " + META.visibleVersion;
          var vt = $("versionText");
          if (vt) vt.textContent = META.shortVersion;
          all(".version-card b").forEach(function (x) {
            x.textContent = META.shortVersion;
          });
          all(".version-card small").forEach(function (x) {
            x.textContent = "";
          });
        }
        function perfPatch() {
          if (window.__mesahaV350Perf) return;
          window.__mesahaV350Perf = true;
          var timer = 0;
          window.mesahaDebounce = function (fn, ms) {
            return function () {
              var a = arguments,
                c = this;
              clearTimeout(timer);
              timer = setTimeout(function () {
                fn && fn.apply(c, a);
              }, ms || 80);
            };
          };
          try {
            var rs = $("recordSearch");
            if (rs && !rs.__v351Debounced) {
              rs.__v351Debounced = true;
              rs.addEventListener(
                "input",
                function () {
                  if (window.requestAnimationFrame)
                    requestAnimationFrame(function () {});
                },
                { passive: true },
              );
            }
          } catch (e) {}
        }
        clean();
        perfPatch();
        if (document.readyState === "loading")
          document.addEventListener(
            "DOMContentLoaded",
            function () {
              clean();
              perfPatch();
            },
            { once: true },
          );
        [120, 900].forEach(function (ms) { setTimeout(clean, ms); });
        window.addEventListener("pageshow", clean, { passive: true });
      })();
;

