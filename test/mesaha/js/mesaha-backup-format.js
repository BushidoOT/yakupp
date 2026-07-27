"use strict";

/*
 * Mesaha İO yedek biçimi uyumluluk katmanı.
 *
 * Desteklenen güvenli biçimler:
 *  - [record, ...]
 *  - { records: [...], settings: {...} }
 *  - { payload: { records: [...], settings: {...} } }
 *  - { payload: "{...}" } veya { payloadText: "{...}" }
 *
 * Buradaki amaç eski bulut yedeklerini yükleyebilmek; rastgele bir JSON
 * nesnesini kayıt listesi gibi kabul etmemektir.
 */
(function installMesahaBackupFormat(root) {
  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function parseJsonObject(value, label) {
    if (typeof value !== "string") return value;
    const text = value.trim();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (_) {
      throw new Error(`${label || "Yedek"} JSON içeriği okunamadı.`);
    }
  }

  function unwrap(input) {
    let source = parseJsonObject(input, "Yedek");
    if (Array.isArray(source)) return { records: source, settings: null, envelope: source };
    if (!isObject(source)) throw new Error("Yedek biçimi geçersiz.");

    // Bazı eski yedekler payloadText kullanır.
    if (!source.payload && typeof source.payloadText === "string") {
      source = { ...source, payload: parseJsonObject(source.payloadText, "Yedek payload") };
    }

    let payload = source.payload;
    if (typeof payload === "string") payload = parseJsonObject(payload, "Yedek payload");

    const nested = isObject(payload) ? payload : null;
    const records = Array.isArray(source.records)
      ? source.records
      : nested && Array.isArray(nested.records)
        ? nested.records
        : null;
    if (!records) throw new Error("Yedek içinde kayıt listesi bulunamadı.");

    const settings = isObject(source.settings)
      ? source.settings
      : nested && isObject(nested.settings)
        ? nested.settings
        : null;

    return {
      records,
      settings,
      envelope: source,
      payload: nested,
      meta: isObject(source.meta) ? source.meta : null,
    };
  }

  const api = Object.freeze({ extract: unwrap });
  if (root) root.MesahaBackupFormat = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
