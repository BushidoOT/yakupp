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
  try { return await req.json(); } catch { return {}; }
}

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

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function authUserId(req: Request): Promise<string> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token || !ANON_KEY) return "";
  try {
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data } = await userClient.auth.getUser();
    return data.user?.id || "";
  } catch {
    return "";
  }
}

async function insertEvent(row: JsonObj): Promise<void> {
  try { await admin.from("mesaha_security_events").insert(row); } catch { /* olay yazılamazsa kullanıcı akışı bozulmasın */ }
}

async function activeBlock(block_type: string, block_value: string) {
  if (!block_value) return null;
  const { data, error } = await admin
    .from("mesaha_security_blocks")
    .select("*")
    .eq("active", true)
    .eq("block_type", block_type)
    .eq("block_value", block_value)
    .limit(1);
  if (error) return null;
  return Array.isArray(data) && data.length ? data[0] : null;
}

async function checkAccess(req: Request, body: JsonObj) {
  const ip = clientIp(req);
  const userKey = lower(body.userKey || body.user_key);
  const deviceId = clean(body.deviceId || body.device_id);
  const blocks = [
    await activeBlock("ip", ip),
    await activeBlock("user_key", userKey),
    await activeBlock("device_id", deviceId),
  ].filter(Boolean) as JsonObj[];
  const blocked = blocks.length > 0;
  const reason = blocked ? clean(blocks[0].reason) || "Yönetici engeli" : "";
  const userId = await authUserId(req);

  await insertEvent({
    user_id: userId || null,
    ip_address: ip || null,
    user_key: userKey || null,
    name: clean(body.name) || null,
    seflik: clean(body.seflik) || null,
    device_id: deviceId || null,
    app_version: clean(body.appVersion || body.app_version) || null,
    event_type: clean(body.action || "check").slice(0, 80),
    blocked,
    reason: reason || null,
    metadata: body,
  });

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

async function adminListAll(body: JsonObj) {
  const limit = Math.min(Math.max(Number(body.limit || 2500) || 2500, 100), 5000);
  const [profiles, usage, backups, logs] = await Promise.all([
    listTable("mesaha_user_profiles", "updated_at", limit),
    listTable("mesaha_usage_current", "updated_at", limit),
    listTable("mesaha_backup_slots", "updated_at", limit),
    listTable("mesaha_log_current", "updated_at", limit),
  ]);
  return json({
    ok: true,
    profiles: profiles.items,
    usage: usage.items,
    backups: backups.items,
    logs: logs.items,
    errors: { profiles: profiles.error, usage: usage.error, backups: backups.error, logs: logs.error },
  });
}

async function adminListEvents(body: JsonObj) {
  const limit = Math.min(Math.max(Number(body.limit || 500) || 500, 50), 2000);
  const { data, error } = await admin
    .from("mesaha_security_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return json({ ok: false, error: error.message }, 500);
  return json({ ok: true, items: data || [] });
}

async function adminListBlocks() {
  const { data, error } = await admin
    .from("mesaha_security_blocks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return json({ ok: false, error: error.message }, 500);
  return json({ ok: true, items: data || [] });
}

async function adminAddBlock(req: Request, body: JsonObj) {
  const block_type = clean(body.block_type || body.type);
  const block_value = block_type === "user_key" ? lower(body.block_value || body.value) : clean(body.block_value || body.value);
  if (!block_type || !block_value) return json({ ok: false, error: "Engel tipi veya değeri boş" }, 400);

  const row = {
    block_type,
    block_value,
    reason: clean(body.reason) || "Admin engeli",
    active: true,
  };
  const { data, error } = await admin.from("mesaha_security_blocks").insert(row).select("*").limit(1);
  if (error) {
    const old = await activeBlock(block_type, block_value);
    if (old) return json({ ok: true, item: old, duplicate: true });
    return json({ ok: false, error: error.message }, 500);
  }
  await insertEvent({ ip_address: clientIp(req) || null, event_type: "admin_add_block", blocked: false, metadata: row });
  return json({ ok: true, item: Array.isArray(data) ? data[0] : data });
}

async function adminRemoveBlock(req: Request, body: JsonObj) {
  const id = clean(body.id);
  if (!id) return json({ ok: false, error: "Engel ID boş" }, 400);
  const { error } = await admin.from("mesaha_security_blocks").update({ active: false }).eq("id", id);
  if (error) return json({ ok: false, error: error.message }, 500);
  await insertEvent({ ip_address: clientIp(req) || null, event_type: "admin_remove_block", blocked: false, metadata: { id } });
  return json({ ok: true });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Sadece POST" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ ok: false, error: "Supabase Edge Function secret eksik" }, 500);

  const body = await bodyJson(req);
  const action = clean(body.action || "check");

  try {
    if (action.startsWith("admin_")) {
      const denied = requireAdmin(body);
      if (denied) return denied;
      if (action === "admin_list_all") return await adminListAll(body);
      if (action === "admin_list_events") return await adminListEvents(body);
      if (action === "admin_list_blocks") return await adminListBlocks();
      if (action === "admin_add_block") return await adminAddBlock(req, body);
      if (action === "admin_remove_block") return await adminRemoveBlock(req, body);
      return json({ ok: false, error: "Bilinmeyen admin işlem" }, 400);
    }
    return await checkAccess(req, body);
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
