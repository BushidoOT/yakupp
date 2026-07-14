import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const GOOGLE_CLIENT_ID = Deno.env.get("ISTIF_GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("ISTIF_GOOGLE_CLIENT_SECRET") || "";
const TOKEN_KEY = Deno.env.get("ISTIF_DRIVE_TOKEN_KEY") || "";
const FIXED_REDIRECT_URI = Deno.env.get("ISTIF_DRIVE_REDIRECT_URI") || "";
const DEFAULT_APP_REDIRECT_URI = "https://bushidoot.github.io/yakupp/";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

type JsonObj = Record<string, unknown>;
type FolderAccess = {
  userId: string;
  email: string;
  name: string;
  seflik: string;
  seflikKey: string;
  folderId: string;
  isOwner: boolean;
  token: string;
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function fold(value: unknown): string {
  return clean(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 160);
}

function seflikAlias(value: unknown): string {
  return fold(clean(value)
    .replace(/\s*Şefliği\s*$/i, "")
    .replace(/\s*Sefliği\s*$/i, "")
    .replace(/\s*Şeflik\s*$/i, "")
    .replace(/\s*Seflik\s*$/i, ""));
}

function sameSeflikName(a: unknown, b: unknown): boolean {
  const fa = fold(a), fb = fold(b), aa = seflikAlias(a), ab = seflikAlias(b);
  return !!(fa && fb && fa === fb) || !!(aa && ab && aa === ab);
}

function sameSeflikKey(a: unknown, b: unknown): boolean {
  const fa = fold(a), fb = fold(b);
  return !!(fa && fb && fa === fb);
}
function seflikAliases(name: unknown, key: unknown = ""): string[] {
  const out = new Set<string>();
  const add = (v: unknown) => { const k = fold(v); if (k) out.add(k); };
  add(key);
  add(name);
  const text = clean(name);
  add(text.replace(/\s*Şefliği\s*$/i, ""));
  add(text.replace(/\s*Sefliği\s*$/i, ""));
  add(text.replace(/\s*Şeflik\s*$/i, ""));
  add(text.replace(/\s*Seflik\s*$/i, ""));
  return [...out];
}


function json(data: JsonObj, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

async function bodyJson(req: Request): Promise<JsonObj> {
  try { return await req.json(); } catch { return {}; }
}

function bearer(req: Request): string {
  return clean((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let raw = "";
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const raw = atob(normalized);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function aesKey(): Promise<CryptoKey> {
  if (!TOKEN_KEY) throw new Error("ISTIF_DRIVE_TOKEN_KEY tanımlı değil");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(TOKEN_KEY));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptToken(token: string): Promise<{ cipher: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), new TextEncoder().encode(token));
  return { cipher: bytesToBase64Url(new Uint8Array(encrypted)), iv: bytesToBase64Url(iv) };
}

async function decryptToken(cipher: string, iv: string): Promise<string> {
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64UrlToBytes(iv) }, await aesKey(), base64UrlToBytes(cipher));
  return new TextDecoder().decode(decrypted);
}

async function authUser(req: Request) {
  const token = bearer(req);
  if (!token) throw new Error("Google ile giriş gerekli");
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Oturum doğrulanamadı");
  return { user: data.user, token };
}

function normalizeFolder(raw: JsonObj) {
  const name = clean(raw.seflik || raw.name || raw.folderSeflik || raw.title || raw.folder_name);
  const key = clean(raw.seflik_key || raw.seflikKey || raw.folder_key || fold(name));
  const role = clean(raw.role || raw.member_role || raw.access_role).toLocaleLowerCase("tr-TR");
  const ownerId = clean(raw.owner_user_id || raw.created_by || raw.created_by_user_id || raw.user_id);
  const isOwner = raw.is_creator === true || raw.isCreator === true || ["owner", "creator", "kurucu"].includes(role);
  return { name, key, role, isOwner, ownerId, id: clean(raw.id || raw.folder_id) };
}

function normalizeMember(raw: JsonObj) {
  return {
    userId: clean(raw.user_id || raw.member_user_id || raw.profile_user_id),
    email: clean(raw.email || raw.member_email || raw.user_email).toLocaleLowerCase("tr-TR"),
    name: clean(raw.name || raw.member_name || raw.full_name || raw.googleFullName || raw.google_full_name || raw.canonical_name || raw.requested_name),
    avatarUrl: clean(raw.avatar_url || raw.googleAvatarUrl || raw.google_avatar_url || raw.picture || raw.photo_url),
    seflikKey: clean(raw.seflik_key || raw.seflikKey || raw.folder_key),
    seflik: clean(raw.seflik || raw.folder_seflik || raw.folder_name),
    folderId: clean(raw.folder_id || raw.seflik_folder_id),
    role: clean(raw.role || raw.member_role || raw.access_role || "member").toLocaleLowerCase("tr-TR"),
    status: clean(raw.status || raw.member_status || "active").toLocaleLowerCase("tr-TR"),
    active: raw.active !== false && raw.is_active !== false,
  };
}

async function queryRows(table: string, filters: Array<[string, string]>, limit = 2000): Promise<JsonObj[]> {
  let query = admin.from(table).select("*").limit(limit);
  for (const [column, value] of filters) query = query.eq(column, value);
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data as JsonObj[] : [];
}

async function firstSuccessfulQueries(table: string, candidates: Array<Array<[string, string]>>): Promise<JsonObj[]> {
  let lastError: unknown = null;
  for (const filters of candidates) {
    try {
      const rows = await queryRows(table, filters);
      if (rows.length) return rows;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) console.warn(`[istif-drive] ${table} aday sorguları sonuç vermedi`, String((lastError as Error)?.message || lastError));
  return [];
}

function folderMatches(folder: ReturnType<typeof normalizeFolder>, wantedKey: string, wantedName: string, folderId = ""): boolean {
  if (folderId && folder.id && folder.id === folderId) return true;
  if (wantedKey && sameSeflikKey(folder.key, wantedKey)) return true;
  return !!(wantedName && sameSeflikName(folder.name, wantedName));
}

async function activeAccessForUser(user: any): Promise<ReturnType<typeof normalizeProfile> | null> {
  const rows = [...await safeRows("mesaha_user_access"), ...await safeRows("mesaha_user_profiles")];
  const email = clean(user.email).toLocaleLowerCase("tr-TR");
  const matches = rows
    .map((row) => ({ row, profile: normalizeProfile(row) }))
    .filter(({ row, profile }) => approvedLike(row) && ((profile.userId && profile.userId === user.id) || (email && profile.email === email)));
  const best = matches.find(({ profile }) => profile.seflik || profile.seflikKey) || matches[0];
  return best ? best.profile : null;
}

async function verifyFolderAccess(req: Request, body: JsonObj): Promise<FolderAccess> {
  const { user, token } = await authUser(req);
  const userEmail = clean(user.email).toLocaleLowerCase("tr-TR");
  const activeProfile = await activeAccessForUser(user);
  const wantedKey = clean(body.seflikKey || body.seflik_key || activeProfile?.seflikKey);
  const wantedName = clean(body.seflik || body.folderSeflik || activeProfile?.seflik);
  if (!wantedKey && !wantedName) throw new Error("Şeflik bilgisi eksik");

  const [memberRows, folderAllRows] = await Promise.all([
    safeRows("mesaha_seflik_members"),
    safeRows("mesaha_seflik_folders"),
  ]);
  const memberships = memberRows
    .map(normalizeMember)
    .filter((m) => m.active && !["removed", "rejected", "revoked", "deleted", "inactive"].includes(m.status))
    .filter((m) =>
      (m.userId && m.userId === user.id) ||
      (userEmail && m.email === userEmail)
    );

  const folderRows = folderAllRows.length ? folderAllRows : await firstSuccessfulQueries("mesaha_seflik_folders", [
    ...(wantedKey ? [[ ["seflik_key", wantedKey] ], [ ["folder_key", wantedKey] ]] as Array<Array<[string, string]>> : []),
    ...(wantedName ? [[ ["seflik", wantedName] ], [ ["name", wantedName] ], [ ["folder_name", wantedName] ]] as Array<Array<[string, string]>> : []),
  ]);
  const folders = folderRows.map(normalizeFolder).filter((folder) => folder.name);
  const membership = memberships.find((m) =>
    (wantedKey && sameSeflikKey(m.seflikKey, wantedKey)) ||
    (wantedName && sameSeflikName(m.seflik, wantedName)) ||
    !!m.folderId
  );
  let match = folders.find((folder) => folderMatches(folder, wantedKey, wantedName, membership?.folderId || ""));

  if (!match && activeProfile?.seflik && (sameSeflikName(activeProfile.seflik, wantedName) || !wantedName)) {
    match = { name: activeProfile.seflik, key: activeProfile.seflikKey || fold(activeProfile.seflik), role: "member", isOwner: false, ownerId: "", id: "" };
  }
  if (!match && wantedName) {
    const loose = folders.find((folder) => seflikAlias(folder.name) === seflikAlias(wantedName));
    if (loose) match = loose;
  }
  if (!match) {
    console.warn("[istif-drive] Şeflik eşleşmedi", { wantedKey, wantedName, activeSeflik: activeProfile?.seflik, folderCount: folders.length, membershipCount: memberships.length });
    throw new Error("Şeflik bulunamadı");
  }

  const memberMatchesFolder = memberships.some((m) =>
    (m.folderId && match.id && m.folderId === match.id) ||
    (m.seflikKey && sameSeflikKey(m.seflikKey, match.key)) ||
    (m.seflik && sameSeflikName(m.seflik, match.name))
  );
  const folderOwner = match.ownerId === user.id;
  const activeMatches = !!activeProfile && ((activeProfile.seflikKey && sameSeflikKey(activeProfile.seflikKey, match.key)) || sameSeflikName(activeProfile.seflik, match.name));
  if (!memberMatchesFolder && !folderOwner && !activeMatches) throw new Error("Bu şefliğe erişiminiz yok");

  const role = membership?.role || match.role;
  const isOwner = folderOwner || match.isOwner || ["owner", "creator", "kurucu"].includes(role);
  console.log("[istif-drive] şeflik erişimi doğrulandı", { userId: user.id, seflikKey: match.key, seflik: match.name, isOwner });
  return {
    userId: user.id,
    email: clean(user.email),
    name: clean(user.user_metadata?.full_name || user.user_metadata?.name || user.email),
    seflik: match.name,
    seflikKey: match.key || fold(match.name),
    folderId: match.id || '',
    isOwner,
    token,
  };
}

async function userAccountContext(req: Request, body: JsonObj): Promise<FolderAccess> {
  const { user, token } = await authUser(req);
  const profile = await activeAccessForUser(user);
  const seflik = clean(body.seflik || body.folderSeflik || profile?.seflik);
  const seflikKey = clean(body.seflikKey || body.seflik_key || profile?.seflikKey || (seflik ? fold(seflik) : ""));
  return {
    userId: user.id,
    email: clean(user.email),
    name: clean(user.user_metadata?.full_name || user.user_metadata?.name || user.email),
    seflik,
    seflikKey,
    folderId: "",
    isOwner: false,
    token,
  };
}

function requireOwner(access: FolderAccess) {
  if (!access.isOwner) throw new Error("Bu işlem yalnızca şeflik kurucusu tarafından yapılabilir");
}

function normalizeRedirectUri(value: unknown): string {
  const raw = clean(value);
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    parsed.search = ""; parsed.hash = "";
    parsed.pathname = parsed.pathname.replace(/\/index\.html$/i, "/").replace(/\/+$/, "/");
    return parsed.toString();
  } catch { return ""; }
}
function validateRedirectUri(value: unknown): string {
  const selected = normalizeRedirectUri(value) || normalizeRedirectUri(FIXED_REDIRECT_URI) || DEFAULT_APP_REDIRECT_URI;
  const parsed = new URL(selected);
  const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  const allowedGithub = parsed.hostname === "bushidoot.github.io" && parsed.pathname.startsWith("/yakupp/");
  if (!(local || allowedGithub)) throw new Error("Drive dönüş adresi yalnızca Suite test adresi olabilir");
  if (!local && parsed.protocol !== "https:") throw new Error("Drive dönüş adresi güvenli değil");
  return parsed.toString();
}

async function exchangeCode(code: string, redirectUri: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(clean(result.error_description || result.error) || "Google yetkilendirmesi tamamlanamadı");
  return result;
}

async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, grant_type: "refresh_token" }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token) throw new Error(clean(result.error_description || result.error) || "Google Drive erişimi yenilenemedi");
  return result.access_token;
}

async function driveRequest(url: string, accessToken: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(clean(result?.error?.message) || `Google Drive hatası ${response.status}`);
  return result;
}

function escapeDriveQuery(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findOrCreateFolder(accessToken: string, name: string, parentId = ""): Promise<{ id: string; name: string }> {
  const clauses = ["mimeType='application/vnd.google-apps.folder'", "trashed=false", `name='${escapeDriveQuery(name)}'`];
  if (parentId) clauses.push(`'${escapeDriveQuery(parentId)}' in parents`);
  const params = new URLSearchParams({ q: clauses.join(" and "), fields: "files(id,name)", pageSize: "10", spaces: "drive" });
  const listed = await driveRequest(`https://www.googleapis.com/drive/v3/files?${params}`, accessToken);
  if (Array.isArray(listed.files) && listed.files[0]?.id) return listed.files[0];
  const created = await driveRequest("https://www.googleapis.com/drive/v3/files?fields=id,name", accessToken, {
    method: "POST",
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", ...(parentId ? { parents: [parentId] } : {}) }),
  });
  return created;
}

async function connectionFor(userId: string) {
  const { data, error } = await admin.from("mesaha_user_drive_connections").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function driveStatus(req: Request, body: JsonObj) {
  const access = await userAccountContext(req, body);
  const connection = await connectionFor(access.userId);
  return json({
    ok: true,
    connected: !!connection?.refresh_token_cipher,
    isOwner: access.isOwner,
    ownerEmail: connection?.email || connection?.owner_email || "",
    ownerName: connection?.name || connection?.owner_name || "",
    email: connection?.email || "",
    name: connection?.name || "",
    folderId: connection?.folder_id || "",
    folderName: connection?.folder_name || "",
    folderUrl: connection?.folder_url || "",
    updatedAt: connection?.updated_at || "",
  });
}

async function oauthStart(req: Request, body: JsonObj) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !TOKEN_KEY) throw new Error("Drive sunucu ayarları tamamlanmamış");
  const access = await userAccountContext(req, body);
  const redirectUri = validateRedirectUri(body.redirectUri || body.redirect_uri);
  const rawState = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const stateHash = await sha256(rawState);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await admin.from("mesaha_user_drive_oauth_states").insert({
    state_hash: stateHash,
    user_id: access.userId,
    seflik_key: access.seflikKey,
    seflik: access.seflik,
    redirect_uri: redirectUri,
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: rawState,
  });
  console.log("[istif-drive] oauth_start redirect", { redirectUri, fixedRedirect: FIXED_REDIRECT_URI ? "set" : "empty" });
  return json({ ok: true, authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, redirectUri });
}

async function oauthFinish(req: Request, body: JsonObj) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !TOKEN_KEY) throw new Error("Drive sunucu ayarları tamamlanmamış");
  const { user } = await authUser(req);
  const code = clean(body.code);
  const rawState = clean(body.state);
  if (!code || !rawState) throw new Error("Google Drive dönüş bilgisi eksik");
  const stateHash = await sha256(rawState);
  const { data: stateRow, error } = await admin.from("mesaha_user_drive_oauth_states").select("*").eq("state_hash", stateHash).eq("user_id", user.id).maybeSingle();
  if (error || !stateRow) throw new Error("Drive bağlantı isteği geçersiz veya süresi dolmuş");
  if (new Date(stateRow.expires_at).getTime() < Date.now()) throw new Error("Drive bağlantı isteğinin süresi dolmuş");
  const access = await userAccountContext(req, { seflikKey: stateRow.seflik_key, seflik: stateRow.seflik });
  const redirectUri = validateRedirectUri(body.redirectUri || stateRow.redirect_uri);
  if (redirectUri !== stateRow.redirect_uri) {
    console.warn("[istif-drive] oauth_finish redirect mismatch", { redirectUri, stored: stateRow.redirect_uri });
    throw new Error("Drive dönüş adresi eşleşmiyor");
  }
  const tokens = await exchangeCode(code, redirectUri);
  const refreshToken = clean(tokens.refresh_token);
  if (!refreshToken) throw new Error("Google yenileme anahtarı vermedi. Bağlantıyı yeniden deneyin");
  const accessToken = clean(tokens.access_token);
  const root = await findOrCreateFolder(accessToken, `Mesaha Suite - ${access.name || access.email || access.userId}`);
  const encrypted = await encryptToken(refreshToken);
  const folderUrl = `https://drive.google.com/drive/folders/${root.id}`;
  const { error: upsertError } = await admin.from("mesaha_user_drive_connections").upsert({
    user_id: access.userId,
    email: access.email || null,
    name: access.name || null,
    last_seflik_key: access.seflikKey || null,
    last_seflik: access.seflik || null,
    refresh_token_cipher: encrypted.cipher,
    refresh_token_iv: encrypted.iv,
    folder_id: root.id,
    folder_name: root.name,
    folder_url: folderUrl,
    scopes: clean(tokens.scope) || "https://www.googleapis.com/auth/drive.file",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (upsertError) throw new Error(upsertError.message);
  await admin.from("mesaha_user_drive_oauth_states").delete().eq("id", stateRow.id);
  return json({ ok: true, connected: true, folderId: root.id, folderName: root.name, folderUrl });
}

async function disconnect(req: Request, body: JsonObj) {
  const access = await userAccountContext(req, body);
  const connection = await connectionFor(access.userId);
  if (connection?.refresh_token_cipher) {
    try {
      const refreshToken = await decryptToken(connection.refresh_token_cipher, connection.refresh_token_iv);
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    } catch { /* bağlantı kaydı yine kaldırılır */ }
  }
  const { error } = await admin.from("mesaha_user_drive_connections").delete().eq("user_id", access.userId);
  if (error) throw new Error(error.message);
  return json({ ok: true });
}

async function uploadSession(req: Request, body: JsonObj) {
  const access = await verifyFolderAccess(req, body);
  const connection = await connectionFor(access.userId);
  if (!connection?.refresh_token_cipher) throw new Error("Şeflik Drive alanı bağlı değil");
  const refreshToken = await decryptToken(connection.refresh_token_cipher, connection.refresh_token_iv);
  const accessToken = await refreshGoogleToken(refreshToken);
  const recordDate = clean(body.recordDate || body.record_date) || new Date().toISOString().slice(0, 10);
  const year = recordDate.slice(0, 4) || String(new Date().getFullYear());
  const bolmeNo = clean(body.bolmeNo || body.bolme_no) || "Bölme Yok";
  const istifNo = clean(body.istifNo || body.istif_no) || "İstif";
  const fileName = clean(body.fileName || body.file_name).replace(/[\\/:*?"<>|]+/g, "_").slice(0, 180) || `foto_${Date.now()}.jpg`;
  const mimeType = clean(body.mimeType || body.mime_type) || "image/jpeg";
  const size = Math.max(1, Math.min(Number(body.size || 0) || 1, 2 * 1024 * 1024));
  const seflikFolder = await findOrCreateFolder(accessToken, `Şeflik - ${access.seflik}`, connection.folder_id);
  const appFolder = await findOrCreateFolder(accessToken, "İstif İO", seflikFolder.id);
  const yearFolder = await findOrCreateFolder(accessToken, year, appFolder.id);
  const bolmeFolder = await findOrCreateFolder(accessToken, `Bölme ${bolmeNo}`, yearFolder.id);
  const istifFolder = await findOrCreateFolder(accessToken, `İstif ${istifNo}`, bolmeFolder.id);
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink,parents,size,mimeType", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": mimeType,
      "X-Upload-Content-Length": String(size),
    },
    body: JSON.stringify({ name: fileName, parents: [istifFolder.id], description: `${access.seflik} • Bölme ${bolmeNo} • İstif ${istifNo}` }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(clean(result?.error?.message) || `Drive yükleme oturumu ${response.status}`);
  }
  const location = response.headers.get("location") || "";
  if (!location) throw new Error("Drive yükleme adresi alınamadı");
  return json({ ok: true, uploadUrl: location, folderId: istifFolder.id, folderName: istifFolder.name });
}


async function driveUploadFolder(access: FolderAccess, connection: JsonObj, accessToken: string, body: JsonObj) {
  const recordDate = clean(body.recordDate || body.record_date) || new Date().toISOString().slice(0, 10);
  const year = recordDate.slice(0, 4) || String(new Date().getFullYear());
  const bolmeNo = clean(body.bolmeNo || body.bolme_no) || "Bölme Yok";
  const istifNo = clean(body.istifNo || body.istif_no) || "İstif";
  const seflikFolder = await findOrCreateFolder(accessToken, `Şeflik - ${access.seflik}`, clean(connection.folder_id));
  const appFolder = await findOrCreateFolder(accessToken, "İstif İO", seflikFolder.id);
  const yearFolder = await findOrCreateFolder(accessToken, year, appFolder.id);
  const bolmeFolder = await findOrCreateFolder(accessToken, `Bölme ${bolmeNo}`, yearFolder.id);
  const istifFolder = await findOrCreateFolder(accessToken, `İstif ${istifNo}`, bolmeFolder.id);
  return { recordDate, year, bolmeNo, istifNo, istifFolder };
}

function base64ToBytes(value: string): Uint8Array {
  const cleanValue = clean(value).replace(/^data:[^,]+,/i, "").replace(/\s+/g, "");
  const raw = atob(cleanValue);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array): string {
  let raw = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    raw += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(raw);
}

async function uploadPhoto(req: Request, body: JsonObj) {
  const access = await verifyFolderAccess(req, body);
  const connection = await connectionFor(access.userId);
  if (!connection?.refresh_token_cipher) throw new Error("Şeflik Drive alanı bağlı değil");
  const refreshToken = await decryptToken(connection.refresh_token_cipher, connection.refresh_token_iv);
  const accessToken = await refreshGoogleToken(refreshToken);
  const { bolmeNo, istifNo, istifFolder } = await driveUploadFolder(access, connection, accessToken, body);
  const fileName = clean(body.fileName || body.file_name).replace(/[\/:*?"<>|]+/g, "_").slice(0, 180) || `foto_${Date.now()}.jpg`;
  const mimeType = clean(body.mimeType || body.mime_type) || "image/jpeg";
  const encoded = clean(body.dataUrl || body.data_url || body.base64 || body.data);
  if (!encoded) throw new Error("Fotoğraf verisi alınamadı");
  const bytes = base64ToBytes(encoded);
  if (!bytes.length) throw new Error("Fotoğraf verisi boş");
  if (bytes.length > 2 * 1024 * 1024) throw new Error("Fotoğraf 2 MB üstünde. Uygulama fotoğrafı küçültemedi.");
  const metadata = { name: fileName, parents: [istifFolder.id], description: `${access.seflik} • Bölme ${bolmeNo} • İstif ${istifNo}` };
  const boundary = `istif_${crypto.randomUUID().replace(/-/g, "")}`;
  const bodyBlob = new Blob([
    `--${boundary}
Content-Type: application/json; charset=UTF-8

${JSON.stringify(metadata)}
`,
    `--${boundary}
Content-Type: ${mimeType}

`,
    bytes,
    `
--${boundary}--`,
  ], { type: `multipart/related; boundary=${boundary}` });
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,parents,size,mimeType", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body: bodyBlob,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(clean(result?.error?.message) || `Drive fotoğraf yükleme ${response.status}`);
  console.log("[istif-drive] upload_photo", { seflikKey: access.seflikKey, bolmeNo, istifNo, fileName, size: bytes.length, fileId: result.id });
  return json({ ok: true, ...result, folderId: istifFolder.id, folderName: istifFolder.name });
}

async function photoData(req: Request, body: JsonObj) {
  const access = await verifyFolderAccess(req, body);
  const connection = await connectionFor(access.userId);
  if (!connection?.refresh_token_cipher) throw new Error("Şeflik Drive alanı bağlı değil");
  const fileId = clean(body.fileId || body.file_id || body.id);
  if (!fileId) throw new Error("Drive fotoğraf kimliği eksik");
  const refreshToken = await decryptToken(connection.refresh_token_cipher, connection.refresh_token_iv);
  const accessToken = await refreshGoogleToken(refreshToken);
  const meta = await driveRequest(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,parents,trashed`, accessToken);
  if (meta.trashed === true) throw new Error("Drive fotoğrafı silinmiş");
  const mimeType = clean(meta.mimeType || body.mimeType || body.mime_type || "image/jpeg");
  const size = Number(meta.size || 0);
  if (size > 8 * 1024 * 1024) throw new Error("Drive fotoğrafı çok büyük. Yeniden senkronize edin.");
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(clean(result?.error?.message) || `Drive fotoğraf okuma ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length) throw new Error("Drive fotoğrafı boş döndü");
  const dataUrl = `data:${mimeType};base64,${bytesToBase64(bytes)}`;
  console.log("[istif-drive] photo_data", { seflikKey: access.seflikKey, fileId, size: bytes.length });
  return json({ ok: true, id: fileId, name: clean(meta.name), mimeType, size: bytes.length, dataUrl });
}


function driveFileIdsFromBody(body: JsonObj): string[] {
  const out = new Set<string>();
  const add = (value: unknown) => { const id = clean(value); if (id) out.add(id); };
  const arrays = [body.fileIds, body.file_ids, body.driveFiles, body.drive_files, body.files];
  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (typeof item === "string") add(item);
      else if (item && typeof item === "object") add((item as JsonObj).id || (item as JsonObj).fileId || (item as JsonObj).file_id);
    }
  }
  return [...out];
}

async function driveListFileIdsInFolder(accessToken: string, folderId: string): Promise<string[]> {
  if (!folderId) return [];
  const params = new URLSearchParams({
    q: `'${escapeDriveQuery(folderId)}' in parents and trashed=false`,
    fields: "files(id,name,mimeType)",
    pageSize: "1000",
    spaces: "drive",
  });
  const listed = await driveRequest(`https://www.googleapis.com/drive/v3/files?${params}`, accessToken);
  return Array.isArray(listed.files) ? listed.files.map((file: JsonObj) => clean(file.id)).filter(Boolean) : [];
}

async function driveDeleteFile(accessToken: string, fileId: string): Promise<{ id: string; ok: boolean; error?: string }> {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 404) return { id: fileId, ok: true };
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return { id: fileId, ok: false, error: clean(result?.error?.message) || `Drive silme ${response.status}` };
    }
    return { id: fileId, ok: true };
  } catch (error) {
    return { id: fileId, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function deleteDriveFiles(req: Request, body: JsonObj) {
  const access = await verifyFolderAccess(req, body);
  const connection = await connectionFor(access.userId);
  if (!connection?.refresh_token_cipher) throw new Error("Şeflik Drive alanı bağlı değil");
  const refreshToken = await decryptToken(connection.refresh_token_cipher, connection.refresh_token_iv);
  const accessToken = await refreshGoogleToken(refreshToken);
  const fileIds = new Set<string>(driveFileIdsFromBody(body));
  const folderId = clean(body.driveFolderId || body.drive_folder_id || body.folderId || body.folder_id);
  if (folderId) {
    try {
      const folderFiles = await driveListFileIdsInFolder(accessToken, folderId);
      folderFiles.forEach((id) => fileIds.add(id));
    } catch (error) {
      console.warn("[istif-drive] klasör dosyaları listelenemedi", { folderId, error: error instanceof Error ? error.message : String(error) });
    }
  }
  const ids = [...fileIds].filter(Boolean);
  if (!ids.length) return json({ ok: true, deleted: 0, failed: [], skipped: true });
  const results = [] as Array<{ id: string; ok: boolean; error?: string }>;
  for (const id of ids) results.push(await driveDeleteFile(accessToken, id));
  const failed = results.filter((item) => !item.ok);
  console.log("[istif-drive] delete_drive_files", { seflikKey: access.seflikKey, count: ids.length, deleted: ids.length - failed.length, failed: failed.length, folderId });
  if (failed.length) throw new Error(`${failed.length} Drive dosyası silinemedi: ${failed[0].error || failed[0].id}`);
  return json({ ok: true, deleted: ids.length, failed: [] });
}

async function safeRows(table: string, limit = 5000): Promise<JsonObj[]> {
  try {
    const { data, error } = await admin.from(table).select("*").limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data as JsonObj[] : [];
  } catch (error) {
    console.warn(`[istif-drive] ${table} okunamadı`, String((error as Error)?.message || error));
    return [];
  }
}

function normalizeProfile(raw: JsonObj) {
  const userId = clean(raw.user_id || raw.userId || raw.id || raw.profile_user_id);
  const email = clean(raw.email || raw.google_email || raw.user_email || raw.canonical_email).toLocaleLowerCase("tr-TR");
  const name = clean(raw.name || raw.canonical_name || raw.googleFullName || raw.google_full_name || raw.displayName || raw.display_name || raw.full_name || email);
  const seflik = clean(raw.seflik || raw.canonical_seflik || raw.activeSeflik || raw.active_seflik || raw.folder_seflik);
  const seflikKey = clean(raw.seflik_key || raw.seflikKey || (seflik ? fold(seflik) : ""));
  const status = clean(raw.status || raw.access_status || raw.google_status || raw.approval_status || "").toLocaleLowerCase("tr-TR");
  const avatarUrl = clean(raw.avatar_url || raw.googleAvatarUrl || raw.google_avatar_url || raw.picture || raw.photo_url);
  return { userId, email, name, seflik, seflikKey, status, avatarUrl, raw };
}

function approvedLike(raw: JsonObj): boolean {
  const status = clean(raw.status || raw.access_status || raw.google_status || raw.approval_status || raw.state).toLocaleLowerCase("tr-TR");
  if (["blocked", "rejected", "revoked", "deleted", "inactive", "banned", "banli", "engelli"].includes(status)) return false;
  if (raw.pending === true || status === "pending" || status === "bekliyor") return false;
  if (["approved", "enabled", "ok", "active", "accepted", "allow", "allowed", "onayli", "onaylı"].includes(status)) return true;
  if (raw.googleApproved === true || raw.google_approved === true || raw.approved === true || raw.is_approved === true || raw.isApproved === true) return true;
  const provider = clean(raw.provider || raw.auth_provider || raw.source || raw.login_provider).toLocaleLowerCase("tr-TR");
  if (provider.includes("google") && (raw.user_id || raw.email || raw.google_email)) return true;
  // Mesaha İO eski tablolarında bazı Google giriş kayıtlarında status boş kalabiliyor.
  // Bloklu/pending değilse ve kimlik bilgisi varsa öneriye dahil ediyoruz.
  if ((raw.user_id || raw.userId || raw.id || raw.profile_user_id || raw.email || raw.google_email) && (raw.name || raw.canonical_name || raw.full_name || raw.email || raw.google_email)) return true;
  return false;
}


async function authGoogleUsers(): Promise<Array<ReturnType<typeof normalizeProfile>>> {
  const out: Array<ReturnType<typeof normalizeProfile>> = [];
  try {
    for (let page = 1; page <= 20; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      const users = Array.isArray(data?.users) ? data.users : [];
      for (const user of users) {
        const meta = (user.user_metadata || {}) as JsonObj;
        const appMeta = (user.app_metadata || {}) as JsonObj;
        const identities = Array.isArray((user as JsonObj).identities) ? (user as JsonObj).identities as JsonObj[] : [];
        const provider = clean(appMeta.provider || meta.provider || identities[0]?.provider).toLocaleLowerCase("tr-TR");
        const hasGoogleIdentity = provider.includes("google") || identities.some((item) => clean(item.provider).toLocaleLowerCase("tr-TR").includes("google"));
        if (!hasGoogleIdentity && !clean(user.email)) continue;
        if ((user as JsonObj).banned_until || (user as JsonObj).deleted_at) continue;
        const email = clean(user.email).toLocaleLowerCase("tr-TR");
        const name = clean(meta.full_name || meta.name || meta.display_name || meta.user_name || email);
        if (!name && !email) continue;
        out.push({
          userId: clean(user.id),
          email,
          name: name || email,
          seflik: clean(meta.seflik || meta.canonical_seflik || meta.activeSeflik || meta.active_seflik),
          seflikKey: clean(meta.seflik_key || meta.seflikKey || (meta.seflik ? fold(meta.seflik) : "")),
          status: "approved",
          avatarUrl: clean(meta.avatar_url || meta.picture || meta.googleAvatarUrl || meta.photo_url),
          raw: user as unknown as JsonObj,
        });
      }
      if (users.length < 1000) break;
    }
  } catch (error) {
    console.warn("[istif-drive] auth kullanıcıları okunamadı", String((error as Error)?.message || error));
  }
  return out;
}

async function approvedUsers(): Promise<Array<ReturnType<typeof normalizeProfile>>> {
  const [profileRows, accessRows, authRows] = await Promise.all([
    safeRows("mesaha_user_profiles"),
    safeRows("mesaha_user_access"),
    authGoogleUsers(),
  ]);
  const profileMap = new Map<string, ReturnType<typeof normalizeProfile>>();
  for (const row of profileRows) {
    const p = normalizeProfile(row);
    const key = p.userId ? `uid:${p.userId}` : (p.email ? `email:${p.email}` : "");
    if (key) profileMap.set(key, p);
  }
  const blocked = new Set<string>();
  for (const row of [...accessRows, ...profileRows]) {
    const p = normalizeProfile(row);
    const status = clean((row as JsonObj).status || (row as JsonObj).access_status || (row as JsonObj).google_status || (row as JsonObj).approval_status || (row as JsonObj).state).toLocaleLowerCase("tr-TR");
    if (["blocked", "rejected", "revoked", "deleted", "inactive", "banned"].includes(status)) {
      if (p.userId) blocked.add(`uid:${p.userId}`);
      if (p.email) blocked.add(`email:${p.email}`);
    }
  }
  const map = new Map<string, ReturnType<typeof normalizeProfile>>();
  const candidates = [
    ...authRows,
    ...accessRows.filter((row) => approvedLike(row)).map(normalizeProfile),
    ...profileRows.filter((row) => approvedLike(row)).map(normalizeProfile),
  ];
  for (const p0 of candidates) {
    const p = p0 && "raw" in p0 ? p0 as ReturnType<typeof normalizeProfile> : normalizeProfile(p0 as unknown as JsonObj);
    if (!p.name || (!p.userId && !p.email)) continue;
    if ((p.userId && blocked.has(`uid:${p.userId}`)) || (p.email && blocked.has(`email:${p.email}`))) continue;
    const profile = (p.userId && profileMap.get(`uid:${p.userId}`)) || (p.email && profileMap.get(`email:${p.email}`)) || null;
    const merged = {
      ...p,
      name: p.name || profile?.name || p.email || "Google kullanıcısı",
      email: p.email || profile?.email || "",
      avatarUrl: p.avatarUrl || profile?.avatarUrl || "",
      seflik: p.seflik || profile?.seflik || "",
      seflikKey: p.seflikKey || profile?.seflikKey || "",
    };
    const key = merged.userId ? `uid:${merged.userId}` : (merged.email ? `email:${merged.email}` : `name:${fold(merged.name)}`);
    const existing = map.get(key);
    if (!existing || (!existing.avatarUrl && merged.avatarUrl) || (!existing.seflik && merged.seflik)) map.set(key, merged);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

async function folderMembers(access: FolderAccess) {
  const [memberRows, allUsers, customRows] = await Promise.all([
    safeRows("mesaha_seflik_members"),
    approvedUsers(),
    safeRows("mesaha_istif_foresters"),
  ]);
  const memberships = memberRows.map(normalizeMember).filter((m) => m.active && !["removed", "rejected", "revoked", "deleted", "inactive"].includes(m.status));
  const relatedMemberIds = new Set<string>();
  const relatedEmails = new Set<string>();
  const out = new Map<string, JsonObj>();
  for (const m of memberships) {
    const same = (m.seflikKey && sameSeflikKey(m.seflikKey, access.seflikKey)) || (m.seflik && sameSeflikName(m.seflik, access.seflik));
    if (!same) continue;
    if (m.userId) relatedMemberIds.add(m.userId);
    if (m.email) relatedEmails.add(m.email);
    if (m.name || m.email || m.userId) {
      const key = m.userId ? `uid:${m.userId}` : (m.email ? `email:${m.email}` : `name:${fold(m.name)}`);
      out.set(key, { user_id: m.userId, email: m.email, name: m.name || m.email || "Google kullanıcısı", avatar_url: m.avatarUrl, role: m.role || "member", is_self: m.userId === access.userId || (!!m.email && m.email === access.email.toLocaleLowerCase("tr-TR")), custom: false });
    }
  }
  for (const u of allUsers) {
    const sameSeflik = (u.seflikKey && sameSeflikKey(u.seflikKey, access.seflikKey)) || (u.seflik && sameSeflikName(u.seflik, access.seflik));
    const related = sameSeflik || (u.userId && relatedMemberIds.has(u.userId)) || (u.email && relatedEmails.has(u.email)) || u.userId === access.userId || u.email === access.email.toLocaleLowerCase("tr-TR");
    if (!related) continue;
    const key = u.userId ? `uid:${u.userId}` : (u.email ? `email:${u.email}` : `name:${fold(u.name)}`);
    out.set(key, { user_id: u.userId, email: u.email, name: u.name, avatar_url: u.avatarUrl, role: u.userId === access.userId ? (access.isOwner ? "owner" : "member") : "member", is_self: u.userId === access.userId, custom: false });
  }
  for (const row of customRows) {
    if (clean(row.seflik_key) && !sameSeflikKey(clean(row.seflik_key), access.seflikKey)) continue;
    if (row.active === false) continue;
    const name = clean(row.name);
    if (!name) continue;
    const email = clean(row.email).toLocaleLowerCase("tr-TR");
    const userId = clean(row.forester_user_id || row.user_id);
    const key = userId ? `uid:${userId}` : (email ? `email:${email}` : `name:${fold(name)}`);
    out.set(key, { id: clean(row.id), user_id: userId, email, name, avatar_url: clean(row.avatar_url), role: "forester", custom: true, pending: false });
  }
  return [...out.values()].sort((a, b) => clean(a.name).localeCompare(clean(b.name), "tr"));
}

async function sharedContext(req: Request, body: JsonObj) {
  const access = await verifyFolderAccess(req, body);
  const members = await folderMembers(access);
  const folder = { name: access.seflik, key: access.seflikKey, role: access.isOwner ? "owner" : "member", is_creator: access.isOwner, isCreator: access.isOwner };
  const membersBySeflik: Record<string, JsonObj[]> = {};
  const customForestersBySeflik: Record<string, JsonObj[]> = {};
  for (const alias of seflikAliases(access.seflik, access.seflikKey)) {
    membersBySeflik[alias] = members;
    customForestersBySeflik[alias] = members.filter((m) => m.custom);
  }
  console.log("[istif-drive] shared_context", { seflikKey: access.seflikKey, seflik: access.seflik, memberCount: members.length });
  return json({
    ok: true,
    access: { status: "approved", user_id: access.userId, email: access.email, name: access.name, seflik: access.seflik, canonical_seflik: access.seflik, seflik_key: access.seflikKey, role: access.isOwner ? "owner" : "member" },
    folders: [folder],
    membersBySeflik,
    customForestersBySeflik,
  });
}

async function userSearch(req: Request, body: JsonObj) {
  const access = await verifyFolderAccess(req, body);
  const q = fold(body.q || body.query || "");
  if (q.length < 3) return json({ ok: true, users: [] });
  const [users, members] = await Promise.all([approvedUsers(), folderMembers(access).catch(() => [])]);
  const self = { userId: access.userId, email: access.email.toLocaleLowerCase("tr-TR"), name: access.name || access.email, avatarUrl: "", seflik: access.seflik, seflikKey: access.seflikKey, status: "approved", raw: {} as JsonObj };
  const seen = new Set<string>();
  const pool = [
    self,
    ...members.map((m) => normalizeProfile({
      user_id: clean(m.user_id),
      email: clean(m.email),
      name: clean(m.name),
      avatar_url: clean(m.avatar_url),
      seflik: access.seflik,
      seflik_key: access.seflikKey,
      status: "approved",
    })),
    ...users,
  ];
  const filtered = pool
    .filter((u) => {
      const hay = fold(`${u.name} ${u.email} ${u.seflik}`);
      return hay.includes(q);
    })
    .sort((a, b) => {
      const as = (a.seflikKey && sameSeflikKey(a.seflikKey, access.seflikKey)) || sameSeflikName(a.seflik, access.seflik) ? 0 : 1;
      const bs = (b.seflikKey && sameSeflikKey(b.seflikKey, access.seflikKey)) || sameSeflikName(b.seflik, access.seflik) ? 0 : 1;
      return as - bs || a.name.localeCompare(b.name, "tr");
    })
    .filter((u) => {
      const key = u.userId ? `uid:${u.userId}` : (u.email ? `email:${u.email}` : `name:${fold(u.name)}`);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20)
    .map((u) => ({ userId: u.userId, email: u.email, name: u.name, avatarUrl: u.avatarUrl, seflik: u.seflik, seflikKey: u.seflikKey }));
  console.log("[istif-drive] user_search", { seflikKey: access.seflikKey, q, count: filtered.length });
  return json({ ok: true, users: filtered });
}

async function foresterList(req: Request, body: JsonObj) {
  const access = await verifyFolderAccess(req, body);
  const members = await folderMembers(access);
  return json({ ok: true, foresters: members });
}

async function foresterAdd(req: Request, body: JsonObj) {
  const access = await verifyFolderAccess(req, body);
  const wantedUserId = clean(body.userId || body.user_id || body.forester_user_id);
  const wantedEmail = clean(body.email).toLocaleLowerCase("tr-TR");
  const wantedName = clean(body.name || body.ormanci);
  const users = await approvedUsers();
  const target = users.find((u) =>
    (wantedUserId && u.userId === wantedUserId) ||
    (wantedEmail && u.email === wantedEmail) ||
    (wantedName && fold(u.name) === fold(wantedName))
  );
  if (!target) throw new Error("Ormancı yalnızca Mesaha İO’da Google ile giriş yapmış onaylı kullanıcılardan seçilebilir");
  const normalizedName = fold(target.name);
  const row: JsonObj = {
    seflik_key: access.seflikKey,
    seflik: access.seflik,
    name: target.name,
    normalized_name: normalizedName,
    forester_user_id: target.userId || null,
    email: target.email || null,
    avatar_url: target.avatarUrl || null,
    source: "google_user",
    created_by: access.userId,
    active: true,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await admin.from("mesaha_istif_foresters").upsert(row, { onConflict: "seflik_key,normalized_name" }).select("*").single();
  if (error) throw new Error(error.message);
  return json({ ok: true, forester: { id: data.id, user_id: data.forester_user_id, email: data.email, name: data.name, avatar_url: data.avatar_url, custom: true, role: "forester" } });
}


function sameRemovePerson(raw: JsonObj, userId: string, email: string, name: string): boolean {
  const member = normalizeMember(raw);
  if (userId && member.userId && member.userId === userId) return true;
  if (email && member.email && member.email === email) return true;
  if (name && member.name && fold(member.name) === fold(name)) return true;
  return false;
}

function sameRemoveSeflik(raw: JsonObj, access: FolderAccess): boolean {
  const member = normalizeMember(raw);
  if (member.folderId && access.folderId && member.folderId === access.folderId) return true;
  if (member.seflikKey && sameSeflikKey(member.seflikKey, access.seflikKey)) return true;
  if (member.seflik && sameSeflikName(member.seflik, access.seflik)) return true;
  if (!member.folderId && !member.seflikKey && !member.seflik) return true;
  return false;
}

async function softRemoveMemberRow(row: JsonObj): Promise<boolean> {
  const id = clean(row.id);
  if (!id) return false;
  const now = new Date().toISOString();
  const attempts: JsonObj[] = [
    { status: "removed", active: false, updated_at: now },
    { member_status: "removed", active: false, updated_at: now },
    { status: "removed", is_active: false, updated_at: now },
    { member_status: "removed", is_active: false, updated_at: now },
    { status: "removed" },
    { member_status: "removed" },
    { active: false },
    { is_active: false },
  ];
  for (const payload of attempts) {
    try {
      const { error } = await admin.from("mesaha_seflik_members").update(payload).eq("id", id);
      if (!error) return true;
    } catch { /* sonraki uyumlu kolon denensin */ }
  }
  try {
    const { error } = await admin.from("mesaha_seflik_members").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

async function foresterRemove(req: Request, body: JsonObj) {
  const access = await verifyFolderAccess(req, body);
  requireOwner(access);
  const id = clean(body.id);
  const userId = clean(body.userId || body.user_id || body.forester_user_id);
  const email = clean(body.email).toLocaleLowerCase("tr-TR");
  const name = clean(body.name || body.ormanci);
  if (!id && !userId && !email && !name) throw new Error("Çıkarılacak ormancı bilgisi eksik");

  let customRemoved = 0;
  try {
    let query = admin.from("mesaha_istif_foresters").update({ active: false, updated_at: new Date().toISOString() }).eq("seflik_key", access.seflikKey);
    if (id) query = query.eq("id", id);
    else if (userId) query = query.eq("forester_user_id", userId);
    else if (email) query = query.eq("email", email);
    else if (name) query = query.eq("normalized_name", fold(name));
    const { data, error } = await query.select("id");
    if (error) throw error;
    customRemoved = Array.isArray(data) ? data.length : 0;
  } catch (error) {
    console.warn("[istif-drive] özel ormancı pasifleştirilemedi", String((error as Error)?.message || error));
  }

  const memberRows = await safeRows("mesaha_seflik_members");
  const matchedMembers = memberRows.filter((row) => {
    const member = normalizeMember(row);
    if (!member.active || ["removed", "rejected", "revoked", "deleted", "inactive"].includes(member.status)) return false;
    return sameRemoveSeflik(row, access) && sameRemovePerson(row, userId, email, name);
  });
  let sharedRemoved = 0;
  for (const row of matchedMembers) {
    if (await softRemoveMemberRow(row)) sharedRemoved += 1;
  }

  console.log("[istif-drive] forester_remove", { seflikKey: access.seflikKey, id, userId, email, name, customRemoved, sharedRemoved });
  if (!customRemoved && !sharedRemoved) {
    return json({ ok: true, removed: 0, warning: "Bu ormancı için sunucuda kaldırılacak kayıt bulunamadı; yerel liste yenilendi." });
  }
  return json({ ok: true, removed: customRemoved + sharedRemoved, customRemoved, sharedRemoved });
}


function normalizeRecordRow(row: JsonObj) {
  return {
    id: clean(row.id || row.record_id),
    user_id: clean(row.user_id || row.userId),
    seflik_key: clean(row.seflik_key || row.seflikKey),
    seflik: clean(row.seflik),
    ormanci: clean(row.ormanci || row.forester || row.forester_name),
    record_date: clean(row.record_date || row.date),
    bolme_no: clean(row.bolme_no || row.bolme || row.bolmeNo),
    istif_no: clean(row.istif_no || row.istifNo),
    wood_type: clean(row.wood_type || row.type),
    ster: row.ster,
    coordinates: clean(row.coordinates || row.coordinate || row.kordinat),
    mevki: clean(row.mevki || row.location_note),
    description: clean(row.description || row.aciklama),
    barcode_no: clean(row.barcode_no || row.barcode),
    photo_count: Number(row.photo_count || 0) || 0,
    drive_folder_id: clean(row.drive_folder_id || row.driveFolderId),
    drive_files: Array.isArray(row.drive_files) ? row.drive_files : [],
    sync_status: clean(row.sync_status || "synced"),
    is_sent: row.is_sent === true || row.isSent === true,
    sent_at: clean(row.sent_at || row.sentAt),
    sent_by: clean(row.sent_by || row.sentBy),
    created_at: clean(row.created_at || row.createdAt),
    updated_at: clean(row.updated_at || row.updatedAt),
  };
}

async function recordList(req: Request, body: JsonObj) {
  const access = await verifyFolderAccess(req, body);
  const aliases = seflikAliases(access.seflik, access.seflikKey);
  const rows = new Map<string, JsonObj>();
  const attempts: PromiseLike<{ data: any; error: any }>[] = [];
  for (const alias of aliases) {
    attempts.push(admin.from("mesaha_istif_records").select("*").eq("seflik_key", alias).order("created_at", { ascending: false }).limit(2000));
  }
  attempts.push(admin.from("mesaha_istif_records").select("*").eq("seflik", access.seflik).order("created_at", { ascending: false }).limit(2000));
  for (const query of attempts) {
    try {
      const { data, error } = await query;
      if (error) continue;
      for (const row of Array.isArray(data) ? data as JsonObj[] : []) {
        const id = clean(row.id || row.record_id);
        if (id) rows.set(id, normalizeRecordRow(row));
      }
    } catch { /* kolon uyumsuzluğu veya tablo yoksa diğer sorgular denensin */ }
  }
  const records = [...rows.values()].sort((a, b) => clean(b.updated_at || b.created_at).localeCompare(clean(a.updated_at || a.created_at)));
  console.log("[istif-drive] record_list", { seflikKey: access.seflikKey, count: records.length });
  return json({ ok: true, records });
}

async function userDriveContext(req: Request, body: JsonObj) {
  const access = await verifyFolderAccess(req, body);
  const connection = await connectionFor(access.userId);
  if (!connection?.refresh_token_cipher) throw new Error("Kişisel Google Drive hesabı bağlı değil");
  const refreshToken = await decryptToken(connection.refresh_token_cipher, connection.refresh_token_iv);
  const accessToken = await refreshGoogleToken(refreshToken);
  return { access, connection, accessToken };
}
function safeFileName(value: unknown, fallback = "Mesaha_Suite_Yedek.json"): string {
  const name = clean(value).replace(/[\\/:*?"<>|]+/g, "_").slice(0, 180) || fallback;
  return name.toLocaleLowerCase("tr-TR").endsWith(".json") ? name : `${name}.json`;
}
async function uploadJsonToDrive(accessToken: string, parentId: string, fileName: string, payload: unknown, description: string) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  if (bytes.length > 45 * 1024 * 1024) throw new Error("Yedek dosyası 45 MB sınırını aşıyor");
  const boundary = `suite_${crypto.randomUUID().replace(/-/g, "")}`;
  const metadata = { name: fileName, parents: [parentId], description };
  const bodyBlob = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    bytes,
    `\r\n--${boundary}--`,
  ], { type: `multipart/related; boundary=${boundary}` });
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,parents,size,mimeType,createdTime", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body: bodyBlob,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(clean(result?.error?.message) || `Drive yedek yükleme ${response.status}`);
  return result;
}
async function backupJson(req: Request, body: JsonObj) {
  const { access, connection, accessToken } = await userDriveContext(req, body);
  const appId = fold(body.appId || body.app_id || "suite") || "suite";
  const appName = appId === "mesaha" ? "Mesaha İO" : appId === "istif" ? "İstif İO" : "Mesaha Suite";
  const seflikFolder = await findOrCreateFolder(accessToken, `Şeflik - ${access.seflik}`, clean(connection.folder_id));
  const appFolder = await findOrCreateFolder(accessToken, appName, seflikFolder.id);
  const backupFolder = await findOrCreateFolder(accessToken, "Yedekler", appFolder.id);
  const fileName = safeFileName(body.fileName || body.file_name, `${appId}_${Date.now()}.json`);
  const payload = body.payload ?? body.data ?? {};
  const uploaded = await uploadJsonToDrive(accessToken, backupFolder.id, fileName, payload, `${access.name} • ${access.seflik} • ${appName}`);
  const row = {
    id: crypto.randomUUID(), user_id: access.userId, user_key: fold(access.email || access.userId),
    email: access.email || null, name: access.name || null, seflik_key: access.seflikKey, seflik: access.seflik,
    app_id: appId, drive_file_id: uploaded.id, file_name: uploaded.name || fileName,
    web_view_link: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
    record_count: Math.max(0, Number(body.recordCount || body.record_count || 0) || 0),
    total_volume: Number(body.totalVolume || body.total_volume || 0) || 0,
    version: clean(body.version || "Mesaha Suite V9"), metadata: { folder_id: backupFolder.id, size: uploaded.size || null },
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
  const { data, error } = await admin.from("mesaha_user_drive_backups").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return json({ ok: true, fileId: uploaded.id, fileName: uploaded.name || fileName, webViewLink: row.web_view_link, backup: data || row });
}
async function backupList(req: Request, _body: JsonObj) {
  const { user } = await authUser(req);
  const { data, error } = await admin.from("mesaha_user_drive_backups").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  return json({ ok: true, items: data || [] });
}
async function ownedBackup(req: Request, body: JsonObj) {
  const { user } = await authUser(req);
  const id = clean(body.id || body.backupId || body.backup_id);
  if (!id) throw new Error("Yedek kimliği eksik");
  const { data, error } = await admin.from("mesaha_user_drive_backups").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !data) throw new Error("Yedek bulunamadı veya bu hesaba ait değil");
  const connection = await connectionFor(user.id);
  if (!connection?.refresh_token_cipher) throw new Error("Kişisel Google Drive hesabı bağlı değil");
  const refreshToken = await decryptToken(connection.refresh_token_cipher, connection.refresh_token_iv);
  return { row: data as JsonObj, accessToken: await refreshGoogleToken(refreshToken), user };
}
async function backupRead(req: Request, body: JsonObj) {
  const { row, accessToken } = await ownedBackup(req, body);
  const fileId = clean(row.drive_file_id);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Drive yedeği okunamadı (${response.status})`);
  const text = await response.text();
  let payload: unknown = {}; try { payload = JSON.parse(text); } catch { throw new Error("Drive yedeği geçerli JSON değil"); }
  return json({ ok: true, backup: row, payload });
}
async function backupDelete(req: Request, body: JsonObj) {
  const { row, accessToken } = await ownedBackup(req, body);
  const fileId = clean(row.drive_file_id);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok && response.status !== 404) throw new Error(`Drive yedeği silinemedi (${response.status})`);
  const { error } = await admin.from("mesaha_user_drive_backups").delete().eq("id", clean(row.id));
  if (error) throw new Error(error.message);
  return json({ ok: true, deleted: true, id: row.id });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Sadece POST" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) return json({ ok: false, error: "Supabase Edge Function ayarları eksik" }, 500);
  const body = await bodyJson(req);
  const action = clean(body.action);
  const requestId = crypto.randomUUID();
  console.log("[istif-drive] istek", { requestId, action, source: clean(body.source) });
  try {
    if (action === "status") return await driveStatus(req, body);
    if (action === "oauth_start") return await oauthStart(req, body);
    if (action === "oauth_finish") return await oauthFinish(req, body);
    if (action === "disconnect") return await disconnect(req, body);
    if (action === "upload_session") return await uploadSession(req, body);
    if (action === "upload_photo") return await uploadPhoto(req, body);
    if (action === "photo_data") return await photoData(req, body);
    if (action === "delete_drive_files") return await deleteDriveFiles(req, body);
    if (action === "backup_json") return await backupJson(req, body);
    if (action === "backup_list") return await backupList(req, body);
    if (action === "backup_read") return await backupRead(req, body);
    if (action === "backup_delete") return await backupDelete(req, body);
    if (action === "shared_context") return await sharedContext(req, body);
    if (action === "user_search") return await userSearch(req, body);
    if (action === "forester_list") return await foresterList(req, body);
    if (action === "forester_add") return await foresterAdd(req, body);
    if (action === "forester_remove") return await foresterRemove(req, body);
    if (action === "record_list") return await recordList(req, body);
    return json({ ok: false, error: "Bilinmeyen işlem" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[istif-drive] hata", { requestId, action, message, stack: error instanceof Error ? error.stack : "" });
    return json({ ok: false, error: message, requestId }, 400);
  }
});
