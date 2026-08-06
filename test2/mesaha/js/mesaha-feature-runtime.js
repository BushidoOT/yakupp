/* source: mesaha-inline-v392-panel-guide-video-hotfix */
(function () {
        if (window.__mesahaV392PanelGuideVideoHotfix) return;
        window.__mesahaV392PanelGuideVideoHotfix = true;
        var SHORT_LINK = "https://www.kisa.link/jxXNL";
        var VIDEO_LINK =
          "https://youtube.com/shorts/J25xp8NrHw8?si=-SeJsWMar3Ja3O4I";
        var APP_VIDEO_LINK =
          "https://youtube.com/shorts/4yRRIRNptro?si=EgpHz-hQmnxFuqu2";
        function $(id) {
          return document.getElementById(id);
        }
        function panelOpen() {
          var p = $("userPanelOverlayV316"),
            c = $("cloudRestoreOverlayV316");
          return !!(
            (p && !p.classList.contains("hidden")) ||
            (c && !c.classList.contains("hidden"))
          );
        }
        function syncPanelState() {
          document.body.classList.toggle("mesaha-panel-open-v392", panelOpen());
        }
        function addUpdateNotes() {
          var old = $("panelUpdateNotesV392");
          if (old && old.parentNode) old.parentNode.removeChild(old);
        }
        function upgradeGuideLinks() {
          document.querySelectorAll(".guide-card b").forEach(function (b) {
            var t = (b.textContent || "").trim();
            if (
              t === "https://bit.ly/mesahaio" ||
              t === "bit.ly/mesahaio" ||
              t === SHORT_LINK
            ) {
              var a = document.createElement("a");
              a.href = SHORT_LINK;
              a.target = "_blank";
              a.rel = "noopener";
              a.className = "guide-link-v392";
              a.textContent = SHORT_LINK;
              b.replaceWith(a);
            }
          });
          var guide = document.querySelector("#guideView .guide-card");
          if (guide && !guide.querySelector("[data-orbis-video-v392]")) {
            var h = [].slice
              .call(guide.querySelectorAll("h3"))
              .find(function (x) {
                return /ORBİS/i.test(x.textContent || "");
              });
            var sec = h && h.closest(".guide-section-guide-clean");
            if (sec) {
              var p = document.createElement("p");
              p.className = "guide-note-guide-clean";
              p.setAttribute("data-orbis-video-v392", "1");
              p.innerHTML =
                '<b>Video:</b> <a class="guide-link-v392 video-link-v392" href="' +
                VIDEO_LINK +
                '" target="_blank" rel="noopener">ORBİS aktarım videosunu YouTube’da aç</a>';
              sec.appendChild(p);
            }
          }
        }
        function bindLinks() {
          document.addEventListener(
            "click",
            function (ev) {
              var a =
                ev.target &&
                ev.target.closest &&
                ev.target.closest('a[href^="http"]');
              if (!a) return;
              a.setAttribute("target", "_blank");
              a.setAttribute("rel", "noopener");
            },
            true,
          );
        }
        function boot() {
          addUpdateNotes();
          upgradeGuideLinks();
          syncPanelState();
          ["userPanelOverlayV316", "cloudRestoreOverlayV316"].forEach(
            function (id) {
              if (window.MesahaUiHub)
                window.MesahaUiHub.watchClass(id, syncPanelState);
            },
          );
        }
        bindLinks();
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        [300, 1000, 2500].forEach(function (ms) {
          setTimeout(boot, ms);
        });
      })();
;

/* source: mesaha-inline-local */
/* v392: Silinen kayıt Excel'e gitmesin + Beyan/Özet ORBİS yuvarlama mantığı */
      (function () {
        "use strict";
        if (window.__mesahaV392OrbisBeyanExportHotfix) return;
        window.__mesahaV392OrbisBeyanExportHotfix = true;

        const STORAGE_KEY = "cam_mesaha_kayitlari_v1";
        const SETTINGS_KEY = "cam_mesaha_ayarlar_v1";
        const VERSION = "local";
        const DISPLAY = "Mesaha İO";
        let exportRunning = false;

        function $(id) {
          return document.getElementById(id);
        }
        function norm(v) {
          return String(v == null ? "" : v)
            .trim()
            .replace(/\s+/g, " ");
        }
        function num(v) {
          const n = Number(String(v == null ? "" : v).replace(",", "."));
          return Number.isFinite(n) ? n : 0;
        }
        function esc(v) {
          return String(v == null ? "" : v).replace(
            /[&<>"']/g,
            (c) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;",
              })[c],
          );
        }
        function fmt(n, d) {
          return Number(n || 0).toLocaleString("tr-TR", {
            maximumFractionDigits: d == null ? 3 : d,
          });
        }
        function round3(n) {
          return Math.round((Number(n) || 0) * 1000 + Number.EPSILON) / 1000;
        }
        function todayISO() {
          const d = new Date();
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          return d.toISOString().slice(0, 10);
        }
        function dateFile() {
          const d = new Date(),
            p = (n) => String(n).padStart(2, "0");
          return (
            d.getFullYear() +
            p(d.getMonth() + 1) +
            p(d.getDate()) +
            "_" +
            p(d.getHours()) +
            p(d.getMinutes())
          );
        }
        function cleanFile(v) {
          return norm(v)
            .replace(/[ıİ]/g, "i")
            .replace(/[ğĞ]/g, "g")
            .replace(/[üÜ]/g, "u")
            .replace(/[şŞ]/g, "s")
            .replace(/[öÖ]/g, "o")
            .replace(/[çÇ]/g, "c")
            .replace(/[^a-zA-Z0-9_-]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 40);
        }
        function readJson(key, fallback) {
          try {
            const v = JSON.parse(localStorage.getItem(key) || "null");
            return v == null ? fallback : v;
          } catch (e) {
            return fallback;
          }
        }
        function appState() {
          try {
            return window.state || null;
          } catch (e) {
            return null;
          }
        }
        function settings() {
          const s = appState();
          return s && s.settings
            ? s.settings
            : readJson(SETTINGS_KEY, {}) || {};
        }
        function toast(msg, sub, type) {
          try {
            if (typeof window.toast === "function")
              return window.toast(msg, sub, type);
          } catch (e) {}
          alert(String(msg || ""));
        }
        function productInfo(key) {
          try {
            if (typeof window.productInfo === "function")
              return window.productInfo(key);
          } catch (e) {}
          const m = {
            Tomruk: { label: "Tomruk", cls: "tomruk" },
            "Maden Direk": { label: "Maden", cls: "maden" },
            Kağıtlık: { label: "Kağıtlık", cls: "kagit" },
            "Sanayi Odunu": { label: "Sanayi", cls: "sanayi" },
            "Tel Direk": { label: "Tel", cls: "tel" },
          };
          return m[normalizeProductType(key)] || m.Tomruk;
        }
        function normalizeProductType(v) {
          const x = norm(v).toLocaleLowerCase("tr-TR");
          if (
            x === "maden" ||
            x === "maden direk" ||
            x === "maden direği" ||
            x === "maden diregi"
          )
            return "Maden Direk";
          if (
            x === "kağıtlık" ||
            x === "kagitlik" ||
            x === "kağıtlık odun" ||
            x === "kagitlik odun"
          )
            return "Kağıtlık";
          if (x === "sanayi" || x === "sanayi odunu") return "Sanayi Odunu";
          if (
            x === "tel" ||
            x === "tel direk" ||
            x === "tel direği" ||
            x === "tel diregi"
          )
            return "Tel Direk";
          return x === "tomruk" ? "Tomruk" : v || "Tomruk";
        }
        function normalizeRecord(r) {
          if (!r) return null;
          const barcode = norm(r.barcode || r.barkodNo).toUpperCase();
          if (!barcode) return null;
          const st = settings();
          return Object.assign({}, r, {
            id: r.id || barcode,
            barcode,
            diameter: String(r.diameter || r.cap || ""),
            length: String(r.length || r.boy || ""),
            quantity: Math.max(1, Number(r.quantity || r.adet || 1) || 1),
            productType: normalizeProductType(
              r.productType || r.odunTuru || r.odunAdi || r.product || "Tomruk",
            ),
            treeType:
              r.treeType || r.species || r.agacTuru || r.agacAdi || "Karaçam",
            cutter: r.cutter || r.kesimci || "",
            productionDate:
              r.productionDate || r.uretimTarihi || st.mesahaDate || todayISO(),
            bolmeNo: norm(
              r.bolmeNo || r.bolme || r.bolme_no || st.bolmeNo || "",
            ),
            seflik: norm(
              r.seflik || r.seflikAdi || r.seflik_adi || st.seflik || "",
            ),
            createdAt: r.createdAt || "",
            updatedAt: r.updatedAt || "",
          });
        }
        function sanitize(list) {
          const src = Array.isArray(list) ? list : [];
          const out = [],
            seen = new Map();
          src.forEach((r) => {
            const nr = normalizeRecord(r);
            if (!nr) return;
            const key = nr.id || nr.barcode;
            if (seen.has(key)) {
              out[seen.get(key)] = nr;
            } else {
              seen.set(key, out.length);
              out.push(nr);
            }
          });
          return out;
        }
        function activeRecords() {
          const s = appState();
          const fromState = s && Array.isArray(s.records) ? s.records : null;
          const fromStore = readJson(STORAGE_KEY, []);
          const list = sanitize(fromState || fromStore || []);
          if (s) {
            s.records = list;
            window.state = s;
          }
          return list;
        }
        function rowVolume(r) {
          const d = num(r && r.diameter),
            l = num(r && r.length),
            q = Math.max(1, Number((r && r.quantity) || 1) || 1);
          if (!d || !l) return 0;
          return round3(((Math.PI * Math.pow(d / 100, 2)) / 4) * l * q);
        }
        function totals(list) {
          return (list || []).reduce(
            (a, r) => {
              const q = Math.max(1, Number(r.quantity || 1) || 1);
              a.count += q;
              a.m3 += rowVolume(r);
              return a;
            },
            { count: 0, m3: 0 },
          );
        }
        function filterList(list) {
          const s = settings(),
            q = norm(
              ($("recordSearch") && $("recordSearch").value) || "",
            ).toLocaleLowerCase("tr-TR");
          return (list || []).filter((r) => {
            const treeOk =
              !s.treeFilter ||
              s.treeFilter === "Tümü" ||
              r.treeType === s.treeFilter;
            const cutterOk =
              !s.cutterFilter ||
              s.cutterFilter === "Tümü" ||
              (s.cutterFilter === "Kesimci kaydı yok"
                ? !r.cutter
                : r.cutter === s.cutterFilter);
            const searchOk =
              !q ||
              [
                r.barcode,
                r.treeType,
                r.productType,
                productInfo(r.productType).label,
                r.cutter,
                r.diameter,
                r.length,
              ].some((x) =>
                String(x || "")
                  .toLocaleLowerCase("tr-TR")
                  .includes(q),
              );
            return treeOk && cutterOk && searchOk;
          });
        }
        function selectedFromDom(all) {
          const ids = new Set(
            Array.from(document.querySelectorAll("[data-select]:checked"))
              .map((x) => x.getAttribute("data-select"))
              .filter(Boolean),
          );
          return ids.size ? all.filter((r) => ids.has(String(r.id))) : [];
        }
        function isFilterActive(list, all) {
          const s = settings(),
            q = norm(($("recordSearch") && $("recordSearch").value) || "");
          return Boolean(
            q ||
              (s.treeFilter && s.treeFilter !== "Tümü") ||
              (s.cutterFilter && s.cutterFilter !== "Tümü") ||
              list.length !== all.length,
          );
        }
        function exportScope(allInput, filteredInput) {
          const all = Array.isArray(allInput) ? allInput : activeRecords();
          const selected = selectedFromDom(all);
          const filtered = Array.isArray(filteredInput)
            ? filteredInput
            : filterList(all);
          if (selected.length)
            return {
              list: selected,
              text: `Seçili kayıtlar (${selected.length})`,
              mode: "selected",
            };
          if (isFilterActive(filtered, all))
            return {
              list: filtered,
              text: `Filtrelenen kayıtlar (${filtered.length})`,
              mode: "filtered",
            };
          return {
            list: all,
            text: `Tüm kayıtlar (${all.length})`,
            mode: "all",
          };
        }
        function productTotalsHtml(list) {
          const order = [
              ["Tomruk", "Tomruk", "tomruk"],
              ["Maden Direk", "Maden", "maden"],
              ["Kağıtlık", "Kağıtlık", "kagit"],
              ["Sanayi Odunu", "Sanayi", "sanayi"],
              ["Tel Direk", "Tel", "tel"],
            ],
            bucket = Object.create(null);
          order.forEach((x) => (bucket[x[0]] = { count: 0, m3: 0 }));
          (list || []).forEach((r) => {
            const key = normalizeProductType(r.productType),
              b = bucket[key] || (bucket[key] = { count: 0, m3: 0 });
            b.count += Math.max(1, Number(r.quantity || 1) || 1);
            b.m3 += rowVolume(r);
          });
          return order
            .map(([key, label, cls]) => {
              const t = bucket[key] || { count: 0, m3: 0 };
              return `<div class="prod-total product-${cls}"><small>${esc(label)}</small><b>${fmt(t.m3, 3)} m³</b><small>${t.count} adet</small></div>`;
            })
            .join("");
        }
        function updateBeyan() {
          const all = activeRecords(),
            filtered = filterList(all),
            scope = exportScope(all, filtered),
            t = totals(scope.mode === "all" ? all : filtered),
            allT = totals(all);
          const countPill = $("recordCountPill");
          if (countPill)
            countPill.textContent = isFilterActive(filtered, all)
              ? `${filtered.length} / ${all.length} kayıt`
              : `${all.length} kayıt`;
          const m3 = $("recTotalM3");
          if (m3) m3.textContent = `${fmt(t.m3, 3)} m³`;
          const cnt = $("recTotalCount");
          if (cnt) cnt.textContent = t.count.toLocaleString("tr-TR");
          const productTotals = $("productTotals");
          if (productTotals)
            productTotals.innerHTML = productTotalsHtml(
              scope.mode === "all" ? all : filtered,
            );
          const scopeEl = $("exportScopeInfo");
          if (scopeEl) {
            scopeEl.textContent = "İndirilecek: " + scope.text;
            scopeEl.classList.add("orbis-v392");
          }
          const sumM3 = $("sumM3");
          if (sumM3) sumM3.textContent = `${fmt(allT.m3, 3)} m³`;
          const entryM3 = $("entryTotalM3");
          if (entryM3) entryM3.textContent = `${fmt(allT.m3, 3)} m³`;
          const entryCnt = $("entryTotalCount");
          if (entryCnt)
            entryCnt.textContent = allT.count.toLocaleString("tr-TR");
          const detail = $("detailSummary");
          if (detail) {
            const today = todayISO();
            const todayList = all.filter(
              (r) =>
                (r.productionDate || r.createdAt || "").slice(0, 10) === today,
            );
            const tt = totals(todayList);
            const last = all.length ? all[all.length - 1] : null;
            detail.innerHTML = `<div><small>Son Barkod</small><b>${esc(last ? last.barcode : "-")}</b></div><div><small>Son Ağaç</small><b>${esc(last ? last.treeType : "-")}</b></div><div><small>Bugün Kayıt</small><b>${todayList.length}</b></div><div><small>Bugün m³</small><b>${fmt(tt.m3, 3)} m³</b></div><div><small>Toplam Kayıt</small><b>${all.length}</b></div><div><small>Toplam m³</small><b>${fmt(allT.m3, 3)} m³</b></div>`;
          }
        }
        function downloadFile() {
          const scope = exportScope();
          if (!scope.list.length) {
            toast("Çıktı için kayıt yok.");
            return;
          }
          const bolme = cleanFile(settings().bolmeNo || "");
          const file = `Mesaha_${bolme ? bolme + "_" : ""}${dateFile()}.xls`;
          if (window.OrbisXls && typeof window.OrbisXls.downloadXls === "function") {
            window.OrbisXls.downloadXls(scope.list.slice(), file);
            try {
              if (window.mesahaExportStatsV323 && typeof window.mesahaExportStatsV323.send === "function")
                window.mesahaExportStatsV323.send("xls-download-v392", { list: scope.list.slice(), text: scope.text, mode: scope.mode, orbisRounding: true });
            } catch (e) {}
          } else toast("XLS modülü yüklenmedi.");
          setTimeout(updateBeyan, 120);
        }
        function xlsFileNameV62() {
          const bolme = cleanFile(settings().bolmeNo || "");
          return `Mesaha_${bolme ? bolme + "_" : ""}${dateFile()}.xls`;
        }
        function buildXlsShareBundleV62(scope) {
          if (!window.OrbisXls || typeof window.OrbisXls.makeXls !== "function")
            throw new Error("XLS modülü yüklenmedi.");
          const filename = xlsFileNameV62();
          const raw = window.OrbisXls.makeXls(scope.list.slice());
          const bytes = raw instanceof Uint8Array
            ? raw
            : raw instanceof ArrayBuffer
              ? new Uint8Array(raw)
              : new Uint8Array(raw && raw.buffer ? raw.buffer : raw);
          const stamp = Date.now();
          const files = [
            new File([bytes], filename, {
              type: "application/vnd.ms-excel",
              lastModified: stamp,
            }),
          ];
          return { bytes, files, filename };
        }
        function isAndroidBrowserV65() {
          return /Android/i.test(String((navigator && navigator.userAgent) || ""));
        }
        function bytesToBase64V65(bytes) {
          const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
          let binary = "";
          const chunk = 0x8000;
          for (let i = 0; i < u8.length; i += chunk) {
            binary += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)));
          }
          return btoa(binary);
        }
        function pickShareFileV62(files) {
          if (!navigator || typeof navigator.share !== "function") return null;
          for (const file of files) {
            try {
              if (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] }))
                return file;
            } catch (_) {}
          }
          return null;
        }
        async function directFileShareV65(built, scope) {
          const shareFile = pickShareFileV62(built.files);
          if (!shareFile) return false;
          try {
            await navigator.share({ files: [shareFile], title: built.filename });
            try {
              if (window.mesahaExportStatsV323 && typeof window.mesahaExportStatsV323.send === "function")
                window.mesahaExportStatsV323.send("xls-share-v65", { list: scope.list.slice(), text: scope.text, mode: scope.mode, target: "direct-file-share" });
            } catch (_) {}
            toast("Paylaşım menüsü açıldı.");
            return true;
          } catch (err) {
            if (err && err.name === "AbortError") return true;
            return false;
          }
        }
        async function showShareLinkReadyV65(built, linkData, scope) {
          const shareUrl = String((linkData && linkData.url) || "").trim();
          if (!shareUrl) throw new Error("Paylaşım bağlantısı alınamadı.");
          const html = `<p>Android Chrome, <b>.xls dosyasını doğrudan uygulamaya eklemeye izin vermediği</b> için güvenli indirme bağlantısı hazırlandı.</p><div class="modal-note"><b>${esc(built.filename)}</b><br>Bağlantı 24 saat geçerlidir. Alıcı bağlantıya dokunduğunda gerçek ORBİS uyumlu XLS dosyası iner.</div><div class="xls-share-note-v62">Dosya geçici ve özel alanda tutulur; bağlantının süresi dolduğunda indirilemez.</div>`;
          if (typeof window.mesahaModal !== "function") {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(shareUrl);
              toast("Paylaşım bağlantısı kopyalandı.");
              return;
            }
            window.open(shareUrl, "_blank", "noopener");
            return;
          }
          await window.mesahaModal({
            title: "Paylaşım bağlantısı hazır",
            icon: "↗",
            html,
            buttons: [
              {
                text: "Paylaşım Menüsünü Aç",
                value: false,
                cls: "primary xls-link-share-v65",
                onClick: async function () {
                  if (!navigator || typeof navigator.share !== "function") {
                    throw new Error("Sistem paylaşım menüsü bu tarayıcıda kullanılamıyor.");
                  }
                  try {
                    await navigator.share({
                      title: built.filename,
                      text: "ORBİS uyumlu Mesaha dosyası. Bağlantı 24 saat geçerlidir.",
                      url: shareUrl,
                    });
                    try {
                      if (window.mesahaExportStatsV323 && typeof window.mesahaExportStatsV323.send === "function")
                        window.mesahaExportStatsV323.send("xls-share-v65", { list: scope.list.slice(), text: scope.text, mode: scope.mode, target: "temporary-link" });
                    } catch (_) {}
                  } catch (err) {
                    if (err && err.name === "AbortError") return;
                    throw err;
                  }
                },
              },
              {
                text: "Bağlantıyı Kopyala",
                value: false,
                cls: "soft xls-copy-link-v65",
                onClick: async function () {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(shareUrl);
                    toast("Paylaşım bağlantısı kopyalandı.");
                    return;
                  }
                  window.prompt("Bağlantıyı kopyalayın:", shareUrl);
                },
              },
              { text: "Kapat", value: false, cls: "ghost" },
            ],
          });
        }
        async function createTemporaryShareLinkV65(built) {
          if (navigator.onLine === false) throw new Error("Paylaşım bağlantısı için internet bağlantısı gerekiyor.");
          const api = window.MesahaSuiteSync || window.MesahaSuiteSyncV31 || window.MesahaSuiteSyncV28;
          if (!api || typeof api.edge !== "function") throw new Error("Güvenli paylaşım servisi hazır değil.");
          toast("Güvenli paylaşım bağlantısı hazırlanıyor…");
          return await api.edge("xls_share_link_create", {
            filename: built.filename,
            fileBase64: bytesToBase64V65(built.bytes),
            fileSize: built.bytes.length,
            expiresIn: 86400,
            appVersion: String((window.MESAHA_VERSION && window.MESAHA_VERSION.version) || "Mesaha İO"),
          });
        }
        async function shareXlsV62() {
          const scope = exportScope();
          if (!scope.list.length) return toast("Paylaşılacak kayıt yok.");
          let built;
          try {
            built = buildXlsShareBundleV62(scope);
          } catch (err) {
            toast(err && err.message ? err.message : "Dosya hazırlanamadı.");
            return;
          }

          /* iOS/Safari destekliyorsa gerçek dosyayı doğrudan paylaşır. Android Chromium
             XLS uzantısını güvenlik nedeniyle reddettiği için orada zaman kaybetmeden
             24 saatlik özel indirme bağlantısı hazırlanır. */
          if (!isAndroidBrowserV65()) {
            const direct = await directFileShareV65(built, scope);
            if (direct) return;
          }

          try {
            const linkData = await createTemporaryShareLinkV65(built);
            await showShareLinkReadyV65(built, linkData, scope);
          } catch (err) {
            downloadFile();
            const message = err && err.message
              ? err.message + " Dosya indirildi; İndirilenler klasöründen paylaşabilirsiniz."
              : "Paylaşım bağlantısı hazırlanamadı. Dosya indirildi.";
            toast(message);
          }
        }
        async function confirmAndDownload() {
          const scope = exportScope();
          const st = totals(scope.list);
          const html = `<p><b>${esc(scope.text)}</b> ORBİS uyumlu .xls olarak hazırlanacak.</p><div class="modal-note"><b>Kontrol:</b> ${scope.list.length} kayıt • ${fmt(st.m3, 3)} m³<br>Hacimler ORBİS mantığıyla her kayıt 3 haneye yuvarlanarak hesaplanır.</div><div class="orbis-video-note-v392">Video anlatım: <a class="orbis-video-link-v392" href="https://youtube.com/shorts/J25xp8NrHw8?si=-SeJsWMar3Ja3O4I" target="_blank" rel="noopener">ORBİS aktarım videosunu aç</a></div><div class="xls-share-note-v62"><b>Paylaş</b> düğmesi iPhone/iPad’de dosyayı doğrudan paylaşır. Android Chrome’da XLS dosya eki desteklenmediği için 24 saatlik güvenli indirme bağlantısı hazırlanır ve sistem paylaşım menüsüyle gönderilir.</div><ol><li>Dosyayı bilgisayara aktarınız.</li><li>ORBİS’e bilgisayar üzerinden giriş yapınız.</li><li>İşletme Pazarlama modülüne giriniz.</li><li>Kesme Faaliyetleri Raporu ekranında şeflik ve bölme bilgilerini giriniz.</li><li>Bölmeye çift tıklayıp dosya yükleme bölümünden <b>Excel’den Aktar</b> deyiniz.</li></ol>`;
          let action = "download";
          if (typeof window.mesahaModal === "function")
            action = await window.mesahaModal({
              title: "Mesaha dosyası indiriliyor",
              icon: "▣",
              html,
              buttons: [
                { text: "Dosyayı İndir", value: "download", cls: "primary xls-download-v62" },
                { text: "Paylaş", value: false, cls: "xls-share-button-v62", onClick: shareXlsV62 },
                { text: "Vazgeç", value: false, cls: "ghost xls-cancel-v62" },
              ],
            });
          else action = confirm(scope.text + " indirilsin mi?") ? "download" : false;
          if (action === "download") downloadFile();
        }
        function intercept(ev) {
          const target =
            ev.target && ev.target.closest
              ? ev.target.closest("#downloadXlsBtn")
              : null;
          if (!target) return;
          ev.preventDefault();
          ev.stopPropagation();
          if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          if (exportRunning) return;
          exportRunning = true;
          Promise.resolve(confirmAndDownload()).finally(() =>
            setTimeout(() => {
              exportRunning = false;
            }, 650),
          );
        }
        function wrapOrbisDownload() {
          if (
            !window.OrbisXls ||
            !window.OrbisXls.downloadXls ||
            window.OrbisXls.__v392Wrapped
          )
            return false;
          const old = window.OrbisXls.downloadXls;
          window.OrbisXls.downloadXls = function (list, filename) {
            const active = activeRecords();
            const byId = new Map(active.map((r) => [String(r.id), r]));
            const byBarcode = new Map(
              active.map((r) => [String(r.barcode).toUpperCase(), r]),
            );
            const clean = sanitize(Array.isArray(list) ? list : active)
              .map(
                (r) =>
                  byId.get(String(r.id)) ||
                  byBarcode.get(String(r.barcode).toUpperCase()),
              )
              .filter(Boolean);
            return old.call(this, clean.length ? clean : active, filename);
          };
          window.OrbisXls.__v392Wrapped = true;
          return true;
        }
        function recordsVisibleV578() {
          const records = $("recordsView");
          const beyan = $("beyanView");
          return !!((records && records.classList.contains("active")) || (beyan && beyan.classList.contains("active")));
        }
        function boot() {
          try {
            window.MesahaOrbisV392 = {
              volume: rowVolume,
              totals,
              records: activeRecords,
              exportScope,
              updateBeyan,
              download: downloadFile,
            };
          } catch (e) {}
          try {
            window.volume = rowVolume;
          } catch (e) {}
          try {
            if (window.mesahaV305)
              window.mesahaV305.updateBeyanTotals = updateBeyan;
          } catch (e) {}
          wrapOrbisDownload();
          if (recordsVisibleV578()) updateBeyan();
        }
        document.addEventListener("click", intercept, true);
        let beyanTimerV542 = 0;
        function scheduleBeyanV542(delay = 100) {
          if (
            window.MesahaIOSPerformanceV576 &&
            !window.MesahaIOSPerformanceV576.shouldRunHeavy("records")
          )
            return;
          clearTimeout(beyanTimerV542);
          beyanTimerV542 = setTimeout(updateBeyan, delay);
        }
        function relevantBeyanTargetV542(ev) {
          const t = ev && ev.target;
          if (!t) return false;
          if (
            t.id === "recordSearch" ||
            t.id === "treeFilter" ||
            t.id === "cutterFilter" ||
            t.id === "bulkCutterSelectV406"
          )
            return true;
          return !!(
            t.closest &&
            t.closest(
              "#recordsView,[data-tree-filter],[data-cutter-filter],#clearSelectionBtn,#selectFilteredBtn,#bulkCutterTransferBtnV406",
            )
          );
        }
        window.addEventListener(
          "mesaha:records-saved",
          () => scheduleBeyanV542(60),
          { passive: true },
        );
        window.addEventListener(
          "mesaha:settings-saved",
          () => scheduleBeyanV542(100),
          { passive: true },
        );
        window.addEventListener(
          "mesaha:view-changed",
          (ev) => {
            if (ev && ev.detail && ev.detail.view === "records")
              scheduleBeyanV542(30);
          },
          { passive: true },
        );
        document.addEventListener(
          "input",
          (ev) => {
            if (relevantBeyanTargetV542(ev)) scheduleBeyanV542(90);
          },
          true,
        );
        document.addEventListener(
          "change",
          (ev) => {
            if (relevantBeyanTargetV542(ev)) scheduleBeyanV542(90);
          },
          true,
        );
        document.addEventListener(
          "click",
          (ev) => {
            if (relevantBeyanTargetV542(ev)) scheduleBeyanV542(110);
          },
          true,
        );
        [150, 850].forEach((ms) => setTimeout(boot, ms));
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
      })();
;

/* source: mesaha-inline-v394-video-links-final-hotfix */
(function () {
        "use strict";
        if (window.__mesahaV393UserPanelCloseNotesFinalHotfix) return;
        window.__mesahaV393UserPanelCloseNotesFinalHotfix = true;
        var DISPLAY = "Mesaha İO";
        function $(id) {
          return document.getElementById(id);
        }
        function userPanelOpen() {
          var p = $("userPanelOverlayV316");
          return !!(p && !p.classList.contains("hidden"));
        }
        function closeUserPanel() {
          var p = $("userPanelOverlayV316");
          if (p) p.classList.add("hidden");
          document.body.classList.remove(
            "mesaha-user-panel-open-v393",
            "mesaha-panel-open-v392",
          );
        }
        function syncPanelClass() {
          document.body.classList.toggle(
            "mesaha-user-panel-open-v393",
            userPanelOpen(),
          );
        }
        function ensureCloseButtons() {
          var panel = $("userPanelOverlayV316");
          if (!panel) return;
          var head = panel.querySelector(".panel-head-v316");
          var old = $("userPanelCloseV316");
          if (old) {
            old.textContent = "×";
            old.setAttribute("aria-label", "Kullanıcı panelini kapat");
            old.setAttribute("title", "Kapat");
            old.onclick = closeUserPanel;
          }
          if (head && !$("panelCloseInlineV393")) {
            var b = document.createElement("button");
            b.type = "button";
            b.id = "panelCloseInlineV393";
            b.className = "panel-close-v393-inline";
            b.textContent = "Kapat";
            b.addEventListener("click", closeUserPanel, true);
            head.appendChild(b);
          }
          if (!$("panelFloatingCloseV393")) {
            var f = document.createElement("button");
            f.type = "button";
            f.id = "panelFloatingCloseV393";
            f.className = "panel-floating-close-v393";
            f.textContent = "✕ Kullanıcı Panelini Kapat";
            f.addEventListener("click", closeUserPanel, true);
            document.body.appendChild(f);
          }
          var close2 = $("panelClose2V316");
          if (close2) {
            close2.textContent = "Kullanıcı Panelini Kapat";
            close2.onclick = closeUserPanel;
          }
        }
        function rewriteUpdateNotes() {
          var old = $("panelUpdateNotesV392");
          if (old && old.parentNode) old.parentNode.removeChild(old);
        }
        function versionText() {
          try {
            if (window.MESAHA_VERSION) {
              window.MESAHA_VERSION.app = "Mesaha İO";
              window.MESAHA_VERSION.visibleVersion = DISPLAY;
              window.MESAHA_VERSION.shortVersion = DISPLAY;
              /* central version locked */
            }
          } catch (e) {}
        }
        function boot() {
          ensureCloseButtons();
          rewriteUpdateNotes();
          syncPanelClass();
          versionText();
          var panel = $("userPanelOverlayV316");
          if (window.MesahaUiHub && panel && !panel.__v394HubWatch) {
            panel.__v394HubWatch = true;
            window.MesahaUiHub.watchClass("userPanelOverlayV316", function () {
              ensureCloseButtons();
              rewriteUpdateNotes();
              syncPanelClass();
            });
          }
        }
        document.addEventListener(
          "click",
          function (ev) {
            var t =
              ev.target &&
              ev.target.closest &&
              ev.target.closest(
                "#userPanelCloseV316,#panelClose2V316,#panelCloseInlineV393,#panelFloatingCloseV393",
              );
            if (t) {
              ev.preventDefault();
              ev.stopPropagation();
              closeUserPanel();
            }
          },
          true,
        );
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        [250, 900, 1800].forEach(function (ms) {
          setTimeout(boot, ms);
        });
      })();
;

/* source: mesaha-inline-v394-video-links-hotfix */
(function () {
        if (window.__mesahaV394VideoLinksHotfix) return;
        window.__mesahaV394VideoLinksHotfix = true;
        var ORBIS_VIDEO =
          "https://youtube.com/shorts/J25xp8NrHw8?si=-SeJsWMar3Ja3O4I";
        var APP_VIDEO =
          "https://youtube.com/shorts/4yRRIRNptro?si=EgpHz-hQmnxFuqu2";
        var DISPLAY = "Mesaha İO";
        var SLUG = "local";
        function $(id) {
          return document.getElementById(id);
        }
        function setVersionMeta() {
          try {
            /* central version locked */
            localStorage.setItem("mesaha_current_version", SLUG);
          } catch (e) {}
        }
        function ensureGuideVideo() {
          var guide = document.querySelector("#guideView .guide-card");
          if (!guide || $("appUsageVideoGuideV394")) return;
          var head = guide.querySelector(".section-head");
          var box = document.createElement("div");
          box.className = "guide-section-guide-clean app-video-guide-v394";
          box.id = "appUsageVideoGuideV394";
          box.innerHTML =
            '<h3>Uygulama Kullanımı Videosu</h3><p class="guide-note-guide-clean">Uygulamayı kullanmaya başlamadan önce kısa anlatım videosunu izleyebilirsiniz.</p><a class="guide-link-v392 video-link-v392 app-video-link-v394" href="' +
            APP_VIDEO +
            '" target="_blank" rel="noopener">Uygulama kullanım videosunu açınız</a>';
          if (head && head.nextSibling)
            guide.insertBefore(box, head.nextSibling);
          else guide.insertBefore(box, guide.firstChild);
        }
        function updateLinks() {
          document
            .querySelectorAll(
              'a[href*="youtube.com/shorts/t22Q__qYSqc"],a[href*="youtube.com/shorts/J25xp8NrHw8"]',
            )
            .forEach(function (a) {
              if (
                (a.textContent || "")
                  .toLocaleLowerCase("tr-TR")
                  .indexOf("orb") > -1 ||
                a.className.indexOf("orbis") > -1
              )
                a.href = ORBIS_VIDEO;
            });
          document
            .querySelectorAll('a[href="' + APP_VIDEO + '"]')
            .forEach(function (a) {
              a.setAttribute("target", "_blank");
              a.setAttribute("rel", "noopener");
            });
        }
        function run() {
          setVersionMeta();
          ensureGuideVideo();
          updateLinks();
        }
        document.addEventListener("DOMContentLoaded", run);
        run();
        setTimeout(run, 300);
        setTimeout(run, 1200);
      })();
;

/* source: mesaha-inline-v395-mobile-panel-scroll-zoom-hotfix */
(function () {
        "use strict";
        if (window.__mesahaV395MobilePanelScrollZoomHotfix) return;
        window.__mesahaV395MobilePanelScrollZoomHotfix = true;
        var savedY = 0,
          locked = false,
          startY = 0,
          touchBound = false;
        function $(id) {
          return document.getElementById(id);
        }
        function isOpen(el) {
          return !!(el && !el.classList.contains("hidden"));
        }
        function userOpen() {
          return isOpen($("userPanelOverlayV316"));
        }
        function cloudOpen() {
          return isOpen($("cloudRestoreOverlayV316"));
        }
        function anyPanelOpen() {
          return userOpen() || cloudOpen();
        }
        function ensureViewport() {
          var meta = document.querySelector('meta[name="viewport"]');
          var content =
            "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content";
          if (!meta) {
            meta = document.createElement("meta");
            meta.name = "viewport";
            document.head.appendChild(meta);
          }
          if (meta.getAttribute("content") !== content)
            meta.setAttribute("content", content);
        }
        function lockBody() {
          if (locked) return;
          savedY = window.scrollY || document.documentElement.scrollTop || 0;
          locked = true;
          document.documentElement.classList.add("mesaha-scroll-lock-v395");
          document.body.classList.add("mesaha-scroll-lock-v395");
          document.body.style.top = -savedY + "px";
        }
        function unlockBody() {
          if (!locked) return;
          locked = false;
          document.documentElement.classList.remove("mesaha-scroll-lock-v395");
          document.body.classList.remove(
            "mesaha-scroll-lock-v395",
            "mesaha-user-panel-open-v395",
            "mesaha-cloud-panel-open-v395",
          );
          document.body.style.top = "";
          window.scrollTo(0, savedY || 0);
        }
        function setTouchWatch(on) {
          if (on && !touchBound) {
            touchBound = true;
            document.addEventListener("touchstart", onTouchStart, {
              passive: true,
              capture: true,
            });
            document.addEventListener("touchmove", onTouchMove, {
              passive: false,
              capture: true,
            });
          } else if (!on && touchBound) {
            touchBound = false;
            document.removeEventListener("touchstart", onTouchStart, true);
            document.removeEventListener("touchmove", onTouchMove, true);
          }
        }
        function sync() {
          ensureViewport();
          var u = userOpen(),
            c = cloudOpen(),
            open = u || c;
          document.body.classList.toggle("mesaha-user-panel-open-v395", u);
          document.body.classList.toggle("mesaha-cloud-panel-open-v395", c);
          setTouchWatch(open);
          if (open) lockBody();
          else unlockBody();
        }
        function panelCardForTarget(target) {
          if (!target || !target.closest) return null;
          return target.closest(
            "#userPanelOverlayV316 .panel-card-v316,#cloudRestoreOverlayV316 .panel-card-v316",
          );
        }
        function onTouchStart(ev) {
          if (!anyPanelOpen()) return;
          var t = ev.touches && ev.touches[0];
          startY = t ? t.clientY : 0;
        }
        function onTouchMove(ev) {
          if (!anyPanelOpen()) return;
          var card = panelCardForTarget(ev.target);
          if (!card) {
            ev.preventDefault();
            return;
          }
          var t = ev.touches && ev.touches[0];
          if (!t) return;
          var dy = t.clientY - startY;
          var atTop = card.scrollTop <= 0;
          var atBottom =
            Math.ceil(card.scrollTop + card.clientHeight) >= card.scrollHeight;
          if ((atTop && dy > 0) || (atBottom && dy < 0)) {
            ev.preventDefault();
          }
        }
        function resetZoomSoon() {
          ensureViewport();
          setTimeout(function () {
            try {
              window.scrollTo(
                0,
                window.scrollY || document.documentElement.scrollTop || 0,
              );
            } catch (e) {}
          }, 80);
        }
        function patchClose() {
          [
            "userPanelCloseV316",
            "panelClose2V316",
            "panelCloseInlineV393",
            "panelFloatingCloseV393",
            "cloudRestoreCloseV316",
          ].forEach(function (id) {
            var b = $(id);
            if (b && !b.__v395Unlock) {
              b.__v395Unlock = true;
              b.addEventListener(
                "click",
                function () {
                  setTimeout(sync, 20);
                },
                true,
              );
            }
          });
        }
        function boot() {
          ensureViewport();
          patchClose();
          sync();
          ["userPanelOverlayV316", "cloudRestoreOverlayV316"].forEach(
            function (id) {
              var el = $(id);
              if (window.MesahaUiHub && el && !el.__v395HubWatch) {
                el.__v395HubWatch = true;
                window.MesahaUiHub.watchClass(id, function () {
                  setTimeout(sync, 10);
                });
              }
            },
          );
        }
        document.addEventListener(
          "focusin",
          function (ev) {
            if (
              anyPanelOpen() &&
              ev.target &&
              ev.target.matches &&
              ev.target.matches("input,textarea,select")
            )
              ensureViewport();
          },
          true,
        );
        document.addEventListener(
          "focusout",
          function (ev) {
            if (
              anyPanelOpen() &&
              ev.target &&
              ev.target.matches &&
              ev.target.matches("input,textarea,select")
            )
              resetZoomSoon();
          },
          true,
        );
        window.addEventListener(
          "resize",
          function () {
            if (anyPanelOpen()) setTimeout(sync, 30);
          },
          { passive: true },
        );
        document.addEventListener("visibilitychange", function () {
          if (!document.hidden) setTimeout(sync, 50);
        });
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        [200, 800, 1600].forEach(function (ms) {
          setTimeout(boot, ms);
        });
      })();
;

/* source: mesaha-v406-cutter-manager */
(function () {
        "use strict";
        var rendering = false,
          timer = 0,
          recordCutterCache = null;
        var REMOVED_KEY = "mesaha_removed_cutters_v407";
        function $(id) {
          return document.getElementById(id);
        }
        function clean(v) {
          return String(v == null ? "" : v)
            .trim()
            .replace(/\s+/g, " ");
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
        function state() {
          return window.state || null;
        }
        function entryActive() {
          var e = $("entryView");
          return !!(e && e.classList.contains("active"));
        }
        function settings() {
          var s = state();
          if (!s) return null;
          if (!s.settings) s.settings = {};
          if (!Array.isArray(s.settings.cutters)) s.settings.cutters = [];
          return s.settings;
        }
        function records() {
          var s = state();
          return s && Array.isArray(s.records) ? s.records : [];
        }
        function toast(msg) {
          try {
            if (window.toast) return window.toast(msg);
          } catch (e) {}
          try {
            alert(msg);
          } catch (e) {}
        }
        function saveSettings(reason) {
          try {
            if (window.__flushSettings)
              return window.__flushSettings(reason || "cutter-settings");
            if (window.saveSettings) return window.saveSettings();
          } catch (e) {}
          return Promise.resolve({
            ok: false,
            error: "Ayar depolama motoru hazır değil",
          });
        }
        function saveRecords(reason) {
          try {
            if (window.saveRecords)
              return window.saveRecords(reason || "cutter-records");
          } catch (e) {}
          return Promise.resolve({
            ok: false,
            error: "Kayıt depolama motoru hazır değil",
          });
        }
        function saveAll(reason) {
          try {
            if (window.__saveAllV527)
              return window.__saveAllV527(reason || "cutter-transaction");
          } catch (e) {}
          return Promise.all([saveRecords(reason), saveSettings(reason)]).then(
            function (a) {
              return a.some(function (x) {
                return x && x.ok === false;
              })
                ? { ok: false }
                : { ok: true };
            },
          );
        }
        function redrawOthers() {
          try {
            if (
              window.MesahaRenderStorageV382 &&
              window.MesahaRenderStorageV382.renderAllSoon
            )
              window.MesahaRenderStorageV382.renderAllSoon();
            else if (window.renderAll) window.renderAll();
          } catch (e) {}
          setTimeout(render, 120);
        }
        function unique(arr) {
          var out = [];
          (arr || []).forEach(function (x) {
            x = clean(x);
            if (x && out.indexOf(x) < 0) out.push(x);
          });
          return out;
        }
        function readRemoved() {
          var arr = [];
          try {
            arr = JSON.parse(localStorage.getItem(REMOVED_KEY) || "[]") || [];
          } catch (e) {
            arr = [];
          }
          var st = settings();
          if (st && Array.isArray(st.removedCuttersV407))
            arr = arr.concat(st.removedCuttersV407);
          return unique(arr);
        }
        function writeRemoved(list) {
          list = unique(list || []);
          try {
            localStorage.setItem(REMOVED_KEY, JSON.stringify(list));
          } catch (e) {}
          var st = settings();
          if (st) st.removedCuttersV407 = list;
        }
        function isRemoved(name) {
          name = clean(name);
          return !!name && readRemoved().indexOf(name) > -1;
        }
        function markRemoved(name) {
          name = clean(name);
          if (!name) return;
          var list = readRemoved();
          if (list.indexOf(name) < 0) list.push(name);
          writeRemoved(list);
        }
        function unmarkRemoved(name) {
          name = clean(name);
          if (!name) return;
          writeRemoved(
            readRemoved().filter(function (x) {
              return clean(x) !== name;
            }),
          );
        }
        function activeRecordCutters() {
          if (recordCutterCache) return recordCutterCache.slice();
          recordCutterCache = unique(
            records().map(function (r) {
              return r && r.cutter;
            }),
          );
          return recordCutterCache.slice();
        }
        function cutterList() {
          var st = settings();
          if (!st) return [];
          var active = activeRecordCutters();
          var removed = readRemoved();
          var list = unique(
            [].concat(st.cutters || [], st.activeCutter || [], active),
          ).filter(function (c) {
            return removed.indexOf(c) < 0 || active.indexOf(c) > -1;
          });
          if (st.activeCutter && list.indexOf(clean(st.activeCutter)) < 0)
            st.activeCutter = "";
          if (
            st.cutterFilter &&
            st.cutterFilter !== "Tümü" &&
            st.cutterFilter !== "Kesimci kaydı yok" &&
            list.indexOf(clean(st.cutterFilter)) < 0
          )
            st.cutterFilter = "Tümü";
          st.cutters = list;
          return list;
        }
        function countByCutter(name) {
          return records().filter(function (r) {
            return clean(r && r.cutter) === name;
          }).length;
        }
        function render() {
          if (!entryActive()) return;
          var chips = $("cutterChips"),
            st = settings();
          if (!chips || !st) return;
          if (rendering) return;
          rendering = true;
          var list = cutterList();
          chips.classList.add("cutter-manager-v406");
          var html =
            '<button class="cutter-none-v406 ' +
            (!st.activeCutter ? "active" : "") +
            '" data-cutter-select-v406="" type="button">Kesimci seçilmedi</button>';
          html += list
            .map(function (c) {
              var active = clean(st.activeCutter) === c;
              return (
                '<span class="cutter-chip-v406 ' +
                (active ? "active" : "") +
                '" data-cutter-name-v406="' +
                esc(c) +
                '">' +
                '<button class="cutter-name-v406" data-cutter-select-v406="' +
                esc(c) +
                '" type="button" title="' +
                esc(c) +
                '">' +
                esc(c) +
                "</button>" +
                '<button class="cutter-edit-v406" data-cutter-edit-v406="' +
                esc(c) +
                '" type="button">Düzenle</button>' +
                '<button class="cutter-delete-v406" data-cutter-delete-v406="' +
                esc(c) +
                '" type="button">Sil</button>' +
                "</span>"
              );
            })
            .join("");
          if (chips.innerHTML !== html) chips.innerHTML = html;
          rendering = false;
        }
        function schedule() {
          clearTimeout(timer);
          if (!entryActive()) return;
          timer = setTimeout(render, 70);
        }
        function selectCutter(name) {
          var st = settings();
          if (!st) return;
          st.activeCutter = clean(name);
          saveSettings();
          render();
        }
        async function editCutter(oldName) {
          oldName = clean(oldName);
          if (!oldName) return;
          var st = settings();
          if (!st) return;
          var next = clean(prompt("Kesimci yeni ismini yazınız:", oldName));
          if (!next || next === oldName) return;
          var list = cutterList();
          if (
            list.some(function (x) {
              return (
                x.toLocaleLowerCase("tr-TR") ===
                  next.toLocaleLowerCase("tr-TR") && x !== oldName
              );
            })
          ) {
            toast("Bu isimde kesimci zaten var.");
            return;
          }
          var beforeRecords = JSON.parse(JSON.stringify(records()));
          var beforeSettings = JSON.parse(JSON.stringify(st));
          unmarkRemoved(oldName);
          unmarkRemoved(next);
          st.cutters = unique(
            (st.cutters || [])
              .map(function (x) {
                return clean(x) === oldName ? next : x;
              })
              .concat([next]),
          );
          if (clean(st.activeCutter) === oldName) st.activeCutter = next;
          if (clean(st.cutterFilter) === oldName) st.cutterFilter = next;
          var changed = 0;
          records().forEach(function (r) {
            if (clean(r && r.cutter) === oldName) {
              r.cutter = next;
              r.updatedAt = new Date().toISOString();
              changed++;
            }
          });
          var result = await saveAll("cutter-rename");
          if (result && result.ok === false) {
            var app = state();
            if (app) {
              app.records = beforeRecords;
              app.settings = beforeSettings;
            }
            toast("Kesimci değişikliği kaydedilemedi.");
            redrawOthers();
            return;
          }
          toast(
            changed
              ? "Kesimci ismi güncellendi. " +
                  changed +
                  " kayıt yeni isme bağlandı."
              : "Kesimci ismi güncellendi.",
          );
          redrawOthers();
        }
        async function deleteCutter(name) {
          name = clean(name);
          if (!name) return;
          var st = settings();
          if (!st) return;
          var cnt = countByCutter(name);
          if (cnt > 0) {
            toast(
              name +
                " kesimcisine ait " +
                cnt +
                " kayıt var. Kayıt varken kesimci silinmez.",
            );
            return;
          }
          if (!confirm(name + " kesimcisini silmek istiyor musun?")) return;
          var beforeSettings = JSON.parse(JSON.stringify(st));
          markRemoved(name);
          st.cutters = unique(
            (st.cutters || []).filter(function (x) {
              return clean(x) !== name;
            }),
          );
          if (clean(st.activeCutter) === name) st.activeCutter = "";
          if (clean(st.cutterFilter) === name) st.cutterFilter = "Tümü";
          var result = await saveSettings("cutter-delete");
          if (result && result.ok === false) {
            var app = state();
            if (app) app.settings = beforeSettings;
            toast("Kesimci silme kaydedilemedi.");
            redrawOthers();
            return;
          }
          try {
            var mem =
              JSON.parse(
                localStorage.getItem("mesaha_entry_memory_v373") || "{}",
              ) || {};
            if (clean(mem.activeCutter) === name) mem.activeCutter = "";
            if (Array.isArray(mem.cutters))
              mem.cutters = unique(
                mem.cutters.filter(function (x) {
                  return clean(x) !== name;
                }),
              );
            localStorage.setItem(
              "mesaha_entry_memory_v373",
              JSON.stringify(mem),
            );
          } catch (e) {}
          toast("Kesimci silindi. Tekrar otomatik seçilmeyecek.");
          redrawOthers();
        }
        document.addEventListener(
          "click",
          function (ev) {
            var t =
              ev.target &&
              ev.target.closest &&
              ev.target.closest(
                "[data-cutter-select-v406],[data-cutter-edit-v406],[data-cutter-delete-v406]",
              );
            if (!t) return;
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
            if (t.hasAttribute("data-cutter-select-v406"))
              selectCutter(t.getAttribute("data-cutter-select-v406") || "");
            else if (t.hasAttribute("data-cutter-edit-v406"))
              editCutter(t.getAttribute("data-cutter-edit-v406") || "");
            else if (t.hasAttribute("data-cutter-delete-v406"))
              deleteCutter(t.getAttribute("data-cutter-delete-v406") || "");
          },
          true,
        );
        function boot() {
          schedule();
          var chips = $("cutterChips");
          if (chips && window.MutationObserver && !chips.__v406CutterWatch) {
            chips.__v406CutterWatch = true;
            new MutationObserver(function () {
              if (!rendering) schedule();
            }).observe(chips, { childList: true, subtree: false });
          }
          window.addEventListener(
            "mesaha:records-saved",
            function (ev) {
              var d = (ev && ev.detail) || {};
              if (d.delta && d.delta.record) {
                var c = clean(d.delta.record.cutter);
                if (c && recordCutterCache && recordCutterCache.indexOf(c) < 0)
                  recordCutterCache.push(c);
              } else if (d.full || d.transaction) recordCutterCache = null;
            },
            { passive: true },
          );
          window.addEventListener("mesaha:settings-saved", schedule, {
            passive: true,
          });
          window.addEventListener(
            "mesaha:view-changed",
            function (ev) {
              if (ev && ev.detail && ev.detail.view === "entry") schedule();
            },
            { passive: true },
          );
          // Görünmeyen giriş ekranı için arka planda kesimci taraması yapılmaz.
          [220, 900].forEach(function (ms) {
            setTimeout(schedule, ms);
          });
          try {
            window.MesahaCutterManagerV406 = {
              render: render,
              edit: editCutter,
              remove: deleteCutter,
              select: selectCutter,
            };
          } catch (e) {}
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
      })();
;

/* source: mesaha-inline-v406-filter-select-cutter-transfer */
/* v406: Ölçümlerde filtreye göre tümünü seç + seçili kayıtları kesimciye aktar */
      (function () {
        "use strict";
        if (window.__mesahaBulkCutterTransferV406) return;
        window.__mesahaBulkCutterTransferV406 = true;

        var STORAGE_KEY = "cam_mesaha_kayitlari_v1";
        var SETTINGS_KEY = "cam_mesaha_ayarlar_v1";
        var REMOVED_KEY = "mesaha_removed_cutters_v407";
        function $(id) {
          return document.getElementById(id);
        }
        function clean(v) {
          return String(v == null ? "" : v)
            .trim()
            .replace(/\s+/g, " ");
        }
        function esc(v) {
          return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return {
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#039;",
            }[c];
          });
        }
        function state() {
          return window.state || null;
        }
        function recordsActive() {
          var e = $("recordsView");
          return !!(e && e.classList.contains("active"));
        }
        function settings() {
          var s = state();
          if (s) {
            if (!s.settings) s.settings = {};
            return s.settings;
          }
          try {
            return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {};
          } catch (e) {
            return {};
          }
        }
        function records() {
          var s = state();
          if (s && Array.isArray(s.records)) return s.records;
          try {
            var r = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(r) ? r : [];
          } catch (e) {
            return [];
          }
        }
        function toast(msg) {
          try {
            if (window.toast) return window.toast(msg);
          } catch (e) {}
          try {
            alert(msg);
          } catch (e) {}
        }
        function saveSettings(reason) {
          try {
            if (window.__flushSettings)
              return window.__flushSettings(reason || "bulk-cutter-settings");
            if (window.saveSettings) return window.saveSettings();
          } catch (e) {}
          return Promise.resolve({
            ok: false,
            error: "Ayar depolama motoru hazır değil",
          });
        }
        function saveRecords(reason) {
          try {
            if (window.saveRecords)
              return window.saveRecords(reason || "bulk-cutter-records");
          } catch (e) {}
          return Promise.resolve({
            ok: false,
            error: "Kayıt depolama motoru hazır değil",
          });
        }
        function saveAll(reason) {
          try {
            if (window.__saveAllV527)
              return window.__saveAllV527(reason || "bulk-cutter-transaction");
          } catch (e) {}
          return Promise.all([saveRecords(reason), saveSettings(reason)]).then(
            function (a) {
              return a.some(function (x) {
                return x && x.ok === false;
              })
                ? { ok: false }
                : { ok: true };
            },
          );
        }
        function renderAll() {
          try {
            if (
              window.MesahaRenderStorageV382 &&
              window.MesahaRenderStorageV382.renderAllSoon
            )
              window.MesahaRenderStorageV382.renderAllSoon();
            else if (window.renderAll) window.renderAll();
          } catch (e) {}
          try {
            if (window.mesahaV303 && window.mesahaV303.render)
              window.mesahaV303.render();
            else if (window.mesahaV303 && window.mesahaV303.records)
              window.mesahaV303.records();
          } catch (e) {}
          setTimeout(function () {
            populateCutterSelect();
            updateHint();
          }, 120);
        }
        function selected() {
          try {
            return window.mesahaV303 &&
              typeof window.mesahaV303.selected === "function"
              ? window.mesahaV303.selected() || []
              : [];
          } catch (e) {
            return [];
          }
        }
        function filtered() {
          try {
            return window.mesahaV303 &&
              typeof window.mesahaV303.filtered === "function"
              ? window.mesahaV303.filtered() || []
              : [];
          } catch (e) {
            return [];
          }
        }
        function removedList() {
          try {
            return (JSON.parse(localStorage.getItem(REMOVED_KEY) || "[]") || [])
              .map(clean)
              .filter(Boolean);
          } catch (e) {
            return [];
          }
        }
        function unmarkRemoved(name) {
          name = clean(name);
          if (!name) return;
          try {
            localStorage.setItem(
              REMOVED_KEY,
              JSON.stringify(
                removedList().filter(function (x) {
                  return x !== name;
                }),
              ),
            );
          } catch (e) {}
          var st = settings();
          if (st && Array.isArray(st.removedCuttersV407))
            st.removedCuttersV407 = st.removedCuttersV407.filter(function (x) {
              return clean(x) !== name;
            });
        }
        function cutterNames() {
          var st = settings();
          var removed = removedList();
          var list = [];
          function add(x) {
            x = clean(x);
            if (x && removed.indexOf(x) < 0 && list.indexOf(x) < 0)
              list.push(x);
          }
          (st.cutters || []).forEach(add);
          add(st.activeCutter);
          records().forEach(function (r) {
            add(r && r.cutter);
          });
          if (st && state()) {
            st.cutters = list.slice();
            if (st.activeCutter && list.indexOf(clean(st.activeCutter)) < 0)
              st.activeCutter = "";
          }
          return list;
        }
        function ensureUi() {
          var actions = $("selectedInfo") && $("selectedInfo").parentElement;
          if (!actions || $("bulkCutterTransferWrapV406")) return;
          var selectBtn = $("selectFilteredBtn");
          if (selectBtn) {
            selectBtn.textContent = "Tümünü Seç";
            selectBtn.title =
              "Aktif ağaç, kesimci ve arama filtresindeki kayıtları seçer.";
          }
          var wrap = document.createElement("div");
          wrap.id = "bulkCutterTransferWrapV406";
          wrap.className = "bulk-cutter-transfer-v406";
          wrap.innerHTML =
            '<select id="bulkCutterSelectV406" aria-label="Kesimci seç"></select><button class="btn primary" id="bulkCutterTransferBtnV406" type="button">Kesimciye Aktar</button><small id="bulkCutterTransferHintV406">Seçili kayıtları istediğin kesimciye aktarır.</small>';
          actions.parentNode.insertBefore(wrap, actions.nextSibling);
          populateCutterSelect();
          updateHint();
        }
        function populateCutterSelect() {
          var sel = $("bulkCutterSelectV406");
          if (!sel) return;
          var current = sel.value;
          var names = cutterNames();
          var html =
            '<option value="">Kesimci seçilmedi</option>' +
            names
              .map(function (n) {
                return '<option value="' + esc(n) + '">' + esc(n) + "</option>";
              })
              .join("") +
            '<option value="__new__">+ Yeni kesimci yaz</option>';
          if (sel.innerHTML !== html) sel.innerHTML = html;
          if (
            current &&
            Array.prototype.some.call(sel.options, function (o) {
              return o.value === current;
            })
          )
            sel.value = current;
        }
        function updateHint() {
          var hint = $("bulkCutterTransferHintV406");
          if (!hint) return;
          var selCount = selected().length;
          var fCount = filtered().length;
          hint.textContent = selCount
            ? selCount + " seçili kayıt aktarılacak."
            : "Önce Tümünü Seç veya kayıt kutularından seçim yap. Filtrede " +
              fCount +
              " kayıt var.";
        }
        function filterLabel() {
          var st = settings();
          var parts = [];
          if (st.treeFilter && st.treeFilter !== "Tümü")
            parts.push("Ağaç: " + st.treeFilter);
          if (st.cutterFilter && st.cutterFilter !== "Tümü")
            parts.push("Kesimci: " + st.cutterFilter);
          var q = $("recordSearch") ? clean($("recordSearch").value) : "";
          if (q) parts.push("Arama: " + q);
          return parts.length ? parts.join(" / ") : "Tüm kayıtlar";
        }
        async function transferSelected() {
          var list = selected();
          if (!list.length) {
            toast(
              "Aktarılacak seçili kayıt yok. Önce Tümünü Seç veya kayıtları işaretle.",
            );
            return;
          }
          var sel = $("bulkCutterSelectV406");
          var target = sel ? sel.value : "";
          var st = settings();
          if (target === "__new__") {
            target = clean(prompt("Aktarılacak kesimci ismini yazınız:"));
            if (!target) return;
            unmarkRemoved(target);
            if (
              st &&
              Array.isArray(st.cutters) &&
              st.cutters.indexOf(target) < 0
            )
              st.cutters.push(target);
            if (sel) sel.value = target;
          }
          var text = target ? target : "Kesimci seçilmedi";
          if (
            !confirm(
              list.length +
                ' seçili kayıt "' +
                text +
                '" kesimcisine aktarılsın mı?',
            )
          )
            return;
          var beforeRecords = JSON.parse(JSON.stringify(records()));
          var beforeSettings = JSON.parse(JSON.stringify(st));
          var ids = {};
          list.forEach(function (r) {
            if (r && r.id) ids[r.id] = true;
          });
          var changed = 0,
            now = new Date().toISOString();
          records().forEach(function (r) {
            if (r && ids[r.id]) {
              r.cutter = target || "";
              r.updatedAt = now;
              changed++;
            }
          });
          if (target) {
            if (!Array.isArray(st.cutters)) st.cutters = [];
            unmarkRemoved(target);
            if (st.cutters.indexOf(target) < 0) st.cutters.push(target);
          }
          var result = await saveAll("bulk-cutter-transfer");
          if (result && result.ok === false) {
            var app = state();
            if (app) {
              app.records = beforeRecords;
              app.settings = beforeSettings;
            }
            toast("Kesimci aktarımı kaydedilemedi.");
            renderAll();
            return;
          }
          try {
            var clear = $("clearSelectionBtn");
            if (clear) clear.click();
          } catch (e) {}
          toast(changed + " kayıt kesimciye aktarıldı.");
          renderAll();
        }
        function bind() {
          ensureUi();
          populateCutterSelect();
          document.addEventListener(
            "click",
            function (ev) {
              var t =
                ev.target &&
                ev.target.closest &&
                ev.target.closest(
                  "#selectFilteredBtn,#bulkCutterTransferBtnV406",
                );
              if (!t) return;
              if (t.id === "selectFilteredBtn") {
                // Eski seçimleri temizle; ardından mevcut v303 listener yalnızca aktif filtredeki kayıtları seçecek.
                try {
                  var clear = $("clearSelectionBtn");
                  if (clear) clear.click();
                } catch (e) {}
                setTimeout(updateHint, 180);
                return;
              }
              if (t.id === "bulkCutterTransferBtnV406") {
                ev.preventDefault();
                ev.stopPropagation();
                if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
                transferSelected();
              }
            },
            true,
          );
          document.addEventListener(
            "change",
            function (ev) {
              if (ev.target && ev.target.id === "bulkCutterSelectV406") return;
              setTimeout(function () {
                populateCutterSelect();
                updateHint();
              }, 120);
            },
            true,
          );
          document.addEventListener(
            "input",
            function (ev) {
              if (ev.target && ev.target.id === "recordSearch")
                setTimeout(updateHint, 120);
            },
            true,
          );
          ["mesaha:records-saved", "mesaha:settings-saved"].forEach(
            function (evt) {
              window.addEventListener(
                evt,
                function () {
                  if (!recordsActive()) return;
                  setTimeout(function () {
                    populateCutterSelect();
                    updateHint();
                  }, 150);
                },
                { passive: true },
              );
            },
          );
          window.addEventListener(
            "mesaha:view-changed",
            function (ev) {
              if (!(ev && ev.detail && ev.detail.view === "records")) return;
              setTimeout(function () {
                ensureUi();
                populateCutterSelect();
                updateHint();
              }, 80);
            },
            { passive: true },
          );
        }
        function boot() {
          bind();
          [160, 800].forEach(function (ms) {
            setTimeout(function () {
              if (recordsActive()) {
                ensureUi();
                populateCutterSelect();
                updateHint();
              }
            }, ms);
          });
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        try {
          window.MesahaBulkCutterTransferV406 = {
            render: ensureUi,
            transfer: transferSelected,
            populate: populateCutterSelect,
          };
        } catch (e) {}
      })();
;

/* source: mesaha-inline-v407-cutter-guard */
(function () {
        "use strict";
        if (window.__mesahaV407CutterGuard) return;
        window.__mesahaV407CutterGuard = true;
        var REMOVED_KEY = "mesaha_removed_cutters_v407";
        var MEM_KEY = "mesaha_entry_memory_v373";
        var SETTINGS_KEY = "cam_mesaha_ayarlar_v1";
        var DISPLAY = "Mesaha İO";
        var NOTES = [];
        function $(id) {
          return document.getElementById(id);
        }
        function esc(v) {
          return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return {
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#039;",
            }[c];
          });
        }
        function clean(v) {
          return String(v == null ? "" : v)
            .trim()
            .replace(/\s+/g, " ");
        }
        function readJson(k, f) {
          try {
            return JSON.parse(localStorage.getItem(k) || "") || f;
          } catch (e) {
            return f;
          }
        }
        function writeJson(k, v) {
          try {
            localStorage.setItem(k, JSON.stringify(v));
          } catch (e) {}
        }
        function state() {
          try {
            return window.state || null;
          } catch (e) {
            return null;
          }
        }
        function settings() {
          var s = state();
          if (s && s.settings) return s.settings;
          return readJson(SETTINGS_KEY, {}) || {};
        }
        function records() {
          var s = state();
          if (s && Array.isArray(s.records)) return s.records;
          return readJson("cam_mesaha_kayitlari_v1", []) || [];
        }
        function unique(arr) {
          var out = [];
          (arr || []).forEach(function (x) {
            x = clean(x);
            if (x && out.indexOf(x) < 0) out.push(x);
          });
          return out;
        }
        function removed() {
          var st = settings();
          return unique(
            [].concat(
              readJson(REMOVED_KEY, []) || [],
              Array.isArray(st.removedCuttersV407) ? st.removedCuttersV407 : [],
            ),
          );
        }
        function activeRecordCutters() {
          return unique(
            records().map(function (r) {
              return r && r.cutter;
            }),
          );
        }
        function saveSettingsNow(st) {
          try {
            if (window.state && window.state.settings)
              Object.assign(window.state.settings, st || {});
            if (window.MesahaStorageV527)
              return window.MesahaStorageV527.saveSettings(settings(), {
                reason: "cutter-guard",
              });
            if (window.__flushSettings)
              return window.__flushSettings("cutter-guard");
            if (window.saveSettings) return window.saveSettings();
          } catch (e) {}
        }
        var cleaning = false,
          lastRecordCount = -1;
        function same(a, b) {
          try {
            return JSON.stringify(a) === JSON.stringify(b);
          } catch (e) {
            return false;
          }
        }
        function cleanDeletedCutters() {
          if (cleaning) return;
          var st = settings();
          if (!st) return;
          var rem = removed();
          if (!rem.length) return;
          cleaning = true;
          try {
            var active = activeRecordCutters(),
              before = {
                removedCuttersV407: Array.isArray(st.removedCuttersV407)
                  ? st.removedCuttersV407.slice()
                  : [],
                cutters: Array.isArray(st.cutters) ? st.cutters.slice() : [],
                activeCutter: st.activeCutter || "",
                cutterFilter: st.cutterFilter || "",
              };
            st.removedCuttersV407 = rem;
            if (Array.isArray(st.cutters))
              st.cutters = unique(st.cutters).filter(function (c) {
                return rem.indexOf(c) < 0 || active.indexOf(c) > -1;
              });
            if (
              st.activeCutter &&
              rem.indexOf(clean(st.activeCutter)) > -1 &&
              active.indexOf(clean(st.activeCutter)) < 0
            )
              st.activeCutter = "";
            if (
              st.cutterFilter &&
              st.cutterFilter !== "Tümü" &&
              rem.indexOf(clean(st.cutterFilter)) > -1 &&
              active.indexOf(clean(st.cutterFilter)) < 0
            )
              st.cutterFilter = "Tümü";
            var after = {
              removedCuttersV407: st.removedCuttersV407 || [],
              cutters: st.cutters || [],
              activeCutter: st.activeCutter || "",
              cutterFilter: st.cutterFilter || "",
            };
            try {
              var mem = readJson(MEM_KEY, {}),
                memBefore = JSON.stringify(mem || {});
              if (mem.activeCutter && rem.indexOf(clean(mem.activeCutter)) > -1)
                mem.activeCutter = "";
              if (Array.isArray(mem.cutters))
                mem.cutters = unique(mem.cutters).filter(function (c) {
                  return rem.indexOf(c) < 0 || active.indexOf(c) > -1;
                });
              if (JSON.stringify(mem || {}) !== memBefore)
                writeJson(MEM_KEY, mem);
            } catch (e) {}
            if (!same(before, after)) saveSettingsNow(st);
            lastRecordCount = records().length;
          } finally {
            cleaning = false;
          }
        }
        function renderNotes() {
          var box = $("panelUpdateNotesV392");
          if (box && box.parentNode) box.parentNode.removeChild(box);
        }
        function versionSync() {
          try {
            if (window.MESAHA_VERSION) {
              /* central version locked */
            }
          } catch (e) {}
        }
        function boot() {
          versionSync();
          cleanDeletedCutters();
          renderNotes();
          setTimeout(function () {
            versionSync();
            cleanDeletedCutters();
            renderNotes();
          }, 700);
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        window.addEventListener(
          "mesaha:records-saved",
          function (ev) {
            var d = (ev && ev.detail) || {};
            if (!removed().length) return;
            if (d.delta && records().length === lastRecordCount) return;
            setTimeout(cleanDeletedCutters, 140);
          },
          { passive: true },
        );
        window.addEventListener(
          "mesaha:settings-saved",
          function () {
            if (!cleaning && removed().length)
              setTimeout(cleanDeletedCutters, 180);
          },
          { passive: true },
        );
        if (window.MesahaUiHub)
          window.MesahaUiHub.watchClass("userPanelOverlayV316", function () {
            setTimeout(renderNotes, 60);
          });
        window.addEventListener(
          "pageshow",
          function () {
            if (removed().length) setTimeout(cleanDeletedCutters, 180);
          },
          { passive: true },
        );
      })();
;

/* source: mesaha-v411-firebase-resilience-guard */
(function () {
        "use strict";
        if (window.__mesahaSupabaseResilienceV411) return;
        window.__mesahaSupabaseResilienceV411 = true;
        function $(id) {
          return document.getElementById(id);
        }
        function setSyncText(t) {
          var el = $("panelSyncTextV316");
          if (el) el.textContent = t;
        }
        function niceError(e) {
          var m = String(e && e.message ? e.message : e || "Supabase hatası");
          if (/permission|insufficient/i.test(m))
            return "Supabase RLS/policy kontrol et";
          if (/timeout|zaman/i.test(m)) return "Supabase bağlantı zaman aşımı";
          if (/sdk|yüklenemedi/i.test(m))
            return "Supabase bağlantı motoru yüklenemedi";
          return m.slice(0, 150);
        }
        async function check(silent) {
          if (window.MESAHA_SUITE_MODE) {
            if (!silent)
              setSyncText("Senkronizasyon Orman İO tarafından yönetilir");
            return navigator.onLine;
          }
          var api =
            window.mesahaSupabaseV380 ||
            window.mesahaSupabaseV383 ||
            window.mesahaSupabase;
          if (!api || typeof api.ready !== "function") {
            if (!silent) setSyncText("Supabase motoru yüklenemedi");
            return false;
          }
          try {
            if (api.reset) api.reset();
            var r = api.health ? await api.health() : await api.ready();
            if (r && r.db) {
              if (!silent)
                setSyncText(
                  "Supabase bağlantısı hazır • " +
                    new Date().toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                );
              return true;
            }
          } catch (e) {
            if (!silent)
              setSyncText("Supabase bağlantısı yok: " + niceError(e));
            return false;
          }
          return false;
        }
        window.mesahaSupabaseCheckV411 = check;
        window.addEventListener("online", function () {
          setTimeout(function () {
            check(true);
          }, 800);
        });
        document.addEventListener(
          "click",
          function (ev) {
            var t =
              ev.target &&
              ev.target.closest &&
              ev.target.closest(
                "#panelSyncV316,#cloudBackupBtnV316,#cloudRestoreBtnV316",
              );
            if (t)
              setTimeout(function () {
                check(true);
              }, 2500);
          },
          true,
        );
      })();
;

/* source: mesaha-v416-boy-input-focus-guard */
(function () {
        "use strict";
        if (window.__mesahaBoyInputFocusGuardV416) return;
        window.__mesahaBoyInputFocusGuardV416 = true;
        var toastLockUntil = 0;
        function $(id) {
          return document.getElementById(id);
        }
        function clean(v) {
          return String(v == null ? "" : v)
            .trim()
            .replace(",", ".");
        }
        function toastOnce(msg) {
          var n = Date.now();
          if (n < toastLockUntil) return;
          toastLockUntil = n + 800;
          try {
            if (typeof window.toast === "function") window.toast(msg);
          } catch (e) {}
        }
        function stableFocus(el) {
          if (!el) return;
          try {
            el.focus({ preventScroll: true });
            var n = String(el.value || "").length;
            try {
              el.setSelectionRange(n, n);
            } catch (e) {}
          } catch (e) {}
        }
        function validateBoyOnly() {
          var l = $("lengthInput");
          if (!l) return true;
          var raw = clean(l.value),
            n = Number(raw),
            invalid = false,
            msg = "";
          if (raw && (!Number.isFinite(n) || n <= 0)) {
            invalid = true;
            msg = "Boy 0’dan büyük olmalı.";
          } else if (n > 50) {
            invalid = true;
            msg = "Boy 50 üzerinde olamaz.";
          }
          l.classList.toggle("mesaha-invalid-boy-v416", invalid);
          if (invalid) {
            toastOnce(msg);
            stableFocus(l);
            return false;
          }
          return true;
        }
        function syncVersion() {
          try {
            if (window.MesahaVersion)
              window.MesahaVersion.applyToDocument(document);
          } catch (e) {}
        }
        function bind() {
          syncVersion();
          var l = $("lengthInput");
          if (l && !l.__v527BoyGuard) {
            l.__v527BoyGuard = true;
            l.addEventListener("input", validateBoyOnly, { passive: true });
            l.addEventListener(
              "blur",
              function () {
                setTimeout(validateBoyOnly, 40);
              },
              { passive: true },
            );
          }
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", bind, { once: true });
        else bind();
        window.MesahaBoyInputFocusGuardV416 = {
          validate: validateBoyOnly,
          sync: syncVersion,
          saveCaptureDisabledBy: "V5.27",
        };
      })();
;

/* source: mesaha-v429-telegram-support-script */
(function () {
        "use strict";
        var LINK = "https://telegram.me/+LpsvthN4BM5kYWI0";
        var MV = window.MESAHA_VERSION || {},
          APP = MV.app || "Mesaha İO",
          DISPLAY = MV.visibleVersion || "Mesaha İO",
          BUILD = Number(MV.build || 0) || 0,
          VERSION = MV.version || "local",
          CACHE = MV.cacheName || "mesaha-app-local";
        function todayKey() {
          var d = new Date();
          return (
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(d.getDate()).padStart(2, "0")
          );
        }
        function storageKey() {
          var u = "guest";
          try {
            var st = window.state || {};
            u =
              st.userKey ||
              st.userId ||
              st.userName ||
              localStorage.getItem("mesaha_user_key") ||
              localStorage.getItem("mesahaUserKey") ||
              "guest";
          } catch (e) {}
          return (
            "mesaha.telegram.support.shown." +
            String(u)
              .toLowerCase()
              .replace(/[^a-z0-9_\-ğüşöçıİĞÜŞÖÇ]/gi, "_") +
            "." +
            todayKey()
          );
        }
        function syncVersion() {
          try {
            window.MESAHA_VERSION = Object.assign(
              {},
              window.MESAHA_VERSION || {},
              {
                app: APP,
                version: VERSION,
                build: BUILD,
                visibleVersion: DISPLAY,
                shortVersion: DISPLAY,
                name: "Mesaha İO " + DISPLAY,
                cacheName: CACHE,
                assetVersion: String(
                  (window.MESAHA_VERSION &&
                    window.MESAHA_VERSION.assetVersion) ||
                    "",
                ),
              },
            );
          } catch (e) {}
          try {
            window.APP_VERSION = APP;
          } catch (e) {}
          try {
            var vt = document.getElementById("versionText");
            if (vt) vt.textContent = DISPLAY;
          } catch (e) {}
          try {
            if (document.title) document.title = "Mesaha İO " + DISPLAY;
          } catch (e) {}
          try {
            var apple = document.querySelector(
              'meta[name="apple-mobile-web-app-title"]',
            );
            if (apple) apple.setAttribute("content", APP);
          } catch (e) {}
          try {
            var chip = document.querySelector(".version-chip-v407");
            if (chip) chip.textContent = APP;
          } catch (e) {}
        }
        function markShown() {
          try {
            localStorage.setItem(storageKey(), "1");
          } catch (e) {}
        }
        function alreadyShown() {
          try {
            return localStorage.getItem(storageKey()) === "1";
          } catch (e) {
            return false;
          }
        }
        function closeModal() {
          var m = document.getElementById("telegramSupportModalV429");
          if (m) m.classList.add("hidden");
          markShown();
        }
        function ensureModal() {
          var old = document.getElementById("telegramSupportModalV429");
          if (old) return old;
          var wrap = document.createElement("div");
          wrap.id = "telegramSupportModalV429";
          wrap.className = "telegram-support-modal-v429 hidden";
          wrap.setAttribute("role", "dialog");
          wrap.setAttribute("aria-modal", "true");
          wrap.innerHTML =
            '<div class="telegram-support-card-v429"><div class="telegram-icon-v429">✈</div><h2>Telegram Destek Grubu</h2><p>Mesaha İO destek, güncelleme ve kullanım yardımı için Telegram grubuna katılabilirsiniz.</p><div class="telegram-link-box-v429">' +
            LINK +
            '</div><div class="telegram-actions-v429"><a id="telegramJoinBtnV429" class="telegram-join-v429" href="' +
            LINK +
            '" target="_blank" rel="noopener">Telegram Grubuna Katıl</a><button id="telegramOkBtnV429" class="telegram-ok-v429" type="button">Tamam, kapat</button></div><p class="telegram-note-v429">Bu pencere her cihazda günde bir kez ilk açılışta gösterilir.</p></div>';
          document.body.appendChild(wrap);
          var ok = document.getElementById("telegramOkBtnV429");
          if (ok) ok.addEventListener("click", closeModal);
          var join = document.getElementById("telegramJoinBtnV429");
          if (join)
            join.addEventListener("click", function () {
              markShown();
              setTimeout(closeModal, 250);
            });
          wrap.addEventListener("click", function (e) {
            if (e.target === wrap) closeModal();
          });
          document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && !wrap.classList.contains("hidden"))
              closeModal();
          });
          return wrap;
        }
        function showDaily() {
          if (alreadyShown()) return;
          var m = ensureModal();
          m.classList.remove("hidden");
          try {
            var btn = document.getElementById("telegramJoinBtnV429");
            if (btn) btn.focus({ preventScroll: true });
          } catch (e) {}
        }
        function insertGuideLink() {
          var guide = document.querySelector("#guideView .guide-card");
          if (!guide || document.getElementById("telegramGuideBoxV429")) return;
          var head = guide.querySelector(".section-head");
          var box = document.createElement("div");
          box.id = "telegramGuideBoxV429";
          box.className = "telegram-guide-box-v429 guide-section-guide-clean";
          box.innerHTML =
            '<h3>Telegram Destek Grubu</h3><p>Destek, güncelleme ve kullanım yardımı için Telegram grubuna katılabilirsiniz.</p><a href="' +
            LINK +
            '" target="_blank" rel="noopener">Telegram Destek Grubuna Katıl</a>';
          if (head && head.nextSibling)
            guide.insertBefore(box, head.nextSibling);
          else guide.insertBefore(box, guide.firstChild);
        }
        function boot() {
          syncVersion();
          ensureModal();
          insertGuideLink();
          setTimeout(showDaily, 700);
          [1200, 2500, 5000, 9000, 15000, 24000].forEach(function (ms) {
            setTimeout(function () {
              syncVersion();
              insertGuideLink();
            }, ms);
          });
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        window.MesahaTelegramSupportV429 = {
          show: function () {
            try {
              localStorage.removeItem(storageKey());
            } catch (e) {}
            showDaily();
          },
          link: LINK,
        };
      })();
;

/* source: mesaha-v442-stabil-cekirdek-guard */
(function () {
        "use strict";
        if (window.__mesahaV543LegacyModalGuard) return;
        window.__mesahaV543LegacyModalGuard = true;
        function run() {
          [
            "mesahaBarcodeCheckV424",
            "mesahaBarcodeCheckV436",
            "mesahaBarcodeMiniV437",
            "mesahaBarcodeMiniV439",
          ].forEach(function (id) {
            var e = document.getElementById(id);
            if (e) {
              e.classList.add("hidden");
              e.style.display = "none";
            }
          });
          try {
            if (window.MesahaVersion)
              window.MesahaVersion.applyToDocument(document);
          } catch (e) {}
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", run, { once: true });
        else run();
      })();
;

/* source: mesaha-v442-responsive-entry-layout-guard */
(function () {
        "use strict";
        if (window.__mesahaV442ResponsiveEntryLayout) return;
        window.__mesahaV442ResponsiveEntryLayout = true;
        function sync() {
          try {
            var mg = document.querySelector("#entryView .measure-grid");
            if (mg) {
              mg.style.gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr)";
              mg.style.gap = "clamp(6px, 2vw, 10px)";
            }
            document
              .querySelectorAll(
                "#entryView #lengthChips,#entryView #diameterChips",
              )
              .forEach(function (el) {
                el.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
              });
          } catch (e) {}
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", sync, { once: true });
        else sync();
        window.addEventListener("resize", sync, { passive: true });
        window.addEventListener(
          "mesaha:view-changed",
          function (ev) {
            if (ev && ev.detail && ev.detail.view === "entry")
              setTimeout(sync, 40);
          },
          { passive: true },
        );
        setTimeout(sync, 500);
        setTimeout(sync, 1600);
      })();
;

/* source: mesaha-v445-cache-asset-cleanup-guard */
(function () {
        "use strict";
        if (window.__mesahaV543AccessibilityGuard) return;
        window.__mesahaV543AccessibilityGuard = true;
        function run() {
          var p = document.getElementById("productButtons");
          if (p)
            p.querySelectorAll("[data-product]").forEach(function (b) {
              b.setAttribute(
                "aria-pressed",
                b.classList.contains("active") ? "true" : "false",
              );
              if (!b.title) b.title = (b.textContent || "").trim();
            });
        }
        document.addEventListener(
          "click",
          function (ev) {
            var row =
              ev.target &&
              ev.target.closest &&
              ev.target.closest("[data-recent-row]");
            if (!row || ev.target.closest("[data-recent-delete],[data-edit]"))
              return;
            var b = row.querySelector("[data-edit]");
            if (b) b.click();
          },
          false,
        );
        function entryActive() {
          var v = document.getElementById("entryView");
          return !!(v && v.classList.contains("active"));
        }
        window.addEventListener(
          "mesaha:records-saved",
          function () {
            if (entryActive()) setTimeout(run, 40);
          },
          { passive: true },
        );
        window.addEventListener(
          "mesaha:settings-saved",
          function () {
            if (entryActive()) setTimeout(run, 40);
          },
          { passive: true },
        );
        window.addEventListener(
          "mesaha:view-changed",
          function (ev) {
            if (ev && ev.detail && ev.detail.view === "entry")
              setTimeout(run, 30);
          },
          { passive: true },
        );
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", run, { once: true });
        else run();
      })();
;
