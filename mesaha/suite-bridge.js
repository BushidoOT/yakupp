(function () {
  "use strict";

  const K = {
    session: "mesaha_supabase_v500_session",
    backupSession: "mesaha_supabase_v569_session_backup",
    access: "mesaha_google_access_v548",
    terminal: "mesaha_terminal_local_mode_v556",
    terminalOld: "mesaha_terminal_local_mode_v557",
    panel: "mesaha_panel_user_v316",
    settings: "cam_mesaha_ayarlar_v1",
    records: "cam_mesaha_kayitlari_v1",
    active: "mesaha_active_seflik_folder_v564",
    folders: "mesaha_suite_folder_cache_v4",
    divisions: "mesaha_suite_divisions_v4",
    divisionRecords: "mesaha_suite_division_records_v4",
    ready: "mesaha_suite_division_ready_v4",
  };

  const $ = (id) => document.getElementById(id);
  const clean = (v) =>
    String(v == null ? "" : v)
      .trim()
      .replace(/\s+/g, " ");
  const fold = (v) =>
    clean(v)
      .toLocaleLowerCase("tr-TR")
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const esc = (v) =>
    clean(v).replace(
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
  const read = (k, f) => {
    try {
      const x = JSON.parse(localStorage.getItem(k) || "null");
      return x == null ? f : x;
    } catch {
      return f;
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  };
  const num = (v) => {
    const n = Number(String(v == null ? "" : v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };
  const fmt = (v) =>
    num(v).toLocaleString("tr-TR", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });

  function valid() {
    const s = read(K.session, {}) || read(K.backupSession, {}),
      a = read(K.access, {}),
      t = read(K.terminal, null) || read(K.terminalOld, {});
    return !!(s.access_token || a.status === "approved" || (t && t.active));
  }
  function activeFolder() {
    const a = read(K.active, {}),
      fs = read(K.folders, []),
      list = Array.isArray(fs) ? fs.filter((f) => f && !f.deleted) : [];
    return (
      list.find(
        (f) =>
          clean(f.seflik_key || f.seflikKey) ===
          clean(a.seflik_key || a.seflikKey),
      ) ||
      list.find((f) => clean(f.seflik) === clean(a.seflik)) ||
      (clean(a.seflik) ? a : list[0] || null)
    );
  }
  function folderKey(f) {
    return clean(f && (f.seflik_key || f.seflikKey)) || fold(f && f.seflik);
  }
  function divisions(f) {
    if (!f) return [];
    const all = read(K.divisions, {}),
      key = folderKey(f),
      list = Array.isArray(all[key]) ? all[key] : [];
    return list
      .filter((d) => d && !d.deleted)
      .sort((a, b) =>
        String(a.bolme_no || a.bolmeNo || "").localeCompare(
          String(b.bolme_no || b.bolmeNo || ""),
          "tr",
          { numeric: true },
        ),
      );
  }
  function cachedRows(f, bolme) {
    const all = read(K.divisionRecords, {}),
      key = folderKey(f),
      rows = all && all[key] && all[key][clean(bolme)];
    return Array.isArray(rows) ? rows : [];
  }
  function recordData(row, f, bolme, index) {
    const r =
      row && row.record_data && typeof row.record_data === "object"
        ? { ...row.record_data }
        : { ...(row || {}) };
    r.id =
      clean(r.id || (row && row.record_key) || (row && row.id)) ||
      `suite_${fold(f.seflik)}_${fold(bolme)}_${index}`;
    r.barcode = clean(r.barcode || (row && row.barcode) || r.id);
    r.bolmeNo = clean(r.bolmeNo || r.bolme_no || bolme);
    r.seflik = clean(r.seflik || f.seflik);
    r.sharedFolderSource = true;
    r.sharedUploadedByName = clean(
      r.sharedUploadedByName || (row && row.uploaded_by_name),
    );
    return r;
  }
  function rowVolume(row) {
    const r = (row && row.record_data) || row || {};
    const direct = num((row && row.volume) || r.volume || r.volumeM3 || r.m3);
    if (direct) return direct;
    const d = num(r.diameter || r.cap),
      l = num(r.length || r.boy),
      q = Math.max(1, num(r.quantity || r.adet || 1));
    return d && l ? ((Math.PI * Math.pow(d / 100, 2)) / 4) * l * q : 0;
  }
  function mesahaRecordKey(row, index) {
    const r = row && row.record_data && typeof row.record_data === "object" ? row.record_data : (row || {});
    const barcode = clean(r.barcode || r.barkodNo || r.barkod_no || (row && row.barcode));
    if (barcode) return "barcode::" + barcode.toLocaleUpperCase("tr-TR");
    const id = clean(r.id || r.recordId || (row && (row.record_key || row.id)));
    return id ? "id::" + id : "row::" + String(index == null ? Math.random() : index);
  }
  function mergeMesahaRecords(baseRows, incomingRows, f, bolme) {
    const map = new Map();
    const put = (raw, index, sourceOrder) => {
      const normalized = f ? recordData(raw, f, bolme, index) : { ...(raw && raw.record_data ? raw.record_data : (raw || {})) };
      const key = mesahaRecordKey(normalized, `${sourceOrder}_${index}`);
      map.set(key, normalized);
    };
    (Array.isArray(baseRows) ? baseRows : []).forEach((row, i) => put(row, i, "base"));
    (Array.isArray(incomingRows) ? incomingRows : []).forEach((row, i) => put(row, i, "incoming"));
    return Array.from(map.values());
  }
  function setActive(f) {
    if (!f) return;
    const sf = clean(f.seflik),
      key = folderKey(f);
    write(K.active, {
      seflik: sf,
      seflik_key: key,
      role: f.role || "",
      creator: !!(f.is_creator || f.creator),
      updatedAt: new Date().toISOString(),
    });
    const p = read(K.panel, {}),
      s = read(K.settings, {});
    p.seflik = sf;
    p.activeSeflik = sf;
    s.seflik = sf;
    write(K.panel, p);
    write(K.settings, s);
  }
  function setBolme(no) {
    const p = read(K.panel, {}),
      s = read(K.settings, {}),
      value = clean(no);
    p.bolmeNo = value;
    s.bolmeNo = value;
    write(K.panel, p);
    write(K.settings, s);
    const input = $("bolmeNo");
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  function injectCss() {
    if ($("suiteMesahaBridgeCssV10")) return;
    const s = document.createElement("style");
    s.id = "suiteMesahaBridgeCssV10";
    s.textContent = `
      #startup{display:none!important}
      .suite-central-hidden-v10{display:none!important}
      .suite-managed-select-v8{width:100%;min-height:48px;border:1px solid #bdd6c8;border-radius:14px;padding:0 12px;background:#fff;color:#173d2b;font:800 14px system-ui}
      .suite-managed-note-v8{margin:8px 0 12px;padding:11px 13px;border-radius:13px;background:#edf7f0;color:#28543d;font:700 12px/1.45 system-ui}
      .suite-folder-refresh-v8{display:inline-flex;align-items:center;gap:6px;color:#17683f;font-weight:850}
      .suite-folder-loading-v8{opacity:.72}
      .suite-folder-load-v10{background:#17683f!important;color:#fff!important;border-color:#17683f!important}
            .suite-central-hidden-v10{display:none!important}
      #seflikMemberListV566,#seflikUserSearchV564,#seflikSearchResultsV564,[data-add-user-v564],[data-remove-member-v566],.seflik-v566-member-title,.seflik-v566-member-list{display:none!important}
      #suiteMesahaSendOverlayV19[hidden]{display:none!important}
      #suiteMesahaSendOverlayV19{position:fixed;inset:0;z-index:2147483600;background:rgba(7,29,20,.58);backdrop-filter:blur(7px);display:grid;place-items:center;padding:18px}
      .suite-send-card-v19{width:min(430px,100%);background:#fff;border-radius:24px;padding:24px 20px;text-align:center;box-shadow:0 30px 90px #0006;color:#174a32}
      .suite-send-spinner-v19{width:48px;height:48px;border:5px solid #dcece3;border-top-color:#17683f;border-radius:50%;margin:0 auto 16px;animation:suiteSpinV19 .8s linear infinite}
      .suite-send-card-v19 h3{margin:0 0 8px;font-size:22px}.suite-send-card-v19 p{margin:0;color:#61766a;font-weight:700;line-height:1.45}.suite-send-card-v19 small{display:block;margin-top:12px;color:#839188}
      @keyframes suiteSpinV19{to{transform:rotate(360deg)}}
      #mesahaDriveBackupOverlayV10[hidden]{display:none!important}
      #mesahaDriveBackupOverlayV10{position:fixed;inset:0;z-index:2147483000;background:rgba(9,32,22,.48);backdrop-filter:blur(5px);display:grid;place-items:center;padding:14px}
      .mesaha-drive-modal-v10{width:min(620px,100%);max-height:min(86vh,820px);overflow:auto;background:#fff;border-radius:22px;padding:18px;box-shadow:0 30px 80px #0005}
      .mesaha-drive-head-v10{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.mesaha-drive-head-v10 h3{margin:2px 0 0;color:#174a32;font-size:24px}.mesaha-drive-head-v10 small{color:#5f796a;font-weight:800;letter-spacing:.08em}.mesaha-drive-close-v10{width:40px;height:40px;border:0;border-radius:13px;background:#eef4f0;font-size:25px;color:#315444}
      .mesaha-drive-tools-v10{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}.mesaha-drive-tools-v10 button,.mesaha-drive-row-v10 button{min-height:40px;border:1px solid #d5e4db;border-radius:12px;padding:8px 12px;background:#f7fbf8;color:#174a32;font-weight:800}.mesaha-drive-tools-v10 .primary,.mesaha-drive-row-v10 .primary{background:#174a32;color:#fff;border-color:#174a32}
      .mesaha-drive-list-v10{display:grid;gap:9px}.mesaha-drive-row-v10{border:1px solid #dce8e1;border-radius:15px;padding:12px;display:grid;gap:9px}.mesaha-drive-row-v10 strong,.mesaha-drive-row-v10 small,.mesaha-drive-row-v10 span{display:block}.mesaha-drive-row-v10 small,.mesaha-drive-row-v10 span{font-size:12px;color:#68776f;margin-top:2px}.mesaha-drive-row-actions-v10{display:flex;flex-wrap:wrap;gap:7px}.mesaha-drive-empty-v10{padding:18px;border:1px dashed #c9dcd0;border-radius:14px;text-align:center;color:#607469}
      @media(max-width:520px){.mesaha-drive-modal-v10{padding:15px;border-radius:19px}.mesaha-drive-row-actions-v10 button,.mesaha-drive-tools-v10 button{flex:1}.mesaha-drive-head-v10 h3{font-size:21px}}
    `;
    document.head.appendChild(s);
  }
  const hidden = [
    "#seflikFolderCreateV629",
    "#seflikFolderCreateV529",
    "[data-seflik-delete]",
    "#seflikCreateBtnV664",
    "#seflikDeleteBtnV664",
    "#seflikUserSearchBtnV664",
    "[data-add-user-v564]",
    "[data-remove-member-v566]",
    "#panelSyncV316",
    "#panelDeviceV316",
    "#panelStatsV316",
    "#panelSaveV316",
    "#panelTelegramSectionV515",
    "#terminalCodePanelV557",
    "#seflikFolderSyncV528",
    "#seflikSendOverlayV529",
    '[data-action="refresh-shared"]',
    '[data-action="connect-drive"]',
    '[data-action="disconnect-drive"]',
  ];
  function hideManagement() {
    hidden.forEach((sel) =>
      document
        .querySelectorAll(sel)
        .forEach((el) => el.classList.add("suite-central-hidden-v10")),
    );
    document.querySelectorAll("button,a").forEach((el) => {
      const t = clean(el.textContent).toLocaleLowerCase("tr-TR");
      if (
        /şeflik oluştur|şefliği sil|şeflik sil|ormancı ekle|ormancı çıkar|bölme oluştur|bölme sil|güncelleme kontrol/.test(
          t,
        )
      )
        el.classList.add("suite-central-hidden-v10");
    });
  }
  function select(id, rows, current, onChange, empty) {
    let el = $(id);
    if (!el) {
      el = document.createElement("select");
      el.id = id;
      el.className = "suite-managed-select-v8";
    }
    el.innerHTML = (
      rows.length ? rows : [{ value: "", label: empty || "Seçenek yok" }]
    )
      .map((x) => {
        const v = typeof x === "string" ? x : x.value,
          l = typeof x === "string" ? x : x.label;
        return `<option value="${esc(v)}" ${clean(v) === clean(current) ? "selected" : ""}>${esc(l)}</option>`;
      })
      .join("");
    el.disabled = !rows.length;
    el.onchange = onChange;
    return el;
  }
  function renderSelectors() {
    const f = activeFolder();
    if (f) setActive(f);
    const si = $("seflik"),
      bi = $("bolmeNo"),
      fs = (
        Array.isArray(read(K.folders, [])) ? read(K.folders, []) : []
      ).filter((x) => x && !x.deleted);
    if (si && si.parentNode) {
      si.readOnly = true;
      si.style.display = "none";
      const currentIndex = Math.max(
        0,
        fs.findIndex((x) => folderKey(x) === folderKey(f)),
      );
      const sel = select(
        "suiteSeflikSelectV8",
        fs.map((x, i) => ({
          value: i,
          label: `${clean(x.seflik)}${x.is_creator || x.creator ? " • kurucu" : " • üye"}`,
        })),
        currentIndex,
        function () {
          setActive(fs[Number(this.value)]);
          renderAllBridge();
          refreshFolder(false);
        },
        "Suite’ten şeflik oluşturun",
      );
      if (!sel.parentNode) si.parentNode.appendChild(sel);
    }
    if (bi && bi.parentNode) {
      bi.readOnly = true;
      bi.style.display = "none";
      const all = divisions(f),
        ready = read(K.ready, {}),
        key = folderKey(f);
      const list = all
        .filter((d) => {
          const no = clean(d.bolme_no || d.bolmeNo);
          return (
            no && (d.offline_ready || d.local_pending || ready[`${key}::${no}`])
          );
        })
        .map((d) => clean(d.bolme_no || d.bolmeNo));
      const cur = clean(
        read(K.settings, {}).bolmeNo || read(K.panel, {}).bolmeNo,
      );
      const sel = select(
        "suiteBolmeSelectV8",
        list,
        cur,
        function () {
          setBolme(this.value);
        },
        "Suite’ten offline bölme oluşturun",
      );
      if (!sel.parentNode) bi.parentNode.appendChild(sel);
      if (list.length && !list.includes(cur)) setBolme(list[0]);
    }
  }
  const CREATE_DIVISION_VALUE = "__suite_create_division__";
  async function createDivisionFromMesahaFolder(selectEl) {
    const api = window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8;
    if (!api || typeof api.createOfflineDivision !== "function") {
      notify("Suite bölme sistemi hazır değil.", true);
      return;
    }
    const no = clean(prompt("Yeni bölme numarasını yazın:"));
    if (!no) return;
    const locationText = clean(prompt("Mevki / açıklama (isteğe bağlı):") || "");
    try {
      const out = api.createOfflineDivision(no, locationText, { source: "mesaha-folder" });
      renderAllBridge();
      const sel = selectEl || $("seflikFolderBolmeV528");
      if (sel) { sel.value = clean(out.division?.bolme_no || no); sel.dispatchEvent(new Event("change", { bubbles: false })); }
      notify(out.created ? `Bölme ${no} offline oluşturuldu.` : `Bölme ${no} zaten vardı; aynı bölme seçildi.`);
    } catch (e) { notify(clean(e && e.message || e), true); }
  }
  function folderSelectRows() {
    const f = activeFolder();
    return divisions(f).map((d) => clean(d.bolme_no || d.bolmeNo)).filter(Boolean);
  }
  function renderFolderSendSelector() {
    const f = activeFolder(), sel = $("seflikFolderBolmeV528"), identity = $("seflikFolderIdentityV528"), preview = $("seflikFolderLocalPreviewV528"), status = $("seflikFolderStatusV528");
    if (identity) identity.textContent = f ? f.seflik : "Şeflik seçilmedi";
    if (!sel) return;
    const rows = folderSelectRows();
    const stored = clean(read(K.settings, {}).bolmeNo || read(K.panel, {}).bolmeNo);
    const current = clean(sel.value && sel.value !== CREATE_DIVISION_VALUE ? sel.value : stored);
    const signature = JSON.stringify(rows);
    const isInteracting = document.activeElement === sel || sel.matches(":focus");
    if (sel.dataset.suiteRowsV11 !== signature && !isInteracting) {
      const target = rows.includes(current) ? current : (rows[0] || "");
      sel.innerHTML = '<option value="">Bölme seçin</option>' + rows.map((no) => `<option value="${esc(no)}">${esc(no)}</option>`).join("") + `<option value="${CREATE_DIVISION_VALUE}">＋ Yeni bölme oluştur</option>`;
      sel.dataset.suiteRowsV11 = signature;
      sel.value = target;
    }
    sel.disabled = false;
    if (!sel.__suiteV11Bound) {
      sel.__suiteV11Bound = true;
      sel.addEventListener("change", () => {
        const rowsNow = folderSelectRows();
        if (sel.value === CREATE_DIVISION_VALUE) {
          const fallback = rowsNow.includes(stored) ? stored : (rowsNow[0] || "");
          sel.value = fallback;
          createDivisionFromMesahaFolder(sel);
          return;
        }
        const no = clean(sel.value);
        if (no) setBolme(no);
        updateFolderSelectionText(no, preview, status);
      });
    }
    if (!sel.value || sel.value === CREATE_DIVISION_VALUE) sel.value = rows.includes(current) ? current : (rows[0] || "");
    updateFolderSelectionText(clean(sel.value), preview, status);
  }
  function updateFolderSelectionText(no, preview, status) {
    const count = no ? cachedRows(activeFolder(), no).length : 0;
    if (preview) preview.textContent = no ? `Bölme ${no} seçildi • cihazda ${count} ortak kayıt` : "Önce açık bir bölme seçin";
    if (status) status.textContent = no ? `Bölme ${no} için Mesaha kayıtları gönderilmeye hazır.` : "Önce bir bölme seçin.";
  }
  function hideOrmanciSections() {
    ["seflikMemberListV566","seflikUserSearchV564","seflikSearchResultsV564"].forEach((id) => { const el=$(id); if(el) el.style.display="none"; });
    document.querySelectorAll('[data-add-user-v564],[data-remove-member-v566],.seflik-v566-member-title,.seflik-v566-member-list').forEach((el)=>el.style.display="none");
  }
  function forceFolderView() {
    try { if (typeof window.showView === "function") window.showView("seflikFolder"); } catch {}
    ["home","entry","records","seflikFolder","guide","settings"].forEach((v) => { const el=$(v+"View"); if(el){ const active=v==="seflikFolder"; el.classList.toggle("active",active); if(active) el.style.display="block"; else if(v!=="entry") el.style.display="none"; } });
    document.body.classList.remove("entry-open");
    document.querySelectorAll('#bottomNav [data-nav]').forEach((b)=>b.classList.toggle("active",b.dataset.nav==="seflikFolder"));
    try { window.scrollTo(0,0); } catch {}
    renderAllBridge();
    setTimeout(()=>refreshFolder(false),30);
  }
  window.__suiteOpenFolderViewV10 = forceFolderView;
  window.__suiteOpenFolderViewV9 = forceFolderView;
  if (window.__suiteOpenFolderPendingV10 || window.__suiteOpenFolderPendingV9) { window.__suiteOpenFolderPendingV10 = false; window.__suiteOpenFolderPendingV9 = false; setTimeout(forceFolderView, 0); }
  let suiteSendingV19 = false;
  function ensureSendOverlayV19() {
    let overlay = $("suiteMesahaSendOverlayV19");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "suiteMesahaSendOverlayV19";
    overlay.hidden = true;
    overlay.innerHTML = '<section class="suite-send-card-v19" role="status" aria-live="polite"><div class="suite-send-spinner-v19"></div><h3 id="suiteSendTitleV19">Şefliğe gönderiliyor</h3><p id="suiteSendTextV19">Kayıtlar hazırlanıyor…</p><small>Bu ekran kapanana kadar yeniden basmayın.</small></section>';
    document.body.appendChild(overlay);
    return overlay;
  }
  function showSendOverlayV19(title, text) {
    const overlay = ensureSendOverlayV19();
    const titleEl = $("suiteSendTitleV19"), textEl = $("suiteSendTextV19");
    if (titleEl) titleEl.textContent = title || "Şefliğe gönderiliyor";
    if (textEl) textEl.textContent = text || "Kayıtlar hazırlanıyor…";
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function updateSendOverlayV19(title, text) { showSendOverlayV19(title, text); }
  function hideSendOverlayV19() {
    const overlay = $("suiteMesahaSendOverlayV19");
    if (overlay) overlay.hidden = true;
    document.body.style.overflow = "";
  }
  async function sendCurrentToDivision() {
    if (suiteSendingV19) return notify("Şefliğe gönderme işlemi devam ediyor.");
    const f = activeFolder(), sel = $("seflikFolderBolmeV528"), no = clean((sel && sel.value) || read(K.settings, {}).bolmeNo),
      api = window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8;
    if (!f) return notify("Önce Suite ana menüsünden şeflik seçin.", true);
    if (!no) return notify("Gönderilecek bölmeyi seçin.", true);
    const raw = read(K.records, []), localRecords = Array.isArray(raw) ? raw : [];
    if (!localRecords.length) return notify("Gönderilecek Mesaha kaydı bulunamadı.", true);
    suiteSendingV19 = true;
    showSendOverlayV19("Şefliğe gönderiliyor", "Bağlantı ve mevcut bölme kayıtları kontrol ediliyor…");
    try {
      if (navigator.onLine && api && api.ensureDriveConnected) {
        updateSendOverlayV19("Drive kontrol ediliyor", "Kişisel Drive bağlantısı doğrulanıyor…");
        try { await api.ensureDriveConnected({ redirect: true }); }
        catch (e) { if (!(e && e.code)) notify(clean(e && e.message || e), true); return; }
      }
      let existingRows = cachedRows(f, no);
      if (navigator.onLine) {
        updateSendOverlayV19("Mevcut kayıtlar alınıyor", `Bölme ${no} sunucudan kontrol ediliyor…`);
        try { existingRows = await getRows(no, true); }
        catch (_) { existingRows = cachedRows(f, no); }
      }
      const existingNormalized = (Array.isArray(existingRows) ? existingRows : []).map((r, i) => recordData(r, f, no, i));
      const merged = mergeMesahaRecords(existingNormalized, localRecords, f, no);
      const duplicateCount = Math.max(0, existingNormalized.length + localRecords.length - merged.length);
      const newCount = Math.max(0, merged.length - existingNormalized.length);
      hideSendOverlayV19();
      if (!confirm(
        `${localRecords.length} cihaz kaydı Bölme ${no} içindeki mevcut ${existingNormalized.length} kaydın devamına eklensin mi? Barkodlar birleştirilecek; ${newCount} yeni kayıt eklenecek${duplicateCount ? `, ${duplicateCount} aynı barkod tek kayıt kalacak` : ""}.`,
      )) return;
      showSendOverlayV19("Kayıtlar hazırlanıyor", `Bölme ${no} için barkodlar birleştiriliyor…`);
      api && api.createOfflineDivision && api.createOfflineDivision(no, "", { source: "mesaha" });
      const mapped = merged.map((r) => ({ ...r, seflik: f.seflik, bolmeNo: no, bolme_no: no, updatedAt: new Date().toISOString() }));
      const settings = { ...read(K.settings, {}), seflik: f.seflik, bolmeNo: no };
      window.__suiteRemoteHydrating = true;
      if (window.MesahaStorageV527 && typeof window.MesahaStorageV527.replaceAll === "function") {
        const result = await window.MesahaStorageV527.replaceAll(mapped, settings, { reason: "suite-send-merge-drive-v19" });
        if (result && result.ok === false) throw new Error(result.error || "Kayıtlar kaydedilemedi");
      } else { write(K.records, mapped); write(K.settings, settings); }
      if (window.state) { window.state.records = mapped; window.state.settings = settings; }
      setBolme(no);
      api && api.markDirty && api.markDirty("mesaha", { bolmeNo: no, drive: true, merge: true });
      if (navigator.onLine && api && api.syncAll) {
        updateSendOverlayV19("Sunucuya gönderiliyor", `${mapped.length} benzersiz kayıt senkronize ediliyor…`);
        const syncResult = await api.syncAll({ source: "manual" });
        if (!syncResult || syncResult.ok === false) {
          if (syncResult && syncResult.offline) throw new Error("İnternet yok. Kayıtlar cihazda bekliyor.");
          if (syncResult && syncResult.weakConnection) throw new Error("Bağlantı zayıf. Kayıtlar cihazda bekliyor.");
          throw new Error("Senkronizasyon tamamlanamadı. Kayıtlar cihazda bekliyor.");
        }
        updateSendOverlayV19("Gönderim tamamlanıyor", "Şeflik klasörü yenileniyor…");
        await refreshFolder(true);
        notify(`Bölme ${no} mevcut kayıtların devamına eklendi. Toplam ${mapped.length} benzersiz barkod senkronize edildi.`);
      } else {
        hideSendOverlayV19();
        notify(`İnternet yok. Bölme ${no} kayıtları cihazda birleştirildi ve senkronizasyon için bekliyor.`, true);
      }
    } catch (e) { notify(clean(e && e.message || e), true); }
    finally {
      suiteSendingV19 = false;
      hideSendOverlayV19();
      setTimeout(() => { window.__suiteRemoteHydrating = false; }, 350);
    }
  }
  let backupItemsV10=[];
  function ensureDriveModalV10(){
    let ov=$("mesahaDriveBackupOverlayV10"); if(ov) return ov;
    ov=document.createElement("div"); ov.id="mesahaDriveBackupOverlayV10"; ov.hidden=true;
    ov.innerHTML=`<section class="mesaha-drive-modal-v10" role="dialog" aria-modal="true"><div class="mesaha-drive-head-v10"><div><small>KİŞİSEL GOOGLE DRIVE</small><h3>Mesaha Yedekleri</h3></div><button class="mesaha-drive-close-v10" type="button" data-mesaha-drive-close-v10>×</button></div><div class="mesaha-drive-tools-v10"><button class="primary" type="button" data-mesaha-drive-backup-v10>Drive’a Şimdi Yedekle</button><button type="button" data-mesaha-drive-refresh-v10>Listeyi Yenile</button></div><div class="suite-managed-note-v8">Buluttan Getir yalnızca giriş yapan Google kullanıcısının kişisel Drive yedeklerini gösterir. Cihazdan yedek yüklemek için Mesaha kayıtlarındaki Yedek Yükle düğmesini kullanın.</div><div class="mesaha-drive-list-v10" id="mesahaDriveBackupListV10"><div class="mesaha-drive-empty-v10">Yedekler hazırlanıyor…</div></div></section>`;
    document.body.appendChild(ov); return ov;
  }
  function closeDriveModalV10(){const ov=$("mesahaDriveBackupOverlayV10");if(ov)ov.hidden=true;document.body.classList.remove("mesaha-drive-modal-open-v10");}
  async function loadDriveBackupsV10(){
    const host=$("mesahaDriveBackupListV10"),api=(window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8);if(!host||!api)return;
    host.innerHTML='<div class="mesaha-drive-empty-v10">Drive yedekleri yükleniyor…</div>';
    try{
      const status=api.driveStatus?await api.driveStatus():{connected:true};
      if(!status.connected){host.innerHTML='<div class="mesaha-drive-empty-v10">Kişisel Google Drive bağlı değil.<br><button class="primary" type="button" data-mesaha-drive-connect-v13>Suite’te Drive Bağla</button></div>';return;}
      const out=await api.listBackups();const all=Array.isArray(out.items)?out.items:Array.isArray(out.backups)?out.backups:[];backupItemsV10=all.filter((x)=>{const app=clean(x.app_id||x.appId||"").toLowerCase();return !app||app==="mesaha"||app==="suite";});
      if(!backupItemsV10.length){host.innerHTML='<div class="mesaha-drive-empty-v10">Bu Google Drive hesabında Mesaha yedeği bulunamadı.</div>';return;}
      host.innerHTML=backupItemsV10.map((x)=>{const id=esc(x.id||x.backup_id),date=new Date(x.created_at||x.createdAt||Date.now()).toLocaleString("tr-TR"),app=clean(x.app_id||x.appId||"mesaha");return `<article class="mesaha-drive-row-v10"><div><strong>${esc(x.file_name||x.fileName||"Mesaha yedeği")}</strong><small>${esc(date)} • ${Number(x.record_count||x.recordCount||0).toLocaleString("tr-TR")} kayıt</small><span>${esc(app)} • ${esc(x.seflik||"")}</span></div><div class="mesaha-drive-row-actions-v10"><button class="primary" type="button" data-mesaha-drive-restore-v10="${id}">Yerel Kayıtlarla Birleştir</button><button type="button" data-mesaha-drive-replace-v10="${id}">Yerine Yükle</button></div></article>`;}).join("");
    }catch(e){host.innerHTML=`<div class="mesaha-drive-empty-v10">${esc(clean(e&&e.message||e))}<br><small>Drive bağlı değilse Suite → Oturum Bilgileri bölümünden bağlayın.</small></div>`;}
  }
  function openDriveModalV10(){const ov=ensureDriveModalV10();ov.hidden=false;document.body.classList.add("mesaha-drive-modal-open-v10");loadDriveBackupsV10();}
  async function createDriveBackupV10(){const api=(window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8);try{await api.createMesahaBackup({bolmeNo:clean($("seflikFolderBolmeV528")?.value||"")});notify("Mesaha yedeği kişisel Drive hesabına kaydedildi.");await loadDriveBackupsV10();}catch(e){if(e&&(e.code==="DRIVE_NOT_CONNECTED"||e.code==="GOOGLE_REQUIRED")){api.openDriveSetup&&api.openDriveSetup();return;}notify(clean(e&&e.message||e),true);}}
  async function restoreDriveBackupV10(id,mode){const api=(window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8);if(!confirm(mode==="replace"?"Cihazdaki mevcut Mesaha kayıtları silinip bu yedek yüklensin mi?":"Yedek mevcut Mesaha kayıtlarıyla birleştirilsin mi?"))return;try{const out=await api.restoreMesahaBackup(id,mode);notify(`${out.imported} kayıt yedekten alındı.`);closeDriveModalV10();setTimeout(()=>location.reload(),450);}catch(e){notify(clean(e&&e.message||e),true);}}

  function renderFolderList() {
    const f = activeFolder(),
      list = divisions(f),
      box = $("seflikFolderListV528"),
      meta = $("seflikFolderRemoteMetaV528");
    if (!box) return;
    if (!f) {
      box.innerHTML =
        '<div class="seflik-folder-empty">Aktif şeflik bulunamadı.<br><small>Şeflik yönetimini Suite ana menüsünden yapın.</small></div>';
      if (meta) meta.textContent = "Şeflik seçilmedi";
      updateMetrics([], f);
      return;
    }
    if (!list.length) {
      box.innerHTML = `<div class="seflik-folder-empty">${navigator.onLine ? "Şeflik kayıtları kontrol ediliyor…" : "Bu şeflik için cihazda kayıtlı bölme yok."}<br><small>${navigator.onLine ? "Sunucu yenilemesi arka planda devam ediyor." : "İnternet geldiğinde Suite üzerinden senkronize edin."}</small></div>`;
      if (meta)
        meta.textContent = navigator.onLine
          ? "Sunucu kontrol ediliyor"
          : "Offline bilgiler";
      updateMetrics([], f);
      return;
    }
    box.innerHTML = list
      .map((d) => {
        const no = clean(d.bolme_no || d.bolmeNo),
          rows = cachedRows(f, no),
          count = Math.max(num(d.record_count || d.recordCount), rows.length),
          volume =
            num(d.total_volume || d.totalVolume) ||
            rows.reduce((s, r) => s + rowVolume(r), 0),
          date = clean(d.updated_at || d.updatedAt || d.last_sync || ""),
          local = !!(d.pending || d.local_pending),
          creator = clean(d.created_by_name || d.createdByName || "");
        return `<article class="seflik-division-card" data-suite-division="${esc(no)}">
        <div class="seflik-division-top"><div class="seflik-division-title"><span class="seflik-division-icon">▦</span><div><b>Bölme ${esc(no)}${local ? '<span class="seflik-local-pending-v530">Yerel</span>' : ""}</b><small>${esc(creator || f.seflik)}</small></div></div><span class="seflik-division-date">${esc(date ? new Date(date).toLocaleDateString("tr-TR") : "")}</span></div>
        <div class="seflik-division-stats"><div class="seflik-division-stat"><small>KAYIT</small><b>${count}</b></div><div class="seflik-division-stat"><small>HACİM</small><b>${fmt(volume)} m³</b></div><div class="seflik-division-stat"><small>DURUM</small><b>${rows.length || !navigator.onLine ? "Hazır" : "Bulutta"}</b></div></div>
        <div class="seflik-division-actions seflik-division-actions-v529"><button type="button" class="btn suite-folder-load-v10" data-suite-folder-load="${esc(no)}">Mesahaya Devam Et</button></div>
      </article>`;
      })
      .join("");
    if (meta)
      meta.innerHTML = `<span class="suite-folder-refresh-v8">● ${list.length} bölme • ${navigator.onLine ? "sunucuyla bağlı" : "offline önbellek"}</span>`;
    updateMetrics(list, f);
  }
  function updateMetrics(list, f) {
    let count = 0,
      volume = 0;
    (list || []).forEach((d) => {
      const rows = cachedRows(f, d.bolme_no || d.bolmeNo);
      count += Math.max(num(d.record_count || d.recordCount), rows.length);
      volume +=
        num(d.total_volume || d.totalVolume) ||
        rows.reduce((s, r) => s + rowVolume(r), 0);
    });
    if ($("seflikFolderMetricBolmeV528"))
      $("seflikFolderMetricBolmeV528").textContent = String(
        (list || []).length,
      );
    if ($("seflikFolderMetricCountV528"))
      $("seflikFolderMetricCountV528").textContent = String(count);
    if ($("seflikFolderMetricM3V528"))
      $("seflikFolderMetricM3V528").textContent = `${fmt(volume)} m³`;
  }
  async function getRows(bolme, force) {
    const f = activeFolder();
    let rows = cachedRows(f, bolme);
    if (
      (force || !rows.length) &&
      navigator.onLine &&
      (window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8)
    ) {
      rows = await (window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8).loadDivisionRecords(bolme, !!force);
      renderFolderList();
    }
    return Array.isArray(rows) ? rows : [];
  }
  async function loadIntoMesaha(bolme) {
    const f = activeFolder();
    if (!f) return;
    const remoteRows = await getRows(bolme, true);
    if (!remoteRows.length)
      return notify("Bu bölmede yüklenecek kayıt bulunamadı.", true);
    const localRaw = read(K.records, []),
      localRows = Array.isArray(localRaw) ? localRaw : [],
      remoteNormalized = remoteRows.map((r, i) => recordData(r, f, bolme, i)),
      records = mergeMesahaRecords(remoteNormalized, localRows, f, bolme),
      duplicateCount = Math.max(0, remoteNormalized.length + localRows.length - records.length);
    if (
      !confirm(
        `Bölme ${bolme} içindeki ${remoteNormalized.length} ortak kayıt, cihazdaki ${localRows.length} kayıtla barkoda göre birleştirilsin mi?${duplicateCount ? ` ${duplicateCount} aynı barkod tek kayıt olarak tutulacak.` : ""}`,
      )
    )
      return;
    const settings = {
      ...read(K.settings, {}),
      seflik: f.seflik,
      bolmeNo: clean(bolme),
    };
    window.__suiteRemoteHydrating = true;
    try {
      let result = { ok: true };
      if (
        window.MesahaStorageV527 &&
        typeof window.MesahaStorageV527.replaceAll === "function"
      )
        result = await window.MesahaStorageV527.replaceAll(records, settings, {
          reason: "suite-folder-merge-v17",
        });
      else {
        write(K.records, records);
        write(K.settings, settings);
      }
      if (result && result.ok === false)
        throw new Error(
          result.error || "Kayıtlar kalıcı depolamaya yazılamadı",
        );
      if (window.state) {
        window.state.records = records;
        window.state.settings = settings;
      }
      write(K.panel, {
        ...read(K.panel, {}),
        seflik: f.seflik,
        activeSeflik: f.seflik,
        bolmeNo: clean(bolme),
      });
      if (typeof window.renderAll === "function") window.renderAll();
      if (typeof window.showView === "function") window.showView("records");
      notify(`Bölme ${bolme} kayıtları barkoda göre birleştirildi. Toplam ${records.length} kayıt hazır.`);
    } catch (e) {
      notify(clean((e && e.message) || e), true);
    } finally {
      setTimeout(() => {
        window.__suiteRemoteHydrating = false;
      }, 400);
    }
  }
  function notify(message, bad) {
    try {
      if (window.mesahaFloatToastV315)
        return window.mesahaFloatToastV315(
          bad ? "İşlem tamamlanamadı" : "Tamamlandı",
          message,
          bad ? "error" : "success",
        );
    } catch {}
    try {
      if (window.toast) return window.toast(message);
    } catch {}
    if (bad) alert(message);
  }
  async function refreshFolder(force) {
    renderFolderList();
    if (!navigator.onLine || !(window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8)) return;
    const meta = $("seflikFolderRemoteMetaV528");
    if (meta) {
      meta.textContent = "Sunucudan yenileniyor…";
      meta.classList.add("suite-folder-loading-v8");
    }
    try {
      await (window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8).refreshFolderData({
        includeRecords: true,
        quiet: true,
        force: !!force,
        forceRecords: !!force,
      });
    } finally {
      if (meta) meta.classList.remove("suite-folder-loading-v8");
      renderFolderList();
    }
  }
  function note() {
    const host =
      document.querySelector("#seflikFolderView .seflik-folder-control") ||
      $("seflikFolderView");
    if (host && !$("suiteManagedNoteV8")) {
      const n = document.createElement("div");
      n.id = "suiteManagedNoteV8";
      n.className = "suite-managed-note-v8";
      n.textContent =
        "Şeflik, ormancı ve bölme düzenlemeleri Suite ana menüsünden yapılır. Şeflik Klasörü kayıtları burada listelenir ve seçilen bölme barkoda göre mevcut Mesaha kayıtlarıyla birleştirilebilir.";
      host.insertBefore(n, host.firstChild);
    }
  }
  function simplifyUserPanelV11() {
    const title=$("userPanelTitleV316"), sub=$("panelSyncTextV316");
    if(title) title.textContent="Temel Bilgiler";
    if(sub) sub.textContent="Suite tarafından yönetilir";
    ["panelNameV316","panelSeflikV316","panelBolmeV316"].forEach((id)=>{const el=$(id);if(el){el.readOnly=true;el.setAttribute("aria-readonly","true");}});
    ["panelDeviceV316","panelStatsV316","panelSaveV316","panelSyncV316","panelTelegramSectionV515","terminalCodePanelV557","terminalLocalPanelV556","terminalPairPanelV561","mesahaProfileV564","mesahaProfileV565","panelSessionV563"].forEach((id)=>{const el=$(id);if(el)el.style.display="none";});
  }
  function renderAllBridge() {
    hideManagement();
    simplifyUserPanelV11();
    renderSelectors();
    renderFolderSendSelector();
    hideOrmanciSections();
    const localRestore=$("restoreBtn"), cloudRestore=$("cloudRestoreBtnV316"), cloudBackup=$("cloudBackupBtnV316");
    if(localRestore) localRestore.textContent="Yedek Yükle";
    if(cloudRestore) cloudRestore.textContent="Drive’dan Getir";
    if(cloudBackup) cloudBackup.textContent="Drive’a Yedekle";
    note();
    renderFolderList();
    (window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8) && (window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8).updateButton();
  }
  let timer = 0;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(renderAllBridge, 80);
  }
  function onClick(e) {
    const nav =
      e.target.closest &&
      e.target.closest(
        '[data-nav="seflikFolder"],#seflikFolderHomeShortcutV528',
      );
    if (nav) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      forceFolderView();
      return;
    }
    const load =
      e.target.closest && e.target.closest("[data-suite-folder-load]");
    if (load) {
      e.preventDefault();
      e.stopPropagation();
      loadIntoMesaha(load.dataset.suiteFolderLoad);
      return;
    }
    const send=e.target.closest&&e.target.closest("#seflikFolderSendV528,#seflikSendFromRecordsV529");
    if(send){e.preventDefault();e.stopImmediatePropagation();sendCurrentToDivision();return;}
    if(e.target.closest&&e.target.closest("#restoreBtn")){e.preventDefault();e.stopImmediatePropagation();closeDriveModalV10();const input=$("restoreInput");if(input){input.value="";input.click();}return;}
    if(e.target.closest&&e.target.closest("#cloudRestoreBtnV316,#panelBackupsV318")){e.preventDefault();e.stopImmediatePropagation();openDriveModalV10();return;}
    if(e.target.closest&&e.target.closest("#cloudBackupBtnV316")){e.preventDefault();e.stopImmediatePropagation();createDriveBackupV10();return;}
    if(e.target.closest&&e.target.closest("[data-mesaha-drive-close-v10]")){e.preventDefault();closeDriveModalV10();return;}
    if(e.target.closest&&e.target.closest("[data-mesaha-drive-refresh-v10]")){e.preventDefault();loadDriveBackupsV10();return;}
    if(e.target.closest&&e.target.closest("[data-mesaha-drive-connect-v13]")){e.preventDefault();const api=(window.MesahaSuiteSyncV20||window.MesahaSuiteSyncV19||window.MesahaSuiteSyncV18||window.MesahaSuiteSyncV17||window.MesahaSuiteSyncV14||window.MesahaSuiteSyncV13||window.MesahaSuiteSyncV12||window.MesahaSuiteSyncV11||window.MesahaSuiteSyncV10);api&&api.openDriveSetup&&api.openDriveSetup();return;}
    if(e.target.closest&&e.target.closest("[data-mesaha-drive-backup-v10]")){e.preventDefault();createDriveBackupV10();return;}
    const merge=e.target.closest&&e.target.closest("[data-mesaha-drive-restore-v10]");if(merge){e.preventDefault();restoreDriveBackupV10(merge.dataset.mesahaDriveRestoreV10,"merge");return;}
    const replace=e.target.closest&&e.target.closest("[data-mesaha-drive-replace-v10]");if(replace){e.preventDefault();restoreDriveBackupV10(replace.dataset.mesahaDriveReplaceV10,"replace");return;}
    const blocked = e.target.closest && e.target.closest(hidden.join(","));
    if (blocked) {
      e.preventDefault();
      e.stopImmediatePropagation();
      location.href = "../";
    }
  }

  if (!valid()) {
    location.replace("../");
    return;
  }
  window.MESAHA_SUITE_MODE = true;
  document.documentElement.dataset.suiteSubapp = "mesaha";
  document.documentElement.setAttribute("data-suite-managed", "1");
  injectCss();
  const boot = () => {
    document.body.dataset.suiteSubapp = "mesaha";
    (window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8) &&
      (window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8).registerHomeButton(() => {
        location.href = "../";
      });
    renderAllBridge();
    if (
      $("seflikFolderView") &&
      $("seflikFolderView").classList.contains("active")
    )
      refreshFolder(false);
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target && e.target.matches && e.target.matches('#seflikFolderHomeShortcutV528,[data-nav="seflikFolder"]')) {
      e.preventDefault(); forceFolderView();
    }
  }, true);
  window.addEventListener("storage", schedule);
  window.addEventListener("mesaha-suite:shared-data-updated", schedule);
  window.addEventListener("mesaha-suite:sync-complete", () => {
    schedule();
    refreshFolder(false);
  });
  window.addEventListener("online", () => {
    if (
      $("seflikFolderView") &&
      $("seflikFolderView").classList.contains("active")
    )
      refreshFolder(false);
  });
  setTimeout(schedule, 350);
  setTimeout(schedule, 1200);
})();
