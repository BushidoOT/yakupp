// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY_PUBLIC") || "";
const DRIVE_SCRIPT_URL = Deno.env.get("MESAHA_DRIVE_SCRIPT_URL") || "";
const DRIVE_SECRET = Deno.env.get("MESAHA_DRIVE_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

type JsonObj = Record<string, unknown>;

const TABLES = {
  profiles: "mesaha_user_profiles",
  usageCurrent: "mesaha_usage_current",
  usageDaily: "mesaha_usage_daily",
  backupSlots: "mesaha_backup_slots",
  backupChunks: "mesaha_backup_chunks",
  logs: "mesaha_log_current",
  events: "mesaha_security_events",
  blocks: "mesaha_security_blocks",
  seflikRecords: "mesaha_seflik_records",
  seflikSyncs: "mesaha_seflik_syncs",
  seflikDivisions: "mesaha_seflik_divisions",
  adminAccounts: "mesaha_admin_accounts",
  adminSessions: "mesaha_admin_sessions",
  adminAudit: "mesaha_admin_audit_logs",
  rateLimits: "mesaha_rate_limits",
  requestDedup: "mesaha_request_dedup",
  userAccess: "mesaha_user_access",
  userAuthEvents: "mesaha_user_auth_events",
};

const IST_TZ = "Europe/Istanbul";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}
function lower(v: unknown): string {
  return clean(v).toLocaleLowerCase("tr-TR");
}
function json(data: JsonObj, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}
async function bodyJson(req: Request): Promise<JsonObj> {
  try {
    const j = await req.json();
    return obj(j);
  } catch {
    return {};
  }
}
function obj(v: unknown): JsonObj {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as JsonObj) : {};
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function first(...vals: unknown[]): string {
  for (const v of vals) {
    const x = clean(v);
    if (x) return x;
  }
  return "";
}
function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function bool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = lower(v);
  return s === "true" || s === "1" || s === "yes" || s === "evet";
}
function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items.filter(Boolean))) as T[];
}
function safeDateMs(v: unknown): number {
  const s = clean(v);
  if (!s) return 0;
  const n = Date.parse(s);
  return Number.isFinite(n) ? n : 0;
}
function nowIso(): string {
  return new Date().toISOString();
}
function trDate(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
function dayKey(v?: unknown): string {
  const s = clean(v);
  if (!s) return trDate();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? trDate(new Date(ms)) : trDate();
}
function monthKey(date = trDate()): string {
  return clean(date).slice(0, 7);
}
function weekKey(date = trDate()): string {
  try {
    const x = new Date(date + "T12:00:00Z");
    const firstDay = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
    const days = Math.floor((x.getTime() - firstDay.getTime()) / 86400000);
    return x.getUTCFullYear() + "-W" + String(Math.ceil((days + firstDay.getUTCDay() + 1) / 7)).padStart(2, "0");
  } catch {
    return "";
  }
}
function fold(s: unknown): string {
  return lower(s)
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}
function userKeyFrom(name: unknown, seflik: unknown): string {
  return (fold(name) + "__" + fold(seflik)).replace(/[^a-z0-9_\-]+/g, "_").slice(0, 120);
}
function getPath(data: unknown, path: string): unknown {
  let cur: any = data;
  for (const part of path.split(".")) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[part];
  }
  return cur;
}
function pick(data: unknown, paths: string[]): string {
  for (const p of paths) {
    const v = getPath(data, p);
    const s = clean(v);
    if (s) return s;
  }
  return "";
}
function pickNum(data: unknown, paths: string[]): number {
  for (const p of paths) {
    const v = getPath(data, p);
    const n = num(v);
    if (n) return n;
  }
  return 0;
}
function pickObj(data: unknown, paths: string[]): JsonObj {
  for (const p of paths) {
    const v = getPath(data, p);
    const o = obj(v);
    if (Object.keys(o).length) return o;
  }
  return {};
}
function normalizeBlockValue(type: string, value: unknown): string {
  const t = clean(type);
  if (t === "user_key") return lower(value);
  return clean(value);
}
function ipCandidate(v: unknown): string {
  let s = clean(v);
  if (!s || /^unknown$/i.test(s)) return "";
  s = s.replace(/^for=/i, "").replace(/^\"|\"$/g, "");
  if (s.startsWith("[")) s = s.slice(1, s.indexOf("]") > 0 ? s.indexOf("]") : undefined);
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(s)) s = s.replace(/:\d+$/, "");
  if (s.startsWith("::ffff:")) s = s.slice(7);
  if (!/[.:]/.test(s)) return "";
  return s.slice(0, 120);
}
function clientIpInfo(req: Request, body?: JsonObj) {
  const h = req.headers;
  const forwarded = clean(h.get("forwarded") || "");
  const forwardedFor = (forwarded.match(/for=([^;,]+)/i) || [])[1] || "";
  const rawCandidates = [
    h.get("cf-connecting-ip"),
    h.get("x-forwarded-for"),
    h.get("x-real-ip"),
    h.get("x-client-ip"),
    h.get("fastly-client-ip"),
    h.get("true-client-ip"),
    forwardedFor,
    h.get("fly-client-ip"),
    body?.ip,
    body?.lastIp,
    body?.last_ip,
    body?.ipAddress,
    body?.ip_address,
  ];
  const candidates: string[] = [];
  for (const raw of rawCandidates) {
    const parts = clean(raw).split(",");
    for (const part of parts) {
      const ip = ipCandidate(part);
      if (ip) candidates.push(ip);
    }
  }
  const all = unique(candidates);
  return {
    ip: all[0] || "",
    source: all[0] ? "edge-header" : "none",
    candidates: all.slice(0, 10),
    headers: {
      cf: clean(h.get("cf-connecting-ip") || ""),
      xff: clean(h.get("x-forwarded-for") || "").slice(0, 300),
      real: clean(h.get("x-real-ip") || ""),
      forwarded: forwarded.slice(0, 300),
    },
  };
}
function bearerToken(req: Request): string {
  return clean((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));
}
function parseJwtClaimsValue(token: string): JsonObj {
  if (!token.includes(".")) return {};
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return obj(JSON.parse(atob(padded)));
  } catch {
    return {};
  }
}
function parseJwtClaims(req: Request): JsonObj {
  return parseJwtClaimsValue(bearerToken(req));
}
function parseJwtSub(req: Request): string {
  return clean(parseJwtClaims(req).sub);
}
async function hashText(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(clean(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
function errorText(e: unknown): string {
  return e instanceof Error ? e.message : clean(e || "Bilinmeyen hata");
}
function isMissingColumn(error: unknown): boolean {
  const m = lower(errorText(error));
  return m.includes("column") && (m.includes("does not exist") || m.includes("not found"));
}
function isMissingTable(error: unknown): boolean {
  const m = lower(errorText(error));
  return (m.includes("relation") && m.includes("does not exist")) || m.includes("could not find the table") || (m.includes("schema cache") && m.includes("table"));
}
function totalsMerge(a: JsonObj, b: JsonObj): JsonObj {
  const out: JsonObj = { ...(a || {}) };
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const old = obj(out[k]);
      const nv = obj(v);
      out[k] = {
        ...old,
        ...nv,
        adet: num(old.adet) + num(nv.adet ?? nv.count ?? nv.record_count),
        count: num(old.count) + num(nv.count ?? nv.adet ?? nv.record_count),
        m3: num(old.m3) + num(nv.m3 ?? nv.totalM3 ?? nv.total_volume ?? nv.volume),
      };
    } else {
      out[k] = num(out[k]) + num(v);
    }
  }
  return out;
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function authContext(req: Request) {
  const token = bearerToken(req);
  const claims = parseJwtClaimsValue(token);
  if (!token || !ANON_KEY) return { token, claims, userId: "", email: "", sessionId: "", user: null, error: "Oturum bulunamadı" };
  try {
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await userClient.auth.getUser();
    if (error || !data.user?.id) return { token, claims, userId: "", email: "", sessionId: "", user: null, error: error?.message || "Oturum geçersiz" };
    return {
      token,
      claims,
      userId: clean(data.user.id),
      email: lower(data.user.email || claims.email),
      sessionId: clean(claims.session_id || claims.sessionId || (claims.sub && claims.iat ? `${claims.sub}:${claims.iat}` : "")),
      user: data.user,
      error: "",
    };
  } catch (e) {
    return { token, claims, userId: "", email: "", sessionId: "", user: null, error: errorText(e) };
  }
}
async function authUserId(req: Request): Promise<string> {
  const ctx = await authContext(req);
  return clean(ctx.userId || parseJwtSub(req));
}
function authProviders(user: any): string[] {
  const out: string[] = [];
  try { for (const x of arr(user?.identities)) { const p = clean(obj(x).provider); if (p) out.push(p); } } catch {}
  try { for (const p of arr(obj(user?.app_metadata).providers)) { if (clean(p)) out.push(clean(p)); } } catch {}
  const primary = clean(obj(user?.app_metadata).provider); if (primary) out.push(primary);
  return unique(out);
}
function googleIdentity(user: any): JsonObj {
  for (const raw of arr(user?.identities)) {
    const x = obj(raw);
    if (clean(x.provider) === "google") return x;
  }
  return {};
}
function googleDisplayName(user: any): string {
  const names: string[] = [];
  const add = (v: any) => { const t = clean(v).replace(/\s+/g, ' '); if (t && !t.includes('@') && !names.includes(t)) names.push(t); };
  try { const m = obj(user?.user_metadata); add(m.full_name); add(m.name); add(m.display_name); } catch {}
  try { const gd = obj(googleIdentity(user).identity_data); add(gd.full_name); add(gd.name); add(gd.display_name); if (gd.given_name && gd.family_name) add(`${gd.given_name} ${gd.family_name}`); } catch {}
  return clean(names.find((n) => n.length >= 2 && !/^(google|user|kullanıcı|kullanici)$/i.test(n)) || '').slice(0, 120);
}
function isGoogleUser(user: any): boolean {
  return authProviders(user).includes("google") && user?.is_anonymous !== true;
}
function accessView(row: JsonObj | null, ctx?: any): JsonObj {
  const r = obj(row);
  const status = clean(r.status || "unregistered");
  return {
    user_id: clean(r.user_id || ctx?.userId), email: lower(r.email || ctx?.email), status,
    name: clean(r.canonical_name), seflik: clean(r.canonical_seflik), user_key: clean(r.user_key), bolme_no: clean(r.bolme_no),
    requested_name: clean(r.requested_name), requested_seflik: clean(r.requested_seflik), reason: clean(r.reason),
    requested_at: r.requested_at || null, approved_at: r.approved_at || null, updated_at: r.updated_at || null,
  };
}
async function userAuthEvent(row: JsonObj): Promise<void> {
  try { await admin.from(TABLES.userAuthEvents).insert({
    user_id: clean(row.user_id) || null, email: lower(row.email) || null,
    event_type: clean(row.event_type || "google_auth_event").slice(0, 100), success: row.success !== false,
    ip_address: clean(row.ip_address) || null, device_id: clean(row.device_id) || null,
    reason: clean(row.reason).slice(0, 500) || null, metadata: obj(row.metadata), created_at: nowIso(),
  }); } catch {}
}
async function googleUserContext(req: Request, body: JsonObj) {
  const ctx: any = await authContext(req);
  if (!ctx.userId) return { response: json({ ok: false, error: "Google oturumu bulunamadı" }, 401) };
  if (!isGoogleUser(ctx.user)) {
    await userAuthEvent({ user_id: ctx.userId, email: ctx.email, event_type: "google_required", success: false, ip_address: clientIpInfo(req, body).ip });
    return { response: json({ ok: false, google_required: true, error: "Google ile doğrulanmış kullanıcı oturumu gerekli" }, 403) };
  }
  return ctx;
}
async function approvedAccessContext(req: Request, body: JsonObj) {
  const ctx: any = await googleUserContext(req, body);
  if (ctx.response) return ctx;
  const access = obj(await selectFirst(TABLES.userAccess, { user_id: ctx.userId }));
  if (clean(access.status) !== "approved") {
    return { response: json({ ok: false, access_required: true, access: accessView(access, ctx), error: "Yönetici onayı gerekli" }, 403) };
  }
  const ipInfo = clientIpInfo(req, body);
  const googleName = googleDisplayName(ctx.user);
  const canonicalName = first(googleName, access.canonical_name);
  const canonicalBody: JsonObj = { ...body,
    name: clean(canonicalName), googleFullName: googleName || undefined, seflik: clean(access.canonical_seflik),
    userKey: clean(access.user_key), user_key: clean(access.user_key), bolmeNo: first(access.bolme_no, body.bolmeNo, body.bolme_no),
  };
  const profile = profileValues(canonicalBody, ctx.userId, ipInfo);
  profile.name = clean(canonicalName); profile.seflik = clean(access.canonical_seflik); profile.user_key = clean(access.user_key);
  /* Google geçişinde eski user_key / IP / device_id engelleri mevcut gerçek cihazları yanlış kilitleyebiliyordu.
     Onaylı Google kullanıcılarında kesin engel yalnız doğrulanmış Supabase user_id üzerinden uygulanır.
     Kullanıcının Google erişimini kapatmak için admin_user_access_revoke da kullanılabilir. */
  const block = await activeBlock("user_id", ctx.userId);
  if (block) return { response: json({ ok: false, blocked: true, block_type: "user_id", reason: first(block.reason, "Yönetici engeli") }, 403) };
  return { ...ctx, access, profile, ipInfo, userKey: clean(access.user_key) };
}
async function userAccessStatus(req: Request, body: JsonObj) {
  const ctx: any = await googleUserContext(req, body); if (ctx.response) return ctx.response;
  const row = obj(await selectFirst(TABLES.userAccess, { user_id: ctx.userId }));
  if (Object.keys(row).length) {
    try { await admin.from(TABLES.userAccess).update({ last_seen_at: nowIso(), last_ip: clientIpInfo(req, body).ip || null }).eq("user_id", ctx.userId); } catch {}
  }
  return json({ ok: true, access: accessView(row, ctx) });
}
async function userAccessRequest(req: Request, body: JsonObj) {
  const ctx: any = await googleUserContext(req, body); if (ctx.response) return ctx.response;
  const googleName = googleDisplayName(ctx.user);
  const name = first(googleName, body.googleFullName, body.google_full_name, body.name).slice(0, 120), seflik = clean(body.seflik).slice(0, 120);
  if (!hasIdentityForAdmin({ name, seflik })) return json({ ok: false, error: "Geçerli kullanıcı adı ve şeflik gerekli" }, 400);
  const ipInfo = clientIpInfo(req, body), device = { ...obj(body.deviceInfo), ...obj(body.device_info) };
  const deviceId = first(body.deviceId, body.device_id, device.deviceId, device.device_id).slice(0, 120);
  const rate = await takeRate(`google-access-request:${ctx.userId}`, 5, 3600, 3600);
  if (rate.allowed === false) return json({ ok: false, error: "Çok fazla erişim talebi gönderildi", retry_after: num(rate.retry_after) }, 429);
  const old = obj(await selectFirst(TABLES.userAccess, { user_id: ctx.userId }));
  if (clean(old.status) === "approved") return json({ ok: true, access: accessView(old, ctx), already_approved: true });
  const gi = googleIdentity(ctx.user), gd = obj(gi.identity_data);
  const row = {
    user_id: ctx.userId, email: lower(ctx.email), google_subject: first(gd.sub, gi.id),
    requested_name: name, requested_seflik: seflik, canonical_name: name, canonical_seflik: seflik, user_key: userKeyFrom(name, seflik), status: "approved", reason: null,
    requested_at: nowIso(), last_seen_at: nowIso(), last_ip: clean(ipInfo.ip) || null,
    device_id: deviceId || null, device_info: device, metadata: { app_version: clean(body.appVersion), provider: "google", google_full_name: googleName || null, request_source: "edge-v560-auto-approved" },
  };
  const { error } = await admin.from(TABLES.userAccess).upsert(row, { onConflict: "user_id" });
  if (error) return json({ ok: false, error: error.message }, 500);
  await userAuthEvent({ user_id: ctx.userId, email: ctx.email, event_type: "google_access_auto_approved_edge_v560", success: true, ip_address: ipInfo.ip, device_id: deviceId, metadata: { name, seflik, google_full_name: googleName || null } });
  return json({ ok: true, access: accessView(row, ctx) });
}
async function rateStatus(key: string) {
  const { data, error } = await admin.rpc("mesaha_rate_limit_status", { p_key: key });
  if (error) throw new Error("V5.47/V5.48 güvenlik SQL migration eksik: " + error.message);
  return obj(data);
}
async function takeRate(key: string, limit: number, windowSeconds: number, blockSeconds: number) {
  const { data, error } = await admin.rpc("mesaha_take_rate_limit", {
    p_key: key,
    p_limit: Math.max(1, Math.round(limit)),
    p_window_seconds: Math.max(1, Math.round(windowSeconds)),
    p_block_seconds: Math.max(1, Math.round(blockSeconds)),
  });
  if (error) throw new Error("V5.47/V5.48 güvenlik SQL migration eksik: " + error.message);
  return obj(data);
}
async function resetRate(key: string) {
  try { await admin.rpc("mesaha_reset_rate_limit", { p_key: key }); } catch {}
}
async function adminAudit(row: JsonObj): Promise<void> {
  try {
    await admin.from(TABLES.adminAudit).insert({
      user_id: clean(row.user_id) || null,
      email: lower(row.email) || null,
      session_id: clean(row.session_id) || null,
      ip_address: clean(row.ip_address) || null,
      event_type: clean(row.event_type || "admin_event").slice(0, 100),
      success: row.success === true,
      reason: clean(row.reason).slice(0, 500) || null,
      metadata: obj(row.metadata),
      created_at: row.created_at || nowIso(),
    });
  } catch {
    // Güvenlik logu ana işlemi bozmaz.
  }
}
async function adminLogin(req: Request, body: JsonObj) {
  if (!ANON_KEY) return json({ ok: false, error: "SUPABASE_ANON_KEY tanımlı değil" }, 500);
  const email = lower(body.email || body.username).slice(0, 320);
  const password = clean(body.password);
  const ip = clean(clientIpInfo(req, body).ip);
  const userAgent = clean(req.headers.get("user-agent") || "").slice(0, 500);
  const emailKey = "admin-login-email:" + await hashText(email || "invalid");
  const ipKey = "admin-login-ip:" + await hashText(ip || "unknown");

  /* V5.50 geçiş kararı:
     Admin hatalı girişleri audit loguna yazılır; ancak süreli giriş kilidi şimdilik uygulanmaz.
     Supabase Auth kendi servis korumalarını uygulamaya devam eder. */
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12 || password.length > 256) {
    await adminAudit({ email, ip_address: ip, event_type: "admin_login", success: false, reason: "invalid_input", metadata: { timed_lock_disabled: true } });
    return json({ ok: false, locked: false, retry_after: 0, error: "E-posta veya parola hatalı" }, 401);
  }

  const authClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user?.id) {
    await adminAudit({ email, ip_address: ip, event_type: "admin_login", success: false, reason: "invalid_credentials", metadata: { timed_lock_disabled: true } });
    return json({ ok: false, locked: false, retry_after: 0, error: "E-posta veya parola hatalı" }, 401);
  }

  const userId = clean(data.user.id);
  const account = await selectFirst(TABLES.adminAccounts, { user_id: userId });
  if (!account || obj(account).active === false) {
    try { await authClient.auth.signOut({ scope: "global" }); } catch {}
    await adminAudit({ user_id: userId, email, ip_address: ip, event_type: "admin_login", success: false, reason: "not_authorized_admin", metadata: { timed_lock_disabled: true } });
    return json({ ok: false, locked: false, retry_after: 0, error: "E-posta veya parola hatalı" }, 403);
  }

  const claims = parseJwtClaimsValue(clean(data.session.access_token));
  const sessionId = clean(claims.session_id || claims.sessionId || `${userId}:${claims.iat || Date.now()}`);
  await admin.from(TABLES.adminSessions).upsert({
    session_id: sessionId,
    user_id: userId,
    created_at: nowIso(),
    last_seen_at: nowIso(),
    revoked_at: null,
    ip_address: ip || null,
    user_agent: userAgent || null,
    metadata: { provider: "password", app: "Mesaha İO Yönetim" },
  }, { onConflict: "session_id" });
  await admin.from(TABLES.adminAccounts).update({ last_login_at: nowIso(), last_login_ip: ip || null, updated_at: nowIso() }).eq("user_id", userId);
  /* Önceki sürümden kalmış süreli kilit kovalarını başarılı girişte temizle. */
  await Promise.all([resetRate(emailKey), resetRate(ipKey)]);
  await adminAudit({ user_id: userId, email, session_id: sessionId, ip_address: ip, event_type: "admin_login", success: true, metadata: { provider: "password", timed_lock_disabled: true } });
  return json({ ok: true, session: data.session, admin: { user_id: userId, email, display_name: clean(obj(account).display_name), session_id: sessionId } });
}
async function requireAdminAuth(req: Request, action = "admin_action") {
  const ctx: any = await authContext(req);
  if (!ctx.userId || !ctx.sessionId) {
    return { response: json({ ok: false, error: "Yönetim oturumu geçersiz" }, 401) };
  }

  const [account, session] = await Promise.all([
    selectFirst(TABLES.adminAccounts, { user_id: ctx.userId }),
    selectFirst(TABLES.adminSessions, { session_id: ctx.sessionId }),
  ]);

  if (!account || obj(account).active === false) {
    return { response: json({ ok: false, error: "Yönetim yetkisi bulunamadı" }, 403) };
  }

  if (!session || clean(obj(session).revoked_at)) {
    return { response: json({ ok: false, revoked: true, error: "Yönetim oturumu kapatılmış" }, 401) };
  }

  const mutation = !/^admin_(list|security_logs)/.test(action);
  const rateKey = `admin-action:${ctx.userId}:${mutation ? "mutation" : "read"}`;
  const rate = await takeRate(rateKey, mutation ? 15 : 20, 60, mutation ? 120 : 60);

  if (rate.allowed === false) {
    return {
      response: json({
        ok: false,
        error: "Yönetim isteği sınırlandı",
        retry_after: num(rate.retry_after),
      }, 429),
    };
  }

  const lastSeen = safeDateMs(obj(session).last_seen_at);
  if (!lastSeen || Date.now() - lastSeen > 60000) {
    try {
      await admin
        .from(TABLES.adminSessions)
        .update({ last_seen_at: nowIso() })
        .eq("session_id", ctx.sessionId);
    } catch {}
  }

  return { ...ctx, account: obj(account), session: obj(session) };
}

async function adminLogout(req: Request, allDevices: boolean) {
  const ctx: any = await requireAdminAuth(req, allDevices ? "admin_logout_all" : "admin_logout_local");
  if (ctx.response) return ctx.response;
  if (allDevices) {
    await admin.from(TABLES.adminSessions).update({ revoked_at: nowIso() }).eq("user_id", ctx.userId).is("revoked_at", null);
    await admin.from(TABLES.adminAccounts).update({ session_version: num(ctx.account.session_version) + 1, updated_at: nowIso() }).eq("user_id", ctx.userId);
  } else {
    await admin.from(TABLES.adminSessions).update({ revoked_at: nowIso() }).eq("session_id", ctx.sessionId);
  }
  await adminAudit({ user_id: ctx.userId, email: ctx.email, session_id: ctx.sessionId, ip_address: clientIpInfo(req).ip, event_type: allDevices ? "admin_logout_all" : "admin_logout_local", success: true });
  return json({ ok: true, all_devices: allDevices });
}
async function insertEvent(row: JsonObj): Promise<void> {
  try {
    await admin.from(TABLES.events).insert({
      ...row,
      created_at: row.created_at || nowIso(),
    });
  } catch {
    // Event yazılamazsa uygulama/admin panel çalışmaya devam etsin.
  }
}
async function insertLog(row: JsonObj): Promise<void> {
  try {
    await admin.from(TABLES.logs).insert({
      level: clean(row.level || "info").slice(0, 80),
      message: clean(row.message || "Mesaha işlem").slice(0, 500),
      payload: obj(row.payload),
    });
  } catch {
    // Log zorunlu değil.
  }
}
async function selectRows(table: string, opts: { order?: string; ascending?: boolean; limit?: number; eq?: Record<string, string> } = {}) {
  try {
    let q: any = admin.from(table).select("*");
    for (const [k, v] of Object.entries(opts.eq || {})) q = q.eq(k, v);
    if (opts.order) q = q.order(opts.order, { ascending: opts.ascending ?? false });
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) {
      if (opts.order && isMissingColumn(error.message)) {
        let q2: any = admin.from(table).select("*");
        for (const [k, v] of Object.entries(opts.eq || {})) q2 = q2.eq(k, v);
        if (opts.limit) q2 = q2.limit(opts.limit);
        const r2 = await q2;
        if (r2.error) return { items: [], error: r2.error.message };
        return { items: r2.data || [] };
      }
      return { items: [], error: error.message };
    }
    return { items: data || [] };
  } catch (e) {
    return { items: [], error: errorText(e) };
  }
}
async function selectFirst(table: string, eq: Record<string, string>) {
  const r = await selectRows(table, { eq, limit: 1 });
  return arr(r.items)[0] || null;
}
async function safeUpdate(table: string, values: JsonObj, eq: Record<string, string>) {
  try {
    let q: any = admin.from(table).update(values);
    for (const [k, v] of Object.entries(eq || {})) q = q.eq(k, v);
    const { error, count } = await q.select("id", { count: "exact", head: true });
    return { table, op: "update", eq, count: count || 0, error: error?.message || null };
  } catch (e) {
    return { table, op: "update", eq, count: 0, error: errorText(e) };
  }
}
async function safeDelete(table: string, column: string, value: string) {
  if (!value) return { table, column, skipped: true };
  try {
    const { error, count } = await admin.from(table).delete({ count: "exact" }).eq(column, value);
    return { table, column, value, count: count || 0, error: error?.message || null };
  } catch (e) {
    return { table, column, value, count: 0, error: errorText(e) };
  }
}
async function safeDeleteMany(table: string, columns: string[], value: string) {
  const out: JsonObj[] = [];
  for (const column of unique(columns)) {
    const r = await safeDelete(table, column, value);
    if (!r.error || !isMissingColumn(r.error)) out.push(r);
  }
  return out;
}
async function safeDeleteFilters(table: string, filters: Record<string, string>) {
  try {
    let q: any = admin.from(table).delete({ count: "exact" });
    for (const [k, v] of Object.entries(filters || {})) q = q.eq(k, v);
    const { error, count } = await q;
    return { table, filters, count: count || 0, error: error?.message || null };
  } catch (e) {
    return { table, filters, count: 0, error: errorText(e) };
  }
}

async function driveProxy(action: string, data: JsonObj = {}) {
  if (!DRIVE_SCRIPT_URL || !DRIVE_SECRET) throw new Error("Drive sunucu secret ayarı eksik");
  const response = await fetch(DRIVE_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: DRIVE_SECRET, action, ...data }),
    redirect: "follow",
  });
  const text = await response.text();
  let parsed: JsonObj = {};
  try { parsed = text ? obj(JSON.parse(text)) : {}; } catch { throw new Error("Drive cevabı okunamadı"); }
  if (!response.ok || parsed.ok === false) throw new Error(clean(parsed.error || parsed.message || `Drive HTTP ${response.status}`));
  return parsed;
}
async function dedupLookup(key: string, userId: string, action: string) {
  const idempotencyKey = clean(key).slice(0, 240);
  if (!idempotencyKey) return null;
  try {
    const row = await selectFirst(TABLES.requestDedup, { idempotency_key: idempotencyKey });
    if (!row) return null;
    const r = obj(row);
    if (clean(r.user_id) !== clean(userId) || clean(r.action) !== clean(action)) return null;
    if (safeDateMs(r.expires_at) && safeDateMs(r.expires_at) <= Date.now()) return null;
    return obj(r.response);
  } catch { return null; }
}
async function dedupSave(key: string, userId: string, action: string, response: JsonObj, ttlSeconds = 86400) {
  const idempotencyKey = clean(key).slice(0, 240);
  if (!idempotencyKey) return;
  try {
    await admin.from(TABLES.requestDedup).upsert({
      idempotency_key: idempotencyKey,
      user_id: clean(userId) || null,
      action: clean(action).slice(0, 100),
      response,
      created_at: nowIso(),
      expires_at: new Date(Date.now() + Math.max(60, ttlSeconds) * 1000).toISOString(),
    }, { onConflict: "idempotency_key" });
  } catch {}
}
async function normalUserContext(req: Request, body: JsonObj) {
  return await approvedAccessContext(req, body);
}
async function profileHeartbeat(req: Request, body: JsonObj) {
  const ctx: any = await normalUserContext(req, body);
  if (ctx.response) return ctx.response;
  const rateKey = `profile-heartbeat:${ctx.userId}:${clean(ctx.profile.device_id) || "nodevice"}`;
  const rate = await takeRate(rateKey, 4, 300, 300);
  if (rate.allowed === false) {
    return json({ ok: true, throttled: true, retry_after: num(rate.retry_after), ip: clean(ctx.ipInfo.ip) });
  }
  const profileResult = await upsertProfile(ctx.profile);
  return json({ ok: true, blocked: false, ip: clean(ctx.ipInfo.ip), profile: profileResult, server_time: nowIso() });
}
const APPROVED_STATS_REASONS = new Set(["mesaha-download", "local-backup", "cloud-backup", "drive-backup", "seflik-send"]);
async function statsSync(req: Request, body: JsonObj) {
  const ctx: any = await normalUserContext(req, body);
  if (ctx.response) return ctx.response;
  const reason = clean(body.reason || body.statsReason || body.source).toLocaleLowerCase("tr-TR");
  if (!APPROVED_STATS_REASONS.has(reason)) return json({ ok: false, error: "Bu işlem istatistik göndermeye yetkili değil" }, 400);
  const idempotencyKey = clean(body.idempotencyKey || body.idempotency_key);
  if (!idempotencyKey) return json({ ok: false, error: "İşlem anahtarı eksik" }, 400);
  const old = await dedupLookup(idempotencyKey, ctx.userId, "stats_sync");
  if (old) return json({ ...old, ok: true, duplicate: true });
  const rate = await takeRate(`stats-sync:${ctx.userId}`, 12, 3600, 900);
  if (rate.allowed === false) return json({ ok: false, error: "İstatistik gönderim sınırı aşıldı", retry_after: num(rate.retry_after) }, 429);
  const profileResult = await upsertProfile(ctx.profile);
  const usageResult = await upsertUsageCurrent(ctx.profile, { ...body, approvedReason: reason, edgeIp: ctx.ipInfo });
  const dailyResult = await upsertUsageDaily(ctx.profile, body, ctx.ipInfo);
  await insertEvent({
    user_id: ctx.userId, ip_address: clean(ctx.ipInfo.ip) || null, user_key: ctx.userKey || null,
    name: clean(ctx.profile.name) || null, seflik: clean(ctx.profile.seflik) || null,
    device_id: clean(ctx.profile.device_id) || null, app_version: clean(ctx.profile.app_version) || null,
    event_type: "stats_sync_" + reason, blocked: false,
    metadata: { reason, idempotencyKey, record_count: extractStats(body).record_count, total_volume: extractStats(body).total_volume },
  });
  const output = { ok: true, reason, profile: profileResult, usage: usageResult, daily: dailyResult };
  await dedupSave(idempotencyKey, ctx.userId, "stats_sync", output, 7200);
  return json(output);
}
async function backupGate(req: Request, body: JsonObj) {
  const ctx: any = await normalUserContext(req, body);
  if (ctx.response) return ctx.response;
  const key = clean(body.idempotencyKey || body.idempotency_key);
  if (!key) return json({ ok: false, error: "Yedek işlem anahtarı eksik" }, 400);
  const completed = await dedupLookup(key, ctx.userId, "stats_sync");
  if (completed) return json({ ok: true, duplicate: true, already_completed: true });
  const rate = await takeRate(`cloud-backup:${ctx.userId}`, 6, 3600, 1800);
  if (rate.allowed === false) return json({ ok: false, error: "Bulut yedekleme sınırı aşıldı", retry_after: num(rate.retry_after) }, 429);
  await upsertProfile(ctx.profile);
  return json({ ok: true, allowed: true, idempotencyKey: key });
}
async function driveUserAction(req: Request, body: JsonObj, action: string) {
  const ctx: any = await normalUserContext(req, body);
  if (ctx.response) return ctx.response;
  const normalized = clean(action).replace(/^drive_/, "");
  if (!["backup", "list", "read"].includes(normalized)) return json({ ok: false, error: "Drive işlemi desteklenmiyor" }, 400);
  const limit = normalized === "backup" ? 6 : 30;
  const rate = await takeRate(`drive-${normalized}:${ctx.userId}`, limit, 3600, normalized === "backup" ? 1800 : 300);
  if (rate.allowed === false) return json({ ok: false, error: "Drive istek sınırı aşıldı", retry_after: num(rate.retry_after) }, 429);
  const safeData: JsonObj = {
    userKey: ctx.userKey,
    username: clean(ctx.profile.name),
    seflik: clean(ctx.profile.seflik),
    bolme: first(body.bolme, body.bolmeNo, body.bolme_no, ctx.profile.bolme_no),
  };
  if (normalized === "backup") {
    const key = clean(body.idempotencyKey || body.idempotency_key);
    if (!key) return json({ ok: false, error: "Yedek işlem anahtarı eksik" }, 400);
    const old = await dedupLookup(key, ctx.userId, "drive_backup");
    if (old) return json({ ...old, ok: true, duplicate: true });
    safeData.count = Math.max(0, Math.round(num(body.count)));
    safeData.totalVolume = Number(num(body.totalVolume || body.total_volume).toFixed(3));
    safeData.version = clean(body.version || ctx.profile.app_version);
    safeData.payload = obj(body.payload);
    safeData.folderMode = clean(body.folderMode || body.folder_mode) || "user";
    const out = await driveProxy("backup", safeData);
    await dedupSave(key, ctx.userId, "drive_backup", out, 86400);
    return json(out);
  }
  if (normalized === "read") safeData.fileId = clean(body.fileId || body.file_id);
  const out = await driveProxy(normalized, safeData);
  return json(out);
}
async function adminDriveList(req: Request, body: JsonObj) {
  const ctx: any = await requireAdminAuth(req, "admin_drive_list");
  if (ctx.response) return ctx.response;
  let last: unknown = null;
  for (const action of ["adminList", "listAll"]) {
    try {
      const out = await driveProxy(action, {});
      await adminAudit({ user_id: ctx.userId, email: ctx.email, session_id: ctx.sessionId, ip_address: clientIpInfo(req).ip, event_type: "admin_drive_list", success: true, metadata: { action } });
      return json(out);
    } catch (e) { last = e; }
  }
  return json({ ok: false, error: errorText(last || "Drive listesi alınamadı") }, 502);
}

async function deleteDriveFilePermanent(fileId: string) {
  const id = clean(fileId);
  if (!id) return { ok: false, id, skipped: true, error: "Drive dosya ID boş" };
  const actions = ["delete", "trash"];
  let lastError = "Drive silme işlemi desteklenmiyor";
  for (const action of actions) {
    try {
      const data: any = await driveProxy(action, { fileId: id, permanent: true });
      if (data && data.ok !== false) return { ok: true, id, action, response: data };
      lastError = clean(data?.error || data?.message || `Drive ${action} başarısız`);
    } catch (e) {
      lastError = errorText(e);
    }
  }
  return { ok: false, id, error: lastError };
}
async function deleteDriveFilesPermanent(ids: string[]) {
  const uniqueIds = unique((ids || []).map((x) => clean(x)).filter(Boolean)).slice(0, 120);
  const results: any[] = [];
  const batchSize = 5;
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    const batch = uniqueIds.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map((id) => deleteDriveFilePermanent(id)))));
  }
  return {
    results,
    deleted: results.filter((x) => x && x.ok).map((x) => x.id),
    failed: results.filter((x) => !x || !x.ok).map((x) => ({ id: clean(x?.id), error: clean(x?.error || "Silinemedi") })),
    truncated: unique((ids || []).map((x) => clean(x)).filter(Boolean)).length > uniqueIds.length,
  };
}
async function activeBlock(block_type: string, block_value: string) {
  if (!block_value) return null;
  const { items } = await selectRows(TABLES.blocks, {
    eq: { block_type, block_value, active: "true" },
    limit: 1,
  });
  return arr(items)[0] || null;
}
async function anyBlock(values: { user_id?: string; user_key?: string; ip?: string; device_id?: string }) {
  const checks = [
    ["user_id", values.user_id || ""],
    ["user_key", lower(values.user_key || "")],
    ["ip", values.ip || ""],
    ["device_id", values.device_id || ""],
  ];
  for (const [type, value] of checks) {
    const b = await activeBlock(type, value);
    if (b) return b;
  }
  return null;
}
function profileValues(body: JsonObj, userId: string, ipInfo: JsonObj): JsonObj {
  const user = obj(body.user);
  const deviceInfo = { ...obj(body.deviceInfo), ...obj(body.device_info), ...obj(body.lastDeviceInfo) };
  const name = first(body.name, user.name, body.userName, body.kullanici, deviceInfo.name);
  const seflik = first(body.seflik, user.seflik, body.seflikAdi, deviceInfo.seflik);
  let user_key = lower(first(body.userKey, body.user_key, user.userKey, user.user_key));
  if (!user_key && name && seflik) user_key = userKeyFrom(name, seflik);
  const device_id = first(body.deviceId, body.device_id, deviceInfo.deviceId, deviceInfo.device_id);
  const app_version = first(body.appVersion, body.app_version, body.visibleVersion, body.fileVersion, deviceInfo.appVersion);
  const platform = first(body.platform, body.os, body.deviceType, deviceInfo.os, deviceInfo.platform, deviceInfo.deviceType);
  const browser = first(body.browser, body.browserName, deviceInfo.browser, deviceInfo.browserName);
  const browser_version = first(body.browserVersion, body.browser_version, deviceInfo.browserVersion, deviceInfo.browser_version);

  return {
    user_id: userId || null,
    user_key: user_key || null,
    name: name || null,
    seflik: seflik || null,
    bolme_no: first(body.bolmeNo, body.bolme_no, user.bolmeNo, user.bolme_no) || null,
    app_version: app_version || null,
    device_id: device_id || null,
    last_ip: clean(ipInfo.ip) || null,
    last_seen_at: nowIso(),
    platform: platform || null,
    browser: browser || null,
    browser_version: browser_version || null,
    device_info: deviceInfo,
    payload: { ...body, edgeIp: ipInfo },
  };
}
async function upsertProfile(row: JsonObj) {
  if (!hasIdentityForAdmin(row)) return { ok: true, skipped: true, reason: "generic_profile" };
  const userId = clean(row.user_id);
  const userKey = lower(row.user_key);
  const deviceId = clean(row.device_id);
  try {
    if (userId) {
      const { error } = await admin.from(TABLES.profiles).upsert(row, { onConflict: "user_id" });
      if (!error) return { ok: true, mode: "upsert_user_id" };
      if (!isMissingColumn(error.message)) return { ok: false, error: error.message };
    }

    let existing: any = null;
    if (userKey && deviceId) existing = await selectFirst(TABLES.profiles, { user_key: userKey, device_id: deviceId });
    if (!existing && userKey) existing = await selectFirst(TABLES.profiles, { user_key: userKey });

    if (existing && clean(existing.id)) {
      const { error } = await admin.from(TABLES.profiles).update(row).eq("id", clean(existing.id));
      if (error) return { ok: false, error: error.message };
      return { ok: true, mode: "update_existing" };
    }

    const { error } = await admin.from(TABLES.profiles).insert(row);
    if (error) return { ok: false, error: error.message };
    return { ok: true, mode: "insert" };
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}
async function upsertUsageCurrent(row: JsonObj, payload: JsonObj) {
  if (!hasIdentityForAdmin(row)) return { ok: true, skipped: true, reason: "generic_usage" };
  const userId = clean(row.user_id);
  const userKey = lower(row.user_key);
  const deviceId = clean(row.device_id);
  const data = {
    user_id: userId || null,
    user_key: userKey || null,
    name: row.name || null,
    seflik: row.seflik || null,
    app_version: row.app_version || null,
    device_id: deviceId || null,
    last_ip: row.last_ip || null,
    last_seen_at: nowIso(),
    payload,
  };
  try {
    let existing: any = null;
    if (userId) existing = await selectFirst(TABLES.usageCurrent, { user_id: userId });
    if (!existing && userKey && deviceId) existing = await selectFirst(TABLES.usageCurrent, { user_key: userKey, device_id: deviceId });
    if (!existing && userKey) existing = await selectFirst(TABLES.usageCurrent, { user_key: userKey });
    if (existing && clean(existing.id)) {
      const { error } = await admin.from(TABLES.usageCurrent).update(data).eq("id", clean(existing.id));
      if (error) return { ok: false, error: error.message };
      return { ok: true, mode: "update" };
    }
    const { error } = await admin.from(TABLES.usageCurrent).insert(data);
    if (error) return { ok: false, error: error.message };
    return { ok: true, mode: "insert" };
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}
function extractStats(body: JsonObj) {
  const p = { ...body, ...obj(body.payload), ...obj(body.stats), ...obj(body.summary) } as JsonObj;
  const date = dayKey(first(p.date, p.day, p.createdAt, p.updatedAt));
  const recordCount = pickNum(p, ["todayRecords", "dayRecords", "recordCount", "totalRecords", "adet", "lastExportRecordCount"]);
  const totalVolume = pickNum(p, ["todayM3", "dayM3", "totalM3", "m3", "lastExportM3", "total_volume"]);
  return {
    date,
    week_key: first(p.weekKey, p.week_key) || weekKey(date),
    month_key: first(p.monthKey, p.month_key) || monthKey(date),
    record_count: recordCount,
    total_volume: Number(totalVolume.toFixed(3)),
    tree_totals: pickObj(p, ["treeTotals", "tree_totals", "lastExportTreeTotals"]),
    product_totals: pickObj(p, ["productTotals", "product_totals", "lastExportProductTotals"]),
    payload: p,
  };
}
async function upsertUsageDaily(profile: JsonObj, body: JsonObj, ipInfo: JsonObj) {
  if (!hasIdentityForAdmin(profile)) return { ok: true, skipped: true, reason: "generic_daily" };
  const userId = clean(profile.user_id);
  const userKey = lower(profile.user_key);
  if (!userId && !userKey) return { ok: false, error: "user_id/user_key yok" };
  const stats = extractStats(body);
  const deviceId = clean(profile.device_id);
  const id = first(body.id, body.dailyId, userKey && `${userKey}_${stats.date}_${deviceId || "nodevice"}`, userId && `${userId}_${stats.date}_${deviceId || "nodevice"}`);
  const row = {
    id,
    user_id: userId || null,
    user_key: userKey || null,
    name: profile.name || null,
    seflik: profile.seflik || null,
    date: stats.date,
    week_key: stats.week_key,
    month_key: stats.month_key,
    record_count: stats.record_count,
    total_volume: stats.total_volume,
    tree_totals: stats.tree_totals,
    product_totals: stats.product_totals,
    app_version: profile.app_version || null,
    device_id: deviceId || null,
    last_ip: clean(ipInfo.ip) || null,
    payload: { ...stats.payload, edgeIp: ipInfo },
    last_seen_at: nowIso(),
  };
  try {
    const { error } = await admin.from(TABLES.usageDaily).upsert(row, { onConflict: "id" });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}
function stableFolderKey(v: unknown, max = 180): string {
  return fold(v).replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, max);
}
function folderRecordVolume(r: JsonObj): number {
  const d = num(first(r.diameter, r.cap));
  const l = num(first(r.length, r.boy));
  const q = Math.max(1, num(first(r.quantity, r.adet, 1)) || 1);
  if (!d || !l) return 0;
  return Number((Math.PI * Math.pow(d / 100, 2) / 4 * l * q).toFixed(6));
}
function folderProductionDate(r: JsonObj): string | null {
  const v = first(r.productionDate, r.production_date, r.date);
  const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}
async function selectAllPaged(table: string, filters: Record<string, string>, order = "updated_at", maxRows = 25000) {
  const out: JsonObj[] = [];
  const pageSize = 1000;
  for (let from = 0; from < maxRows; from += pageSize) {
    let q: any = admin.from(table).select("*");
    for (const [k, v] of Object.entries(filters || {})) q = q.eq(k, v);
    if (order) q = q.order(order, { ascending: false });
    const { data, error } = await q.range(from, from + pageSize - 1);
    if (error) return { items: out, error: error.message, truncated: false };
    const rows = arr(data).map(obj);
    out.push(...rows);
    if (rows.length < pageSize) return { items: out, error: null, truncated: false };
  }
  return { items: out, error: null, truncated: true };
}
async function seflikFolderContext(req: Request, body: JsonObj) {
  const ctx: any = await approvedAccessContext(req, body);
  if (ctx.response) return ctx;
  const seflik = clean(ctx.profile.seflik);
  const seflikKey = stableFolderKey(seflik, 160);
  if (!seflikKey) return { response: json({ ok: false, error: "Şeflik anahtarı oluşturulamadı" }, 400) };
  return { ...ctx, seflik, seflikKey };
}
async function seflikRate(ctx: any, scope: string, limit: number, windowSeconds: number, blockSeconds: number) {
  const rate = await takeRate(`seflik-${scope}:${ctx.userId}`, limit, windowSeconds, blockSeconds);
  if (rate.allowed === false) return json({ ok: false, error: "Şeflik Klasörü istek sınırı aşıldı", retry_after: num(rate.retry_after) }, 429);
  return null;
}
async function seflikPushGate(ctx: any, syncToken: string) {
  const gateKey = `seflik-gate:${clean(syncToken).slice(0, 160)}`;
  const old = await dedupLookup(gateKey, ctx.userId, "seflik_push_gate");
  if (!old) {
    const startRate = await takeRate(`seflik-send-start:${ctx.userId}`, 3, 3600, 1800);
    if (startRate.allowed === false) return json({ ok: false, error: "Şefliğe gönderme sınırı aşıldı", retry_after: num(startRate.retry_after) }, 429);
    await dedupSave(gateKey, ctx.userId, "seflik_push_gate", { ok: true, syncToken }, 7200);
  }
  const tokenHash = (await hashText(syncToken)).slice(0, 24);
  const [tokenRate, globalRate] = await Promise.all([
    takeRate(`seflik-push-token:${ctx.userId}:${tokenHash}`, 70, 7200, 7200),
    takeRate(`seflik-push-global:${ctx.userId}`, 220, 3600, 1800),
  ]);
  const denied = [tokenRate, globalRate].find((x) => x.allowed === false);
  if (denied) return json({ ok: false, error: "Şeflik kayıt parçası sınırı aşıldı", retry_after: num(denied.retry_after) }, 429);
  return null;
}
async function seflikFolderDivision(ctx: any, bolmeNo: string) {
  const bolmeKey = stableFolderKey(bolmeNo, 120);
  if (!bolmeNo || !bolmeKey) return { row: null, bolmeKey };
  const row = await selectFirst(TABLES.seflikDivisions, { seflik_key: ctx.seflikKey, bolme_key: bolmeKey });
  return { row: row ? obj(row) : null, bolmeKey };
}
async function seflikFolderCreateDivision(req: Request, body: JsonObj) {
  const ctx: any = await seflikFolderContext(req, body);
  if (ctx.response) return ctx.response;
  const rateResponse = await seflikRate(ctx, "create", 20, 3600, 1800);
  if (rateResponse) return rateResponse;
  const bolmeNo = clean(body.bolmeNo || body.bolme_no);
  const bolmeKey = stableFolderKey(bolmeNo, 120);
  if (!bolmeNo || !bolmeKey) return json({ ok: false, error: "Bölme numarası zorunlu" }, 400);

  const current = await selectFirst(TABLES.seflikDivisions, { seflik_key: ctx.seflikKey, bolme_key: bolmeKey });
  if (current) {
    const old = obj(current);
    if (clean(old.status || "open") === "open") {
      return json({ ok: true, duplicate: true, division: old });
    }
    const { data, error } = await admin.from(TABLES.seflikDivisions)
      .update({ status: "open", bolme_no: bolmeNo, updated_at: nowIso(), last_activity_at: nowIso() })
      .eq("id", clean(old.id)).select("*").limit(1);
    if (error) return json({ ok: false, error: isMissingTable(error.message) ? "Şeflik Bölme tablosu kurulmamış. V5.29 SQL migration çalıştırılmalı." : error.message }, isMissingTable(error.message) ? 503 : 500);
    return json({ ok: true, reopened: true, division: arr(data)[0] || old });
  }

  const row = {
    id: stableFolderKey(`${ctx.seflikKey}__${bolmeKey}`, 360),
    seflik_key: ctx.seflikKey,
    seflik: ctx.seflik,
    bolme_key: bolmeKey,
    bolme_no: bolmeNo,
    status: "open",
    created_by_user_id: ctx.userId,
    created_by_user_key: ctx.userKey || null,
    created_by_name: clean(ctx.profile.name),
    created_at: nowIso(),
    updated_at: nowIso(),
    last_activity_at: nowIso(),
  };
  const { data, error } = await admin.from(TABLES.seflikDivisions).insert(row).select("*").limit(1);
  if (error) {
    if (lower(error.message).includes("duplicate key")) {
      const duplicate = await selectFirst(TABLES.seflikDivisions, { seflik_key: ctx.seflikKey, bolme_key: bolmeKey });
      return json({ ok: true, duplicate: true, division: duplicate || row });
    }
    return json({ ok: false, error: isMissingTable(error.message) ? "Şeflik Bölme tablosu kurulmamış. V5.29 SQL migration çalıştırılmalı." : error.message }, isMissingTable(error.message) ? 503 : 500);
  }
  await insertEvent({ user_id: ctx.userId, ip_address: clean(ctx.ipInfo.ip) || null, user_key: ctx.userKey || null, name: clean(ctx.profile.name), seflik: ctx.seflik, device_id: clean(ctx.profile.device_id) || null, app_version: clean(ctx.profile.app_version) || null, event_type: "seflik_folder_create_division", blocked: false, metadata: row });
  return json({ ok: true, division: { ...(arr(data)[0] || row), record_count: 0, total_volume: 0, contributors: [], drive_backed_up: false }, server_time: nowIso() });
}
async function seflikFolderDeleteDivision(req: Request, body: JsonObj) {
  const ctx: any = await seflikFolderContext(req, body);
  if (ctx.response) return ctx.response;
  const rateResponse = await seflikRate(ctx, "delete", 10, 3600, 3600);
  if (rateResponse) return rateResponse;
  const bolmeNo = clean(body.bolmeNo || body.bolme_no);
  const confirmBolme = clean(body.confirmBolme || body.confirm_bolme);
  const bolmeKey = stableFolderKey(bolmeNo, 120);
  if (!bolmeNo || !bolmeKey) return json({ ok: false, error: "Bölme numarası zorunlu" }, 400);
  if (confirmBolme !== bolmeNo) return json({ ok: false, error: "Bölme silme onayı eşleşmiyor" }, 400);

  const division = await selectFirst(TABLES.seflikDivisions, { seflik_key: ctx.seflikKey, bolme_key: bolmeKey });
  if (!division) return json({ ok: false, error: "Silinecek bölme bulunamadı" }, 404);

  const syncs = await selectAllPaged(TABLES.seflikSyncs, { seflik_key: ctx.seflikKey, bolme_key: bolmeKey }, "created_at", 10000);
  const driveIds = unique(arr(syncs.items).map((x) => clean(obj(x).drive_file_id)).filter(Boolean));
  const driveDelete = await deleteDriveFilesPermanent(driveIds);

  const results: any[] = [];
  results.push(await safeDeleteFilters(TABLES.seflikRecords, { seflik_key: ctx.seflikKey, bolme_key: bolmeKey }));
  results.push(await safeDeleteFilters(TABLES.seflikSyncs, { seflik_key: ctx.seflikKey, bolme_key: bolmeKey }));
  results.push(await safeDeleteFilters(TABLES.seflikDivisions, { seflik_key: ctx.seflikKey, bolme_key: bolmeKey }));
  for (const driveId of driveIds) {
    results.push(...(await safeDeleteMany(TABLES.backupSlots, ["drive_file_id", "file_id", "id", "slot_id"], driveId)));
    results.push(...(await safeDeleteMany(TABLES.backupChunks, ["drive_file_id", "file_id", "slot_id"], driveId)));
  }

  await insertEvent({
    user_id: ctx.userId,
    ip_address: clean(ctx.ipInfo.ip) || null,
    user_key: ctx.userKey || null,
    name: clean(ctx.profile.name),
    seflik: ctx.seflik,
    device_id: clean(ctx.profile.device_id) || null,
    app_version: clean(ctx.profile.app_version) || null,
    event_type: "seflik_folder_delete_division",
    blocked: false,
    metadata: { bolme_no: bolmeNo, bolme_key: bolmeKey, drive_file_ids: driveIds, drive_delete: driveDelete, results },
  });

  return json({
    ok: true,
    permanent: true,
    bolme_no: bolmeNo,
    drive_file_ids: driveIds,
    drive_deleted: driveDelete.deleted,
    drive_delete_failed: driveDelete.failed,
    results,
  });
}
async function seflikFolderPush(req: Request, body: JsonObj) {
  const ctx: any = await seflikFolderContext(req, body);
  if (ctx.response) return ctx.response;
  const bolmeNo = clean(body.bolmeNo || body.bolme_no);
  const syncToken = clean(body.syncToken || body.sync_token);
  const input = arr(body.records).map(obj).slice(0, 180);
  const division = await seflikFolderDivision(ctx, bolmeNo);
  const bolmeKey = division.bolmeKey;
  if (!bolmeNo || !bolmeKey) return json({ ok: false, error: "Bölme numarası zorunlu" }, 400);
  if (!division.row || clean(division.row.status || "open") !== "open") return json({ ok: false, error: "Bu bölme oluşturulmamış veya senkronizasyona açık değil. Önce Bölme Oluştur kullanın." }, 409);
  if (!syncToken) return json({ ok: false, error: "Senkronizasyon anahtarı eksik" }, 400);
  if (!input.length) return json({ ok: false, error: "Gönderilecek kayıt bulunamadı" }, 400);
  const gateResponse = await seflikPushGate(ctx, syncToken);
  if (gateResponse) return gateResponse;

  const rows: JsonObj[] = [];
  for (const r of input) {
    const recordKey = stableFolderKey(first(r.barcode, r.id), 180);
    if (!recordKey) continue;
    const barcode = first(r.barcode, r.id);
    const rowId = stableFolderKey(`${ctx.seflikKey}__${bolmeKey}__${ctx.userId}__${recordKey}`, 480);
    rows.push({
      id: rowId,
      seflik_key: ctx.seflikKey,
      seflik: ctx.seflik,
      bolme_key: bolmeKey,
      bolme_no: bolmeNo,
      record_key: recordKey,
      barcode: barcode || null,
      record_data: { ...r, bolmeNo, seflik: ctx.seflik },
      quantity: Math.max(1, Math.round(num(first(r.quantity, r.adet, 1)) || 1)),
      volume: folderRecordVolume(r),
      tree_type: first(r.treeType, r.tree_type) || null,
      product_type: first(r.productType, r.product_type) || null,
      cutter: first(r.cutter, r.kesimci) || null,
      production_date: folderProductionDate(r),
      uploaded_by_user_id: ctx.userId,
      uploaded_by_user_key: ctx.userKey || null,
      uploaded_by_name: first(r.sharedUploadedByName, r.shared_uploaded_by_name, ctx.profile.name),
      sync_token: syncToken,
      app_version: first(body.appVersion, body.fileVersion, ctx.profile.app_version) || null,
      updated_at: nowIso(),
    });
  }
  if (!rows.length) return json({ ok: false, error: "Geçerli barkod veya kayıt kimliği bulunamadı" }, 400);
  const { error } = await admin.from(TABLES.seflikRecords).upsert(rows, { onConflict: "id" });
  if (error) {
    const status = isMissingTable(error.message) ? 503 : 500;
    return json({ ok: false, error: isMissingTable(error.message) ? "Şeflik Klasörü tabloları kurulmamış. V5.28 ve V5.29 SQL migration çalıştırılmalı." : error.message }, status);
  }
  await admin.from(TABLES.seflikDivisions).update({ last_activity_at: nowIso(), updated_at: nowIso() }).eq("seflik_key", ctx.seflikKey).eq("bolme_key", bolmeKey);
  return json({ ok: true, accepted: rows.length, syncToken, bolmeNo });
}
async function seflikFolderFinish(req: Request, body: JsonObj) {
  const ctx: any = await seflikFolderContext(req, body);
  if (ctx.response) return ctx.response;
  const rateResponse = await seflikRate(ctx, "finish", 10, 3600, 1800);
  if (rateResponse) return rateResponse;
  const bolmeNo = clean(body.bolmeNo || body.bolme_no);
  const bolmeKey = stableFolderKey(bolmeNo, 120);
  const syncToken = clean(body.syncToken || body.sync_token);
  if (!bolmeNo || !bolmeKey || !syncToken) return json({ ok: false, error: "Bölme veya senkronizasyon anahtarı eksik" }, 400);

  const division = await seflikFolderDivision(ctx, bolmeNo);
  if (!division.row || clean(division.row.status || "open") !== "open") return json({ ok: false, error: "Bölme senkronizasyona açık değil" }, 409);

  const syncRow = {
    seflik_key: ctx.seflikKey,
    seflik: ctx.seflik,
    bolme_key: bolmeKey,
    bolme_no: bolmeNo,
    user_id: ctx.userId,
    user_key: ctx.userKey || null,
    user_name: clean(ctx.profile.name),
    sync_token: syncToken,
    record_count: Math.max(0, Math.round(num(body.recordCount || body.record_count))),
    total_volume: Number(num(body.totalVolume || body.total_volume).toFixed(3)),
    drive_file_id: clean(body.driveFileId || body.drive_file_id) || null,
    drive_file_name: clean(body.driveFileName || body.drive_file_name) || null,
    drive_status: clean(body.driveStatus || body.drive_status || "pending"),
    drive_error: clean(body.driveError || body.drive_error) || null,
    app_version: first(body.appVersion, body.fileVersion, ctx.profile.app_version) || null,
  };
  /* Önce snapshot tamamlandı olarak işaretlenir. Liste/okuma yalnızca son tamamlanan tokenı gösterir. */
  const { error } = await admin.from(TABLES.seflikSyncs).upsert(syncRow, { onConflict: "user_id,seflik_key,bolme_key,sync_token" });
  if (error) return json({ ok: false, error: isMissingTable(error.message) ? "Şeflik Klasörü tabloları kurulmamış. V5.28 SQL migration çalıştırılmalı." : error.message }, isMissingTable(error.message) ? 503 : 500);

  /* Yalnızca daha önce tamamlanmış snapshot tokenları temizlenir.
     Devam eden başka bir kullanıcının yarım yüklemesi yanlışlıkla silinmez. */
  let removedOldRecords = 0;
  let cleanupWarning = "";
  try {
    const { data: oldSyncRows, error: oldSyncError } = await admin.from(TABLES.seflikSyncs)
      .select("sync_token")
      .eq("seflik_key", ctx.seflikKey)
      .eq("bolme_key", bolmeKey)
      .neq("sync_token", syncToken)
      .order("created_at", { ascending: false })
      .limit(250);
    if (oldSyncError) throw oldSyncError;
    const oldTokens = unique(arr(oldSyncRows).map((x) => clean(obj(x).sync_token)).filter(Boolean));
    for (const oldToken of oldTokens) {
      const cleanup = await admin.from(TABLES.seflikRecords).delete({ count: "exact" })
        .eq("seflik_key", ctx.seflikKey).eq("bolme_key", bolmeKey).eq("sync_token", oldToken);
      if (cleanup.error) {
        cleanupWarning = cleanup.error.message;
        break;
      }
      removedOldRecords += cleanup.count || 0;
    }
  } catch (cleanupError) {
    cleanupWarning = errorText(cleanupError);
    await insertLog({ level: "seflik_cleanup_warning", message: "Eski Şeflik Klasörü kayıtları temizlenemedi", payload: { seflik_key: ctx.seflikKey, bolme_key: bolmeKey, sync_token: syncToken, error: cleanupWarning } });
  }

  await admin.from(TABLES.seflikDivisions).update({ last_activity_at: nowIso(), updated_at: nowIso() }).eq("seflik_key", ctx.seflikKey).eq("bolme_key", bolmeKey);
  await insertEvent({ user_id: ctx.userId, ip_address: clean(ctx.ipInfo.ip) || null, user_key: ctx.userKey || null, name: clean(ctx.profile.name), seflik: ctx.seflik, device_id: clean(ctx.profile.device_id) || null, app_version: clean(ctx.profile.app_version) || null, event_type: "seflik_folder_finish", blocked: false, metadata: syncRow });
  return json({ ok: true, removedOldRecords, cleanupWarning: cleanupWarning || null, sync: syncRow });
}

async function seflikFolderList(req: Request, body: JsonObj) {
  const ctx: any = await seflikFolderContext(req, body);
  if (ctx.response) return ctx.response;
  const rateResponse = await seflikRate(ctx, "list", 60, 3600, 600);
  if (rateResponse) return rateResponse;
  let [divisionResult, recResult, syncResult] = await Promise.all([
    selectAllPaged(TABLES.seflikDivisions, { seflik_key: ctx.seflikKey }, "updated_at", 5000),
    selectAllPaged(TABLES.seflikRecords, { seflik_key: ctx.seflikKey }, "updated_at", 30000),
    selectAllPaged(TABLES.seflikSyncs, { seflik_key: ctx.seflikKey }, "created_at", 5000),
  ]);
  if (divisionResult.error) return json({ ok: false, error: isMissingTable(divisionResult.error) ? "Şeflik Bölme tablosu kurulmamış. V5.29 SQL migration çalıştırılmalı." : divisionResult.error }, isMissingTable(divisionResult.error) ? 503 : 500);
  /* Eski/uyumsuz seflik_key ile kaydedilmiş satırlar varsa şeflik adından güvenli fallback yap. */
  if (!(divisionResult.items || []).length) {
    const fallbackDivisions = await selectAllPaged(TABLES.seflikDivisions, {}, "updated_at", 5000);
    if (!fallbackDivisions.error) {
      divisionResult = { ...fallbackDivisions, items: (fallbackDivisions.items || []).filter((row) => stableFolderKey(obj(row).seflik, 160) === ctx.seflikKey) };
    }
  }
  if (recResult.error) return json({ ok: false, error: isMissingTable(recResult.error) ? "Şeflik Klasörü tabloları kurulmamış. V5.28 SQL migration çalıştırılmalı." : recResult.error }, isMissingTable(recResult.error) ? 503 : 500);

  const latestSync = new Map<string, JsonObj>();
  for (const row of syncResult.items || []) {
    const key = clean(row.bolme_key);
    if (!key) continue;
    const old = latestSync.get(key);
    if (!old || safeDateMs(row.created_at) > safeDateMs(old.created_at)) latestSync.set(key, row);
  }

  /* Yalnızca son tamamlanan snapshotın kayıtlarını hesaba kat. Yarım kalan yüklemeler görünmez. */
  const latest = new Map<string, JsonObj>();
  for (const row of recResult.items) {
    const bolmeKey = clean(row.bolme_key);
    const completed = latestSync.get(bolmeKey);
    if (!completed || clean(row.sync_token) !== clean(completed.sync_token)) continue;
    const key = `${bolmeKey}|${clean(row.record_key)}`;
    const old = latest.get(key);
    if (!old || safeDateMs(row.updated_at) > safeDateMs(old.updated_at)) latest.set(key, row);
  }

  const groups = new Map<string, any>();
  for (const raw of divisionResult.items) {
    const d = obj(raw);
    const bolmeKey = clean(d.bolme_key);
    if (!bolmeKey) continue;
    groups.set(bolmeKey, {
      id: clean(d.id),
      bolme_key: bolmeKey,
      bolme_no: clean(d.bolme_no),
      status: lower(d.status || "open") === "open" ? "open" : clean(d.status || "open"),
      created_by_name: clean(d.created_by_name),
      created_at: clean(d.created_at),
      updated_at: first(d.last_activity_at, d.updated_at, d.created_at),
      record_count: 0,
      total_volume: 0,
      contributors: new Set<string>(),
      tree_totals: {},
      product_totals: {},
      drive_backed_up: false,
      drive_file_id: "",
      drive_file_name: "",
    });
  }
  for (const row of latest.values()) {
    const bolmeKey = clean(row.bolme_key);
    if (!bolmeKey) continue;
    let g = groups.get(bolmeKey);
    if (!g) {
      g = { bolme_key: bolmeKey, bolme_no: clean(row.bolme_no), status: "open", created_by_name: "", created_at: clean(row.created_at), record_count: 0, total_volume: 0, contributors: new Set<string>(), updated_at: clean(row.updated_at), tree_totals: {}, product_totals: {}, drive_backed_up: false, drive_file_id: "", drive_file_name: "" };
      groups.set(bolmeKey, g);
    }
    g.record_count += 1;
    g.total_volume += num(row.volume);
    if (clean(row.uploaded_by_name)) g.contributors.add(clean(row.uploaded_by_name));
    if (safeDateMs(row.updated_at) > safeDateMs(g.updated_at)) g.updated_at = clean(row.updated_at);
    const tree = clean(row.tree_type) || "Belirsiz";
    const product = clean(row.product_type) || "Belirsiz";
    g.tree_totals[tree] = { count: num(obj(g.tree_totals[tree]).count) + 1, m3: num(obj(g.tree_totals[tree]).m3) + num(row.volume) };
    g.product_totals[product] = { count: num(obj(g.product_totals[product]).count) + 1, m3: num(obj(g.product_totals[product]).m3) + num(row.volume) };
  }

  const summaries = Array.from(groups.values()).map((g: any) => {
    const sync = latestSync.get(g.bolme_key) || {};
    g.contributors = Array.from(g.contributors).sort((a: string, b: string) => a.localeCompare(b, "tr"));
    g.total_volume = Number(g.total_volume.toFixed(3));
    g.drive_backed_up = clean(sync.drive_status) === "ok" && !!clean(sync.drive_file_id);
    g.drive_file_id = clean(sync.drive_file_id);
    g.drive_file_name = clean(sync.drive_file_name);
    g.last_sync = clean(sync.created_at);
    return g;
  }).sort((a: any, b: any) => safeDateMs(b.updated_at) - safeDateMs(a.updated_at));

  return json({ ok: true, seflik: ctx.seflik, seflikKey: ctx.seflikKey, divisions: summaries, summaries, divisionCount: summaries.length, server_time: nowIso(), truncated: !!recResult.truncated });
}

async function seflikFolderRead(req: Request, body: JsonObj) {
  const ctx: any = await seflikFolderContext(req, body);
  if (ctx.response) return ctx.response;
  const rateResponse = await seflikRate(ctx, "read", 30, 3600, 600);
  if (rateResponse) return rateResponse;
  const bolmeNo = clean(body.bolmeNo || body.bolme_no);
  const bolmeKey = stableFolderKey(bolmeNo, 120);
  if (!bolmeNo || !bolmeKey) return json({ ok: false, error: "Bölme numarası zorunlu" }, 400);
  const division = await seflikFolderDivision(ctx, bolmeNo);
  if (!division.row) return json({ ok: false, error: "Bölme bulunamadı" }, 404);

  const [result, syncResult] = await Promise.all([
    selectAllPaged(TABLES.seflikRecords, { seflik_key: ctx.seflikKey, bolme_key: bolmeKey }, "updated_at", 30000),
    selectAllPaged(TABLES.seflikSyncs, { seflik_key: ctx.seflikKey, bolme_key: bolmeKey }, "created_at", 1000),
  ]);
  if (result.error) return json({ ok: false, error: result.error }, 500);
  const latestCompleted = (syncResult.items || []).sort((a, b) => safeDateMs(b.created_at) - safeDateMs(a.created_at))[0] || null;
  if (!latestCompleted) return json({ ok: true, seflik: ctx.seflik, bolmeNo, division: division.row, records: [], recordCount: 0, totalVolume: 0, truncated: false });

  const token = clean(latestCompleted.sync_token);
  const latest = new Map<string, JsonObj>();
  for (const row of result.items) {
    if (clean(row.sync_token) !== token) continue;
    const key = clean(row.record_key);
    const old = latest.get(key);
    if (!old || safeDateMs(row.updated_at) > safeDateMs(old.updated_at)) latest.set(key, row);
  }
  const records = Array.from(latest.values()).sort((a, b) => first(a.barcode).localeCompare(first(b.barcode), "tr", { numeric: true }));
  return json({ ok: true, seflik: ctx.seflik, bolmeNo, division: division.row, records, recordCount: records.length, totalVolume: Number(records.reduce((sum, r) => sum + num(r.volume), 0).toFixed(3)), truncated: !!result.truncated });
}

function aggregateDaily(items: JsonObj[]) {
  const today = trDate();
  const wk = weekKey(today);
  const mo = monthKey(today);
  const map = new Map<string, JsonObj>();

  for (const r of items || []) {
    if (!hasIdentityForAdmin(obj(r))) continue;
    const p = obj(r.payload);
    const key = first(r.user_key, p.userKey, p.user_key, r.user_id, p.id);
    if (!key) continue;
    const date = dayKey(first(r.date, p.date, p.day, r.created_at, p.createdAt));
    const w = first(r.week_key, p.weekKey, p.week_key) || weekKey(date);
    const m = first(r.month_key, p.monthKey, p.month_key) || monthKey(date);
    const count = num(first(r.record_count, p.todayRecords, p.dayRecords, p.recordCount, p.totalRecords, p.adet, p.lastExportRecordCount));
    const vol = num(first(r.total_volume, p.todayM3, p.dayM3, p.totalM3, p.m3, p.lastExportM3));

    const old = map.get(key) || {
      user_key: key,
      user_id: first(r.user_id, p.user_id),
      name: first(r.name, p.name),
      seflik: first(r.seflik, p.seflik),
      last_ip: first(r.last_ip, p.lastIp, p.ip),
      device_id: first(r.device_id, p.deviceId),
      app_version: first(r.app_version, p.appVersion, p.fileVersion),
      last_seen_at: first(r.last_seen_at, r.updated_at, r.created_at),
      payload: {
        userKey: key,
        name: first(r.name, p.name),
        seflik: first(r.seflik, p.seflik),
        todayRecords: 0,
        todayM3: 0,
        weekRecordCount: 0,
        weekM3: 0,
        monthRecordCount: 0,
        monthM3: 0,
        treeTotals: {},
        productTotals: {},
      },
    } as JsonObj;

    const outp = obj(old.payload);
    if (date === today) {
      outp.todayRecords = num(outp.todayRecords) + count;
      outp.todayM3 = Number((num(outp.todayM3) + vol).toFixed(3));
    }
    if (w === wk) {
      outp.weekRecordCount = num(outp.weekRecordCount) + count;
      outp.weekM3 = Number((num(outp.weekM3) + vol).toFixed(3));
    }
    if (m === mo) {
      outp.monthRecordCount = num(outp.monthRecordCount) + count;
      outp.monthM3 = Number((num(outp.monthM3) + vol).toFixed(3));
    }
    outp.treeTotals = totalsMerge(obj(outp.treeTotals), pickObj({ r, p, ...r, ...p }, ["tree_totals", "treeTotals", "p.treeTotals", "p.tree_totals"]));
    outp.productTotals = totalsMerge(obj(outp.productTotals), pickObj({ r, p, ...r, ...p }, ["product_totals", "productTotals", "p.productTotals", "p.product_totals"]));

    old.payload = outp;
    old.record_count = num(outp.monthRecordCount) || Math.max(num(old.record_count), count);
    old.total_volume = num(outp.monthM3) || Math.max(num(old.total_volume), vol);
    old.updated_at = first(r.updated_at, r.last_seen_at, r.created_at, old.updated_at, nowIso());
    map.set(key, old);
  }
  return Array.from(map.values());
}
function rowUserKey(r: JsonObj): string {
  const p = obj(r.payload);
  return lower(first(r.user_key, p.userKey, p.user_key, r.user_id, p.id));
}
function rowUserId(r: JsonObj): string {
  return clean(first(r.user_id, obj(r.payload).user_id));
}
function rowLastSeen(r: JsonObj): string {
  const p = obj(r.payload);
  return first(r.last_seen_at, r.updated_at, p.lastSeenAt, p.lastSeen, p.updatedAt, r.created_at);
}
function rowIp(r: JsonObj): string {
  const p = obj(r.payload);
  const meta = obj(r.metadata);
  return first(r.last_ip, r.ip_address, p.lastIp, p.last_ip, p.ip, p.ipAddress, meta.edgeIp && obj(meta.edgeIp).ip, meta.ip);
}
function enrichProfiles(profiles: JsonObj[], usage: JsonObj[], daily: JsonObj[], events: JsonObj[]) {
  const byKey = new Map<string, JsonObj>();
  const byId = new Map<string, JsonObj>();
  const touch = (r: JsonObj) => {
    const key = rowUserKey(r);
    const id = rowUserId(r);
    const ip = rowIp(r);
    const seen = rowLastSeen(r) || first(r.created_at);
    if (key) {
      const old = byKey.get(key) || {};
      if (ip && (!old.ip || safeDateMs(seen) >= safeDateMs(old.seen))) byKey.set(key, { ip, seen, row: r });
      else if (!old.ip) byKey.set(key, { ip, seen, row: r });
    }
    if (id) {
      const old = byId.get(id) || {};
      if (ip && (!old.ip || safeDateMs(seen) >= safeDateMs(old.seen))) byId.set(id, { ip, seen, row: r });
      else if (!old.ip) byId.set(id, { ip, seen, row: r });
    }
  };
  [...usage, ...daily, ...events].forEach((x) => touch(obj(x)));

  return (profiles || []).map((raw) => {
    const r = { ...obj(raw) };
    const key = rowUserKey(r);
    const id = rowUserId(r);
    const hit = (key && byKey.get(key)) || (id && byId.get(id)) || null;
    if (hit) {
      if (!clean(r.last_ip) && clean(hit.ip)) r.last_ip = clean(hit.ip);
      if (!clean(r.last_seen_at) && clean(hit.seen)) r.last_seen_at = clean(hit.seen);
    }
    const p = obj(r.payload);
    r.ip = first(r.last_ip, p.ip, p.lastIp);
    r.lastIp = r.ip;
    return r;
  });
}

function hasIdentityForAdmin(r: JsonObj): boolean {
  const p = obj(r.payload);
  const name = lower(first(r.name, p.name, obj(p.user).name));
  const seflik = lower(first(r.seflik, p.seflik, obj(p.user).seflik));
  const bad = new Set(["", "-", "unknown", "null", "undefined", "user", "kullanıcı", "kullanici", "şeflik", "seflik", "admin", "test"]);
  const goodName = !bad.has(name) && name.length >= 2;
  const goodSeflik = !bad.has(seflik) && seflik.length >= 2;
  return goodName && goodSeflik;
}

function onlineSummary(profiles: JsonObj[], events: JsonObj[]) {
  const today = trDate();
  const now = Date.now();
  const seenToday = new Set<string>();
  const onlineNow = new Set<string>();
  const add = (r: JsonObj) => {
    if (!hasIdentityForAdmin(r)) return;
    const key = rowUserKey(r) || rowUserId(r) || clean(first(r.name, obj(r.payload).name)) + "__" + clean(first(r.seflik, obj(r.payload).seflik));
    if (!key) return;
    const seen = rowLastSeen(r) || first(r.created_at);
    if (dayKey(seen) === today) seenToday.add(key);
    const ms = safeDateMs(seen);
    if (ms && now - ms <= 15 * 60 * 1000) onlineNow.add(key);
  };
  profiles.forEach((x) => add(obj(x)));
  events.forEach((x) => add(obj(x)));
  return { todayOnline: seenToday.size, onlineNow: onlineNow.size, totalUsers: profiles.length };
}
async function adminListUserAccess(body: JsonObj) {
  const limit = Math.min(Math.max(Number(body.limit || 1000) || 1000, 50), 3000);
  const [access, events] = await Promise.all([
    selectRows(TABLES.userAccess, { order: "updated_at", limit }),
    selectRows(TABLES.userAuthEvents, { order: "created_at", limit: Math.min(limit, 1000) }),
  ]);
  if (access.error) return json({ ok: false, error: access.error }, 500);
  return json({ ok: true, items: access.items || [], auth_events: events.items || [], errors: { auth_events: events.error || null } });
}
async function adminUserAccessApprove(req: Request, body: JsonObj) {
  const userId = clean(body.user_id || body.userId);
  if (!userId) return json({ ok: false, error: "Google kullanıcı ID eksik" }, 400);
  const old = obj(await selectFirst(TABLES.userAccess, { user_id: userId }));
  if (!Object.keys(old).length) return json({ ok: false, error: "Erişim talebi bulunamadı" }, 404);
  const name = first(body.name, body.canonical_name, old.requested_name).slice(0, 120);
  const seflik = first(body.seflik, body.canonical_seflik, old.requested_seflik).slice(0, 120);
  if (!hasIdentityForAdmin({ name, seflik })) return json({ ok: false, error: "Geçerli kullanıcı adı ve şeflik gerekli" }, 400);
  const userKey = userKeyFrom(name, seflik);
  const duplicate = obj(await selectFirst(TABLES.userAccess, { user_key: userKey, status: "approved" }));
  if (clean(duplicate.user_id) && clean(duplicate.user_id) !== userId) {
    return json({ ok: false, duplicate: true, error: "Bu kullanıcı adı ve şeflik başka bir Google hesabına bağlı" }, 409);
  }
  const adminId = await authUserId(req);
  const values = { canonical_name: name, canonical_seflik: seflik, user_key: userKey, bolme_no: clean(body.bolme_no || body.bolmeNo || old.bolme_no) || null,
    status: "approved", reason: null, approved_at: nowIso(), approved_by: adminId || null, updated_at: nowIso() };
  const { error } = await admin.from(TABLES.userAccess).update(values).eq("user_id", userId);
  if (error) return json({ ok: false, error: error.message }, 500);
  const profile = profileValues({ name, seflik, userKey, bolmeNo: values.bolme_no, deviceInfo: obj(old.device_info), appVersion: "V5.48 •Yakupp•" }, userId, { ip: clean(old.last_ip) });
  await upsertProfile(profile);
  await userAuthEvent({ user_id: userId, email: old.email, event_type: "google_access_approved", success: true, ip_address: clientIpInfo(req, body).ip, metadata: { name, seflik, user_key: userKey, approved_by: adminId } });
  return json({ ok: true, access: accessView({ ...old, ...values, user_id: userId }) });
}
async function adminUserAccessDecision(req: Request, body: JsonObj, status: "rejected" | "revoked" | "pending") {
  const userId = clean(body.user_id || body.userId);
  if (!userId) return json({ ok: false, error: "Google kullanıcı ID eksik" }, 400);
  const old = obj(await selectFirst(TABLES.userAccess, { user_id: userId }));
  if (!Object.keys(old).length) return json({ ok: false, error: "Erişim kaydı bulunamadı" }, 404);
  const reason = clean(body.reason || (status === "revoked" ? "Yönetici erişimi kapattı" : status === "rejected" ? "Yönetici talebi reddetti" : "Yeniden inceleme")).slice(0, 500);
  const values: JsonObj = { status, reason, updated_at: nowIso() };
  if (status !== "approved") { values.approved_at = null; values.approved_by = null; }
  const { error } = await admin.from(TABLES.userAccess).update(values).eq("user_id", userId);
  if (error) return json({ ok: false, error: error.message }, 500);
  await userAuthEvent({ user_id: userId, email: old.email, event_type: `google_access_${status}`, success: true, ip_address: clientIpInfo(req, body).ip, reason, metadata: { previous_status: old.status } });
  return json({ ok: true, access: accessView({ ...old, ...values }) });
}
async function adminListAll(body: JsonObj) {
  const limit = Math.min(Math.max(Number(body.limit || 2500) || 2500, 100), 5000);
  const [profiles0, usage, backups, logs, daily, events, blocks, adminAuditRows, userAccessRows, userAuthEvents] = await Promise.all([
    selectRows(TABLES.profiles, { order: "last_seen_at", limit }),
    selectRows(TABLES.usageCurrent, { order: "last_seen_at", limit }),
    selectRows(TABLES.backupSlots, { order: "updated_at", limit }),
    selectRows(TABLES.logs, { order: "updated_at", limit }),
    selectRows(TABLES.usageDaily, { order: "date", limit }),
    selectRows(TABLES.events, { order: "created_at", limit: Math.min(limit, 3000) }),
    selectRows(TABLES.blocks, { order: "created_at", limit: 1000 }),
    selectRows(TABLES.adminAudit, { order: "created_at", limit: 1000 }),
    selectRows(TABLES.userAccess, { order: "updated_at", limit: 3000 }),
    selectRows(TABLES.userAuthEvents, { order: "created_at", limit: 1000 }),
  ]);

  const profiles = enrichProfiles(
    arr(profiles0.items).map(obj).filter(hasIdentityForAdmin),
    arr(usage.items).map(obj),
    arr(daily.items).map(obj),
    arr(events.items).map(obj),
  );
  const dailyAgg = aggregateDaily(arr(daily.items).map(obj));
  const summary = onlineSummary(profiles, arr(events.items).map(obj));

  return json({
    ok: true,
    profiles,
    users: profiles,
    usage: [...arr(usage.items).map(obj).filter(hasIdentityForAdmin), ...dailyAgg],
    daily_usage: arr(daily.items).map(obj).filter(hasIdentityForAdmin),
    dailyUsage: arr(daily.items).map(obj).filter(hasIdentityForAdmin),
    backups: backups.items,
    logs: logs.items,
    events: events.items,
    blocks: blocks.items,
    security_blocks: blocks.items,
    admin_audit_logs: adminAuditRows.items,
    adminAuditLogs: adminAuditRows.items,
    user_access: userAccessRows.items,
    userAccess: userAccessRows.items,
    user_auth_events: userAuthEvents.items,
    userAuthEvents: userAuthEvents.items,
    summary: { ...summary, generatedAt: nowIso(), today: trDate() },
    errors: {
      profiles: profiles0.error || null,
      usage: usage.error || null,
      daily_usage: daily.error || null,
      backups: backups.error || null,
      logs: logs.error || null,
      events: events.error || null,
      blocks: blocks.error || null,
      admin_audit_logs: adminAuditRows.error || null,
      user_access: userAccessRows.error || null,
      user_auth_events: userAuthEvents.error || null,
    },
  });
}
async function adminListSecurityLogs(body: JsonObj) {
  const limit = Math.min(Math.max(Number(body.limit || 500) || 500, 50), 2000);
  const r = await selectRows(TABLES.adminAudit, { order: "created_at", limit });
  if (r.error) return json({ ok: false, error: r.error }, 500);
  return json({ ok: true, items: r.items || [] });
}
async function adminListEvents(body: JsonObj) {
  const limit = Math.min(Math.max(Number(body.limit || 500) || 500, 50), 3000);
  const r = await selectRows(TABLES.events, { order: "created_at", limit });
  if (r.error) return json({ ok: false, error: r.error }, 500);
  return json({ ok: true, items: r.items || [] });
}
async function adminListBlocks() {
  const r = await selectRows(TABLES.blocks, { order: "created_at", limit: 1000 });
  if (r.error) return json({ ok: false, error: r.error }, 500);
  return json({ ok: true, items: r.items || [] });
}
async function adminAddBlock(req: Request, body: JsonObj) {
  const block_type = clean(body.block_type || body.type);
  const block_value = normalizeBlockValue(block_type, body.block_value || body.value);
  if (!block_type || !block_value) return json({ ok: false, error: "Engel tipi veya değeri boş" }, 400);
  const reason = clean(body.reason) || "Admin engeli";
  const row = { block_type, block_value, reason, active: true, updated_at: nowIso() };

  try {
    const { data, error } = await admin
      .from(TABLES.blocks)
      .upsert(row, { onConflict: "block_type,block_value" })
      .select("*")
      .limit(1);

    if (error) {
      const existing = await selectFirst(TABLES.blocks, { block_type, block_value });
      if (existing) {
        const id = clean((existing as JsonObj).id);
        let q: any = admin.from(TABLES.blocks).update({ active: true, reason, updated_at: nowIso() });
        if (id) q = q.eq("id", id);
        else q = q.eq("block_type", block_type).eq("block_value", block_value);
        const u = await q.select("*").limit(1);
        if (u.error) return json({ ok: false, error: u.error.message }, 500);
        await insertEvent({ ip_address: clientIpInfo(req).ip || null, event_type: "admin_add_block_existing", blocked: false, metadata: { block_type, block_value, reason } });
        return json({ ok: true, duplicate: true, message: "Bu kayıt zaten engelliydi, aktif hale getirildi", item: arr(u.data)[0] || existing });
      }
      if (lower(error.message).includes("duplicate key")) return json({ ok: true, duplicate: true, message: "Bu kayıt zaten engelli" });
      return json({ ok: false, error: error.message }, 500);
    }

    await insertEvent({ ip_address: clientIpInfo(req).ip || null, event_type: "admin_add_block", blocked: false, metadata: { block_type, block_value, reason } });
    return json({ ok: true, item: arr(data)[0] || row });
  } catch (e) {
    return json({ ok: false, error: errorText(e) }, 500);
  }
}
async function adminRemoveBlock(req: Request, body: JsonObj) {
  const id = clean(body.id);
  const block_type = clean(body.block_type || body.type);
  const block_value = normalizeBlockValue(block_type, body.block_value || body.value);
  if (!id && (!block_type || !block_value)) return json({ ok: false, error: "Engel ID veya tip/değer boş" }, 400);
  try {
    let q: any = admin.from(TABLES.blocks).update({ active: false, updated_at: nowIso() });
    if (id) q = q.eq("id", id);
    else q = q.eq("block_type", block_type).eq("block_value", block_value);
    const { error } = await q;
    if (error) return json({ ok: false, error: error.message }, 500);
    await insertEvent({ ip_address: clientIpInfo(req).ip || null, event_type: "admin_remove_block", blocked: false, metadata: { id, block_type, block_value } });
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: errorText(e) }, 500);
  }
}
async function findBackupRefs(driveFileId: string) {
  const matches: JsonObj[] = [];
  for (const col of ["drive_file_id", "file_id", "id", "slot_id"]) {
    try {
      const r = await selectRows(TABLES.backupSlots, { eq: { [col]: driveFileId }, limit: 100 });
      if (!r.error) matches.push(...arr(r.items).map(obj));
    } catch {
      // kolon yoksa sorun değil.
    }
  }
  const slotIds = unique(matches.map((r) => first(r.slot_id, r.id)).filter(Boolean));
  return { matches, slotIds };
}
async function adminHideDriveBackup(req: Request, body: JsonObj) {
  const drive_file_id = clean(body.drive_file_id || body.file_id || body.fileId || body.id);
  if (!drive_file_id) return json({ ok: false, error: "Drive yedek ID boş" }, 400);

  const refs = await findBackupRefs(drive_file_id);
  const driveDelete = await deleteDriveFilesPermanent([drive_file_id]);
  const results: any[] = [];
  results.push(...(await safeDeleteMany(TABLES.backupSlots, ["drive_file_id", "file_id", "id", "slot_id"], drive_file_id)));
  results.push(...(await safeDeleteMany(TABLES.backupChunks, ["drive_file_id", "file_id", "slot_id"], drive_file_id)));
  for (const slotId of refs.slotIds) results.push(...(await safeDeleteMany(TABLES.backupChunks, ["slot_id"], slotId)));

  /* Şeflik senkron kayıtlarında bu Drive dosyasına ait referans da kalmasın. */
  try { await admin.from(TABLES.seflikSyncs).delete().eq("drive_file_id", drive_file_id); } catch {}

  const payload = {
    action: "admin_delete_drive_backup_permanent",
    drive_file_id,
    user_key: clean(body.user_key || body.userKey) || null,
    name: clean(body.name) || null,
    seflik: clean(body.seflik) || null,
    deleted_at: nowIso(),
    permanent: true,
    refs,
    drive_delete: driveDelete,
  };
  await insertEvent({ ip_address: clientIpInfo(req).ip || null, event_type: "admin_delete_drive_backup_permanent", blocked: false, metadata: payload });
  await insertLog({ level: "admin_deleted_drive_backup", message: "Drive yedeği kalıcı silme işlemi", payload });

  return json({
    ok: true,
    permanent: true,
    supabaseDeletes: results,
    drive_deleted: driveDelete.deleted,
    drive_delete_failed: driveDelete.failed,
    deleted_drive_ids: [drive_file_id],
  });
}

async function resolveUser(body: JsonObj) {
  let user_id = clean(body.user_id || body.userId);
  let user_key = lower(body.user_key || body.userKey);
  const name = clean(body.name);
  const seflik = clean(body.seflik);
  if (!user_key && name && seflik) user_key = userKeyFrom(name, seflik);

  if (!user_id && user_key) {
    const row = await selectFirst(TABLES.profiles, { user_key });
    if (row) user_id = clean((row as JsonObj).user_id);
  }
  if (!user_key && user_id) {
    const row = await selectFirst(TABLES.profiles, { user_id });
    if (row) user_key = lower((row as JsonObj).user_key);
  }
  return { user_id, user_key, name, seflik };
}
async function adminDeleteUser(req: Request, body: JsonObj) {
  const u = await resolveUser(body);
  if (!u.user_id && !u.user_key && !(u.name && u.seflik)) return json({ ok: false, error: "Kullanıcı kimliği bulunamadı" }, 400);

  const results: any[] = [];
  const requestedDriveIds = unique(arr(body.drive_file_ids).map((x) => clean(x)).filter(Boolean));
  const driveIds = new Set<string>(requestedDriveIds);
  const deletedDivisionKeys = new Set<string>();

  const ownedDivisions: JsonObj[] = [];
  if (u.user_id) {
    const r = await selectAllPaged(TABLES.seflikDivisions, { created_by_user_id: u.user_id }, "updated_at", 5000);
    ownedDivisions.push(...arr(r.items).map(obj));
  }
  if (u.user_key) {
    const r = await selectAllPaged(TABLES.seflikDivisions, { created_by_user_key: u.user_key }, "updated_at", 5000);
    ownedDivisions.push(...arr(r.items).map(obj));
  }

  for (const d of ownedDivisions) {
    const seflikKey = clean(d.seflik_key), bolmeKey = clean(d.bolme_key);
    const key = `${seflikKey}__${bolmeKey}`;
    if (!seflikKey || !bolmeKey || deletedDivisionKeys.has(key)) continue;
    deletedDivisionKeys.add(key);
    const syncRows = await selectAllPaged(TABLES.seflikSyncs, { seflik_key: seflikKey, bolme_key: bolmeKey }, "created_at", 10000);
    for (const row of arr(syncRows.items).map(obj)) {
      const id = clean(row.drive_file_id); if (id) driveIds.add(id);
    }
    results.push(await safeDeleteFilters(TABLES.seflikRecords, { seflik_key: seflikKey, bolme_key: bolmeKey }));
    results.push(await safeDeleteFilters(TABLES.seflikSyncs, { seflik_key: seflikKey, bolme_key: bolmeKey }));
    results.push(await safeDeleteFilters(TABLES.seflikDivisions, { seflik_key: seflikKey, bolme_key: bolmeKey }));
  }

  const ownSyncRows: JsonObj[] = [];
  if (u.user_id) {
    const r = await selectAllPaged(TABLES.seflikSyncs, { user_id: u.user_id }, "created_at", 10000);
    ownSyncRows.push(...arr(r.items).map(obj));
  }
  if (u.user_key) {
    const r = await selectAllPaged(TABLES.seflikSyncs, { user_key: u.user_key }, "created_at", 10000);
    ownSyncRows.push(...arr(r.items).map(obj));
  }
  for (const row of ownSyncRows) { const id = clean(row.drive_file_id); if (id) driveIds.add(id); }

  if (u.user_id) {
    results.push(await safeDelete(TABLES.seflikRecords, "uploaded_by_user_id", u.user_id));
    results.push(await safeDelete(TABLES.seflikSyncs, "user_id", u.user_id));
  }
  if (u.user_key) {
    results.push(await safeDelete(TABLES.seflikRecords, "uploaded_by_user_key", u.user_key));
    results.push(await safeDelete(TABLES.seflikSyncs, "user_key", u.user_key));
  }

  const allDriveIds = unique(Array.from(driveIds));
  const driveDelete = await deleteDriveFilesPermanent(allDriveIds);
  for (const driveId of allDriveIds) {
    results.push(...(await safeDeleteMany(TABLES.backupSlots, ["drive_file_id", "file_id", "id", "slot_id"], driveId)));
    results.push(...(await safeDeleteMany(TABLES.backupChunks, ["drive_file_id", "file_id", "slot_id"], driveId)));
  }

  if (u.user_id) {
    results.push(await safeDelete(TABLES.userAuthEvents, "user_id", u.user_id));
    results.push(await safeDelete(TABLES.userAccess, "user_id", u.user_id));
    for (const table of [TABLES.backupChunks, TABLES.backupSlots, TABLES.usageDaily, TABLES.usageCurrent, TABLES.logs, TABLES.events, TABLES.profiles]) {
      results.push(await safeDelete(table, "user_id", u.user_id));
    }
    try {
      const { error } = await admin.auth.admin.deleteUser(u.user_id);
      results.push({ table: "auth.users", column: "id", value: u.user_id, error: error?.message || null });
    } catch (e) {
      results.push({ table: "auth.users", column: "id", value: u.user_id, error: errorText(e) });
    }
  }
  if (u.user_key) {
    for (const table of [TABLES.backupChunks, TABLES.backupSlots, TABLES.usageDaily, TABLES.usageCurrent, TABLES.logs, TABLES.events, TABLES.profiles]) {
      results.push(await safeDelete(table, "user_key", u.user_key));
    }
    try { await admin.from(TABLES.blocks).delete().eq("block_type", "user_key").eq("block_value", u.user_key); } catch {}
    try { await admin.from(TABLES.blocks).delete().eq("block_type", "user_id").eq("block_value", u.user_id); } catch {}
  }
  if (u.name && u.seflik) {
    for (const table of [TABLES.backupSlots, TABLES.usageDaily, TABLES.usageCurrent, TABLES.profiles]) {
      results.push(await safeDeleteFilters(table, { name: u.name, seflik: u.seflik }));
    }
  }

  await insertEvent({
    ip_address: clientIpInfo(req).ip || null,
    event_type: "admin_delete_user_permanent",
    blocked: false,
    metadata: {
      ...u,
      permanent: true,
      divisions_deleted: Array.from(deletedDivisionKeys),
      drive_file_ids: allDriveIds,
      drive_delete: driveDelete,
      results,
    },
  });

  return json({
    ok: true,
    permanent: true,
    ...u,
    divisions_deleted: Array.from(deletedDivisionKeys),
    drive_file_ids: allDriveIds,
    drive_deleted: driveDelete.deleted,
    drive_delete_failed: driveDelete.failed,
    results,
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Sadece POST" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ ok: false, error: "Supabase Edge Function secret eksik" }, 500);
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > 12 * 1024 * 1024) return json({ ok: false, error: "İstek boyutu sınırı aşıldı" }, 413);

  const body = await bodyJson(req);
  const action = clean(body.action || "check");

  try {
    if (action === "admin_login") return await adminLogin(req, body);
    if (action === "admin_logout_local") return await adminLogout(req, false);
    if (action === "admin_logout_all") return await adminLogout(req, true);

    if (action.startsWith("admin_")) {
      if (action === "admin_drive_list") return await adminDriveList(req, body);
      const ctx: any = await requireAdminAuth(req, action);
      if (ctx.response) return ctx.response;
      let response: Response;
      if (action === "admin_list_all") response = await adminListAll(body);
      else if (action === "admin_list_user_access") response = await adminListUserAccess(body);
      else if (action === "admin_user_access_approve") response = await adminUserAccessApprove(req, body);
      else if (action === "admin_user_access_reject") response = await adminUserAccessDecision(req, body, "rejected");
      else if (action === "admin_user_access_revoke") response = await adminUserAccessDecision(req, body, "revoked");
      else if (action === "admin_user_access_reopen") response = await adminUserAccessDecision(req, body, "pending");
      else if (action === "admin_list_events") response = await adminListEvents(body);
      else if (action === "admin_list_security_logs") response = await adminListSecurityLogs(body);
      else if (action === "admin_list_blocks") response = await adminListBlocks();
      else if (action === "admin_add_block") response = await adminAddBlock(req, body);
      else if (action === "admin_remove_block") response = await adminRemoveBlock(req, body);
      else if (action === "admin_hide_drive_backup") response = await adminHideDriveBackup(req, body);
      else if (action === "admin_delete_user") response = await adminDeleteUser(req, body);
      else return json({ ok: false, error: "Bilinmeyen admin işlem: " + action }, 400);
      await adminAudit({ user_id: ctx.userId, email: ctx.email, session_id: ctx.sessionId, ip_address: clientIpInfo(req).ip, event_type: action, success: response.status < 400, metadata: { status: response.status } });
      return response;
    }

    if (action === "user_access_status") return await userAccessStatus(req, body);
    if (action === "user_access_request") return await userAccessRequest(req, body);

    if (action.startsWith("seflik_folder_")) {
      if (action === "seflik_folder_create_division") return await seflikFolderCreateDivision(req, body);
      if (action === "seflik_folder_delete_division") return await seflikFolderDeleteDivision(req, body);
      if (action === "seflik_folder_push") return await seflikFolderPush(req, body);
      if (action === "seflik_folder_finish") return await seflikFolderFinish(req, body);
      if (action === "seflik_folder_list") return await seflikFolderList(req, body);
      if (action === "seflik_folder_read") return await seflikFolderRead(req, body);
      return json({ ok: false, error: "Bilinmeyen Şeflik Klasörü işlemi: " + action }, 400);
    }

    if (action === "profile_ping" || action.startsWith("profile_ping_")) return await profileHeartbeat(req, body);
    if (action === "backup_gate") return await backupGate(req, body);
    if (action === "stats_sync") return await statsSync(req, body);
    if (action === "drive_backup" || action === "drive_list" || action === "drive_read") return await driveUserAction(req, body, action);

    /* Eski istemci aksiyonları geriye uyumlu kalır; yalnız profil/engel kontrolü yapar, istatistik yazmaz. */
    return await profileHeartbeat(req, body);
  } catch (e) {
    return json({ ok: false, error: errorText(e) }, 500);
  }
});

