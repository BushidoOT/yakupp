"use strict";

/* Mesaha Suite V31 — Yönetim paneli canlı sistem raporları */
(function () {
  const SESSION_KEY = "mesaha_admin_auth_v548_session";
  const PAGE_ID = "page-system-v31";
  const NAV_ID = "nav-system-v31";
  const clean = (value) => String(value == null ? "" : value).trim();
  const esc = (value) => clean(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  let loading = false;
  let loadedAt = 0;
  let timer = 0;

  function config() {
    return window.MESAHA_SUPABASE_CONFIG || {};
  }
  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") || {}; }
    catch (_) { return {}; }
  }
  function formatNumber(value, digits) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toLocaleString("tr-TR", { maximumFractionDigits: digits == null ? 0 : digits }) : "0";
  }
  function formatBytes(value) {
    const bytes = Number(value || 0);
    if (!Number.isFinite(bytes) || bytes < 0) return "—";
    if (bytes < 1024) return Math.round(bytes) + " B";
    const units = ["KB", "MB", "GB", "TB"];
    let size = bytes / 1024;
    let unit = units[0];
    for (let i = 1; i < units.length && size >= 1024; i += 1) { size /= 1024; unit = units[i]; }
    return size.toLocaleString("tr-TR", { maximumFractionDigits: size >= 100 ? 0 : size >= 10 ? 1 : 2 }) + " " + unit;
  }
  function formatDate(value) {
    if (!clean(value)) return "—";
    try { return new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }); }
    catch (_) { return clean(value); }
  }
  function toast(message) {
    const box = document.getElementById("toast");
    if (!box) return;
    box.textContent = message;
    box.classList.add("is-visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => box.classList.remove("is-visible"), 2800);
  }
  async function edge(action, data) {
    const cfg = config();
    const sess = session();
    if (!clean(cfg.url) || !clean(cfg.anonKey) || !clean(sess.access_token)) throw new Error("Yönetim oturumu hazır değil.");
    const response = await fetch(clean(cfg.url).replace(/\/+$/, "") + "/functions/v1/smooth-function", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        apikey: clean(cfg.anonKey),
        Authorization: "Bearer " + clean(sess.access_token),
      },
      body: JSON.stringify({ action, ...(data || {}) }),
    });
    const out = await response.json().catch(() => ({}));
    if (!response.ok || out.ok === false) throw new Error(clean(out.error || out.message) || "Sistem raporu alınamadı.");
    return out;
  }

  function installUi() {
    if (document.getElementById(PAGE_ID)) return;
    const main = document.querySelector(".admin-view main.content");
    const nav = document.querySelector(".admin-view .bottom-nav");
    if (!main || !nav) return;
    const page = document.createElement("section");
    page.id = PAGE_ID;
    page.className = "page";
    page.dataset.page = "system";
    page.innerHTML = `
      <div class="page-heading">
        <div><span class="eyebrow">Canlı izleme</span><h2>Sistem Raporları</h2><p>Kullanıcı, cihaz, sürüm, Drive, şeflik ve senkronizasyon sağlığı.</p></div>
        <span id="systemReportTimeV31" class="counter-badge">Veri bekleniyor</span>
      </div>
      <div class="system-report-toolbar-v31"><button id="systemReportRefreshV31" class="button primary" type="button">Canlı Veriyi Yenile</button></div>
      <div id="systemReportContentV31"><div class="system-report-empty-v31">Sistem raporu yükleniyor…</div></div>`;
    main.appendChild(page);
    const button = document.createElement("button");
    button.id = NAV_ID;
    button.className = "nav-item";
    button.dataset.pageTarget = "system";
    button.type = "button";
    button.innerHTML = "<span>⌁</span><b>Sistem</b>";
    nav.appendChild(button);
    button.addEventListener("click", () => {
      document.querySelectorAll(".page").forEach((item) => item.classList.toggle("is-active", item === page));
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("is-active", item === button));
      loadReport(false);
    });
    document.getElementById("systemReportRefreshV31")?.addEventListener("click", () => loadReport(true));
    document.getElementById("refreshBtn")?.addEventListener("click", () => {
      if (page.classList.contains("is-active")) loadReport(true);
    });
  }

  function summaryCards(summary) {
    return `<div class="system-report-grid-v31">
      <article class="system-report-card-v31"><small>Son 15 dakika</small><b>${formatNumber(summary.users_online_15m)}</b><span>Aktif kullanıcı</span></article>
      <article class="system-report-card-v31"><small>Aktif cihaz</small><b>${formatNumber(summary.devices_total)}</b><span>Bildirilen cihaz</span></article>
      <article class="system-report-card-v31 ${Number(summary.pending_sync || 0) ? "warn" : ""}"><small>Bekleyen senkron</small><b>${formatNumber(summary.pending_sync)}</b><span>İstif, Suite ve manuel Mesaha</span></article>
      <article class="system-report-card-v31 ${Number(summary.failed_photos || 0) ? "bad" : ""}"><small>Fotoğraf hatası</small><b>${formatNumber(summary.failed_photos)}</b><span>Drive yükleme hatası</span></article>
      <article class="system-report-card-v31"><small>Bugün görülen</small><b>${formatNumber(summary.users_today)}</b><span>Kullanıcı</span></article>
      <article class="system-report-card-v31"><small>Toplam şeflik</small><b>${formatNumber(summary.seflik_count)}</b><span>Aktif klasör</span></article>
      <article class="system-report-card-v31 ${Number(summary.drive_critical || 0) ? "bad" : ""}"><small>Kritik Drive</small><b>${formatNumber(summary.drive_critical)}</b><span>Alanı kritik/dolu şeflik</span></article>
      <article class="system-report-card-v31"><small>Sağlık raporu</small><b>${formatNumber(summary.health_reports)}</b><span>Güncel cihaz raporu</span></article>
    </div>`;
  }

  function versionsHtml(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return '<div class="system-report-empty-v31">Sürüm bilgisi henüz gönderilmedi.</div>';
    const max = Math.max(1, ...list.map((row) => Number(row.count || 0)));
    return list.slice(0, 14).map((row) => `<div class="system-report-version-v31"><strong>${esc(row.version || "Bilinmiyor")}</strong><div class="system-report-version-track-v31"><i style="width:${Math.max(4, Math.round(Number(row.count || 0) / max * 100))}%"></i></div><b>${formatNumber(row.count)}</b></div>`).join("");
  }

  function driveHtml(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return '<div class="system-report-empty-v31">Drive alan raporu henüz gelmedi. Kullanıcı Suite ana ekranını açtığında otomatik gelir.</div>';
    return `<div class="system-drive-grid-v31">${list.map((row) => {
      const quota = row.quota || {};
      const percent = quota.percent == null ? 0 : Math.max(0, Math.min(100, Number(quota.percent) || 0));
      const level = clean(quota.level || (row.connected ? "normal" : "offline"));
      const remaining = quota.remainingBytes == null ? "Ortak / sınırsız" : formatBytes(quota.remainingBytes) + " boş";
      return `<article class="system-drive-card-v31 ${esc(level)}"><div class="system-drive-head-v31"><div><strong>${esc(row.seflik || "Şeflik")}</strong><small>${esc(row.owner_email || row.owner_name || row.reported_by || "Kurucu Drive")}</small></div><b>${esc(remaining)}</b></div>${quota.unlimited ? "" : `<div class="system-drive-track-v31"><i style="width:${percent}%"></i></div>`}<small>${quota.percent == null ? "Alan yüzdesi alınamadı" : "%" + percent.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " dolu"} • ${esc(formatDate(row.reported_at))}</small></article>`;
    }).join("")}</div>`;
  }

  function seflikHtml(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return '<div class="system-report-empty-v31">Şeflik kaydı bulunamadı.</div>';
    return `<div class="system-report-list-v31">${list.map((row) => `<article class="system-report-row-v31"><div><strong>${esc(row.seflik || row.seflik_key)}</strong><small>${esc(row.owner_name || "Kurucu bilgisi yok")}</small></div><div><span>Üye / Bölme</span><b>${formatNumber(row.member_count)} / ${formatNumber(row.division_count)}</b></div><div><span>Mesaha</span><b>${formatNumber(row.mesaha_count)} kayıt</b><small>${formatNumber(row.mesaha_volume, 3)} m³</small></div><div class="hide-mobile-v31"><span>İstif</span><b>${formatNumber(row.istif_count)} kayıt</b><small>${formatNumber(row.istif_ster, 2)} ster</small></div><div class="hide-tablet-v31"><span>Foto / Yedek</span><b>${formatNumber(row.photo_count)} / ${formatNumber(row.backup_count)}</b></div></article>`).join("")}</div>`;
  }

  function healthHtml(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return '<div class="system-report-empty-v31">Cihaz sağlık raporu henüz gelmedi.</div>';
    return `<div class="system-report-list-v31">${list.slice(0, 100).map((row) => `<article class="system-report-row-v31"><div><strong>${esc(row.name || "Kullanıcı")}</strong><small>${esc(row.seflik || "-")} • ${esc(row.platform || "Cihaz")} • ${esc(row.app_version || "Sürüm yok")}</small></div><div><span>Durum</span><b><i class="system-health-badge-v31 ${esc(row.level || "")}">${esc(row.level === "healthy" ? "Sağlıklı" : row.level === "warning" ? "Bekleyen" : row.level === "error" ? "Hatalı" : row.level === "offline" ? "Offline" : "Bilinmiyor")}</i></b></div><div><span>Bekleyen</span><b>${formatNumber(Number(row.suite_pending_operations || 0) + Number(row.istif_pending_records || 0) + (row.mesaha_manual_pending ? 1 : 0))}</b></div><div class="hide-mobile-v31"><span>Fotoğraf hatası</span><b>${formatNumber(row.photo_failed)}</b></div><div class="hide-tablet-v31"><span>Son rapor</span><b>${esc(formatDate(row.created_at))}</b></div></article>`).join("")}</div>`;
  }

  function render(data) {
    const content = document.getElementById("systemReportContentV31");
    const badge = document.getElementById("systemReportTimeV31");
    if (!content) return;
    const summary = data.summary || {};
    content.innerHTML = `${summaryCards(summary)}
      <article class="surface system-report-section-v31"><div class="system-report-head-v31"><div><h3>Cihaz ve Senkronizasyon Sağlığı</h3><p>Bekleyen kayıtlar, fotoğraf hataları, platform ve kullanılan sürüm.</p></div><span class="counter-badge">${formatNumber((data.health_rows || []).length)} cihaz</span></div>${healthHtml(data.health_rows)}</article>
      <article class="surface system-report-section-v31"><div class="system-report-head-v31"><div><h3>Sürüm Dağılımı</h3><p>Aktif kullanıcı ve cihazlardan alınan uygulama sürümleri.</p></div></div>${versionsHtml(data.versions)}</article>
      <article class="surface system-report-section-v31"><div class="system-report-head-v31"><div><h3>Drive Alan Durumu</h3><p>Şeflik kurucularının son bildirilen Drive doluluk bilgisi.</p></div></div>${driveHtml(data.drive_reports)}</article>
      <article class="surface system-report-section-v31"><div class="system-report-head-v31"><div><h3>Şeflik Kayıt Raporu</h3><p>Üye, bölme, Mesaha, İstif, fotoğraf ve yedek toplamları.</p></div><span class="counter-badge">${formatNumber((data.seflikler || []).length)} şeflik</span></div>${seflikHtml(data.seflikler)}</article>`;
    if (badge) badge.textContent = "Güncellendi " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }

  async function loadReport(force) {
    if (loading) return;
    if (!force && loadedAt && Date.now() - loadedAt < 30000) return;
    const content = document.getElementById("systemReportContentV31");
    const button = document.getElementById("systemReportRefreshV31");
    loading = true;
    if (button) { button.disabled = true; button.textContent = "Yükleniyor…"; }
    if (content && !loadedAt) content.innerHTML = '<div class="system-report-empty-v31">Kullanıcılar, cihazlar, Drive ve şeflik kayıtları kontrol ediliyor…</div>';
    try {
      const data = await edge("admin_system_report", { limit: 10000 });
      loadedAt = Date.now();
      render(data);
    } catch (error) {
      if (content) content.innerHTML = `<div class="system-report-empty-v31">${esc(error && error.message || error)}</div>`;
      toast(clean(error && error.message || error));
    } finally {
      loading = false;
      if (button) { button.disabled = false; button.textContent = "Canlı Veriyi Yenile"; }
    }
  }

  function boot() {
    installUi();
    const observer = new MutationObserver(() => installUi());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
    clearInterval(timer);
    timer = setInterval(() => {
      const page = document.getElementById(PAGE_ID);
      if (page && page.classList.contains("is-active") && !document.hidden) loadReport(true);
    }, 60000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
