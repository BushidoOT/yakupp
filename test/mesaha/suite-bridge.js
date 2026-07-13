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
    if ($("suiteMesahaBridgeCssV8")) return;
    const s = document.createElement("style");
    s.id = "suiteMesahaBridgeCssV8";
    s.textContent = `
      #startup,#seflikTransferOverlayV534{display:none!important}
      .suite-central-hidden-v8{display:none!important}
      .suite-managed-select-v8{width:100%;min-height:48px;border:1px solid #bdd6c8;border-radius:14px;padding:0 12px;background:#fff;color:#173d2b;font:800 14px system-ui}
      .suite-managed-note-v8{margin:8px 0 12px;padding:11px 13px;border-radius:13px;background:#edf7f0;color:#28543d;font:700 12px/1.45 system-ui}
      .suite-folder-refresh-v8{display:inline-flex;align-items:center;gap:6px;color:#17683f;font-weight:850}
      .suite-folder-loading-v8{opacity:.72}
      .suite-folder-load-v8{background:#17683f!important;color:#fff!important;border-color:#17683f!important}
      .suite-folder-view-v8{background:#eef7f1!important;color:#174a32!important;border-color:#cfe3d6!important}
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
    "#cloudBackupBtnV316",
    "#cloudRestoreBtnV316",
    "#panelSeflikV316",
    "#panelBolmeV316",
    "#seflikFolderSyncV528",
    "#seflikFolderSendV528",
    "#seflikSendFromRecordsV529",
    "#seflikSendOverlayV529",
    '[data-action="refresh-shared"]',
    '[data-action="connect-drive"]',
    '[data-action="disconnect-drive"]',
  ];
  function hideManagement() {
    hidden.forEach((sel) =>
      document
        .querySelectorAll(sel)
        .forEach((el) => el.classList.add("suite-central-hidden-v8")),
    );
    document.querySelectorAll("button,a").forEach((el) => {
      const t = clean(el.textContent).toLocaleLowerCase("tr-TR");
      if (
        /şeflik oluştur|şefliği sil|şeflik sil|ormancı ekle|ormancı çıkar|bölme oluştur|bölme sil|buluta yedekle|buluttan geri yükle|güncelleme kontrol/.test(
          t,
        )
      )
        el.classList.add("suite-central-hidden-v8");
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
        <div class="seflik-division-actions seflik-division-actions-v529"><button type="button" class="btn suite-folder-view-v8" data-suite-folder-view="${esc(no)}">Kayıtları Gör</button><button type="button" class="btn suite-folder-load-v8" data-suite-folder-load="${esc(no)}">Mesahaya Yükle</button></div>
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
  function showRows(bolme, rows) {
    const f = activeFolder(),
      detail = $("seflikFolderDetailV528"),
      host = $("seflikFolderRecordsV528"),
      title = $("seflikFolderDetailTitleV528");
    if (!detail || !host) return;
    if (title) title.textContent = `Bölme ${bolme} Kayıtları`;
    host.innerHTML = rows.length
      ? rows
          .map((raw, i) => {
            const r = recordData(raw, f, bolme, i),
              tree = clean(
                r.treeType ||
                  r.tree_type ||
                  r.agacTuru ||
                  "Ağaç türü belirtilmedi",
              ),
              product = clean(
                r.productType || r.product_type || r.urunCinsi || "",
              ),
              barcode = clean(r.barcode || r.id),
              cutter = clean(r.cutter || r.kesimci || "");
            return `<div class="seflik-folder-record"><div><b>${esc(barcode)}</b><small>${esc([tree, product, cutter].filter(Boolean).join(" • "))}</small></div><div class="seflik-folder-record-m3">${fmt(rowVolume(raw))} m³</div></div>`;
          })
          .join("")
      : '<div class="seflik-folder-empty">Bu bölmede senkronize kayıt bulunamadı.</div>';
    detail.classList.add("open");
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function getRows(bolme, force) {
    const f = activeFolder();
    let rows = cachedRows(f, bolme);
    if (
      (force || !rows.length) &&
      navigator.onLine &&
      window.MesahaSuiteSyncV8
    ) {
      rows = await window.MesahaSuiteSyncV8.loadDivisionRecords(bolme, !!force);
      renderFolderList();
    }
    return Array.isArray(rows) ? rows : [];
  }
  async function loadIntoMesaha(bolme) {
    const f = activeFolder();
    if (!f) return;
    const rows = await getRows(bolme, true);
    if (!rows.length)
      return notify("Bu bölmede yüklenecek kayıt bulunamadı.", true);
    if (
      !confirm(
        `Bölme ${bolme} içindeki ${rows.length} kayıt bu cihazdaki Mesaha kayıtlarının yerine yüklensin mi?`,
      )
    )
      return;
    const records = rows.map((r, i) => recordData(r, f, bolme, i)),
      settings = {
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
          reason: "suite-folder-load-v8",
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
      if (window.MesahaSuiteSyncV8)
        window.MesahaSuiteSyncV8.clearDirty("mesaha");
      if (typeof window.renderAll === "function") window.renderAll();
      if (typeof window.showView === "function") window.showView("records");
      notify(`Bölme ${bolme} kayıtları Mesaha İO’ya yüklendi.`);
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
    if (!navigator.onLine || !window.MesahaSuiteSyncV8) return;
    const meta = $("seflikFolderRemoteMetaV528");
    if (meta) {
      meta.textContent = "Sunucudan yenileniyor…";
      meta.classList.add("suite-folder-loading-v8");
    }
    try {
      await window.MesahaSuiteSyncV8.refreshFolderData({
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
        "Şeflik, ormancı ve bölme düzenlemeleri Suite ana menüsünden yapılır. Şeflik Klasörü kayıtları burada görüntülenir ve seçilen bölme Mesaha İO’ya yüklenebilir.";
      host.insertBefore(n, host.firstChild);
    }
  }
  function renderAllBridge() {
    hideManagement();
    renderSelectors();
    note();
    renderFolderList();
    window.MesahaSuiteSyncV8 && window.MesahaSuiteSyncV8.updateButton();
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
    if (nav) setTimeout(() => refreshFolder(false), 30);
    const view =
      e.target.closest && e.target.closest("[data-suite-folder-view]");
    if (view) {
      e.preventDefault();
      e.stopPropagation();
      const no = view.dataset.suiteFolderView;
      getRows(no, false)
        .then((rows) => showRows(no, rows))
        .catch((err) => notify(clean((err && err.message) || err), true));
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
    if (e.target.closest && e.target.closest("#seflikFolderDetailCloseV528")) {
      const d = $("seflikFolderDetailV528");
      if (d) d.classList.remove("open");
    }
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
    window.MesahaSuiteSyncV8 &&
      window.MesahaSuiteSyncV8.registerHomeButton(() => {
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
  const mo = new MutationObserver(schedule);
  document.addEventListener(
    "DOMContentLoaded",
    () => mo.observe(document.body, { childList: true, subtree: true }),
    { once: true },
  );
  setTimeout(schedule, 350);
  setTimeout(schedule, 1200);
})();
