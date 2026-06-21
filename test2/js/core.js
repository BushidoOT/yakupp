/* script block 1  */

    const STORAGE_KEY = "cam_mesaha_kayitlari_v1";
    const SETTINGS_KEY = "cam_mesaha_ayarlar_v1";
    const USER_STORE_KEY = "mesaha_kullanicilar_v1";
    const ADMIN_CODE = "4767";
    const ONLINE_USER_API_URL = "https://script.google.com/macros/s/AKfycbzv8rw3n4FuwDmiFnW3ttKuoK0mUQnzEYizjaD46z0uuFiKtqLl1zkupkB9AkOehC7ECg/exec";

    const FIREBASE_CONFIG = {
      "apiKey": "AIzaSyCKveylTPgKmWEMmYf-aFj6yLXB5CKAiJ0",
      "authDomain": "mesaha-io.firebaseapp.com",
      "projectId": "mesaha-io",
      "storageBucket": "mesaha-io.firebasestorage.app",
      "messagingSenderId": "840655878243",
      "appId": "1:840655878243:web:add76f52bbf55ad9dd6056",
      "measurementId": "G-81JPD5ZY44"
};
    const FIREBASE_ENABLED = true;
    const FIREBASE_SDK_VERSION = "9.23.0";
    const FIREBASE_USERS_COLLECTION = "users";
    const FIREBASE_BACKUPS_COLLECTION = "backups";
    const FIREBASE_REPORTS_COLLECTION = "supportTickets";
    const FIREBASE_USAGE_COLLECTION = "usageStats";

    const DEVICE_ID_KEY = "mesaha_cihaz_kodu_v1";

    const HEADERS = [
      "agacId","agacAdi","odunId","odunAdi","kaliteSinifi","boySinifi",
      "adet","cap","boy","hacim","uretimTarihi","barkodNo"
    ];

    const PRODUCT_MAP = {
      "Tomruk": { odunId: 1, odunAdi: "Tomruk", shortName: "Tomruk" },
      "Tel Direk": { odunId: 2, odunAdi: "Tel Direği", shortName: "Tel" },
      "Maden Direk": { odunId: 3, odunAdi: "Maden Direği", shortName: "Maden" },
      "Sanayi Odunu": { odunId: 4, odunAdi: "Sanayi Odunu", shortName: "Sanayi" },
      "Kağıtlık": { odunId: 5, odunAdi: "Kağıtlık Odun", shortName: "Kağıtlık" }
    };

    const PRODUCT_ORDER = ["Tomruk", "Maden Direk", "Kağıtlık", "Sanayi Odunu", "Tel Direk"];

    const TREE_MAP = {
      "Karaçam": { agacId: 1, agacAdi: "Karaçam" },
      "Sarıçam": { agacId: 2, agacAdi: "Sarıçam" },
      "Sedir": { agacId: 5, agacAdi: "Sedir" },
      "Göknar": { agacId: 6, agacAdi: "Göknar" },
      "Kızılçam": { agacId: 26, agacAdi: "Kızılçam" }
    };


    const state = {
      records: [],
      sameBarcodeMode: false,
      editingId: null,
      editingReturnBarcode: "",
      userStore: { activeUserId: "", users: [] },
      activeUser: null,
      cloudBackupBusy: false,
      selectedRecordIds: new Set(),
      adminOnlineUsers: [],
      adminBackups: [],
      adminNotes: {},
      adminDisabledUsers: {},
      adminQuickFilter: "all",
      lastAdminCode: "",
      settings: {
        lastBarcode: "A102682",
        lastProductType: "Tomruk",
        lastTreeType: "Karaçam",
        lastQualityClass: "2",
        lastLength: "3",
        lastDiameter: "22",
        lastQuantity: "1",
        productionDate: "",
        recentLengths: ["3"],
        recentDiameters: ["22"],
        visibleProducts: ["Tomruk", "Maden Direk", "Kağıtlık", "Sanayi Odunu", "Tel Direk"],
        bolmeNo: "",
        seflik: "",
        ekipNot: "",
        lastBackupReminderCount: 0,
        soundEnabled: true
      }
    };

    const $ = (id) => document.getElementById(id);

    const els = {
      form: $("entryForm"),
      submitBtn: $("submitBtn"),
      barcode: $("barcode"),
      duplicateWarning: $("duplicateWarning"),
      bolmeNo: $("bolmeNo"),
      seflik: $("seflik"),
      ekipNot: $("ekipNot"),
      productionDate: $("productionDate"),
      productType: $("productType"),
      treeType: $("treeType"),
      treeTypeSelectBtn: $("treeTypeSelectBtn"),
      treeTypePanel: $("treeTypePanel"),
      treeTypeApplyBtn: $("treeTypeApplyBtn"),
      treeTypeCurrent: $("treeTypeCurrent"),
      speciesPill: $("speciesPill"),
      qualityClass: $("qualityClass"),
      productBoxes: $("productBoxes"),
      woodTypeSelectBtn: $("woodTypeSelectBtn"),
      woodTypePanel: $("woodTypePanel"),
      woodTypeApplyBtn: $("woodTypeApplyBtn"),
      classBoxes: $("classBoxes"),
      length: $("length"),
      diameter: $("diameter"),
      quantity: $("quantity"),
      liveDesi: $("liveDesi"),
      liveHacim: $("liveHacim"),
      recentBarcodeList: $("recentBarcodeList"),
      recordsBody: $("recordsBody"),
      recordsFoot: $("recordsFoot"),
      emptyState: $("emptyState"),
      recordCount: $("recordCount"),
      dailyRecordCount: $("dailyRecordCount"),
      dailyAdetCount: $("dailyAdetCount"),
      dailyM3Count: $("dailyM3Count"),
      dailyLastBarcode: $("dailyLastBarcode"),
      totalDesi: $("totalDesi"),
      totalAdet: $("totalAdet"),
      totalTomruk: $("totalTomruk"),
      totalTomrukAdet: $("totalTomrukAdet"),
      totalMaden: $("totalMaden"),
      totalMadenAdet: $("totalMadenAdet"),
      totalKagit: $("totalKagit"),
      totalKagitAdet: $("totalKagitAdet"),
      totalSanayi: $("totalSanayi"),
      totalSanayiAdet: $("totalSanayiAdet"),
      totalTel: $("totalTel"),
      totalTelAdet: $("totalTelAdet"),
      searchInput: $("searchInput"),
      bulkActions: $("bulkActions"),
      selectedRecordCount: $("selectedRecordCount"),
      selectFilteredBtn: $("selectFilteredBtn"),
      clearSelectionBtn: $("clearSelectionBtn"),
      bulkDeleteBtn: $("bulkDeleteBtn"),
      selectAllRecords: $("selectAllRecords"),
      adminUserSearch: $("adminUserSearch"),
      toast: $("toast"),
      sameBarcodeBtn: $("sameBarcodeBtn"),
      clearInputsBtn: $("clearInputsBtn"),
      soundToggleBtn: $("soundToggleBtn"),
      cancelEditBtn: $("cancelEditBtn"),
      exportSystemXlsBtn: $("exportSystemXlsBtn"),
      backupBtn: $("backupBtn"),
      restoreBtn: $("restoreBtn"),
      restoreInput: $("restoreInput"),
      printBtn: $("printBtn"),
      usageCard: $("usageCard"),
      deleteAllBtn: $("deleteAllBtn"),
      undoBanner: $("undoBanner"),
      undoMessage: $("undoMessage"),
      undoBtn: $("undoBtn"),
      productRuleHint: $("productRuleHint"),
      navEntry: $("navEntry"),
      navRecords: $("navRecords"),
      navGuide: $("navGuide"),
      navAdmin: $("navAdmin"),
      userMenuForceUpdateBtn: $("userMenuForceUpdateBtn"),
      panelReportIssueBtn: $("panelReportIssueBtn"),
      panelAdminOpenBtn: $("panelAdminOpenBtn"),
      issueReportOverlay: $("issueReportOverlay"),
      issueReportCloseBtn: $("issueReportCloseBtn"),
      issueReportCancelBtn: $("issueReportCancelBtn"),
      issueReportSendBtn: $("issueReportSendBtn"),
      issueReportMessage: $("issueReportMessage"),
      issueReportUserInfo: $("issueReportUserInfo"),
      issueDeviceInfo: $("issueDeviceInfo"),
      issueMyReportsList: $("issueMyReportsList"),
      adminReportsView: $("adminReportsView"),
      adminReportsList: $("adminReportsList"),
      guideForceUpdateBtn: $("guideForceUpdateBtn"),
      adminRefreshBtn: $("adminRefreshBtn"),
      adminSyncInfo: $("adminSyncInfo"),
      adminTotalUsers: $("adminTotalUsers"),
      adminTodayUsers: $("adminTodayUsers"),
      adminWeekUsers: $("adminWeekUsers"),
      adminTotalBackups: $("adminTotalBackups"),
      adminTodayBackups: $("adminTodayBackups"),
      adminLastBackup: $("adminLastBackup"),
      adminSeflikFilter: $("adminSeflikFilter"),
      adminControlCenter: $("adminControlCenter"),
      adminActivityList: $("adminActivityList"),
      adminNotesList: $("adminNotesList"),
      adminDashboardView: $("adminDashboardView"),
      adminUsersView: $("adminUsersView"),
      adminActivityView: $("adminActivityView"),
      adminNotesView: $("adminNotesView"),
      lengthChips: $("lengthChips"),
      diameterChips: $("diameterChips"),
      userLoginOverlay: $("userLoginOverlay"),
      loginUserName: $("loginUserName"),
      loginSeflik: $("loginSeflik"),
      loginSaveBtn: $("loginSaveBtn"),
      loginError: $("loginError"),
      activeUserBadge: $("activeUserBadge"),
      registeredUsersList: $("registeredUsersList"),
      changeUserBtn: $("changeUserBtn"),
      adminUsersBtn: $("adminUsersBtn"),
      adminUsersCloseBtn: $("adminUsersCloseBtn"),
      cloudBackupBtn: $("cloudBackupBtn"),
      userPanelOverlay: $("userPanelOverlay"),
      userPanelInfo: $("userPanelInfo"),
      userPanelCloseBtn: $("userPanelCloseBtn"),
      panelChangeUserBtn: $("panelChangeUserBtn"),
      panelPasswordBtn: $("panelPasswordBtn"),
      panelCloudBackupBtn: $("panelCloudBackupBtn"),
      cloudRestoreBtn: $("cloudRestoreBtn"),
      cloudRestoreOverlay: $("cloudRestoreOverlay"),
      cloudRestoreCloseBtn: $("cloudRestoreCloseBtn"),
      cloudRestoreUserName: $("cloudRestoreUserName"),
      cloudRestoreSeflik: $("cloudRestoreSeflik"),
      cloudRestoreSearchBtn: $("cloudRestoreSearchBtn"),
      cloudBackupList: $("cloudBackupList"),
      cloudLoadingOverlay: $("cloudLoadingOverlay"),
      cloudLoadingText: $("cloudLoadingText"),
      cloudRestoreActiveInfo: $("cloudRestoreActiveInfo"),
      cloudRestoreOtherBtn: $("cloudRestoreOtherBtn"),
      cloudRestoreManualFields: $("cloudRestoreManualFields")
    };

    function todayISO() {
      const d = new Date();
      const pad = n => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    }


    function normalizeRecentValue(value) {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) return "";
      return String(n).replace(",", ".");
    }

    function addRecentValue(listName, value) {
      const normalized = normalizeRecentValue(value);
      if (!normalized) return;
      const current = Array.isArray(state.settings[listName]) ? state.settings[listName] : [];
      state.settings[listName] = [normalized, ...current.filter(v => String(v) !== normalized)].slice(0, 5);
    }

    function renderRecentChips() {
      const lengths = Array.isArray(state.settings.recentLengths) ? state.settings.recentLengths : [];
      const diameters = Array.isArray(state.settings.recentDiameters) ? state.settings.recentDiameters : [];

      els.lengthChips.innerHTML = lengths.length
        ? lengths.map(v => `<span class="chip" data-len="${escapeHtml(v)}">${escapeHtml(v)}</span>`).join("")
        : `<span class="hint">Henüz kayıt yok</span>`;

      els.diameterChips.innerHTML = diameters.length
        ? diameters.map(v => `<span class="chip" data-dia="${escapeHtml(v)}">${escapeHtml(v)}</span>`).join("")
        : `<span class="hint">Henüz kayıt yok</span>`;

      els.lengthChips.querySelectorAll("[data-len]").forEach(chip => {
        chip.addEventListener("pointerdown", (event) => event.preventDefault());
        chip.addEventListener("click", () => {
          els.length.value = chip.dataset.len;
          saveSettings();
          updateLiveDesi();
        });
      });

      els.diameterChips.querySelectorAll("[data-dia]").forEach(chip => {
        chip.addEventListener("pointerdown", (event) => event.preventDefault());
        chip.addEventListener("click", () => {
          els.diameter.value = chip.dataset.dia;
          updateLiveDesi();
          focusDiameterKeepKeyboard();
        });
      });

      updateInputPlaceholders();
    }

    function updateInputPlaceholders() {
      const recentDiameters = Array.isArray(state.settings.recentDiameters) ? state.settings.recentDiameters : [];
      const recentLengths = Array.isArray(state.settings.recentLengths) ? state.settings.recentLengths : [];

      const lastDiameter = String(state.settings.lastDiameter || recentDiameters[0] || "22").trim();
      const lastLength = String(state.settings.lastLength || recentLengths[0] || "3").trim();

      if (els.diameter) els.diameter.placeholder = lastDiameter || "22";
      if (els.length) els.length.placeholder = lastLength || "3";
    }

    function renderRecentBarcodes() {
      if (!els.recentBarcodeList) return;

      const recent = state.records.slice(0, 3);

      if (!recent.length) {
        els.recentBarcodeList.innerHTML = `<span class="hint" style="grid-column:1/-1;text-align:center">Henüz kayıt yok</span>`;
        return;
      }

      els.recentBarcodeList.innerHTML = recent.map((r) => {
        const tree = getTreeInfo(r.treeType || r.species || "Karaçam");
        const product = PRODUCT_MAP[normalizeProductType(r.productType || "Tomruk")] || PRODUCT_MAP["Tomruk"];
        const detail = `${tree.agacAdi} • ${product.shortName || product.odunAdi}`;
        const measure = `${formatShortNumber(r.diameter)} çap / ${formatShortNumber(r.length)} boy`;
        return `
          <button type="button" class="recent-barcode-item recent-${normalizeProductClass(r.productType || "Tomruk")}" data-id="${escapeHtml(r.id)}" title="Düzeltmek için tıkla">
            <b>${escapeHtml(r.barcode)}</b>
            <span>${escapeHtml(detail)}</span>
            <span>${escapeHtml(measure)}</span>
          </button>
        `;
      }).join("");

      els.recentBarcodeList.querySelectorAll("[data-id]").forEach(btn => {
        btn.addEventListener("click", () => editRecord(btn.dataset.id));
      });
    }

    function isoToTRDate(iso) {
      if (!iso) return "";
      const parts = String(iso).split("-");
      if (parts.length !== 3) return iso;
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }

    function trDateToISO(tr) {
      if (!tr) return todayISO();
      const parts = String(tr).split(".");
      if (parts.length !== 3) return todayISO();
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }



    function getOrCreateDeviceId() {
      let id = localStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = `cihaz_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(DEVICE_ID_KEY, id);
      }
      return id;
    }

    function jsonpRequest(url, params = {}, timeoutMs = 9000) {
      return new Promise((resolve, reject) => {
        const callbackName = `mesahaJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement("script");
        const search = new URLSearchParams({
          ...params,
          callback: callbackName,
          _: Date.now()
        });

        let finished = false;
        const cleanup = () => {
          finished = true;
          try { delete window[callbackName]; } catch {}
          if (script.parentNode) script.parentNode.removeChild(script);
        };

        const timer = setTimeout(() => {
          if (finished) return;
          cleanup();
          reject(new Error("Bağlantı zaman aşımı"));
        }, timeoutMs);

        window[callbackName] = (data) => {
          if (finished) return;
          clearTimeout(timer);
          cleanup();
          resolve(data || {});
        };

        script.onerror = () => {
          if (finished) return;
          clearTimeout(timer);
          cleanup();
          reject(new Error("Bağlantı kurulamadı"));
        };

        script.src = `${url}?${search.toString()}`;
        document.head.appendChild(script);
      });
    }

    function logOnlineUser(user) {
      if (!ONLINE_USER_API_URL || !user || !navigator.onLine) return;

      jsonpRequest(ONLINE_USER_API_URL, {
        action: "log",
        name: user.name || "",
        seflik: user.seflik || "",
        deviceId: getOrCreateDeviceId()
      }, 9000).catch(() => {
        // İnternet yoksa mesaha işini bozmasın.
      });
    }

    async function loadOnlineUsers(adminCode) {
      const data = await jsonpRequest(ONLINE_USER_API_URL, {
        action: "list",
        admin: adminCode || ADMIN_CODE
      }, 12000);

      if (!data || data.ok !== true) {
        throw new Error((data && data.error) ? data.error : "Merkez kullanıcı listesi alınamadı");
      }

      return Array.isArray(data.users) ? data.users : [];
    }






    function enhanceToastGlass() {
      const t = els.toast || document.getElementById("toast") || document.querySelector(".toast");
      if (!t) return;

      let bg = "rgba(22, 101, 52, .34)";
      if (t.classList.contains("error-toast")) {
        bg = "rgba(185, 28, 28, .42)";
      } else if (document.body.classList.contains("product-tomruk")) {
        bg = "rgba(202, 138, 4, .40)";
      } else if (document.body.classList.contains("product-maden")) {
        bg = "rgba(37, 99, 235, .36)";
      } else if (document.body.classList.contains("product-kagit")) {
        bg = "rgba(220, 38, 38, .36)";
      } else if (document.body.classList.contains("product-sanayi")) {
        bg = "rgba(22, 163, 74, .34)";
      } else if (document.body.classList.contains("product-tel")) {
        bg = "rgba(126, 34, 206, .36)";
      }

      t.style.background = bg;
      t.style.backgroundColor = bg;
      t.style.backdropFilter = "blur(34px) saturate(210%)";
      t.style.webkitBackdropFilter = "blur(34px) saturate(210%)";
      t.style.border = "1px solid rgba(255,255,255,.42)";
      t.style.boxShadow = "0 18px 42px rgba(15,23,42,.22), inset 0 1px 0 rgba(255,255,255,.22)";
    }



    function getBeyanTotals() {
      const totals = {
        all: 0,
        adet: 0,
        products: {
          "Tomruk": { label: "Tomruk", className: "tomruk", volume: 0, adet: 0 },
          "Maden Direk": { label: "Maden Direği", className: "maden", volume: 0, adet: 0 },
          "Kağıtlık": { label: "Kağıtlık", className: "kagit", volume: 0, adet: 0 },
          "Sanayi Odunu": { label: "Sanayi Odunu", className: "sanayi", volume: 0, adet: 0 },
          "Tel Direk": { label: "Tel Direği", className: "tel", volume: 0, adet: 0 }
        }
      };

      state.records.forEach(r => {
        const qty = Number(r.quantity) || 0;
        const vol = Number(r.desi) || 0;
        const key = normalizeProductType(r.productType || "Tomruk");

        totals.all += vol;
        totals.adet += qty;

        if (totals.products[key]) {
          totals.products[key].volume += vol;
          totals.products[key].adet += qty;
        }
      });

      return totals;
    }

    function buildBeyanPrintHtml() {
      const totals = getBeyanTotals();
      const products = (totals && totals.products) ? totals.products : {};
      const productCards = Object.keys(products).map(key => products[key]).filter(item => item && (item.adet || item.volume)).map(item => `
        <div class="product-card ${item.className || ''}">
          <div class="product-title">${escapeHtml(item.label || key)}</div>
          <div class="product-value">${formatHacimFromDesi(item.volume || 0)} m³</div>
          <div class="product-adet">${Number(item.adet || 0).toLocaleString("tr-TR")} adet</div>
        </div>
      `).join("");

      const now = new Date();
      const pad = n => String(n).padStart(2, "0");
      const dateText = `${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const userText = state.activeUser && state.activeUser.name ? `${state.activeUser.name} • ${state.activeUser.seflik || ""}` : "";
      const treeText = (typeof activeTreeFilter === "function" && typeof treeInfo === "function" && activeTreeFilter() !== "all") ? (treeInfo(activeTreeFilter()).agacAdi || activeTreeFilter()) : "Tüm ağaç türleri";
      const cutterText = (typeof activeCutterFilter === "function" && activeCutterFilter() !== "all") ? activeCutterFilter() : "Tüm kesimciler";
      const totalAdet = Number(totals.adet || 0).toLocaleString("tr-TR");
      const totalM3 = formatHacimFromDesi(totals.all || 0);

      return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Beyan</title>

</head>
<body>
  <h1>BEYAN ÖZETİ</h1>
  <div class="meta"><div>${escapeHtml(userText)}</div><div>${escapeHtml(dateText)}</div></div>
  <div class="filters">Filtre: <span>${escapeHtml(treeText)}</span> • <span>${escapeHtml(cutterText)}</span></div>
  <div class="top-grid">
    <div class="summary-card"><small>Toplam Adet</small><strong>${totalAdet}</strong><div class="unit">adet</div></div>
    <div class="summary-card"><small>Toplam Hacim</small><strong>${totalM3}</strong><div class="unit">m³</div></div>
  </div>
  <div class="products">${productCards || '<div class="empty">Seçili filtrede beyan kaydı yok.</div>'}</div>
</body>
</html>`;
    }

    function printBeyanOnly() {
      const htmlText = buildBeyanPrintHtml();

      const frame = document.createElement("iframe");
      frame.setAttribute("title", "Beyan Yazdır");
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "0";
      frame.style.opacity = "0";
      document.body.appendChild(frame);

      const doc = frame.contentWindow.document;
      doc.open();
      doc.write(htmlText);
      doc.close();

      setTimeout(() => {
        try {
          frame.contentWindow.focus();
          frame.contentWindow.print();
        } catch {
          window.print();
        }

        setTimeout(() => {
          try { frame.remove(); } catch {}
        }, 4000);
      }, 500);
    }


    function markPrintOnlyBeyan() {
      const root = document.querySelector(".records-panel") || document.body;
      const all = Array.from(root.querySelectorAll("*"));
      const hideWords = [
        "Günlük İş Özeti",
        "Bugünkü Kayıt",
        "Bugünkü Adet",
        "Bugünkü m³",
        "Son Barkod",
        "Listedekileri Seç",
        "Seçimi Temizle",
        "Seçilenleri Sil",
        "Toplu işlem için",
        "Kayıtları işaretleyin"
      ];

      all.forEach(el => {
        const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (!txt) return;
        if (hideWords.some(w => txt.includes(w))) {
          el.classList.add("print-hide");
          let p = el.closest(".bulk-actions, .daily-summary, .summary-card, .card, .panel-body > div, .records-table-wrap");
          if (p) p.classList.add("print-hide");
          let pp = p && p.parentElement;
          if (pp && hideWords.some(w => (pp.textContent || "").includes(w))) pp.classList.add("print-hide");
        }
      });
    }

    window.addEventListener("beforeprint", markPrintOnlyBeyan);


    async function quickAppUpdateCheck() {
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            reg.update().catch(() => {});
          }
        }
      } catch {}
    }

    async function forceUpdateApp() {
      const ok = confirm("Yeni sürüm kontrol edilsin mi? Kayıtlar silinmez, sadece uygulama önbelleği yenilenir.");
      if (!ok) return;

      try {
        showToast("Yeni sürüm hazırlanıyor...");

        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(async (reg) => {
            try {
              if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
              await reg.update().catch(() => {});
              await reg.unregister().catch(() => false);
            } catch {}
          }));
        }

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(key => caches.delete(key).catch(() => false)));
        }

        localStorage.setItem("mesaha_last_manual_update", new Date().toISOString());
        sessionStorage.setItem("mesaha_force_reload", String(Date.now()));

        const url = new URL(window.location.href);
        url.searchParams.set("appUpdate", Date.now().toString());
        url.hash = "";

        setTimeout(() => window.location.replace(url.toString()), 300);
      } catch (error) {
        showToast("Güncelleme başlatılamadı. Sayfayı elle yenileyin.");
        setTimeout(() => window.location.reload(), 700);
      }
    }


    function parseTrDate(value) {
      const text = String(value || "");
      const m = text.match(/(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
      if (!m) return null;
      return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0));
    }

    function adminIsToday(value) {
      const d = parseTrDate(value);
      if (!d) return false;
      const n = new Date();
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
    }

    function adminDaysSince(value) {
      const d = parseTrDate(value);
      if (!d) return 9999;
      return Math.floor((Date.now() - d.getTime()) / 86400000);
    }

    function adminUserKey(name, seflik) {
      const raw = `${name || ""}__${seflik || ""}`;
      return typeof foldLocalText === "function" ? foldLocalText(raw) : raw.toLowerCase();
    }

    function adminIsDisabled(user) {
      return !!state.adminDisabledUsers[adminUserKey(user.name, user.seflik)];
    }

    function adminStatus(user) {
      if (adminIsDisabled(user)) return { key: "disabled", label: "PASİF" };
      const days = adminDaysSince(user.lastLogin);
      if (days <= 0) return { key: "today", label: "BUGÜN" };
      if (days <= 3) return { key: "warning", label: "3 GÜN" };
      return { key: "old", label: "ESKİ" };
    }

    function adminFilteredUsers() {
      const users = Array.isArray(state.adminOnlineUsers) ? state.adminOnlineUsers.slice() : [];
      const q = els.adminUserSearch ? String(els.adminUserSearch.value || "").trim().toLowerCase() : "";
      const seflik = els.adminSeflikFilter ? String(els.adminSeflikFilter.value || "") : "";
      const filter = state.adminQuickFilter || "all";

      let list = users.filter(user => {
        const search = !q || [user.name, user.seflik, user.firstLogin, user.lastLogin, user.loginCount, user.backupCount, user.deviceCount]
          .join(" ").toLowerCase().includes(q);
        const sf = !seflik || String(user.seflik || "") === seflik;
        return search && sf;
      });

      if (filter === "today") list = list.filter(u => adminIsToday(u.lastLogin));
      if (filter === "noBackup") list = list.filter(u => !Number(u.backupCount || 0));
      if (filter === "inactive7") list = list.filter(u => adminDaysSince(u.lastLogin) >= 7);
      if (filter === "disabled") list = list.filter(u => adminIsDisabled(u));
      if (filter === "mostBackup") list.sort((a,b) => Number(b.backupCount || 0) - Number(a.backupCount || 0));

      return list;
    }

    function updateAdminTopSummary() {
      const users = state.adminOnlineUsers || [];
      const backups = state.adminBackups || [];
      const todayUsers = users.filter(u => adminIsToday(u.lastLogin)).length;
      const weekUsers = users.filter(u => adminDaysSince(u.lastLogin) <= 7).length;
      const todayBackups = backups.filter(b => adminIsToday(b.createdAt)).length;
      const totalBackups = backups.length || users.reduce((sum, u) => sum + (Number(u.backupCount) || 0), 0);
      const lastBackup = backups[0] && backups[0].createdAt ? backups[0].createdAt : "-";

      if (els.adminTotalUsers) els.adminTotalUsers.textContent = users.length.toLocaleString("tr-TR");
      if (els.adminTodayUsers) els.adminTodayUsers.textContent = todayUsers.toLocaleString("tr-TR");
      if (els.adminWeekUsers) els.adminWeekUsers.textContent = weekUsers.toLocaleString("tr-TR");
      if (els.adminTotalBackups) els.adminTotalBackups.textContent = totalBackups.toLocaleString("tr-TR");
      if (els.adminTodayBackups) els.adminTodayBackups.textContent = todayBackups.toLocaleString("tr-TR");
      if (els.adminLastBackup) els.adminLastBackup.textContent = lastBackup;
    }

    function updateAdminSeflikOptions() {
      if (!els.adminSeflikFilter) return;
      const current = els.adminSeflikFilter.value || "";
      const vals = Array.from(new Set((state.adminOnlineUsers || []).map(u => u.seflik).filter(Boolean))).sort((a,b) => String(a).localeCompare(String(b), "tr"));
      els.adminSeflikFilter.innerHTML = `<option value="">Tüm şeflikler</option>` + vals.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
      if (vals.includes(current)) els.adminSeflikFilter.value = current;
    }

    function renderAdminControlCenter() {
      if (!els.adminControlCenter) return;
      const users = state.adminOnlineUsers || [];
      const activeToday = users.filter(u => adminIsToday(u.lastLogin)).slice(0, 6);
      const noBackup = users.filter(u => !Number(u.backupCount || 0)).slice(0, 6);
      const inactive = users.filter(u => adminDaysSince(u.lastLogin) >= 7).slice(0, 6);

      els.adminControlCenter.innerHTML = `
        <div class="admin-dashboard-row"><b>Bugün aktif olanlar</b><span>${activeToday.map(u => `${escapeHtml(u.name)} / ${escapeHtml(u.seflik)}`).join("<br>") || "Yok"}</span></div>
        <div class="admin-dashboard-row"><b>Yedeği olmayanlar</b><span>${noBackup.map(u => `${escapeHtml(u.name)} / ${escapeHtml(u.seflik)}`).join("<br>") || "Yok"}</span></div>
        <div class="admin-dashboard-row"><b>7+ gündür girmeyenler</b><span>${inactive.map(u => `${escapeHtml(u.name)} / ${escapeHtml(u.seflik)}`).join("<br>") || "Yok"}</span></div>
      `;
    }

    function renderAdminUsers() {
      if (!els.registeredUsersList) return;
      updateAdminTopSummary();
      updateAdminSeflikOptions();
      const list = adminFilteredUsers();

      if (!list.length) {
        els.registeredUsersList.innerHTML = `<div class="empty-user-list">Aramaya uygun kullanıcı bulunamadı.</div>`;
        return;
      }

      els.registeredUsersList.innerHTML = list.map(user => {
        const status = adminStatus(user);
        const note = state.adminNotes[adminUserKey(user.name, user.seflik)] || "";
        const source = user.sourceLabel || user.source || "";
        const sourceText = String(source).includes("firebase") ? "Firebase" : (String(source).includes("Eski") || String(source).includes("Apps") || String(source).includes("apps") ? "Eski" : "");
        return `
          <div class="registered-user-item online-user status-${status.key}">
            <div class="registered-user-head">
              <b>${escapeHtml(user.name || "-")}</b>
              <div>
                ${sourceText ? `<span class="admin-source-pill">${escapeHtml(sourceText)}</span>` : ""}
                <span class="admin-status-pill ${status.key}">${status.label}</span>
              </div>
            </div>
            <div class="registered-user-meta">
              <span>Şeflik: ${escapeHtml(user.seflik || "-")}</span>
              <span>Son giriş: ${escapeHtml(user.lastLogin || "-")}</span>
              <span>Yedek: ${(Number(user.backupCount) || 0).toLocaleString("tr-TR")}</span>
              <span class="admin-version-pill">Sürüm: ${escapeHtml(user.appVersion || user.fileVersion || "-")}</span>
              <span class="admin-device-pill">Cihaz: ${escapeHtml((user.lastDeviceInfo && (user.lastDeviceInfo.platform || user.lastDeviceInfo.userAgent)) || user.lastDevice || `${(Number(user.deviceCount) || 0).toLocaleString("tr-TR")} cihaz`)}</span>
            </div>
            ${note ? `<div class="admin-note-item"><b>Admin Notu</b><span>${escapeHtml(note)}</span></div>` : ""}
            <div class="registered-user-actions">
              <button class="secondary admin-user-backups" type="button" onclick="adminOpenUserBackups('${escapeHtml(user.name || "")}','${escapeHtml(user.seflik || "")}')">Yedekleri Gör</button>
              <button class="admin-user-note" type="button" onclick="adminEditNote('${escapeHtml(user.name || "")}','${escapeHtml(user.seflik || "")}')">Not Yaz</button>
              <button class="ghost" type="button" onclick="adminShowDetail('${escapeHtml(user.name || "")}','${escapeHtml(user.seflik || "")}')">Detay</button>
              <button class="danger registered-user-delete" type="button" onclick="deleteCloudUserAndBackups('${escapeHtml(user.name || "")}','${escapeHtml(user.seflik || "")}')">Sil</button>
            </div>
          </div>
        `;
      }).join("");
    }

    function renderAdminActivity() {
      if (!els.adminActivityList) return;
      const users = adminFilteredUsers();
      els.adminActivityList.innerHTML = users.slice().sort((a,b) => String(b.lastLogin).localeCompare(String(a.lastLogin))).map(u => `
        <div class="admin-activity-item">
          <b>${escapeHtml(u.name || "-")} / ${escapeHtml(u.seflik || "-")}</b>
          <span>Son giriş: ${escapeHtml(u.lastLogin || "-")} • Toplam giriş: ${(Number(u.loginCount) || 0).toLocaleString("tr-TR")} • Yedek: ${(Number(u.backupCount) || 0).toLocaleString("tr-TR")}</span>
        </div>
      `).join("") || `<div class="empty-user-list">Hareket bulunamadı.</div>`;
    }

    function renderAdminNotes() {
      if (!els.adminNotesList) return;
      const users = state.adminOnlineUsers || [];
      const noted = users.filter(u => state.adminNotes[adminUserKey(u.name, u.seflik)]);
      els.adminNotesList.innerHTML = noted.map(u => `
        <div class="admin-note-item">
          <b>${escapeHtml(u.name || "-")} / ${escapeHtml(u.seflik || "-")}</b>
          <span>${escapeHtml(state.adminNotes[adminUserKey(u.name, u.seflik)] || "")}</span>
          <button class="admin-user-note" type="button" onclick="adminEditNote('${escapeHtml(u.name || "")}','${escapeHtml(u.seflik || "")}')">Notu Düzenle</button>
        </div>
      `).join("") || `<div class="empty-user-list">Henüz admin notu yok.</div>`;
    }

    async function loadAdminBackupsV74() {
      const admin = state.lastAdminCode || sessionStorage.getItem("mesaha_admin_code") || ADMIN_CODE;
      try {
        const data = await jsonpRequest(ONLINE_USER_API_URL, { action: "listAllBackups", admin }, 20000);
        if (data && data.ok && Array.isArray(data.backups)) state.adminBackups = data.backups;
      } catch {
        state.adminBackups = [];
      }
      updateAdminTopSummary();
      renderAdminControlCenter();
    }

    async function loadAdminPanelData() {
      const admin = state.lastAdminCode || sessionStorage.getItem("mesaha_admin_code") || ADMIN_CODE;

      try {
        const cached = JSON.parse(localStorage.getItem("mesaha_admin_users_cache_v1") || "null");
        if (cached && Array.isArray(cached.users) && cached.users.length) {
          state.adminOnlineUsers = cached.users;
          updateAdminTopSummary();
          updateAdminSeflikOptions();
          renderAdminUsers();
          renderAdminNotes();
          if (els.adminSyncInfo) els.adminSyncInfo.textContent = `Önbellekten gösteriliyor • Son kayıt: ${cached.time || "-"}`;
        }
      } catch {}

      try {
        if (els.registeredUsersList && !(state.adminOnlineUsers || []).length) {
          els.registeredUsersList.innerHTML = `<div class="empty-user-list">Kullanıcılar yükleniyor...</div>`;
        }

        const users = await loadOnlineUsers(admin);
        state.adminOnlineUsers = users;

        const time = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
        localStorage.setItem("mesaha_admin_users_cache_v1", JSON.stringify({ time, users }));

        updateAdminTopSummary();
        updateAdminSeflikOptions();
        renderAdminUsers();
        renderAdminNotes();
        setAdminPanelTab("users");

        if (els.adminSyncInfo) {
          els.adminSyncInfo.textContent = `Güncel veri gösteriliyor • Firebase + eski sistem • ${time}`;
        }
        showToast("Admin paneli güncellendi.");

        loadAdminBackupsV74()
          .then(() => {
            updateAdminTopSummary();
            if (els.adminSyncInfo) els.adminSyncInfo.textContent = `Güncel veri gösteriliyor • Yedekler de kontrol edildi • ${time}`;
          })
          .catch(() => {});
      } catch (err) {
        if (els.adminSyncInfo) els.adminSyncInfo.textContent = "Admin verisi alınamadı. İnternet veya Firebase kurallarını kontrol edin.";
        showToast(err && err.message ? err.message : "Admin paneli yüklenemedi.");
      }
    }

    
    function reportStatusLabel(status) {
      if (status === "done") return "Çözüldü";
      if (status === "review") return "İncelendi";
      return "Yeni";
    }

    function reportStatusClass(status) {
      if (status === "done") return "done";
      if (status === "review") return "review";
      return "new";
    }

    
    function currentDeviceInfoPayload() {
      const active = state.activeUser || findActiveUser();
      return {
        appVersion: (window.MESAHA_VERSION_TEXT || 'Mesaha İO'),
        fileVersion: "v135",
        userName: active && active.name ? cleanUserText(active.name) : "",
        seflik: active && active.seflik ? cleanUserText(active.seflik) : "",
        deviceId: getOrCreateDeviceId(),
        recordCount: (state.records || []).length,
        userAgent: navigator.userAgent || "",
        platform: navigator.platform || "",
        online: navigator.onLine,
        screen: `${window.screen && window.screen.width || 0}x${window.screen && window.screen.height || 0}`,
        language: navigator.language || "",
        createdLocal: new Date().toLocaleString("tr-TR"),
        updatedMs: Date.now()
      };
    }

    function issueDeviceInfoPayload() {
      return currentDeviceInfoPayload();
    }

    function issueDeviceInfoText(info) {
      return [
        `Sürüm: ${info.appVersion || "-"}`,
        `Kayıt: ${Number(info.recordCount || 0).toLocaleString("tr-TR")}`,
        `Cihaz: ${info.platform || "-"}`,
        `İnternet: ${info.online ? "Var" : "Yok"}`
      ].join(" • ");
    }

    
    function openAdminFromUserPanel() {
      try {
        closeUserPanel();
      } catch {}

      setTimeout(() => {
        if (typeof unlockAdminPanel === "function") {
          unlockAdminPanel();
          return;
        }

        const code = window.prompt("Yönetici kodunu giriniz:");
        if (String(code || "").trim() !== ADMIN_CODE) {
          showToast("Yönetici kodu hatalı.");
          return;
        }

        state.lastAdminCode = ADMIN_CODE;
        sessionStorage.setItem("mesaha_admin_code", ADMIN_CODE);
        if (els.navAdmin) els.navAdmin.style.display = "";
        if (els.navAdmin) els.navAdmin.classList.add("active");
        document.body.classList.add("show-admin");
        document.body.classList.remove("show-records", "show-guide");
        loadAdminPanelData().catch(err => showToast(err && err.message ? err.message : "Admin paneli yüklenemedi."));
      }, 120);
    }


    async function openIssueReportPanel() {
      const active = state.activeUser || findActiveUser();
      if (!active || !active.name || !active.seflik) {
        showToast("Önce kullanıcı girişi yapınız.");
        return;
      }

      closeUserPanel();
      if (els.issueReportMessage) els.issueReportMessage.value = "";
      if (els.issueReportUserInfo) els.issueReportUserInfo.textContent = `${active.name} • ${active.seflik}`;
      if (els.issueDeviceInfo) els.issueDeviceInfo.textContent = issueDeviceInfoText(issueDeviceInfoPayload());
      if (els.issueReportOverlay) els.issueReportOverlay.classList.add("show");
      loadMyIssueReports().catch(() => {});
      setTimeout(() => { if (els.issueReportMessage) els.issueReportMessage.focus(); }, 120);
    }

    function closeIssueReportPanel() {
      if (els.issueReportOverlay) els.issueReportOverlay.classList.remove("show");
    }

    async function firebaseCreateSupportTicket(message) {
      const { db } = await ensureFirebaseReady();
      const info = issueDeviceInfoPayload();
      const active = state.activeUser || findActiveUser();
      const userKey = firebaseUserKey(active.name, active.seflik);
      const nowMs = Date.now();
      const id = `ticket_${userKey}_${nowMs}`;
      await db.collection(FIREBASE_REPORTS_COLLECTION).doc(id).set({
        id,
        userKey,
        name: cleanUserText(active.name),
        seflik: cleanUserText(active.seflik),
        message: String(message || "").trim(),
        status: "new",
        adminReply: "",
        deviceInfo: info,
        appVersion: info.appVersion,
        recordCount: info.recordCount,
        createdAt: firebaseDateText(),
        createdAtMs: nowMs,
        updatedAt: firebaseDateText(),
        updatedAtMs: nowMs
      });
      return id;
    }

    async function sendIssueReport() {
      const msg = els.issueReportMessage ? String(els.issueReportMessage.value || "").trim() : "";
      if (msg.length < 5) {
        showToast("Sorunu birkaç kelimeyle yazınız.");
        return;
      }

      try {
        showToast("Bildirim gönderiliyor...");
        await firebaseCreateSupportTicket(msg);
        showToast("Sorun bildirimi gönderildi.");
        if (els.issueReportMessage) els.issueReportMessage.value = "";
        await loadMyIssueReports();
      } catch (error) {
        showToast(error && error.message ? error.message : "Bildirim gönderilemedi.");
      }
    }

    async function firebaseListMyTickets() {
      const active = state.activeUser || findActiveUser();
      if (!active || !active.name || !active.seflik) return [];
      const { db } = await ensureFirebaseReady();
      const userKey = firebaseUserKey(active.name, active.seflik);
      const snap = await db.collection(FIREBASE_REPORTS_COLLECTION).where("userKey", "==", userKey).get();
      const rows = [];
      snap.forEach(doc => rows.push(Object.assign({ id: doc.id }, doc.data() || {})));
      return rows.sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0)).slice(0, 5);
    }

    async function loadMyIssueReports() {
      if (!els.issueMyReportsList) return;
      els.issueMyReportsList.innerHTML = "Yükleniyor...";
      try {
        const rows = await firebaseListMyTickets();
        if (!rows.length) {
          els.issueMyReportsList.innerHTML = "Henüz bildirim yok.";
          return;
        }
        els.issueMyReportsList.innerHTML = rows.map(r => `
          <div class="issue-mini-card">
            <div class="top">
              <b>${escapeHtml(r.createdAt || "-")}</b>
              <span class="issue-status ${reportStatusClass(r.status)}">${reportStatusLabel(r.status)}</span>
            </div>
            <div>${escapeHtml(String(r.message || "").slice(0, 120))}</div>
            ${r.adminReply ? `<div class="issue-reply"><b>Admin Cevabı:</b> ${escapeHtml(r.adminReply)}</div>` : ""}
          </div>
        `).join("");
        markUserRepliesSeen();
      } catch (error) {
        els.issueMyReportsList.innerHTML = "Bildirimler alınamadı.";
      }
    }

    
    async function countUserUnreadReplies() {
      const active = state.activeUser || findActiveUser();
      if (!active || !active.name || !active.seflik) return 0;

      try {
        const rows = await firebaseListMyTickets();
        const seenRaw = localStorage.getItem("mesaha_seen_admin_replies_v1") || "{}";
        const seen = JSON.parse(seenRaw);
        let count = 0;
        rows.forEach(r => {
          if (!r.adminReply) return;
          const key = `${r.id}_${r.updatedAtMs || r.createdAtMs || ""}`;
          if (!seen[key]) count++;
        });
        return count;
      } catch {
        return 0;
      }
    }

    async function updateUserNotificationBadge() {
      const badge = els.activeUserBadge || document.getElementById("activeUserBadge");
      if (!badge) return;
      let dot = badge.querySelector(".user-notification-dot");
      if (!dot) {
        dot = document.createElement("span");
        dot.className = "user-notification-dot";
        badge.appendChild(dot);
      }

      const count = await countUserUnreadReplies();
      badge.classList.toggle("has-notification", count > 0);
      dot.textContent = count > 9 ? "9+" : String(count || "");
    }

    async function markUserRepliesSeen() {
      try {
        const rows = await firebaseListMyTickets();
        const seenRaw = localStorage.getItem("mesaha_seen_admin_replies_v1") || "{}";
        const seen = JSON.parse(seenRaw);
        rows.forEach(r => {
          if (!r.adminReply) return;
          const key = `${r.id}_${r.updatedAtMs || r.createdAtMs || ""}`;
          seen[key] = true;
        });
        localStorage.setItem("mesaha_seen_admin_replies_v1", JSON.stringify(seen));
        updateUserNotificationBadge().catch(() => {});
      } catch {}
    }


    let adminReportFilter = "open";

    async function firebaseListSupportTickets() {
      const { db } = await ensureFirebaseReady();
      const snap = await db.collection(FIREBASE_REPORTS_COLLECTION).get();
      const rows = [];
      snap.forEach(doc => rows.push(Object.assign({ id: doc.id }, doc.data() || {})));
      rows.sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
      return rows.slice(0, 300);
    }

    async function renderAdminReports() {
      if (!els.adminReportsList) return;
      els.adminReportsList.innerHTML = `<div class="empty-user-list">Bildirimler yükleniyor...</div>`;

      try {
        let rows = await firebaseListSupportTickets();
        if (adminReportFilter === "open") rows = rows.filter(r => r.status !== "done");
        if (adminReportFilter === "done") rows = rows.filter(r => r.status === "done");

        if (!rows.length) {
          els.adminReportsList.innerHTML = `<div class="empty-user-list">Bildirim yok.</div>`;
          return;
        }

        els.adminReportsList.innerHTML = rows.map(r => {
          const info = r.deviceInfo || {};
          return `
            <div class="admin-report-card">
              <div class="top">
                <div>
                  <b>${escapeHtml(r.name || "-")}</b>
                  <div class="hint">${escapeHtml(r.seflik || "-")} • ${escapeHtml(r.createdAt || "-")}</div>
                </div>
                <span class="admin-report-status ${reportStatusClass(r.status)}">${reportStatusLabel(r.status)}</span>
              </div>
              <div class="admin-report-meta">
                <span>Sürüm: ${escapeHtml(r.appVersion || info.appVersion || "-")}</span>
                <span>Kayıt: ${Number(r.recordCount || info.recordCount || 0).toLocaleString("tr-TR")}</span>
                <span>Cihaz: ${escapeHtml(info.platform || "-")}</span>
                <span>İnternet: ${info.online ? "Var" : "Yok"}</span>
              </div>
              <div class="admin-report-message">${escapeHtml(r.message || "-")}</div>
              ${r.adminReply ? `<div class="admin-reply-box"><b>Cevap:</b> ${escapeHtml(r.adminReply)}</div>` : ""}
              <div class="admin-report-actions">
                <button type="button" class="secondary" onclick="adminSetReportStatus('${escapeHtml(r.id)}','review')">İncelendi</button>
                <button type="button" class="secondary" onclick="adminReplyReport('${escapeHtml(r.id)}')">Cevap Yaz</button>
                <button type="button" class="primary" onclick="adminSetReportStatus('${escapeHtml(r.id)}','done')">Çözüldü</button>
              </div>
            </div>
          `;
        }).join("");
      } catch (error) {
        els.adminReportsList.innerHTML = `<div class="cloud-backup-error">Bildirimler alınamadı. Firebase kurallarını kontrol edin.</div>`;
      }
    }

    async function adminSetReportStatus(ticketId, status) {
      try {
        const { db } = await ensureFirebaseReady();
        await db.collection(FIREBASE_REPORTS_COLLECTION).doc(ticketId).set({
          status,
          updatedAt: firebaseDateText(),
          updatedAtMs: Date.now()
        }, { merge: true });
        showToast("Bildirim durumu güncellendi.");
        renderAdminReports();
      } catch (error) {
        showToast("Durum güncellenemedi.");
      }
    }

    async function adminReplyReport(ticketId) {
      const reply = window.prompt("Kullanıcıya görünecek admin cevabını yazınız:");
      if (reply === null) return;
      const text = String(reply || "").trim();

      try {
        const { db } = await ensureFirebaseReady();
        await db.collection(FIREBASE_REPORTS_COLLECTION).doc(ticketId).set({
          adminReply: text,
          status: text ? "review" : "new",
          updatedAt: firebaseDateText(),
          updatedAtMs: Date.now()
        }, { merge: true });
        showToast("Admin cevabı kaydedildi.");
        renderAdminReports();
      } catch (error) {
        showToast("Cevap kaydedilemedi.");
      }
    }


    function setAdminPanelTab(tab) {
      const selected = tab === "notes" ? "notes" : (tab === "reports" ? "reports" : "users");
      const views = {
        users: els.adminUsersView,
        notes: els.adminNotesView,
        reports: els.adminReportsView
      };
      Object.keys(views).forEach(k => { if (views[k]) views[k].style.display = k === selected ? "" : "none"; });
      document.querySelectorAll(".admin-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.adminTab === selected));
      if (selected === "users") renderAdminUsers();
      if (selected === "notes") renderAdminNotes();
      if (selected === "reports") renderAdminReports();
    }

    function showAdminPage() {
      document.body.classList.add("show-admin");
      document.body.classList.remove("show-records", "show-guide");
      if (els.navAdmin) els.navAdmin.classList.add("active");
      if (els.navEntry) els.navEntry.classList.remove("active");
      if (els.navRecords) els.navRecords.classList.remove("active");
      if (els.navGuide) els.navGuide.classList.remove("active");
    }

    function unlockAdminPanel() {
      const code = window.prompt("Yönetici kodunu giriniz:");
      if (String(code || "").trim() !== ADMIN_CODE) return showToast("Yönetici kodu hatalı.");
      state.lastAdminCode = String(code).trim();
      sessionStorage.setItem("mesaha_admin_code", state.lastAdminCode);
      sessionStorage.setItem("mesaha_admin_panel_open", "1");
      if (els.navAdmin) {
        els.navAdmin.style.display = "";
        const bottomNav = document.querySelector(".bottom-nav");
        if (bottomNav) bottomNav.classList.add("has-admin");
      }
      showAdminPage();
      loadAdminPanelData().catch(err => showToast(err && err.message ? err.message : "Admin paneli açılamadı."));
    }

    function adminOpenUserBackups(name, seflik) {
      openCloudRestorePanel(false, true);
      if (els.cloudRestoreUserName) els.cloudRestoreUserName.value = name || "";
      if (els.cloudRestoreSeflik) els.cloudRestoreSeflik.value = seflik || "";
      searchCloudBackups(true);
    }

    function adminEditNote(name, seflik) {
      const key = adminUserKey(name, seflik);
      const current = state.adminNotes[key] || "";
      const note = prompt("Bu kullanıcı için admin notu:", current);
      if (note === null) return;
      state.adminNotes[key] = String(note || "").trim();
      if (!state.adminNotes[key]) delete state.adminNotes[key];
      localStorage.setItem("mesaha_admin_notes_v1", JSON.stringify(state.adminNotes));
      renderAdminUsers();
      renderAdminNotes();
      showToast("Admin notu kaydedildi.");
    }

    function adminTogglePassive(name, seflik) {
      const key = adminUserKey(name, seflik);
      state.adminDisabledUsers[key] = !state.adminDisabledUsers[key];
      if (!state.adminDisabledUsers[key]) delete state.adminDisabledUsers[key];
      localStorage.setItem("mesaha_admin_disabled_v1", JSON.stringify(state.adminDisabledUsers));
      renderAdminUsers();
      showToast(state.adminDisabledUsers[key] ? "Kullanıcı pasif işaretlendi." : "Kullanıcı aktif işaretlendi.");
    }

    function adminShowDetail(name, seflik) {
      const u = (state.adminOnlineUsers || []).find(x => String(x.name) === String(name) && String(x.seflik) === String(seflik));
      if (!u) return showToast("Kullanıcı bulunamadı.");
      alert(
        `Kullanıcı: ${u.name}\nŞeflik: ${u.seflik}\nİlk giriş: ${u.firstLogin || "-"}\nSon giriş: ${u.lastLogin || "-"}\nToplam giriş: ${u.loginCount || 0}\nCihaz sayısı: ${u.deviceCount || 0}\nYedek sayısı: ${u.backupCount || 0}\nNot: ${state.adminNotes[adminUserKey(u.name, u.seflik)] || "-"}`
      );
    }


    async function deleteCloudUserAndBackups(name, seflik) {
      const cleanName = cleanUserText(name);
      const cleanSeflik = cleanUserText(seflik);
      if (!cleanName || !cleanSeflik) return;

      let adminCode = state.lastAdminCode || sessionStorage.getItem("mesaha_admin_code") || "";
      if (!adminCode) {
        adminCode = window.prompt("Silmek için yönetici kodunu giriniz:");
      }
      if (String(adminCode || "").trim() !== ADMIN_CODE) {
        showToast("Yönetici kodu hatalı.");
        return;
      }

      const ok = window.confirm(`${cleanName} / ${cleanSeflik} kullanıcısı ve bu kullanıcıya ait tüm bulut yedekleri silinsin mi? Bu işlem geri alınamaz.`);
      if (!ok) return;

      try {
        showToast("Kullanıcı ve yedekleri siliniyor...");
        const data = await jsonpRequest(ONLINE_USER_API_URL, {
          action: "deleteUser",
          admin: adminCode,
          name: cleanName,
          seflik: cleanSeflik
        }, 25000);

        if (!data || data.ok !== true) {
          throw new Error((data && data.error) ? data.error : "Silme işlemi başarısız");
        }

        showToast(`Silindi. Kullanıcı satırı: ${Number(data.deletedUsers || 0)}, yedek: ${Number(data.deletedBackups || 0)}`);

        const users = await loadOnlineUsers(adminCode);
        const deletedKey = foldLocalText(`${cleanName}__${cleanSeflik}`);
        const filtered = users.filter(u => foldLocalText(`${u.name || ""}__${u.seflik || ""}`) !== deletedKey);
        renderOnlineUsers(filtered);
      } catch (error) {
        showToast(error && error.message ? error.message : "Silme işlemi başarısız.");
      }
    }

    function foldLocalText(value) {
      return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLocaleLowerCase("tr-TR")
        .replace(/ç/g, "c")
        .replace(/ğ/g, "g")
        .replace(/ı/g, "i")
        .replace(/i̇/g, "i")
        .replace(/ö/g, "o")
        .replace(/ş/g, "s")
        .replace(/ü/g, "u")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    function renderOnlineUsers(users) {
      if (!els.registeredUsersList) return;

      state.adminOnlineUsers = Array.isArray(users) ? users : [];
      const q = els.adminUserSearch ? String(els.adminUserSearch.value || "").trim().toLowerCase() : "";
      const list = q ? state.adminOnlineUsers.filter(user => [
        user.name, user.seflik, user.firstLogin, user.lastLogin, user.loginCount, user.backupCount, user.deviceCount
      ].join(" ").toLowerCase().includes(q)) : state.adminOnlineUsers;

      if (!list.length) {
        els.registeredUsersList.innerHTML = `<div class="empty-user-list">${q ? "Aramaya uygun kullanıcı bulunamadı." : "Merkezde henüz kullanıcı kaydı yok."}</div>`;
        return;
      }

      els.registeredUsersList.innerHTML = list.map(user => `
        <div class="registered-user-item online-user">
          <div class="registered-user-head">
            <b>${escapeHtml(user.name || "-")}</b>
            <span class="registered-source-label">MERKEZ</span>
          </div>
          <div class="registered-user-meta">
            <span>Şeflik: ${escapeHtml(user.seflik || "-")}</span>
            <span>Giriş: ${(Number(user.loginCount) || 0).toLocaleString("tr-TR")}</span>
            <span>İlk: ${escapeHtml(user.firstLogin || "-")}</span>
            <span>Son: ${escapeHtml(user.lastLogin || "-")}</span>
            <span>Yedek: ${(Number(user.backupCount) || 0).toLocaleString("tr-TR")}</span>
            <span>Cihaz: ${(Number(user.deviceCount) || 0).toLocaleString("tr-TR")}</span>
          </div>
          <div class="registered-user-actions">
            <button class="danger registered-user-delete" type="button" data-name="${escapeHtml(user.name || "")}" data-seflik="${escapeHtml(user.seflik || "")}">
              Kullanıcıyı ve Bulut Yedeklerini Sil
            </button>
          </div>
        </div>
      `).join("");

      els.registeredUsersList.querySelectorAll(".registered-user-delete").forEach(btn => {
        btn.addEventListener("click", () => deleteCloudUserAndBackups(btn.dataset.name || "", btn.dataset.seflik || ""));
      });
    }

    function renderLocalUsersAsFallback(message) {
      if (!els.registeredUsersList) return;

      const users = state.userStore && Array.isArray(state.userStore.users) ? state.userStore.users : [];
      if (!users.length) {
        els.registeredUsersList.innerHTML = `<div class="registered-error">${escapeHtml(message || "Merkeze bağlanılamadı.")}<br>Bu cihazda da kayıtlı kullanıcı yok.</div>`;
        return;
      }

      els.registeredUsersList.innerHTML = `
        <div class="registered-error">${escapeHtml(message || "Merkeze bağlanılamadı.")}<br>Şimdilik bu cihazdaki kullanıcılar gösteriliyor.</div>
      ` + users.map(user => {
        const active = user.id === (state.userStore ? state.userStore.activeUserId : "");
        return `
          <div class="registered-user-item local-fallback-user">
            <div class="registered-user-head">
              <b>${escapeHtml(user.name || "-")}</b>
              ${active ? `<span class="active-user-label">AKTİF</span>` : `<span class="registered-source-label local">CİHAZ</span>`}
            </div>
            <div class="registered-user-meta">
              <span>Şeflik: ${escapeHtml(user.seflik || "-")}</span>
              <span>Giriş: ${(Number(user.loginCount) || 0).toLocaleString("tr-TR")}</span>
              <span>İlk: ${escapeHtml(user.firstLogin || "-")}</span>
              <span>Son: ${escapeHtml(user.lastLogin || "-")}</span>
            </div>
          </div>
        `;
      }).join("");
    }


    function cleanUserText(value) {
      return String(value || "").replace(/\s+/g, " ").trim();
    }

    function createUserId(name, seflik) {
      const raw = `${cleanUserText(name).toLocaleLowerCase("tr-TR")}__${cleanUserText(seflik).toLocaleLowerCase("tr-TR")}`;
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash |= 0;
      }
      return `u_${Math.abs(hash)}`;
    }

    function loadUserStore() {
      try {
        const parsed = JSON.parse(localStorage.getItem(USER_STORE_KEY) || "{}");
        return {
          activeUserId: parsed.activeUserId || "",
          users: Array.isArray(parsed.users) ? parsed.users : []
        };
      } catch {
        return { activeUserId: "", users: [] };
      }
    }

    function saveUserStore() {
      localStorage.setItem(USER_STORE_KEY, JSON.stringify(state.userStore));
    }

    function findActiveUser() {
      const users = state.userStore && Array.isArray(state.userStore.users) ? state.userStore.users : [];
      return users.find(u => u.id === state.userStore.activeUserId) || null;
    }

    function showLoginError(message) {
      if (!els.loginError) return;
      els.loginError.textContent = message;
      els.loginError.classList.add("show");
    }

    function clearLoginError() {
      if (!els.loginError) return;
      els.loginError.textContent = "";
      els.loginError.classList.remove("show");
    }

    function openUserLogin(prefill = true) {
      clearLoginError();
      if (prefill && state.activeUser) {
        if (els.loginUserName) els.loginUserName.value = state.activeUser.name || "";
        if (els.loginSeflik) els.loginSeflik.value = state.activeUser.seflik || "";
      } else {
        if (els.loginUserName) els.loginUserName.value = "";
        if (els.loginSeflik) els.loginSeflik.value = "";
      }

      document.body.classList.add("user-login-required");
      setTimeout(() => {
        if (els.loginUserName) els.loginUserName.focus();
      }, 80);
    }

    function closeUserLogin() {
      document.body.classList.remove("user-login-required");
      clearLoginError();
    }


    function syncFileInfoWithActiveUser() {
      const user = state.activeUser || findActiveUser();
      if (!user) return;

      if (els.seflik) {
        els.seflik.value = user.seflik || "";
      }

      if (els.ekipNot && !String(els.ekipNot.value || "").trim()) {
        els.ekipNot.value = user.name || "";
      }

      state.settings.seflik = user.seflik || "";
      if (!state.settings.ekipNot) state.settings.ekipNot = user.name || "";

      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
      } catch {}
    }


    function applyActiveUserToScreen() {
      state.activeUser = findActiveUser();

      if (state.activeUser) {
        if (els.activeUserBadge) {
          els.activeUserBadge.textContent = `${state.activeUser.name} • ${state.activeUser.seflik}`;
          els.activeUserBadge.style.display = "block";
        }

        syncFileInfoWithActiveUser();
      } else if (els.activeUserBadge) {
        els.activeUserBadge.textContent = "";
        els.activeUserBadge.style.display = "none";
      }

      renderRegisteredUsers();
    }

    function registerUserLoginById(userId) {
      const user = state.userStore.users.find(u => u.id === userId);
      if (!user) return;

      const now = new Date().toLocaleString("tr-TR");
      user.loginCount = (Number(user.loginCount) || 0) + 1;
      if (!user.firstLogin) user.firstLogin = now;
      user.lastLogin = now;
      state.userStore.activeUserId = user.id;
      saveUserStore();
      applyActiveUserToScreen();
    }

    function saveLoginUser() {
      const name = cleanUserText(els.loginUserName ? els.loginUserName.value : "");
      const seflik = cleanUserText(els.loginSeflik ? els.loginSeflik.value : "");

      if (name.length < 2) return showLoginError("Kullanıcı adı en az 2 karakter olmalı.");
      if (seflik.length < 2) return showLoginError("Şeflik bilgisi en az 2 karakter olmalı.");

      const id = createUserId(name, seflik);
      const now = new Date().toLocaleString("tr-TR");
      let user = state.userStore.users.find(u => u.id === id);

      if (!user) {
        user = {
          id,
          name,
          seflik,
          firstLogin: now,
          lastLogin: "",
          loginCount: 0
        };
        state.userStore.users.unshift(user);
      } else {
        user.name = name;
        user.seflik = seflik;
      }

      state.userStore.activeUserId = id;

      if (els.seflik) els.seflik.value = seflik;
      if (els.ekipNot && !String(els.ekipNot.value || "").trim()) els.ekipNot.value = name;
      state.settings.seflik = seflik;
      if (!state.settings.ekipNot) state.settings.ekipNot = name;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));

      registerUserLoginById(id);
      logOnlineUser(state.activeUser);
      closeUserLogin();
      showToast("Kullanıcı girişi kaydedildi.");
    }





    function openCloudRestorePanel(prefill = true, manual = false) {
      const user = state.activeUser || findActiveUser();

      if (prefill && user) {
        if (els.cloudRestoreUserName) els.cloudRestoreUserName.value = user.name || "";
        if (els.cloudRestoreSeflik) els.cloudRestoreSeflik.value = user.seflik || "";
      }

      if (els.cloudRestoreActiveInfo && user && !manual) {
        els.cloudRestoreActiveInfo.textContent = `Aktif kullanıcı: ${user.name || "-"} • ${user.seflik || "-"}`;
        els.cloudRestoreActiveInfo.classList.add("show");
      } else if (els.cloudRestoreActiveInfo) {
        els.cloudRestoreActiveInfo.classList.remove("show");
      }

      if (els.cloudRestoreManualFields) {
        els.cloudRestoreManualFields.classList.toggle("show", manual || !user);
      }

      if (els.cloudBackupList) {
        els.cloudBackupList.innerHTML = `<div class="cloud-backup-empty">Bulut yedekleri getiriliyor...</div>`;
      }

      document.body.classList.add("cloud-restore-open");

      if (user && !manual) {
        setTimeout(() => searchCloudBackups(false), 80);
      } else if (els.cloudBackupList) {
        els.cloudBackupList.innerHTML = `<div class="cloud-backup-empty">Kullanıcı adı ve şeflik girip bulut kayıtlarını getirin.</div>`;
      }
    }

    function closeCloudRestorePanel() {
      document.body.classList.remove("cloud-restore-open");
    }


    function stableBackupString(value) {
      try {
        return JSON.stringify(value, Object.keys(value).sort());
      } catch {
        return String(value || "");
      }
    }

    function simpleHashText(text) {
      let hash = 2166136261;
      const str = String(text || "");
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0).toString(16);
    }

    function setCloudBackupBusy(isBusy) {
      state.cloudBackupBusy = !!isBusy;
      [els.cloudBackupBtn, els.panelCloudBackupBtn].forEach(btn => {
        if (!btn) return;
        btn.classList.toggle("is-busy", !!isBusy);
        btn.disabled = !!isBusy;
      });
    }


    async function uploadCloudBackupOpen(user) {
      const payload = buildCloudBackupPayload(user);
      payload.version = 134;
      const bolmePart = els.bolmeNo && String(els.bolmeNo.value || "").trim() ? `_${cleanFilePart(els.bolmeNo.value)}` : "";
      const fileName = `Mesaha_Yedek_${cleanFilePart(user.seflik)}_${cleanFilePart(user.name)}${bolmePart}_${new Date().toISOString().slice(0,19).replace(/[-:T]/g, "")}.json`;

      const body = new URLSearchParams();
      body.set("action", "backup");
      body.set("name", user.name || "");
      body.set("seflik", user.seflik || "");
      body.set("deviceId", user.deviceId || "");
      body.set("bolmeNo", els.bolmeNo ? String(els.bolmeNo.value || "").trim() : "");
      body.set("ekipNot", els.ekipNot ? String(els.ekipNot.value || "").trim() : "");
      body.set("fileName", fileName);
      const backupHash = simpleHashText(JSON.stringify({ user, records: state.records || [], fileInfo: payload.fileInfo || {} }));
      body.set("recordCount", String((state.records || []).length));
      body.set("backupHash", backupHash);
      body.set("payload", JSON.stringify(payload));

      await fetch(ONLINE_USER_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: body.toString()
      });

      return fileName;
    }


    async function verifyLatestCloudBackupAfterUpload(user) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1800));
        const data = await jsonpRequest(ONLINE_USER_API_URL, {
          action: "listBackups",
          name: user.name || "",
          seflik: user.seflik || ""
        }, 12000);

        if (data && data.ok === true && Array.isArray(data.backups) && data.backups.length) {
          showToast("Bulut yedeği kayda geçti.");
          return true;
        }

        showToast("Yedek gönderildi ama listede görünmedi. Apps Script kodunu v66 ile güncelle.");
        return false;
      } catch {
        showToast("Yedek gönderildi, kontrol için Buluttan Getir'i deneyin.");
        return false;
      }
    }


    async function cloudBackupRecordsOpen() {
      if (state.cloudBackupBusy) {
        showToast("Bulut yedekleme zaten devam ediyor. Lütfen bekleyin.");
        return;
      }

      if (!navigator.onLine) {
        showToast("İnternet bağlantısı yok. Buluta yedekleme yapılamaz.");
        return;
      }

      const user = getCurrentCloudUser();
      if (!user || !user.name || !user.seflik) {
        openUserLogin(false);
        showToast("Önce kullanıcı adı ve şeflik giriniz.");
        return;
      }

      if (!state.records || !state.records.length) {
        showToast("Buluta yedeklenecek kayıt yok.");
        return;
      }

      try {
        setCloudBackupBusy(true);
        setCloudLoading(true, "Buluta yedek yükleniyor...");
        showToast("Buluta yedek gönderiliyor, lütfen bekleyin...");
        const fileName = await uploadCloudBackupOpen(user);

        showToast("Bulut yedekleme gönderildi. Kontrol ediliyor...");
        const verified = await verifyLatestCloudBackupAfterUpload(user);

        setTimeout(() => {
          alert(`Bulut yedeği gönderildi.

Dosya adı:
${fileName}

${verified ? "Yedek listede göründü." : "Yedek gönderildi; listede görünmezse Apps Script kodunun v68 olduğundan emin olun."}`);
        }, 350);
      } catch (error) {
        showToast(error && error.message ? error.message : "Bulut yedekleme başarısız.");
      } finally {
        setCloudLoading(false);
        setTimeout(() => setCloudBackupBusy(false), 1500);
      }
    }

    async function searchCloudBackups(manual = true) {
      if (!navigator.onLine) {
        if (els.cloudBackupList) els.cloudBackupList.innerHTML = `<div class="cloud-backup-error">İnternet bağlantısı yok. Buluttan getirme yapılamaz.</div>`;
        return;
      }

      const active = state.activeUser || findActiveUser();
      const name = (!manual && active) ? cleanUserText(active.name) : cleanUserText(els.cloudRestoreUserName ? els.cloudRestoreUserName.value : "");
      const seflik = (!manual && active) ? cleanUserText(active.seflik) : cleanUserText(els.cloudRestoreSeflik ? els.cloudRestoreSeflik.value : "");

      if (!name || !seflik) {
        if (els.cloudBackupList) els.cloudBackupList.innerHTML = `<div class="cloud-backup-error">Kullanıcı adı ve şeflik giriniz.</div>`;
        return;
      }

      if (els.cloudBackupList) els.cloudBackupList.innerHTML = `<div class="cloud-backup-loading">Bulut yedekleri getiriliyor...</div>`;

      try {
        const data = await jsonpRequest(ONLINE_USER_API_URL, {
          action: "listBackups",
          name,
          seflik
        }, 15000);

        if (!data || data.ok !== true) {
          throw new Error((data && data.error) ? data.error : "Bulut yedekleri alınamadı");
        }

        renderCloudBackupList(data.backups || []);
      } catch (error) {
        if (els.cloudBackupList) els.cloudBackupList.innerHTML = `<div class="cloud-backup-error">${escapeHtml(error && error.message ? error.message : "Bulut yedekleri alınamadı.")}</div>`;
      }
    }

    function renderCloudBackupList(backups) {
      if (!els.cloudBackupList) return;

      if (!backups.length) {
        els.cloudBackupList.innerHTML = `<div class="cloud-backup-empty">Bu kullanıcı ve şeflik için bulut yedeği bulunamadı. Türkçe karakter veya şeflik farkı varsa Farklı Kullanıcı / Şeflik Ara ile tekrar deneyin.</div>`;
        return;
      }

      els.cloudBackupList.innerHTML = backups.map(backup => `
        <div class="cloud-backup-item" data-backup-id="${escapeHtml(backup.id || "")}">
          <div class="cloud-backup-head">
            <b>${escapeHtml(backup.fileName || "Mesaha yedeği")}</b>
            <span class="cloud-backup-date">${escapeHtml(backup.createdAt || "-")}</span>
          </div>
          <div class="cloud-backup-meta">
            <span>Kayıt: ${(Number(backup.recordCount) || 0).toLocaleString("tr-TR")}</span>
            <span>Kullanıcı: ${escapeHtml(backup.name || "-")}</span>
            <span>Şeflik: ${escapeHtml(backup.seflik || "-")}</span>
            <span>Bölme: ${escapeHtml(backup.bolmeNo || "-")}</span>
          </div>
          <div class="cloud-backup-actions">
            <button class="primary mini-cloud-restore" type="button" data-id="${escapeHtml(backup.id || "")}">Geri Yükle</button>
            <button class="danger mini-cloud-delete" type="button" data-id="${escapeHtml(backup.id || "")}">Sil</button>
          </div>
        </div>
      `).join("");

      els.cloudBackupList.querySelectorAll(".mini-cloud-restore").forEach(btn => {
        btn.addEventListener("click", () => restoreCloudBackup(btn.dataset.id));
      });
      els.cloudBackupList.querySelectorAll(".mini-cloud-delete").forEach(btn => {
        btn.addEventListener("click", () => deleteCloudBackup(btn.dataset.id));
      });
    }

    async function restoreCloudBackup(backupId) {
      if (!backupId) return;

      const ok = window.confirm("Bu bulut yedeği geri yüklensin mi? Mevcut cihaz kayıtları bu yedekle değiştirilecek.");
      if (!ok) return;

      try {
        setCloudLoading(true, "Bulut yedeği geri yükleniyor...");
        showToast("Bulut yedeği indiriliyor...");
        const data = await jsonpRequest(ONLINE_USER_API_URL, {
          action: "getBackup",
          backupId
        }, 20000);

        if (!data || data.ok !== true) {
          throw new Error((data && data.error) ? data.error : "Yedek alınamadı");
        }

        const payload = typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
        if (!payload || !Array.isArray(payload.records)) {
          throw new Error("Yedek dosyası geçersiz");
        }

        state.records = payload.records;
        save();
        quickAppUpdateCheck();
    render();
        closeCloudRestorePanel();
        showToast("Bulut yedeği geri yüklendi.");
      } catch (error) {
        showToast(error && error.message ? error.message : "Geri yükleme başarısız.");
      } finally {
        setCloudLoading(false);
      }
    }

    async function deleteCloudBackup(backupId) {
      if (!backupId) return;

      const ok = window.confirm("Bu bulut yedeği silinsin mi? Bu işlem geri alınamaz.");
      if (!ok) return;

      try {
        showToast("Bulut yedeği siliniyor...");
        const data = await jsonpRequest(ONLINE_USER_API_URL, {
          action: "deleteBackup",
          backupId
        }, 15000);

        if (!data || data.ok !== true) {
          throw new Error((data && data.error) ? data.error : "Silme başarısız");
        }

        showToast("Bulut yedeği silindi.");
        searchCloudBackups(true);
      } catch (error) {
        showToast(error && error.message ? error.message : "Silme başarısız.");
      }
    }


    function openUserPanel() {
      const user = state.activeUser || findActiveUser();
      if (!user) {
        openUserLogin(false);
        return;
      }

      if (els.userPanelInfo) {
        els.userPanelInfo.textContent = `${user.name || "-"} • ${user.seflik || "-"}`;
      }

      document.body.classList.add("user-panel-open");
    }

    function closeUserPanel() {
      document.body.classList.remove("user-panel-open");
    }

    async function createOrChangeCloudPassword() {
      if (!navigator.onLine) {
        showToast("Şifre işlemi için internet gerekir.");
        return;
      }

      const user = getCurrentCloudUser();
      if (!user || !user.name || !user.seflik) {
        closeUserPanel();
        openUserLogin(false);
        showToast("Önce kullanıcı adı ve şeflik giriniz.");
        return;
      }

      try {
        const info = await jsonpRequest(ONLINE_USER_API_URL, {
          action: "passwordStatus",
          name: user.name,
          seflik: user.seflik,
          deviceId: user.deviceId
        }, 9000);

        if (!info || info.ok !== true) {
          throw new Error((info && info.error) ? info.error : "Şifre durumu alınamadı");
        }

        if (!info.hasPassword) {
          const pass1 = window.prompt("Bulut yedek şifresi oluşturunuz:");
          if (!pass1) return showToast("Şifre oluşturma iptal edildi.");
          if (String(pass1).trim().length < 4) return showToast("Şifre en az 4 karakter olmalı.");

          const pass2 = window.prompt("Şifreyi tekrar giriniz:");
          if (String(pass1) !== String(pass2)) return showToast("Şifreler eşleşmedi.");

          const created = await jsonpRequest(ONLINE_USER_API_URL, {
            action: "setPassword",
            name: user.name,
            seflik: user.seflik,
            deviceId: user.deviceId,
            password: pass1
          }, 9000);

          if (!created || created.ok !== true) {
            throw new Error((created && created.error) ? created.error : "Şifre oluşturulamadı");
          }

          showToast("Bulut şifresi oluşturuldu.");
          return;
        }

        const oldPass = window.prompt("Mevcut bulut şifrenizi giriniz:");
        if (!oldPass) return showToast("Şifre değiştirme iptal edildi.");

        const newPass1 = window.prompt("Yeni bulut şifresini giriniz:");
        if (!newPass1) return showToast("Şifre değiştirme iptal edildi.");
        if (String(newPass1).trim().length < 4) return showToast("Yeni şifre en az 4 karakter olmalı.");

        const newPass2 = window.prompt("Yeni şifreyi tekrar giriniz:");
        if (String(newPass1) !== String(newPass2)) return showToast("Yeni şifreler eşleşmedi.");

        const changed = await jsonpRequest(ONLINE_USER_API_URL, {
          action: "changePassword",
          name: user.name,
          seflik: user.seflik,
          deviceId: user.deviceId,
          oldPassword: oldPass,
          newPassword: newPass1
        }, 9000);

        if (!changed || changed.ok !== true) {
          throw new Error((changed && changed.error) ? changed.error : "Şifre değiştirilemedi");
        }

        showToast("Bulut şifresi değiştirildi.");
      } catch (error) {
        showToast(error && error.message ? error.message : "Şifre işlemi başarısız.");
      }
    }



    function updateKeyboardOffset() {
      const vv = window.visualViewport;
      let offset = 0;

      if (vv) {
        offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      }

      document.documentElement.style.setProperty("--keyboard-offset", `${Math.round(offset)}px`);
    }

    function initKeyboardAwareToast() {
      updateKeyboardOffset();
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", updateKeyboardOffset);
        window.visualViewport.addEventListener("scroll", updateKeyboardOffset);
      }
      window.addEventListener("resize", updateKeyboardOffset);
      document.addEventListener("focusin", () => setTimeout(updateKeyboardOffset, 80));
      document.addEventListener("focusout", () => setTimeout(updateKeyboardOffset, 180));
    }

    function setCloudLoading(show, text = "Bulut işlemi yapılıyor...") {
      if (els.cloudLoadingText) els.cloudLoadingText.textContent = text;
      document.body.classList.toggle("cloud-loading-open", !!show);
    }

    function selectInputValue(el) {
      if (!el) return;
      setTimeout(() => {
        try { el.select(); } catch {}
      }, 20);
    }


    function getCurrentCloudUser() {
      const user = state.activeUser || findActiveUser();
      if (!user) return null;
      return {
        name: user.name || "",
        seflik: user.seflik || "",
        deviceId: getOrCreateDeviceId()
      };
    }

    async function ensureCloudPasswordForUser(user) {
      const info = await jsonpRequest(ONLINE_USER_API_URL, {
        action: "passwordStatus",
        name: user.name,
        seflik: user.seflik,
        deviceId: user.deviceId
      }, 9000);

      if (!info || info.ok !== true) {
        throw new Error((info && info.error) ? info.error : "Şifre durumu alınamadı");
      }

      if (!info.hasPassword) {
        const pass1 = window.prompt("Bu kullanıcı için bulut yedek şifresi oluşturunuz:");
        if (!pass1) throw new Error("Şifre oluşturma iptal edildi.");
        if (String(pass1).trim().length < 4) throw new Error("Şifre en az 4 karakter olmalı.");

        const pass2 = window.prompt("Şifreyi tekrar giriniz:");
        if (String(pass1) !== String(pass2)) throw new Error("Şifreler eşleşmedi.");

        const created = await jsonpRequest(ONLINE_USER_API_URL, {
          action: "setPassword",
          name: user.name,
          seflik: user.seflik,
          deviceId: user.deviceId,
          password: pass1
        }, 9000);

        if (!created || created.ok !== true) {
          throw new Error((created && created.error) ? created.error : "Şifre oluşturulamadı");
        }

        return pass1;
      }

      const password = window.prompt("Bulut yedek şifrenizi giriniz:");
      if (!password) throw new Error("Bulut yedekleme iptal edildi.");

      const checked = await jsonpRequest(ONLINE_USER_API_URL, {
        action: "checkPassword",
        name: user.name,
        seflik: user.seflik,
        deviceId: user.deviceId,
        password
      }, 9000);

      if (!checked || checked.ok !== true) {
        throw new Error((checked && checked.error) ? checked.error : "Şifre hatalı");
      }

      return password;
    }

    function buildCloudBackupPayload(user) {
      return {
        app: "Mesaha İO",
        version: 135,
        createdAt: new Date().toLocaleString("tr-TR"),
        user: {
          name: user.name || "",
          seflik: user.seflik || "",
          deviceId: user.deviceId || ""
        },
        fileInfo: {
          bolmeNo: els.bolmeNo ? String(els.bolmeNo.value || "").trim() : (state.settings.bolmeNo || ""),
          seflik: els.seflik ? String(els.seflik.value || "").trim() : (user.seflik || ""),
          ekipNot: els.ekipNot ? String(els.ekipNot.value || "").trim() : (user.name || "")
        },
        settings: state.settings || {},
        records: state.records || [],
        totals: (typeof calculateTotals === "function" ? calculateTotals() : {})
      };
    }

    async function uploadCloudBackupNoCors(user, password) {
      const payload = buildCloudBackupPayload(user);
      const fileName = `Mesaha_Yedek_${cleanFilePart(user.seflik)}_${cleanFilePart(user.name)}_${new Date().toISOString().slice(0,19).replace(/[-:T]/g, "")}.json`;

      const body = new URLSearchParams();
      body.set("action", "backup");
      body.set("name", user.name || "");
      body.set("seflik", user.seflik || "");
      body.set("deviceId", user.deviceId || "");
      body.set("password", password || "");
      body.set("fileName", fileName);
      body.set("payload", JSON.stringify(payload));

      await fetch(ONLINE_USER_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: body.toString()
      });

      return fileName;
    }

    function cleanFilePart(value) {
      return String(value || "bos")
        .replace(/[^\p{L}\p{N}_-]+/gu, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 32) || "bos";
    }

    async function cloudBackupRecords() {
      if (!navigator.onLine) {
        showToast("İnternet bağlantısı yok. Buluta yedekleme yapılamaz.");
        return;
      }

      const user = getCurrentCloudUser();
      if (!user || !user.name || !user.seflik) {
        openUserLogin(false);
        showToast("Önce kullanıcı adı ve şeflik giriniz.");
        return;
      }

      if (!state.records || !state.records.length) {
        showToast("Buluta yedeklenecek kayıt yok.");
        return;
      }

      try {
        showToast("Bulut yedekleme hazırlanıyor...");
        const password = await ensureCloudPasswordForUser(user);
        const fileName = await uploadCloudBackupNoCors(user, password);
        showToast("Bulut yedekleme gönderildi.");
        setTimeout(() => {
          alert(`Bulut yedeği gönderildi.\n\nDosya adı:\n${fileName}\n\nNot: Dosya yöneticinin Google Drive hesabındaki Mesaha_Yedekleri klasörüne kaydedilir.`);
        }, 350);
      } catch (error) {
        showToast(error && error.message ? error.message : "Bulut yedekleme başarısız.");
      }
    }


    async function unlockRegisteredUsers() {
      const code = window.prompt("Yönetici kodunu giriniz:");
      if (String(code || "").trim() !== ADMIN_CODE) {
        showToast("Yönetici kodu hatalı.");
        return;
      }

      state.lastAdminCode = String(code || "").trim();
      sessionStorage.setItem("mesaha_admin_code", state.lastAdminCode);
      sessionStorage.setItem("mesaha_admin_users_visible", "1");
      document.body.classList.add("admin-users-visible");
        state.lastAdminCode = sessionStorage.getItem("mesaha_admin_code") || state.lastAdminCode || "";

      if (els.registeredUsersList) {
        els.registeredUsersList.innerHTML = `<div class="registered-loading">Merkez kullanıcı listesi yükleniyor...</div>`;
      }

      try {
        const users = await loadOnlineUsers(code);
        renderOnlineUsers(users);
        showToast("Merkez kullanıcı listesi açıldı.");
      } catch (error) {
        renderLocalUsersAsFallback(error && error.message ? error.message : "Merkeze bağlanılamadı.");
        showToast("Merkeze bağlanılamadı, cihaz kayıtları gösteriliyor.");
      }
    }

    function lockRegisteredUsers() {
      sessionStorage.removeItem("mesaha_admin_users_visible");
      document.body.classList.remove("admin-users-visible");
      showToast("Kayıtlı kullanıcılar gizlendi.");
    }

    function restoreAdminUsersVisibility() {
      if (sessionStorage.getItem("mesaha_admin_users_visible") === "1") {
        document.body.classList.add("admin-users-visible");
      } else {
        document.body.classList.remove("admin-users-visible");
      }
    }


    function initUserLoginSystem() {
      state.userStore = loadUserStore();
      restoreAdminUsersVisibility();
      state.activeUser = findActiveUser();

      if (state.activeUser) {
        registerUserLoginById(state.activeUser.id);
        logOnlineUser(state.activeUser);
        closeUserLogin();
      } else {
        renderRegisteredUsers();
        openUserLogin(false);
      }
    }

    function renderRegisteredUsers() {
      if (!els.registeredUsersList) return;

      const users = state.userStore && Array.isArray(state.userStore.users) ? state.userStore.users : [];
      if (!users.length) {
        els.registeredUsersList.innerHTML = `<div class="empty-user-list">Henüz kullanıcı girişi yok.</div>`;
        return;
      }

      els.registeredUsersList.innerHTML = users.map(user => {
        const active = user.id === (state.userStore ? state.userStore.activeUserId : "");
        return `
          <div class="registered-user-item">
            <div class="registered-user-head">
              <b>${escapeHtml(user.name || "-")}</b>
              ${active ? `<span class="active-user-label">AKTİF</span>` : `<span class="registered-source-label local">CİHAZ</span>`}
            </div>
            <div class="registered-user-meta">
              <span>Şeflik: ${escapeHtml(user.seflik || "-")}</span>
              <span>Giriş: ${(Number(user.loginCount) || 0).toLocaleString("tr-TR")}</span>
              <span>İlk: ${escapeHtml(user.firstLogin || "-")}</span>
              <span>Son: ${escapeHtml(user.lastLogin || "-")}</span>
            </div>
          </div>
        `;
      }).join("");
    }


    function load() {
      try {
        state.records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      } catch {
        state.records = [];
      }

      try {
        state.settings = { ...state.settings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
      } catch {}

      state.settings.productionDate = todayISO();
      state.settings.visibleProducts = normalizeVisibleProducts(state.settings.visibleProducts);
      renderProductButtons();
      syncWoodTypePanel();
      initTreeTypePanel();

      els.barcode.value = state.settings.lastBarcode || "A102682";
      if (els.bolmeNo) els.bolmeNo.value = state.settings.bolmeNo || "";
      if (els.seflik) els.seflik.value = state.settings.seflik || "";
      if (els.ekipNot) els.ekipNot.value = state.settings.ekipNot || "";
      els.productionDate.value = todayISO();
      els.length.value = state.settings.lastLength || "3";
      els.quantity.value = state.settings.lastQuantity || "1";
      setTreeType(state.settings.lastTreeType || "Karaçam", false);
      setProductType(state.settings.lastProductType || "Tomruk", false);
      setQualityClass("", false);

      renderRecentChips();
      updateInputPlaceholders();
      updateLiveDesi();
      setupOfflineSupport();
      registerDailyVisit();
      initKeyboardAwareToast();
      initUserLoginSystem();
      disableIosAutofillToolbarHints();
      updateProductRuleHint();
      updateDuplicateWarning();
      render();
      forceRefreshSummaryCards();
      updateSoundButton();
      focusDiameterKeepKeyboard();
    }

    function saveRecords() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
    }

    function saveSettings() {
      state.settings.lastBarcode = els.barcode.value.trim();
      state.settings.bolmeNo = els.bolmeNo ? els.bolmeNo.value.trim() : "";
      state.settings.seflik = els.seflik ? els.seflik.value.trim() : "";
      state.settings.ekipNot = els.ekipNot ? els.ekipNot.value.trim() : "";
      state.settings.productionDate = els.productionDate.value || todayISO();
      state.settings.lastProductType = els.productType.value;
      state.settings.lastTreeType = normalizeTreeType(els.treeType ? els.treeType.value : state.settings.lastTreeType || "Karaçam");
      state.settings.lastQualityClass = "";
      state.settings.lastLength = els.length.value;
      const currentDiameterForPlaceholder = String(els.diameter ? els.diameter.value || "" : "").trim();
      if (currentDiameterForPlaceholder) state.settings.lastDiameter = currentDiameterForPlaceholder;
      state.settings.lastQuantity = els.quantity.value || "1";
      state.settings.visibleProducts = normalizeVisibleProducts(state.settings.visibleProducts);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    }

    function calculateDesi(diameter, length, quantity = 1) {
      const d = Number(diameter);
      const l = Number(length);
      const q = Number(quantity || 1);
      if (!d || !l || !q) return 0;
      return Math.round(0.00007854 * d * d * l * 1000 * q);
    }

    function validateBarcode(value) {
      const barcode = String(value || "").trim();

      if (barcode.length < 9) {
        showErrorToast("Barkod en az 9 karakter olmalı. Örn: A17265597");
        try { els.barcode.focus({ preventScroll: true }); } catch { els.barcode.focus(); }
        return false;
      }

      return true;
    }

    function validateDiameterByProduct(productType, diameter, length) {
      const d = Number(diameter);
      const l = Number(length);

      if (productType === "Tomruk" && d < 21) {
        showErrorToast("Tomruk 21 çapından küçük olmaz.");
        focusDiameterKeepKeyboard();
        return false;
      }

      if (productType === "Maden Direk" && d > 20) {
        showErrorToast("Maden direği 20 çapından büyük olmaz.");
        focusDiameterKeepKeyboard();
        return false;
      }

      if (productType === "Sanayi Odunu") {
        if (d < 12) {
          showErrorToast("Sanayi odunu 12 çapından küçük olmaz.");
          focusDiameterKeepKeyboard();
          return false;
        }
        if (l < 0.5 || l > 1.45) {
          showErrorToast("Sanayi odununda boy 0,50 ile 1,45 metre arasında olmalı.");
          try { els.length.focus({ preventScroll: true }); } catch { els.length.focus(); }
          return false;
        }
      }

      if (productType === "Tel Direk") {
        if (d < 12 || d > 40) {
          showErrorToast("Tel direği çapı 12 ile 40 arasında olmalı.");
          focusDiameterKeepKeyboard();
          return false;
        }
        if (l < 6.5 || l > 25) {
          showErrorToast("Tel direğinde boy 6,5 ile 25 metre arasında olmalı.");
          try { els.length.focus({ preventScroll: true }); } catch { els.length.focus(); }
          return false;
        }
      }

      return true;
    }

    function formatHacimFromDesi(desi) {
      const value = (Number(desi) || 0) / 1000;
      return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
    }

    function formatBoy(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return "";
      return Number.isInteger(n) ? String(n) : String(n).replace(",", ".");
    }

    function incrementBarcode(value) {
      const raw = String(value || "").trim();
      const match = raw.match(/^(.*?)(\d+)$/);
      if (!match) return raw;
      const prefix = match[1];
      const numText = match[2];
      const nextNumber = String(Number(numText) + 1);
      return prefix + nextNumber.padStart(numText.length, "0");
    }

    function normalizeProductClass(type) {
      if (type === "Tomruk") return "tomruk";
      if (type === "Maden Direk") return "maden";
      if (type === "Kağıtlık") return "kagit";
      if (type === "Sanayi Odunu") return "sanayi";
      if (type === "Tel Direk") return "tel";
      return "tomruk";
    }

    function formatDateTime(date = new Date()) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function disableIosAutofillToolbarHints() {
      document.querySelectorAll("input, textarea, select").forEach((el) => {
        el.setAttribute("autocomplete", "off");
        el.setAttribute("autocorrect", "off");
        el.setAttribute("autocapitalize", "off");
        el.setAttribute("spellcheck", "false");

        if (el.id === "diameter" || el.id === "quantity") {
          el.setAttribute("inputmode", "numeric");
        }

        if (el.id === "length") {
          el.setAttribute("inputmode", "decimal");
        }
      });
    }


    function handleEnterToSave(event) {
      const key = event.key || "";
      if (key !== "Enter") return;

      const target = event.target;
      if (!target || !["INPUT", "SELECT"].includes(target.tagName)) return;

      event.preventDefault();

      if (target.id === "length") {
        els.diameter.focus();
        return;
      }

      if (target.id === "diameter" || target.id === "barcode" || target.id === "quantity" || target.id === "productionDate") {
        els.form.requestSubmit ? els.form.requestSubmit() : els.submitBtn.click();
      }
    }

    function setupOfflineSupport() {
      try {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.register("./service-worker.js").catch(() => {});
        }

        if (navigator.storage && navigator.storage.persist) {
          navigator.storage.persist().catch(() => {});
        }

        const updateOnlineState = () => {
          document.body.classList.toggle("offline-mode", !navigator.onLine);
        };

        window.addEventListener("online", updateOnlineState);
        window.addEventListener("offline", updateOnlineState);
        updateOnlineState();
      } catch (err) {}
    }

    function showToast(message) {
      if (!els.toast) return;

      clearTimeout(showToast.timer);
      clearTimeout(showToast.cleaner);

      els.toast.classList.remove("show", "visible", "active");
      els.toast.textContent = String(message || "");

      void els.toast.offsetWidth;

      enhanceToastGlass();
      els.toast.classList.add("show");

      showToast.timer = setTimeout(() => {
        els.toast.classList.remove("show", "visible", "active");
        showToast.cleaner = setTimeout(() => {
          els.toast.textContent = "";
        }, 220);
      }, 2200);
    }

    function focusDiameterKeepKeyboard() {
      // Mobilde kaydetten sonra çap alanı aktif kalsın; klavye kapanmasın.
      // İlk odak doğrudan kullanıcı işlemi içinde yapılır; sonraki odaklar sadece sağlamlaştırma içindir.
      try {
        els.diameter.focus({ preventScroll: true });
        const nowLen = String(els.diameter.value || "").length;
        try { els.diameter.setSelectionRange(nowLen, nowLen); } catch {}
      } catch {}
      requestAnimationFrame(() => {
        try {
          els.diameter.focus({ preventScroll: true });
          const len = String(els.diameter.value || "").length;
          try { els.diameter.setSelectionRange(len, len); } catch {}
        } catch {}
      });
      setTimeout(() => {
        try { els.diameter.focus({ preventScroll: true }); } catch {}
      }, 80);
      setTimeout(() => {
        try { els.diameter.focus({ preventScroll: true }); } catch {}
      }, 180);
    }

    function updateSoundButton() {
      if (!els.soundToggleBtn) return;
      els.soundToggleBtn.textContent = state.settings.soundEnabled === false ? "Ses: Kapalı" : "Ses: Açık";
    }

    function playSuccessSound() {
      if (state.settings.soundEnabled === false) return;

      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = playSuccessSound.ctx || new AudioContext();
        playSuccessSound.ctx = ctx;

        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const now = ctx.currentTime;

        // Market barkod okuyucu tarzı: kısa, net, tok tek bip.
        // Bir ana kare dalga + hafif yüksek harmonik ile daha belirgin duyulur.
        const master = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const oscMain = ctx.createOscillator();
        const oscSharp = ctx.createOscillator();
        const gainMain = ctx.createGain();
        const gainSharp = ctx.createGain();

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(2050, now);
        filter.Q.setValueAtTime(3.8, now);

        master.connect(ctx.destination);
        filter.connect(master);

        // Genel ses zarfı: hızlı gir, kısa ve temiz çık.
        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(0.95, now + 0.008);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 0.135);

        oscMain.type = "square";
        oscMain.frequency.setValueAtTime(1900, now);
        oscMain.frequency.exponentialRampToValueAtTime(1780, now + 0.12);

        oscSharp.type = "triangle";
        oscSharp.frequency.setValueAtTime(2650, now);
        oscSharp.frequency.exponentialRampToValueAtTime(2450, now + 0.10);

        gainMain.gain.setValueAtTime(0.9, now);
        gainSharp.gain.setValueAtTime(0.28, now);

        oscMain.connect(gainMain);
        oscSharp.connect(gainSharp);
        gainMain.connect(filter);
        gainSharp.connect(filter);

        oscMain.start(now);
        oscSharp.start(now);
        oscMain.stop(now + 0.14);
        oscSharp.stop(now + 0.11);

        // Barkod okundu hissi için çok kısa titreşim.
        if (navigator.vibrate) {
          navigator.vibrate(35);
        }
      } catch (err) {
        // Ses desteklenmezse program normal çalışmaya devam eder.
      }
    }

    function toggleSound() {
      state.settings.soundEnabled = !(state.settings.soundEnabled !== false);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
      updateSoundButton();

      if (state.settings.soundEnabled !== false) {
        playSuccessSound();
        showToast("Onay sesi açıldı.");
      } else {
        showToast("Onay sesi kapatıldı.");
      }
    }

    function showSuccessToast(message) {
      if (els.toast) {
        els.toast.classList.remove("error-toast");
        els.toast.classList.add("success-toast");
      }
      showToast(message);
    }

    function showErrorToast(message) {
      if (els.toast) {
        els.toast.classList.remove("success-toast");
        els.toast.classList.add("error-toast");
      }
      showToast(message);
    }

    function normalizeProductType(type) {
      const t = String(type || "").trim();

      if (t === "Kağıtlık Odun" || t === "Kagitlik Odun" || t === "Kağıtlık") return "Kağıtlık";
      if (t === "Maden Direği" || t === "Maden Diregi" || t === "Maden Direk") return "Maden Direk";
      if (t === "Tel Direği" || t === "Tel Diregi" || t === "Tel Direk") return "Tel Direk";
      if (t === "Sanayi" || t === "Sanayi Odunu") return "Sanayi Odunu";
      if (t === "Tomruk") return "Tomruk";

      return t || "Tomruk";
    }

    function productDisplayName(type) {
      if (type === "Maden Direk") return "maden direği";
      if (type === "Kağıtlık") return "kağıtlık";
      if (type === "Sanayi Odunu") return "sanayi odunu";
      if (type === "Tel Direk") return "tel direği";
      return "tomruk";
    }

    function productRuleText(type) {
      if (type === "Tomruk") return "Tomruk: çap 21 ve üzeri girilebilir.";
      if (type === "Maden Direk") return "Maden direği: çap 20 ve altı girilebilir.";
      if (type === "Sanayi Odunu") return "Sanayi odunu: çap 12 ve üzeri, boy 0,50 - 1,45 m arasında olmalı.";
      if (type === "Tel Direk") return "Tel direği: çap 12 - 40, boy 6,5 - 25 m arasında olmalı.";
      if (type === "Kağıtlık") return "Kağıtlık odun: çap sınırı yoktur.";
      return "Seçili odun türünün kuralına göre giriş yapınız.";
    }

    function updateProductRuleHint() {
      if (!els.productRuleHint) return;
      els.productRuleHint.textContent = productRuleText(els.productType.value);
    }

    function updateDuplicateWarning() {
      if (!els.duplicateWarning) return;
      const barcode = String(els.barcode.value || "").trim();
      const exists = barcode && state.records.some(r => String(r.barcode || "").trim() === barcode && r.id !== state.editingId);

      if (exists) {
        els.duplicateWarning.textContent = "Dikkat: Bu barkod daha önce kullanılmış. Aynı barkod ikinci kez kaydedilemez.";
        els.duplicateWarning.classList.add("show");
      } else {
        els.duplicateWarning.textContent = "";
        els.duplicateWarning.classList.remove("show");
      }
    }

    function maybeShowBackupReminder() {
      const totalAdet = state.records.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
      const reminderPoint = Math.floor(totalAdet / 200) * 200;

      if (reminderPoint < 200) return;
      if (Number(state.settings.lastBackupReminderCount || 0) >= reminderPoint) return;

      state.settings.lastBackupReminderCount = reminderPoint;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));

      setTimeout(() => {
        showErrorToast(`${reminderPoint} adet/ağaç girildi. Yedek almayı unutmayın.`);
      }, 900);
    }

    function sanitizeFilePart(value) {
      return String(value || "")
        .trim()
        .replace(/[ğĞ]/g, "g")
        .replace(/[üÜ]/g, "u")
        .replace(/[şŞ]/g, "s")
        .replace(/[ıİ]/g, "i")
        .replace(/[öÖ]/g, "o")
        .replace(/[çÇ]/g, "c")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 40);
    }

    function formatShortNumber(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return String(value || "");
      return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
    }

    function normalizeTreeType(type) {
      const raw = String(type || "").trim();

      if (TREE_MAP[raw]) return raw;
      if (raw === "Saricam" || raw === "Sarıçam" || raw === "Sariçam" || raw === "Sariçam") return "Sarıçam";
      if (raw === "Kizilcam" || raw === "Kızılçam" || raw === "Kizilçam") return "Kızılçam";
      if (raw === "Goknar" || raw === "Göknar") return "Göknar";
      if (raw === "Sedir") return "Sedir";

      return "Karaçam";
    }

    function getTreeInfo(type) {
      return TREE_MAP[normalizeTreeType(type)] || TREE_MAP["Karaçam"];
    }

    function normalizeTreeClass(type) {
      const key = normalizeTreeType(type);
      if (key === "Sarıçam") return "tree-saricam";
      if (key === "Sedir") return "tree-sedir";
      if (key === "Göknar") return "tree-goknar";
      if (key === "Kızılçam") return "tree-kizilcam";
      return "tree-karacam";
    }

    function syncTreeTypePanel() {
      if (!els.treeTypePanel) return;
      const current = normalizeTreeType((els.treeType && els.treeType.value) || state.settings.lastTreeType || "Karaçam");

      els.treeTypePanel.querySelectorAll("input[type='radio']").forEach(input => {
        const isSelected = input.value === current;
        input.checked = isSelected;
        const label = input.closest("label");
        if (label) label.classList.toggle("tree-selected", isSelected);
      });
    }

    function setTreeType(type, persist = true) {
      const key = normalizeTreeType(type);
      const info = getTreeInfo(key);

      if (els.treeType) els.treeType.value = key;
      if (els.treeTypeCurrent) els.treeTypeCurrent.textContent = info.agacAdi;
      if (els.speciesPill) els.speciesPill.textContent = info.agacAdi;
      if (els.treeTypeSelectBtn) els.treeTypeSelectBtn.textContent = "Ağaç Türü Seç: " + info.agacAdi;

      syncTreeTypePanel();

      if (persist) saveSettings();
    }

    function applyTreeTypeSelection() {
      if (!els.treeTypePanel) return;
      const selected = els.treeTypePanel.querySelector("input[type='radio']:checked");
      setTreeType(selected ? selected.value : "Karaçam", true);
      els.treeTypePanel.classList.remove("open");
      showSuccessToast("Ağaç türü seçimi güncellendi.");
    }

    function initTreeTypePanel() {
      if (els.treeTypeSelectBtn && !els.treeTypeSelectBtn.dataset.bound) {
        els.treeTypeSelectBtn.dataset.bound = "1";
        els.treeTypeSelectBtn.addEventListener("pointerdown", (event) => event.preventDefault());
        els.treeTypeSelectBtn.addEventListener("click", () => {
          syncTreeTypePanel();
          els.treeTypePanel.classList.toggle("open");
        });
      }

      if (els.treeTypeApplyBtn && !els.treeTypeApplyBtn.dataset.bound) {
        els.treeTypeApplyBtn.dataset.bound = "1";
        els.treeTypeApplyBtn.addEventListener("pointerdown", (event) => event.preventDefault());
        els.treeTypeApplyBtn.addEventListener("click", applyTreeTypeSelection);
      }
    }

    function normalizeVisibleProducts(list) {
      const current = Array.isArray(list) ? list : PRODUCT_ORDER;
      const cleaned = current.filter(p => PRODUCT_MAP[p]);
      return cleaned.length ? cleaned : ["Tomruk"];
    }

    function renderProductButtons() {
      state.settings.visibleProducts = normalizeVisibleProducts(state.settings.visibleProducts);
      if (!els.productBoxes) return;

      els.productBoxes.innerHTML = state.settings.visibleProducts.map(type => {
        const product = PRODUCT_MAP[type];
        return `<div class="product-box" data-product="${escapeHtml(type)}">${escapeHtml(product.shortName || product.odunAdi)}</div>`;
      }).join("");

      els.productBoxes.querySelectorAll(".product-box").forEach(box => {
        box.addEventListener("pointerdown", (event) => event.preventDefault());
        box.addEventListener("click", () => setProductType(box.dataset.product, true));
      });
    }

    function syncWoodTypePanel() {
      if (!els.woodTypePanel) return;
      const visible = normalizeVisibleProducts(state.settings.visibleProducts);
      els.woodTypePanel.querySelectorAll("input[type='checkbox']").forEach(input => {
        input.checked = visible.includes(input.value);
      });
    }

    function applyWoodTypeSelection() {
      if (!els.woodTypePanel) return;
      const selected = Array.from(els.woodTypePanel.querySelectorAll("input[type='checkbox']:checked")).map(input => input.value).filter(p => PRODUCT_MAP[p]);
      state.settings.visibleProducts = normalizeVisibleProducts(selected);
      if (!state.settings.visibleProducts.includes(els.productType.value)) {
        els.productType.value = state.settings.visibleProducts[0];
      }
      renderProductButtons();
      setProductType(els.productType.value, false);
      saveSettings();
      els.woodTypePanel.classList.remove("open");
      showSuccessToast("Odun türü seçimi güncellendi.");
    }

    function setProductType(type, persist = true) {
      if (!PRODUCT_MAP[type]) type = "Tomruk";
      if (!state.settings.visibleProducts.includes(type)) {
        state.settings.visibleProducts = normalizeVisibleProducts([...state.settings.visibleProducts, type]);
        renderProductButtons();
        syncWoodTypePanel();
      }

      els.productType.value = type;
      document.body.classList.remove("product-tomruk", "product-maden", "product-kagit", "product-sanayi", "product-tel");
      document.body.classList.add("product-" + normalizeProductClass(type));
      els.productBoxes.querySelectorAll(".product-box").forEach(box => {
        box.classList.toggle("active", box.dataset.product === type);
      });

      const d = Number(els.diameter.value || 0);
      const l = Number(els.length.value || 0);
      if (d) validateDiameterByProduct(type, d, l || 0);

      updateProductRuleHint();
      updateDuplicateWarning();

      if (persist) saveSettings();
      focusDiameterKeepKeyboard();
    }

    function setQualityClass(cls, persist = true) {
      els.qualityClass.value = cls || "2";
      if (els.woodTypeSelectBtn) {
      els.woodTypeSelectBtn.addEventListener("pointerdown", (event) => event.preventDefault());
      els.woodTypeSelectBtn.addEventListener("click", () => {
        syncWoodTypePanel();
        els.woodTypePanel.classList.toggle("open");
      });
    }

    if (els.woodTypeApplyBtn) {
      els.woodTypeApplyBtn.addEventListener("pointerdown", (event) => event.preventDefault());
      els.woodTypeApplyBtn.addEventListener("click", applyWoodTypeSelection);
    }

    els.classBoxes.querySelectorAll(".class-box").forEach(box => {
        box.classList.toggle("active", box.dataset.class === els.qualityClass.value);
      });
      if (persist) saveSettings();
    }

    function setEditMode(recordId) {
      state.editingId = recordId;
      const active = Boolean(recordId);
      document.body.classList.toggle("editing", active);
      els.cancelEditBtn.style.display = active ? "block" : "none";
      els.submitBtn.textContent = active ? "Kaydı Güncelle" : "Kaydet";
      if (active) showToast("Kayıt düzenleme için açıldı.");
    }

    function cancelEditMode(returnBarcode = null) {
      const barcodeToRestore = returnBarcode || state.editingReturnBarcode || state.settings.lastBarcode || els.barcode.value;

      state.editingId = null;
      state.editingReturnBarcode = "";
      document.body.classList.remove("editing");
      els.cancelEditBtn.style.display = "none";
      els.submitBtn.textContent = "Kaydet";

      if (barcodeToRestore) els.barcode.value = barcodeToRestore;

      els.diameter.value = "";
      els.quantity.value = "1";
      updateInputPlaceholders();
      updateLiveDesi();
      updateDuplicateWarning();
      focusDiameterKeepKeyboard();
    }

    function limitDiameterToTwoDigits() {
      if (!els.diameter) return;
      let value = String(els.diameter.value || "").replace(/\D/g, "");
      if (els.diameter.value !== value) els.diameter.value = value;
    }

    function updateLiveDesi() {
      limitDiameterToTwoDigits();
      const desi = calculateDesi(els.diameter.value, els.length.value, els.quantity.value);
      if (els.liveDesi) els.liveDesi.textContent = formatHacimFromDesi(desi) + " m³";
      if (els.liveHacim) els.liveHacim.textContent = "Boş";
    }

    function recordToSystemRow(record) {
      const product = PRODUCT_MAP[record.productType] || PRODUCT_MAP["Tomruk"];
      const tree = getTreeInfo(record.treeType || record.species || "Karaçam");
      const kalite = "";
      return {
        agacId: tree.agacId,
        agacAdi: tree.agacAdi,
        odunId: product.odunId,
        odunAdi: product.odunAdi,
        kaliteSinifi: kalite,
        boySinifi: "",
        adet: Number(record.quantity || 1),
        cap: Number(record.diameter || 0),
        boy: formatBoy(record.length),
        hacim: "",
        uretimTarihi: record.uretimTarihi || isoToTRDate(record.productionDate) || isoToTRDate(todayISO()),
        barkodNo: record.barcode || ""
      };
    }


    function getActiveKesimciForSaveV163() {
      try {
        const s = state && state.settings ? String(state.settings.activeKesimciV158 || "").trim().replace(/\s+/g, " ") : "";
        if (s) return s;
      } catch {}
      try {
        const btn = document.querySelector(".cutter-chip-v163.active[data-cutter-select-v163], .cutter-chip-v162.active[data-cutter-select-v162]");
        const val = btn ? String(btn.getAttribute("data-cutter-select-v163") || btn.getAttribute("data-cutter-select-v162") || "").trim().replace(/\s+/g, " ") : "";
        if (val) return val;
      } catch {}
      try {
        const sel = document.getElementById("cutterSelectV158");
        const val = sel ? String(sel.value || "").trim().replace(/\s+/g, " ") : "";
        if (val) return val;
      } catch {}
      return "";
    }

    function applyKesimciToRecordV163(rec, name) {
      if (!rec) return;
      const cutter = String(name || "").trim().replace(/\s+/g, " ");
      if (cutter) {
        rec.kesimci = cutter;
        rec.kesimciAdi = cutter;
        rec.cutterName = cutter;
      } else {
        delete rec.kesimci;
        delete rec.kesimciAdi;
        delete rec.cutterName;
      }
    }

    function addRecord(event) {
      event.preventDefault();

      const barcode = els.barcode.value.trim();
      const productType = els.productType.value;
      const treeType = normalizeTreeType(els.treeType ? els.treeType.value : state.settings.lastTreeType || "Karaçam");
      const qualityClass = els.qualityClass.value || "2";
      const productionDate = els.productionDate.value || todayISO();
      const length = Number(els.length.value);
      limitDiameterToTwoDigits();
      const diameter = Number(els.diameter.value);
      const quantity = Number(els.quantity.value || 1);
      const selectedKesimciV163 = getActiveKesimciForSaveV163();

      if (!barcode) return showErrorToast("Barkod boş olamaz.");
      if (!validateBarcode(barcode)) return;

      const duplicateBarcode = state.records.some(r => String(r.barcode || "").trim() === barcode && r.id !== state.editingId);
      if (duplicateBarcode) {
        updateDuplicateWarning();
        try { navigator.vibrate && navigator.vibrate(80); } catch {}
        return showErrorToast("Bu barkod daha önce kayıtlı. Aynı barkod ikinci kez kaydedilemez.");
      }
      if (!productionDate) return showErrorToast("Üretim tarihi gir.");
      if (!length || length <= 0) {
        showErrorToast("Boy bilgisi gir.");
        focusDiameterKeepKeyboard();
        return;
      }
      if (!diameter || diameter <= 0) {
        focusDiameterKeepKeyboard();
        return;
      }
      if (!quantity || quantity <= 0) {
        showErrorToast("Adet en az 1 olmalı.");
        focusDiameterKeepKeyboard();
        return;
      }
      if (!validateDiameterByProduct(productType, diameter, length)) return;

      const desi = calculateDesi(diameter, length, quantity);

      if (state.editingId) {
        const rec = state.records.find(r => r.id === state.editingId);
        if (!rec) {
          cancelEditMode();
          return showErrorToast("Düzenlenecek kayıt bulunamadı.");
        }

        rec.barcode = barcode;
        rec.treeType = treeType;
        rec.species = treeType;
        rec.productType = productType;
        rec.qualityClass = "";
        rec.productionDate = productionDate;
        rec.uretimTarihi = isoToTRDate(productionDate);
        rec.length = length;
        rec.diameter = diameter;
        rec.quantity = quantity;
        rec.desi = desi;
        rec.hacim = formatHacimFromDesi(desi);
        rec.updatedAt = formatDateTime();
        applyKesimciToRecordV163(rec, selectedKesimciV163);

        addRecentValue("recentLengths", length);
        addRecentValue("recentDiameters", diameter);
        state.settings.lastDiameter = normalizeRecentValue(diameter);
        renderRecentChips();
        updateInputPlaceholders();

        const returnBarcode = state.editingReturnBarcode || state.settings.lastBarcode || incrementBarcode(barcode);

        saveRecords();
        render();
        forceRefreshSummaryCards();
        playSuccessSound();
        showSuccessToast(`${formatShortNumber(diameter)} çap ${formatShortNumber(length)} boy ${productDisplayName(productType)} güncellendi`);
        updateDuplicateWarning();
        cancelEditMode(returnBarcode);
        saveSettings();
        return;
      }

      const record = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        barcode,
        treeType,
        species: treeType,
        productType,
        qualityClass: "",
        productionDate,
        uretimTarihi: isoToTRDate(productionDate),
        length,
        diameter,
        quantity,
        desi,
        hacim: formatHacimFromDesi(desi),
        createdAt: formatDateTime(),
        kesimci: selectedKesimciV163 || "",
        kesimciAdi: selectedKesimciV163 || "",
        cutterName: selectedKesimciV163 || ""
      };

      state.records.unshift(record);
      try { usageRecordEntryV128(record); } catch {}

      addRecentValue("recentLengths", length);
      addRecentValue("recentDiameters", diameter);
      state.settings.lastDiameter = normalizeRecentValue(diameter);
      renderRecentChips();
      updateInputPlaceholders();

      saveRecords();

      saveSettings();

      state.sameBarcodeMode = false;
      els.barcode.value = incrementBarcode(barcode);

      els.diameter.value = "";
      els.quantity.value = "1";

      saveSettings();
      updateLiveDesi();
      render();
      forceRefreshSummaryCards();

      playSuccessSound();
      showSuccessToast(`${formatShortNumber(diameter)} çap ${formatShortNumber(length)} boy ${productDisplayName(productType)} eklendi`);
      updateDuplicateWarning();
      maybeShowBackupReminder();
      focusDiameterKeepKeyboard();
    }

    function showUndoBanner(message) {
      if (!els.undoBanner) return;
      clearTimeout(showUndoBanner.timer);
      els.undoMessage.textContent = message || "Kayıt silindi.";
      els.undoBanner.classList.add("show");
      showUndoBanner.timer = setTimeout(() => {
        if (els.undoBanner) els.undoBanner.classList.remove("show");
      }, 9000);
    }

    function hideUndoBanner() {
      if (els.undoBanner) els.undoBanner.classList.remove("show");
      state.lastUndo = null;
    }

    function undoLastDelete() {
      if (!state.lastUndo) return showToast("Geri alınacak kayıt yok.");

      if (state.lastUndo.type === "single" && state.lastUndo.record) {
        const index = Math.max(0, Math.min(state.lastUndo.index || 0, state.records.length));
        state.records.splice(index, 0, state.lastUndo.record);
      }

      if (state.lastUndo.type === "all" && Array.isArray(state.lastUndo.records)) {
        state.records = state.lastUndo.records;
      }

      saveRecords();
      render();
      forceRefreshSummaryCards();
      hideUndoBanner();
      showSuccessToast("Silme işlemi geri alındı.");
    }

    function deleteRecord(id) {
      const rec = state.records.find(r => r.id === id);
      if (!rec) return;
      if (!confirm(`${rec.barcode} kaydı silinsin mi?`)) return;

      const index = state.records.findIndex(r => r.id === id);
      state.lastUndo = { type: "single", record: rec, index };
      state.records = state.records.filter(r => r.id !== id);

      saveRecords();
      render();
      forceRefreshSummaryCards();
      showUndoBanner(`${rec.barcode} silindi.`);
      showToast("Kayıt silindi. Geri almak için Kayıtlar bölümündeki Geri Al butonunu kullanın.");
    }

    function editRecord(id) {
      const rec = state.records.find(r => r.id === id);
      if (!rec) return;
      state.editingReturnBarcode = els.barcode.value || state.settings.lastBarcode || "";
      els.barcode.value = rec.barcode;
      els.productionDate.value = rec.productionDate || trDateToISO(rec.uretimTarihi);
      setTreeType(rec.treeType || rec.species || state.settings.lastTreeType || "Karaçam", true);
      setProductType(rec.productType || "Tomruk", true);
      setQualityClass("", true);
      els.length.value = rec.length;
      els.diameter.value = rec.diameter;
      els.quantity.value = rec.quantity || 1;
      updateLiveDesi();
      setEditMode(id);

      document.body.classList.remove("show-records", "show-guide");
      els.navEntry.classList.add("active");
      els.navRecords.classList.remove("active");
      if (els.navGuide) els.navGuide.classList.remove("active");
      if (els.navAdmin) els.navAdmin.classList.remove("active");
      focusDiameterKeepKeyboard();
    }

    function forceRefreshSummaryCards() {
      const totals = {
        all: 0,
        adet: 0,
        Tomruk: 0,
        TomrukAdet: 0,
        "Maden Direk": 0,
        MadenAdet: 0,
        "Kağıtlık": 0,
        KagitAdet: 0,
        "Sanayi Odunu": 0,
        SanayiAdet: 0,
        "Tel Direk": 0,
        TelAdet: 0
      };

      for (const r of state.records) {
        const qty = Number(r.quantity) || 0;
        const val = Number(r.desi) || 0;
        const key = normalizeProductType(r.productType || "Tomruk");

        totals.all += val;
        totals.adet += qty;

        if (Object.prototype.hasOwnProperty.call(totals, key)) {
          totals[key] += val;
        }

        if (key === "Tomruk") totals.TomrukAdet += qty;
        if (key === "Maden Direk") totals.MadenAdet += qty;
        if (key === "Kağıtlık") totals.KagitAdet += qty;
        if (key === "Sanayi Odunu") totals.SanayiAdet += qty;
        if (key === "Tel Direk") totals.TelAdet += qty;
      }

      if (els.totalDesi) els.totalDesi.textContent = formatHacimFromDesi(totals.all);
      if (els.totalAdet) els.totalAdet.textContent = totals.adet.toLocaleString("tr-TR");
      if (els.totalTomruk) els.totalTomruk.textContent = formatHacimFromDesi(totals.Tomruk) + " m³";
      if (els.totalTomrukAdet) els.totalTomrukAdet.textContent = totals.TomrukAdet.toLocaleString("tr-TR") + " adet";
      if (els.totalMaden) els.totalMaden.textContent = formatHacimFromDesi(totals["Maden Direk"]) + " m³";
      if (els.totalMadenAdet) els.totalMadenAdet.textContent = totals.MadenAdet.toLocaleString("tr-TR") + " adet";
      if (els.totalKagit) els.totalKagit.textContent = formatHacimFromDesi(totals["Kağıtlık"]) + " m³";
      if (els.totalKagitAdet) els.totalKagitAdet.textContent = totals.KagitAdet.toLocaleString("tr-TR") + " adet";
      if (els.totalSanayi) els.totalSanayi.textContent = formatHacimFromDesi(totals["Sanayi Odunu"]) + " m³";
      if (els.totalSanayiAdet) els.totalSanayiAdet.textContent = totals.SanayiAdet.toLocaleString("tr-TR") + " adet";
      if (els.totalTel) els.totalTel.textContent = formatHacimFromDesi(totals["Tel Direk"]) + " m³";
      if (els.totalTelAdet) els.totalTelAdet.textContent = totals.TelAdet.toLocaleString("tr-TR") + " adet";

      const setPrintZero = (el, adet, hacim) => {
        const card = el ? el.closest(".stat") : null;
        if (!card) return;
        card.classList.toggle("print-zero", !(Number(adet) || Number(hacim)));
      };

      setPrintZero(els.totalTomruk, totals.TomrukAdet, totals.Tomruk);
      setPrintZero(els.totalMaden, totals.MadenAdet, totals["Maden Direk"]);
      setPrintZero(els.totalKagit, totals.KagitAdet, totals["Kağıtlık"]);
      setPrintZero(els.totalSanayi, totals.SanayiAdet, totals["Sanayi Odunu"]);
      setPrintZero(els.totalTel, totals.TelAdet, totals["Tel Direk"]);
    }


    function sameDateISO(dateValue, todayIso) {
      const iso = String(dateValue || "").slice(0, 10);
      return iso === todayIso;
    }

    function renderDailyWorkSummary() {
      if (!els.dailyRecordCount) return;

      const todayIso = todayISO();
      const todaysRecords = state.records.filter(r => sameDateISO(r.productionDate || trDateToISO(r.uretimTarihi), todayIso));

      const adet = todaysRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
      const desi = todaysRecords.reduce((sum, r) => sum + (Number(r.desi) || 0), 0);
      const lastBarcode = todaysRecords.length ? (todaysRecords[0].barcode || "-") : "-";

      els.dailyRecordCount.textContent = todaysRecords.length.toLocaleString("tr-TR");
      els.dailyAdetCount.textContent = adet.toLocaleString("tr-TR");
      els.dailyM3Count.textContent = formatHacimFromDesi(desi);
      els.dailyLastBarcode.textContent = lastBarcode;
    }


    function getFilteredRecords() {
      const query = els.searchInput ? els.searchInput.value.trim().toLowerCase() : "";
      return state.records.filter(r => {
        if (!query) return true;
        const sys = recordToSystemRow(r);
        const tree = getTreeInfo(r.treeType || r.species || "Karaçam");
        return [
          r.barcode, tree.agacAdi, r.treeType, r.species, r.productType, sys.odunAdi, r.qualityClass, r.length,
          r.diameter, r.quantity, r.desi, r.uretimTarihi, r.createdAt
        ].join(" ").toLowerCase().includes(query);
      });
    }

    function cleanSelectedRecordIds() {
      if (!state.selectedRecordIds) state.selectedRecordIds = new Set();
      const existing = new Set(state.records.map(r => r.id));
      Array.from(state.selectedRecordIds).forEach(id => {
        if (!existing.has(id)) state.selectedRecordIds.delete(id);
      });
    }

    function updateBulkActions(filtered = getFilteredRecords()) {
      cleanSelectedRecordIds();

      const count = state.selectedRecordIds.size;
      if (els.selectedRecordCount) {
        els.selectedRecordCount.textContent = `${count.toLocaleString("tr-TR")} seçili`;
      }

      const visibleIds = filtered.map(r => r.id);
      const visibleSelected = visibleIds.filter(id => state.selectedRecordIds.has(id)).length;

      if (els.selectAllRecords) {
        els.selectAllRecords.checked = !!visibleIds.length && visibleSelected === visibleIds.length;
        els.selectAllRecords.indeterminate = visibleSelected > 0 && visibleSelected < visibleIds.length;
      }

      [els.bulkDeleteBtn, els.clearSelectionBtn].forEach(btn => {
        if (btn) btn.disabled = count === 0;
      });
    }

    function toggleRecordSelection(id, checked) {
      if (!state.selectedRecordIds) state.selectedRecordIds = new Set();
      if (checked) state.selectedRecordIds.add(id);
      else state.selectedRecordIds.delete(id);
      updateBulkActions();
    }

    function toggleSelectFiltered(checked) {
      const filtered = getFilteredRecords();
      if (!state.selectedRecordIds) state.selectedRecordIds = new Set();

      filtered.forEach(r => {
        if (checked) state.selectedRecordIds.add(r.id);
        else state.selectedRecordIds.delete(r.id);
      });

      render();
    }

    function selectFilteredRecords() {
      toggleSelectFiltered(true);
      showToast("Listedeki kayıtlar seçildi.");
    }

    function clearRecordSelection() {
      if (!state.selectedRecordIds) state.selectedRecordIds = new Set();
      state.selectedRecordIds.clear();
      render();
    }

    function deleteSelectedRecords() {
      const ids = new Set(state.selectedRecordIds || []);
      if (!ids.size) return showToast("Seçili kayıt yok.");

      const selected = state.records.filter(r => ids.has(r.id));
      const ok = confirm(`${selected.length.toLocaleString("tr-TR")} seçili kayıt silinsin mi?`);
      if (!ok) return;

      state.lastUndo = { type: "all", records: state.records.slice() };
      state.records = state.records.filter(r => !ids.has(r.id));
      state.selectedRecordIds.clear();

      saveRecords();
      render();
      forceRefreshSummaryCards();
      showUndoBanner(`${selected.length.toLocaleString("tr-TR")} kayıt silindi.`);
      showToast("Seçilen kayıtlar silindi. Geri Al ile dönebilirsin.");
    }

    function bulkChangeProduct() {
      const ids = new Set(state.selectedRecordIds || []);
      if (!ids.size) return showToast("Seçili kayıt yok.");

      const answer = prompt("Yeni ürün türünü yazın:\nTomruk, Maden, Kağıtlık, Sanayi, Tel");
      if (!answer) return;

      const map = {
        "tomruk": "Tomruk",
        "maden": "Maden Direk",
        "maden direk": "Maden Direk",
        "maden direği": "Maden Direk",
        "maden diregi": "Maden Direk",
        "kağıtlık": "Kağıtlık",
        "kagitlik": "Kağıtlık",
        "kağıtlık odun": "Kağıtlık",
        "kagitlik odun": "Kağıtlık",
        "sanayi": "Sanayi Odunu",
        "sanayi odunu": "Sanayi Odunu",
        "tel": "Tel Direk",
        "tel direk": "Tel Direk",
        "tel direği": "Tel Direk",
        "tel diregi": "Tel Direk"
      };

      const key = foldLocalText ? foldLocalText(answer) : String(answer).trim().toLowerCase();
      const product = map[key] || normalizeProductType(answer);

      if (!PRODUCT_MAP[product]) {
        showToast("Ürün türü bulunamadı.");
        return;
      }

      state.records.forEach(r => {
        if (ids.has(r.id)) r.productType = product;
      });

      saveRecords();
      render();
      forceRefreshSummaryCards();
      showToast(`${ids.size.toLocaleString("tr-TR")} kaydın ürünü değiştirildi.`);
    }

    function bulkChangeTree() {
      const ids = new Set(state.selectedRecordIds || []);
      if (!ids.size) return showToast("Seçili kayıt yok.");

      const answer = prompt("Yeni ağaç türünü yazın:\nKaraçam, Sarıçam, Kızılçam, Sedir, Göknar");
      if (!answer) return;

      const key = foldLocalText ? foldLocalText(answer) : String(answer).trim().toLowerCase();
      const treeMap = {};
      Object.keys(TREE_MAP).forEach(name => {
        treeMap[foldLocalText ? foldLocalText(name) : name.toLowerCase()] = name;
      });

      const treeName = treeMap[key];
      if (!treeName) {
        showToast("Ağaç türü bulunamadı.");
        return;
      }

      state.records.forEach(r => {
        if (ids.has(r.id)) {
          r.treeType = treeName;
          r.species = treeName;
        }
      });

      saveRecords();
      render();
      forceRefreshSummaryCards();
      showToast(`${ids.size.toLocaleString("tr-TR")} kaydın ağaç türü değiştirildi.`);
    }


    function render() {
      const recordsVisibleV189 = !!(document.body.classList.contains("show-records") || (els.navRecords && els.navRecords.classList.contains("active")));

      // v189 performans: Giriş Modu / Yeni Kayıt açıkken ağır kayıt tablosunu yeniden çizme.
      // Tablo sadece Kayıtlar sekmesine girildiğinde üretilir; özetler ve sayaçlar güncel kalır.
      if (!recordsVisibleV189 && !window.__mesahaForceFullRenderV189) {
        cleanSelectedRecordIds();
        if (els.recordsBody) {
          els.recordsBody.innerHTML = "";
          els.recordsBody.dataset.deferredRenderV189 = "1";
        }
        if (els.recordsFoot) els.recordsFoot.innerHTML = "";
        if (els.emptyState) els.emptyState.style.display = "none";
        if (els.recordCount) els.recordCount.textContent = `${state.records.length} kayıt`;
        renderRecentBarcodes();
        renderDailyWorkSummary();
        forceRefreshSummaryCards();
        return;
      }

      const filtered = getFilteredRecords();
      cleanSelectedRecordIds();
      if (els.recordsBody) delete els.recordsBody.dataset.deferredRenderV189;

      els.recordsBody.innerHTML = filtered.map((r) => {
        const sys = recordToSystemRow(r);
        const tree = getTreeInfo(r.treeType || r.species || "Karaçam");
        return `
          <tr class="clickable-row" onclick="editRecord('${r.id}')">
            <td class="select-col"><input class="record-select" type="checkbox" ${state.selectedRecordIds.has(r.id) ? "checked" : ""} onclick="event.stopPropagation()" onchange="toggleRecordSelection('${r.id}', this.checked)" /></td>
            <td>${state.records.length - state.records.indexOf(r)}</td>
            <td><b>${escapeHtml(r.barcode)}</b></td>
            <td><span class="tag tree-tag ${normalizeTreeClass(r.treeType || r.species || "Karaçam")}">${escapeHtml(tree.agacAdi)}</span></td>
            <td><span class="tag ${normalizeProductClass(r.productType)}">${escapeHtml(sys.odunAdi)}</span></td>
            <td class="num">${escapeHtml(sys.boy)}</td>
            <td class="num">${escapeHtml(sys.cap)}</td>
            <td class="num">${escapeHtml(sys.adet)}</td>
            <td class="num">${formatHacimFromDesi(Number(r.desi || 0))} m³</td>
            <td>${escapeHtml(sys.uretimTarihi)}</td>
            <td>
              <button class="mini-btn edit-mini" onclick="event.stopPropagation(); editRecord('${r.id}')">Düzelt</button>
              <button class="mini-btn delete-mini" onclick="event.stopPropagation(); deleteRecord('${r.id}')">Sil</button>
            </td>
          </tr>
        `;
      }).join("");

      els.emptyState.style.display = filtered.length ? "none" : "block";
      updateBulkActions(filtered);
      els.recordCount.textContent = `${state.records.length} kayıt`;
      renderRecentBarcodes();
      renderDailyWorkSummary();

      const totals = {
        all: 0,
        adet: 0,
        Tomruk: 0,
        TomrukAdet: 0,
        "Maden Direk": 0,
        MadenAdet: 0,
        "Kağıtlık": 0,
        KagitAdet: 0,
        "Sanayi Odunu": 0,
        SanayiAdet: 0,
        "Tel Direk": 0,
        TelAdet: 0
      };

      for (const r of state.records) {
        const qty = Number(r.quantity) || 0;
        const value = Number(r.desi) || 0;
        const key = normalizeProductType(r.productType || "Tomruk");

        totals.all += value;
        totals.adet += qty;

        if (Object.prototype.hasOwnProperty.call(totals, key)) {
          totals[key] += value;
        }

        if (key === "Tomruk") totals.TomrukAdet += qty;
        if (key === "Maden Direk") totals.MadenAdet += qty;
        if (key === "Kağıtlık") totals.KagitAdet += qty;
        if (key === "Sanayi Odunu") totals.SanayiAdet += qty;
        if (key === "Tel Direk") totals.TelAdet += qty;
      }

      const filteredTotals = filtered.reduce((acc, r) => {
        acc.adet += Number(r.quantity) || 0;
        acc.desi += Number(r.desi) || 0;
        return acc;
      }, { adet: 0, desi: 0 });

      els.totalDesi.textContent = formatHacimFromDesi(totals.all);
      els.totalAdet.textContent = totals.adet.toLocaleString("tr-TR");
      els.totalTomruk.textContent = formatHacimFromDesi(totals.Tomruk) + " m³";
      if (els.totalTomrukAdet) els.totalTomrukAdet.textContent = totals.TomrukAdet.toLocaleString("tr-TR") + " adet";
      els.totalMaden.textContent = formatHacimFromDesi(totals["Maden Direk"]) + " m³";
      if (els.totalMadenAdet) els.totalMadenAdet.textContent = totals.MadenAdet.toLocaleString("tr-TR") + " adet";
      els.totalKagit.textContent = formatHacimFromDesi(totals["Kağıtlık"]) + " m³";
      if (els.totalKagitAdet) els.totalKagitAdet.textContent = totals.KagitAdet.toLocaleString("tr-TR") + " adet";
      if (els.totalSanayi) els.totalSanayi.textContent = formatHacimFromDesi(totals["Sanayi Odunu"]) + " m³";
      if (els.totalSanayiAdet) els.totalSanayiAdet.textContent = totals.SanayiAdet.toLocaleString("tr-TR") + " adet";
      if (els.totalTel) els.totalTel.textContent = formatHacimFromDesi(totals["Tel Direk"]) + " m³";
      if (els.totalTelAdet) els.totalTelAdet.textContent = totals.TelAdet.toLocaleString("tr-TR") + " adet";

      const setPrintZero = (el, adet, hacim) => {
        const card = el ? el.closest(".stat") : null;
        if (!card) return;
        card.classList.toggle("print-zero", !(Number(adet) || Number(hacim)));
      };

      setPrintZero(els.totalTomruk, totals.TomrukAdet, totals.Tomruk);
      setPrintZero(els.totalMaden, totals.MadenAdet, totals["Maden Direk"]);
      setPrintZero(els.totalKagit, totals.KagitAdet, totals["Kağıtlık"]);
      setPrintZero(els.totalSanayi, totals.SanayiAdet, totals["Sanayi Odunu"]);
      setPrintZero(els.totalTel, totals.TelAdet, totals["Tel Direk"]);

      els.recordsFoot.innerHTML = filtered.length ? `
        <tr class="table-total-row">
          <td colspan="7">Alttaki liste toplamı</td>
          <td class="num">${filteredTotals.adet.toLocaleString("tr-TR")} adet</td>
          <td class="num">${formatHacimFromDesi(filteredTotals.desi)} m³</td>
          <td colspan="2"></td>
        </tr>
      ` : "";
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }


    // v12: Sistemin verdiği Mesaha_Ornek_Temp dosyasına göre gerçek BIFF8 .xls üretir.
    // Ana Mesaha sayfasında boy, hacim ve uretimTarihi SAYI olarak yazılır.
    const S12_GLOBAL_PREFIX_B64 = "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AAAEqyDgABQABwAAAPX/IAAAtAAAAAAAAAAErCDgABQABwAAAPX/IAAAtAAAAAAAAAAEqyDgABQABwAAAPX/IAAAtAAAAAAAAAAEsSDgABQABwAAAPX/IAAAtAAAAAAAAAAEryDgABQABwAAAPX/IAAAtAAAAAAAAAAEliDgABQABwAAAPX/IAAAtAAAAAAAAAAEqyDgABQABwAAAPX/IAAAtAAAAAAAAAAErCDgABQABwAAAPX/IAAAtAAAAAAAAAAEuSDgABQACAAAAPX/IAAA9AAAAAAAAAAAwCDgABQACQAAAPX/IAAA9AAAAAAAAAAAwCDgABQACgAAAPX/IAAA1ABgAAAAGgAAwCDgABQACwAAAPX/IAAA1ABQAAAAHwAAwCDgABQADAAAAPX/IAAA1ABQAAAAFgAAwCDgABQADQAAAPX/IAAA1AAgAACAGAAAwCDgABQADQAAAPX/IAAA9AAAAAAAAAAAwCDgABQAAQCpAPX/IAAA+AAAAAAAAAAAwCDgABQADgAAAPX/IAAAlBERvx+/HwAEliDgABQADwAAAPX/IAAAlBERlwuXCwAEryDgABQAEAAAAPX/IAAAlBERlwuXCwAEliDgABQAEQAAAPX/IAAAlGZmvx+/HwAEtyDgABQAEgAAAPX/IAAAtAAAAAAAAAAEqiDgABQAGQAAAPX/IAAA9AAAAAAAAAAAwCDgABQAGAAAAPX/IAAA9AAAAAAAAAAAwCDgABQAEwAAAPX/IAAAtAAAAAAAAAAErSDgABQABgAAAPX/IAAAnBERFgsWCwAEmiDgABQAFAAAAPX/IAAAtAAAAAAAAAAEqyDgABQAAQCqAPX/IAAA+AAAAAAAAAAAwCDgABQAAQCoAPX/IAAA+AAAAAAAAAAAwCDgABQAFQAAAPX/IAAA1ABhAAA+HwAAwCDgABQAFgAAAPX/IAAA9AAAAAAAAAAAwCDgABQAAQCrAPX/IAAA+AAAAAAAAAAAwCDgABQAFwAAAPX/IAAAtAAAAAAAAAAEviDgABQAFwAAAPX/IAAAtAAAAAAAAAAEtSDgABQAFwAAAPX/IAAAtAAAAAAAAAAEtyDgABQAFwAAAPX/IAAAtAAAAAAAAAAEsyDgABQAFwAAAPX/IAAAtAAAAAAAAAAEsSDgABQAFwAAAPX/IAAAtAAAAAAAAAAEuSDgABQAAQAJ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";
    const S12_GLOBAL_MID_B64 = "mggYAJoIAAAAAAAAAAAAAAEAAAAAAAAAFAAAAKMIEACjCAAAAAAAAAAAAAAAAAAAjAAEAFoAWgCuAQQAAgABBBcACAABAAAAAAAAAMEBCADBAQAAJcMCAA==";
    const S12_GLOBAL_AFTER_SST_B64 = "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";
    const S12_SHEET1_BOF_B64 = "CQgQAAAGEABaT80HyQACAAYIAAA=";
    const S12_SHEET1_PREFIX_B64 = "DQACAAEADAACAGQADwACAAEAEQACAAAAEAAIAPyp8dJNYlA/XwACAAEAKgACAAAAKwACAAAAggACAAEAgAAIAAAAAAAAAAAAJQIEAAAA/wCBAAIAwQQUAAAAFQAAAIMAAgAAAIQAAgAAACYACAAAAAAAAADoPycACAAAAAAAAADoPygACAAAAAAAAADwPykACAAAAAAAAADwP6EAIgABAGQAAQABAAEAAgAsASwBAAAAAAAA4D8AAAAAAADgPwEAnAgmAJwIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAVQACAAgAfQAMAAAACQC2Cw8AAgAAAH0ADAAKAAoAAA4PAAIAAAB9AAwACwALALYLDwACAAAA";
    const S12_SHEET1_TAIL_B64 = "PgISALYGAAAAAEAAAAAAAAAADwAAAIsIEACLCAAAAAAAAAAAAAAAAAoAHQAPAAMDAAgAAAABAAMAAwAICGcIFwBnCAAAAAAAAAAAAAACAAH/////A0QAAAoAAAA=";
    const S12_SHEET2_BOF_B64 = "CQgQAAAGEABaT80HyQACAAYIAAA=";
    const S12_SHEET2_PREFIX_B64 = "DQACAAEADAACAGQADwACAAEAEQACAAAAEAAIAPyp8dJNYlA/XwACAAEAKgACAAAAKwACAAAAggACAAEAgAAIAAAAAAAAAAAAJQIEAAAA/wCBAAIAwQQUAAAAFQAAAIMAAgAAAIQAAgAAACYACABmZmZmZmbmPycACABmZmZmZmbmPygACAAAAAAAAADoPykACAAAAAAAAADoP6EAIgAAAP8AAQABAAEABAACAAH/MzMzMzMz0z8zMzMzMzPTP0EAnAgmAJwIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8MwAAAAAAAAAAVQACAAgAfQAMAAAACQC2Cw8AAgAAAH0ADAAKAAoAtg8PAAIAAAB9AAwACwALALYLDwACAAAA";
    const S12_SHEET2_TAIL_B64 = "PgISALYAAAAAAEAAAAAAAAAADwAAAIsIEACLCAAAAAAAAAAAAAAAAAoAHQAPAAMiAAIAAAABACIAIgACAmcIFwBnCAAAAAAAAAAAAAACAAH/////A0QAAAoAAAA=";
    const S12_SUMMARY_B64 = "/v8AAAoAAgAAAAAAAAAAAAAAAAAAAAAAAQAAAOCFn/L5T2gQq5EIACsns9kwAAAAWAAAAAQAAAABAAAAKAAAAAgAAAAwAAAADQAAAEQAAAATAAAAUAAAAAIAAADmBAAAHgAAAAwAAABIYWthbiBTRVJBWQBAAAAAgKeBetNw3AEDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
    const S12_DOCSUMMARY_B64 = "/v8AAAoAAgAAAAAAAAAAAAAAAAAAAAAAAQAAAALVzdWcLhsQk5cIACss+a4wAAAAyAAAAAgAAAABAAAASAAAABcAAABQAAAACwAAAFgAAAAQAAAAYAAAABMAAABoAAAAFgAAAHAAAAANAAAAeAAAAAwAAACcAAAAAgAAAOYEAAADAAAAAAAQAAsAAAAAAAAACwAAAAAAAAALAAAAAAAAAAsAAAAAAAAAHhAAAAIAAAAHAAAATWVzYWhhAA0AAADWcm5layBNZXNhaGEADBAAAAIAAAAeAAAAEgAAAMdhbP3+bWEgU2F5ZmFsYXL9AAMAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

    function s12BytesFromBase64(base64) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i) & 255;
      return bytes;
    }

    function s12Concat(parts) {
      const total = parts.reduce((sum, p) => sum + p.length, 0);
      const out = new Uint8Array(total);
      let offset = 0;
      for (const part of parts) {
        const arr = part instanceof Uint8Array ? part : Uint8Array.from(part);
        out.set(arr, offset);
        offset += arr.length;
      }
      return out;
    }

    function s12PushU16(arr, value) {
      arr.push(Number(value) & 255, (Number(value) >>> 8) & 255);
    }

    function s12PushU32(arr, value) {
      const v = Number(value) >>> 0;
      arr.push(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255);
    }

    function s12PushF64(arr, value) {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setFloat64(0, Number(value) || 0, true);
      arr.push(...new Uint8Array(buffer));
    }

    function s12WriteU16(bytes, offset, value) {
      new DataView(bytes.buffer).setUint16(offset, Number(value) & 65535, true);
    }

    function s12WriteU32(bytes, offset, value) {
      new DataView(bytes.buffer).setUint32(offset, Number(value) >>> 0, true);
    }

    function s12BiffRecord(opcode, data) {
      const d = data instanceof Uint8Array ? Array.from(data) : data;
      const out = [];
      s12PushU16(out, opcode);
      s12PushU16(out, d.length);
      out.push(...d);
      return Uint8Array.from(out);
    }

    function s12BoundSheet(offset, sheetName) {
      const name = String(sheetName || "Mesaha");
      const d = [];
      s12PushU32(d, offset);
      d.push(0);
      d.push(0);

      let canCompress = true;
      for (let i = 0; i < name.length; i++) {
        if (name.charCodeAt(i) > 255) {
          canCompress = false;
          break;
        }
      }

      d.push(name.length);
      d.push(canCompress ? 0 : 1);

      if (canCompress) {
        for (let i = 0; i < name.length; i++) d.push(name.charCodeAt(i) & 255);
      } else {
        for (let i = 0; i < name.length; i++) {
          const code = name.charCodeAt(i);
          d.push(code & 255, (code >>> 8) & 255);
        }
      }

      return s12BiffRecord(0x0085, d);
    }

    function s12XlStringBytes(value) {
      const s = String(value ?? "");
      const d = [];
      s12PushU16(d, s.length);

      let canCompress = true;
      for (let i = 0; i < s.length; i++) {
        if (s.charCodeAt(i) > 255) {
          canCompress = false;
          break;
        }
      }

      d.push(canCompress ? 0 : 1);

      if (canCompress) {
        for (let i = 0; i < s.length; i++) d.push(s.charCodeAt(i) & 255);
      } else {
        for (let i = 0; i < s.length; i++) {
          const code = s.charCodeAt(i);
          d.push(code & 255, (code >>> 8) & 255);
        }
      }

      return d;
    }

    function s12MakeSst(items) {
      const occurrences = [];

      for (const item of items) {
        for (let r = 0; r < item.rows.length; r++) {
          for (let c = 0; c < item.rows[r].length; c++) {
            const value = item.rows[r][c];
            if (item.types[r][c] === "str" && value !== "" && value !== null && value !== undefined) {
              occurrences.push(String(value));
            }
          }
        }
      }

      const unique = [];
      const index = new Map();

      for (const s of occurrences) {
        if (!index.has(s)) {
          index.set(s, unique.length);
          unique.push(s);
        }
      }

      const payload = [];
      s12PushU32(payload, occurrences.length);
      s12PushU32(payload, unique.length);

      for (const s of unique) {
        payload.push(...s12XlStringBytes(s));
      }

      return {
        bytes: s12BiffRecord(0x00FC, payload),
        index
      };
    }

    function s12Dimensions(rowCount) {
      const d = [];
      s12PushU32(d, 0);
      s12PushU32(d, rowCount);
      s12PushU16(d, 0);
      s12PushU16(d, 12);
      s12PushU16(d, 0);
      return s12BiffRecord(0x0200, d);
    }

    function s12Row(rowIndex) {
      const d = [];
      s12PushU16(d, rowIndex);
      s12PushU16(d, 0);
      s12PushU16(d, 12);
      s12PushU16(d, 0x00FF);
      s12PushU16(d, 0);
      s12PushU16(d, 0);
      s12PushU16(d, 0x0F01);
      s12PushU16(d, 0);
      return s12BiffRecord(0x0208, d);
    }

    function s12LabelSst(row, col, sstIndex, xfIndex) {
      const d = [];
      s12PushU16(d, row);
      s12PushU16(d, col);
      s12PushU16(d, xfIndex);
      s12PushU32(d, sstIndex);
      return s12BiffRecord(0x00FD, d);
    }

    function s12Number(row, col, value, xfIndex) {
      const d = [];
      s12PushU16(d, row);
      s12PushU16(d, col);
      s12PushU16(d, xfIndex);
      s12PushF64(d, Number(value) || 0);
      return s12BiffRecord(0x0203, d);
    }

    function s12Index(rowCount, dbCellPositions) {
      const d = [];
      s12PushU32(d, 0);
      s12PushU32(d, 0);
      s12PushU32(d, rowCount);
      s12PushU32(d, 0);
      for (const pos of dbCellPositions) s12PushU32(d, pos);
      return s12BiffRecord(0x020B, d);
    }

    function s12DbCell(dbCellAbsPos, firstRowAbsPos, firstCellAbsPositions) {
      const d = [];
      s12PushU32(d, dbCellAbsPos - firstRowAbsPos);
      let previous = firstRowAbsPos + 20;

      for (const cellPos of firstCellAbsPositions) {
        s12PushU16(d, cellPos - previous);
        previous = cellPos;
      }

      return s12BiffRecord(0x00D7, d);
    }

    function s12MakeSheet(rows, types, sheetOffset, bofBytes, prefixAfterIndexBytes, tailBytes, sstIndex) {
      const parts = [];
      let absolutePos = sheetOffset;

      parts.push(bofBytes);
      absolutePos += bofBytes.length;

      const indexPartIndex = parts.length;
      const indexPlaceholder = s12Index(rows.length, []);
      parts.push(indexPlaceholder);
      absolutePos += indexPlaceholder.length;

      parts.push(prefixAfterIndexBytes);
      absolutePos += prefixAfterIndexBytes.length;

      const dim = s12Dimensions(rows.length);
      parts.push(dim);
      absolutePos += dim.length;

      const dbCellPositions = [];

      for (let startRow = 0; startRow < rows.length; startRow += 32) {
        const endRow = Math.min(startRow + 32, rows.length);
        const firstRowAbsPos = absolutePos;

        for (let r = startRow; r < endRow; r++) {
          const rowRecord = s12Row(r);
          parts.push(rowRecord);
          absolutePos += rowRecord.length;
        }

        const firstCellPositions = [];

        for (let r = startRow; r < endRow; r++) {
          firstCellPositions.push(absolutePos);
          const xf = r === 0 ? 64 : 15;

          for (let c = 0; c < rows[r].length; c++) {
            const value = rows[r][c];
            const type = types[r][c];

            if (value === "" || value === null || value === undefined || type === "blank") {
              continue;
            }

            let cell;
            if (type === "str") {
              cell = s12LabelSst(r, c, sstIndex.get(String(value)), xf);
            } else {
              cell = s12Number(r, c, Number(value) || 0, xf);
            }

            parts.push(cell);
            absolutePos += cell.length;
          }
        }

        const dbCellAbsPos = absolutePos;
        dbCellPositions.push(dbCellAbsPos);
        const dbCell = s12DbCell(dbCellAbsPos, firstRowAbsPos, firstCellPositions);
        parts.push(dbCell);
        absolutePos += dbCell.length;
      }

      parts[indexPartIndex] = s12Index(rows.length, dbCellPositions);
      parts.push(tailBytes);
      return s12Concat(parts);
    }

    function s12ExcelSerialFromISO(isoDate) {
      const iso = isoDate || todayISO();
      const parts = String(iso).split("-");
      if (parts.length !== 3) return s12ExcelSerialFromISO(todayISO());

      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      const utc = Date.UTC(y, m - 1, d);
      const base = Date.UTC(1899, 11, 30);
      return Math.round((utc - base) / 86400000);
    }

    function s12RecordToRow(record) {
      const product = PRODUCT_MAP[record.productType] || PRODUCT_MAP["Tomruk"];
      const tree = getTreeInfo(record.treeType || record.species || "Karaçam");
      const hacim = "";
      const kalite = "";

      return [
        tree.agacId,
        tree.agacAdi,
        product.odunId,
        product.odunAdi,
        kalite,
        "",
        Number(record.quantity || 1),
        Number(record.diameter || 0),
        formatBoy(record.length),
        hacim,
        isoToTRDate(record.productionDate || trDateToISO(record.uretimTarihi) || todayISO()),
        record.barcode || ""
      ];
    }

    function s12MainTypes(rows) {
      return rows.map((row, r) => {
        if (r === 0) return row.map(() => "str");

        return row.map((value, c) => {
          if (value === "" || value === null || value === undefined) return "blank";
          // Tomrukta kaliteSinifi sistem tarafından sayı gibi bekleniyor olabilir.
          // Bu yüzden kaliteSinifi doluysa sayı, tarih ise 03.06.2026 şeklinde metin gider.
          return [1, 3, 5, 8, 10, 11].includes(c) ? "str" : "num";
        });
      });
    }

    function s12ExampleRowsAndTypes() {
      const rows = [
        HEADERS,
        [1, "Karaçam", 5, "Kağıtlık Odun", "", "", 1, 38, "2.5", "", "08.06.2026", "A12345678"],
        [1, "Karaçam", 3, "Maden Direği", "", "", 1, 19, "3.0", "", "08.06.2026", "A12345670"],
        [1, "Karaçam", 4, "Sanayi Odunu", "", "", 1, 21, "1.0", "", "08.06.2026", "A12345672"],
        [1, "Karaçam", 2, "Tel Direği", "", "", 1, 22, "6.5", "", "08.06.2026", "A12345674"]
      ];

      const types = rows.map((row, r) => {
        if (r === 0) return row.map(() => "str");

        return row.map((value, c) => {
          if (value === "" || value === null || value === undefined) return "blank";
          return [1, 3, 4, 5, 8, 9, 10, 11].includes(c) ? "str" : "num";
        });
      });

      return { rows, types };
    }

    function s12Utf16Bytes(value) {
      const s = String(value || "") + "\u0000";
      const arr = [];
      for (let i = 0; i < s.length; i++) {
        const code = s.charCodeAt(i);
        arr.push(code & 255, (code >>> 8) & 255);
      }
      return arr;
    }

    function s12DirectoryEntry(name, type, color, left, right, child, startSector, streamSize) {
      const bytes = new Uint8Array(128);
      const nameBytes = s12Utf16Bytes(name).slice(0, 64);
      bytes.set(Uint8Array.from(nameBytes), 0);
      s12WriteU16(bytes, 64, Math.min(nameBytes.length, 64));
      bytes[66] = type;
      bytes[67] = color;
      s12WriteU32(bytes, 68, left);
      s12WriteU32(bytes, 72, right);
      s12WriteU32(bytes, 76, child);
      s12WriteU32(bytes, 116, startSector);
      s12WriteU32(bytes, 120, streamSize >>> 0);
      s12WriteU32(bytes, 124, Math.floor(streamSize / 0x100000000));
      return bytes;
    }

    function s12MakeCfb(streams) {
      const FREESECT = 0xFFFFFFFF;
      const ENDOFCHAIN = 0xFFFFFFFE;
      const FATSECT = 0xFFFFFFFD;
      const NOSTREAM = 0xFFFFFFFF;
      const sectorSize = 512;

      const sectorCounts = streams.map(s => Math.ceil(s.data.length / sectorSize));
      const directorySectorCount = 1;
      let fatSectorCount = 1;

      while (true) {
        const totalSectors = fatSectorCount + directorySectorCount + sectorCounts.reduce((a, b) => a + b, 0);
        const neededFatSectors = Math.ceil(totalSectors / 128);
        if (neededFatSectors === fatSectorCount) break;
        fatSectorCount = neededFatSectors;
      }

      const directorySector = fatSectorCount;
      let nextSector = fatSectorCount + directorySectorCount;
      const starts = sectorCounts.map(count => {
        const start = nextSector;
        nextSector += count;
        return start;
      });
      const totalSectors = nextSector;

      const header = new Uint8Array(512);
      header.set(Uint8Array.from([0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1]), 0);
      s12WriteU16(header, 24, 0x003E);
      s12WriteU16(header, 26, 0x0003);
      s12WriteU16(header, 28, 0xFFFE);
      s12WriteU16(header, 30, 9);
      s12WriteU16(header, 32, 6);
      s12WriteU32(header, 40, 0);
      s12WriteU32(header, 44, fatSectorCount);
      s12WriteU32(header, 48, directorySector);
      s12WriteU32(header, 52, 0);
      s12WriteU32(header, 56, 4096);
      s12WriteU32(header, 60, ENDOFCHAIN);
      s12WriteU32(header, 64, 0);
      s12WriteU32(header, 68, ENDOFCHAIN);
      s12WriteU32(header, 72, 0);

      for (let i = 0; i < 109; i++) {
        s12WriteU32(header, 76 + i * 4, i < fatSectorCount ? i : FREESECT);
      }

      const fat = new Uint8Array(fatSectorCount * sectorSize);
      for (let i = 0; i < fatSectorCount * 128; i++) {
        let value = FREESECT;
        if (i < totalSectors) {
          if (i < fatSectorCount) value = FATSECT;
          else if (i === directorySector) value = ENDOFCHAIN;
          else {
            value = ENDOFCHAIN;
            for (let s = 0; s < streams.length; s++) {
              const start = starts[s];
              const count = sectorCounts[s];
              if (i >= start && i < start + count) {
                value = i < start + count - 1 ? i + 1 : ENDOFCHAIN;
                break;
              }
            }
          }
        }
        s12WriteU32(fat, i * 4, value);
      }

      const entries = [];
      entries.push(s12DirectoryEntry("Root Entry", 5, 1, NOSTREAM, NOSTREAM, 1, ENDOFCHAIN, 0));

      for (let i = 0; i < streams.length; i++) {
        const right = i < streams.length - 1 ? i + 2 : NOSTREAM;
        entries.push(s12DirectoryEntry(streams[i].name, 2, 1, NOSTREAM, right, NOSTREAM, starts[i], streams[i].data.length));
      }

      while (entries.length < 4) {
        entries.push(s12DirectoryEntry("", 0, 0, NOSTREAM, NOSTREAM, NOSTREAM, ENDOFCHAIN, 0));
      }

      let directory = s12Concat(entries);
      if (directory.length < sectorSize) {
        const padded = new Uint8Array(sectorSize);
        padded.set(directory, 0);
        directory = padded;
      }

      const streamBytes = streams.map((s, i) => {
        const padded = new Uint8Array(sectorCounts[i] * sectorSize);
        padded.set(s.data, 0);
        return padded;
      });

      return s12Concat([header, fat, directory, ...streamBytes]);
    }

    function s12MakeWorkbook(dataRows) {
      const mainRows = [HEADERS, ...dataRows];
      const mainTypes = s12MainTypes(mainRows);
      const example = s12ExampleRowsAndTypes();

      const sst = s12MakeSst([
        { rows: mainRows, types: mainTypes },
        { rows: example.rows, types: example.types }
      ]);

      const globalPrefix = s12BytesFromBase64(S12_GLOBAL_PREFIX_B64);
      const globalMid = s12BytesFromBase64(S12_GLOBAL_MID_B64);
      const globalAfterSst = s12BytesFromBase64(S12_GLOBAL_AFTER_SST_B64);

      const bof1 = s12BytesFromBase64(S12_SHEET1_BOF_B64);
      const prefix1 = s12BytesFromBase64(S12_SHEET1_PREFIX_B64);
      const tail1 = s12BytesFromBase64(S12_SHEET1_TAIL_B64);
      const bof2 = s12BytesFromBase64(S12_SHEET2_BOF_B64);
      const prefix2 = s12BytesFromBase64(S12_SHEET2_PREFIX_B64);
      const tail2 = s12BytesFromBase64(S12_SHEET2_TAIL_B64);

      const b1 = s12BoundSheet(0, "Mesaha");
      const b2 = s12BoundSheet(0, "Örnek Mesaha");

      const globalLength =
        globalPrefix.length +
        b1.length +
        b2.length +
        globalMid.length +
        sst.bytes.length +
        globalAfterSst.length;

      const sheet1Offset = globalLength;
      const sheet1 = s12MakeSheet(mainRows, mainTypes, sheet1Offset, bof1, prefix1, tail1, sst.index);
      const sheet2Offset = sheet1Offset + sheet1.length;
      const sheet2 = s12MakeSheet(example.rows, example.types, sheet2Offset, bof2, prefix2, tail2, sst.index);

      const globals = s12Concat([
        globalPrefix,
        s12BoundSheet(sheet1Offset, "Mesaha"),
        s12BoundSheet(sheet2Offset, "Örnek Mesaha"),
        globalMid,
        sst.bytes,
        globalAfterSst
      ]);

      return s12Concat([globals, sheet1, sheet2]);
    }

    function s12MakeSystemXls(dataRows) {
      const workbook = s12MakeWorkbook(dataRows);
      return s12MakeCfb([
        { name: "Workbook", data: workbook },
        { name: "\u0005SummaryInformation", data: s12BytesFromBase64(S12_SUMMARY_B64) },
        { name: "\u0005DocumentSummaryInformation", data: s12BytesFromBase64(S12_DOCSUMMARY_B64) }
      ]);
    }

    function s12DownloadBytes(bytes, filename) {
      const blob = new Blob([bytes], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }


    function xmlEscape(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function exportSystemXls() {
      if (!state.records.length) return showToast("Çıktı için kayıt yok.");

      const ordered = state.records.slice().reverse().map(s12RecordToRow);
      const xlsBytes = s12MakeSystemXls(ordered);
      s12DownloadBytes(xlsBytes, `Mesaha_${dateFileName()}.xls`);
      showToast("Barkod kontrollü, hacim boş sistem Excel indirildi.");
    }

    function exportCsv() {
      if (!state.records.length) return showToast("Çıktı için kayıt yok.");

      const ordered = state.records.slice().reverse().map(recordToSystemRow);
      const rows = [
        HEADERS,
        ...ordered.map(r => HEADERS.map(h => r[h]))
      ];

      const csv = rows.map(row => row.map(csvCell).join(";")).join("\n");
      downloadFile("\uFEFF" + csv, `Mesaha_${dateFileName()}.csv`, "text/csv;charset=utf-8");
      showToast("CSV çıktısı indirildi.");
    }

    function csvCell(value) {
      const text = String(value ?? "");
      return `"${text.replaceAll('"', '""')}"`;
    }

    function backup() {
      const data = {
        app: "Mesaha App",
        version: 135,
        exportedAt: formatDateTime(),
        systemHeaders: HEADERS,
        settings: state.settings,
        records: state.records
      };
      downloadFile(JSON.stringify(data, null, 2), `mesaha_yedek_${dateFileName()}.json`, "application/json");
      showToast("Yedek indirildi.");
    }

    function restoreFromFile(file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!Array.isArray(data.records)) throw new Error("Geçersiz yedek.");
          if (!confirm(`${data.records.length} kayıt yüklensin mi? Mevcut kayıtlar değişir.`)) return;

          state.records = data.records;
          state.settings = { ...state.settings, ...(data.settings || {}) };
          saveRecords();
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
          load();
          showToast("Yedek yüklendi.");
        } catch (err) {
          showToast("Yedek dosyası okunamadı.");
        }
      };
      reader.readAsText(file);
    }

    function downloadFile(content, filename, type) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function usageDateKey(date = new Date()) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function loadUsageStats() {
      try {
        return JSON.parse(localStorage.getItem("mesaha_usage_stats_v1") || "{}");
      } catch {
        return {};
      }
    }

    function saveUsageStats(stats) {
      localStorage.setItem("mesaha_usage_stats_v1", JSON.stringify(stats));
    }

    function registerDailyVisit() {
      const today = usageDateKey();
      const stats = loadUsageStats();

      if (!stats.days) stats.days = {};
      if (!stats.days[today]) stats.days[today] = 0;

      stats.days[today] += 1;
      stats.total = (Number(stats.total) || 0) + 1;
      stats.lastOpen = new Date().toLocaleString("tr-TR");

      saveUsageStats(stats);
      renderUsageStats(false);
    }

    function renderUsageStats(show = true) {
      if (!els.usageCard) return;

      const today = usageDateKey();
      const stats = loadUsageStats();
      const todayCount = stats.days && stats.days[today] ? stats.days[today] : 0;
      const total = Number(stats.total) || 0;
      const lastOpen = stats.lastOpen || "-";

      els.usageCard.innerHTML = `
        <h3>Günlük Giriş Sayacı</h3>
        <div class="usage-grid">
          <div class="usage-item">Bugünkü giriş<b>${todayCount.toLocaleString("tr-TR")}</b></div>
          <div class="usage-item">Toplam açılış<b>${total.toLocaleString("tr-TR")}</b></div>
          <div class="usage-item">Son açılış<b style="font-size:13px">${escapeHtml(lastOpen)}</b></div>
        </div>
        <p class="hint" style="margin-top:8px">Bu sayaç bu cihazdaki açılışları gösterir. Kullanıcı adı ve şeflik girişleri kılavuzun altındaki listede tutulur.</p>
      `;

      if (show) els.usageCard.classList.toggle("show");
    }

    function dateFileName() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const base = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
      const parts = [base];

      const bolme = sanitizeFilePart(state.settings.bolmeNo || (els.bolmeNo ? els.bolmeNo.value : ""));
      const seflik = sanitizeFilePart(state.settings.seflik || (els.seflik ? els.seflik.value : ""));

      if (bolme) parts.push(`Bolme_${bolme}`);
      if (seflik) parts.push(seflik);

      return parts.join("_");
    }

    function buildChips() {
      renderRecentChips();
    }

    if (els.loginSaveBtn) els.loginSaveBtn.addEventListener("click", saveLoginUser);
    if (els.loginUserName) {
      els.loginUserName.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          if (els.loginSeflik) els.loginSeflik.focus();
        }
      });
      els.loginUserName.addEventListener("input", clearLoginError);
    }
    if (els.loginSeflik) {
      els.loginSeflik.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          saveLoginUser();
        }
      });
      els.loginSeflik.addEventListener("input", clearLoginError);
    }
    if (els.changeUserBtn) els.changeUserBtn.addEventListener("click", () => openUserLogin(false));
    if (els.adminUsersBtn) els.adminUsersBtn.addEventListener("click", unlockRegisteredUsers);
    if (els.adminUsersCloseBtn) els.adminUsersCloseBtn.addEventListener("click", lockRegisteredUsers);
    if (els.cloudBackupBtn && !els.cloudBackupBtn.dataset.cloudBackupBound) {
      els.cloudBackupBtn.dataset.cloudBackupBound = "1";
      els.cloudBackupBtn.addEventListener("click", cloudBackupRecordsOpen);
    }

    if (els.cloudRestoreBtn && !els.cloudRestoreBtn.dataset.boundV64) {
      els.cloudRestoreBtn.dataset.boundV64 = "1";
      els.cloudRestoreBtn.addEventListener("click", () => openCloudRestorePanel(true, false));
    }
    if (els.cloudRestoreOtherBtn && !els.cloudRestoreOtherBtn.dataset.boundV64) {
      els.cloudRestoreOtherBtn.dataset.boundV64 = "1";
      els.cloudRestoreOtherBtn.addEventListener("click", () => openCloudRestorePanel(false, true));
    }
    if (els.cloudRestoreCloseBtn && !els.cloudRestoreCloseBtn.dataset.boundV64) {
      els.cloudRestoreCloseBtn.dataset.boundV64 = "1";
      els.cloudRestoreCloseBtn.addEventListener("click", closeCloudRestorePanel);
    }
    if (els.cloudRestoreOverlay && !els.cloudRestoreOverlay.dataset.boundV64) {
      els.cloudRestoreOverlay.dataset.boundV64 = "1";
      els.cloudRestoreOverlay.addEventListener("click", (event) => {
        if (event.target === els.cloudRestoreOverlay) closeCloudRestorePanel();
      });
    }
    if (els.cloudRestoreSearchBtn && !els.cloudRestoreSearchBtn.dataset.boundV64) {
      els.cloudRestoreSearchBtn.dataset.boundV64 = "1";
      els.cloudRestoreSearchBtn.addEventListener("click", () => searchCloudBackups(true));
    }


    if (els.activeUserBadge) {
      els.activeUserBadge.addEventListener("click", openUserPanel);
      els.activeUserBadge.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openUserPanel();
        }
      });
    }
    if (els.userPanelCloseBtn) els.userPanelCloseBtn.addEventListener("click", closeUserPanel);
    if (els.userPanelOverlay) {
      els.userPanelOverlay.addEventListener("click", (event) => {
        if (event.target === els.userPanelOverlay) closeUserPanel();
      });
    }
    if (els.panelChangeUserBtn) {
      els.panelChangeUserBtn.addEventListener("click", () => {
        closeUserPanel();
        openUserLogin(true);
      });
    }
    if (els.panelPasswordBtn) els.panelPasswordBtn.addEventListener("click", () => { closeUserPanel(); openCloudRestorePanel(true, false); });
    if (els.panelCloudBackupBtn && !els.panelCloudBackupBtn.dataset.cloudBackupBound) {
      els.panelCloudBackupBtn.dataset.cloudBackupBound = "1";
      els.panelCloudBackupBtn.addEventListener("click", () => {
        closeUserPanel();
        cloudBackupRecordsOpen();
      });
    }





    if (els.length) {
      els.length.addEventListener("focus", () => selectInputValue(els.length));
      els.length.addEventListener("click", () => selectInputValue(els.length));
    }

    document.addEventListener("keydown", handleEnterToSave);

    els.submitBtn.addEventListener("pointerdown", (event) => {
      // Mobilde butona dokununca input blur olup klavye kapanmasın diye butonun odağı almasını engelliyoruz.
      event.preventDefault();
      if (els.form.requestSubmit) els.form.requestSubmit();
      else els.form.dispatchEvent(new Event("submit", { cancelable: true }));
    });

    els.form.addEventListener("submit", addRecord);

    ["input", "change"].forEach(evt => {
      els.diameter.addEventListener(evt, () => { limitDiameterToTwoDigits(); updateLiveDesi(); });
      els.length.addEventListener(evt, () => { saveSettings(); updateLiveDesi(); });
      els.quantity.addEventListener(evt, () => { saveSettings(); updateLiveDesi(); });
      els.productionDate.addEventListener(evt, saveSettings);
      els.barcode.addEventListener(evt, () => { saveSettings(); updateDuplicateWarning(); });
      if (els.bolmeNo) els.bolmeNo.addEventListener(evt, saveSettings);
      if (els.seflik) els.seflik.addEventListener(evt, saveSettings);
      if (els.ekipNot) els.ekipNot.addEventListener(evt, saveSettings);
    });

    els.classBoxes.querySelectorAll(".class-box").forEach(box => {
      box.addEventListener("pointerdown", (event) => event.preventDefault());
      box.addEventListener("click", () => setQualityClass(box.dataset.class, true));
    });

    els.cancelEditBtn.addEventListener("click", cancelEditMode);
    if (els.soundToggleBtn) els.soundToggleBtn.addEventListener("click", toggleSound);

    if (els.sameBarcodeBtn) {
      els.sameBarcodeBtn.addEventListener("click", () => {
        state.sameBarcodeMode = false;
        showErrorToast("Final sürümde aynı barkod ikinci kez kaydedilemez.");
      });
    }

    els.clearInputsBtn.addEventListener("click", () => {
      if (!confirm("Giriş alanları temizlensin mi?")) return;
      els.diameter.value = "";
      els.quantity.value = "1";
      updateInputPlaceholders();
      updateLiveDesi();
      focusDiameterKeepKeyboard();
    });

    
    if (els.selectAllRecords) els.selectAllRecords.addEventListener("change", () => toggleSelectFiltered(els.selectAllRecords.checked));
    if (els.selectFilteredBtn) els.selectFilteredBtn.addEventListener("click", selectFilteredRecords);
    if (els.clearSelectionBtn) els.clearSelectionBtn.addEventListener("click", clearRecordSelection);
    if (els.bulkDeleteBtn) els.bulkDeleteBtn.addEventListener("click", deleteSelectedRecords);    if (els.adminUserSearch) els.adminUserSearch.addEventListener("input", () => renderOnlineUsers(state.adminOnlineUsers || []));

    els.searchInput.addEventListener("input", render);
    els.exportSystemXlsBtn.addEventListener("click", exportSystemXls);

    /*
      v82 Firebase Köprüsü
      - Yeni kullanıcı/yedek işlemlerinde Firebase Firestore kullanılır.
      - Google Apps Script yedek sistem olarak korunur.
      - Uygulama yerel kayıt mantığını bozmaz.
    */
    const mesahaAppsScriptBridge = {
      logOnlineUser,
      loadOnlineUsers,
      loadAdminBackupsV74,
      uploadCloudBackupOpen,
      searchCloudBackups,
      restoreCloudBackup,
      deleteCloudBackup,
      deleteCloudUserAndBackups
    };

    let mesahaFirebaseReadyPromise = null;
    let mesahaFirebasePersistenceTried = false;

    function loadExternalScript(src) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Firebase kütüphanesi yüklenemedi"));
        document.head.appendChild(s);
      });
    }

    async function ensureFirebaseReady() {
      if (!FIREBASE_ENABLED) throw new Error("Firebase kapalı");
      if (!navigator.onLine) throw new Error("İnternet bağlantısı yok");

      if (!mesahaFirebaseReadyPromise) {
        mesahaFirebaseReadyPromise = (async () => {
          if (!window.firebase || !window.firebase.apps) {
            const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
            await loadExternalScript(`${base}/firebase-app-compat.js`);
            await loadExternalScript(`${base}/firebase-auth-compat.js`);
            await loadExternalScript(`${base}/firebase-firestore-compat.js`);
          }

          if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
          }

          const auth = firebase.auth();
          if (!auth.currentUser) {
            await auth.signInAnonymously();
          }

          const db = firebase.firestore();

          if (!mesahaFirebasePersistenceTried) {
            mesahaFirebasePersistenceTried = true;
            try {
              db.settings({ experimentalForceLongPolling: true, merge: true });
            } catch {}
            try {
              await db.enablePersistence({ synchronizeTabs: true });
            } catch {}
          }

          return { db, auth };
        })();
      }

      return mesahaFirebaseReadyPromise;
    }

    function firebaseUserKey(name, seflik) {
      const raw = `${cleanUserText(name)}__${cleanUserText(seflik)}`;
      return foldLocalText(raw).replace(/[^a-z0-9_-]+/g, "_").slice(0, 120) || "bos";
    }

    function firebaseBackupDocId(userKey, backupHash) {
      return `fb_${userKey}_${String(backupHash || "").replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 40) || Date.now()}`;
    }

    function firebaseDateText() {
      return new Date().toLocaleString("tr-TR");
    }

    async function firebaseLogUser(user) {
      const { db } = await ensureFirebaseReady();
      const name = cleanUserText(user && user.name);
      const seflik = cleanUserText(user && user.seflik);
      if (!name || !seflik) return;

      const key = firebaseUserKey(name, seflik);
      const ref = db.collection(FIREBASE_USERS_COLLECTION).doc(key);
      const snap = await ref.get();
      const nowText = firebaseDateText();
      const nowMs = Date.now();
      const deviceId = getOrCreateDeviceId();
      const deviceInfo = currentDeviceInfoPayload();

      const old = snap.exists ? (snap.data() || {}) : {};
      const deviceIds = old.deviceIds && typeof old.deviceIds === "object" ? old.deviceIds : {};
      deviceIds[deviceId] = true;

      await ref.set({
        id: key,
        name,
        seflik,
        userKey: key,
        firstLogin: old.firstLogin || nowText,
        firstLoginMs: old.firstLoginMs || nowMs,
        lastLogin: nowText,
        lastLoginMs: nowMs,
        loginCount: Number(old.loginCount || 0) + 1,
        deviceIds,
        deviceCount: Object.keys(deviceIds).length,
        backupCount: Number(old.backupCount || 0),
        lastBackupAt: old.lastBackupAt || "",
        lastBackupMs: Number(old.lastBackupMs || 0),
        source: "firebase",
        appVersion: deviceInfo.appVersion,
        fileVersion: deviceInfo.fileVersion,
        lastDeviceInfo: deviceInfo,
        lastDevice: `${deviceInfo.platform || "-"} • ${deviceInfo.screen || "-"}`
      }, { merge: true });
    }

    async function firebaseLoadUsers() {
      const { db } = await ensureFirebaseReady();
      const snap = await db.collection(FIREBASE_USERS_COLLECTION).get();
      const users = [];
      snap.forEach(doc => {
        const d = doc.data() || {};
        users.push({
          id: d.id || doc.id,
          name: d.name || "-",
          seflik: d.seflik || "-",
          firstLogin: d.firstLogin || "-",
          lastLogin: d.lastLogin || "-",
          loginCount: Number(d.loginCount || 0),
          backupCount: Number(d.backupCount || 0),
          deviceCount: Number(d.deviceCount || (d.deviceIds ? Object.keys(d.deviceIds).length : 0)),
          lastLoginMs: Number(d.lastLoginMs || 0),
          lastBackupAt: d.lastBackupAt || "",
          appVersion: d.appVersion || d.fileVersion || "",
          fileVersion: d.fileVersion || "",
          lastDeviceInfo: d.lastDeviceInfo || null,
          lastDevice: d.lastDevice || "",
          todayUsage: d.todayUsage || null,
          lastUsageAt: d.lastUsageAt || "",
          lastUsageMs: Number(d.lastUsageMs || 0)
        });
      });
      users.sort((a, b) => Number(b.lastLoginMs || 0) - Number(a.lastLoginMs || 0));
      return users;
    }

    async function firebaseUploadBackup(user) {
      const { db } = await ensureFirebaseReady();
      const payload = buildCloudBackupPayload(user);
      payload.version = 134;
      payload.cloud = "firebase";

      const bolmeNo = els.bolmeNo ? String(els.bolmeNo.value || "").trim() : "";
      const ekipNot = els.ekipNot ? String(els.ekipNot.value || "").trim() : "";
      const bolmePart = bolmeNo ? `_${cleanFilePart(bolmeNo)}` : "";
      const fileName = `Mesaha_Yedek_${cleanFilePart(user.seflik)}_${cleanFilePart(user.name)}${bolmePart}_${new Date().toISOString().slice(0,19).replace(/[-:T]/g, "")}.json`;
      const backupHash = simpleHashText(JSON.stringify({ user, records: state.records || [], fileInfo: payload.fileInfo || {} }));
      const userKey = firebaseUserKey(user.name, user.seflik);
      const backupId = firebaseBackupDocId(userKey, backupHash);
      const backupRef = db.collection(FIREBASE_BACKUPS_COLLECTION).doc(backupId);
      const exists = await backupRef.get();

      if (exists.exists) {
        return exists.data().fileName || fileName;
      }

      const nowText = firebaseDateText();
      const nowMs = Date.now();

      await backupRef.set({
        id: backupId,
        userKey,
        name: cleanUserText(user.name),
        seflik: cleanUserText(user.seflik),
        deviceId: user.deviceId || getOrCreateDeviceId(),
        fileName,
        payload,
        payloadText: JSON.stringify(payload),
        recordCount: (state.records || []).length,
        bolmeNo,
        ekipNot,
        backupHash,
        createdAt: nowText,
        createdAtMs: nowMs,
        createdAtIso: new Date().toISOString(),
        source: "firebase"
      });

      const userRef = db.collection(FIREBASE_USERS_COLLECTION).doc(userKey);
      const userSnap = await userRef.get();
      const old = userSnap.exists ? (userSnap.data() || {}) : {};
      await userRef.set({
        id: userKey,
        name: cleanUserText(user.name),
        seflik: cleanUserText(user.seflik),
        userKey,
        firstLogin: old.firstLogin || nowText,
        firstLoginMs: old.firstLoginMs || nowMs,
        lastLogin: nowText,
        lastLoginMs: nowMs,
        loginCount: Number(old.loginCount || 0),
        backupCount: Number(old.backupCount || 0) + 1,
        lastBackupAt: nowText,
        lastBackupMs: nowMs,
        source: "firebase"
      }, { merge: true });

      return fileName;
    }

    async function firebaseListBackups(name, seflik) {
      const { db } = await ensureFirebaseReady();
      const userKey = firebaseUserKey(name, seflik);
      const snap = await db.collection(FIREBASE_BACKUPS_COLLECTION)
        .where("userKey", "==", userKey)
        .get();

      const backups = [];
      snap.forEach(doc => {
        const d = doc.data() || {};
        backups.push({
          id: d.id || doc.id,
          fileName: d.fileName || "Mesaha yedeği",
          createdAt: d.createdAt || "-",
          createdAtMs: Number(d.createdAtMs || 0),
          recordCount: Number(d.recordCount || 0),
          name: d.name || name || "-",
          seflik: d.seflik || seflik || "-",
          bolmeNo: d.bolmeNo || "-",
          source: "firebase"
        });
      });

      backups.sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
      return backups;
    }

    async function firebaseGetBackup(backupId) {
      const { db } = await ensureFirebaseReady();
      const doc = await db.collection(FIREBASE_BACKUPS_COLLECTION).doc(backupId).get();
      if (!doc.exists) throw new Error("Firebase yedeği bulunamadı");
      const d = doc.data() || {};
      const payload = d.payload || (d.payloadText ? JSON.parse(d.payloadText) : null);
      if (!payload || !Array.isArray(payload.records)) throw new Error("Yedek dosyası geçersiz");
      return payload;
    }

    async function firebaseDeleteBackup(backupId) {
      const { db } = await ensureFirebaseReady();
      const ref = db.collection(FIREBASE_BACKUPS_COLLECTION).doc(backupId);
      const snap = await ref.get();
      const d = snap.exists ? (snap.data() || {}) : {};
      await ref.delete();

      if (d.userKey) {
        const userRef = db.collection(FIREBASE_USERS_COLLECTION).doc(d.userKey);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          const old = userSnap.data() || {};
          await userRef.set({
            backupCount: Math.max(0, Number(old.backupCount || 0) - 1)
          }, { merge: true });
        }
      }
    }

    async function firebaseLoadAllBackups() {
      const { db } = await ensureFirebaseReady();
      const snap = await db.collection(FIREBASE_BACKUPS_COLLECTION).get();
      const backups = [];
      snap.forEach(doc => {
        const d = doc.data() || {};
        backups.push({
          id: d.id || doc.id,
          fileName: d.fileName || "Mesaha yedeği",
          createdAt: d.createdAt || "-",
          createdAtMs: Number(d.createdAtMs || 0),
          recordCount: Number(d.recordCount || 0),
          name: d.name || "-",
          seflik: d.seflik || "-",
          bolmeNo: d.bolmeNo || "-",
          source: "firebase"
        });
      });
      backups.sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
      return backups.slice(0, 300);
    }

    async function firebaseDeleteUserAndBackups(name, seflik) {
      const { db } = await ensureFirebaseReady();
      const key = firebaseUserKey(name, seflik);
      const backupsSnap = await db.collection(FIREBASE_BACKUPS_COLLECTION).where("userKey", "==", key).get();
      const batch = db.batch();
      backupsSnap.forEach(doc => batch.delete(doc.ref));
      batch.delete(db.collection(FIREBASE_USERS_COLLECTION).doc(key));
      await batch.commit();
    }

    logOnlineUser = function(user) {
      firebaseLogUser(user).catch(() => {
        mesahaAppsScriptBridge.logOnlineUser(user);
      });
    };

    function mergeAdminUsers(firebaseUsers, oldUsers) {
      const map = new Map();

      (oldUsers || []).forEach(u => {
        const key = firebaseUserKey(u.name, u.seflik);
        map.set(key, Object.assign({}, u, {
          sourceLabel: "Eski Sistem"
        }));
      });

      (firebaseUsers || []).forEach(u => {
        const key = firebaseUserKey(u.name, u.seflik);
        const old = map.get(key) || {};
        map.set(key, Object.assign({}, old, u, {
          backupCount: Math.max(Number(old.backupCount || 0), Number(u.backupCount || 0)),
          deviceCount: Math.max(Number(old.deviceCount || 0), Number(u.deviceCount || 0)),
          loginCount: Math.max(Number(old.loginCount || 0), Number(u.loginCount || 0)),
          sourceLabel: old.name ? "Firebase + Eski" : "Firebase"
        }));
      });

      return Array.from(map.values()).sort((a, b) => {
        const ams = Number(a.lastLoginMs || a.migratedAtMs || 0);
        const bms = Number(b.lastLoginMs || b.migratedAtMs || 0);
        if (ams || bms) return bms - ams;
        return String(b.lastLogin || "").localeCompare(String(a.lastLogin || ""), "tr");
      });
    }

    loadOnlineUsers = async function(adminCode) {
      let firebaseUsers = [];
      let oldUsers = [];

      try { firebaseUsers = await firebaseLoadUsers(); } catch {}
      try { oldUsers = await mesahaAppsScriptBridge.loadOnlineUsers(adminCode); } catch {}

      const merged = mergeAdminUsers(firebaseUsers, oldUsers);
      if (merged.length) return merged;
      return [];
    };

    loadAdminBackupsV74 = async function() {
      let firebaseBackups = [];
      let oldBackups = [];

      try { firebaseBackups = await firebaseLoadAllBackups(); } catch {}
      try {
        await mesahaAppsScriptBridge.loadAdminBackupsV74();
        oldBackups = Array.isArray(state.adminBackups) ? state.adminBackups.slice() : [];
      } catch {}

      const seen = new Set();
      const merged = [];
      [...firebaseBackups, ...oldBackups].forEach(b => {
        const key = `${b.source || ""}_${b.id || b.fileName || ""}`;
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(b);
      });

      state.adminBackups = merged.sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0)).slice(0, 500);
      updateAdminTopSummary();
    };

    uploadCloudBackupOpen = async function(user) {
      try {
        return await firebaseUploadBackup(user);
      } catch (error) {
        return await mesahaAppsScriptBridge.uploadCloudBackupOpen(user);
      }
    };

    searchCloudBackups = async function(manual = true) {
      if (!navigator.onLine) {
        if (els.cloudBackupList) els.cloudBackupList.innerHTML = `<div class="cloud-backup-error">İnternet bağlantısı yok. Buluttan getirme yapılamaz.</div>`;
        return;
      }

      const active = state.activeUser || findActiveUser();
      const name = (!manual && active) ? cleanUserText(active.name) : cleanUserText(els.cloudRestoreUserName ? els.cloudRestoreUserName.value : "");
      const seflik = (!manual && active) ? cleanUserText(active.seflik) : cleanUserText(els.cloudRestoreSeflik ? els.cloudRestoreSeflik.value : "");

      if (!name || !seflik) {
        if (els.cloudBackupList) els.cloudBackupList.innerHTML = `<div class="cloud-backup-error">Kullanıcı adı ve şeflik giriniz.</div>`;
        return;
      }

      if (els.cloudBackupList) els.cloudBackupList.innerHTML = `<div class="cloud-backup-loading">Firebase yedekleri getiriliyor...</div>`;

      try {
        const backups = await firebaseListBackups(name, seflik);
        if (backups.length) {
          renderCloudBackupList(backups);
          return;
        }
        await mesahaAppsScriptBridge.searchCloudBackups(manual);
      } catch (error) {
        await mesahaAppsScriptBridge.searchCloudBackups(manual);
      }
    };

    restoreCloudBackup = async function(backupId) {
      if (!backupId) return;

      if (!String(backupId).startsWith("fb_")) {
        return mesahaAppsScriptBridge.restoreCloudBackup(backupId);
      }

      const ok = window.confirm("Bu Firebase yedeği geri yüklensin mi? Mevcut cihaz kayıtları bu yedekle değiştirilecek.");
      if (!ok) return;

      try {
        setCloudLoading(true, "Firebase yedeği geri yükleniyor...");
        showToast("Firebase yedeği indiriliyor...");
        const payload = await firebaseGetBackup(backupId);
        state.records = payload.records;
        save();
        render();
        closeCloudRestorePanel();
        showToast("Firebase yedeği geri yüklendi.");
      } catch (error) {
        showToast(error && error.message ? error.message : "Geri yükleme başarısız.");
      } finally {
        setCloudLoading(false);
      }
    };

    deleteCloudBackup = async function(backupId) {
      if (!backupId) return;

      if (!String(backupId).startsWith("fb_")) {
        return mesahaAppsScriptBridge.deleteCloudBackup(backupId);
      }

      const ok = window.confirm("Bu Firebase yedeği silinsin mi? Bu işlem geri alınamaz.");
      if (!ok) return;

      try {
        showToast("Firebase yedeği siliniyor...");
        await firebaseDeleteBackup(backupId);
        showToast("Firebase yedeği silindi.");
        searchCloudBackups(true);
      } catch (error) {
        showToast(error && error.message ? error.message : "Silme başarısız.");
      }
    };

    deleteCloudUserAndBackups = async function(name, seflik) {
      const cleanName = cleanUserText(name);
      const cleanSeflik = cleanUserText(seflik);
      if (!cleanName || !cleanSeflik) return;

      const ok = window.confirm(`${cleanName} / ${cleanSeflik} Firebase kullanıcı kaydı ve yedekleri silinsin mi?`);
      if (!ok) return;

      try {
        showToast("Firebase kullanıcısı siliniyor...");
        await firebaseDeleteUserAndBackups(cleanName, cleanSeflik);
        state.adminOnlineUsers = state.adminOnlineUsers.filter(u => firebaseUserKey(u.name, u.seflik) !== firebaseUserKey(cleanName, cleanSeflik));
        renderOnlineUsers(state.adminOnlineUsers);
        renderAdminUsers();
        renderAdminControlCenter();
        showToast("Firebase kullanıcısı silindi.");
      } catch (error) {
        return mesahaAppsScriptBridge.deleteCloudUserAndBackups(name, seflik);
      }
    };

    async function migrateAppsScriptUsersToFirebase() {
      const code = window.prompt("Eski kullanıcıları Firebase’e aktarmak için yönetici kodunu giriniz:");
      if (String(code || "").trim() !== ADMIN_CODE) {
        showToast("Yönetici kodu hatalı.");
        return;
      }

      try {
        showToast("Eski kullanıcılar alınıyor...");
        const oldUsers = await mesahaAppsScriptBridge.loadOnlineUsers(code);
        if (!oldUsers.length) {
          showToast("Aktarılacak eski kullanıcı bulunamadı.");
          return;
        }

        const { db } = await ensureFirebaseReady();
        const batchSize = 250;
        let done = 0;

        for (let i = 0; i < oldUsers.length; i += batchSize) {
          const batch = db.batch();
          oldUsers.slice(i, i + batchSize).forEach(u => {
            const name = cleanUserText(u.name);
            const seflik = cleanUserText(u.seflik);
            if (!name || !seflik) return;

            const key = firebaseUserKey(name, seflik);
            batch.set(db.collection(FIREBASE_USERS_COLLECTION).doc(key), {
              id: key,
              userKey: key,
              name,
              seflik,
              firstLogin: u.firstLogin || "",
              lastLogin: u.lastLogin || "",
              loginCount: Number(u.loginCount || 0),
              backupCount: Number(u.backupCount || 0),
              deviceCount: Number(u.deviceCount || 0),
              source: "appsScriptMigration",
              migratedAt: firebaseDateText(),
              migratedAtMs: Date.now()
            }, { merge: true });
            done++;
          });
          await batch.commit();
        }

        showToast(`${done} kullanıcı Firebase’e aktarıldı.`);
        loadAdminPanelData().catch(() => {});
      } catch (error) {
        showToast(error && error.message ? error.message : "Aktarım yapılamadı.");
      }
    }


    els.backupBtn.addEventListener("click", backup);
    els.restoreBtn.addEventListener("click", () => els.restoreInput.click());
    els.restoreInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) restoreFromFile(file);
      e.target.value = "";
    });
    els.printBtn.addEventListener("click", () => {
      if (!state.records.length) return showErrorToast("Yazdırılacak kayıt yok.");
      render();
      if (typeof forceRefreshSummaryCards === "function") forceRefreshSummaryCards();
      printBeyanOnly();
    });
    if (els.undoBtn) els.undoBtn.addEventListener("click", undoLastDelete);
    els.deleteAllBtn.addEventListener("click", () => {
      if (!state.records.length) return showToast("Silinecek kayıt yok.");
      if (!confirm("Tüm kayıtlar silinsin mi?")) return;

      state.lastUndo = { type: "all", records: state.records.slice() };
      state.records = [];

      saveRecords();
      render();
      forceRefreshSummaryCards();
      showUndoBanner("Tüm kayıtlar silindi.");
      showToast("Tüm kayıtlar silindi. Geri almak için Geri Al butonunu kullanın.");
    });


    
    if (els.userMenuForceUpdateBtn) els.userMenuForceUpdateBtn.addEventListener("click", forceUpdateApp);

    if (els.panelReportIssueBtn) els.panelReportIssueBtn.addEventListener("click", openIssueReportPanel);
if (els.panelAdminOpenBtn) els.panelAdminOpenBtn.addEventListener("click", openAdminFromUserPanel);
    if (els.issueReportCloseBtn) els.issueReportCloseBtn.addEventListener("click", closeIssueReportPanel);
    if (els.issueReportCancelBtn) els.issueReportCancelBtn.addEventListener("click", closeIssueReportPanel);
    if (els.issueReportSendBtn) els.issueReportSendBtn.addEventListener("click", sendIssueReport);
    document.querySelectorAll(".admin-report-filter").forEach(btn => btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-report-filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      adminReportFilter = btn.dataset.reportFilter || "open";
      renderAdminReports();
    }));

    if (els.guideForceUpdateBtn) els.guideForceUpdateBtn.addEventListener("click", forceUpdateApp);
    if (els.adminRefreshBtn) els.adminRefreshBtn.addEventListener("click", () => loadAdminPanelData().catch(err => showToast(err && err.message ? err.message : "Admin yenilenemedi.")));
    document.querySelectorAll(".admin-tab").forEach(btn => btn.addEventListener("click", () => setAdminPanelTab(btn.dataset.adminTab || "dashboard")));
    document.querySelectorAll(".admin-quick").forEach(btn => btn.addEventListener("click", () => {
      state.adminQuickFilter = btn.dataset.adminQuick || "all";
      document.querySelectorAll(".admin-quick").forEach(b => b.classList.toggle("active", b === btn));
      renderAdminUsers();
    }));
    if (els.adminUserSearch) els.adminUserSearch.addEventListener("input", () => { renderAdminUsers(); });
    if (els.adminSeflikFilter) els.adminSeflikFilter.addEventListener("change", () => { renderAdminUsers(); });

    try {
      state.adminNotes = JSON.parse(localStorage.getItem("mesaha_admin_notes_v1") || "{}") || {};
      state.adminDisabledUsers = JSON.parse(localStorage.getItem("mesaha_admin_disabled_v1") || "{}") || {};
    } catch {
      state.adminNotes = {};
      state.adminDisabledUsers = {};
    }

    els.navEntry.addEventListener("click", () => {
      document.body.classList.remove("show-records", "show-guide", "show-admin");
      els.navEntry.classList.add("active");
      els.navRecords.classList.remove("active");
      if (els.navGuide) els.navGuide.classList.remove("active");
      if (els.navAdmin) els.navAdmin.classList.remove("active");
      focusDiameterKeepKeyboard();
    });

    els.navRecords.addEventListener("click", () => {
      document.body.classList.add("show-records");
      document.body.classList.remove("show-guide", "show-admin");
      els.navRecords.classList.add("active");
      els.navEntry.classList.remove("active");
      if (els.navGuide) els.navGuide.classList.remove("active");
      if (els.navAdmin) els.navAdmin.classList.remove("active");
      render();
    });

    if (els.navGuide) {
      els.navGuide.addEventListener("click", () => {
        document.body.classList.add("show-guide");
        document.body.classList.remove("show-records", "show-admin");
        els.navGuide.classList.add("active");
        els.navEntry.classList.remove("active");
        els.navRecords.classList.remove("active");
        if (els.navAdmin) els.navAdmin.classList.remove("active");
      });
    }


    if (els.navAdmin) {
      els.navAdmin.addEventListener("click", () => {
        if (sessionStorage.getItem("mesaha_admin_panel_open") !== "1") return unlockAdminPanel();
        showAdminPage();
        loadAdminPanelData().catch(() => {});
      });
      if (sessionStorage.getItem("mesaha_admin_panel_open") === "1") {
        els.navAdmin.style.display = "";
        const bottomNav = document.querySelector(".bottom-nav");
        if (bottomNav) bottomNav.classList.add("has-admin");
      }
    }


    
    /* v111: v91 tabanlı temiz ek özellikler */
    function hideOldNavsV111() {
      document.querySelectorAll(".bottom-nav, #stableNavV105, .stable-nav-v105").forEach(n => {
        n.style.setProperty("display", "none", "important");
        n.style.setProperty("visibility", "hidden", "important");
        n.style.setProperty("pointer-events", "none", "important");
      });
    }

    function updateFlowTabsV111() {
      const tabs = document.getElementById("flowTabsV111");
      if (!tabs) return;

      tabs.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      if (document.body.classList.contains("show-admin")) tabs.querySelector('[data-flow-tab="admin"]')?.classList.add("active");
      else if (document.body.classList.contains("show-records")) tabs.querySelector('[data-flow-tab="records"]')?.classList.add("active");
      else if (document.body.classList.contains("show-guide")) tabs.querySelector('[data-flow-tab="guide"]')?.classList.add("active");
      else tabs.querySelector('[data-flow-tab="entry"]')?.classList.add("active");
    }

    function bindFlowTabsV111() {
      const tabs = document.getElementById("flowTabsV111");
      if (!tabs || tabs.__v111Bound) return;
      tabs.__v111Bound = true;

      tabs.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-flow-tab]");
        if (!btn) return;

        event.preventDefault();
        const target = btn.dataset.flowTab;

        if (target === "entry" && els.navEntry) els.navEntry.click();
        if (target === "records" && els.navRecords) els.navRecords.click();
        if (target === "guide" && els.navGuide) els.navGuide.click();
        if (target === "admin") {
          if (els.navAdmin && els.navAdmin.style.display !== "none") els.navAdmin.click();
          else if (typeof openAdminFromUserPanel === "function") openAdminFromUserPanel();
          else if (typeof unlockAdminPanel === "function") unlockAdminPanel();
        }

        updateFlowTabsV111();
        renderMobileRecordsV111(true);
        hideOldNavsV111();
      });
    }

    function productShortV111(product) {
      const key = normalizeProductType(product || "Tomruk");
      if (key === "Maden Direk") return "Mdn";
      if (key === "Kağıtlık") return "Kğt";
      if (key === "Sanayi Odunu") return "San";
      if (key === "Tel Direk") return "Tel";
      return "Tmk";
    }

    function treeShortV111(tree) {
      const key = typeof normalizeTreeType === "function" ? normalizeTreeType(tree || "Karaçam") : String(tree || "Karaçam");
      if (key === "Sarıçam") return "ÇS";
      if (key === "Sedir") return "S";
      if (key === "Göknar") return "GN";
      if (key === "Kızılçam") return "ÇZ";
      return "ÇK";
    }

    function productClassV111(product) {
      const key = normalizeProductType(product || "Tomruk");
      if (key === "Maden Direk") return "maden";
      if (key === "Kağıtlık") return "kagit";
      if (key === "Sanayi Odunu") return "sanayi";
      if (key === "Tel Direk") return "tel";
      return "tomruk";
    }

    function getFilteredRecordsV111() {
      return typeof getFilteredRecords === "function" ? getFilteredRecords() : (state.records || []);
    }

    function renderMobileRecordsV111(force = false) {
      const wrap = document.getElementById("mobileRecordsV111");
      if (!wrap) return;

      const list = getFilteredRecordsV111();
      if (!state.selectedRecordIds) state.selectedRecordIds = new Set();

      if (!list.length) {
        wrap.innerHTML = `<div class="empty">Kayıt yok.</div>`;
        if (typeof updateBulkActions === "function") updateBulkActions(list);
        return;
      }

      wrap.innerHTML = list.map((r, idx) => {
        const product = normalizeProductType(r.productType || r.woodType || r.odunAdi || "Tomruk");
        const cls = productClassV111(product);
        const tree = r.treeType || r.agacAdi || "Karaçam";
        const id = String(r.id || "");
        const checked = state.selectedRecordIds.has(id);
        const barcode = r.barcode || r.barkodNo || "-";
        const length = r.length || r.boy || "-";
        const diameter = r.diameter || r.cap || "-";
        const quantity = r.quantity || r.adet || 1;

        return `
          <div class="record-row-v111 ${cls} ${checked ? "selected" : ""}" data-v111-row="${escapeHtml(id)}">
            <label class="record-select-v111" title="Seç">
              <input type="checkbox" data-v111-select="${escapeHtml(id)}" ${checked ? "checked" : ""} />
            </label>

            <div class="record-main-v111">
              <b>${escapeHtml(barcode)}</b>
              <div class="record-tags-v111">
                <span class="mini-tag-v111 ${cls}" title="${escapeHtml(product)}">${escapeHtml(productShortV111(product))}</span>
                <span class="mini-tag-v111 tree" title="${escapeHtml(tree)}">${escapeHtml(treeShortV111(tree))}</span>
              </div>
            </div>

            <div class="record-values-v111">
              <div class="record-val-v111"><small>B</small><strong>${escapeHtml(String(length))}</strong></div>
              <div class="record-val-v111"><small>Ç</small><strong>${escapeHtml(String(diameter))}</strong></div>
              <div class="record-val-v111"><small>A</small><strong>${escapeHtml(String(quantity))}</strong></div>
            </div>

            <div class="record-actions-v111">
              <button type="button" class="record-edit-v111" data-v111-edit="${escapeHtml(id)}">Düz</button>
              <button type="button" class="record-delete-v111" data-v111-delete="${escapeHtml(id)}">Sil</button>
            </div>
          </div>
        `;
      }).join("");

      if (typeof updateBulkActions === "function") updateBulkActions(list);
    }

    function bindMobileRecordsV111() {
      const wrap = document.getElementById("mobileRecordsV111");
      if (!wrap || wrap.__v111Bound) return;
      wrap.__v111Bound = true;

      wrap.addEventListener("change", (event) => {
        const box = event.target.closest("[data-v111-select]");
        if (!box) return;

        const id = box.dataset.v111Select;
        if (!state.selectedRecordIds) state.selectedRecordIds = new Set();

        if (box.checked) state.selectedRecordIds.add(id);
        else state.selectedRecordIds.delete(id);

        const row = wrap.querySelector(`[data-v111-row="${CSS.escape(id)}"]`);
        if (row) row.classList.toggle("selected", box.checked);

        if (typeof updateBulkActions === "function") updateBulkActions(getFilteredRecordsV111());
      });

      wrap.addEventListener("click", (event) => {
        const edit = event.target.closest("[data-v111-edit]");
        if (edit) {
          event.preventDefault();
          if (typeof editRecord === "function") editRecord(edit.dataset.v111Edit);
          return;
        }

        const del = event.target.closest("[data-v111-delete]");
        if (del) {
          event.preventDefault();
          const id = del.dataset.v111Delete;
          if (typeof deleteRecord === "function") deleteRecord(id);
          else if (typeof removeRecord === "function") removeRecord(id);
          setTimeout(() => renderMobileRecordsV111(true), 60);
        }
      });
    }

    function wrapSelectionFunctionsV111() {
      const wrapNames = ["selectFilteredRecords", "clearRecordSelection", "toggleRecordSelection", "toggleSelectFiltered"];
      wrapNames.forEach(name => {
        const fn = window[name];
        if (typeof fn === "function" && !fn.__v111Wrapped) {
          window[name] = function(...args) {
            const result = fn.apply(this, args);
            setTimeout(() => renderMobileRecordsV111(true), 30);
            return result;
          };
          window[name].__v111Wrapped = true;
        }
      });
    }

    function wrapRenderV111() {
      if (typeof render === "function" && !render.__v111Wrapped) {
        const originalRenderV111 = render;
        render = function(...args) {
          const result = originalRenderV111.apply(this, args);
          setTimeout(() => {
            renderMobileRecordsV111(true);
            updateFlowTabsV111();
            hideOldNavsV111();
          }, 20);
          return result;
        };
        render.__v111Wrapped = true;
      }
    }

    // Sorun Bildir güvenli kapatma/açma
    function closeIssueReportPanelV111() {
      if (els.issueReportOverlay) {
        els.issueReportOverlay.classList.remove("show");
        els.issueReportOverlay.style.display = "none";
      }
      document.body.classList.remove("issue-panel-open");
      updateFlowTabsV111();
    }

    function openIssueReportPanelV111() {
      const active = state.activeUser || findActiveUser();
      if (!active || !active.name || !active.seflik) {
        showToast("Önce kullanıcı girişi yapınız.");
        return;
      }

      try { closeUserPanel(); } catch {}
      document.body.classList.add("issue-panel-open");
      if (els.issueReportMessage) els.issueReportMessage.value = "";
      if (els.issueReportUserInfo) els.issueReportUserInfo.textContent = `${active.name} • ${active.seflik}`;
      if (els.issueReportOverlay) {
        els.issueReportOverlay.style.display = "flex";
        els.issueReportOverlay.classList.add("show");
      }
      if (typeof loadMyIssueReports === "function") loadMyIssueReports().catch(() => {});
      setTimeout(() => { if (els.issueReportMessage) els.issueReportMessage.focus(); }, 120);
    }

    function rebindIssueButtonsV111() {
      openIssueReportPanel = openIssueReportPanelV111;
      closeIssueReportPanel = closeIssueReportPanelV111;

      [[els.issueReportCloseBtn, closeIssueReportPanelV111], [els.issueReportCancelBtn, closeIssueReportPanelV111], [els.panelReportIssueBtn, openIssueReportPanelV111]].forEach(([btn, fn]) => {
        if (!btn || btn.__v111Bound) return;
        const clone = btn.cloneNode(true);
        clone.__v111Bound = true;
        btn.parentNode.replaceChild(clone, btn);
        clone.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          fn();
        });
        if (btn === els.issueReportCloseBtn) els.issueReportCloseBtn = clone;
        if (btn === els.issueReportCancelBtn) els.issueReportCancelBtn = clone;
        if (btn === els.panelReportIssueBtn) els.panelReportIssueBtn = clone;
      });

      if (els.issueReportOverlay && !els.issueReportOverlay.__v111Overlay) {
        els.issueReportOverlay.__v111Overlay = true;
        els.issueReportOverlay.addEventListener("click", (event) => {
          if (event.target === els.issueReportOverlay) closeIssueReportPanelV111();
        });
      }
    }

    // Temiz Giriş Modu
    function cleanElsV111() {
      return {
        overlay: document.getElementById("cleanSimpleOverlayV111"),
        close: document.getElementById("cleanSimpleCloseV111"),
        grid: document.getElementById("cleanProductGridV111"),
        len: document.getElementById("cleanLengthV111"),
        dia: document.getElementById("cleanDiameterV111"),
        lenChips: document.getElementById("cleanLengthChipsV111"),
        diaChips: document.getElementById("cleanDiameterChipsV111"),
        save: document.getElementById("cleanSaveV111"),
        auto: document.getElementById("cleanAutoInfoV111"),
        recent: document.getElementById("cleanRecentListV111")
      };
    }

    function cleanSelectedProductV111() {
      const c = cleanElsV111();
      const active = c.grid ? c.grid.querySelector(".clean-product-v111.active") : null;
      return active ? active.dataset.cleanProduct : ((els.productType && els.productType.value) || "Tomruk");
    }

    function renderCleanProductsV111() {
      const c = cleanElsV111();
      if (!c.grid) return;
      const selectedProducts = normalizeVisibleProducts(state.settings && state.settings.visibleProducts);
      const currentRaw = normalizeProductType((els.productType && els.productType.value) || state.settings.lastProductType || selectedProducts[0] || "Tomruk");
      const current = selectedProducts.includes(currentRaw) ? currentRaw : selectedProducts[0];
      const productClasses = {
        "Tomruk":"tomruk",
        "Maden Direk":"maden",
        "Kağıtlık":"kagit",
        "Sanayi Odunu":"sanayi",
        "Tel Direk":"tel"
      };

      c.grid.innerHTML = selectedProducts.map(type => {
        const product = PRODUCT_MAP[type] || PRODUCT_MAP[normalizeProductType(type)] || PRODUCT_MAP["Tomruk"];
        const label = product && product.shortName ? product.shortName : normalizeProductType(type);
        const cls = productClasses[normalizeProductType(type)] || normalizeProductClass(type);
        return `<button type="button" class="clean-product-v111 ${cls} ${normalizeProductType(type) === current ? "active" : ""}" data-clean-product="${escapeHtml(normalizeProductType(type))}">${escapeHtml(label)}</button>`;
      }).join("");
      if (!c.grid.querySelector(".clean-product-v111.active")) c.grid.querySelector(".clean-product-v111")?.classList.add("active");
    }

    function recentValuesV111(field, fallback = []) {
      const values = [];
      (state.records || []).forEach(r => {
        const val = String(r[field] || "").trim();
        if (val && !values.includes(val)) values.push(val);
      });
      fallback.forEach(v => {
        const val = String(v || "").trim();
        if (val && !values.includes(val)) values.push(val);
      });
      return values.slice(0, 6);
    }

    function renderCleanChipsV111() {
      const c = cleanElsV111();
      if (c.lenChips) {
        const lastBoy = (c.len && c.len.value) || (els.length && els.length.value) || localStorage.getItem("mesaha_simple_last_length_v1") || "";
        const values = recentValuesV111("length", [lastBoy, "4", "3", "2.5", "2", "1.5", "1"]);
        c.lenChips.innerHTML = values.map(v => `<button type="button" class="clean-chip-v111 boy" data-clean-length="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join("");
      }
      if (c.diaChips) {
        const lastCap = (c.dia && c.dia.value) || (els.diameter && els.diameter.value) || "";
        const values = recentValuesV111("diameter", [lastCap, "32", "28", "26", "24", "22", "21"]);
        c.diaChips.innerHTML = values.map(v => `<button type="button" class="clean-chip-v111 cap" data-clean-diameter="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join("");
      }
    }

    function renderCleanAutoV111() {
      const c = cleanElsV111();
      if (!c.auto) return;
      const barkod = els.barcode ? (els.barcode.value || "-") : "-";
      const tarih = els.productionDate ? (els.productionDate.value || "-") : "-";
      const adet = els.quantity ? (els.quantity.value || "1") : "1";
      const agac = els.treeType ? (els.treeType.value || "Karaçam") : "Karaçam";
      const urun = cleanSelectedProductV111();
      c.auto.innerHTML = `<b>Otomatik:</b> ${escapeHtml(urun)} • ${escapeHtml(agac)} • Barkod ${escapeHtml(barkod)} • ${escapeHtml(tarih)} • Adet ${escapeHtml(adet)}`;
    }

    function renderCleanRecentV111() {
      const c = cleanElsV111();
      if (!c.recent) return;
      const recent = (state.records || []).slice(0, 3);
      if (!recent.length) {
        c.recent.innerHTML = `<div class="clean-empty-v111">Henüz kayıt yok</div>`;
        return;
      }
      c.recent.innerHTML = recent.map(r => {
        const product = normalizeProductType(r.productType || "Tomruk");
        const cls = normalizeProductClass(product);
        return `<div class="clean-recent-item-v114 ${cls}"><div><b>${escapeHtml(r.barcode || "-")}</b><span>${escapeHtml(productDisplayName(product))} • Boy ${escapeHtml(String(r.length || "-"))} • Çap ${escapeHtml(String(r.diameter || "-"))}</span></div><strong>${escapeHtml(String(r.quantity || 1))} adet</strong></div>`;
      }).join("");
    }

    function setCleanInputV111(input, value) {
      if (!input) return;
      input.value = String(value || "");
      setTimeout(() => {
        try { input.focus({ preventScroll:true }); input.select(); } catch { try { input.focus(); input.select(); } catch {} }
      }, 0);
    }

    function openCleanSimpleV111() {
      const c = cleanElsV111();
      if (!c.overlay) return;
      if (els.simpleModeOverlay) els.simpleModeOverlay.classList.remove("show");
      renderCleanProductsV111();
      if (c.len) c.len.value = localStorage.getItem("mesaha_simple_last_length_v1") || (els.length ? (els.length.value || "") : "");
      if (c.dia) c.dia.value = els.diameter ? (els.diameter.value || "") : "";
      renderCleanChipsV111();
      renderCleanAutoV111();
      renderCleanRecentV111();
      c.overlay.classList.add("show");
      document.body.classList.add("clean-simple-open-v111");
      setTimeout(() => { try { c.dia.focus({ preventScroll:true }); c.dia.select(); } catch {} }, 120);
    }

    function closeCleanSimpleV111() {
      const c = cleanElsV111();
      if (c.overlay) c.overlay.classList.remove("show");
      document.body.classList.remove("clean-simple-open-v111");
      updateFlowTabsV111();
    }

    function saveCleanSimpleV111() {
      const c = cleanElsV111();
      const boy = c.len ? String(c.len.value || "").trim() : "";
      const cap = c.dia ? String(c.dia.value || "").trim() : "";
      if (!boy || !cap) {
        showToast("Boy ve çap giriniz.");
        setCleanInputV111(!boy ? c.len : c.dia, !boy ? boy : cap);
        return;
      }

      localStorage.setItem("mesaha_simple_last_length_v1", boy);
      const before = Array.isArray(state.records) ? state.records.length : 0;

      if (els.length) els.length.value = boy;
      if (els.diameter) els.diameter.value = cap;
      const selected = cleanSelectedProductV111();
      if (typeof setProductType === "function") setProductType(selected, true);
      else if (els.productType) els.productType.value = selected;

      try {
        if (els.form && els.form.requestSubmit) els.form.requestSubmit(els.submitBtn || undefined);
        else if (els.form) els.form.dispatchEvent(new Event("submit", { bubbles:true, cancelable:true }));
      } catch {
        if (els.submitBtn) els.submitBtn.click();
      }

      setTimeout(() => {
        const after = Array.isArray(state.records) ? state.records.length : 0;
        renderCleanRecentV111();
        renderCleanAutoV111();
        renderCleanChipsV111();
        renderMobileRecordsV111(true);
        if (after > before) {
          if (c.dia) c.dia.value = "";
          if (els.diameter) els.diameter.value = "";
          if (c.len) c.len.value = boy;
          if (els.length) els.length.value = boy;
          setCleanInputV111(c.dia, "");
        }
      }, 260);
    }

    function bindCleanSimpleV111() {
      const c = cleanElsV111();
      if (window.__cleanSimpleV111Bound) return;
      window.__cleanSimpleV111Bound = true;

      c.close?.addEventListener("click", closeCleanSimpleV111);
      c.save?.addEventListener("click", saveCleanSimpleV111);
      c.overlay?.addEventListener("click", (event) => { if (event.target === c.overlay) closeCleanSimpleV111(); });

      c.grid?.addEventListener("click", (event) => {
        const btn = event.target.closest(".clean-product-v111");
        if (!btn) return;
        c.grid.querySelectorAll(".clean-product-v111").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderCleanAutoV111();
      });

      c.lenChips?.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-clean-length]");
        if (!btn) return;
        setCleanInputV111(c.len, btn.dataset.cleanLength || "");
      });

      c.diaChips?.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-clean-diameter]");
        if (!btn) return;
        setCleanInputV111(c.dia, btn.dataset.cleanDiameter || "");
      });

      c.len?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") { event.preventDefault(); c.dia?.focus(); c.dia?.select(); }
      });
      c.dia?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") { event.preventDefault(); saveCleanSimpleV111(); }
      });
    }

    function rebindSimpleButtonV111() {
      const oldBtn = document.getElementById("simpleModeBtn");
      if (!oldBtn || oldBtn.__v111Bound) return;
      const newBtn = oldBtn.cloneNode(true);
      newBtn.__v111Bound = true;
      oldBtn.parentNode.replaceChild(newBtn, oldBtn);
      newBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openCleanSimpleV111();
      });
      if (typeof els !== "undefined") els.simpleModeBtn = newBtn;
    }

    if (typeof showErrorToast === "function" && !showErrorToast.__v111Focus) {
      const errOriginalV111 = showErrorToast;
      showErrorToast = function(message, ...rest) {
        const result = errOriginalV111.call(this, message, ...rest);
        if (document.body.classList.contains("clean-simple-open-v111")) {
          const c = cleanElsV111();
          const text = String(message || "").toLowerCase("tr-TR");
          const target = text.includes("boy") ? c.len : c.dia;
          setCleanInputV111(target, target ? target.value : "");
        }
        return result;
      };
      showErrorToast.__v111Focus = true;
    }

    function keepNaturalScrollV111() {
      document.documentElement.style.overflowY = "auto";
      document.body.style.overflowY = "auto";
      document.body.style.position = "static";
      document.body.style.touchAction = "auto";
      const app = document.querySelector(".app");
      if (app) {
        app.style.overflow = "visible";
        app.style.height = "auto";
      }
      hideOldNavsV111();
    }

    bindFlowTabsV111();
    bindMobileRecordsV111();
    wrapSelectionFunctionsV111();
    wrapRenderV111();
    rebindIssueButtonsV111();
    bindCleanSimpleV111();
    rebindSimpleButtonV111();
    hideOldNavsV111();
    keepNaturalScrollV111();
    updateFlowTabsV111();
    renderMobileRecordsV111(true);

    window.addEventListener("resize", keepNaturalScrollV111, { passive:true });


    
    /* v112: Giriş Modu ve Karanlık Mod görünür butonları */
    function applyThemeV112(mode) {
      const dark = mode === "dark";
      document.body.classList.toggle("theme-dark", dark);
      document.documentElement.classList.toggle("theme-dark", dark);
      try { localStorage.setItem("mesaha_theme_v112", dark ? "dark" : "light"); } catch {}
      const btn = document.getElementById("themeToggleV112");
      if (btn) btn.textContent = dark ? "Aydınlık" : "Karanlık";
    }

    function initThemeV112() {
      let saved = "light";
      try {
        saved = localStorage.getItem("mesaha_theme_v112") || localStorage.getItem("mesaha_theme") || localStorage.getItem("theme") || "light";
      } catch {}
      if (saved === "dark" || document.body.classList.contains("theme-dark")) applyThemeV112("dark");
      else applyThemeV112("light");
    }

    function bindTopActionsV112() {
      const simpleBtn = document.getElementById("openSimpleV112");
      const themeBtn = document.getElementById("themeToggleV112");

      if (simpleBtn && !simpleBtn.__v112Bound) {
        simpleBtn.__v112Bound = true;
        simpleBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (typeof openCleanSimpleV111 === "function") openCleanSimpleV111();
          else if (typeof openCleanSimpleV110 === "function") openCleanSimpleV110();
          else if (typeof simpleOpenModeV93 === "function") simpleOpenModeV93();
          else showToast("Giriş Modu hazır değil.");
        });
      }

      if (themeBtn && !themeBtn.__v112Bound) {
        themeBtn.__v112Bound = true;
        themeBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const isDark = document.body.classList.contains("theme-dark");
          applyThemeV112(isDark ? "light" : "dark");
        });
      }
    }

    bindTopActionsV112();
    initThemeV112();


    
    /* v113: Giriş Modu tam ekran + genel karanlık mod */
    function ensureCleanHeaderSaveV113() {
      const head = document.querySelector(".clean-simple-head-v111");
      if (!head || document.getElementById("cleanHeaderSaveV113")) return;
      const btn = document.createElement("button");
      btn.id = "cleanHeaderSaveV113";
      btn.className = "clean-header-save-v113";
      btn.type = "button";
      btn.textContent = "Kaydet";
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof saveCleanSimpleV111 === "function") saveCleanSimpleV111();
      });
      head.appendChild(btn);
    }

    function applyThemeV113(mode) {
      const dark = mode === "dark";
      document.body.classList.toggle("theme-dark", dark);
      document.documentElement.classList.toggle("theme-dark", dark);
      try {
        localStorage.setItem("mesaha_theme_v112", dark ? "dark" : "light");
        localStorage.setItem("mesaha_theme_v113", dark ? "dark" : "light");
      } catch {}

      const btn = document.getElementById("themeToggleV112");
      if (btn) btn.textContent = dark ? "☀️ Aydınlık" : "🌙 Karanlık";
    }

    function initThemeV113() {
      let saved = "light";
      try {
        saved = localStorage.getItem("mesaha_theme_v113") || localStorage.getItem("mesaha_theme_v112") || localStorage.getItem("mesaha_theme") || localStorage.getItem("theme") || "light";
      } catch {}
      applyThemeV113(saved === "dark" ? "dark" : "light");
    }

    // v112 tema fonksiyonunu geniş tema fonksiyonuna yönlendir.
    applyThemeV112 = applyThemeV113;
    initThemeV112 = initThemeV113;

    function openCleanSimpleV113() {
      const c = cleanElsV111();
      if (!c.overlay) return;

      if (els.simpleModeOverlay) els.simpleModeOverlay.classList.remove("show");
      ensureCleanHeaderSaveV113();

      renderCleanProductsV111();
      if (c.len) c.len.value = localStorage.getItem("mesaha_simple_last_length_v1") || (els.length ? (els.length.value || "") : "");
      if (c.dia) c.dia.value = els.diameter ? (els.diameter.value || "") : "";

      renderCleanChipsV111();
      renderCleanAutoV111();
      renderCleanRecentV111();

      c.overlay.classList.add("show");
      document.body.classList.add("clean-simple-open-v111");

      // Klavye otomatik açılmasın; Kaydet butonu üstte kalır.
    }

    openCleanSimpleV111 = openCleanSimpleV113;

    function bindTopActionsV113() {
      const simpleBtn = document.getElementById("openSimpleV112");
      const themeBtn = document.getElementById("themeToggleV112");

      if (simpleBtn) {
        simpleBtn.textContent = "⚡ Giriş Modu";
        if (!simpleBtn.__v113Bound) {
          simpleBtn.__v113Bound = true;
          simpleBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openCleanSimpleV113();
          }, true);
        }
      }

      if (themeBtn) {
        const isDark = document.body.classList.contains("theme-dark");
        themeBtn.textContent = isDark ? "☀️ Aydınlık" : "🌙 Karanlık";
        if (!themeBtn.__v113Bound) {
          themeBtn.__v113Bound = true;
          themeBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const darkNow = document.body.classList.contains("theme-dark");
            applyThemeV113(darkNow ? "light" : "dark");
          }, true);
        }
      }
    }

    ensureCleanHeaderSaveV113();
    bindTopActionsV113();
    initThemeV113();

    setTimeout(() => {
      ensureCleanHeaderSaveV113();
      bindTopActionsV113();
      const darkNow = document.body.classList.contains("theme-dark");
      const btn = document.getElementById("themeToggleV112");
      if (btn) btn.textContent = darkNow ? "☀️ Aydınlık" : "🌙 Karanlık";
    }, 200);


    
    /* v114: Giriş Modu son 3 barkodları renkli ve karanlık mod daha güçlü */
    function productClassV114(product) {
      const key = normalizeProductType(product || "Tomruk");
      if (key === "Maden Direk") return "maden";
      if (key === "Kağıtlık") return "kagit";
      if (key === "Sanayi Odunu") return "sanayi";
      if (key === "Tel Direk") return "tel";
      return "tomruk";
    }

    function renderCleanRecentV114() {
      const c = cleanElsV111();
      if (!c.recent) return;

      const recent = (state.records || []).slice(0, 3);
      if (!recent.length) {
        c.recent.innerHTML = `<div class="clean-empty-v111">Henüz kayıt yok</div>`;
        return;
      }

      c.recent.innerHTML = recent.map(r => {
        const product = normalizeProductType(r.productType || r.woodType || r.odunAdi || "Tomruk");
        const cls = productClassV114(product);
        const barkod = r.barcode || r.barkodNo || "-";
        const boy = r.length || r.boy || "-";
        const cap = r.diameter || r.cap || "-";
        const adet = r.quantity || r.adet || 1;

        return `
          <div class="clean-recent-item-v114 ${cls}">
            <div>
              <b>${escapeHtml(String(barkod))}</b>
              <span>${escapeHtml(product)} • B ${escapeHtml(String(boy))} • Ç ${escapeHtml(String(cap))} • A ${escapeHtml(String(adet))}</span>
            </div>
          </div>
        `;
      }).join("");
    }

    renderCleanRecentV111 = renderCleanRecentV114;

    function repaintDarkInlineV114() {
      if (document.body.classList.contains("clean-simple-open-v111") || document.body.classList.contains("inline-simple-v119")) return;
      if (!document.body.classList.contains("theme-dark")) return;

      document.querySelectorAll('[style*="background"]').forEach(el => {
        const s = (el.getAttribute("style") || "").toLowerCase();
        if (s.includes("white") || s.includes("#fff") || s.includes("rgb(255")) {
          if (!el.classList.contains("clean-recent-item-v114") && !el.className.toString().includes("mini-tag")) {
            el.style.setProperty("background", "#101c2e", "important");
            el.style.setProperty("color", "#e8eef8", "important");
            el.style.setProperty("border-color", "#3e526d", "important");
          }
        }
      });
    }

    const oldApplyThemeV113For114 = typeof applyThemeV113 === "function" ? applyThemeV113 : null;
    applyThemeV113 = function(mode) {
      if (oldApplyThemeV113For114) oldApplyThemeV113For114(mode);
      const dark = mode === "dark";
      document.body.classList.toggle("theme-dark", dark);
      document.documentElement.classList.toggle("theme-dark", dark);
      try {
        localStorage.setItem("mesaha_theme_v113", dark ? "dark" : "light");
        localStorage.setItem("mesaha_theme_v112", dark ? "dark" : "light");
      } catch {}
      const btn = document.getElementById("themeToggleV112");
      if (btn) btn.textContent = dark ? "☀️ Aydınlık" : "🌙 Karanlık";
      setTimeout(repaintDarkInlineV114, 40);
    };

    applyThemeV112 = applyThemeV113;

    const oldOpenCleanSimpleV113For114 = typeof openCleanSimpleV113 === "function" ? openCleanSimpleV113 : null;
    openCleanSimpleV113 = function() {
      if (oldOpenCleanSimpleV113For114) oldOpenCleanSimpleV113For114();
      setTimeout(renderCleanRecentV114, 40);
      setTimeout(repaintDarkInlineV114, 80);
    };
    openCleanSimpleV111 = openCleanSimpleV113;

    setTimeout(() => {
      renderCleanRecentV114();
      repaintDarkInlineV114();
    }, 150);

    setInterval(() => {
      if (document.body.classList.contains("theme-dark")) repaintDarkInlineV114();
    }, 2000);


    
    /* v115: karanlık moddaki beyaz alanları uygulama içinde de koyulaştır */
    function isProductColorElementV115(el) {
      if (!el || !el.classList) return false;
      return ["tomruk","maden","kagit","sanayi","tel","tree","tree-saricam","mini-tag-v111","tag","chip","clean-product-v111","clean-chip-v111","clean-recent-item-v114"].some(c => el.classList.contains(c));
    }

    function forceDarkPanelsV115() {
      if (document.body.classList.contains("clean-simple-open-v111") || document.body.classList.contains("inline-simple-v119")) return;
      if (!document.body.classList.contains("theme-dark")) return;

      const whiteLike = ["rgb(255, 255, 255)", "white", "#fff", "#ffffff", "rgb(248, 250, 252)", "rgb(241, 245, 249)", "rgba(255, 255, 255"];
      document.querySelectorAll("div, section, article, form, fieldset, label, aside").forEach(el => {
        if (isProductColorElementV115(el)) return;

        const cs = getComputedStyle(el);
        const bg = (cs.backgroundColor || "").toLowerCase();
        const inline = (el.getAttribute("style") || "").toLowerCase();

        const looksWhite = whiteLike.some(w => bg.includes(w) || inline.includes(w));
        const hasBorder = (cs.borderTopWidth && cs.borderTopWidth !== "0px") || (cs.borderBottomWidth && cs.borderBottomWidth !== "0px");
        const isBox = hasBorder || el.className || el.children.length;

        if (looksWhite && isBox) {
          el.style.setProperty("background", "#1d232c", "important");
          el.style.setProperty("color", "#f2f5f9", "important");
          el.style.setProperty("border-color", "#3a4656", "important");
          el.style.setProperty("box-shadow", "none", "important");
        }
      });

      document.querySelectorAll("input, textarea, select").forEach(el => {
        el.style.setProperty("background", "#111827", "important");
        el.style.setProperty("color", "#f8fafc", "important");
        el.style.setProperty("border-color", "#4b5d72", "important");
      });
    }

    const oldApplyThemeV113For115 = typeof applyThemeV113 === "function" ? applyThemeV113 : null;
    applyThemeV113 = function(mode) {
      if (oldApplyThemeV113For115) oldApplyThemeV113For115(mode);
      const dark = mode === "dark";
      document.body.classList.toggle("theme-dark", dark);
      document.documentElement.classList.toggle("theme-dark", dark);
      try {
        localStorage.setItem("mesaha_theme_v113", dark ? "dark" : "light");
        localStorage.setItem("mesaha_theme_v112", dark ? "dark" : "light");
      } catch {}
      const btn = document.getElementById("themeToggleV112");
      if (btn) btn.textContent = dark ? "☀️ Aydınlık" : "🌙 Karanlık";
      setTimeout(forceDarkPanelsV115, 30);
      setTimeout(forceDarkPanelsV115, 250);
    };

    applyThemeV112 = applyThemeV113;

    const oldOpenCleanSimpleV113For115 = typeof openCleanSimpleV113 === "function" ? openCleanSimpleV113 : null;
    openCleanSimpleV113 = function() {
      if (oldOpenCleanSimpleV113For115) oldOpenCleanSimpleV113For115();
      if (typeof renderCleanRecentV114 === "function") setTimeout(renderCleanRecentV114, 40);
      setTimeout(forceDarkPanelsV115, 80);
    };
    openCleanSimpleV111 = openCleanSimpleV113;

    setTimeout(forceDarkPanelsV115, 120);
    setInterval(() => {
      if (document.body.classList.contains("theme-dark")) forceDarkPanelsV115();
    }, 1500);


    window.forceUpdateApp = forceUpdateApp;
    window.openAdminFromUserPanel = openAdminFromUserPanel;

    window.adminSetReportStatus = adminSetReportStatus;
    window.adminReplyReport = adminReplyReport;

    window.adminOpenUserBackups = adminOpenUserBackups;
    window.adminEditNote = adminEditNote;
    window.adminTogglePassive = adminTogglePassive;
    window.adminShowDetail = adminShowDetail;

    window.toggleRecordSelection = toggleRecordSelection;
    window.deleteRecord = deleteRecord;
    window.editRecord = editRecord;


    /* v116: Karanlık mod sonrası dinamik üretilen Admin/Kılavuz/Beyan alanlarını tekrar boyama */
    function forceDarkReadableV116() {
      if (document.body.classList.contains("clean-simple-open-v111") || document.body.classList.contains("inline-simple-v119")) return;
      if (!document.body.classList.contains("theme-dark")) return;
      const setMany = (selector, props) => {
        document.querySelectorAll(selector).forEach(el => {
          Object.entries(props).forEach(([k, v]) => el.style.setProperty(k, v, "important"));
        });
      };

      setMany(".guide-card, .info-details, .info-body, .recent-barcodes-box, .tomruk-class-panel", {
        background: "#1d232c",
        color: "#f2f5f9",
        "border-color": "#3a4656",
        "box-shadow": "none"
      });
      setMany(".guide-card ol, .guide-card ul, .guide-card li, .guide-card p", { color: "#dbe3ef" });
      setMany(".guide-card h3, .guide-card b, .guide-card strong", { color: "#ffffff" });

      setMany(".totals .stat", {
        color: "#f2f5f9",
        "border-color": "#3a4656",
        "box-shadow": "none"
      });
      setMany(".totals .stat small, .totals .stat .unit", { color: "#b7c4d8" });
      setMany(".totals .stat strong", { color: "#f8fafc" });

      const statBg = {
        "tomruk-stat": ["linear-gradient(135deg, rgba(202,138,4,.22), #1d232c 62%)", "#facc15"],
        "maden-stat": ["linear-gradient(135deg, rgba(37,99,235,.22), #1d232c 62%)", "#93c5fd"],
        "kagit-stat": ["linear-gradient(135deg, rgba(220,38,38,.20), #1d232c 62%)", "#fca5a5"],
        "sanayi-stat": ["linear-gradient(135deg, rgba(22,163,74,.20), #1d232c 62%)", "#86efac"],
        "tel-stat": ["linear-gradient(135deg, rgba(124,58,237,.20), #1d232c 62%)", "#c4b5fd"]
      };
      Object.entries(statBg).forEach(([cls, vals]) => {
        document.querySelectorAll(".totals .stat." + cls).forEach(el => {
          el.style.setProperty("background", vals[0], "important");
          el.style.setProperty("border-left", "8px solid " + vals[1], "important");
        });
      });

      setMany(".admin-panel-top-clean, .admin-summary-card, .admin-dashboard-row, .admin-activity-item, .admin-note-item, .registered-user-item, .registered-user-item.online-user", {
        background: "#1d232c",
        color: "#f2f5f9",
        "border-color": "#3a4656",
        "box-shadow": "none"
      });
      setMany(".registered-user-item.status-today", { background: "linear-gradient(180deg, rgba(34,197,94,.25), #1d232c 68%)", "border-color": "#22c55e" });
      setMany(".registered-user-item.status-warning", { background: "linear-gradient(180deg, rgba(245,158,11,.23), #1d232c 68%)", "border-color": "#f59e0b" });
      setMany(".registered-user-item.status-old", { background: "linear-gradient(180deg, rgba(239,68,68,.22), #1d232c 68%)", "border-color": "#ef4444" });
      setMany(".registered-user-item.status-disabled", { background: "linear-gradient(180deg, rgba(100,116,139,.28), #1d232c 68%)", "border-color": "#94a3b8" });
      setMany(".registered-user-meta span, .admin-summary-card span, .admin-dashboard-row span, .admin-activity-item span, .admin-note-item span", {
        background: "#222a35",
        color: "#dbe3ef",
        "border-color": "#3a4656"
      });
      setMany(".registered-user-head b, .registered-user-item b, .admin-summary-card b, .admin-panel-top-clean h3", { color: "#f8fafc" });
    }

    const oldApplyThemeV113For116 = typeof applyThemeV113 === "function" ? applyThemeV113 : null;
    applyThemeV113 = function(mode) {
      if (oldApplyThemeV113For116) oldApplyThemeV113For116(mode);
      setTimeout(forceDarkReadableV116, 40);
      setTimeout(forceDarkReadableV116, 260);
    };
    applyThemeV112 = applyThemeV113;

    ["render", "renderAdminUsers", "renderAdminSummary", "renderAdminDashboard", "renderAdminNotes", "renderMobileRecordsV111"].forEach(fnName => {
      const oldFn = typeof window[fnName] === "function" ? window[fnName] : null;
      if (!oldFn) return;
      window[fnName] = function(...args) {
        const result = oldFn.apply(this, args);
        setTimeout(forceDarkReadableV116, 30);
        return result;
      };
    });

    setTimeout(forceDarkReadableV116, 180);
    setInterval(() => {
      if (document.body.classList.contains("theme-dark")) forceDarkReadableV116();
    }, 1800);



    /* v118: tema değişince siyah kalan inline stilleri temizle + Giriş Modu klavye alanı */
    function clearThemeInlineV118() {
      const darkFragments = [
        '#1d232c','#222a35','#101c2e','#111827','#07111f','#0a1221','#0d1522','#171d26','#162235','#1b2028','#0f172a','#0b1220','#121c2b','#151f2f',
        '#f2f5f9','#f8fafc','#dbe3ef','#dbeafe','#e8eef8','#eef4ff','#c8d3e4','#a8b5c8',
        'rgb(29, 35, 44)','rgb(34, 42, 53)','rgb(16, 28, 46)','rgb(17, 24, 39)','rgb(7, 17, 31)','rgb(15, 23, 42)','rgb(11, 18, 32)','rgb(18, 28, 43)',
        'linear-gradient(135deg, rgba(202,138,4','linear-gradient(135deg, rgba(37,99,235','linear-gradient(135deg, rgba(220,38,38','linear-gradient(135deg, rgba(22,163,74','linear-gradient(135deg, rgba(124,58,237',
        'linear-gradient(180deg, rgba(34,197,94','linear-gradient(180deg, rgba(245,158,11','linear-gradient(180deg, rgba(239,68,68','linear-gradient(180deg, rgba(100,116,139'
      ];
      const props = ['background','background-color','background-image','color','border-color','box-shadow','border-left','outline'];
      document.querySelectorAll('[style], [data-mesaha-theme-inline-v118]').forEach(el => {
        let touched = el.dataset && el.dataset.mesahaThemeInlineV118 === '1';
        props.forEach(prop => {
          const val = (el.style.getPropertyValue(prop) || '').toLowerCase();
          if (!val) return;
          if (touched || darkFragments.some(f => val.includes(String(f).toLowerCase()))) {
            el.style.removeProperty(prop);
          }
        });
        if (el.dataset) delete el.dataset.mesahaThemeInlineV118;
        if (!el.getAttribute('style')) el.removeAttribute('style');
      });
      document.body.classList.remove('clean-keyboard-v118');
      updateSimpleViewportV118();
    }

    function setThemeInlineV118(selector, props) {
      document.querySelectorAll(selector).forEach(el => {
        if (!el || !el.style) return;
        el.dataset.mesahaThemeInlineV118 = '1';
        Object.entries(props).forEach(([k, v]) => el.style.setProperty(k, v, 'important'));
      });
    }

    function forceDarkReadableV118() {
      if (!document.body.classList.contains('theme-dark')) return;
      setThemeInlineV118('.guide-card, .info-details, .info-body, .recent-barcodes-box, .tomruk-class-panel, .admin-panel-top-clean, .admin-summary-card, .admin-dashboard-row, .admin-activity-item, .admin-note-item, .registered-user-item, .daily-work-summary, .bulk-actions, .tools, .record-row-v111, .record-val-v111', {
        background:'#111827', color:'#eef4ff', 'border-color':'#2b3a50', 'box-shadow':'none'
      });
      setThemeInlineV118('input, textarea, select', {
        background:'#0f172a', color:'#f8fafc', 'border-color':'#3a4a63', 'box-shadow':'none'
      });
      setThemeInlineV118('.registered-user-meta span, .admin-summary-card span, .admin-dashboard-row span, .admin-activity-item span, .admin-note-item span', {
        background:'#151f2f', color:'#dbeafe', 'border-color':'#2b3a50'
      });
    }

    // Eski agresif koyulaştırma fonksiyonlarını v118 sade ve temiz sürüme yönlendir.
    try { repaintDarkInlineV114 = forceDarkReadableV118; } catch {}
    try { forceDarkPanelsV115 = forceDarkReadableV118; } catch {}
    try { forceDarkReadableV116 = forceDarkReadableV118; } catch {}

    function updateSimpleViewportV118() {
      const vv = window.visualViewport;
      const h = vv ? Math.max(320, Math.round(vv.height)) : window.innerHeight;
      const top = vv ? Math.max(0, Math.round(vv.offsetTop || 0)) : 0;
      document.documentElement.style.setProperty('--simple-vh-v118', h + 'px');
      document.documentElement.style.setProperty('--simple-vvtop-v118', top + 'px');
      const keyboardOpen = !!(vv && document.body.classList.contains('clean-simple-open-v111') && h < window.innerHeight - 120);
      document.body.classList.toggle('clean-keyboard-v118', keyboardOpen);
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateSimpleViewportV118);
      window.visualViewport.addEventListener('scroll', updateSimpleViewportV118);
    }
    window.addEventListener('resize', updateSimpleViewportV118);
    updateSimpleViewportV118();

    const oldApplyThemeV118 = typeof applyThemeV113 === 'function' ? applyThemeV113 : null;
    function applyThemeV118(mode) {
      const dark = mode === 'dark';
      if (oldApplyThemeV118) oldApplyThemeV118(dark ? 'dark' : 'light');
      document.body.classList.toggle('theme-dark', dark);
      document.documentElement.classList.toggle('theme-dark', dark);
      try {
        localStorage.setItem('mesaha_theme_v113', dark ? 'dark' : 'light');
        localStorage.setItem('mesaha_theme_v112', dark ? 'dark' : 'light');
      } catch {}
      const btn = document.getElementById('themeToggleV112');
      if (btn) btn.textContent = dark ? '☀️ Aydınlık' : '🌙 Karanlık';
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', dark ? '#090b10' : '#f6f7fb');
      if (dark) {
        setTimeout(forceDarkReadableV118, 30);
        setTimeout(forceDarkReadableV118, 180);
      } else {
        setTimeout(clearThemeInlineV118, 0);
        setTimeout(clearThemeInlineV118, 80);
        setTimeout(clearThemeInlineV118, 260);
      }
    }

    function initThemeV118() {
      let saved = 'light';
      try {
        saved = localStorage.getItem('mesaha_theme_v113') || localStorage.getItem('mesaha_theme_v112') || localStorage.getItem('mesaha_theme') || localStorage.getItem('theme') || 'light';
      } catch {}
      applyThemeV118(saved === 'dark' ? 'dark' : 'light');
    }

    applyThemeV113 = applyThemeV118;
    applyThemeV112 = applyThemeV118;
    initThemeV113 = initThemeV118;
    initThemeV112 = initThemeV118;

    const oldOpenCleanSimpleV118 = typeof openCleanSimpleV113 === 'function' ? openCleanSimpleV113 : (typeof openCleanSimpleV111 === 'function' ? openCleanSimpleV111 : null);
    openCleanSimpleV113 = function() {
      if (oldOpenCleanSimpleV118) oldOpenCleanSimpleV118();
      updateSimpleViewportV118();
      setTimeout(updateSimpleViewportV118, 80);
      setTimeout(() => {
        const c = cleanElsV111 && cleanElsV111();
        if (c && c.len && !c.len.__v118FocusBound) {
          [c.len, c.dia].forEach(inp => {
            if (!inp || inp.__v118FocusBound) return;
            inp.__v118FocusBound = true;
            inp.addEventListener('focus', () => {
              updateSimpleViewportV118();
              setTimeout(() => { try { inp.scrollIntoView({block:'center', behavior:'smooth'}); } catch {} }, 120);
            });
            inp.addEventListener('blur', () => setTimeout(updateSimpleViewportV118, 120));
          });
        }
      }, 120);
    };
    openCleanSimpleV111 = openCleanSimpleV113;

    const oldCloseCleanSimpleV118 = typeof closeCleanSimpleV111 === 'function' ? closeCleanSimpleV111 : null;
    if (oldCloseCleanSimpleV118) {
      closeCleanSimpleV111 = function() {
        const result = oldCloseCleanSimpleV118.apply(this, arguments);
        document.body.classList.remove('clean-keyboard-v118');
        updateSimpleViewportV118();
        return result;
      };
    }

    const oldRenderCleanProductsV118 = typeof renderCleanProductsV111 === 'function' ? renderCleanProductsV111 : null;
    if (oldRenderCleanProductsV118) {
      renderCleanProductsV111 = function() {
        const result = oldRenderCleanProductsV118.apply(this, arguments);
        const c = cleanElsV111 && cleanElsV111();
        if (c && c.grid && !c.grid.querySelector('.clean-product-v111.active')) {
          c.grid.querySelector('.clean-product-v111')?.classList.add('active');
        }
        return result;
      };
    }

    initThemeV118();
    setTimeout(updateSimpleViewportV118, 100);




    /* v119: Panel açmadan sade kayıt modu + çift yönlü tema temizliği */
    function removeThemeInlineV119() {
      const fragments = [
        '#ffffff','#fff','#f8fafc','#f6f7fb','#f5f7fb','#ecfdf5','#dcfce7','#eff6ff','#f1f5f9','#eaf2ff','#eef2ff','#fefce8','#fff7ed','#fef2f2','#f0fdf4',
        '#111827','#101827','#0f172a','#0b1220','#121c2b','#151f2f','#1d232c','#222a35','#101c2e','#07111f','#0a1221','#0d1522','#171d26','#162235','#1b2028',
        '#f2f5f9','#dbe3ef','#dbeafe','#e8eef8','#eef4ff','#c8d3e4','#a8b5c8',
        'rgb(255, 255, 255)','rgb(248, 250, 252)','rgb(246, 247, 251)','rgb(245, 247, 251)','rgb(236, 253, 245)',
        'rgb(17, 24, 39)','rgb(15, 23, 42)','rgb(11, 18, 32)','rgb(18, 28, 43)','rgb(29, 35, 44)','rgb(34, 42, 53)',
        'linear-gradient(135deg','linear-gradient(180deg','rgba(255,255,255','rgba(15,23,42','rgba(0,0,0'
      ];
      const props = ['background','background-color','background-image','color','border-color','border-left','border-right','border-top','border-bottom','box-shadow','outline'];
      document.querySelectorAll('[style], [data-mesaha-theme-inline-v118], [data-mesaha-theme-inline-v119]').forEach(el => {
        const marked = el.dataset && (el.dataset.mesahaThemeInlineV118 === '1' || el.dataset.mesahaThemeInlineV119 === '1');
        props.forEach(prop => {
          const val = (el.style.getPropertyValue(prop) || '').toLowerCase();
          if (!val) return;
          if (marked || fragments.some(f => val.includes(String(f).toLowerCase()))) el.style.removeProperty(prop);
        });
        if (el.dataset) {
          delete el.dataset.mesahaThemeInlineV118;
          delete el.dataset.mesahaThemeInlineV119;
        }
        if (!el.getAttribute('style')) el.removeAttribute('style');
      });
    }

    function setThemeInlineV119(selector, props) {
      document.querySelectorAll(selector).forEach(el => {
        if (!el || !el.style) return;
        el.dataset.mesahaThemeInlineV119 = '1';
        Object.entries(props).forEach(([k, v]) => el.style.setProperty(k, v, 'important'));
      });
    }

    function forceDarkReadableV119() {
      if (!document.body.classList.contains('theme-dark')) return;
      setThemeInlineV119('.panel, .panel-header, .panel-body, .info-details, .info-body, .product-compact, .measure-field, .barcode-field-final, .save-field-final, .recent-barcodes-box, .daily-work-summary, .bulk-actions, .tools, .guide-card, .admin-panel-top-clean, .admin-summary-card, .admin-dashboard-row, .admin-activity-item, .admin-note-item, .registered-user-item, .record-row-v111, .record-val-v111, .mobile-records-v111, .usage-card, .searchbar, .wood-type-panel, .wood-check, .tomruk-class-panel', {
        background:'#111827', color:'#eef4ff', 'border-color':'#2d3b50', 'box-shadow':'0 10px 24px rgba(0,0,0,.18)'
      });
      setThemeInlineV119('input, textarea, select', {
        background:'#0f172a', color:'#f8fafc', 'border-color':'#3a4a63', 'box-shadow':'none'
      });
      setThemeInlineV119('.registered-user-meta span, .admin-summary-card span, .admin-dashboard-row span, .admin-activity-item span, .admin-note-item span, .record-val-v111', {
        background:'#151f2f', color:'#dbeafe', 'border-color':'#2d3b50'
      });
      setThemeInlineV119('.topbar', {
        background:'#101827', color:'#eef4ff', 'border-color':'#263548', 'box-shadow':'0 10px 28px rgba(0,0,0,.22)'
      });
    }

    function applyThemeV119(mode) {
      const dark = mode === 'dark';
      removeThemeInlineV119();
      document.body.classList.toggle('theme-dark', dark);
      document.documentElement.classList.toggle('theme-dark', dark);
      try {
        localStorage.setItem('mesaha_theme_v113', dark ? 'dark' : 'light');
        localStorage.setItem('mesaha_theme_v112', dark ? 'dark' : 'light');
        localStorage.setItem('mesaha_theme', dark ? 'dark' : 'light');
      } catch {}
      const btn = document.getElementById('themeToggleV112');
      if (btn) btn.textContent = dark ? '☀️ Aydınlık' : '🌙 Karanlık';
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', dark ? '#090b10' : '#f5f7fb');
      if (dark) {
        setTimeout(forceDarkReadableV119, 20);
        setTimeout(forceDarkReadableV119, 160);
        setTimeout(forceDarkReadableV119, 520);
      } else {
        setTimeout(removeThemeInlineV119, 20);
        setTimeout(removeThemeInlineV119, 180);
        setTimeout(removeThemeInlineV119, 520);
      }
    }

    function initThemeV119() {
      let saved = 'light';
      try { saved = localStorage.getItem('mesaha_theme_v113') || localStorage.getItem('mesaha_theme_v112') || localStorage.getItem('mesaha_theme') || localStorage.getItem('theme') || 'light'; } catch {}
      applyThemeV119(saved === 'dark' ? 'dark' : 'light');
    }

    try { repaintDarkInlineV114 = forceDarkReadableV119; } catch {}
    try { forceDarkPanelsV115 = forceDarkReadableV119; } catch {}
    try { forceDarkReadableV116 = forceDarkReadableV119; } catch {}
    try { forceDarkReadableV118 = forceDarkReadableV119; } catch {}
    applyThemeV113 = applyThemeV119;
    applyThemeV112 = applyThemeV119;
    initThemeV113 = initThemeV119;
    initThemeV112 = initThemeV119;

    function showEntryForInlineSimpleV119() {
      document.body.classList.remove('show-records', 'show-guide', 'show-admin');
      if (els && els.navEntry) els.navEntry.classList.add('active');
      if (els && els.navRecords) els.navRecords.classList.remove('active');
      if (els && els.navGuide) els.navGuide.classList.remove('active');
      if (els && els.navAdmin) els.navAdmin.classList.remove('active');
      if (typeof updateFlowTabsV111 === 'function') updateFlowTabsV111();
    }

    function setInlineSimpleV119(on) {
      const overlay = document.getElementById('cleanSimpleOverlayV111');
      if (overlay) {
        overlay.classList.remove('show');
        overlay.style.setProperty('display', 'none', 'important');
      }
      document.body.classList.remove('clean-simple-open-v111', 'clean-keyboard-v118');
      if (on) {
        showEntryForInlineSimpleV119();
        document.body.classList.add('inline-simple-v119');
        if (typeof renderProductButtons === 'function') renderProductButtons();
        if (typeof setProductType === 'function' && els && els.productType) setProductType(els.productType.value || 'Tomruk', false);
      } else {
        document.body.classList.remove('inline-simple-v119');
      }
      const btn = document.getElementById('openSimpleV112');
      if (btn) {
        btn.textContent = on ? '🏠 Ana Sayfaya Dön' : '⚡ Giriş Modu';
        btn.classList.toggle('active', !!on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      setTimeout(() => {
        if (typeof keepNaturalScrollV111 === 'function') keepNaturalScrollV111();
        if (typeof updateFlowTabsV111 === 'function') updateFlowTabsV111();
        if (document.activeElement && document.activeElement.blur && !on) document.activeElement.blur();
      }, 50);
    }

    function toggleInlineSimpleV119() {
      setInlineSimpleV119(!document.body.classList.contains('inline-simple-v119'));
    }

    function closeInlineSimpleV119() { setInlineSimpleV119(false); }
    openCleanSimpleV111 = function(){ setInlineSimpleV119(true); };
    openCleanSimpleV113 = openCleanSimpleV111;
    closeCleanSimpleV111 = closeInlineSimpleV119;

    function bindTopActionsV119() {
      const simpleOld = document.getElementById('openSimpleV112');
      if (simpleOld && !simpleOld.__v119CleanBound) {
        const simpleBtn = simpleOld.cloneNode(true);
        simpleBtn.__v119CleanBound = true;
        simpleOld.parentNode.replaceChild(simpleBtn, simpleOld);
        simpleBtn.textContent = document.body.classList.contains('inline-simple-v119') ? '🏠 Ana Sayfaya Dön' : '⚡ Giriş Modu';
        simpleBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleInlineSimpleV119();
        });
        if (typeof els !== 'undefined') els.simpleModeBtn = simpleBtn;
      }

      const themeOld = document.getElementById('themeToggleV112');
      if (themeOld && !themeOld.__v119CleanBound) {
        const themeBtn = themeOld.cloneNode(true);
        themeBtn.__v119CleanBound = true;
        themeOld.parentNode.replaceChild(themeBtn, themeOld);
        themeBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          applyThemeV119(document.body.classList.contains('theme-dark') ? 'light' : 'dark');
        });
      }
    }

    ['navRecords','navGuide','navAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.__v119LeaveSimple) {
        el.__v119LeaveSimple = true;
        el.addEventListener('click', () => setInlineSimpleV119(false), true);
      }
    });

    bindTopActionsV119();
    initThemeV119();
    setTimeout(() => { bindTopActionsV119(); initThemeV119(); }, 250);


    /* v129: Zayıf internet için 3 saniyede offline açılış koruması */
    const MESAHA_STARTUP_TIMEOUT_V129 = 3000;
    function mesahaTimeoutV129(ms, message) {
      return new Promise((_, reject) => setTimeout(() => reject(new Error(message || "Bağlantı zaman aşımı")), Number(ms || MESAHA_STARTUP_TIMEOUT_V129)));
    }
    function mesahaRaceTimeoutV129(promise, ms, message) {
      return Promise.race([Promise.resolve(promise), mesahaTimeoutV129(ms, message)]);
    }

    if (typeof loadExternalScript === "function" && !loadExternalScript.__v129Timeout) {
      const oldLoadExternalScriptV129 = loadExternalScript;
      loadExternalScript = function(src) {
        return mesahaRaceTimeoutV129(
          oldLoadExternalScriptV129(src),
          MESAHA_STARTUP_TIMEOUT_V129,
          "Firebase kütüphanesi 3 saniyede yüklenemedi"
        );
      };
      loadExternalScript.__v129Timeout = true;
    }

    if (typeof ensureFirebaseReady === "function" && !ensureFirebaseReady.__v129OfflineFirst) {
      const oldEnsureFirebaseReadyV129 = ensureFirebaseReady;
      ensureFirebaseReady = function() {
        return mesahaRaceTimeoutV129(
          oldEnsureFirebaseReadyV129(),
          MESAHA_STARTUP_TIMEOUT_V129,
          "Firebase 3 saniyede yanıt vermedi"
        ).catch(err => {
          try { mesahaFirebaseReadyPromise = null; } catch {}
          throw err;
        });
      };
      ensureFirebaseReady.__v129OfflineFirst = true;
    }

    if (typeof logOnlineUser === "function" && !logOnlineUser.__v129OfflineFirst) {
      const oldLogOnlineUserV129 = logOnlineUser;
      logOnlineUser = function(user) {
        if (!user || !navigator.onLine) return;
        Promise.race([
          Promise.resolve().then(() => oldLogOnlineUserV129(user)),
          mesahaTimeoutV129(MESAHA_STARTUP_TIMEOUT_V129, "Online giriş 3 saniyede tamamlanmadı")
        ]).catch(() => {
          // Zayıf internet mesaha girişini kilitlemesin; online kayıt sonra tekrar denenir.
        });
      };
      logOnlineUser.__v129OfflineFirst = true;
    }

    function saveLoginUserLocalFirstV129(event) {
      try {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        }
        const name = cleanUserText(els.loginUserName ? els.loginUserName.value : "");
        const seflik = cleanUserText(els.loginSeflik ? els.loginSeflik.value : "");
        if (name.length < 2) return showLoginError("Kullanıcı adı en az 2 karakter olmalı.");
        if (seflik.length < 2) return showLoginError("Şeflik bilgisi en az 2 karakter olmalı.");

        state.userStore = state.userStore || loadUserStore();
        const id = createUserId(name, seflik);
        const now = new Date().toLocaleString("tr-TR");
        let user = state.userStore.users.find(u => u.id === id);
        if (!user) {
          user = { id, name, seflik, firstLogin: now, lastLogin: "", loginCount: 0 };
          state.userStore.users.unshift(user);
        } else {
          user.name = name;
          user.seflik = seflik;
        }
        state.userStore.activeUserId = id;
        if (els.seflik) els.seflik.value = seflik;
        if (els.ekipNot && !String(els.ekipNot.value || "").trim()) els.ekipNot.value = name;
        state.settings.seflik = seflik;
        if (!state.settings.ekipNot) state.settings.ekipNot = name;
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch {}
        registerUserLoginById(id);
        closeUserLogin();
        showToast(navigator.onLine ? "Giriş açıldı. Bulut arka planda kontrol ediliyor." : "Offline giriş açıldı.");
        setTimeout(() => {
          try { logOnlineUser(state.activeUser || findActiveUser()); } catch {}
          try { if (typeof usageScheduleSyncV128 === "function") usageScheduleSyncV128(1200); } catch {}
        }, 80);
      } catch (err) {
        try { showLoginError(err && err.message ? err.message : "Giriş kaydedilemedi."); } catch {}
      }
    }

    if (els.loginSaveBtn && !els.loginSaveBtn.__v129LocalFirst) {
      els.loginSaveBtn.__v129LocalFirst = true;
      els.loginSaveBtn.addEventListener("click", saveLoginUserLocalFirstV129, true);
    }
    if (els.loginSeflik && !els.loginSeflik.__v129LocalFirst) {
      els.loginSeflik.__v129LocalFirst = true;
      els.loginSeflik.addEventListener("keydown", (event) => {
        if (event.key === "Enter") saveLoginUserLocalFirstV129(event);
      }, true);
    }



    load();


    /* v122: Giriş Modu / Normal geçişini sert şekilde düzelt */
    function syncInlineSimpleButtonV122() {
      const btn = document.getElementById('openSimpleV112');
      if (!btn) return;
      const on = document.body.classList.contains('inline-simple-v119');
      btn.textContent = on ? '🏠 Ana Sayfaya Dön' : '⚡ Giriş Modu';
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.type = 'button';
    }

    function setInlineSimpleV122(on) {
      on = !!on;
      const overlay = document.getElementById('cleanSimpleOverlayV111');
      if (overlay) {
        overlay.classList.remove('show');
        overlay.style.setProperty('display', 'none', 'important');
        overlay.style.setProperty('visibility', 'hidden', 'important');
        overlay.style.setProperty('pointer-events', 'none', 'important');
      }

      document.body.classList.remove('clean-simple-open-v111', 'clean-keyboard-v118');

      if (on) {
        if (typeof showEntryForInlineSimpleV119 === 'function') showEntryForInlineSimpleV119();
        document.body.classList.add('inline-simple-v119');
        if (typeof renderProductButtons === 'function') renderProductButtons();
        if (typeof setProductType === 'function' && typeof els !== 'undefined' && els && els.productType) {
          setProductType(els.productType.value || 'Tomruk', false);
        }
        setTimeout(() => {
          if (typeof renderRecentBarcodes === 'function') renderRecentBarcodes();
        }, 30);
      } else {
        document.body.classList.remove('inline-simple-v119');
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      }

      syncInlineSimpleButtonV122();
      setTimeout(() => {
        syncInlineSimpleButtonV122();
        if (typeof keepNaturalScrollV111 === 'function') keepNaturalScrollV111();
        if (typeof updateFlowTabsV111 === 'function') updateFlowTabsV111();
      }, 60);
    }

    function toggleInlineSimpleV122() {
      setInlineSimpleV122(!document.body.classList.contains('inline-simple-v119'));
    }

    try { setInlineSimpleV119 = setInlineSimpleV122; } catch {}
    try { toggleInlineSimpleV119 = toggleInlineSimpleV122; } catch {}
    try { closeInlineSimpleV119 = function(){ setInlineSimpleV122(false); }; } catch {}
    openCleanSimpleV111 = function(){ setInlineSimpleV122(true); };
    openCleanSimpleV113 = openCleanSimpleV111;
    closeCleanSimpleV111 = function(){ setInlineSimpleV122(false); };

    function bindInlineSimpleV122() {
      const btn = document.getElementById('openSimpleV112');
      if (btn && btn.dataset.mesahaV122Simple !== '1') {
        const fresh = btn.cloneNode(true);
        fresh.dataset.mesahaV122Simple = '1';
        btn.parentNode.replaceChild(fresh, btn);
        fresh.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          toggleInlineSimpleV122();
        }, true);
      }
      syncInlineSimpleButtonV122();
    }

    if (!window.__MESAHA_V122_SIMPLE_CAPTURE__) {
      window.__MESAHA_V122_SIMPLE_CAPTURE__ = true;
      document.addEventListener('click', (event) => {
        const target = event.target && event.target.closest ? event.target.closest('#openSimpleV112') : null;
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        toggleInlineSimpleV122();
      }, true);
    }

    bindInlineSimpleV122();
    setTimeout(bindInlineSimpleV122, 100);
    setTimeout(bindInlineSimpleV122, 400);
    setTimeout(syncInlineSimpleButtonV122, 700);
  

    /* v125: v124'te kayıtlar doğruydu; aynı sol çizgi stilini dinamik alanlara zorla uygula */
    function clearV125StripeInline() {
      document.querySelectorAll('[data-mesaha-v125-stripe="1"]').forEach(el => {
        ['background','background-color','background-image','color','border','border-color','border-left','box-shadow','border-radius'].forEach(prop => {
          try { el.style.removeProperty(prop); } catch {}
        });
        if (el.dataset) delete el.dataset.mesahaV125Stripe;
        if (!el.getAttribute('style')) el.removeAttribute('style');
      });
    }

    function productColorV125(nameOrClass) {
      const raw = String(nameOrClass || '').toLowerCase();
      if (raw.includes('tomruk')) return '#facc15';
      if (raw.includes('maden')) return '#3b82f6';
      if (raw.includes('kağıt') || raw.includes('kagit')) return '#ef4444';
      if (raw.includes('sanayi')) return '#22c55e';
      if (raw.includes('tel')) return '#8b5cf6';
      return '#343c49';
    }

    function productKeyFromElementV125(el) {
      if (!el) return '';
      if (el.dataset && el.dataset.product) return el.dataset.product;
      if (el.dataset && el.dataset.cleanProduct) return el.dataset.cleanProduct;
      const cls = String(el.className || '');
      if (cls.includes('recent-tomruk') || cls.includes(' tomruk') || cls.endsWith('tomruk')) return 'tomruk';
      if (cls.includes('recent-maden') || cls.includes(' maden') || cls.endsWith('maden')) return 'maden';
      if (cls.includes('recent-kagit') || cls.includes(' kagit') || cls.endsWith('kagit')) return 'kagit';
      if (cls.includes('recent-sanayi') || cls.includes(' sanayi') || cls.endsWith('sanayi')) return 'sanayi';
      if (cls.includes('recent-tel') || cls.includes(' tel') || cls.endsWith('tel')) return 'tel';
      return '';
    }

    function markV125(el) {
      if (el && el.dataset) el.dataset.mesahaV125Stripe = '1';
    }

    function applyV125StripeToCard(el, color, active) {
      if (!el || !document.body.classList.contains('theme-dark')) return;
      markV125(el);
      el.style.setProperty('background', active ? '#232a36' : '#1b202a', 'important');
      el.style.setProperty('background-image', 'none', 'important');
      el.style.setProperty('color', '#f1f5f9', 'important');
      el.style.setProperty('border', '1.6px solid ' + (active ? '#465162' : '#343c49'), 'important');
      el.style.setProperty('border-left', '7px solid ' + color, 'important');
      el.style.setProperty('border-radius', '16px', 'important');
      el.style.setProperty('box-shadow', active ? '0 10px 22px rgba(0,0,0,.18)' : '0 10px 20px rgba(0,0,0,.10)', 'important');
    }

    function applyProductSideStripesV125() {
      return;
      if (!document.body.classList.contains('theme-dark')) {
        clearV125StripeInline();
        return;
      }

      document.querySelectorAll('.entry-panel .product-box, .clean-product-v111').forEach(el => {
        const key = productKeyFromElementV125(el) || (el.textContent || '');
        applyV125StripeToCard(el, productColorV125(key), el.classList.contains('active'));
      });

      document.querySelectorAll('.recent-barcode-list > .recent-barcode-item, .clean-recent-item-v114').forEach(el => {
        const key = productKeyFromElementV125(el) || (el.textContent || '');
        applyV125StripeToCard(el, productColorV125(key), false);
        el.querySelectorAll('b,strong').forEach(x => {
          markV125(x);
          x.style.setProperty('color', '#f1f5f9', 'important');
        });
        el.querySelectorAll('span').forEach(x => {
          markV125(x);
          x.style.setProperty('color', '#aeb8c7', 'important');
          x.style.setProperty('opacity', '1', 'important');
        });
      });
    }

    const oldApplyThemeV125 = typeof applyThemeV113 === 'function' ? applyThemeV113 : null;
    function applyThemeV125(mode) {
      if (oldApplyThemeV125) oldApplyThemeV125(mode);
      if (mode === 'dark') {
        setTimeout(applyProductSideStripesV125, 40);
        setTimeout(applyProductSideStripesV125, 220);
        setTimeout(applyProductSideStripesV125, 700);
      } else {
        setTimeout(clearV125StripeInline, 20);
        setTimeout(clearV125StripeInline, 220);
      }
    }
    applyThemeV113 = applyThemeV125;
    applyThemeV112 = applyThemeV125;

    ['renderProductButtons','renderRecentBarcodes','renderCleanProductsV111','renderCleanRecentV111','renderCleanRecentV114','render','setProductType','setInlineSimpleV122'].forEach(fnName => {
      const fn = typeof window[fnName] === 'function' ? window[fnName] : null;
      if (fn && !fn.__v125StripeWrapped) {
        window[fnName] = function(...args) {
          const result = fn.apply(this, args);
          setTimeout(applyProductSideStripesV125, 25);
          setTimeout(applyProductSideStripesV125, 160);
          return result;
        };
        window[fnName].__v125StripeWrapped = true;
      }
    });

    document.addEventListener('click', (event) => {
      if (event.target && event.target.closest && event.target.closest('#openSimpleV112, .product-box, .recent-barcode-item')) {
        setTimeout(applyProductSideStripesV125, 40);
        setTimeout(applyProductSideStripesV125, 180);
      }
    }, true);

    /* v184: eski inline stripe ilk taramaları kapalı. */
    /* v184: dark.css ayrıldı; eski inline tarama kapatıldı. */



    /* v126: Giriş Modu adı, toplam adet başlığı ve kaydet konumu */
    (function(){
      function totalAdetV126(){
        try {
          if (typeof state !== 'undefined' && state && Array.isArray(state.records)) {
            return state.records.reduce((sum, r) => sum + (Number(r && r.quantity) || 0), 0);
          }
        } catch {}
        const totalEl = document.getElementById('totalAdet');
        const n = totalEl ? parseInt(String(totalEl.textContent || '0').replace(/\D/g,''), 10) : 0;
        return Number.isFinite(n) ? n : 0;
      }

      function ensureTotalBadgeV126(){
        const header = document.querySelector('.entry-panel .panel-header');
        if (!header) return null;
        let box = document.getElementById('simpleTotalAdetV126');
        if (!box) {
          box = document.createElement('div');
          box.id = 'simpleTotalAdetV126';
          box.className = 'simple-total-adet-v126';
          box.innerHTML = '<span class="simple-total-label-v126">Toplam Adet</span><strong id="simpleTotalAdetValueV126" class="simple-total-value-v126">0</strong>';
          header.appendChild(box);
        }
        return box;
      }

      function updateTotalBadgeV126(){
        ensureTotalBadgeV126();
        const value = document.getElementById('simpleTotalAdetValueV126');
        if (value) value.textContent = totalAdetV126().toLocaleString('tr-TR');
      }

      function syncGirisButtonV126(){
        const btn = document.getElementById('openSimpleV112');
        if (!btn) return;
        const on = document.body.classList.contains('inline-simple-v119');
        btn.textContent = on ? '🏠 Ana Sayfaya Dön' : '⚡ Giriş Modu';
        btn.setAttribute('aria-label', on ? 'Ana sayfaya dön' : 'Giriş Modu');
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.type = 'button';
      }

      function refreshGirisUiV126(){
        updateTotalBadgeV126();
        syncGirisButtonV126();
      }

      const prevSyncV126 = (typeof syncInlineSimpleButtonV122 === 'function') ? syncInlineSimpleButtonV122 : null;
      syncInlineSimpleButtonV122 = function(){
        try { if (prevSyncV126) prevSyncV126(); } catch {}
        refreshGirisUiV126();
      };

      const prevSetV126 = (typeof setInlineSimpleV122 === 'function') ? setInlineSimpleV122 : (typeof setInlineSimpleV119 === 'function' ? setInlineSimpleV119 : null);
      function setInlineSimpleV126(on){
        on = !!on;
        if (prevSetV126) {
          prevSetV126(on);
        } else {
          document.body.classList.toggle('inline-simple-v119', on);
        }
        refreshGirisUiV126();
        setTimeout(refreshGirisUiV126, 40);
        setTimeout(refreshGirisUiV126, 180);
        if (on) {
          setTimeout(() => {
            try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { window.scrollTo(0,0); }
          }, 80);
        }
      }
      function toggleInlineSimpleV126(){
        setInlineSimpleV126(!document.body.classList.contains('inline-simple-v119'));
      }

      try { setInlineSimpleV122 = setInlineSimpleV126; } catch {}
      try { toggleInlineSimpleV122 = toggleInlineSimpleV126; } catch {}
      try { setInlineSimpleV119 = setInlineSimpleV126; } catch {}
      try { toggleInlineSimpleV119 = toggleInlineSimpleV126; } catch {}
      try { openCleanSimpleV111 = function(){ setInlineSimpleV126(true); }; } catch {}
      try { openCleanSimpleV113 = openCleanSimpleV111; } catch {}
      try { closeCleanSimpleV111 = function(){ setInlineSimpleV126(false); }; } catch {}

      const prevRenderV126 = (typeof render === 'function') ? render : null;
      if (prevRenderV126 && !prevRenderV126.__v126TotalWrapped) {
        render = function(...args){
          const result = prevRenderV126.apply(this, args);
          setTimeout(refreshGirisUiV126, 20);
          setTimeout(refreshGirisUiV126, 160);
          return result;
        };
        render.__v126TotalWrapped = true;
      }

      document.addEventListener('click', (event) => {
        if (event.target && event.target.closest && event.target.closest('#openSimpleV112, #submitBtn, .delete-mini, #deleteAllBtn, #bulkDeleteBtn')) {
          setTimeout(refreshGirisUiV126, 60);
          setTimeout(refreshGirisUiV126, 250);
        }
      }, true);

      document.addEventListener('input', (event) => {
        if (event.target && event.target.closest && event.target.closest('#quantity')) {
          setTimeout(refreshGirisUiV126, 60);
        }
      }, true);

      refreshGirisUiV126();
      setTimeout(refreshGirisUiV126, 250);
      setTimeout(refreshGirisUiV126, 900);
      setInterval(refreshGirisUiV126, 1500);
    })();



    /* v128: Firebase usageStats + admin kullanıcı kullanım bilgisi */
    const USAGE_STATS_LOCAL_KEY_V128 = "mesaha_usage_stats_v128";
    const USAGE_ACTIVE_IDLE_LIMIT_V128 = 5 * 60 * 1000;
    let usageLastActivityMsV128 = Date.now();
    let usageLastTickMsV128 = Date.now();
    let usageSyncTimerV128 = null;

    function usageTodayISOv128(){
      try { return todayISO(); } catch { return new Date().toISOString().slice(0,10); }
    }

    function usageCleanNumberV128(value){
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    }

    function usageLoadStoreV128(){
      try {
        const data = JSON.parse(localStorage.getItem(USAGE_STATS_LOCAL_KEY_V128) || "{}");
        return data && typeof data === "object" ? data : {};
      } catch { return {}; }
    }

    function usageSaveStoreV128(data){
      try { localStorage.setItem(USAGE_STATS_LOCAL_KEY_V128, JSON.stringify(data || {})); } catch {}
    }

    function usageActiveUserV128(){
      try {
        const u = (state && state.activeUser) ? state.activeUser : (typeof findActiveUser === "function" ? findActiveUser() : null);
        if (u && (u.name || u.seflik)) return u;
      } catch {}
      return { name:"", seflik:"", deviceId:getOrCreateDeviceId() };
    }

    function usageUserKeyV128(user){
      try { return firebaseUserKey(user && user.name, user && user.seflik); } catch {}
      const raw = `${(user && user.name) || ""}__${(user && user.seflik) || ""}`;
      try { return foldLocalText(raw).replace(/[^a-z0-9_-]+/g, "_").slice(0,120) || "bos"; } catch { return raw.toLowerCase().replace(/[^a-z0-9_-]+/g,"_") || "bos"; }
    }

    function usageDocIdV128(date, userKey, deviceId){
      return `usage_${String(date || "").replace(/[^0-9-]+/g,"")}_${String(userKey || "bos").replace(/[^a-zA-Z0-9_-]+/g,"_")}_${String(deviceId || "cihaz").replace(/[^a-zA-Z0-9_-]+/g,"_")}`.slice(0,180);
    }

    function usageGetDailyV128(date, user){
      const store = usageLoadStoreV128();
      const day = date || usageTodayISOv128();
      const active = user || usageActiveUserV128();
      const key = usageUserKeyV128(active);
      if (!store[day]) store[day] = {};
      if (!store[day][key]) {
        store[day][key] = {
          date: day,
          userKey: key,
          name: cleanUserText(active && active.name),
          seflik: cleanUserText(active && active.seflik),
          deviceId: (active && active.deviceId) || getOrCreateDeviceId(),
          activeMs: 0,
          inputAdet: 0,
          inputM3: 0,
          recordEntryCount: 0,
          createdAt: firebaseDateText ? firebaseDateText() : new Date().toLocaleString("tr-TR"),
          createdAtMs: Date.now(),
          updatedAt: firebaseDateText ? firebaseDateText() : new Date().toLocaleString("tr-TR"),
          updatedAtMs: Date.now(),
          lastSyncedMs: 0
        };
      } else {
        store[day][key].name = store[day][key].name || cleanUserText(active && active.name);
        store[day][key].seflik = store[day][key].seflik || cleanUserText(active && active.seflik);
        store[day][key].deviceId = store[day][key].deviceId || ((active && active.deviceId) || getOrCreateDeviceId());
      }
      return { store, stat: store[day][key], day, key };
    }

    function usageTouchStatV128(stat){
      stat.updatedAt = (typeof firebaseDateText === "function") ? firebaseDateText() : new Date().toLocaleString("tr-TR");
      stat.updatedAtMs = Date.now();
      stat.appVersion = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
      stat.fileVersion = "v135";
      stat.recordCount = Array.isArray(state.records) ? state.records.length : 0;
      return stat;
    }

    function usageScheduleSyncV128(delay){
      if (!navigator.onLine) return;
      clearTimeout(usageSyncTimerV128);
      usageSyncTimerV128 = setTimeout(() => {
        if (typeof usageSyncNowV128 === "function") usageSyncNowV128().catch(() => {});
      }, Number(delay || 2500));
    }

    function usageRecordEntryV128(record){
      try {
        const user = usageActiveUserV128();
        const got = usageGetDailyV128(usageTodayISOv128(), user);
        const qty = Math.max(0, usageCleanNumberV128(record && record.quantity) || 1);
        const desi = Math.max(0, usageCleanNumberV128(record && record.desi));
        got.stat.inputAdet = usageCleanNumberV128(got.stat.inputAdet) + qty;
        got.stat.inputM3 = Number((usageCleanNumberV128(got.stat.inputM3) + (desi / 1000)).toFixed(3));
        got.stat.recordEntryCount = usageCleanNumberV128(got.stat.recordEntryCount) + 1;
        usageTouchStatV128(got.stat);
        usageSaveStoreV128(got.store);
        usageScheduleSyncV128(900);
      } catch {}
    }

    function usageAddActiveMsV128(ms){
      try {
        const add = Math.max(0, Math.min(Number(ms) || 0, 60000));
        if (add < 1000) return;
        const got = usageGetDailyV128(usageTodayISOv128(), usageActiveUserV128());
        got.stat.activeMs = usageCleanNumberV128(got.stat.activeMs) + add;
        usageTouchStatV128(got.stat);
        usageSaveStoreV128(got.store);
        usageScheduleSyncV128(7000);
      } catch {}
    }

    function usageActivityEventV128(){
      usageLastActivityMsV128 = Date.now();
    }

    function usageTickV128(){
      const now = Date.now();
      const elapsed = now - usageLastTickMsV128;
      usageLastTickMsV128 = now;
      if (document.visibilityState === "hidden") return;
      if (now - usageLastActivityMsV128 > USAGE_ACTIVE_IDLE_LIMIT_V128) return;
      usageAddActiveMsV128(elapsed);
    }

    async function usageSyncNowV128(){
      if (!navigator.onLine) return false;
      const { db } = await ensureFirebaseReady();
      const store = usageLoadStoreV128();
      const today = usageTodayISOv128();
      const days = Object.keys(store || {}).sort();
      let changed = false;

      for (const day of days) {
        const users = store[day] || {};
        for (const key of Object.keys(users)) {
          const stat = users[key] || {};
          if (!stat.name || !stat.seflik) continue;
          if (Number(stat.updatedAtMs || 0) <= Number(stat.lastSyncedMs || 0)) continue;
          usageTouchStatV128(stat);
          const docId = usageDocIdV128(day, stat.userKey || key, stat.deviceId || getOrCreateDeviceId());
          const payload = {
            id: docId,
            date: day,
            userKey: stat.userKey || key,
            name: cleanUserText(stat.name),
            seflik: cleanUserText(stat.seflik),
            deviceId: stat.deviceId || getOrCreateDeviceId(),
            activeMs: Math.round(usageCleanNumberV128(stat.activeMs)),
            activeMinutes: Math.round(usageCleanNumberV128(stat.activeMs) / 60000),
            inputAdet: Math.round(usageCleanNumberV128(stat.inputAdet)),
            inputM3: Number(usageCleanNumberV128(stat.inputM3).toFixed(3)),
            recordEntryCount: Math.round(usageCleanNumberV128(stat.recordEntryCount)),
            recordCount: Math.round(usageCleanNumberV128(stat.recordCount)),
            appVersion: (window.MESAHA_VERSION_TEXT || 'Mesaha İO'),
            fileVersion: "v135",
            createdAt: stat.createdAt || firebaseDateText(),
            createdAtMs: Number(stat.createdAtMs || Date.now()),
            updatedAt: firebaseDateText(),
            updatedAtMs: Date.now(),
            source: "firebaseUsage"
          };
          await db.collection(typeof FIREBASE_USAGE_COLLECTION !== "undefined" ? FIREBASE_USAGE_COLLECTION : "usageStats").doc(docId).set(payload, { merge:true });

          if (day === today) {
            await db.collection(FIREBASE_USERS_COLLECTION).doc(payload.userKey).set({
              userKey: payload.userKey,
              name: payload.name,
              seflik: payload.seflik,
              todayUsage: {
                date: payload.date,
                activeMs: payload.activeMs,
                activeMinutes: payload.activeMinutes,
                inputAdet: payload.inputAdet,
                inputM3: payload.inputM3,
                recordEntryCount: payload.recordEntryCount,
                updatedAt: payload.updatedAt,
                updatedAtMs: payload.updatedAtMs
              },
              lastUsageAt: payload.updatedAt,
              lastUsageMs: payload.updatedAtMs,
              appVersion: payload.appVersion,
              fileVersion: payload.fileVersion
            }, { merge:true });
          }
          stat.lastSyncedMs = payload.updatedAtMs;
          changed = true;
        }
      }
      if (changed) usageSaveStoreV128(store);
      return changed;
    }

    async function firebaseLoadUsageStatsV128(daysBack){
      const { db } = await ensureFirebaseReady();
      const days = Math.max(1, Number(daysBack || 7));
      const start = new Date();
      start.setDate(start.getDate() - (days - 1));
      const startIso = start.toISOString().slice(0,10);
      const snap = await db.collection(typeof FIREBASE_USAGE_COLLECTION !== "undefined" ? FIREBASE_USAGE_COLLECTION : "usageStats")
        .where("date", ">=", startIso)
        .get();
      const rows = [];
      snap.forEach(doc => rows.push(Object.assign({ id: doc.id }, doc.data() || {})));
      return rows;
    }

    function usageAggregateByUserV128(rows){
      const today = usageTodayISOv128();
      const map = new Map();
      (rows || []).forEach(r => {
        const key = r.userKey || usageUserKeyV128(r);
        if (!map.has(key)) map.set(key, { todayActiveMs:0, todayInputAdet:0, todayInputM3:0, todayRecordEntryCount:0, weekInputAdet:0, weekInputM3:0, lastUsageAt:"", lastUsageMs:0 });
        const a = map.get(key);
        const adet = usageCleanNumberV128(r.inputAdet);
        const m3 = usageCleanNumberV128(r.inputM3);
        a.weekInputAdet += adet;
        a.weekInputM3 += m3;
        if (String(r.date || "") === today) {
          a.todayActiveMs += usageCleanNumberV128(r.activeMs);
          a.todayInputAdet += adet;
          a.todayInputM3 += m3;
          a.todayRecordEntryCount += usageCleanNumberV128(r.recordEntryCount);
        }
        const ms = Number(r.updatedAtMs || 0);
        if (ms > a.lastUsageMs) {
          a.lastUsageMs = ms;
          a.lastUsageAt = r.updatedAt || r.createdAt || "";
        }
      });
      map.forEach(a => {
        a.todayInputM3 = Number(a.todayInputM3.toFixed(3));
        a.weekInputM3 = Number(a.weekInputM3.toFixed(3));
      });
      return map;
    }

    function usageMergeIntoUsersV128(users, rows){
      const agg = usageAggregateByUserV128(rows || []);
      return (users || []).map(u => {
        const key = usageUserKeyV128(u);
        const a = agg.get(key) || {};
        const tu = (u.todayUsage && u.todayUsage.date === usageTodayISOv128()) ? u.todayUsage : {};
        return Object.assign({}, u, {
          todayActiveMs: usageCleanNumberV128(a.todayActiveMs) || usageCleanNumberV128(tu.activeMs),
          todayInputAdet: usageCleanNumberV128(a.todayInputAdet) || usageCleanNumberV128(tu.inputAdet),
          todayInputM3: usageCleanNumberV128(a.todayInputM3) || usageCleanNumberV128(tu.inputM3),
          todayRecordEntryCount: usageCleanNumberV128(a.todayRecordEntryCount) || usageCleanNumberV128(tu.recordEntryCount),
          weekInputAdet: usageCleanNumberV128(a.weekInputAdet),
          weekInputM3: usageCleanNumberV128(a.weekInputM3),
          lastUsageAt: a.lastUsageAt || u.lastUsageAt || (tu.updatedAt || ""),
          lastUsageMs: Number(a.lastUsageMs || u.lastUsageMs || tu.updatedAtMs || 0)
        });
      });
    }

    function adminDurationTextV128(ms){
      const totalMin = Math.round((Number(ms) || 0) / 60000);
      if (totalMin <= 0) return "0 dk";
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      if (!h) return `${m} dk`;
      return `${h} sa ${m} dk`;
    }

    function adminM3TextV128(value){
      return `${(Number(value) || 0).toFixed(3).replace(/0+$/, "").replace(/\.$/, "0")} m³`;
    }

    const prevLoadOnlineUsersV128 = typeof loadOnlineUsers === "function" ? loadOnlineUsers : null;
    if (prevLoadOnlineUsersV128) {
      loadOnlineUsers = async function(adminCode){
        const users = await prevLoadOnlineUsersV128(adminCode);
        let stats = [];
        try { stats = await firebaseLoadUsageStatsV128(7); } catch {}
        return usageMergeIntoUsersV128(users, stats);
      };
    }

    adminFilteredUsers = function(){
      return (Array.isArray(state.adminOnlineUsers) ? state.adminOnlineUsers.slice() : []).sort((a,b) => {
        const au = Number(a.lastUsageMs || a.lastLoginMs || 0);
        const bu = Number(b.lastUsageMs || b.lastLoginMs || 0);
        return bu - au;
      });
    };

    updateAdminTopSummary = function(){
      const users = state.adminOnlineUsers || [];
      const backups = state.adminBackups || [];
      const todayUsers = users.filter(u => usageCleanNumberV128(u.todayActiveMs) || usageCleanNumberV128(u.todayInputAdet) || adminIsToday(u.lastLogin)).length;
      const todayAdet = users.reduce((sum,u) => sum + usageCleanNumberV128(u.todayInputAdet), 0);
      const todayM3 = users.reduce((sum,u) => sum + usageCleanNumberV128(u.todayInputM3), 0);
      const totalBackups = backups.length || users.reduce((sum, u) => sum + (Number(u.backupCount) || 0), 0);
      const lastBackup = backups[0] && backups[0].createdAt ? backups[0].createdAt : "-";
      const setLabel = (el, label) => { try { const s = el && el.parentElement && el.parentElement.querySelector("span"); if (s) s.textContent = label; } catch {} };
      setLabel(els.adminTotalUsers, "Kullanıcı");
      setLabel(els.adminTodayUsers, "Bugün Aktif");
      setLabel(els.adminWeekUsers, "Bugün Adet");
      setLabel(els.adminTotalBackups, "Bugün m³");
      setLabel(els.adminLastBackup, "Son Yedek");
      if (els.adminTotalUsers) els.adminTotalUsers.textContent = users.length.toLocaleString("tr-TR");
      if (els.adminTodayUsers) els.adminTodayUsers.textContent = todayUsers.toLocaleString("tr-TR");
      if (els.adminWeekUsers) els.adminWeekUsers.textContent = todayAdet.toLocaleString("tr-TR");
      if (els.adminTotalBackups) els.adminTotalBackups.textContent = adminM3TextV128(todayM3).replace(" m³", "");
      if (els.adminLastBackup) els.adminLastBackup.textContent = lastBackup;
    };

    renderAdminUsers = function(){
      if (!els.registeredUsersList) return;
      updateAdminTopSummary();
      const list = adminFilteredUsers();
      if (!list.length) {
        els.registeredUsersList.innerHTML = `<div class="empty-user-list">Kullanıcı bulunamadı.</div>`;
        return;
      }
      els.registeredUsersList.innerHTML = list.map(user => {
        const status = adminStatus(user);
        const source = user.sourceLabel || user.source || "";
        const sourceText = String(source).includes("firebase") ? "Firebase" : (String(source).includes("Eski") || String(source).includes("Apps") || String(source).includes("apps") ? "Eski" : "");
        const deviceText = (user.lastDeviceInfo && (user.lastDeviceInfo.platform || user.lastDeviceInfo.userAgent)) || user.lastDevice || `${(Number(user.deviceCount) || 0).toLocaleString("tr-TR")} cihaz`;
        return `
          <div class="registered-user-item online-user status-${status.key}">
            <div class="registered-user-head">
              <b>${escapeHtml(user.name || "-")}</b>
              <div>
                ${sourceText ? `<span class="admin-source-pill">${escapeHtml(sourceText)}</span>` : ""}
                <span class="admin-status-pill ${status.key}">${status.label}</span>
              </div>
            </div>
            <div class="admin-usage-mini">
              <span>Bugün Süre <b>${adminDurationTextV128(user.todayActiveMs)}</b></span>
              <span>Bugün Adet <b>${(Number(user.todayInputAdet) || 0).toLocaleString("tr-TR")}</b></span>
              <span>Bugün m³ <b>${adminM3TextV128(user.todayInputM3)}</b></span>
            </div>
            <div class="registered-user-meta">
              <span>Şeflik: ${escapeHtml(user.seflik || "-")}</span>
              <span>Son giriş: ${escapeHtml(user.lastLogin || "-")}</span>
              <span>Son aktif: ${escapeHtml(user.lastUsageAt || user.lastLogin || "-")}</span>
              <span>Yedek: ${(Number(user.backupCount) || 0).toLocaleString("tr-TR")}</span>
              <span class="admin-version-pill">Sürüm: ${escapeHtml(user.appVersion || user.fileVersion || "-")}</span>
              <span class="admin-device-pill">Cihaz: ${escapeHtml(deviceText)}</span>
            </div>
            <div class="admin-user-line-v128">
              <span>7 gün adet: ${(Number(user.weekInputAdet) || 0).toLocaleString("tr-TR")}</span>
              <span>7 gün m³: ${adminM3TextV128(user.weekInputM3)}</span>
            </div>
            <div class="registered-user-actions">
              <button class="secondary admin-user-backups" type="button" onclick="adminOpenUserBackups('${escapeHtml(user.name || "")}','${escapeHtml(user.seflik || "")}')">Yedekleri Gör</button>
              <button class="ghost" type="button" onclick="adminShowDetail('${escapeHtml(user.name || "")}','${escapeHtml(user.seflik || "")}')">Detay</button>
              <button class="danger registered-user-delete" type="button" onclick="deleteCloudUserAndBackups('${escapeHtml(user.name || "")}','${escapeHtml(user.seflik || "")}')">Sil</button>
            </div>
          </div>`;
      }).join("");
    };

    adminShowDetail = function(name, seflik){
      const u = (state.adminOnlineUsers || []).find(x => String(x.name) === String(name) && String(x.seflik) === String(seflik));
      if (!u) return showToast("Kullanıcı bulunamadı.");
      alert(
        `Kullanıcı: ${u.name}\nŞeflik: ${u.seflik}\nSon giriş: ${u.lastLogin || "-"}\nSon aktif: ${u.lastUsageAt || "-"}\nBugün süre: ${adminDurationTextV128(u.todayActiveMs)}\nBugün adet: ${(Number(u.todayInputAdet)||0).toLocaleString("tr-TR")}\nBugün m³: ${adminM3TextV128(u.todayInputM3)}\n7 gün adet: ${(Number(u.weekInputAdet)||0).toLocaleString("tr-TR")}\n7 gün m³: ${adminM3TextV128(u.weekInputM3)}\nYedek sayısı: ${u.backupCount || 0}\nSürüm: ${u.appVersion || u.fileVersion || "-"}\nCihaz: ${(u.lastDeviceInfo && (u.lastDeviceInfo.platform || u.lastDeviceInfo.userAgent)) || u.lastDevice || "-"}`
      );
    };

    function initUsageTrackerV128(){
      ["click","input","keydown","touchstart","pointerdown"].forEach(ev => document.addEventListener(ev, usageActivityEventV128, { passive:true, capture:true }));
      document.addEventListener("visibilitychange", () => {
        usageLastTickMsV128 = Date.now();
        usageActivityEventV128();
        usageScheduleSyncV128(600);
      });
      window.addEventListener("online", () => usageScheduleSyncV128(500));
      setInterval(usageTickV128, 15000);
      setInterval(() => usageScheduleSyncV128(1000), 120000);
      usageActivityEventV128();
      usageScheduleSyncV128(1500);
    }

    const prevLogOnlineUserV128 = typeof logOnlineUser === "function" ? logOnlineUser : null;
    if (prevLogOnlineUserV128) {
      logOnlineUser = function(user){
        try { prevLogOnlineUserV128(user); } catch {}
        usageScheduleSyncV128(1200);
      };
    }

    const prevCurrentDeviceInfoPayloadV128 = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
    currentDeviceInfoPayload = function(){
      const info = prevCurrentDeviceInfoPayloadV128 ? prevCurrentDeviceInfoPayloadV128() : {};
      info.appVersion = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
      info.fileVersion = "v135";
      info.recordCount = Array.isArray(state.records) ? state.records.length : (Number(info.recordCount) || 0);
      info.updatedMs = Date.now();
      return info;
    };

    document.querySelectorAll('.admin-tab[data-admin-tab="notes"]').forEach(btn => btn.style.display = 'none');
    document.querySelectorAll('.admin-filters-clean, .admin-quick-filters-clean').forEach(el => el.style.display = 'none');
    setTimeout(initUsageTrackerV128, 300);
    setTimeout(() => { try { usageSyncNowV128().catch(() => {}); } catch {} }, 2500);

    window.MESAHA_BUILD_INFO = {
      fileVersion: "v135",
      visibleVersion: (window.MESAHA_VERSION_TEXT || 'Mesaha İO'),
      stableBuild: true
    };


    /* v129: son sürüm bilgisi */
    const prevCurrentDeviceInfoPayloadV129 = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
    currentDeviceInfoPayload = function(){
      const info = prevCurrentDeviceInfoPayloadV129 ? prevCurrentDeviceInfoPayloadV129() : {};
      info.appVersion = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
      info.fileVersion = "v135";
      info.recordCount = Array.isArray(state.records) ? state.records.length : (Number(info.recordCount) || 0);
      info.updatedMs = Date.now();
      info.offlineFirstTimeoutMs = MESAHA_STARTUP_TIMEOUT_V129;
      return info;
    };
    window.MESAHA_BUILD_INFO = {
      fileVersion: "v135",
      visibleVersion: (window.MESAHA_VERSION_TEXT || 'Mesaha İO'),
      stableBuild: true,
      offlineFirstTimeoutMs: MESAHA_STARTUP_TIMEOUT_V129
    };

  

    /* v130: Boy kısayol butonlarında klavye kapanmasını engelle + küçük stabilite denetimi */
    (function(){
      const BUILD_VERSION_V130 = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
      const FILE_VERSION_V130 = "v134";

      function safeFocusV130(input, selectMode){
        if (!input) return;
        const focusOnce = () => {
          try { input.focus({ preventScroll:true }); } catch { try { input.focus(); } catch {} }
          try {
            const len = String(input.value || "").length;
            if (selectMode === "select") input.select();
            else input.setSelectionRange(len, len);
          } catch {}
        };
        try { focusOnce(); } catch {}
        requestAnimationFrame(focusOnce);
        setTimeout(focusOnce, 60);
        setTimeout(focusOnce, 160);
      }

      function setMainLengthFromChipV130(value){
        const val = String(value || "").trim();
        if (!val) return;
        if (typeof els !== "undefined" && els.length) els.length.value = val;
        try {
          if (typeof state !== "undefined" && state.settings) state.settings.lastLength = val;
          if (typeof saveSettings === "function") saveSettings();
        } catch {}
        try { if (typeof updateLiveDesi === "function") updateLiveDesi(); } catch {}
        try { if (typeof updateInputPlaceholders === "function") updateInputPlaceholders(); } catch {}
        const dia = (typeof els !== "undefined" && els.diameter) ? els.diameter : document.getElementById("diameter");
        safeFocusV130(dia, "caret");
      }

      function setCleanLengthFromChipV130(value){
        const val = String(value || "").trim();
        if (!val) return;
        const cleanLen = document.getElementById("cleanLengthV111");
        const cleanDia = document.getElementById("cleanDiameterV111");
        if (cleanLen) cleanLen.value = val;
        try { localStorage.setItem("mesaha_simple_last_length_v1", val); } catch {}
        try { if (typeof renderCleanAutoV111 === "function") renderCleanAutoV111(); } catch {}
        safeFocusV130(cleanDia || document.getElementById("diameter"), "caret");
      }

      function targetInfoV130(target){
        if (!target || !target.closest) return null;
        const cleanLenBtn = target.closest("[data-clean-length]");
        if (cleanLenBtn) return { type:"cleanLength", value: cleanLenBtn.dataset.cleanLength || cleanLenBtn.textContent || "" };
        const lenBtn = target.closest("[data-len]");
        if (lenBtn) return { type:"mainLength", value: lenBtn.dataset.len || lenBtn.textContent || "" };
        return null;
      }

      function applyShortcutV130(info){
        if (!info) return;
        if (info.type === "cleanLength") setCleanLengthFromChipV130(info.value);
        if (info.type === "mainLength") setMainLengthFromChipV130(info.value);
      }

      function protectDownV130(event){
        const info = targetInfoV130(event.target);
        if (!info) return;
        try { event.preventDefault(); } catch {}
        applyShortcutV130(info);
      }

      function protectClickV130(event){
        const info = targetInfoV130(event.target);
        if (!info) return;
        try { event.preventDefault(); } catch {}
        try { event.stopImmediatePropagation(); } catch { try { event.stopPropagation(); } catch {} }
        applyShortcutV130(info);
      }

      function bindShortcutProtectionV130(){
        if (document.__v130LengthShortcutNoBlur) return;
        document.__v130LengthShortcutNoBlur = true;
        ["pointerdown","mousedown","touchstart"].forEach(type => {
          document.addEventListener(type, protectDownV130, { capture:true, passive:false });
        });
        document.addEventListener("click", protectClickV130, { capture:true, passive:false });
      }

      const prevRenderRecentChipsV130 = (typeof renderRecentChips === "function") ? renderRecentChips : null;
      if (prevRenderRecentChipsV130 && !prevRenderRecentChipsV130.__v130NoBlurWrapped) {
        renderRecentChips = function(...args){
          const result = prevRenderRecentChipsV130.apply(this, args);
          setTimeout(bindShortcutProtectionV130, 0);
          return result;
        };
        renderRecentChips.__v130NoBlurWrapped = true;
      }

      const prevRenderCleanChipsV130 = (typeof renderCleanChipsV111 === "function") ? renderCleanChipsV111 : null;
      if (prevRenderCleanChipsV130 && !prevRenderCleanChipsV130.__v130NoBlurWrapped) {
        renderCleanChipsV111 = function(...args){
          const result = prevRenderCleanChipsV130.apply(this, args);
          setTimeout(bindShortcutProtectionV130, 0);
          return result;
        };
        renderCleanChipsV111.__v130NoBlurWrapped = true;
      }

      function smallStabilityPassV130(){
        try {
          document.querySelectorAll("button:not([type])").forEach(btn => btn.type = "button");
          document.querySelectorAll("#lengthChips [data-len], #cleanLengthChipsV111 [data-clean-length]").forEach(btn => {
            btn.setAttribute("tabindex", "-1");
            btn.setAttribute("role", "button");
            btn.style.setProperty("-webkit-tap-highlight-color", "transparent", "important");
            btn.style.setProperty("touch-action", "manipulation", "important");
          });
          const themeBtn = document.getElementById("themeToggleV112");
          if (themeBtn) themeBtn.type = "button";
          const girisBtn = document.getElementById("openSimpleV112");
          if (girisBtn) girisBtn.type = "button";
        } catch {}
      }

      const prevCurrentDeviceInfoPayloadV130 = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
      currentDeviceInfoPayload = function(){
        const info = prevCurrentDeviceInfoPayloadV130 ? prevCurrentDeviceInfoPayloadV130() : {};
        info.appVersion = BUILD_VERSION_V130;
        info.fileVersion = FILE_VERSION_V130;
        info.recordCount = Array.isArray(state.records) ? state.records.length : (Number(info.recordCount) || 0);
        info.updatedMs = Date.now();
        info.keyboardShortcutFix = true;
        return info;
      };

      window.MESAHA_BUILD_INFO = {
        fileVersion: FILE_VERSION_V130,
        visibleVersion: BUILD_VERSION_V130,
        stableBuild: true,
        keyboardShortcutFix: true,
        offlineFirstTimeoutMs: (typeof MESAHA_STARTUP_TIMEOUT_V129 !== "undefined" ? MESAHA_STARTUP_TIMEOUT_V129 : 3000)
      };

      bindShortcutProtectionV130();
      smallStabilityPassV130();
      setTimeout(smallStabilityPassV130, 250);
      setTimeout(smallStabilityPassV130, 1000);
    })();


  

    /* v131: Admin sade liste, kullanıcı panelinden şifreli açılış, onaylı-yüklemeli yenileme */
    (function(){
      const BUILD_VERSION_V131 = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
      const FILE_VERSION_V131 = "v135";

      function adminSetLoadingV131(show, text){
        try {
          if (typeof setCloudLoading === "function") setCloudLoading(!!show, text || "Admin paneli yenileniyor...");
          else document.body.classList.toggle("cloud-loading-open", !!show);
        } catch {}
      }

      function adminDeviceTextV131(user){
        return (user && user.lastDeviceInfo && (user.lastDeviceInfo.platform || user.lastDeviceInfo.userAgent)) ||
          (user && user.lastDevice) ||
          `${(Number(user && user.deviceCount) || 0).toLocaleString("tr-TR")} cihaz`;
      }

      function adminStatusSafeV131(user){
        try { return adminStatus(user); }
        catch { return { key:"today", label:"AKTİF" }; }
      }

      function adminSourceTextV131(user){
        const source = (user && (user.sourceLabel || user.source)) || "";
        if (String(source).toLowerCase().includes("firebase")) return "Firebase";
        if (String(source).toLowerCase().includes("apps") || String(source).toLowerCase().includes("eski")) return "Eski";
        return "";
      }

      function adminEscapeArgV131(value){
        return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      }

      window.adminToggleDetailV131 = function(index){
        const row = document.querySelector(`[data-admin-row-v131="${index}"]`);
        if (!row) return;
        const panel = row.querySelector(".admin-user-detail-panel-v131");
        const btn = row.querySelector(".admin-detail-bubble-v131");
        const open = !(panel && panel.classList.contains("open"));
        document.querySelectorAll(".admin-user-detail-panel-v131.open").forEach(el => el.classList.remove("open"));
        document.querySelectorAll(".admin-detail-bubble-v131.open").forEach(el => el.classList.remove("open"));
        if (panel) panel.classList.toggle("open", open);
        if (btn) {
          btn.classList.toggle("open", open);
          btn.textContent = open ? "Kapat" : "Detay";
        }
      };

      const prevAdminFilteredUsersV131 = typeof adminFilteredUsers === "function" ? adminFilteredUsers : null;
      adminFilteredUsers = function(){
        const list = prevAdminFilteredUsersV131 ? prevAdminFilteredUsersV131() : (Array.isArray(state.adminOnlineUsers) ? state.adminOnlineUsers.slice() : []);
        return list.slice().sort((a,b) => {
          const au = Number(a.lastUsageMs || a.lastLoginMs || 0);
          const bu = Number(b.lastUsageMs || b.lastLoginMs || 0);
          if (bu !== au) return bu - au;
          return String(a.name || "").localeCompare(String(b.name || ""), "tr");
        });
      };

      renderAdminUsers = function(){
        if (!els.registeredUsersList) return;
        try { updateAdminTopSummary(); } catch {}
        const list = adminFilteredUsers();
        window.__adminListV131 = list;
        els.registeredUsersList.classList.add("admin-list-v131");
        if (!list.length) {
          els.registeredUsersList.innerHTML = `<div class="empty-user-list">Kullanıcı bulunamadı.</div>`;
          return;
        }
        els.registeredUsersList.innerHTML = list.map((user, index) => {
          const status = adminStatusSafeV131(user);
          const sourceText = adminSourceTextV131(user);
          const deviceText = adminDeviceTextV131(user);
          const todayAdet = (Number(user.todayInputAdet) || 0).toLocaleString("tr-TR");
          const todayM3 = typeof adminM3TextV128 === "function" ? adminM3TextV128(user.todayInputM3) : `${(Number(user.todayInputM3)||0).toFixed(3)} m³`;
          const todaySure = typeof adminDurationTextV128 === "function" ? adminDurationTextV128(user.todayActiveMs) : `${Math.round((Number(user.todayActiveMs)||0)/60000)} dk`;
          const weekM3 = typeof adminM3TextV128 === "function" ? adminM3TextV128(user.weekInputM3) : `${(Number(user.weekInputM3)||0).toFixed(3)} m³`;
          return `
            <div class="admin-user-row-v131 status-${escapeHtml(status.key || "today")}" data-admin-row-v131="${index}">
              <div class="admin-user-main-v131">
                <b>${escapeHtml(user.name || "-")}</b>
                <span>${escapeHtml(user.seflik || "-")} ${sourceText ? `• ${escapeHtml(sourceText)}` : ""}</span>
              </div>
              <div class="admin-user-stats-v131">
                <span>Süre <b>${escapeHtml(todaySure)}</b></span>
                <span>Adet <b>${escapeHtml(todayAdet)}</b></span>
                <span>m³ <b>${escapeHtml(todayM3)}</b></span>
              </div>
              <button class="admin-detail-bubble-v131" type="button" onclick="adminToggleDetailV131(${index})">Detay</button>
              <div class="admin-user-detail-panel-v131">
                <div class="admin-detail-grid-v131">
                  <span>Durum <b>${escapeHtml(status.label || "-")}</b></span>
                  <span>Son giriş <b>${escapeHtml(user.lastLogin || "-")}</b></span>
                  <span>Son aktif <b>${escapeHtml(user.lastUsageAt || user.lastLogin || "-")}</b></span>
                  <span>Yedek sayısı <b>${(Number(user.backupCount) || 0).toLocaleString("tr-TR")}</b></span>
                  <span>7 gün adet <b>${(Number(user.weekInputAdet) || 0).toLocaleString("tr-TR")}</b></span>
                  <span>7 gün m³ <b>${escapeHtml(weekM3)}</b></span>
                  <span>Sürüm <b>${escapeHtml(user.appVersion || user.fileVersion || "-")}</b></span>
                  <span>Cihaz <b>${escapeHtml(deviceText || "-")}</b></span>
                </div>
                <div class="admin-detail-actions-v131">
                  <button class="secondary" type="button" onclick="adminOpenUserBackups('${adminEscapeArgV131(user.name)}','${adminEscapeArgV131(user.seflik)}')">Yedekleri Gör</button>
                  <button class="ghost" type="button" onclick="adminToggleDetailV131(${index})">Kapat</button>
                </div>
              </div>
            </div>`;
        }).join("");
      };

      async function adminLoadWithLoadingV131(message){
        const btn = document.getElementById("adminRefreshBtn");
        if (btn) btn.disabled = true;
        adminSetLoadingV131(true, message || "Admin paneli yenileniyor...");
        try {
          await loadAdminPanelData();
        } finally {
          adminSetLoadingV131(false);
          if (btn) btn.disabled = false;
        }
      }

      async function adminRefreshWithConfirmV131(){
        if (!window.confirm("Admin kullanıcı bilgileri yenilensin mi?")) return;
        try {
          await adminLoadWithLoadingV131("Admin paneli yenileniyor...");
        } catch (err) {
          if (typeof showToast === "function") showToast(err && err.message ? err.message : "Admin yenilenemedi.");
        }
      }

      function showAdminPageV131(){
        document.body.classList.add("admin-unlocked-v131", "show-admin");
        document.body.classList.remove("show-records", "show-guide");
        try { if (els.navAdmin) { els.navAdmin.style.display = ""; els.navAdmin.classList.add("active"); } } catch {}
        try { if (els.navEntry) els.navEntry.classList.remove("active"); if (els.navRecords) els.navRecords.classList.remove("active"); if (els.navGuide) els.navGuide.classList.remove("active"); } catch {}
        try { if (typeof updateFlowTabsV111 === "function") updateFlowTabsV111(); } catch {}
      }

      openAdminFromUserPanel = function(){
        try { closeUserPanel(); } catch {}
        setTimeout(() => {
          const code = window.prompt("Yönetici kodunu giriniz:");
          if (String(code || "").trim() !== String(ADMIN_CODE)) {
            if (typeof showToast === "function") showToast("Yönetici kodu hatalı.");
            return;
          }
          state.lastAdminCode = String(code).trim();
          sessionStorage.setItem("mesaha_admin_code", state.lastAdminCode);
          sessionStorage.setItem("mesaha_admin_panel_open", "1");
          showAdminPageV131();
          adminLoadWithLoadingV131("Admin paneli açılıyor...").catch(err => {
            if (typeof showToast === "function") showToast(err && err.message ? err.message : "Admin paneli açılamadı.");
          });
        }, 120);
      };
      window.openAdminFromUserPanel = openAdminFromUserPanel;

      function replaceClickButtonV131(id, handler){
        const old = document.getElementById(id);
        if (!old) return null;
        const clone = old.cloneNode(true);
        clone.removeAttribute("onclick");
        clone.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); handler(event); });
        old.parentNode.replaceChild(clone, old);
        if (typeof els !== "undefined") els[id] = clone;
        return clone;
      }

      function initAdminV131(){
        document.body.classList.remove("admin-unlocked-v131");
        try {
          const adminTab = document.querySelector('#flowTabsV111 [data-flow-tab="admin"]');
          if (adminTab) adminTab.style.display = "none";
          if (els.navAdmin) els.navAdmin.style.display = "none";
        } catch {}
        document.querySelectorAll('.admin-filters-clean, .admin-quick-filters-clean, .admin-tabs-clean, #adminNotesView, #adminReportsView').forEach(el => el.style.display = 'none');
        replaceClickButtonV131("panelAdminOpenBtn", openAdminFromUserPanel);
        replaceClickButtonV131("adminRefreshBtn", adminRefreshWithConfirmV131);
        try { renderAdminUsers(); } catch {}
      }

      const prevCurrentDeviceInfoPayloadV131 = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
      currentDeviceInfoPayload = function(){
        const info = prevCurrentDeviceInfoPayloadV131 ? prevCurrentDeviceInfoPayloadV131() : {};
        info.appVersion = BUILD_VERSION_V131;
        info.fileVersion = FILE_VERSION_V131;
        info.adminSimpleList = true;
        info.updatedMs = Date.now();
        return info;
      };

      window.MESAHA_BUILD_INFO = {
        fileVersion: FILE_VERSION_V131,
        visibleVersion: BUILD_VERSION_V131,
        stableBuild: true,
        adminSimpleList: true,
        keyboardShortcutFix: true,
        offlineFirstTimeoutMs: (typeof MESAHA_STARTUP_TIMEOUT_V129 !== "undefined" ? MESAHA_STARTUP_TIMEOUT_V129 : 3000)
      };

      initAdminV131();
      setTimeout(initAdminV131, 300);
      setTimeout(initAdminV131, 1200);
    })();


    /* v132: Admin istatistik - en çok ağaç/odun türü, adet ve m³ */
    (function(){
      const BUILD_VERSION_V132 = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
      const FILE_VERSION_V132 = "v135";

      function adminStatsSetLoadingV132(show, text){
        try {
          if (typeof setCloudLoading === "function") setCloudLoading(!!show, text || "İstatistikler hazırlanıyor...");
        } catch {}
      }

      function adminStatsFmtM3V132(value){
        const n = Number(value) || 0;
        return n.toLocaleString("tr-TR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " m³";
      }
      function adminStatsFmtIntV132(value){
        return (Number(value) || 0).toLocaleString("tr-TR");
      }
      function adminStatsClassV132(name, type){
        const raw = String(name || "").toLocaleLowerCase("tr-TR").replace(/[^a-zığüşöçİĞÜŞÖÇ]+/gi, "-").replace(/^-+|-+$/g, "");
        if (type === "tree") return "tree-" + raw;
        if (raw.includes("tomruk")) return "prod-tomruk";
        if (raw.includes("maden")) return "prod-maden";
        if (raw.includes("kağıt") || raw.includes("kagit")) return "prod-kağıtlık";
        if (raw.includes("sanayi")) return "prod-sanayi";
        if (raw.includes("tel")) return "prod-tel";
        return "prod-" + raw;
      }
      function adminStatsAddV132(map, key, adet, m3){
        const k = String(key || "Bilinmiyor").trim() || "Bilinmiyor";
        const old = map.get(k) || { name:k, adet:0, m3:0 };
        old.adet += Number(adet) || 0;
        old.m3 += Number(m3) || 0;
        map.set(k, old);
      }
      function adminStatsQuantityV132(r){
        return Number(r && (r.quantity ?? r.adet ?? r.count)) || 0;
      }
      function adminStatsM3V132(r){
        if (!r) return 0;
        const desi = Number(r.desi);
        if (Number.isFinite(desi) && desi > 0) return desi / 1000;
        const hacimRaw = String(r.hacim ?? r.volume ?? "").replace(",", ".").replace(/[^0-9.\-]+/g, "");
        const hacim = Number(hacimRaw);
        if (Number.isFinite(hacim) && hacim > 0) return hacim;
        try {
          const d = Number(r.diameter ?? r.cap ?? r.çap ?? 0);
          const l = Number(r.length ?? r.boy ?? 0);
          const q = adminStatsQuantityV132(r) || 1;
          if (typeof calculateDesi === "function") return (Number(calculateDesi(d, l, q)) || 0) / 1000;
        } catch {}
        return 0;
      }
      function adminStatsTreeNameV132(r){
        const raw = String((r && (r.treeType || r.species || r.agacAdi || r.ağaç || r.agac)) || "").trim();
        if (raw) {
          try { return (typeof getTreeInfo === "function" ? getTreeInfo(raw).agacAdi : raw) || raw; } catch { return raw; }
        }
        return "Bilinmiyor";
      }
      function adminStatsProductNameV132(r){
        const raw = String((r && (r.productType || r.odunAdi || r.odun || r.product)) || "").trim();
        if (!raw) return "Bilinmiyor";
        try {
          if (typeof PRODUCT_MAP !== "undefined" && PRODUCT_MAP[raw]) return PRODUCT_MAP[raw].odunAdi || raw;
          if (typeof productDisplayName === "function") return productDisplayName(raw) || raw;
        } catch {}
        return raw;
      }
      function adminStatsSortV132(map){
        return Array.from(map.values()).sort((a,b) => {
          if ((b.m3 || 0) !== (a.m3 || 0)) return (b.m3 || 0) - (a.m3 || 0);
          if ((b.adet || 0) !== (a.adet || 0)) return (b.adet || 0) - (a.adet || 0);
          return String(a.name).localeCompare(String(b.name), "tr");
        });
      }
      function adminStatsRowsHtmlV132(rows, type){
        if (!rows.length) return `<div class="admin-stats-empty-v132">Veri bulunamadı.</div>`;
        return rows.map(row => `
          <div class="admin-stat-row-v132 ${escapeHtml(adminStatsClassV132(row.name, type))}">
            <div class="admin-stat-name-v132">${escapeHtml(row.name)}</div>
            <div class="admin-stat-val-v132">${adminStatsFmtIntV132(row.adet)} adet</div>
            <div class="admin-stat-val-v132">${adminStatsFmtM3V132(row.m3)}</div>
          </div>`).join("");
      }

      async function firebaseLoadAdminStatsV132(){
        const { db } = await ensureFirebaseReady();
        const snap = await db.collection(typeof FIREBASE_BACKUPS_COLLECTION !== "undefined" ? FIREBASE_BACKUPS_COLLECTION : "backups").get();
        const latestByUser = new Map();
        snap.forEach(doc => {
          try {
            const d = doc.data() || {};
            let payload = d.payload || null;
            if (!payload && d.payloadText) payload = JSON.parse(d.payloadText);
            if (!payload || !Array.isArray(payload.records) || !payload.records.length) return;
            const name = cleanUserText(d.name || (payload.user && payload.user.name) || "");
            const seflik = cleanUserText(d.seflik || (payload.user && payload.user.seflik) || "");
            const key = d.userKey || (typeof firebaseUserKey === "function" ? firebaseUserKey(name, seflik) : `${name}_${seflik}`) || doc.id;
            const ms = Number(d.createdAtMs || 0) || Date.parse(d.createdAtIso || "") || 0;
            const old = latestByUser.get(key);
            if (!old || ms >= old.ms) latestByUser.set(key, { id:doc.id, ms, name, seflik, payload });
          } catch {}
        });

        const treeMap = new Map();
        const productMap = new Map();
        let totalRecords = 0;
        let totalAdet = 0;
        let totalM3 = 0;
        latestByUser.forEach(item => {
          (item.payload.records || []).forEach(r => {
            const adet = adminStatsQuantityV132(r) || 1;
            const m3 = adminStatsM3V132(r);
            totalRecords += 1;
            totalAdet += adet;
            totalM3 += m3;
            adminStatsAddV132(treeMap, adminStatsTreeNameV132(r), adet, m3);
            adminStatsAddV132(productMap, adminStatsProductNameV132(r), adet, m3);
          });
        });
        return {
          users: latestByUser.size,
          recordCount: totalRecords,
          adet: totalAdet,
          m3: totalM3,
          trees: adminStatsSortV132(treeMap),
          products: adminStatsSortV132(productMap),
          loadedAt: new Date().toLocaleString("tr-TR")
        };
      }

      function ensureAdminStatsUiV132(){
        const top = document.querySelector(".admin-panel-top-clean");
        const refresh = document.getElementById("adminRefreshBtn");
        if (top && refresh && !document.getElementById("adminStatsBtnV132")) {
          let actions = top.querySelector(".admin-top-actions-v132");
          if (!actions) {
            actions = document.createElement("div");
            actions.className = "admin-top-actions-v132";
            top.appendChild(actions);
            actions.appendChild(refresh);
          }
          const btn = document.createElement("button");
          btn.type = "button";
          btn.id = "adminStatsBtnV132";
          btn.className = "secondary admin-stats-toggle-v132";
          btn.textContent = "İstatistik";
          actions.insertBefore(btn, refresh);
          btn.addEventListener("click", () => adminToggleStatsV132());
        }
        const summary = document.querySelector(".admin-summary-grid-clean");
        if (summary && !document.getElementById("adminStatsPanelV132")) {
          const panel = document.createElement("div");
          panel.id = "adminStatsPanelV132";
          panel.className = "admin-stats-panel-v132";
          panel.innerHTML = `<div class="admin-stats-empty-v132">İstatistikleri görmek için üstteki İstatistik butonuna bas.</div>`;
          summary.insertAdjacentElement("afterend", panel);
        }
      }

      function renderAdminStatsV132(stats, message){
        ensureAdminStatsUiV132();
        const panel = document.getElementById("adminStatsPanelV132");
        if (!panel) return;
        if (message) {
          panel.innerHTML = `<div class="admin-stats-empty-v132">${escapeHtml(message)}</div>`;
          return;
        }
        if (!stats || (!stats.trees.length && !stats.products.length)) {
          panel.innerHTML = `<div class="admin-stats-empty-v132">İstatistik için uygun Firebase yedeği bulunamadı. Yeni yedekler alınmaya başladıkça burası dolacak.</div>`;
          return;
        }
        const topTree = stats.trees[0] || { name:"-", adet:0, m3:0 };
        const topProduct = stats.products[0] || { name:"-", adet:0, m3:0 };
        panel.innerHTML = `
          <div class="admin-stats-head-v132">
            <div>
              <b>Toplu İstatistik</b>
              <span>Her kullanıcı için son Firebase yedeği esas alınır. Son yenileme: ${escapeHtml(stats.loadedAt || "-")}</span>
            </div>
            <button type="button" class="secondary" onclick="adminRefreshStatsV132()">Yenile</button>
          </div>
          <div class="admin-stats-cards-v132">
            <div class="admin-stat-top-card-v132"><span>En fazla ağaç türü</span><b>${escapeHtml(topTree.name)}</b><small>${adminStatsFmtIntV132(topTree.adet)} adet • ${adminStatsFmtM3V132(topTree.m3)}</small></div>
            <div class="admin-stat-top-card-v132"><span>En fazla odun türü</span><b>${escapeHtml(topProduct.name)}</b><small>${adminStatsFmtIntV132(topProduct.adet)} adet • ${adminStatsFmtM3V132(topProduct.m3)}</small></div>
            <div class="admin-stat-top-card-v132"><span>Kapsam</span><b>${adminStatsFmtIntV132(stats.users)} kullanıcı</b><small>${adminStatsFmtIntV132(stats.recordCount)} kayıt</small></div>
            <div class="admin-stat-top-card-v132"><span>Toplam</span><b>${adminStatsFmtIntV132(stats.adet)} adet</b><small>${adminStatsFmtM3V132(stats.m3)}</small></div>
          </div>
          <div class="admin-stats-columns-v132">
            <div class="admin-stats-section-v132"><h4>Ağaç türleri</h4>${adminStatsRowsHtmlV132(stats.trees, "tree")}</div>
            <div class="admin-stats-section-v132"><h4>Odun türleri</h4>${adminStatsRowsHtmlV132(stats.products, "product")}</div>
          </div>`;
      }

      async function loadAndRenderAdminStatsV132(force){
        ensureAdminStatsUiV132();
        const panel = document.getElementById("adminStatsPanelV132");
        if (panel) panel.classList.add("open");
        const btn = document.getElementById("adminStatsBtnV132");
        if (btn) btn.classList.add("active");
        if (!force && state.adminStatsV132) return renderAdminStatsV132(state.adminStatsV132);
        adminStatsSetLoadingV132(true, "İstatistikler hazırlanıyor...");
        renderAdminStatsV132(null, "İstatistikler hazırlanıyor...");
        try {
          state.adminStatsV132 = await firebaseLoadAdminStatsV132();
          renderAdminStatsV132(state.adminStatsV132);
        } catch (err) {
          renderAdminStatsV132(null, "İstatistikler alınamadı. İnternet, Firebase bağlantısı veya Firestore Rules alanını kontrol et.");
          if (typeof showToast === "function") showToast(err && err.message ? err.message : "İstatistik alınamadı.");
        } finally {
          adminStatsSetLoadingV132(false);
        }
      }

      window.adminRefreshStatsV132 = function(){
        loadAndRenderAdminStatsV132(true);
      };

      window.adminToggleStatsV132 = function(){
        ensureAdminStatsUiV132();
        const panel = document.getElementById("adminStatsPanelV132");
        const btn = document.getElementById("adminStatsBtnV132");
        if (!panel) return;
        const willOpen = !panel.classList.contains("open");
        panel.classList.toggle("open", willOpen);
        if (btn) btn.classList.toggle("active", willOpen);
        if (willOpen) loadAndRenderAdminStatsV132(false);
      };

      const prevAdminLoadDataV132 = typeof loadAdminPanelData === "function" ? loadAdminPanelData : null;
      if (prevAdminLoadDataV132) {
        loadAdminPanelData = async function(){
          await prevAdminLoadDataV132.apply(this, arguments);
          try { if (document.getElementById("adminStatsPanelV132")?.classList.contains("open")) await loadAndRenderAdminStatsV132(true); } catch {}
        };
      }

      const prevCurrentDeviceInfoPayloadV132 = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
      currentDeviceInfoPayload = function(){
        const info = prevCurrentDeviceInfoPayloadV132 ? prevCurrentDeviceInfoPayloadV132() : {};
        info.appVersion = BUILD_VERSION_V132;
        info.fileVersion = FILE_VERSION_V132;
        info.adminStatsPanel = true;
        info.updatedMs = Date.now();
        return info;
      };

      window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
        fileVersion: FILE_VERSION_V132,
        visibleVersion: BUILD_VERSION_V132,
        adminStatsPanel: true,
        stableBuild: true
      });

      ensureAdminStatsUiV132();
      setTimeout(ensureAdminStatsUiV132, 300);
      setTimeout(ensureAdminStatsUiV132, 1200);
    })();


    /* v133: Admin panelinde Sorun Bildirimleri alanı */
    (function(){
      const BUILD_VERSION_V133 = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
      const FILE_VERSION_V133 = "v134";

      function supportSetLoadingV133(show, text){
        try {
          if (typeof setCloudLoading === "function") setCloudLoading(!!show, text || "Sorun bildirimleri yükleniyor...");
        } catch {}
      }

      function ensureAdminSupportUiV133(){
        const top = document.querySelector(".admin-panel-top-clean");
        const refresh = document.getElementById("adminRefreshBtn");
        if (top && refresh && !document.getElementById("adminSupportBtnV133")) {
          let actions = top.querySelector(".admin-top-actions-v132");
          if (!actions) {
            actions = document.createElement("div");
            actions.className = "admin-top-actions-v132";
            top.appendChild(actions);
            actions.appendChild(refresh);
          }
          const btn = document.createElement("button");
          btn.type = "button";
          btn.id = "adminSupportBtnV133";
          btn.className = "secondary admin-support-toggle-v133";
          btn.textContent = "Sorunlar";
          const statsBtn = document.getElementById("adminStatsBtnV132");
          if (statsBtn && statsBtn.parentNode === actions) actions.insertBefore(btn, statsBtn);
          else actions.insertBefore(btn, refresh);
          btn.addEventListener("click", () => window.adminToggleReportsV133());
        }

        const reports = document.getElementById("adminReportsView");
        if (reports) {
          reports.classList.add("admin-reports-panel-v133");
          const toolbar = reports.querySelector(".admin-report-toolbar");
          if (toolbar && !document.getElementById("adminReportRefreshBtnV133")) {
            const b = document.createElement("button");
            b.type = "button";
            b.id = "adminReportRefreshBtnV133";
            b.className = "secondary admin-report-refresh-v133";
            b.textContent = "Yenile";
            b.addEventListener("click", () => window.adminRefreshReportsV133(true));
            toolbar.appendChild(b);
          }
          const summary = document.querySelector(".admin-summary-grid-clean");
          const statsPanel = document.getElementById("adminStatsPanelV132");
          if (statsPanel && statsPanel.nextElementSibling !== reports) statsPanel.insertAdjacentElement("afterend", reports);
          else if (!statsPanel && summary && summary.nextElementSibling !== reports) summary.insertAdjacentElement("afterend", reports);
        }
      }

      function setReportsOpenV133(open){
        document.body.classList.toggle("admin-reports-open-v133", !!open);
        const btn = document.getElementById("adminSupportBtnV133");
        if (btn) btn.classList.toggle("active", !!open);
      }

      async function loadReportsV133(){
        ensureAdminSupportUiV133();
        setReportsOpenV133(true);
        supportSetLoadingV133(true, "Sorun bildirimleri yükleniyor...");
        try {
          if (typeof renderAdminReports === "function") await renderAdminReports();
          else {
            const list = document.getElementById("adminReportsList");
            if (list) list.innerHTML = `<div class="empty-user-list">Sorun bildirimi modülü bulunamadı.</div>`;
          }
        } catch (err) {
          const list = document.getElementById("adminReportsList");
          if (list) list.innerHTML = `<div class="cloud-backup-error">Sorun bildirimleri alınamadı. İnternet veya Firebase bağlantısını kontrol et.</div>`;
          if (typeof showToast === "function") showToast(err && err.message ? err.message : "Sorun bildirimleri alınamadı.");
        } finally {
          supportSetLoadingV133(false);
        }
      }

      window.adminRefreshReportsV133 = function(){
        return loadReportsV133();
      };

      window.adminToggleReportsV133 = function(){
        ensureAdminSupportUiV133();
        const willOpen = !document.body.classList.contains("admin-reports-open-v133");
        setReportsOpenV133(willOpen);
        if (willOpen) {
          try {
            const statsPanel = document.getElementById("adminStatsPanelV132");
            const statsBtn = document.getElementById("adminStatsBtnV132");
            if (statsPanel) statsPanel.classList.remove("open");
            if (statsBtn) statsBtn.classList.remove("active");
          } catch {}
          loadReportsV133();
        }
      };

      const prevAdminToggleStatsV133 = typeof window.adminToggleStatsV132 === "function" ? window.adminToggleStatsV132 : null;
      if (prevAdminToggleStatsV133) {
        window.adminToggleStatsV132 = function(){
          setReportsOpenV133(false);
          return prevAdminToggleStatsV133.apply(this, arguments);
        };
      }

      const prevAdminPanelLoadV133 = typeof loadAdminPanelData === "function" ? loadAdminPanelData : null;
      if (prevAdminPanelLoadV133) {
        loadAdminPanelData = async function(){
          await prevAdminPanelLoadV133.apply(this, arguments);
          try { if (document.body.classList.contains("admin-reports-open-v133")) await loadReportsV133(); } catch {}
        };
      }

      const prevCurrentDeviceInfoPayloadV133 = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
      currentDeviceInfoPayload = function(){
        const info = prevCurrentDeviceInfoPayloadV133 ? prevCurrentDeviceInfoPayloadV133() : {};
        info.appVersion = BUILD_VERSION_V133;
        info.fileVersion = FILE_VERSION_V133;
        info.adminSupportPanel = true;
        info.updatedMs = Date.now();
        return info;
      };

      window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
        fileVersion: FILE_VERSION_V133,
        visibleVersion: BUILD_VERSION_V133,
        adminSupportPanel: true,
        stableBuild: true
      });

      ensureAdminSupportUiV133();
      setTimeout(ensureAdminSupportUiV133, 300);
      setTimeout(ensureAdminSupportUiV133, 1300);
    })();



    /* v134: Admin detayları, güvenli kullanıcı silme, rozetler, dönemli istatistik ve offline sorun kuyruğu */
    (function(){
      const BUILD_VERSION_V134 = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
      const FILE_VERSION_V134 = "v134";
      const CURRENT_FILE_NO_V134 = 134;
      const CURRENT_VISIBLE_NO_V134 = 1.63;
      const SUPPORT_QUEUE_KEY_V134 = "mesaha_support_queue_v134";

      function v134Toast(text){ try { if (typeof showToast === "function") showToast(text); } catch {} }
      function v134Esc(value){ try { return escapeHtml(value); } catch { return String(value ?? "").replace(/[&<>'"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[m])); } }
      function v134Clean(value){ try { return cleanUserText(value); } catch { return String(value || "").trim(); } }
      function v134Key(name, seflik){ try { return firebaseUserKey(name, seflik); } catch { return String(`${v134Clean(name)}__${v134Clean(seflik)}`).toLocaleLowerCase("tr-TR"); } }
      function v134TrInt(n){ return (Number(n) || 0).toLocaleString("tr-TR"); }
      function v134M3(value){ try { if (typeof adminM3TextV128 === "function") return adminM3TextV128(value); } catch {} return `${(Number(value)||0).toFixed(3)} m³`; }
      function v134Duration(ms){ try { if (typeof adminDurationTextV128 === "function") return adminDurationTextV128(ms); } catch {} const min=Math.round((Number(ms)||0)/60000); return min ? `${min} dk` : "0 dk"; }
      function v134ParseIsoLocal(d){
        const s = String(d || "").slice(0,10);
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return null;
        return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
      }
      function v134TodayIso(){
        const d = new Date();
        const p = n => String(n).padStart(2,"0");
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
      }
      function v134WeekStartIso(){
        const d = new Date();
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        const p = n => String(n).padStart(2,"0");
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
      }
      function v134RecordIso(r){
        if (!r) return "";
        const iso = String(r.productionDate || r.date || r.createdAtIso || "").slice(0,10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
        try { if (typeof trDateToISO === "function") return String(trDateToISO(r.uretimTarihi || r.createdAt || "") || "").slice(0,10); } catch {}
        return "";
      }
      function v134PeriodLabel(period){
        if (period === "today") return "Bugün";
        if (period === "week") return "Bu Hafta";
        return "Tüm Zamanlar";
      }
      function v134RecordInPeriod(r, period){
        if (!period || period === "all") return true;
        const iso = v134RecordIso(r);
        if (!iso) return false;
        if (period === "today") return iso === v134TodayIso();
        if (period === "week") return iso >= v134WeekStartIso() && iso <= v134TodayIso();
        return true;
      }
      function v134ParseFileNo(user){
        const text = String((user && (user.fileVersion || user.appVersion || (user.lastDeviceInfo && (user.lastDeviceInfo.fileVersion || user.lastDeviceInfo.appVersion)))) || "");
        const fm = text.match(/v\s*(\d{2,4})\b/i);
        if (fm && Number(fm[1]) >= 50) return Number(fm[1]);
        const vm = text.match(/v?\s*(\d+)\.(\d+)/i);
        if (vm) {
          const visible = Number(`${vm[1]}.${vm[2]}`);
          if (Number.isFinite(visible)) return visible >= CURRENT_VISIBLE_NO_V134 ? CURRENT_FILE_NO_V134 : Math.max(0, Math.round(100 + (visible - 1.30) * 100));
        }
        return 0;
      }
      function v134IsOldVersion(user){
        const no = v134ParseFileNo(user);
        return no > 0 && no < CURRENT_FILE_NO_V134;
      }
      function v134LastBackupDays(user){
        const ms = Number(user && user.lastBackupMs || 0);
        if (ms) return Math.floor((Date.now() - ms) / 86400000);
        try { return adminDaysSince(user && user.lastBackupAt); } catch { return 9999; }
      }
      function v134ActivityBadge(user){
        const activeToday = (Number(user && user.todayActiveMs)||0) > 0 || (Number(user && user.todayInputAdet)||0) > 0 || (typeof adminIsToday === "function" && adminIsToday(user && user.lastLogin));
        if (activeToday) return `<span class="admin-badge-v134 active">Bugün aktif</span>`;
        let days = 9999;
        try { days = adminDaysSince(user && user.lastLogin); } catch {}
        if (days <= 7) return `<span class="admin-badge-v134 week">Bu hafta aktif</span>`;
        return `<span class="admin-badge-v134 inactive">Uzun süredir girmedi</span>`;
      }
      function v134OpenTicketsForUser(user){
        const rows = Array.isArray(state.adminSupportTicketsV134) ? state.adminSupportTicketsV134 : [];
        const key = v134Key(user && user.name, user && user.seflik);
        return rows.filter(r => {
          const rk = r.userKey || v134Key(r.name, r.seflik);
          return String(rk) === String(key) && String(r.status || "new") !== "done";
        }).length;
      }
      function v134Badges(user){
        const list = [v134ActivityBadge(user)];
        if (v134IsOldVersion(user)) list.push(`<span class="admin-badge-v134 version">Eski sürüm</span>`);
        const bCount = Number(user && user.backupCount || 0);
        const bDays = v134LastBackupDays(user);
        if (!bCount) list.push(`<span class="admin-badge-v134 backup">Yedek yok</span>`);
        else if (bDays >= 3) list.push(`<span class="admin-badge-v134 backup">Yedek eski</span>`);
        else list.push(`<span class="admin-badge-v134 ok">Yedek var</span>`);
        const issues = v134OpenTicketsForUser(user);
        if (issues) list.push(`<span class="admin-badge-v134 issue">${v134TrInt(issues)} açık sorun</span>`);
        return `<div class="admin-user-badges-v134">${list.join("")}</div>`;
      }
      async function v134LoadSupportTickets(){
        try {
          if (typeof firebaseListSupportTickets === "function") {
            state.adminSupportTicketsV134 = await firebaseListSupportTickets();
            return state.adminSupportTicketsV134;
          }
        } catch {}
        try {
          const { db } = await ensureFirebaseReady();
          const snap = await db.collection(typeof FIREBASE_REPORTS_COLLECTION !== "undefined" ? FIREBASE_REPORTS_COLLECTION : "supportTickets").get();
          const rows = [];
          snap.forEach(doc => rows.push(Object.assign({ id: doc.id }, doc.data() || {})));
          rows.sort((a,b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
          state.adminSupportTicketsV134 = rows.slice(0,300);
          return state.adminSupportTicketsV134;
        } catch {
          state.adminSupportTicketsV134 = state.adminSupportTicketsV134 || [];
          return state.adminSupportTicketsV134;
        }
      }
      function v134DeviceText(user){
        return (user && user.lastDeviceInfo && (user.lastDeviceInfo.platform || user.lastDeviceInfo.userAgent)) ||
          (user && user.lastDevice) || `${v134TrInt(Number(user && user.deviceCount) || 0)} cihaz`;
      }
      function v134Status(user){ try { return adminStatus(user); } catch { return { key:"today", label:"AKTİF" }; } }
      function v134SourceText(user){
        const source = (user && (user.sourceLabel || user.source)) || "";
        if (String(source).toLowerCase().includes("firebase")) return "Firebase";
        if (String(source).toLowerCase().includes("apps") || String(source).toLowerCase().includes("eski")) return "Eski";
        return "";
      }
      function v134EscapeArg(value){ return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'"); }

      window.adminOpenUserReportsV134 = function(index){
        try {
          const user = (window.__adminListV134 || [])[index];
          if (!user) return v134Toast("Kullanıcı bulunamadı.");
          if (typeof adminReportFilter !== "undefined") adminReportFilter = "open";
          if (typeof window.adminToggleReportsV133 === "function" && !document.body.classList.contains("admin-reports-open-v133")) window.adminToggleReportsV133();
          else if (typeof renderAdminReports === "function") renderAdminReports();
          v134Toast(`${user.name || "Kullanıcı"} için açık sorunlar Sorunlar bölümünde gösteriliyor.`);
        } catch { v134Toast("Sorunlar açılamadı."); }
      };

      async function v134BatchDeleteQuery(db, collectionName, field, value, batch, counter){
        const snap = await db.collection(collectionName).where(field, "==", value).get();
        snap.forEach(doc => { batch.delete(doc.ref); counter.count += 1; });
      }
      async function v134DeleteFirebaseUser(name, seflik, deleteRelated){
        const { db } = await ensureFirebaseReady();
        const key = v134Key(name, seflik);
        const batch = db.batch();
        const counter = { count: 0 };
        batch.delete(db.collection(typeof FIREBASE_USERS_COLLECTION !== "undefined" ? FIREBASE_USERS_COLLECTION : "users").doc(key));
        counter.count += 1;
        if (deleteRelated) {
          await v134BatchDeleteQuery(db, typeof FIREBASE_BACKUPS_COLLECTION !== "undefined" ? FIREBASE_BACKUPS_COLLECTION : "backups", "userKey", key, batch, counter);
          await v134BatchDeleteQuery(db, typeof FIREBASE_USAGE_COLLECTION !== "undefined" ? FIREBASE_USAGE_COLLECTION : "usageStats", "userKey", key, batch, counter);
          await v134BatchDeleteQuery(db, typeof FIREBASE_REPORTS_COLLECTION !== "undefined" ? FIREBASE_REPORTS_COLLECTION : "supportTickets", "userKey", key, batch, counter);
        }
        await batch.commit();
        return counter.count;
      }
      window.adminDeleteUserV134 = async function(index){
        const user = (window.__adminListV134 || [])[index];
        if (!user) return v134Toast("Kullanıcı bulunamadı.");
        const name = v134Clean(user.name), seflik = v134Clean(user.seflik);
        const typed = window.prompt(`${name} / ${seflik} kullanıcısını silmek için SIL yazınız.\n\nYedekler varsayılan olarak korunur.`);
        const t = String(typed || "").trim().toLocaleUpperCase("tr-TR").replace("İ", "I");
        if (t !== "SIL") return;
        const deleteRelated = window.confirm("Bu kullanıcıya ait yedekler, kullanım istatistikleri ve sorun bildirimleri de silinsin mi?\n\nTamam: Kullanıcı + bağlı veriler silinir.\nİptal: Sadece kullanıcı kaydı silinir, yedekler kalır.");
        try {
          if (typeof setCloudLoading === "function") setCloudLoading(true, "Kullanıcı siliniyor...");
          await v134DeleteFirebaseUser(name, seflik, deleteRelated);
          const delKey = v134Key(name, seflik);
          state.adminOnlineUsers = (state.adminOnlineUsers || []).filter(u => v134Key(u.name, u.seflik) !== delKey);
          state.adminSupportTicketsV134 = (state.adminSupportTicketsV134 || []).filter(r => (r.userKey || v134Key(r.name, r.seflik)) !== delKey);
          try { localStorage.setItem("mesaha_admin_users_cache_v1", JSON.stringify({ time:new Date().toLocaleTimeString("tr-TR", {hour:"2-digit", minute:"2-digit"}), users: state.adminOnlineUsers })); } catch {}
          if (typeof renderAdminUsers === "function") renderAdminUsers();
          if (typeof updateAdminTopSummary === "function") updateAdminTopSummary();
          v134Toast(deleteRelated ? "Kullanıcı ve bağlı veriler silindi." : "Kullanıcı silindi, yedekler korundu.");
        } catch (err) {
          v134Toast(err && err.message ? err.message : "Kullanıcı silinemedi.");
        } finally {
          try { if (typeof setCloudLoading === "function") setCloudLoading(false); } catch {}
        }
      };

      const prevAdminFilteredUsersV134 = typeof adminFilteredUsers === "function" ? adminFilteredUsers : null;
      adminFilteredUsers = function(){
        const list = prevAdminFilteredUsersV134 ? prevAdminFilteredUsersV134() : (Array.isArray(state.adminOnlineUsers) ? state.adminOnlineUsers.slice() : []);
        return list.slice().sort((a,b) => {
          const ai = v134OpenTicketsForUser(a), bi = v134OpenTicketsForUser(b);
          if (bi !== ai) return bi - ai;
          const au = Number(a.lastUsageMs || a.lastLoginMs || 0);
          const bu = Number(b.lastUsageMs || b.lastLoginMs || 0);
          if (bu !== au) return bu - au;
          return String(a.name || "").localeCompare(String(b.name || ""), "tr");
        });
      };

      renderAdminUsers = function(){
        if (!els.registeredUsersList) return;
        try { updateAdminTopSummary(); } catch {}
        const list = adminFilteredUsers();
        window.__adminListV134 = window.__adminListV131 = list;
        els.registeredUsersList.classList.add("admin-list-v131");
        if (!list.length) {
          els.registeredUsersList.innerHTML = `<div class="empty-user-list">Kullanıcı bulunamadı.</div>`;
          return;
        }
        els.registeredUsersList.innerHTML = list.map((user, index) => {
          const status = v134Status(user);
          const sourceText = v134SourceText(user);
          const deviceText = v134DeviceText(user);
          const todayAdet = v134TrInt(user.todayInputAdet);
          const todayM3 = v134M3(user.todayInputM3);
          const todaySure = v134Duration(user.todayActiveMs);
          const weekM3 = v134M3(user.weekInputM3);
          const openIssues = v134OpenTicketsForUser(user);
          return `
            <div class="admin-user-row-v131 status-${v134Esc(status.key || "today")} ${openIssues ? "has-open-issue-v134" : ""}" data-admin-row-v131="${index}">
              <div class="admin-user-main-v131">
                <b>${v134Esc(user.name || "-")}</b>
                <span>${v134Esc(user.seflik || "-")} ${sourceText ? `• ${v134Esc(sourceText)}` : ""}</span>
                ${v134Badges(user)}
              </div>
              <div class="admin-user-stats-v131">
                <span>Süre <b>${v134Esc(todaySure)}</b></span>
                <span>Adet <b>${v134Esc(todayAdet)}</b></span>
                <span>m³ <b>${v134Esc(todayM3)}</b></span>
              </div>
              <button class="admin-detail-bubble-v131" type="button" onclick="adminToggleDetailV131(${index})">Detay</button>
              <div class="admin-user-detail-panel-v131">
                <div class="admin-detail-grid-v131">
                  <span>Durum <b>${v134Esc(status.label || "-")}</b></span>
                  <span>Son giriş <b>${v134Esc(user.lastLogin || "-")}</b></span>
                  <span>Son aktif <b>${v134Esc(user.lastUsageAt || user.lastLogin || "-")}</b></span>
                  <span>Son yedek <b>${v134Esc(user.lastBackupAt || "-")}</b></span>
                  <span>Yedek sayısı <b>${v134TrInt(user.backupCount)}</b></span>
                  <span>Açık sorun <b>${v134TrInt(openIssues)}</b></span>
                  <span>7 gün adet <b>${v134TrInt(user.weekInputAdet)}</b></span>
                  <span>7 gün m³ <b>${v134Esc(weekM3)}</b></span>
                  <span>Sürüm <b>${v134Esc(user.appVersion || user.fileVersion || "-")}</b></span>
                  <span>Cihaz <b>${v134Esc(deviceText || "-")}</b></span>
                </div>
                <div class="admin-detail-actions-v131">
                  <button class="secondary" type="button" onclick="adminOpenUserBackups('${v134EscapeArg(user.name)}','${v134EscapeArg(user.seflik)}')">Yedekleri Gör</button>
                  ${openIssues ? `<button class="issue-v134" type="button" onclick="adminOpenUserReportsV134(${index})">Sorunları Gör</button>` : ""}
                  <button class="danger-v134" type="button" onclick="adminDeleteUserV134(${index})">Kullanıcıyı Sil</button>
                  <button class="ghost" type="button" onclick="adminToggleDetailV131(${index})">Kapat</button>
                </div>
              </div>
            </div>`;
        }).join("");
      };

      // Dönemli istatistik paneli
      window.adminStatsPeriodV134 = window.adminStatsPeriodV134 || "all";
      function v134StatsAdd(map, key, adet, m3){
        const k = String(key || "Bilinmiyor").trim() || "Bilinmiyor";
        const old = map.get(k) || { name:k, adet:0, m3:0 };
        old.adet += Number(adet) || 0;
        old.m3 += Number(m3) || 0;
        map.set(k, old);
      }
      function v134StatsQty(r){ return Number(r && (r.quantity ?? r.adet ?? r.count)) || 0; }
      function v134StatsM3(r){
        if (!r) return 0;
        const desi = Number(r.desi);
        if (Number.isFinite(desi) && desi > 0) return desi / 1000;
        const hacimRaw = String(r.hacim ?? r.volume ?? "").replace(",", ".").replace(/[^0-9.\-]+/g, "");
        const hacim = Number(hacimRaw);
        if (Number.isFinite(hacim) && hacim > 0) return hacim;
        try {
          const d = Number(r.diameter ?? r.cap ?? r.çap ?? 0);
          const l = Number(r.length ?? r.boy ?? 0);
          const q = v134StatsQty(r) || 1;
          if (typeof calculateDesi === "function") return (Number(calculateDesi(d, l, q)) || 0) / 1000;
        } catch {}
        return 0;
      }
      function v134TreeName(r){
        const raw = String((r && (r.treeType || r.species || r.agacAdi || r.ağaç || r.agac)) || "").trim();
        if (raw) { try { return (typeof getTreeInfo === "function" ? getTreeInfo(raw).agacAdi : raw) || raw; } catch { return raw; } }
        return "Bilinmiyor";
      }
      function v134ProductName(r){
        const raw = String((r && (r.productType || r.odunAdi || r.odun || r.product)) || "").trim();
        if (!raw) return "Bilinmiyor";
        try { if (typeof PRODUCT_MAP !== "undefined" && PRODUCT_MAP[raw]) return PRODUCT_MAP[raw].odunAdi || raw; } catch {}
        try { if (typeof productDisplayName === "function") return productDisplayName(raw) || raw; } catch {}
        return raw;
      }
      function v134Sort(map){
        return Array.from(map.values()).sort((a,b) => ((b.m3||0)-(a.m3||0)) || ((b.adet||0)-(a.adet||0)) || String(a.name).localeCompare(String(b.name), "tr"));
      }
      function v134Class(name, type){
        const raw = String(name || "").toLocaleLowerCase("tr-TR").replace(/[^a-zığüşöçİĞÜŞÖÇ]+/gi, "-").replace(/^-+|-+$/g, "");
        if (type === "tree") return "tree-" + raw;
        if (raw.includes("tomruk")) return "prod-tomruk";
        if (raw.includes("maden")) return "prod-maden";
        if (raw.includes("kağıt") || raw.includes("kagit")) return "prod-kağıtlık";
        if (raw.includes("sanayi")) return "prod-sanayi";
        if (raw.includes("tel")) return "prod-tel";
        return "prod-" + raw;
      }
      function v134Rows(rows, type){
        if (!rows.length) return `<div class="admin-stats-empty-v132">Veri bulunamadı.</div>`;
        return rows.map(row => `
          <div class="admin-stat-row-v132 ${v134Esc(v134Class(row.name, type))}">
            <div class="admin-stat-name-v132">${v134Esc(row.name)}</div>
            <div class="admin-stat-val-v132">${v134TrInt(row.adet)} adet</div>
            <div class="admin-stat-val-v132">${v134M3(row.m3)}</div>
          </div>`).join("");
      }
      async function v134LoadStats(period){
        const { db } = await ensureFirebaseReady();
        const snap = await db.collection(typeof FIREBASE_BACKUPS_COLLECTION !== "undefined" ? FIREBASE_BACKUPS_COLLECTION : "backups").get();
        const latestByUser = new Map();
        snap.forEach(doc => {
          try {
            const d = doc.data() || {};
            let payload = d.payload || null;
            if (!payload && d.payloadText) payload = JSON.parse(d.payloadText);
            if (!payload || !Array.isArray(payload.records) || !payload.records.length) return;
            const name = v134Clean(d.name || (payload.user && payload.user.name) || "");
            const seflik = v134Clean(d.seflik || (payload.user && payload.user.seflik) || "");
            const key = d.userKey || v134Key(name, seflik) || doc.id;
            const ms = Number(d.createdAtMs || 0) || Date.parse(d.createdAtIso || "") || 0;
            const old = latestByUser.get(key);
            if (!old || ms >= old.ms) latestByUser.set(key, { id:doc.id, ms, name, seflik, payload });
          } catch {}
        });
        const treeMap = new Map();
        const productMap = new Map();
        let totalRecords = 0, totalAdet = 0, totalM3 = 0;
        latestByUser.forEach(item => {
          (item.payload.records || []).forEach(r => {
            if (!v134RecordInPeriod(r, period)) return;
            const adet = v134StatsQty(r) || 1;
            const m3 = v134StatsM3(r);
            totalRecords += 1; totalAdet += adet; totalM3 += m3;
            v134StatsAdd(treeMap, v134TreeName(r), adet, m3);
            v134StatsAdd(productMap, v134ProductName(r), adet, m3);
          });
        });
        return { users: latestByUser.size, recordCount: totalRecords, adet: totalAdet, m3: totalM3, trees: v134Sort(treeMap), products: v134Sort(productMap), period, loadedAt: new Date().toLocaleString("tr-TR") };
      }
      function v134EnsureStatsUi(){
        const top = document.querySelector(".admin-panel-top-clean");
        const refresh = document.getElementById("adminRefreshBtn");
        if (top && refresh && !document.getElementById("adminStatsBtnV132")) {
          let actions = top.querySelector(".admin-top-actions-v132");
          if (!actions) { actions = document.createElement("div"); actions.className = "admin-top-actions-v132"; top.appendChild(actions); actions.appendChild(refresh); }
          const btn = document.createElement("button");
          btn.type = "button"; btn.id = "adminStatsBtnV132"; btn.className = "secondary admin-stats-toggle-v132"; btn.textContent = "İstatistik";
          actions.insertBefore(btn, refresh); btn.addEventListener("click", () => window.adminToggleStatsV132());
        }
        const summary = document.querySelector(".admin-summary-grid-clean");
        if (summary && !document.getElementById("adminStatsPanelV132")) {
          const panel = document.createElement("div"); panel.id = "adminStatsPanelV132"; panel.className = "admin-stats-panel-v132";
          panel.innerHTML = `<div class="admin-stats-empty-v132">İstatistikleri görmek için üstteki İstatistik butonuna bas.</div>`;
          summary.insertAdjacentElement("afterend", panel);
        }
      }
      function v134RenderStats(stats, message){
        v134EnsureStatsUi();
        const panel = document.getElementById("adminStatsPanelV132");
        if (!panel) return;
        if (message) { panel.innerHTML = `<div class="admin-stats-empty-v132">${v134Esc(message)}</div>`; return; }
        if (!stats || (!stats.trees.length && !stats.products.length)) {
          panel.innerHTML = `<div class="admin-stats-empty-v132">${v134Esc(v134PeriodLabel(window.adminStatsPeriodV134))} için uygun Firebase yedeği bulunamadı.</div>`;
          return;
        }
        const topTree = stats.trees[0] || { name:"-", adet:0, m3:0 };
        const topProduct = stats.products[0] || { name:"-", adet:0, m3:0 };
        const period = stats.period || window.adminStatsPeriodV134 || "all";
        panel.innerHTML = `
          <div class="admin-stats-head-v132">
            <div>
              <b>Toplu İstatistik</b>
              <span>Dönem: ${v134Esc(v134PeriodLabel(period))} • Her kullanıcı için son Firebase yedeği esas alınır. Son yenileme: ${v134Esc(stats.loadedAt || "-")}</span>
              <div class="admin-stats-period-v134">
                <button type="button" class="${period === "today" ? "active" : ""}" onclick="adminSetStatsPeriodV134('today')">Bugün</button>
                <button type="button" class="${period === "week" ? "active" : ""}" onclick="adminSetStatsPeriodV134('week')">Bu Hafta</button>
                <button type="button" class="${period === "all" ? "active" : ""}" onclick="adminSetStatsPeriodV134('all')">Tüm Zamanlar</button>
              </div>
              <div class="admin-stats-note-v134">Bugün/hafta seçimi kayıtlardaki üretim tarihine göre hesaplanır.</div>
            </div>
            <button type="button" class="secondary" onclick="adminRefreshStatsV132()">Yenile</button>
          </div>
          <div class="admin-stats-cards-v132">
            <div class="admin-stat-top-card-v132"><span>En fazla ağaç türü</span><b>${v134Esc(topTree.name)}</b><small>${v134TrInt(topTree.adet)} adet • ${v134M3(topTree.m3)}</small></div>
            <div class="admin-stat-top-card-v132"><span>En fazla odun türü</span><b>${v134Esc(topProduct.name)}</b><small>${v134TrInt(topProduct.adet)} adet • ${v134M3(topProduct.m3)}</small></div>
            <div class="admin-stat-top-card-v132"><span>Kapsam</span><b>${v134TrInt(stats.users)} kullanıcı</b><small>${v134TrInt(stats.recordCount)} kayıt</small></div>
            <div class="admin-stat-top-card-v132"><span>Toplam</span><b>${v134TrInt(stats.adet)} adet</b><small>${v134M3(stats.m3)}</small></div>
          </div>
          <div class="admin-stats-columns-v132">
            <div class="admin-stats-section-v132"><h4>Ağaç türleri</h4>${v134Rows(stats.trees, "tree")}</div>
            <div class="admin-stats-section-v132"><h4>Odun türleri</h4>${v134Rows(stats.products, "product")}</div>
          </div>`;
      }
      async function v134LoadAndRenderStats(force){
        v134EnsureStatsUi();
        const period = window.adminStatsPeriodV134 || "all";
        const panel = document.getElementById("adminStatsPanelV132");
        const btn = document.getElementById("adminStatsBtnV132");
        if (panel) panel.classList.add("open");
        if (btn) btn.classList.add("active");
        const cacheKey = `adminStatsV134_${period}`;
        if (!force && state[cacheKey]) return v134RenderStats(state[cacheKey]);
        try { if (typeof setCloudLoading === "function") setCloudLoading(true, "İstatistikler hazırlanıyor..."); } catch {}
        v134RenderStats(null, "İstatistikler hazırlanıyor...");
        try { state[cacheKey] = await v134LoadStats(period); v134RenderStats(state[cacheKey]); }
        catch (err) { v134RenderStats(null, "İstatistikler alınamadı. İnternet, Firebase bağlantısı veya Firestore Rules alanını kontrol et."); v134Toast(err && err.message ? err.message : "İstatistik alınamadı."); }
        finally { try { if (typeof setCloudLoading === "function") setCloudLoading(false); } catch {} }
      }
      window.adminSetStatsPeriodV134 = function(period){
        window.adminStatsPeriodV134 = (period === "today" || period === "week") ? period : "all";
        v134LoadAndRenderStats(true);
      };
      window.adminRefreshStatsV132 = function(){ return v134LoadAndRenderStats(true); };
      window.adminToggleStatsV132 = function(){
        v134EnsureStatsUi();
        try { document.body.classList.remove("admin-reports-open-v133"); document.getElementById("adminSupportBtnV133")?.classList.remove("active"); } catch {}
        const panel = document.getElementById("adminStatsPanelV132");
        const btn = document.getElementById("adminStatsBtnV132");
        if (!panel) return;
        const willOpen = !panel.classList.contains("open");
        panel.classList.toggle("open", willOpen);
        if (btn) btn.classList.toggle("active", willOpen);
        if (willOpen) v134LoadAndRenderStats(false);
      };

      // Sorun bildirimi offline kuyruğu
      function v134QueueRead(){ try { return JSON.parse(localStorage.getItem(SUPPORT_QUEUE_KEY_V134) || "[]"); } catch { return []; } }
      function v134QueueWrite(rows){ try { localStorage.setItem(SUPPORT_QUEUE_KEY_V134, JSON.stringify(rows || [])); } catch {} }
      async function v134CreateTicketFromQueue(item){
        const { db } = await ensureFirebaseReady();
        const nowMs = Date.now();
        const name = v134Clean(item.name), seflik = v134Clean(item.seflik);
        const userKey = item.userKey || v134Key(name, seflik);
        const id = item.id || `ticket_${userKey}_${item.createdAtMs || nowMs}`;
        await db.collection(typeof FIREBASE_REPORTS_COLLECTION !== "undefined" ? FIREBASE_REPORTS_COLLECTION : "supportTickets").doc(id).set({
          id, userKey, name, seflik,
          message: String(item.message || "").trim(),
          status: "new",
          adminReply: "",
          deviceInfo: item.deviceInfo || {},
          appVersion: (item.deviceInfo && item.deviceInfo.appVersion) || BUILD_VERSION_V134,
          recordCount: Number(item.recordCount || 0),
          createdAt: item.createdAt || (typeof firebaseDateText === "function" ? firebaseDateText() : new Date().toLocaleString("tr-TR")),
          createdAtMs: Number(item.createdAtMs || nowMs),
          updatedAt: typeof firebaseDateText === "function" ? firebaseDateText() : new Date().toLocaleString("tr-TR"),
          updatedAtMs: nowMs,
          queuedOffline: true
        }, { merge:true });
      }
      async function v134SyncSupportQueue(){
        const rows = v134QueueRead();
        if (!rows.length) return 0;
        const remain = [];
        let sent = 0;
        for (const item of rows) {
          try { await v134CreateTicketFromQueue(item); sent += 1; }
          catch { remain.push(item); }
        }
        v134QueueWrite(remain);
        if (sent) v134Toast(`${v134TrInt(sent)} bekleyen sorun bildirimi gönderildi.`);
        return sent;
      }
      const prevSendIssueReportV134 = typeof sendIssueReport === "function" ? sendIssueReport : null;
      sendIssueReport = async function(){
        const msg = els.issueReportMessage ? String(els.issueReportMessage.value || "").trim() : "";
        if (msg.length < 5) { v134Toast("Sorunu birkaç kelimeyle yazınız."); return; }
        const active = state.activeUser || (typeof findActiveUser === "function" ? findActiveUser() : null);
        if (!active || !active.name || !active.seflik) { v134Toast("Önce kullanıcı girişi yapınız."); return; }
        try {
          if (prevSendIssueReportV134) return await prevSendIssueReportV134.apply(this, arguments);
          await firebaseCreateSupportTicket(msg);
          v134Toast("Sorun bildirimi gönderildi.");
        } catch (error) {
          const nowMs = Date.now();
          const info = (typeof issueDeviceInfoPayload === "function" ? issueDeviceInfoPayload() : (typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload() : {}));
          const item = {
            id: `ticket_${v134Key(active.name, active.seflik)}_${nowMs}`,
            userKey: v134Key(active.name, active.seflik),
            name: active.name,
            seflik: active.seflik,
            message: msg,
            deviceInfo: info,
            recordCount: Number(info.recordCount || ((state.records || []).length) || 0),
            createdAt: typeof firebaseDateText === "function" ? firebaseDateText() : new Date().toLocaleString("tr-TR"),
            createdAtMs: nowMs
          };
          const rows = v134QueueRead();
          rows.push(item); v134QueueWrite(rows);
          if (els.issueReportMessage) els.issueReportMessage.value = "";
          v134Toast("İnternet zayıf. Sorun bildirimi kaydedildi, internet gelince gönderilecek.");
        }
      };
      window.syncSupportQueueV134 = v134SyncSupportQueue;
      window.addEventListener("online", () => setTimeout(v134SyncSupportQueue, 1200));
      setInterval(() => { if (navigator.onLine) v134SyncSupportQueue().catch(()=>{}); }, 180000);

      const prevLoadAdminPanelDataV134 = typeof loadAdminPanelData === "function" ? loadAdminPanelData : null;
      if (prevLoadAdminPanelDataV134) {
        loadAdminPanelData = async function(){
          await prevLoadAdminPanelDataV134.apply(this, arguments);
          await v134LoadSupportTickets();
          try { renderAdminUsers(); } catch {}
          try { if (document.getElementById("adminStatsPanelV132")?.classList.contains("open")) await v134LoadAndRenderStats(true); } catch {}
        };
      }

      const prevCurrentDeviceInfoPayloadV134 = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
      currentDeviceInfoPayload = function(){
        const info = prevCurrentDeviceInfoPayloadV134 ? prevCurrentDeviceInfoPayloadV134() : {};
        info.appVersion = BUILD_VERSION_V134;
        info.fileVersion = FILE_VERSION_V134;
        info.adminUserBadges = true;
        info.adminPeriodStats = true;
        info.supportOfflineQueue = true;
        info.updatedMs = Date.now();
        return info;
      };

      window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
        fileVersion: FILE_VERSION_V134,
        visibleVersion: BUILD_VERSION_V134,
        adminUserDeleteRestored: true,
        adminUserBadges: true,
        adminPeriodStats: true,
        supportOfflineQueue: true,
        stableBuild: true
      });
      try { document.title = "Mesaha App v138"; document.querySelector(".brand h1") && (document.querySelector(".brand h1").textContent = BUILD_VERSION_V134); } catch {}
      v134EnsureStatsUi();
      v134LoadSupportTickets().then(() => { try { renderAdminUsers(); } catch {} }).catch(()=>{});
      setTimeout(() => { try { v134EnsureStatsUi(); renderAdminUsers(); } catch {} }, 500);
      setTimeout(() => { try { v134EnsureStatsUi(); renderAdminUsers(); } catch {} }, 1500);
      if (navigator.onLine) setTimeout(() => v134SyncSupportQueue().catch(()=>{}), 2500);
    })();


    /* v135: performans/test temizliği + Mesaha dosyası indirirken özet veri gönderimi */
    (function(){
      const BUILD_VERSION_V135 = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
      const FILE_VERSION_V135 = "v135";
      const EXPORT_QUEUE_KEY_V135 = "mesaha_export_stats_queue_v135";
      const RECORD_RENDER_LIMIT_KEY_V135 = "mesaha_record_render_limit_v135";
      const DEFAULT_RECORD_LIMIT_V135 = 150;

      function v135Esc(value){
        try { return escapeHtml(value); } catch {}
        return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[ch]));
      }
      function v135Clean(value){
        try { return cleanUserText(value); } catch {}
        return String(value || "").trim();
      }
      function v135Num(value){
        const n = Number(String(value ?? "").replace(",", "."));
        return Number.isFinite(n) ? n : 0;
      }
      function v135IntText(value){ return (Number(value) || 0).toLocaleString("tr-TR"); }
      function v135M3Text(value){ return (Number(value) || 0).toLocaleString("tr-TR", { minimumFractionDigits:3, maximumFractionDigits:3 }) + " m³"; }
      function v135Today(){
        try { return todayISO(); } catch { return new Date().toISOString().slice(0,10); }
      }
      function v135WeekStartISO(){
        const d = new Date();
        const day = (d.getDay() + 6) % 7;
        d.setDate(d.getDate() - day);
        return d.toISOString().slice(0,10);
      }
      function v135User(){
        try {
          const u = (state && state.activeUser) || (typeof findActiveUser === "function" ? findActiveUser() : null) || {};
          return { name:v135Clean(u.name), seflik:v135Clean(u.seflik), deviceId:(u.deviceId || getOrCreateDeviceId()) };
        } catch { return { name:"", seflik:"", deviceId:"" }; }
      }
      function v135UserKey(user){
        try { return firebaseUserKey(user.name, user.seflik); } catch {}
        return `${user.name || ""}_${user.seflik || ""}`.toLowerCase().replace(/[^a-z0-9_-]+/g, "_") || "bos";
      }
      function v135RecordDate(r){
        try {
          const raw = String((r && (r.productionDate || r.date || r.createdAtIso)) || "").slice(0,10);
          if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
          if (r && r.uretimTarihi && typeof trDateToISO === "function") return trDateToISO(r.uretimTarihi) || "";
        } catch {}
        return "";
      }
      function v135Qty(r){ return Math.max(0, v135Num(r && (r.quantity ?? r.adet ?? r.count)) || 1); }
      function v135M3(r){
        if (!r) return 0;
        const desi = v135Num(r.desi);
        if (desi > 0) return desi / 1000;
        const hacim = v135Num(String(r.hacim ?? r.volume ?? "").replace(/[^0-9.,-]/g, ""));
        if (hacim > 0) return hacim;
        try {
          const d = v135Num(r.diameter ?? r.cap ?? 0);
          const l = v135Num(r.length ?? r.boy ?? 0);
          const q = v135Qty(r) || 1;
          if (typeof calculateDesi === "function") return (Number(calculateDesi(d, l, q)) || 0) / 1000;
        } catch {}
        return 0;
      }
      function v135TreeName(r){
        const raw = String((r && (r.treeType || r.species || r.agacAdi || r.agac)) || "").trim();
        if (!raw) return "Bilinmiyor";
        try { return (typeof getTreeInfo === "function" ? getTreeInfo(raw).agacAdi : raw) || raw; } catch { return raw; }
      }
      function v135ProductName(r){
        const raw = String((r && (r.productType || r.odunAdi || r.odun || r.product)) || "").trim();
        if (!raw) return "Bilinmiyor";
        try { if (typeof PRODUCT_MAP !== "undefined" && PRODUCT_MAP[raw]) return PRODUCT_MAP[raw].odunAdi || raw; } catch {}
        try { if (typeof productDisplayName === "function") return productDisplayName(raw) || raw; } catch {}
        return raw;
      }
      function v135AddTotal(map, name, adet, m3){
        const key = String(name || "Bilinmiyor").trim() || "Bilinmiyor";
        const row = map.get(key) || { name:key, adet:0, m3:0 };
        row.adet += Number(adet) || 0;
        row.m3 += Number(m3) || 0;
        map.set(key, row);
      }
      function v135Sorted(map){
        return Array.from(map.values()).sort((a,b) => ((b.m3 || 0) - (a.m3 || 0)) || ((b.adet || 0) - (a.adet || 0)) || String(a.name).localeCompare(String(b.name), "tr"));
      }
      function v135SummarizeRecords(records, period){
        const today = v135Today();
        const weekStart = v135WeekStartISO();
        const treeMap = new Map(), productMap = new Map();
        let recordCount = 0, adet = 0, m3 = 0;
        (Array.isArray(records) ? records : []).forEach(r => {
          const date = v135RecordDate(r);
          if (period === "today" && date && date !== today) return;
          if (period === "week" && date && date < weekStart) return;
          const q = v135Qty(r);
          const vol = v135M3(r);
          recordCount += 1; adet += q; m3 += vol;
          v135AddTotal(treeMap, v135TreeName(r), q, vol);
          v135AddTotal(productMap, v135ProductName(r), q, vol);
        });
        return { recordCount, adet, m3:Number(m3.toFixed(3)), trees:v135Sorted(treeMap), products:v135Sorted(productMap) };
      }
      function v135QueueRead(){
        try { const data = JSON.parse(localStorage.getItem(EXPORT_QUEUE_KEY_V135) || "{}"); return data && typeof data === "object" ? data : {}; } catch { return {}; }
      }
      function v135QueueWrite(data){ try { localStorage.setItem(EXPORT_QUEUE_KEY_V135, JSON.stringify(data || {})); } catch {} }
      function v135DailyLocal(){
        try {
          if (typeof usageGetDailyV128 === "function") return usageGetDailyV128(v135Today(), (typeof usageActiveUserV128 === "function" ? usageActiveUserV128() : v135User())).stat || {};
        } catch {}
        return {};
      }
      function v135BuildExportPayload(kind){
        const user = v135User();
        const userKey = v135UserKey(user);
        const deviceId = user.deviceId || (typeof getOrCreateDeviceId === "function" ? getOrCreateDeviceId() : "cihaz");
        const date = v135Today();
        const docId = (typeof usageDocIdV128 === "function") ? usageDocIdV128(date, userKey, deviceId) : `usage_${date}_${userKey}_${deviceId}`.replace(/[^a-zA-Z0-9_-]+/g,"_").slice(0,180);
        const daily = v135DailyLocal();
        const summaryAll = v135SummarizeRecords(state.records || [], "all");
        const summaryToday = v135SummarizeRecords(state.records || [], "today");
        const summaryWeek = v135SummarizeRecords(state.records || [], "week");
        const now = Date.now();
        const nowText = (typeof firebaseDateText === "function") ? firebaseDateText() : new Date().toLocaleString("tr-TR");
        return {
          id: docId,
          date,
          userKey,
          name: user.name,
          seflik: user.seflik,
          deviceId,
          type: "dailyExportSummary",
          source: "mesahaDownload",
          exportKind: kind || "xls",
          exportCount: (Number(daily.exportCount) || 0) + 1,
          exportAt: nowText,
          exportAtMs: now,
          activeMs: Math.round(v135Num(daily.activeMs)),
          activeMinutes: Math.round(v135Num(daily.activeMs) / 60000),
          inputAdet: Math.round(v135Num(daily.inputAdet) || summaryToday.adet),
          inputM3: Number((v135Num(daily.inputM3) || summaryToday.m3).toFixed(3)),
          recordEntryCount: Math.round(v135Num(daily.recordEntryCount)),
          recordCount: summaryAll.recordCount,
          totalAdet: Math.round(summaryAll.adet),
          totalM3: Number(summaryAll.m3.toFixed(3)),
          todaySummary: summaryToday,
          weekSummary: summaryWeek,
          allSummary: summaryAll,
          treeTotals: summaryAll.trees,
          productTotals: summaryAll.products,
          appVersion: BUILD_VERSION_V135,
          fileVersion: FILE_VERSION_V135,
          createdAt: daily.createdAt || nowText,
          createdAtMs: Number(daily.createdAtMs || now),
          updatedAt: nowText,
          updatedAtMs: now,
          queuedAtMs: now
        };
      }
      function v135QueueExportSummary(kind){
        try {
          if (!state.records || !state.records.length) return false;
          const payload = v135BuildExportPayload(kind);
          const q = v135QueueRead();
          q[payload.id] = payload; // aynı gün/cihaz/kullanıcı için son özet kalsın, yığılma olmasın
          v135QueueWrite(q);
          setTimeout(() => v135FlushExportQueue(true), 600);
          return true;
        } catch (err) { return false; }
      }
      async function v135FlushExportQueue(silent){
        if (!navigator.onLine) return false;
        const q = v135QueueRead();
        const ids = Object.keys(q);
        if (!ids.length) return false;
        const { db } = await ensureFirebaseReady();
        let sent = 0;
        for (const id of ids) {
          const payload = q[id];
          if (!payload || !payload.userKey) { delete q[id]; continue; }
          payload.updatedAt = (typeof firebaseDateText === "function") ? firebaseDateText() : new Date().toLocaleString("tr-TR");
          payload.updatedAtMs = Date.now();
          await db.collection(typeof FIREBASE_USAGE_COLLECTION !== "undefined" ? FIREBASE_USAGE_COLLECTION : "usageStats").doc(id).set(payload, { merge:true });
          await db.collection(typeof FIREBASE_USERS_COLLECTION !== "undefined" ? FIREBASE_USERS_COLLECTION : "users").doc(payload.userKey).set({
            userKey: payload.userKey,
            name: payload.name,
            seflik: payload.seflik,
            appVersion: BUILD_VERSION_V135,
            fileVersion: FILE_VERSION_V135,
            recordCount: payload.recordCount,
            todayUsage: {
              date: payload.date,
              activeMs: payload.activeMs,
              activeMinutes: payload.activeMinutes,
              inputAdet: payload.inputAdet,
              inputM3: payload.inputM3,
              recordEntryCount: payload.recordEntryCount,
              updatedAt: payload.updatedAt,
              updatedAtMs: payload.updatedAtMs
            },
            lastUsageAt: payload.updatedAt,
            lastUsageMs: payload.updatedAtMs,
            lastExportAt: payload.exportAt,
            lastExportAtMs: payload.exportAtMs,
            lastExportSummary: {
              recordCount: payload.recordCount,
              totalAdet: payload.totalAdet,
              totalM3: payload.totalM3,
              exportKind: payload.exportKind,
              exportAt: payload.exportAt,
              exportAtMs: payload.exportAtMs
            }
          }, { merge:true });
          delete q[id];
          sent++;
        }
        v135QueueWrite(q);
        if (sent && !silent && typeof showToast === "function") showToast(`${sent} kullanım özeti gönderildi.`);
        return !!sent;
      }
      window.v135FlushExportQueue = v135FlushExportQueue;
      window.addEventListener("online", () => setTimeout(() => v135FlushExportQueue(true).catch(() => {}), 1200));

      // v128 günlük kullanım sistemi cihazda çalışsın; Firebase'e sürekli yazmasın. Mesaha dosyası indirirken gönderilecek.
      try {
        const oldSchedule = typeof usageScheduleSyncV128 === "function" ? usageScheduleSyncV128 : null;
        usageScheduleSyncV128 = function(delay){
          if (delay === "force" || delay === true) return v135FlushExportQueue(true).catch(() => {});
          return false;
        };
        const oldSync = typeof usageSyncNowV128 === "function" ? usageSyncNowV128 : null;
        usageSyncNowV128 = async function(){ return v135FlushExportQueue(true); };
        const oldRecordEntry = typeof usageRecordEntryV128 === "function" ? usageRecordEntryV128 : null;
        if (oldRecordEntry) {
          usageRecordEntryV128 = function(record){
            try {
              const user = (typeof usageActiveUserV128 === "function") ? usageActiveUserV128() : v135User();
              const got = usageGetDailyV128(v135Today(), user);
              const qty = Math.max(0, v135Num(record && record.quantity) || 1);
              const desi = Math.max(0, v135Num(record && record.desi));
              got.stat.inputAdet = v135Num(got.stat.inputAdet) + qty;
              got.stat.inputM3 = Number((v135Num(got.stat.inputM3) + (desi / 1000)).toFixed(3));
              got.stat.recordEntryCount = v135Num(got.stat.recordEntryCount) + 1;
              got.stat.appVersion = BUILD_VERSION_V135;
              got.stat.fileVersion = FILE_VERSION_V135;
              got.stat.recordCount = Array.isArray(state.records) ? state.records.length : 0;
              got.stat.updatedAt = (typeof firebaseDateText === "function") ? firebaseDateText() : new Date().toLocaleString("tr-TR");
              got.stat.updatedAtMs = Date.now();
              usageSaveStoreV128(got.store);
            } catch { try { oldRecordEntry(record); } catch {} }
          };
        }
        const oldAddActive = typeof usageAddActiveMsV128 === "function" ? usageAddActiveMsV128 : null;
        if (oldAddActive) {
          usageAddActiveMsV128 = function(ms){
            try {
              const add = Math.max(0, Math.min(Number(ms) || 0, 60000));
              if (add < 1000) return;
              const got = usageGetDailyV128(v135Today(), (typeof usageActiveUserV128 === "function" ? usageActiveUserV128() : v135User()));
              got.stat.activeMs = v135Num(got.stat.activeMs) + add;
              got.stat.appVersion = BUILD_VERSION_V135;
              got.stat.fileVersion = FILE_VERSION_V135;
              got.stat.recordCount = Array.isArray(state.records) ? state.records.length : 0;
              got.stat.updatedAt = (typeof firebaseDateText === "function") ? firebaseDateText() : new Date().toLocaleString("tr-TR");
              got.stat.updatedAtMs = Date.now();
              usageSaveStoreV128(got.store);
            } catch { try { oldAddActive(ms); } catch {} }
          };
        }
      } catch {}

      // Mesaha Dosyasını İndir butonu: indirme hızlı kalsın, özet veri sıraya alınsın ve internet varsa arka planda gitsin.
      function v135BindExportButton(){
        const btn = document.getElementById("exportSystemXlsBtn");
        if (!btn || btn.__v135Bound) return;
        const clone = btn.cloneNode(true);
        clone.__v135Bound = true;
        btn.parentNode.replaceChild(clone, btn);
        try { if (typeof els !== "undefined") els.exportSystemXlsBtn = clone; } catch {}
        clone.addEventListener("click", function(event){
          event.preventDefault();
          event.stopPropagation();
          try {
            if (typeof exportSystemXls === "function") exportSystemXls();
            v135QueueExportSummary("xls");
          } catch (err) {
            if (typeof showToast === "function") showToast(err && err.message ? err.message : "Dosya indirilemedi.");
          }
        });
      }

      // Kayıtlar sekmesi performansı: ana ekranda gereksiz liste çizme yok; kayıtlar sekmesinde ilk 150, istenirse devamı.
      let v135RecordsLimit = Number(localStorage.getItem(RECORD_RENDER_LIMIT_KEY_V135) || DEFAULT_RECORD_LIMIT_V135) || DEFAULT_RECORD_LIMIT_V135;
      function v135ProductShort(product){
        const key = (typeof normalizeProductType === "function") ? normalizeProductType(product || "Tomruk") : String(product || "Tomruk");
        if (key === "Maden Direk") return "MDN";
        if (key === "Kağıtlık") return "KGT";
        if (key === "Sanayi Odunu") return "SNY";
        if (key === "Tel Direk") return "TEL";
        return "TMRK";
      }
      function v135TreeShort(tree){
        try { return treeShortV111(tree); } catch {}
        return String(tree || "").slice(0,2).toUpperCase();
      }
      function v135ProductClass(product){
        try { return productClassV111(product); } catch {}
        const key = String(product || "").toLowerCase();
        if (key.includes("maden")) return "maden";
        if (key.includes("kağ") || key.includes("kag")) return "kagit";
        if (key.includes("sanayi")) return "sanayi";
        if (key.includes("tel")) return "tel";
        return "tomruk";
      }
      function v135GetRecords(){
        try { return getFilteredRecordsV111(); } catch {}
        try { return state.records || []; } catch { return []; }
      }
      function v135RenderMobileRecords(force){
        const wrap = document.getElementById("mobileRecordsV111");
        if (!wrap) return;
        if (!document.body.classList.contains("show-records") && !force) return;
        const list = v135GetRecords();
        if (!state.selectedRecordIds) state.selectedRecordIds = new Set();
        if (!list.length) {
          wrap.innerHTML = `<div class="empty">Kayıt yok.</div>`;
          try { if (typeof updateBulkActions === "function") updateBulkActions(list); } catch {}
          return;
        }
        const shown = list.slice(0, Math.max(DEFAULT_RECORD_LIMIT_V135, v135RecordsLimit));
        const html = shown.map((r) => {
          const product = (typeof normalizeProductType === "function") ? normalizeProductType(r.productType || r.woodType || r.odunAdi || "Tomruk") : (r.productType || "Tomruk");
          const cls = v135ProductClass(product);
          const tree = r.treeType || r.agacAdi || "Karaçam";
          const id = String(r.id || "");
          const checked = state.selectedRecordIds.has(id);
          const barcode = r.barcode || r.barkodNo || "-";
          const length = r.length || r.boy || "-";
          const diameter = r.diameter || r.cap || "-";
          return `
            <div class="record-row-v111 ${cls} ${checked ? "selected" : ""}" data-v111-row="${v135Esc(id)}">
              <label class="record-select-v111" title="Seç">
                <input type="checkbox" data-v111-select="${v135Esc(id)}" ${checked ? "checked" : ""} />
              </label>
              <div class="record-main-v111">
                <b>${v135Esc(barcode)}</b>
                <div class="record-tags-v111">
                  <span class="mini-tag-v111 ${cls}" title="${v135Esc(product)}">${v135Esc(v135ProductShort(product))}</span>
                  <span class="mini-tag-v111 tree" title="${v135Esc(tree)}">${v135Esc(v135TreeShort(tree))}</span>
                </div>
              </div>
              <div class="record-values-v111">
                <div class="record-val-v111"><small>Ç</small><strong>${v135Esc(String(diameter))}</strong></div>
                <div class="record-val-v111"><small>B</small><strong>${v135Esc(String(length))}</strong></div>
              </div>
              <div class="record-actions-v111">
                <button type="button" class="record-edit-v111" data-v111-edit="${v135Esc(id)}">Düz</button>
                <button type="button" class="record-delete-v111" data-v111-delete="${v135Esc(id)}">Sil</button>
              </div>
            </div>`;
        }).join("");
        const more = list.length > shown.length ? `<button type="button" class="record-more-v135" id="recordMoreV135">Daha fazla göster (${v135IntText(list.length - shown.length)})</button>` : "";
        wrap.innerHTML = html + more;
        const moreBtn = document.getElementById("recordMoreV135");
        if (moreBtn) moreBtn.addEventListener("click", () => {
          v135RecordsLimit += 150;
          try { localStorage.setItem(RECORD_RENDER_LIMIT_KEY_V135, String(v135RecordsLimit)); } catch {}
          v135RenderMobileRecords(true);
        });
        try { if (typeof updateBulkActions === "function") updateBulkActions(list); } catch {}
      }
      try { renderMobileRecordsV111 = v135RenderMobileRecords; } catch {}

      // Admin istatistik: önce Mesaha dosyası indirme özetleri, yoksa Firebase yedekleri.
      async function v135LoadExportSummaryStats(period){
        const { db } = await ensureFirebaseReady();
        const coll = typeof FIREBASE_USAGE_COLLECTION !== "undefined" ? FIREBASE_USAGE_COLLECTION : "usageStats";
        let snap;
        try { snap = await db.collection(coll).where("type", "==", "dailyExportSummary").get(); }
        catch { snap = await db.collection(coll).get(); }
        const latestByUser = new Map();
        snap.forEach(doc => {
          try {
            const d = doc.data() || {};
            if (d.type && d.type !== "dailyExportSummary") return;
            if (!d.allSummary && !d.treeTotals && !d.productTotals) return;
            const key = d.userKey || v135UserKey({ name:d.name, seflik:d.seflik });
            const ms = Number(d.exportAtMs || d.updatedAtMs || 0);
            const old = latestByUser.get(key);
            if (!old || ms >= old.ms) latestByUser.set(key, { ms, data:d });
          } catch {}
        });
        const treeMap = new Map(), productMap = new Map();
        let users = 0, recordCount = 0, adet = 0, m3 = 0;
        latestByUser.forEach(item => {
          users += 1;
          const d = item.data || {};
          const summary = period === "today" ? d.todaySummary : (period === "week" ? d.weekSummary : d.allSummary);
          const trees = (summary && summary.trees) || (period === "all" ? d.treeTotals : [] ) || [];
          const products = (summary && summary.products) || (period === "all" ? d.productTotals : [] ) || [];
          recordCount += Number((summary && summary.recordCount) || (period === "all" ? d.recordCount : 0)) || 0;
          adet += Number((summary && summary.adet) || (period === "all" ? d.totalAdet : 0)) || 0;
          m3 += Number((summary && summary.m3) || (period === "all" ? d.totalM3 : 0)) || 0;
          (trees || []).forEach(r => v135AddTotal(treeMap, r.name, r.adet, r.m3));
          (products || []).forEach(r => v135AddTotal(productMap, r.name, r.adet, r.m3));
        });
        return { users, recordCount, adet, m3, trees:v135Sorted(treeMap), products:v135Sorted(productMap), period, source:"downloadSummary", loadedAt:new Date().toLocaleString("tr-TR") };
      }
      async function v135LoadBackupStatsFallback(period){
        const { db } = await ensureFirebaseReady();
        const snap = await db.collection(typeof FIREBASE_BACKUPS_COLLECTION !== "undefined" ? FIREBASE_BACKUPS_COLLECTION : "backups").get();
        const latestByUser = new Map();
        snap.forEach(doc => {
          try {
            const d = doc.data() || {};
            let payload = d.payload || null;
            if (!payload && d.payloadText) payload = JSON.parse(d.payloadText);
            if (!payload || !Array.isArray(payload.records) || !payload.records.length) return;
            const key = d.userKey || v135UserKey({ name:d.name || (payload.user && payload.user.name), seflik:d.seflik || (payload.user && payload.user.seflik) }) || doc.id;
            const ms = Number(d.createdAtMs || 0) || Date.parse(d.createdAtIso || "") || 0;
            const old = latestByUser.get(key);
            if (!old || ms >= old.ms) latestByUser.set(key, { ms, payload });
          } catch {}
        });
        const records = [];
        latestByUser.forEach(item => records.push(...(item.payload.records || [])));
        const s = v135SummarizeRecords(records, period);
        return { users:latestByUser.size, recordCount:s.recordCount, adet:s.adet, m3:s.m3, trees:s.trees, products:s.products, period, source:"backupFallback", loadedAt:new Date().toLocaleString("tr-TR") };
      }
      async function v135LoadAdminStats(period){
        const p = period === "today" || period === "week" ? period : "all";
        let stats = await v135LoadExportSummaryStats(p);
        if (!stats.recordCount && !stats.trees.length && !stats.products.length) stats = await v135LoadBackupStatsFallback(p);
        return stats;
      }
      function v135Rows(rows, type){
        if (!rows || !rows.length) return `<div class="admin-stats-empty-v132">Veri bulunamadı.</div>`;
        return rows.map(row => `<div class="admin-stat-row-v132"><div class="admin-stat-name-v132">${v135Esc(row.name)}</div><div class="admin-stat-val-v132">${v135IntText(row.adet)} adet</div><div class="admin-stat-val-v132">${v135M3Text(row.m3)}</div></div>`).join("");
      }
      function v135StatsPanel(){
        let panel = document.getElementById("adminStatsPanelV132");
        if (!panel) {
          const summary = document.querySelector(".admin-summary-grid-clean") || document.querySelector(".admin-panel-top-clean");
          if (summary) {
            panel = document.createElement("div");
            panel.id = "adminStatsPanelV132";
            panel.className = "admin-stats-panel-v132";
            summary.insertAdjacentElement("afterend", panel);
          }
        }
        return panel;
      }
      function v135RenderStats(stats, message){
        const panel = v135StatsPanel();
        if (!panel) return;
        if (message) { panel.innerHTML = `<div class="admin-stats-empty-v132">${v135Esc(message)}</div>`; return; }
        const topTree = (stats.trees || [])[0] || { name:"-", adet:0, m3:0 };
        const topProduct = (stats.products || [])[0] || { name:"-", adet:0, m3:0 };
        const period = stats.period || window.adminStatsPeriodV134 || "all";
        const label = period === "today" ? "Bugün" : (period === "week" ? "Bu Hafta" : "Tüm Zamanlar");
        const sourceText = stats.source === "downloadSummary" ? "Mesaha dosyası indirme özetleri" : "Firebase yedekleri";
        panel.innerHTML = `
          <div class="admin-stats-head-v132">
            <div>
              <b>Toplu İstatistik</b>
              <span>Dönem: ${v135Esc(label)} • Kaynak: ${v135Esc(sourceText)} • Son yenileme: ${v135Esc(stats.loadedAt || "-")}</span>
              <div class="admin-stats-period-v134">
                <button type="button" class="${period === "today" ? "active" : ""}" onclick="adminSetStatsPeriodV134('today')">Bugün</button>
                <button type="button" class="${period === "week" ? "active" : ""}" onclick="adminSetStatsPeriodV134('week')">Bu Hafta</button>
                <button type="button" class="${period === "all" ? "active" : ""}" onclick="adminSetStatsPeriodV134('all')">Tüm Zamanlar</button>
              </div>
              <div class="admin-stats-note-v134">Yeni sistemde kullanıcı Mesaha Dosyasını İndir dediğinde özet veri gönderilir; internet yoksa bağlantı gelince otomatik aktarılır.</div>
            </div>
            <button type="button" class="secondary" onclick="adminRefreshStatsV132()">Yenile</button>
          </div>
          <div class="admin-stats-cards-v132">
            <div class="admin-stat-top-card-v132"><span>En fazla ağaç türü</span><b>${v135Esc(topTree.name)}</b><small>${v135IntText(topTree.adet)} adet • ${v135M3Text(topTree.m3)}</small></div>
            <div class="admin-stat-top-card-v132"><span>En fazla odun türü</span><b>${v135Esc(topProduct.name)}</b><small>${v135IntText(topProduct.adet)} adet • ${v135M3Text(topProduct.m3)}</small></div>
            <div class="admin-stat-top-card-v132"><span>Kapsam</span><b>${v135IntText(stats.users)} kullanıcı</b><small>${v135IntText(stats.recordCount)} kayıt</small></div>
            <div class="admin-stat-top-card-v132"><span>Toplam</span><b>${v135IntText(stats.adet)} adet</b><small>${v135M3Text(stats.m3)}</small></div>
          </div>
          <div class="admin-stats-columns-v132">
            <div class="admin-stats-section-v132"><h4>Ağaç türleri</h4>${v135Rows(stats.trees, "tree")}</div>
            <div class="admin-stats-section-v132"><h4>Odun türleri</h4>${v135Rows(stats.products, "product")}</div>
          </div>`;
      }
      async function v135LoadAndRenderStats(force){
        window.adminStatsPeriodV134 = window.adminStatsPeriodV134 || "all";
        const panel = v135StatsPanel();
        const btn = document.getElementById("adminStatsBtnV132");
        if (panel) panel.classList.add("open");
        if (btn) btn.classList.add("active");
        const period = window.adminStatsPeriodV134;
        const cacheKey = `adminStatsV135_${period}`;
        if (!force && state[cacheKey]) return v135RenderStats(state[cacheKey]);
        try { if (typeof setCloudLoading === "function") setCloudLoading(true, "İstatistikler hazırlanıyor..."); } catch {}
        v135RenderStats(null, "İstatistikler hazırlanıyor...");
        try { state[cacheKey] = await v135LoadAdminStats(period); v135RenderStats(state[cacheKey]); }
        catch (err) { v135RenderStats(null, "İstatistikler alınamadı. İnternet, Firebase bağlantısı veya Firestore Rules alanını kontrol et."); }
        finally { try { if (typeof setCloudLoading === "function") setCloudLoading(false); } catch {} }
      }
      window.adminSetStatsPeriodV134 = function(period){ window.adminStatsPeriodV134 = (period === "today" || period === "week") ? period : "all"; v135LoadAndRenderStats(true); };
      window.adminRefreshStatsV132 = function(){ return v135LoadAndRenderStats(true); };
      window.adminToggleStatsV132 = function(){
        const panel = v135StatsPanel();
        const btn = document.getElementById("adminStatsBtnV132");
        if (!panel) return;
        const willOpen = !panel.classList.contains("open");
        panel.classList.toggle("open", willOpen);
        if (btn) btn.classList.toggle("active", willOpen);
        if (willOpen) v135LoadAndRenderStats(false);
      };

      // Hafif CSS ekleri
      try {
        const style = document.createElement("style");
        style.id = "mesaha-v135-performance-css";
        style.textContent = `
          .record-more-v135{width:100%;border:0;border-radius:16px;padding:12px 14px;margin:8px 0 4px;font-weight:900;background:#e5eef8;color:#0f172a;}
          body.theme-dark .record-more-v135{background:#232a35;color:#f8fafc;border:1px solid rgba(255,255,255,.08);}
          .admin-stats-note-v134{line-height:1.35;}
        `;
        document.head.appendChild(style);
      } catch {}

      const prevDeviceInfoV135 = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
      currentDeviceInfoPayload = function(){
        const info = prevDeviceInfoV135 ? prevDeviceInfoV135() : {};
        info.appVersion = BUILD_VERSION_V135;
        info.fileVersion = FILE_VERSION_V135;
        info.performanceBuild = true;
        info.exportSummaryOnDownload = true;
        info.updatedMs = Date.now();
        return info;
      };

      window.MESAHA_BUILD_INFO = {
        fileVersion: FILE_VERSION_V135,
        visibleVersion: BUILD_VERSION_V135,
        stableBuild: true,
        performanceBuild: true,
        exportSummaryOnDownload: true,
        usageSyncMode: "onMesahaDownload"
      };
      try { document.title = "Mesaha App v138"; } catch {}
      try { const h1 = document.querySelector(".brand h1"); if (h1) h1.textContent = BUILD_VERSION_V135; } catch {}
      setTimeout(v135BindExportButton, 80);
      setTimeout(v135BindExportButton, 800);
      setTimeout(() => v135FlushExportQueue(true).catch(() => {}), 1800);
    })();


/* Mesaha v140 - admin son aktif sıralama + süre ölçüm düzeltmesi */
(function(){
  const BUILD_VERSION=(window.MESAHA_VERSION_TEXT || 'Mesaha İO'), FILE_VERSION="v140";
  const MAX_VISIBLE_TICK_MS=60*1000;
  function num(v){ const n=Number(v); return Number.isFinite(n)?n:0; }
  function clean(v){ return String(v||"").trim(); }
  function parseTrDateMs(v){
    if(!v) return 0;
    if(typeof v === "number") return Number.isFinite(v)?v:0;
    const s=String(v||"").trim();
    if(!s || s==="-" || s.toLowerCase()==="bilinmiyor") return 0;
    let m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if(m){
      const d=new Date(Number(m[3]), Number(m[2])-1, Number(m[1]), Number(m[4]||0), Number(m[5]||0), Number(m[6]||0));
      const ms=d.getTime(); return Number.isFinite(ms)?ms:0;
    }
    const t=Date.parse(s);
    return Number.isFinite(t)?t:0;
  }
  function userRecentMs(u){
    if(!u) return 0;
    const tu=(u.todayUsage&&typeof u.todayUsage==="object")?u.todayUsage:{};
    return Math.max(
      num(u.lastUsageMs), num(u.lastActiveMs), num(u.updatedAtMs), num(u.lastSeenMs),
      num(u.lastLoginMs), num(u.lastLoginAtMs), num(u.loginAtMs),
      num(tu.updatedAtMs), num(tu.exportAtMs), num(tu.createdAtMs),
      parseTrDateMs(u.lastUsageAt), parseTrDateMs(u.lastActiveAt), parseTrDateMs(u.lastLogin), parseTrDateMs(u.updatedAt), parseTrDateMs(tu.updatedAt)
    );
  }
  function userSortName(u){ return clean((u&&u.name)||"").toLocaleLowerCase("tr-TR") + " " + clean((u&&u.seflik)||"").toLocaleLowerCase("tr-TR"); }

  // Kullanıcı listesi: en son giriş/son aktif en üstte.
  const oldAdminFiltered = typeof adminFilteredUsers === "function" ? adminFilteredUsers : null;
  try{
    adminFilteredUsers=function(){
      let list=[];
      try{ list = oldAdminFiltered ? oldAdminFiltered() : ((state&&Array.isArray(state.adminOnlineUsers))?state.adminOnlineUsers.slice():[]); }catch{ list=((state&&Array.isArray(state.adminOnlineUsers))?state.adminOnlineUsers.slice():[]); }
      return (Array.isArray(list)?list:[]).sort((a,b)=>{
        const diff=userRecentMs(b)-userRecentMs(a);
        if(diff) return diff;
        return userSortName(a).localeCompare(userSortName(b),"tr");
      });
    };
  }catch{}

  // Süre ölçümü: sayfa görünürken süre biriksin. Firebase'e gönderim yine Mesaha dosyası indirirken / kuyrukla yapılır.
  function forceUsageTickV140(){
    try{
      if(typeof usageLastTickMsV128 === "undefined" || typeof usageAddActiveMsV128 !== "function") return false;
      const now=Date.now();
      const elapsed=now-Number(usageLastTickMsV128||now);
      usageLastTickMsV128=now;
      if(document.visibilityState === "hidden") return false;
      if(elapsed>900 && elapsed<30*60*1000){
        usageAddActiveMsV128(Math.min(elapsed, MAX_VISIBLE_TICK_MS));
        return true;
      }
    }catch{}
    return false;
  }
  window.forceUsageTickV140=forceUsageTickV140;

  try{
    usageTickV128=function(){
      try{
        const now=Date.now();
        const elapsed=now-Number(usageLastTickMsV128||now);
        usageLastTickMsV128=now;
        if(document.visibilityState === "hidden") return;
        if(elapsed>900) usageAddActiveMsV128(Math.min(elapsed, MAX_VISIBLE_TICK_MS));
      }catch{}
    };
  }catch{}

  // Export özetinden hemen önce o ana kadar geçen görünür süreyi de local sayaçlara işle.
  document.addEventListener("pointerdown", function(ev){
    try{ if(ev.target && ev.target.closest && ev.target.closest("#exportSystemXlsBtn")) forceUsageTickV140(); }catch{}
  }, {capture:true, passive:true});
  document.addEventListener("click", function(ev){
    try{ if(ev.target && ev.target.closest && ev.target.closest("#exportSystemXlsBtn")) forceUsageTickV140(); }catch{}
  }, {capture:true, passive:true});
  document.addEventListener("visibilitychange", function(){ try{ forceUsageTickV140(); }catch{} }, {capture:true});

  // Cihaz/Firebase payload sürümünü güncelle.
  const oldDevice = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
  try{
    currentDeviceInfoPayload=function(){
      const info=oldDevice?oldDevice():{};
      info.appVersion=BUILD_VERSION;
      info.fileVersion=FILE_VERSION;
      info.activeTimeMode="visibleTimeLocal_exportSync";
      info.adminSortMode="lastLoginOrActiveDesc";
      info.updatedMs=Date.now();
      return info;
    };
  }catch{}

  window.MESAHA_BUILD_INFO=Object.assign({}, window.MESAHA_BUILD_INFO||{}, {
    fileVersion:FILE_VERSION,
    visibleVersion:BUILD_VERSION,
    activeTimeMode:"visibleTimeLocal_exportSync",
    adminSortMode:"lastLoginOrActiveDesc"
  });
  try{ document.title="Mesaha İO v2.14"; const h1=document.querySelector(".brand h1"); if(h1) h1.textContent=BUILD_VERSION; }catch{}
  setTimeout(()=>{ try{ if(typeof renderAdminUsers==="function") renderAdminUsers(); }catch{} }, 500);
})();



;
