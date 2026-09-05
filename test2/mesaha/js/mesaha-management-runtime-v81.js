(function (root) {
  "use strict";

  var ADMIN_EMAIL = "yakup.ydzn77@gmail.com";
  var K = {
    session: "mesaha_supabase_v500_session",
    active: "mesaha_active_seflik_folder_v564",
    folders: "mesaha_suite_folder_cache_v4",
    foresters: "mesaha_suite_foresters_v4",
    divisions: "mesaha_suite_divisions_v4",
    pending: "mesaha_suite_pending_ops_v4",
    settings: "cam_mesaha_ayarlar_v1",
    panel: "mesaha_panel_user_v316"
  };

  function clean(v) { return String(v == null ? "" : v).trim(); }
  function lower(v) { return clean(v).toLocaleLowerCase("tr-TR"); }
  function esc(v) {
    return clean(v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fold(v) {
    return lower(v).replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
      .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function read(key, fallback) {
    try { var value = JSON.parse(localStorage.getItem(key) || "null"); return value == null ? fallback : value; }
    catch (_) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function api() { return root.MesahaSuiteSync || root.MesahaSuiteSyncV28 || null; }
  function identity() {
    var service = api();
    if (service && typeof service.identity === "function") return service.identity() || {};
    var s = read(K.session, {}), u = s.user || {};
    return { email: clean(u.email), name: clean(u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || clean(u.email) };
  }
  function notify(message, kind) {
    try {
      var fn = root.mesahaFloatToastV315 || root.mesahaFloatToastV314;
      if (typeof fn === "function") return fn(message, "", kind || "success");
      if (typeof root.toast === "function") return root.toast(message);
    } catch (_) {}
  }
  function activeFolder() {
    var active = read(K.active, {}) || {}, folders = read(K.folders, []);
    if (!Array.isArray(folders)) folders = [];
    var id = clean(active.folder_id || active.folderId), key = clean(active.seflik_key || active.seflikKey), name = clean(active.seflik);
    return folders.find(function (f) { return f && id && clean(f.id || f.folder_id || f.folderId) === id; }) ||
      folders.find(function (f) { return f && key && clean(f.seflik_key || f.seflikKey) === key; }) ||
      folders.find(function (f) { return f && name && fold(f.seflik || f.name) === fold(name); }) ||
      (name || key || id ? active : null);
  }
  function owner(folder) {
    var role = lower(folder && (folder.role || folder.member_role));
    return !!(folder && (folder.is_creator === true || folder.isCreator === true || folder.creator === true || ["owner", "creator", "kurucu"].indexOf(role) >= 0));
  }
  function folderPayload(folder) {
    folder = folder || activeFolder() || {};
    var seflik = clean(folder.seflik || folder.name);
    return {
      seflik: seflik,
      folderSeflik: seflik,
      seflikKey: clean(folder.seflik_key || folder.seflikKey) || fold(seflik),
      seflik_key: clean(folder.seflik_key || folder.seflikKey) || fold(seflik),
      folderId: clean(folder.id || folder.folder_id || folder.folderId)
    };
  }
  function upsertFolder(folder) {
    if (!folder) return;
    var list = read(K.folders, []); if (!Array.isArray(list)) list = [];
    var key = clean(folder.seflik_key || folder.seflikKey) || fold(folder.seflik || folder.name);
    var index = list.findIndex(function (x) { return x && (clean(x.id || x.folder_id) === clean(folder.id || folder.folder_id) || clean(x.seflik_key || x.seflikKey) === key); });
    if (index >= 0) list[index] = Object.assign({}, list[index], folder); else list.unshift(folder);
    write(K.folders, list);
    var service = api(); if (service && typeof service.applyCanonicalServerContext === "function") service.applyCanonicalServerContext({ folder: folder, seflik: folder.seflik, seflik_key: key });
  }
  function onlineRequired() {
    if (navigator.onLine === false) { notify("Bu yönetim işlemi için internet bağlantısı gerekli.", "warning"); return false; }
    if (!api() || typeof api().edge !== "function") { notify("Yönetim bağlantısı henüz hazır değil.", "warning"); return false; }
    return true;
  }

  function ensureOverlay() {
    var overlay = document.getElementById("mesahaManagementOverlayV81");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "mesahaManagementOverlayV81";
    overlay.hidden = true;
    overlay.innerHTML = '<section class="management-modal-v81" role="dialog" aria-modal="true" aria-labelledby="managementModalTitleV81"><div class="management-modal-head-v81"><h2 id="managementModalTitleV81">Yönetim</h2><button class="management-close-v81" type="button" aria-label="Kapat">×</button></div><div class="management-body-v81" id="managementModalBodyV81"></div></section>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (event) { if (event.target === overlay || event.target.closest(".management-close-v81")) closeOverlay(); });
    return overlay;
  }
  function openOverlay(title, html) {
    var overlay = ensureOverlay();
    document.getElementById("managementModalTitleV81").textContent = title;
    document.getElementById("managementModalBodyV81").innerHTML = html || "";
    overlay.hidden = false; document.documentElement.style.overflow = "hidden";
  }
  function closeOverlay() { var overlay = ensureOverlay(); overlay.hidden = true; document.documentElement.style.overflow = ""; }
  function body() { return document.getElementById("managementModalBodyV81"); }
  function errorCard(error) { return '<div class="management-note-v81 error">' + esc(error && (error.message || error.error || error) || "İşlem tamamlanamadı.") + '</div>'; }

  async function loadFolders() {
    var cached = read(K.folders, []); if (!Array.isArray(cached)) cached = [];
    if (navigator.onLine === false || !api() || typeof api().edge !== "function") return cached.filter(Boolean);
    var out = await api().edge("seflik_folder_list_my_sefliks", folderPayload());
    if (!Array.isArray(out && out.folders)) throw new Error("Sunucu geçerli şeflik listesi döndürmedi; cihazdaki liste korundu.");
    if (out.complete === false || out.partial === true || out.truncated === true || out.missing_sql === true) throw new Error(clean(out.error) || "Sunucu şeflik listesini eksiksiz doğrulayamadı; cihazdaki liste korundu.");
    var list = out.folders;
    write(K.folders, list);
    return list;
  }
  function folderRows(list) {
    var active = activeFolder(), activeKey = clean(active && (active.seflik_key || active.seflikKey));
    return list.length ? list.map(function (f, i) {
      var key = clean(f.seflik_key || f.seflikKey), selected = key && key === activeKey;
      return '<article class="management-row-v81 ' + (selected ? 'is-active' : '') + '"><div><strong>' + esc(f.seflik || f.name) + '</strong><small>' + (owner(f) ? 'Kurucu' : 'Üye') + (selected ? ' • Aktif şeflik' : '') + '</small></div><button class="soft" type="button" data-select-folder-v81="' + i + '">' + (selected ? 'Aktif' : 'Seç') + '</button></article>';
    }).join("") : '<div class="management-note-v81">Henüz şeflik klasörü yok.</div>';
  }
  async function renderSeflik() {
    openOverlay("Şeflik Yönetimi", '<div class="management-note-v81">Şeflikler hazırlanıyor…</div>');
    try {
      var list = await loadFolders();
      body().innerHTML = '<form class="management-form-v81" id="createFolderFormV81"><input id="newFolderNameV81" maxlength="120" placeholder="Yeni şeflik adı" required><button type="submit">Oluştur</button></form><div class="management-list-v81">' + folderRows(list) + '</div><div class="management-actions-v81"><button class="soft" type="button" id="renameFolderV81">Aktif Şefliğin Adını Değiştir</button><button class="danger" type="button" id="deleteFolderV81">Aktif Şefliği Sil</button></div>';
      body().querySelectorAll("[data-select-folder-v81]").forEach(function (button) {
        button.onclick = function () { var f = list[Number(button.dataset.selectFolderV81)]; upsertFolder(f); notify("Aktif şeflik seçildi: " + clean(f.seflik || f.name)); renderSeflik(); };
      });
      document.getElementById("createFolderFormV81").onsubmit = async function (event) {
        event.preventDefault(); if (!onlineRequired()) return;
        var name = clean(document.getElementById("newFolderNameV81").value); if (name.length < 2) return notify("Geçerli bir şeflik adı yazın.", "warning");
        try { var out = await api().edge("seflik_folder_create_seflik", { seflik: name }); upsertFolder(out.folder); notify("Şeflik oluşturuldu."); await renderSeflik(); } catch (e) { notify(clean(e.message || e), "error"); }
      };
      document.getElementById("renameFolderV81").onclick = async function () {
        var f = activeFolder(); if (!f || !owner(f)) return notify("Şeflik adını yalnızca kurucu değiştirebilir.", "warning"); if (!onlineRequired()) return;
        var next = clean(prompt("Yeni şeflik adı:", clean(f.seflik || f.name))); if (!next || next === clean(f.seflik || f.name)) return;
        try { var out = await api().edge("seflik_folder_rename_seflik", { oldSeflik: clean(f.seflik || f.name), seflik: clean(f.seflik || f.name), newSeflik: next, new_seflik: next }); write(K.folders, []); upsertFolder(out.folder || { seflik: next, seflik_key: out.seflik_key, role: "owner", is_creator: true }); notify("Şeflik adı değiştirildi."); await renderSeflik(); } catch (e) { notify(clean(e.message || e), "error"); }
      };
      document.getElementById("deleteFolderV81").onclick = async function () {
        var f = activeFolder(), name = clean(f && (f.seflik || f.name)); if (!f || !owner(f)) return notify("Şefliği yalnızca kurucu silebilir.", "warning"); if (!onlineRequired()) return;
        if (prompt(name + " şefliği silinecek. Onay için şeflik adını yazın:") !== name) return notify("Şeflik silinmedi.", "warning");
        try { await api().edge("seflik_folder_delete_seflik", { seflik: name, folderSeflik: name, confirmSeflik: name }); var rows = read(K.folders, []).filter(function (x) { return fold(x && (x.seflik || x.name)) !== fold(name); }); write(K.folders, rows); localStorage.removeItem(K.active); notify("Şeflik silindi."); await renderSeflik(); } catch (e) { notify(clean(e.message || e), "error"); }
      };
    } catch (e) { body().innerHTML = errorCard(e); }
  }

  async function renderOrmanci() {
    var folder = activeFolder(); openOverlay("Ormancı Yönetimi", '<div class="management-note-v81">Ormancılar hazırlanıyor…</div>');
    if (!folder) { body().innerHTML = '<div class="management-note-v81 warn">Önce Şeflik Yönetimi bölümünden aktif bir şeflik seçin.</div>'; return; }
    if (!onlineRequired()) { var stores = read(K.foresters, {}), cached = stores[clean(folder.seflik_key || folder.seflikKey)] || []; body().innerHTML = '<div class="management-note-v81 warn">Çevrimdışısınız. Son kaydedilen ekip gösteriliyor.</div><div class="management-list-v81">' + memberRows(cached, false) + '</div>'; return; }
    try {
      var out = await api().edge("seflik_folder_list_members", folderPayload(folder)), members = Array.isArray(out.members) ? out.members : [];
      var storesNow = read(K.foresters, {}); storesNow[clean(folder.seflik_key || folder.seflikKey)] = members; write(K.foresters, storesNow);
      body().innerHTML = '<form class="management-form-v81" id="searchMemberFormV81"><input id="memberSearchV81" minlength="3" placeholder="Ad, soyad veya e-posta" required><button type="submit">Ara</button></form><div id="memberSearchResultsV81"></div><h3>Şeflik Ekibi</h3><div class="management-list-v81">' + memberRows(members, out.is_creator === true) + '</div>';
      document.getElementById("searchMemberFormV81").onsubmit = async function (event) {
        event.preventDefault(); var q = clean(document.getElementById("memberSearchV81").value); if (q.length < 3) return;
        var box = document.getElementById("memberSearchResultsV81"); box.innerHTML = '<div class="management-note-v81">Kullanıcılar aranıyor…</div>';
        try { var found = await api().edge("seflik_folder_search_users", Object.assign(folderPayload(folder), { query: q })); var users = Array.isArray(found.users) ? found.users : []; box.innerHTML = '<div class="management-list-v81">' + (users.length ? users.map(function (u, i) { return '<article class="management-row-v81"><div><strong>' + esc(u.name || u.email) + '</strong><small>' + esc(u.email) + '</small></div><button type="button" data-add-member-v81="' + i + '">Ekle</button></article>'; }).join("") : '<div class="management-note-v81">Kullanıcı bulunamadı.</div>') + '</div>'; box.querySelectorAll("[data-add-member-v81]").forEach(function (button) { button.onclick = async function () { var u = users[Number(button.dataset.addMemberV81)]; button.disabled = true; try { await api().edge("seflik_folder_add_member", Object.assign(folderPayload(folder), { member_user_id: u.user_id, member_email: u.email })); notify("Ormancı eklendi."); await renderOrmanci(); } catch (e) { button.disabled = false; notify(clean(e.message || e), "error"); } }; }); } catch (e) { box.innerHTML = errorCard(e); }
      };
      body().querySelectorAll("[data-remove-member-v81]").forEach(function (button) { button.onclick = async function () { var m = members[Number(button.dataset.removeMemberV81)]; if (!confirm(clean(m.name || m.email) + " şeflikten çıkarılsın mı?")) return; button.disabled = true; try { await api().edge("seflik_folder_remove_member", Object.assign(folderPayload(folder), { member_user_id: m.user_id, member_email: m.email })); notify("Ormancı çıkarıldı."); await renderOrmanci(); } catch (e) { button.disabled = false; notify(clean(e.message || e), "error"); } }; });
    } catch (e) { body().innerHTML = errorCard(e); }
  }
  function memberRows(members, canRemove) {
    return members.length ? members.map(function (m, i) { var role = lower(m.role), isOwner = ["owner", "creator", "kurucu"].indexOf(role) >= 0; return '<article class="management-row-v81"><div><strong>' + esc(m.name || m.email || "Kullanıcı") + '</strong><small>' + esc(m.email || "") + (isOwner ? ' • Kurucu' : '') + '</small></div>' + (canRemove && !isOwner && m.is_self !== true ? '<button class="danger" type="button" data-remove-member-v81="' + i + '">Çıkar</button>' : '') + '</article>'; }).join("") : '<div class="management-note-v81">Bu şeflikte kayıtlı ormancı yok.</div>';
  }

  function divisionList(folder) {
    var store = read(K.divisions, {}), key = clean(folder && (folder.seflik_key || folder.seflikKey)) || fold(folder && folder.seflik);
    return Array.isArray(store[key]) ? store[key].filter(function (d) { return d && !d.deleted; }) : [];
  }
  async function renderBolme(refresh) {
    var folder = activeFolder(); openOverlay("Bölme Yönetimi", '<div class="management-note-v81">Bölmeler hazırlanıyor…</div>');
    if (!folder) { body().innerHTML = '<div class="management-note-v81 warn">Önce aktif bir şeflik seçin.</div>'; return; }
    if (refresh && navigator.onLine !== false && api() && typeof api().refreshFolderData === "function") { try { await api().refreshFolderData({ source: "management-v81" }); } catch (_) {} }
    var list = divisionList(folder), canDelete = owner(folder) && navigator.onLine !== false;
    body().innerHTML = '<form class="management-form-v81 two" id="createDivisionFormV81"><input id="divisionNoV81" placeholder="Bölme No" required><input id="divisionLocationV81" placeholder="Konum (isteğe bağlı)"><button type="submit">Bölme Oluştur</button></form><div class="management-note-v81">Bölme oluşturma çevrimdışıyken de çalışır; internet geldiğinde mevcut senkron kuyruğu gönderir.</div><div class="management-list-v81">' + (list.length ? list.map(function (d, i) { var no = clean(d.bolme_no || d.bolmeNo); return '<article class="management-row-v81"><div><strong>Bölme ' + esc(no) + '</strong><small>' + Number(d.record_count || d.recordCount || 0).toLocaleString("tr-TR") + ' kayıt' + (d.pending || d.local_pending ? ' • Senkron bekliyor' : '') + '</small></div>' + (canDelete ? '<button class="danger" type="button" data-delete-division-v81="' + i + '">Sil</button>' : '') + '</article>'; }).join("") : '<div class="management-note-v81">Henüz bölme oluşturulmamış.</div>') + '</div>';
    document.getElementById("createDivisionFormV81").onsubmit = async function (event) { event.preventDefault(); var no = clean(document.getElementById("divisionNoV81").value), locationText = clean(document.getElementById("divisionLocationV81").value); try { if (!api() || typeof api().createOfflineDivision !== "function") throw new Error("Bölme modülü hazır değil."); api().createOfflineDivision(no, locationText, { source: "management-v81" }); notify("Bölme cihazda oluşturuldu."); if (navigator.onLine !== false && typeof api().syncAll === "function") api().syncAll({ source: "management-v81-create-division" }).catch(function () {}); await renderBolme(false); } catch (e) { notify(clean(e.message || e), "error"); } };
    body().querySelectorAll("[data-delete-division-v81]").forEach(function (button) { button.onclick = async function () { var d = list[Number(button.dataset.deleteDivisionV81)], no = clean(d && (d.bolme_no || d.bolmeNo)); if (prompt("Bölme " + no + " silinecek. Onay için bölme numarasını yazın:") !== no) return; button.disabled = true; try { await api().edge("seflik_folder_delete_division", Object.assign(folderPayload(folder), { bolmeNo: no, confirmBolme: no })); var store = read(K.divisions, {}), key = clean(folder.seflik_key || folder.seflikKey) || fold(folder.seflik); store[key] = (store[key] || []).filter(function (x) { return clean(x.bolme_no || x.bolmeNo) !== no; }); write(K.divisions, store); notify("Bölme silindi."); await renderBolme(false); } catch (e) { button.disabled = false; notify(clean(e.message || e), "error"); } }; });
  }

  function session() { return read(K.session, {}) || {}; }
  async function rpc(name, params) {
    var cfg = root.MESAHA_SUPABASE_CONFIG || {}, base = clean(cfg.url).replace(/\/+$/, ""), anon = clean(cfg.anonKey || cfg.anon_key), current = session(), auth = root.mesahaSupabase || root.mesahaCloud;
    var expires = Number(current.expires_at || 0) * 1000;
    if (current.refresh_token && navigator.onLine !== false && (!expires || expires <= Date.now() + 120000) && auth && typeof auth.refreshSession === "function") { try { current = await auth.refreshSession(current); } catch (_) {} }
    if (!base || !anon || !clean(current.access_token)) throw new Error("Terminal kodu için Google hesabıyla giriş yapın.");
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { try { controller.abort(); } catch (_) {} }, 15000) : 0;
    var response;
    try { response = await fetch(base + "/rest/v1/rpc/" + encodeURIComponent(name), { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", apikey: anon, Authorization: "Bearer " + clean(current.access_token) }, body: JSON.stringify(params || {}), signal: controller && controller.signal }); }
    catch (e) { if (e && e.name === "AbortError") throw new Error("Terminal işlemi zaman aşımına uğradı. Bağlantıyı kontrol edip yeniden deneyin."); throw e; }
    finally { if (timer) clearTimeout(timer); }
    var raw = await response.text(), out = {}; try { out = raw ? JSON.parse(raw) : {}; } catch (_) {}
    if (!response.ok) throw new Error(clean(out.message || out.error) || "Terminal işlemi tamamlanamadı."); return out;
  }
  function dateText(v) { try { return v ? new Date(v).toLocaleString("tr-TR") : "-"; } catch (_) { return clean(v) || "-"; } }
  async function renderTerminal() {
    openOverlay("Terminal Kodu", '<div class="management-note-v81">Terminal cihazları hazırlanıyor…</div>');
    if (navigator.onLine === false) { body().innerHTML = '<div class="management-note-v81 warn">Terminal kodu oluşturmak ve cihaz oturumlarını yönetmek için internet gerekir.</div>'; return; }
    try {
      var out = await rpc("mesaha_list_terminal_sessions_v577", {}), list = Array.isArray(out) ? out : (Array.isArray(out.terminals) ? out.terminals : (Array.isArray(out.items) ? out.items : []));
      body().innerHTML = '<div class="management-actions-v81"><button type="button" id="createTerminalCodeV81">Yeni Terminal Kodu Oluştur</button><button class="soft" type="button" id="refreshTerminalV81">Yenile</button></div><div id="terminalCodeBoxV81"></div><div class="management-list-v81">' + (list.length ? list.map(function (t, i) { var info = t.used_device_info || t.device_info || {}, label = clean(t.label || info.os || info.platform || "Terminal cihaz"); return '<article class="management-row-v81"><div><strong>' + esc(label) + '</strong><small>' + esc(clean(t.code)) + ' • Giriş: ' + esc(dateText(t.used_at || t.paired_at)) + '</small></div><button class="danger" type="button" data-revoke-terminal-v81="' + i + '">Çıkış Yap</button></article>'; }).join("") : '<div class="management-note-v81">Kod ile giriş yapan aktif terminal yok.</div>') + '</div>';
      document.getElementById("createTerminalCodeV81").onclick = async function () { var button = this; button.disabled = true; try { var made = await rpc("mesaha_create_terminal_code_v557", { p_label: "terminal", p_app_version: "Mesaha İO 6.22" }), t = made.terminal || made, code = clean(t.code); if (!code) throw new Error("Terminal kodu alınamadı."); document.getElementById("terminalCodeBoxV81").innerHTML = '<div class="terminal-code-v81"><small>TEK KULLANIMLIK TERMİNAL KODU</small><strong>' + esc(code) + '</strong><small>' + esc(t.expires_at ? dateText(t.expires_at) + " tarihine kadar geçerli" : "Kısa süre geçerli") + '</small></div>'; notify("Terminal kodu oluşturuldu."); } catch (e) { notify(clean(e.message || e), "error"); } finally { button.disabled = false; } };
      document.getElementById("refreshTerminalV81").onclick = renderTerminal;
      body().querySelectorAll("[data-revoke-terminal-v81]").forEach(function (button) { button.onclick = async function () { var t = list[Number(button.dataset.revokeTerminalV81)], code = clean(t && t.code); if (!confirm("Bu terminal cihazın oturumu kapatılsın mı?")) return; button.disabled = true; try { await rpc("mesaha_revoke_terminal_session_v577", { p_code: code }); notify("Terminal oturumu kapatıldı."); await renderTerminal(); } catch (e) { button.disabled = false; notify(clean(e.message || e), "error"); } }; });
    } catch (e) { body().innerHTML = errorCard(e); }
  }

  function ensureManagementTools() {
    var grid = document.querySelector("#managementView .management-grid-v81");
    if (!grid) return;
    grid.innerHTML = [
      ["seflik", "▱", "Şeflikler", "Aktif şefliği seçin, oluşturun ve düzenleyin", ""],
      ["ormanci", "♙", "Ormancı Yönetimi", "Aktif şefliğe kullanıcı ekleyin veya çıkarın", ""],
      ["bolme", "⌑", "Bölme Yönetimi", "Aktif şefliğe bölme oluşturun ve görüntüleyin", ""],
      ["terminal", "▤", "Terminal Kodu ve Cihazlar", "Kod oluşturun ve bağlı cihazları yönetin", ""],
      ["backup", "☁", "Yedekler ve Senkronizasyon", "Offline hazırlık, yedekler ve bekleyen işlemler", ""],
      ["admin", "▦", "Yönetim Paneli", "Sistem kullanıcıları ve raporlar", "management-admin-v81"]
    ].map(function (item) {
      var admin = item[0] === "admin";
      return '<button class="management-tool-v81 ' + item[4] + '" data-management-tool="' + item[0] + '" ' + (admin ? 'data-admin-only-v81 hidden' : '') + ' type="button"><span aria-hidden="true">' + item[1] + '</span><div><b>' + item[2] + '</b><small>' + item[3] + '</small></div><i aria-hidden="true">›</i></button>';
    }).join("");
  }

  async function renderBackupListV82() {
    var host = document.getElementById("managementBackupListV82"), service = api();
    if (!host || !service || typeof service.listBackups !== "function") return;
    host.innerHTML = '<div class="management-note-v81">Drive yedekleri alınıyor…</div>';
    try {
      var out = await service.listBackups(), all = Array.isArray(out && out.items) ? out.items : (Array.isArray(out && out.backups) ? out.backups : []);
      var list = all.filter(function (item) { var app = lower(item && (item.app_id || item.appId)); return !app || app === "mesaha" || app === "suite"; });
      host.innerHTML = list.length ? list.map(function (item, index) {
        return '<article class="management-row-v81"><div><strong>' + esc(item.file_name || item.fileName || "Mesaha yedeği") + '</strong><small>' + esc(dateText(item.created_at || item.createdAt)) + ' • ' + Number(item.record_count || item.recordCount || 0).toLocaleString("tr-TR") + ' kayıt</small></div><button class="soft" type="button" data-restore-backup-v82="' + index + '">Yükle</button></article>';
      }).join("") : '<div class="management-note-v81">Bu şeflik için Drive yedeği bulunamadı.</div>';
      host.querySelectorAll("[data-restore-backup-v82]").forEach(function (button) {
        button.onclick = async function () {
          var item = list[Number(button.dataset.restoreBackupV82)], id = clean(item && (item.id || item.backup_id));
          if (!id || !confirm("Bu yedek mevcut Mesaha kayıtlarıyla birleştirilsin mi?")) return;
          button.disabled = true;
          try { var result = await service.restoreMesahaBackup(id, "merge"); notify(Number(result.imported || 0).toLocaleString("tr-TR") + " kayıt yedekten alındı."); setTimeout(function () { location.reload(); }, 450); }
          catch (e) { button.disabled = false; notify(clean(e.message || e), "error"); }
        };
      });
    } catch (e) { host.innerHTML = errorCard(e); }
  }

  function renderBackupSyncV82() {
    var service = api(), pending = read(K.pending, []); if (!Array.isArray(pending)) pending = [];
    var online = navigator.onLine !== false, folder = activeFolder();
    openOverlay("Yedekler ve Senkronizasyon", '<div class="management-sync-status-v82"><div><small>BAĞLANTI</small><b>' + (online ? 'Online' : 'Offline') + '</b></div><div><small>AKTİF ŞEFLİK</small><b>' + esc(folder && (folder.seflik || folder.name) || 'Seçilmedi') + '</b></div><div><small>BEKLEYEN</small><b>' + pending.length.toLocaleString("tr-TR") + ' işlem</b></div></div><div class="management-backup-actions-v82"><button type="button" id="managementSyncNowV82" ' + (!online ? 'disabled' : '') + '>Sunucuya Gönder</button><button class="soft" type="button" id="managementPullNowV82" ' + (!online ? 'disabled' : '') + '>Sunucudan İndir</button><button class="soft" type="button" id="managementLocalBackupV82">Cihaza JSON Yedek İndir</button><button class="gold" type="button" id="managementMesahaDriveBackupV82" ' + (!online ? 'disabled' : '') + '>Mesaha Drive Yedeği Al</button><button class="soft" type="button" id="managementSuiteDriveBackupV82" ' + (!online ? 'disabled' : '') + '>Tam Uygulama Yedeği Al</button><button class="soft" type="button" id="managementDriveSetupV82" ' + (!online ? 'disabled' : '') + '>Drive Bağlantısı</button><button class="soft" type="button" id="managementListBackupsV82" ' + (!online ? 'disabled' : '') + '>Drive Yedeklerini Göster</button></div><div class="management-note-v81 ' + (online ? '' : 'warn') + '">' + (online ? 'Senkronizasyon mevcut çevrimdışı kuyruğu kullanır; kayıtların offline çalışma düzeni korunur.' : 'İnternet yok. Kayıtlar cihazda korunuyor ve bekleyen işlemler bağlantı geldiğinde gönderilebilir.') + '</div><div class="management-list-v81" id="managementBackupListV82"></div>');
    var sync = document.getElementById("managementSyncNowV82"); if (sync) sync.onclick = async function () { if (!service || typeof service.syncAll !== "function") return notify("Senkronizasyon modülü hazır değil.", "warning"); sync.disabled = true; try { var result = await service.syncAll({ source: "management-v83", force: true }); notify(result && result.ok === false ? (result.message || "Bazı kayıtlar cihazda bekliyor; tekrar denenecek.") : "Senkronizasyon tamamlandı.", result && result.ok === false ? "warning" : "success"); renderBackupSyncV82(); } catch (e) { sync.disabled = false; notify(clean(e.message || e), "error"); } };
    var pull = document.getElementById("managementPullNowV82"); if (pull) pull.onclick = async function () { if (!service || typeof service.refreshFolderData !== "function") return notify("Sunucudan indirme modülü hazır değil.", "warning"); pull.disabled = true; try { var folderResult = await service.refreshFolderData({ source: "management-v83-pull", includeRecords: true, forceRecords: true, quiet: true }); var istifResult = typeof service.pullIstifRecords === "function" ? await service.pullIstifRecords() : { skipped: true }; var incomplete = folderResult && folderResult.complete === false || istifResult && (istifResult.partial || istifResult.truncated || istifResult.complete === false); notify(incomplete ? "Sunucu verisinin bir bölümü doğrulanamadı; mevcut offline kayıtlar korundu." : "Şeflik, Mesaha ve İstif verileri sunucudan indirildi.", incomplete ? "warning" : "success"); renderBackupSyncV82(); } catch (e) { pull.disabled = false; notify(clean(e.message || e), "error"); } };
    var local = document.getElementById("managementLocalBackupV82"); if (local) local.onclick = function () { var backup = document.getElementById("backupBtn"); if (backup) backup.click(); else notify("Yerel yedek düğmesi hazır değil.", "warning"); };
    var mesaha = document.getElementById("managementMesahaDriveBackupV82"); if (mesaha) mesaha.onclick = async function () { mesaha.disabled = true; try { await service.createMesahaBackup({}); notify("Mesaha Drive yedeği oluşturuldu."); } catch (e) { notify(clean(e.message || e), "error"); } finally { mesaha.disabled = false; } };
    var suite = document.getElementById("managementSuiteDriveBackupV82"); if (suite) suite.onclick = async function () { suite.disabled = true; try { await service.createSuiteBackup(); notify("Tam uygulama yedeği oluşturuldu."); } catch (e) { notify(clean(e.message || e), "error"); } finally { suite.disabled = false; } };
    var setup = document.getElementById("managementDriveSetupV82"); if (setup) setup.onclick = async function () { if (!service || typeof service.driveConnect !== "function") return notify("Drive bağlantı modülü hazır değil.", "warning"); setup.disabled = true; try { var result = await service.driveConnect(); if (result && result.connected) notify("Şeflik Google Drive hesabı zaten bağlı."); } catch (e) { setup.disabled = false; notify(clean(e.message || e), "error"); } };
    var listButton = document.getElementById("managementListBackupsV82"); if (listButton) listButton.onclick = renderBackupListV82;
  }

  function openTool(name) {
    if (name === "seflik") return renderSeflik();
    if (name === "ormanci") return renderOrmanci();
    if (name === "bolme") return renderBolme(true);
    if (name === "terminal") return renderTerminal();
    if (name === "backup") return renderBackupSyncV82();
    if (name === "admin" && lower(identity().email) === ADMIN_EMAIL) location.href = "../yonetim/";
  }
  function updateAdminVisibility() { document.querySelectorAll("[data-admin-only-v81]").forEach(function (node) { node.hidden = lower(identity().email) !== ADMIN_EMAIL; }); }
  function showManagement() { if (typeof root.showView === "function") root.showView("management"); updateAdminVisibility(); }
  function boot() {
    ensureOverlay(); ensureManagementTools(); updateAdminVisibility();
    var shortcut = document.getElementById("managementHomeShortcutV81");
    if (shortcut) { shortcut.addEventListener("click", showManagement); shortcut.addEventListener("keydown", function (event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showManagement(); } }); }
    var istif = document.getElementById("openIstifBtnV81"); if (istif) istif.addEventListener("click", function () { location.href = "../istif/"; });
    var home = document.querySelector("#managementView [data-nav='home']"); if (home) home.addEventListener("click", function () { if (typeof root.showView === "function") root.showView("home"); });
    document.querySelectorAll("[data-management-tool]").forEach(function (button) { button.addEventListener("click", function () { openTool(button.dataset.managementTool); }); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !ensureOverlay().hidden) closeOverlay(); });
    var stale = document.getElementById("suiteHomeButtonV8"); if (stale) stale.remove();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
  ["storage", "online", "offline", "mesaha:user-login", "mesaha:google-access-approved", "mesaha:terminal-mode-enabled"].forEach(function (name) { root.addEventListener(name, updateAdminVisibility, { passive: true }); });
})(window);
