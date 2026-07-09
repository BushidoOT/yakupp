import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY_PUBLIC") || "";
const ADMIN_KEY = Deno.env.get("MESAHA_ADMIN_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

type JsonObj = Record<string, unknown>;

function clean(v: unknown): string { return String(v ?? "").trim(); }
function lower(v: unknown): string { return clean(v).toLocaleLowerCase("tr-TR"); }
function json(data: JsonObj, status = 200): Response { return new Response(JSON.stringify(data), { status, headers: corsHeaders }); }
async function bodyJson(req: Request): Promise<JsonObj> { try { return await req.json(); } catch { return {}; } }
function clientIp(req: Request): string {
  const h = req.headers;
  const raw = h.get("x-forwarded-for") || h.get("cf-connecting-ip") || h.get("x-real-ip") || "";
  return clean(raw.split(",")[0]);
}
function requireAdmin(body: JsonObj): Response | null {
  if (!ADMIN_KEY) return json({ ok: false, error: "MESAHA_ADMIN_KEY tanımlı değil" }, 500);
  if (clean(body.admin_key) !== ADMIN_KEY) return json({ ok: false, error: "Yönetim anahtarı hatalı" }, 401);
  return null;
}
function userKeyFrom(name: unknown, seflik: unknown): string {
  const f = (s: unknown) => lower(s).replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u");
  return (f(name)+"__"+f(seflik)).replace(/[^a-z0-9_\-]+/g,"_").slice(0,120);
}
function first(...vals: unknown[]): string { for (const v of vals) { const x = clean(v); if (x) return x; } return ""; }
function obj(v: unknown): JsonObj { return v && typeof v === "object" && !Array.isArray(v) ? v as JsonObj : {}; }
function asObj(...vals: unknown[]): JsonObj { for (const v of vals) { const o = obj(v); if (Object.keys(o).length) return o; } return {}; }
function trDate(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function dayKey(v: unknown): string { const s = clean(v); if (!s) return ''; const m = s.match(/^(\d{4}-\d{2}-\d{2})/); if (m) return m[1]; const d = new Date(s); return Number.isFinite(d.getTime()) ? trDate(d) : ''; }
function monthKey(date = trDate()): string { return clean(date).slice(0,7); }
function weekKey(date = trDate()): string {
  try { const x = new Date(date + "T12:00:00Z"); const firstDay = new Date(Date.UTC(x.getUTCFullYear(),0,1)); const days = Math.floor((x.getTime() - firstDay.getTime()) / 86400000); return x.getUTCFullYear() + "-W" + String(Math.ceil((days + firstDay.getUTCDay() + 1) / 7)).padStart(2,"0"); }
  catch { return ""; }
}
function num(v: unknown): number { const n = Number(String(v ?? "").replace(",",".")); return Number.isFinite(n) ? n : 0; }
function totalsMerge(a: JsonObj, b: JsonObj): JsonObj {
  const out: JsonObj = { ...(a || {}) };
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const old = obj(out[k]); const nv = obj(v);
      out[k] = { ...old, ...nv, adet: num(old.adet) + num(nv.adet), count: num(old.count) + num(nv.count), m3: num(old.m3) + num(nv.m3 || nv.totalM3 || nv.volume) };
    } else out[k] = num(out[k]) + num(v);
  }
  return out;
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function authUserId(req: Request): Promise<string> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token || !ANON_KEY) return "";
  try {
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data } = await userClient.auth.getUser();
    return data.user?.id || "";
  } catch { return ""; }
}
async function insertEvent(row: JsonObj): Promise<void> { try { await admin.from("mesaha_security_events").insert(row); } catch { /* event yazılamazsa uygulama bozulmasın */ } }
async function activeBlock(block_type: string, block_value: string) {
  if (!block_value) return null;
  const { data, error } = await admin.from("mesaha_security_blocks").select("*").eq("active", true).eq("block_type", block_type).eq("block_value", block_value).limit(1);
  if (error) return null;
  return Array.isArray(data) && data.length ? data[0] as JsonObj : null;
}
async function upsertProfileFromGuard(req: Request, body: JsonObj, userId: string, ip: string) {
  const name = first(body.name, obj(body.user).name);
  const seflik = first(body.seflik, obj(body.user).seflik);
  let user_key = lower(first(body.userKey, body.user_key));
  if (!user_key && name && seflik) user_key = userKeyFrom(name, seflik);
  if (!userId || !user_key) return;
  const deviceInfo = asObj(body.deviceInfo, body.device_info);
  const flat = { ...body, ...deviceInfo } as JsonObj;
  const row = {
    user_id: userId,
    user_key,
    name: name || "Kullanıcı",
    seflik: seflik || "Şeflik",
    bolme_no: first(body.bolmeNo, body.bolme_no) || null,
    app_version: first(body.appVersion, body.app_version, body.fileVersion, flat.appVersion) || null,
    device_id: first(body.deviceId, body.device_id, flat.deviceId) || null,
    last_ip: ip || null,
    last_seen_at: new Date().toISOString(),
    platform: first(flat.os, flat.platform, flat.deviceType) || null,
    browser: first(flat.browser, flat.browserName) || null,
    browser_version: first(flat.browserVersion, flat.browser_version) || null,
    device_info: deviceInfo,
    payload: body,
  };
  try { await admin.from("mesaha_user_profiles").upsert(row, { onConflict: "user_id" }); } catch { /* eski şema ise sessiz geç */ }
}
async function checkAccess(req: Request, body: JsonObj) {
  const ip = clientIp(req);
  const userKey = lower(body.userKey || body.user_key);
  const deviceId = clean(body.deviceId || body.device_id);
  const blocks = [await activeBlock("ip", ip), await activeBlock("user_key", userKey), await activeBlock("device_id", deviceId)].filter(Boolean) as JsonObj[];
  const blocked = blocks.length > 0;
  const reason = blocked ? clean(blocks[0].reason) || "Yönetici engeli" : "";
  const userId = await authUserId(req);
  await upsertProfileFromGuard(req, body, userId, ip);
  await insertEvent({ user_id: userId || null, ip_address: ip || null, user_key: userKey || null, name: clean(body.name) || null, seflik: clean(body.seflik) || null, device_id: deviceId || null, app_version: clean(body.appVersion || body.app_version) || null, event_type: clean(body.action || "check").slice(0, 80), blocked, reason: reason || null, metadata: body });
  if (blocked) return json({ ok: false, blocked: true, reason, ip }, 403);
  return json({ ok: true, blocked: false, ip });
}
async function listTable(table: string, order = "updated_at", limit = 1000) {
  let q = admin.from(table).select("*").limit(limit);
  try { q = q.order(order, { ascending: false }); } catch { /* yoksa sıralamasız */ }
  const { data, error } = await q;
  if (error) return { items: [], error: error.message };
  return { items: data || [] };
}
function aggregateDaily(items: JsonObj[]) {
  const today = trDate(); const wk = weekKey(today); const mo = monthKey(today);
  const map = new Map<string, JsonObj>();
  for (const r of items || []) {
    const p = obj(r.payload); const key = first(r.user_key, p.userKey, p.user_key, r.user_id); if (!key) continue;
    const date = dayKey(first(r.date, p.date, p.day, r.created_at, p.createdAt)) || trDate(); const w = first(r.week_key, p.weekKey) || weekKey(date); const m = first(r.month_key, p.monthKey) || monthKey(date);
    const old = map.get(key) || { user_key: key, name: first(r.name, p.name), seflik: first(r.seflik, p.seflik), payload: { userKey: key, name: first(r.name, p.name), seflik: first(r.seflik, p.seflik), todayRecords: 0, todayM3: 0, weekRecordCount: 0, weekM3: 0, monthRecordCount: 0, monthM3: 0, treeTotals: {}, productTotals: {} } } as JsonObj;
    const outp = obj(old.payload);
    const count = num(first(r.record_count, p.todayRecords, p.recordCount, p.totalRecords, p.adet)); const vol = num(first(r.total_volume, p.todayM3, p.totalM3, p.m3));
    if (date === today) { outp.todayRecords = num(outp.todayRecords) + count; outp.todayM3 = num(outp.todayM3) + vol; }
    if (w === wk) { outp.weekRecordCount = num(outp.weekRecordCount) + count; outp.weekM3 = num(outp.weekM3) + vol; }
    if (m === mo) { outp.monthRecordCount = num(outp.monthRecordCount) + count; outp.monthM3 = num(outp.monthM3) + vol; }
    outp.treeTotals = totalsMerge(obj(outp.treeTotals), asObj(r.tree_totals, p.treeTotals, p.tree_totals));
    outp.productTotals = totalsMerge(obj(outp.productTotals), asObj(r.product_totals, p.productTotals, p.product_totals));
    old.payload = outp;
    old.record_count = num(outp.monthRecordCount) || Math.max(num(old.record_count), count); old.total_volume = num(outp.monthM3) || Math.max(num(old.total_volume), vol); old.updated_at = new Date().toISOString();
    map.set(key, old);
  }
  return Array.from(map.values());
}
async function adminListAll(body: JsonObj) {
  const limit = Math.min(Math.max(Number(body.limit || 2500) || 2500, 100), 5000);
  const [profiles, usage, backups, logs, daily] = await Promise.all([
    listTable("mesaha_user_profiles", "last_seen_at", limit),
    listTable("mesaha_usage_current", "last_seen_at", limit),
    listTable("mesaha_backup_slots", "updated_at", limit),
    listTable("mesaha_log_current", "updated_at", limit),
    listTable("mesaha_usage_daily", "date", limit),
  ]);
  const [events, blocks] = await Promise.all([ listTable("mesaha_security_events", "created_at", Math.min(limit, 3000)), listTable("mesaha_security_blocks", "created_at", 1000) ]);
  const dailyAgg = aggregateDaily(daily.items as JsonObj[]);
  return json({ ok: true, profiles: profiles.items, usage: [...(usage.items as JsonObj[]), ...dailyAgg], daily_usage: daily.items, backups: backups.items, logs: logs.items, events: events.items, blocks: blocks.items, errors: { profiles: profiles.error, usage: usage.error, daily_usage: daily.error, backups: backups.error, logs: logs.error, events: events.error, blocks: blocks.error } });
}
async function adminListEvents(body: JsonObj) {
  const limit = Math.min(Math.max(Number(body.limit || 500) || 500, 50), 2000);
  const { data, error } = await admin.from("mesaha_security_events").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) return json({ ok: false, error: error.message }, 500);
  return json({ ok: true, items: data || [] });
}
async function adminListBlocks() {
  const { data, error } = await admin.from("mesaha_security_blocks").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) return json({ ok: false, error: error.message }, 500);
  return json({ ok: true, items: data || [] });
}
async function adminAddBlock(req: Request, body: JsonObj) {
  const block_type = clean(body.block_type || body.type);
  const block_value = block_type === "user_key" ? lower(body.block_value || body.value) : clean(body.block_value || body.value);
  if (!block_type || !block_value) return json({ ok: false, error: "Engel tipi veya değeri boş" }, 400);

  const reason = clean(body.reason) || "Admin engeli";
  const row = { block_type, block_value, reason, active: true };

  // Aynı kullanıcı/IP daha önce engellendiyse tekrar insert yapma.
  // Eski kayıt pasif olsa bile unique index (block_type, block_value) yüzünden duplicate hatası verir.
  // Bu yüzden önce mevcut kaydı bulup aktif hale getiriyoruz.
  const { data: existingRows, error: lookupError } = await admin
    .from("mesaha_security_blocks")
    .select("*")
    .eq("block_type", block_type)
    .eq("block_value", block_value)
    .limit(1);

  if (lookupError) return json({ ok: false, error: lookupError.message }, 500);

  if (Array.isArray(existingRows) && existingRows.length) {
    const existing = existingRows[0] as JsonObj;
    const { data: updated, error: updateError } = await admin
      .from("mesaha_security_blocks")
      .update({ active: true, reason, updated_at: new Date().toISOString() })
      .eq("id", clean(existing.id))
      .select("*")
      .limit(1);

    if (updateError) return json({ ok: false, error: updateError.message }, 500);

    await insertEvent({
      ip_address: clientIp(req) || null,
      event_type: "admin_add_block_existing",
      blocked: false,
      metadata: { ...row, existing_id: clean(existing.id) },
    });

    return json({
      ok: true,
      item: Array.isArray(updated) && updated.length ? updated[0] : existing,
      duplicate: true,
      reactivated: existing.active === false,
      message: existing.active === false ? "Engel tekrar aktif edildi" : "Bu kayıt zaten engelli",
    });
  }

  const { data, error } = await admin.from("mesaha_security_blocks").insert(row).select("*").limit(1);
  if (error) {
    const old = await activeBlock(block_type, block_value);
    if (old) return json({ ok: true, item: old, duplicate: true, message: "Bu kayıt zaten engelli" });
    if (clean(error.message).toLowerCase().includes("duplicate key")) {
      return json({ ok: true, duplicate: true, message: "Bu kayıt zaten engelli" });
    }
    return json({ ok: false, error: error.message }, 500);
  }

  await insertEvent({ ip_address: clientIp(req) || null, event_type: "admin_add_block", blocked: false, metadata: row });
  return json({ ok: true, item: Array.isArray(data) ? data[0] : data });
}
async function adminRemoveBlock(req: Request, body: JsonObj) {
  const id = clean(body.id); const block_type = clean(body.block_type || body.type); const block_value = block_type === "user_key" ? lower(body.block_value || body.value) : clean(body.block_value || body.value);
  let q = admin.from("mesaha_security_blocks").update({ active: false });
  if (id) q = q.eq("id", id); else if (block_type && block_value) q = q.eq("block_type", block_type).eq("block_value", block_value); else return json({ ok: false, error: "Engel ID veya tip/değer boş" }, 400);
  const { error } = await q; if (error) return json({ ok: false, error: error.message }, 500);
  await insertEvent({ ip_address: clientIp(req) || null, event_type: "admin_remove_block", blocked: false, metadata: { id, block_type, block_value } });
  return json({ ok: true });
}
async function safeDelete(table: string, column: string, value: string) {
  if (!value) return { table, column, skipped: true };
  try { const { error, count } = await admin.from(table).delete({ count: "exact" }).eq(column, value); return { table, column, value, count: count || 0, error: error?.message || null }; }
  catch (e) { return { table, column, value, count: 0, error: e instanceof Error ? e.message : String(e) }; }
}
async function safeDeleteByAny(table: string, columns: string[], value: string) { const out = []; for (const column of columns) out.push(await safeDelete(table, column, value)); return out; }
async function safeDeleteByNameSeflik(table: string, name: string, seflik: string) {
  if (!name || !seflik) return { table, skipped: true, reason: "name/seflik boş" };
  try { const { error, count } = await admin.from(table).delete({ count: "exact" }).eq("name", name).eq("seflik", seflik); return { table, column: "name+seflik", value: `${name} / ${seflik}`, count: count || 0, error: error?.message || null }; }
  catch (e) { return { table, column: "name+seflik", value: `${name} / ${seflik}`, count: 0, error: e instanceof Error ? e.message : String(e) }; }
}
async function adminHideDriveBackup(req: Request, body: JsonObj) {
  const drive_file_id = clean(body.drive_file_id || body.file_id || body.fileId || body.id);
  if (!drive_file_id) return json({ ok: false, error: "Drive yedek ID boş" }, 400);
  const payload = { action: "admin_hide_drive_backup", drive_file_id, user_key: clean(body.user_key || body.userKey) || null, name: clean(body.name) || null, seflik: clean(body.seflik) || null, hidden_at: new Date().toISOString() };
  const supabaseDeletes = [ ...(await safeDeleteByAny("mesaha_backup_slots", ["drive_file_id", "driveFileId", "file_id", "fileId", "id", "slot_id"], drive_file_id)), ...(await safeDeleteByAny("mesaha_backup_chunks", ["drive_file_id", "driveFileId", "file_id", "fileId", "slot_id"], drive_file_id)) ];
  const [{ error: eventError }, { error: logError }] = await Promise.all([ admin.from("mesaha_security_events").insert({ ip_address: clientIp(req) || null, event_type: "admin_hide_drive_backup", blocked: false, metadata: payload }), admin.from("mesaha_log_current").insert({ level: "admin_hidden_drive_backup", message: "Drive yedeği panelden gizlendi", payload }) ]);
  if (eventError && logError) return json({ ok: false, error: eventError.message || logError.message }, 500);
  return json({ ok: true, supabaseDeletes, warnings: { events: eventError?.message || null, logs: logError?.message || null } });
}
async function adminDeleteUser(req: Request, body: JsonObj) {
  let user_id = clean(body.user_id || body.userId); let user_key = lower(body.user_key || body.userKey); const name = clean(body.name); const seflik = clean(body.seflik);
  if (!user_id && user_key) { const { data } = await admin.from("mesaha_user_profiles").select("user_id,user_key").eq("user_key", user_key).limit(1); if (Array.isArray(data) && data[0]) user_id = clean((data[0] as JsonObj).user_id); }
  if (!user_key && user_id) { const { data } = await admin.from("mesaha_user_profiles").select("user_id,user_key").eq("user_id", user_id).limit(1); if (Array.isArray(data) && data[0]) user_key = lower((data[0] as JsonObj).user_key); }
  if (!user_id && !user_key && name && seflik) user_key = userKeyFrom(name, seflik);
  if (!user_id && !user_key) return json({ ok: false, error: "Kullanıcı kimliği bulunamadı" }, 400);
  const results = [] as unknown[];
  if (user_id) {
    results.push(await safeDelete("mesaha_backup_chunks", "user_id", user_id)); results.push(await safeDelete("mesaha_backup_slots", "user_id", user_id)); results.push(await safeDelete("mesaha_usage_daily", "user_id", user_id)); results.push(await safeDelete("mesaha_usage_current", "user_id", user_id)); results.push(await safeDelete("mesaha_log_current", "user_id", user_id)); results.push(await safeDelete("mesaha_user_profiles", "user_id", user_id));
    try { const { error } = await admin.auth.admin.deleteUser(user_id); results.push({ table: "auth.users", column: "id", value: user_id, error: error?.message || null }); } catch (e) { results.push({ table: "auth.users", column: "id", value: user_id, error: e instanceof Error ? e.message : String(e) }); }
  }
  if (user_key) {
    results.push(...(await safeDeleteByAny("mesaha_backup_chunks", ["user_key", "userKey"], user_key))); results.push(...(await safeDeleteByAny("mesaha_backup_slots", ["user_key", "userKey"], user_key))); results.push(...(await safeDeleteByAny("mesaha_usage_daily", ["user_key", "userKey"], user_key))); results.push(...(await safeDeleteByAny("mesaha_usage_current", ["user_key", "userKey"], user_key))); results.push(...(await safeDeleteByAny("mesaha_log_current", ["user_key", "userKey"], user_key))); results.push(...(await safeDeleteByAny("mesaha_security_events", ["user_key", "userKey"], user_key))); results.push(await safeDelete("mesaha_user_profiles", "user_key", user_key));
    try { await admin.from("mesaha_security_blocks").update({ active: false }).eq("block_type", "user_key").eq("block_value", user_key); } catch { /* yoksa sorun değil */ }
  }
  if (name && seflik) { results.push(await safeDeleteByNameSeflik("mesaha_backup_slots", name, seflik)); results.push(await safeDeleteByNameSeflik("mesaha_usage_daily", name, seflik)); results.push(await safeDeleteByNameSeflik("mesaha_usage_current", name, seflik)); results.push(await safeDeleteByNameSeflik("mesaha_user_profiles", name, seflik)); }
  const ids = Array.isArray(body.drive_file_ids) ? body.drive_file_ids.map((x) => clean(x)).filter(Boolean).slice(0, 250) : [];
  for (const drive_file_id of ids) {
    results.push(...(await safeDeleteByAny("mesaha_backup_slots", ["drive_file_id", "driveFileId", "file_id", "fileId", "id", "slot_id"], drive_file_id))); results.push(...(await safeDeleteByAny("mesaha_backup_chunks", ["drive_file_id", "driveFileId", "file_id", "fileId", "slot_id"], drive_file_id)));
    const payload = { action: "admin_hide_drive_backup", drive_file_id, user_key, name, seflik, hidden_at: new Date().toISOString(), reason: "admin_delete_user" };
    await Promise.allSettled([ admin.from("mesaha_security_events").insert({ ip_address: clientIp(req) || null, event_type: "admin_hide_drive_backup", blocked: false, metadata: payload }), admin.from("mesaha_log_current").insert({ level: "admin_hidden_drive_backup", message: "Kullanıcı silindiği için Drive yedeği panelden gizlendi", payload }) ]);
  }
  await insertEvent({ ip_address: clientIp(req) || null, event_type: "admin_delete_user", blocked: false, metadata: { user_id, user_key, name, seflik, drive_file_count: ids.length, results } });
  return json({ ok: true, user_id, user_key, results });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Sadece POST" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ ok: false, error: "Supabase Edge Function secret eksik" }, 500);
  const body = await bodyJson(req); const action = clean(body.action || "check");
  try {
    if (action.startsWith("admin_")) {
      const denied = requireAdmin(body); if (denied) return denied;
      if (action === "admin_list_all") return await adminListAll(body);
      if (action === "admin_list_events") return await adminListEvents(body);
      if (action === "admin_list_blocks") return await adminListBlocks();
      if (action === "admin_add_block") return await adminAddBlock(req, body);
      if (action === "admin_remove_block") return await adminRemoveBlock(req, body);
      if (action === "admin_hide_drive_backup") return await adminHideDriveBackup(req, body);
      if (action === "admin_delete_user") return await adminDeleteUser(req, body);
      return json({ ok: false, error: "Bilinmeyen admin işlem" }, 400);
    }
    return await checkAccess(req, body);
  } catch (e) { return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500); }
});
