"use strict";

/* Mesaha Suite V29 — İstif isteğe bağlı bulut indirme ve terminal yetki düzeltmesi */
(function () {
  const HOTFIX_VERSION = "29.0.0";
  const originalEditRecordV28 = editRecord;
  const originalBindDynamicV28 = bindDynamic;
  let dirtyReconcileTimerV29 = 0;
  let cloudPullingIdV29 = "";

  function installStylesV29() {
    if (document.getElementById("istifCloudOnDemandCssV29")) return;
    const style = document.createElement("style");
    style.id = "istifCloudOnDemandCssV29";
    style.textContent = `
      .istif-search-v29{margin:0 0 12px;padding:12px;border:1px solid rgba(18,104,63,.13);border-radius:17px;background:#fff;box-shadow:0 8px 24px rgba(19,74,49,.06)}
      .istif-search-v29 label{display:block;margin:0 0 7px;color:#35604b;font-size:12px;font-weight:800;letter-spacing:.02em}
      .istif-search-input-v29{width:100%;min-height:48px;border:1px solid #d9e8df;border-radius:13px;background:#f8fbf9;color:#173d2d;font:700 15px/1.2 system-ui;padding:0 14px;outline:none;-webkit-appearance:none;appearance:none}
      .istif-search-input-v29:focus{border-color:#2b8a57;box-shadow:0 0 0 3px rgba(43,138,87,.12);background:#fff}
      .record-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px!important}
      .record-actions .btn{width:100%;min-width:0;white-space:normal;line-height:1.15}
      .btn.cloud-pull-v29{background:#f4bd32!important;border-color:#e2a817!important;color:#3c2a00!important;font-weight:900!important;box-shadow:0 7px 16px rgba(208,151,10,.19)}
      .btn.cloud-pull-v29:active{transform:translateY(1px)}
      .btn.cloud-pull-v29[disabled]{opacity:.65;filter:saturate(.65)}
      .remote-thumb-v29{position:relative;background:linear-gradient(145deg,#fff8dd,#f6e7a8)!important}
      .remote-thumb-v29:after{content:"Bulutta";position:absolute;left:4px;right:4px;bottom:4px;padding:2px 3px;border-radius:6px;background:rgba(81,57,0,.82);color:#fff;font:800 8px/1 system-ui;text-align:center}
      .cloud-ready-badge-v29{display:inline-flex;align-items:center;gap:5px;margin:0 0 8px;padding:5px 9px;border-radius:999px;background:#edf8f1;color:#17623b;font:800 11px/1.1 system-ui}
      @media(max-width:390px){.record-actions{grid-template-columns:1fr}.istif-search-v29{padding:10px}.istif-search-input-v29{font-size:16px}}
    `;
    document.head.appendChild(style);
  }

  function searchKeyV29(value) {
    return clean(value)
      .toLocaleUpperCase("tr-TR")
      .replace(/Ç/g, "C")
      .replace(/Ğ/g, "G")
      .replace(/İ/g, "I")
      .replace(/Ö/g, "O")
      .replace(/Ş/g, "S")
      .replace(/Ü/g, "U")
      .replace(/[^A-Z0-9]/g, "");
  }

  function localPhotoCountV29(record) {
    return Array.isArray(record?.photos)
      ? record.photos.filter((photo) => photo && photo.blob).length
      : 0;
  }

  function expectedPhotoCountV29(record) {
    return Math.min(
      4,
      Math.max(
        Number(record?.photoCount || 0),
        Array.isArray(record?.driveFiles) ? record.driveFiles.filter(Boolean).length : 0,
      ),
    );
  }

  function needsCloudPullV29(record) {
    if (!record || record.isDemo) return false;
    const status = clean(record.syncStatus);
    if (status && status !== "synced") return false;
    if (record.cloudHydratedV29 === true) {
      return localPhotoCountV29(record) < expectedPhotoCountV29(record);
    }
    return (
      record.remoteOnly === true ||
      localPhotoCountV29(record) < expectedPhotoCountV29(record)
    );
  }

  async function reconcileIstifDirtyV29() {
    clearTimeout(dirtyReconcileTimerV29);
    dirtyReconcileTimerV29 = 0;
    try {
      const rows = (await idbGetAll("records")).filter((row) => row && !row.isDemo);
      const pending = rows.filter((row) => clean(row.syncStatus || "local") !== "synced");
      const api = suiteSyncApi();
      if (!api) return;
      if (!pending.length) api.clearDirty("istif");
      else api.markDirty("istif", { pending: pending.length, source: "istif-v29" });
      api.updateButton?.();
    } catch (_) {}
  }

  function scheduleDirtyReconcileV29(delay = 40) {
    clearTimeout(dirtyReconcileTimerV29);
    dirtyReconcileTimerV29 = setTimeout(reconcileIstifDirtyV29, delay);
  }

  /*
   * V28 her IndexedDB yazımını değişiklik sayıyordu. Sunucudan alınan veya
   * zaten sunucuya kaydedilmiş kayıt tekrar yazılınca yüzen Senkronize Et
   * düğmesi sürekli geri geliyordu. V29 yalnız gerçek yerel değişiklikleri
   * kirli olarak işaretler.
   */
  idbPut = async function idbPutV29(store, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(value);
      tx.oncomplete = () => {
        if (store === "records" && !(value && value.isDemo)) {
          const synced = clean(value?.syncStatus) === "synced" && !clean(value?.syncError);
          if (synced) {
            scheduleDirtyReconcileV29();
          } else {
            try {
              window.dispatchEvent(
                new CustomEvent("mesaha-istif:changed", {
                  detail: { type: "put", id: value && value.id, source: "istif-v29" },
                }),
              );
              suiteSyncApi()?.markDirty("istif", { id: value && value.id });
            } catch (_) {}
          }
        }
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  };

  /* Silme akışı sunucuyu önce temizlediği için silinen kaydı tekrar kirli yapma. */
  idbDelete = async function idbDeleteV29(store, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => {
        if (store === "records") scheduleDirtyReconcileV29();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  };

  /* Liste açılırken Drive fotoğrafını otomatik indirme. */
  loadRemoteThumbnails = async function loadRemoteThumbnailsV29() {
    return 0;
  };

  recordThumbHtml = function recordThumbHtmlV29(record) {
    const photo = Array.isArray(record?.photos)
      ? record.photos.find((item) => item && item.blob)
      : null;
    if (photo?.blob) {
      try {
        const src = blobPreviewUrl(photo.blob);
        return `<span class="record-thumb"><img src="${src}" alt="${esc(record.istifNo || "İstif fotoğrafı")}"></span>`;
      } catch (_) {}
    }
    const cloud = expectedPhotoCountV29(record) > 0;
    return `<span class="record-thumb default-thumb ${cloud ? "remote-thumb-v29" : ""}"><img src="./assets/istif-default.svg" alt="${cloud ? "Fotoğraflar bulutta" : "İstif"}"></span>`;
  };

  renderRecords = function renderRecordsV29() {
    const bolmes = [...new Set(state.records.map((row) => row.bolme).filter(Boolean))];
    const query = clean(state.recordSearchV29 || "");
    return `${head("İstifler", "İstif No veya barkoda göre arayın", { back: true, action: `<button class="icon-btn" aria-label="Filtre">${icon("filter", 22)}</button>` })}
      <section class="istif-search-v29">
        <label for="istifSearchV29">İstif No / Barkod</label>
        <input id="istifSearchV29" class="istif-search-input-v29" type="search" inputmode="search" autocomplete="off" spellcheck="false" placeholder="İstif No veya barkod yazın" value="${esc(query)}">
      </section>
      <section class="filter-grid">
        <div class="filter-box"><label>Tarih</label><input id="filterDate" type="date" value=""></div>
        <div class="filter-box"><label>Bölme</label><select id="filterBolme"><option value="">Tümü</option>${bolmes.map((value) => `<option>${esc(value)}</option>`).join("")}</select></div>
        <div class="filter-box"><label>Tür</label><select id="filterType"><option value="">Tümü</option>${TYPE_ORDER.map((value) => `<option value="${esc(value)}">${esc(value.replace("İbreli ", ""))}</option>`).join("")}</select></div>
      </section>
      <section id="recordList" class="records">${recordCards(sortedRecords())}</section>`;
  };

  applyRecordFilters = function applyRecordFiltersV29() {
    const query = clean(app.querySelector("#istifSearchV29")?.value || state.recordSearchV29 || "");
    state.recordSearchV29 = query;
    const needle = searchKeyV29(query);
    const date = app.querySelector("#filterDate")?.value || "";
    const bolme = app.querySelector("#filterBolme")?.value || "";
    const type = app.querySelector("#filterType")?.value || "";
    const rows = sortedRecords(
      state.records.filter((record) => {
        const matchesSearch =
          !needle ||
          searchKeyV29(record.istifNo).includes(needle) ||
          searchKeyV29(record.barcode).includes(needle);
        return (
          matchesSearch &&
          (!date || record.date === date) &&
          (!bolme || record.bolme === bolme) &&
          (!type || record.type.startsWith(type))
        );
      }),
    );
    const list = app.querySelector("#recordList");
    if (list) list.innerHTML = recordCards(rows);
    bindCloudButtonsV29();
  };

  recordCards = function recordCardsV29(rows) {
    if (!rows.length)
      return '<div class="empty card">İstif No veya barkoda uygun kayıt bulunamadı.</div>';
    return rows
      .map((record) => {
        const sent = recordSent(record);
        const sentDate = sent && record.sentAt ? trDate(String(record.sentAt).slice(0, 10)) : "";
        const upload = recordPhotoUploadSummary(record);
        const hasSyncError = !!clean(record.syncError) || ["upload_failed", "sync_failed"].includes(record.syncStatus);
        const cloudButton = needsCloudPullV29(record)
          ? `<button class="btn cloud-pull-v29 small" type="button" data-cloud-pull-v29="${esc(record.id)}" ${cloudPullingIdV29 === record.id ? "disabled" : ""}>${icon("cloud", 16)} ${cloudPullingIdV29 === record.id ? "Getiriliyor…" : "İstifi Buluttan Getir"}</button>`
          : "";
        const hydratedBadge = record.cloudHydratedV29 === true && !needsCloudPullV29(record)
          ? `<div class="cloud-ready-badge-v29">${icon("check", 14)} Bilgiler ve fotoğraflar cihazda</div>`
          : "";
        return `<article class="record-card card ${recordTypeClass(record.type)} ${sent ? "sent-record" : ""}" data-record="${record.id}">
          ${recordThumbHtml(record)}
          <div class="record-info">
            <span>Şeflik</span><b>${esc(String(record.seflik || "").replace(" Şefliği", ""))}</b>
            <span>Bölme</span><b>${esc(record.bolme)}</b>
            <span>İstif</span><b>${esc(record.istifNo)}</b>
            <span>Tür</span><b>${esc(record.type)}</b>
            <span>Ster</span><b>${esc(record.ster)} Ster</b>
            <span>Tarih</span><b>${trDate(record.date)}</b>
          </div>
          <div class="record-status ${hasSyncError ? "error" : record.coordinates ? "" : "warn"}">
            <div>${icon("pin", 17)}<span>${record.coordinates ? "Koordinat Var" : "Koordinat Bekliyor"}</span></div>
            <div>${icon("camera", 17)}<span>${upload.total} Fotoğraf${upload.total ? ` • ${localPhotoCountV29(record)}/${upload.total} cihazda` : ""}</span></div>
            <div>${icon(sent ? "check" : "cloud", 17)}<span>${sent ? `Gönderildi${sentDate ? ` • ${sentDate}` : ""}` : recordSyncText(record)}</span></div>
            ${hasSyncError ? `<div class="record-sync-error" title="${esc(record.syncError || "Senkronizasyon hatası")}">${icon("info", 17)}<span>${esc(record.syncError || "Tekrar senkronize edin")}</span></div>` : ""}
          </div>
          ${recordPhotoStateBadges(record)}
          ${hydratedBadge}
          ${sent ? `<div class="sent-badge">${icon("check", 15)} Gönderilen İstif</div>` : ""}
          <div class="record-actions">
            ${cloudButton}
            <button class="btn small" type="button" data-edit-record="${record.id}">${icon("doc", 16)} Düzenle</button>
            <button class="btn ${sent ? "undo-sent" : "mark-sent"} small" type="button" ${sent ? `data-undo-sent="${record.id}"` : `data-mark-sent="${record.id}"`}>${icon(sent ? "refresh" : "check", 16)} ${sent ? "Geri Al" : "İstifi Gönder"}</button>
            <button class="btn danger-soft small" type="button" data-delete-record="${record.id}">${icon("trash", 16)} Sil</button>
          </div>
        </article>`;
      })
      .join("");
  };

  /* Terminal kodlu cihaz da kayıt güncellemelerini ana kullanıcı yetkisiyle Edge Function üzerinden yapar. */
  supabaseUpsertRecord = async function supabaseUpsertRecordV29(record) {
    const api = suiteSyncApi();
    if (!api?.edge) throw new Error("Suite bulut servisi hazır değil.");
    const folder = effectiveRecordSeflik(record);
    return api.edge("istif_record_upsert", {
      seflik: folder.seflik,
      folderSeflik: folder.seflik,
      seflikKey: folder.seflikKey,
      record: {
        id: String(record.id),
        ormanci: record.ormanci || "",
        record_date: record.date || "",
        bolme_no: record.bolme || "",
        istif_no: record.istifNo || "",
        wood_type: record.type || "",
        ster: Number(String(record.ster || 0).replace(",", ".")) || 0,
        coordinates: record.coordinates || null,
        mevki: record.mevki || null,
        description: record.description || null,
        barcode_no: record.barcode || null,
        photo_count: Math.max(
          Number(record.photoCount || 0),
          Array.isArray(record.photos) ? record.photos.length : 0,
          Array.isArray(record.driveFiles) ? record.driveFiles.length : 0,
        ),
        drive_folder_id: record.driveFolderId || null,
        drive_files: Array.isArray(record.driveFiles) ? record.driveFiles : [],
        is_sent: recordSent(record),
        sent_at: recordSent(record) ? record.sentAt || null : null,
        created_at: record.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  };

  async function fetchLatestRemoteRecordV29(record) {
    const api = suiteSyncApi();
    if (!api?.edge) throw new Error("Suite bulut servisi hazır değil.");
    const folder = effectiveRecordSeflik(record);
    let out;
    try {
      out = await api.edge("istif_record_list", {
        seflik: folder.seflik,
        folderSeflik: folder.seflik,
        seflikKey: folder.seflikKey,
      });
    } catch (edgeError) {
      if (!api.drive) throw edgeError;
      out = await api.drive("record_list", {
        seflik: folder.seflik,
        seflikKey: folder.seflikKey,
      });
    }
    const raw = (Array.isArray(out?.records) ? out.records : []).find(
      (row) => clean(row?.id || row?.record_id) === clean(record.id),
    );
    if (!raw) throw new Error("İstif bulutta bulunamadı veya erişim yetkisi yok.");
    const normalized = normalizeRemoteRecord(raw);
    if (!normalized) throw new Error("Buluttaki İstif kaydı okunamadı.");
    return normalized;
  }

  async function pullRecordFromCloudV29(recordId) {
    if (cloudPullingIdV29) return;
    const current = state.records.find((item) => item.id === recordId);
    if (!current) return toast("Buluttan getirilecek istif bulunamadı.", "bad");
    if (navigator.onLine === false)
      return toast("İstifi buluttan getirmek için internet gerekli.", "bad");
    if (!hasSharedCloudIdentity())
      return toast("Google veya terminal kodu ile bağlı kullanıcı oturumu gerekli.", "bad");

    cloudPullingIdV29 = recordId;
    render();
    showDialog(
      `<h3>İstif Buluttan Getiriliyor</h3><p>${esc(current.istifNo || "İstif")} bilgileri ve fotoğrafları bu cihaza indiriliyor.</p><div class="progress"><span style="width:60%"></span></div>`,
    );
    const previousSelected = state.selectedPhotos;
    try {
      const remote = await fetchLatestRemoteRecordV29(current);
      const existingPhotos = Array.isArray(current.photos)
        ? current.photos.filter((photo) => photo && photo.blob).map((photo) => ({ ...photo }))
        : [];
      state.selectedPhotos = existingPhotos;
      const loaded = await hydrateDrivePhotosForEdit({ ...current, ...remote });
      const photos = state.selectedPhotos
        .filter((photo) => photo && photo.blob)
        .slice(0, 4)
        .map((photo) => ({
          blob: photo.blob,
          name: photo.name || `${remote.istifNo || "istif"}_foto.jpg`,
          type: photo.type || photo.blob?.type || "image/jpeg",
          size: Number(photo.size || photo.blob?.size || 0),
          fromDrive: photo.fromDrive === true,
          driveFileId: clean(photo.driveFileId),
        }));
      const merged = {
        ...current,
        ...remote,
        photos,
        photoCount: Math.max(
          Number(remote.photoCount || 0),
          Array.isArray(remote.driveFiles) ? remote.driveFiles.length : 0,
          photos.length,
        ),
        driveFiles: Array.isArray(remote.driveFiles) ? remote.driveFiles : current.driveFiles || [],
        syncStatus: "synced",
        syncError: "",
        syncErrorCode: "",
        syncRetryable: false,
        remoteOnly: false,
        cloudHydratedV29: true,
        cloudHydratedAtV29: new Date().toISOString(),
      };
      await idbPut("records", cloneValue(merged));
      const index = state.records.findIndex((item) => item.id === merged.id);
      if (index >= 0) state.records[index] = cloneValue(merged);
      else state.records.push(cloneValue(merged));
      closeDialog();
      toast(
        `${merged.istifNo || "İstif"} buluttan getirildi${merged.photoCount ? ` • ${photos.length}/${merged.photoCount} fotoğraf` : ""}.`,
        "good",
      );
      scheduleDirtyReconcileV29();
    } catch (error) {
      closeDialog();
      toast(`İstif getirilemedi: ${clean(error?.message || error)}`, "bad");
    } finally {
      state.selectedPhotos = previousSelected;
      cloudPullingIdV29 = "";
      render();
    }
  }

  editRecord = async function editRecordV29(recordId) {
    const record = state.records.find((item) => item.id === recordId);
    if (!record) return toast("Düzenlenecek istif bulunamadı.", "bad");
    if (needsCloudPullV29(record)) {
      toast("Bu istifin bilgileri ve fotoğrafları cihazda değil. Önce sarı ‘İstifi Buluttan Getir’ düğmesine basın.", "bad");
      return;
    }
    return originalEditRecordV28(recordId);
  };

  function bindCloudButtonsV29() {
    app.querySelectorAll("[data-cloud-pull-v29]").forEach((button) => {
      if (button.dataset.boundV29 === "1") return;
      button.dataset.boundV29 = "1";
      button.addEventListener("click", () => pullRecordFromCloudV29(button.dataset.cloudPullV29));
    });
    const search = app.querySelector("#istifSearchV29");
    if (search && search.dataset.boundV29 !== "1") {
      search.dataset.boundV29 = "1";
      search.addEventListener("input", applyRecordFilters);
      search.addEventListener("search", applyRecordFilters);
    }
  }

  bindDynamic = function bindDynamicV29() {
    originalBindDynamicV28();
    bindCloudButtonsV29();
  };

  function bootV29() {
    installStylesV29();
    document.documentElement.dataset.istifCloudMode = "manual";
    window.MESAHA_ISTIF_V29 = {
      version: HOTFIX_VERSION,
      pullRecord: pullRecordFromCloudV29,
      reconcileDirty: reconcileIstifDirtyV29,
    };
    setTimeout(scheduleDirtyReconcileV29, 300);
    setTimeout(() => {
      if (state.view === "records") render();
    }, 700);
  }

  window.addEventListener("mesaha-suite:sync-complete", () =>
    setTimeout(scheduleDirtyReconcileV29, 80),
  );
  window.addEventListener("online", () => setTimeout(scheduleDirtyReconcileV29, 900));

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", bootV29, { once: true });
  else bootV29();
})();
