/* Mesaha İO güncelleme yöneticisi — sürüm bilgisi yalnız release.js üzerinden okunur. */
(function (root) {
  "use strict";

  const clean = (value) => String(value == null ? "" : value).trim();
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function release() {
    return root.MESAHA_RELEASE || { build: 0, version: "stable", assetToken: "stable", cacheName: "yakupp-suite-shell-stable" };
  }

  async function flushData() {
    try {
      if (root.MesahaStorageV627 && typeof root.MesahaStorageV627.flush === "function") await root.MesahaStorageV627.flush();
    } catch (_) {}
  }

  function workerScript(info) {
    const data = info || release();
    const url = new URL("../service-worker.js", location.href);
    url.searchParams.set("release", clean(data.assetToken || data.build || "stable"));
    url.searchParams.set("fresh", String(Date.now()));
    return url.href;
  }

  function workerMessage(worker, data, timeout) {
    return new Promise((resolve, reject) => {
      if (!worker) return reject(new Error("Service worker hazır değil."));
      const channel = new MessageChannel();
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        reject(new Error("Service worker yanıt vermedi."));
      }, Number(timeout || 20000));
      channel.port1.onmessage = (event) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(event.data || {});
      };
      try { worker.postMessage(data, [channel.port2]); }
      catch (error) { clearTimeout(timer); reject(error); }
    });
  }

  async function waitForWorker(registration, timeout) {
    const start = Date.now();
    while (Date.now() - start < Number(timeout || 30000)) {
      const worker = registration.waiting || registration.active || navigator.serviceWorker.controller;
      if (worker && worker.state !== "installing") return worker;
      await wait(250);
    }
    return registration.waiting || registration.active || navigator.serviceWorker.controller || null;
  }

  async function fetchRemote(options) {
    if (!root.MesahaRelease || typeof root.MesahaRelease.fetchRemote !== "function") return release();
    return root.MesahaRelease.fetchRemote({ ...(options || {}), app: "mesaha" });
  }

  async function workerStatus(worker) {
    try { return await workerMessage(worker, { type: "GET_STATUS" }, 9000); }
    catch (error) { return { ready: false, error: clean(error && error.message || error) }; }
  }

  async function clearOldCaches(keepName) {
    if (!("caches" in root)) return [];
    const keep = clean(keepName || release().cacheName);
    const keys = await caches.keys();
    const deleted = [];
    await Promise.all(keys.map(async (name) => {
      if (!/^yakupp-suite-shell-/i.test(name) || name === keep) return;
      try { if (await caches.delete(name)) deleted.push(name); } catch (_) {}
    }));
    return deleted;
  }

  async function installLatest(remote) {
    await flushData();
    if (!("serviceWorker" in navigator)) return { ok: true, serviceWorker: false, remote: remote || release() };
    const target = remote || await fetchRemote().catch(() => release());
    let registration = await navigator.serviceWorker.register(workerScript(target), { scope: "../", updateViaCache: "none" });
    try { await registration.update(); } catch (_) {}
    let worker = await waitForWorker(registration, 35000);
    if (registration.waiting) {
      try { await workerMessage(registration.waiting, { type: "SKIP_WAITING" }, 10000); } catch (_) {}
      await wait(500);
      registration = await navigator.serviceWorker.getRegistration("../").catch(() => registration) || registration;
      worker = registration.active || navigator.serviceWorker.controller || worker;
    }
    if (worker) workerMessage(worker, { type: "WARM_CACHE", source: "mesaha-update" }, 45000).catch(() => {});
    const status = worker ? await Promise.race([workerStatus(worker), wait(4500).then(() => ({ ready: true, warming: true }))]) : { ready: true, serviceWorker: false };
    await clearOldCaches(target.cacheName || release().cacheName);
    return { ok: status.ready !== false, serviceWorker: true, targetBuild: Number(target.build || release().build || 0), remote: target, status };
  }

  async function repair() {
    await flushData();
    if (!("serviceWorker" in navigator)) return { ok: true, serviceWorker: false };
    let registration = await navigator.serviceWorker.getRegistration("../").catch(() => null);
    if (!registration) registration = await navigator.serviceWorker.register(workerScript(release()), { scope: "../", updateViaCache: "none" });
    const worker = registration.active || registration.waiting || navigator.serviceWorker.controller || await waitForWorker(registration, 25000);
    if (!worker) return installLatest(release());
    workerMessage(worker, { type: "WARM_CACHE", source: "mesaha-repair" }, 45000).catch(() => {});
    const result = await Promise.race([workerStatus(worker), wait(3500).then(() => ({ ready: true, warming: true }))]);
    return { ok: true, repaired: true, preserved: true, targetBuild: Number(release().build || 0), status: result };
  }

  async function check() {
    const local = release();
    try {
      const remote = await fetchRemote();
      return { remote, newer: Number(remote.build || 0) > Number(local.build || 0), unavailable: false };
    } catch (error) {
      return { remote: local, newer: false, unavailable: true, error: clean(error && error.message || error) };
    }
  }

  async function updateAndReload() {
    await flushData();
    const url = new URL("./guncelle.html", location.href);
    url.searchParams.set("fresh", String(Date.now()));
    location.replace(url.href);
    return { ok: true, redirecting: true };
  }

  async function executeUpdatePage() {
    return installLatest(await fetchRemote().catch(() => release()));
  }

  const api = Object.freeze({
    apiVersion: "stable",
    repair,
    clearOldCaches,
    updateAndReload,
    executeUpdatePage,
    installLatest,
    check,
    fetchRemote,
    flushData,
    workerStatus,
    verifiedStatus(status) { return !!(status && status.ready); }
  });

  root.MesahaUpdate = api;
  root.MesahaUpdateV527 = api;
  root.MesahaUpdateV627 = api;
  root.MesahaUpdateV637 = api;
})(window);
