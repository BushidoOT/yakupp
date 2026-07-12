-- Mesaha İO V5.64 — Üyelikli Şeflik Klasörü + Google profil resmi
-- V5.57 / V5.59 / V5.60 / V5.62 üstüne çalıştırılır.

begin;

create extension if not exists pgcrypto;

alter table if exists public.mesaha_user_access
  add column if not exists avatar_url text;

alter table if exists public.mesaha_user_profiles
  add column if not exists avatar_url text;

create table if not exists public.mesaha_seflik_folders (
  id text primary key,
  seflik_key text not null,
  seflik text not null,
  status text not null default 'active',
  created_by_user_id uuid not null,
  created_by_user_key text,
  created_by_name text not null,
  created_by_avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by_user_id uuid
);

alter table public.mesaha_seflik_folders
  add column if not exists seflik_key text,
  add column if not exists seflik text,
  add column if not exists status text default 'active',
  add column if not exists created_by_user_id uuid,
  add column if not exists created_by_user_key text,
  add column if not exists created_by_name text,
  add column if not exists created_by_avatar_url text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_user_id uuid;

create unique index if not exists ux_mesaha_seflik_folders_active_key
  on public.mesaha_seflik_folders(seflik_key)
  where status = 'active';

create index if not exists idx_mesaha_seflik_folders_creator
  on public.mesaha_seflik_folders(created_by_user_id, status, updated_at desc);

create table if not exists public.mesaha_seflik_members (
  id text primary key,
  seflik_key text not null,
  user_id uuid not null,
  user_key text,
  email text,
  name text not null,
  avatar_url text,
  role text not null default 'member',
  status text not null default 'active',
  added_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mesaha_seflik_members
  add column if not exists seflik_key text,
  add column if not exists user_id uuid,
  add column if not exists user_key text,
  add column if not exists email text,
  add column if not exists name text,
  add column if not exists avatar_url text,
  add column if not exists role text default 'member',
  add column if not exists status text default 'active',
  add column if not exists added_by_user_id uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists ux_mesaha_seflik_members_folder_user
  on public.mesaha_seflik_members(seflik_key, user_id);

create index if not exists idx_mesaha_seflik_members_user
  on public.mesaha_seflik_members(user_id, status, created_at desc);

create or replace function public.mesaha_touch_seflik_folder_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mesaha_seflik_folders_touch on public.mesaha_seflik_folders;
create trigger mesaha_seflik_folders_touch
before update on public.mesaha_seflik_folders
for each row execute function public.mesaha_touch_seflik_folder_updated_at();

drop trigger if exists mesaha_seflik_members_touch on public.mesaha_seflik_members;
create trigger mesaha_seflik_members_touch
before update on public.mesaha_seflik_members
for each row execute function public.mesaha_touch_seflik_folder_updated_at();

-- Google avatar yardımcıları
create or replace function public.mesaha_google_avatar_from_claims_v564(p_claims jsonb)
returns text
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := nullif(btrim(coalesce(p_claims->'user_metadata'->>'avatar_url','')), '');
  if v is null then v := nullif(btrim(coalesce(p_claims->'user_metadata'->>'picture','')), ''); end if;
  if v is null or v !~* '^https?://' then return null; end if;
  return left(v, 600);
end;
$$;

-- V5.60 fonksiyonlarını aynı imzayla avatar destekli güncelle
create or replace function public.mesaha_google_access_status_v560(
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null,
  p_google_full_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_claims jsonb := coalesce(auth.jwt(), '{}'::jsonb);
  v_provider text := coalesce(v_claims->'app_metadata'->>'provider', '');
  v_providers jsonb := coalesce(v_claims->'app_metadata'->'providers', '[]'::jsonb);
  v_email text := lower(coalesce(v_claims->>'email', ''));
  v_google_name text := public.mesaha_google_name_from_claims_v560(v_claims, p_google_full_name);
  v_avatar text := public.mesaha_google_avatar_from_claims_v564(v_claims);
  v_row public.mesaha_user_access%rowtype;
begin
  if v_uid is null then raise exception using errcode = '28000', message = 'Google oturumu bulunamadı'; end if;
  if v_provider <> 'google' and not (v_providers ? 'google') then raise exception using errcode = '42501', message = 'Google ile doğrulanmış kullanıcı oturumu gerekli'; end if;

  select * into v_row from public.mesaha_user_access where user_id = v_uid;

  if found then
    update public.mesaha_user_access
       set last_seen_at = now(),
           email = coalesce(nullif(v_email,''), email),
           avatar_url = coalesce(v_avatar, avatar_url),
           canonical_name = case when v_google_name is not null then v_google_name else canonical_name end,
           requested_name = case when v_google_name is not null then v_google_name else requested_name end,
           status = case when status = 'pending' and length(coalesce(nullif(canonical_name,''), nullif(requested_name,''), v_google_name, '')) >= 2 then 'approved' else status end,
           reason = case when status = 'pending' and length(coalesce(nullif(canonical_name,''), nullif(requested_name,''), v_google_name, '')) >= 2 then null else reason end,
           canonical_seflik = coalesce(nullif(canonical_seflik,''), requested_seflik, 'Dosya'),
           user_key = coalesce(nullif(user_key,''), public.mesaha_user_key_v557(coalesce(v_google_name, nullif(canonical_name,''), requested_name), coalesce(nullif(canonical_seflik,''), requested_seflik, 'Dosya'))),
           approved_at = case when status = 'pending' then coalesce(approved_at, now()) else approved_at end,
           device_info = case when p_device_info is null or p_device_info = '{}'::jsonb then device_info else coalesce(device_info, '{}'::jsonb) || p_device_info end,
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('app_version', nullif(btrim(coalesce(p_app_version,'')), ''), 'google_full_name', v_google_name, 'avatar_url', v_avatar, 'google_avatar_url', v_avatar, 'status_source', 'rpc-v564')
     where user_id = v_uid returning * into v_row;
  end if;

  return jsonb_build_object('ok', true, 'access', jsonb_build_object(
    'user_id', v_uid, 'email', coalesce(nullif(v_row.email,''), v_email), 'status', coalesce(nullif(v_row.status,''), 'unregistered'),
    'name', coalesce(v_row.canonical_name, v_google_name, ''), 'google_full_name', coalesce(v_google_name, v_row.metadata->>'google_full_name', ''),
    'avatar_url', coalesce(v_avatar, v_row.avatar_url, v_row.metadata->>'avatar_url', ''),
    'seflik', coalesce(v_row.canonical_seflik, 'Dosya'), 'user_key', coalesce(v_row.user_key, ''), 'bolme_no', coalesce(v_row.bolme_no, ''),
    'requested_name', coalesce(v_row.requested_name, v_google_name, ''), 'requested_seflik', coalesce(v_row.requested_seflik, ''),
    'reason', coalesce(v_row.reason, ''), 'requested_at', v_row.requested_at, 'approved_at', v_row.approved_at, 'updated_at', v_row.updated_at));
end;
$$;

create or replace function public.mesaha_google_access_request_v560(
  p_name text,
  p_seflik text,
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null,
  p_google_full_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_claims jsonb := coalesce(auth.jwt(), '{}'::jsonb);
  v_provider text := coalesce(v_claims->'app_metadata'->>'provider', '');
  v_providers jsonb := coalesce(v_claims->'app_metadata'->'providers', '[]'::jsonb);
  v_email text := lower(coalesce(v_claims->>'email', ''));
  v_google_name text := public.mesaha_google_name_from_claims_v560(v_claims, p_google_full_name);
  v_avatar text := public.mesaha_google_avatar_from_claims_v564(v_claims);
  v_name text := regexp_replace(btrim(coalesce(v_google_name, p_name, '')), '\s+', ' ', 'g');
  v_seflik text := regexp_replace(btrim(coalesce(nullif(p_seflik,''), 'Dosya')), '\s+', ' ', 'g');
  v_key text := public.mesaha_user_key_v557(v_name, v_seflik);
  v_device_id text := left(coalesce(p_device_info->>'deviceId', p_device_info->>'device_id', ''), 120);
  v_row public.mesaha_user_access%rowtype;
begin
  if v_uid is null then raise exception using errcode = '28000', message = 'Google oturumu bulunamadı'; end if;
  if v_provider <> 'google' and not (v_providers ? 'google') then raise exception using errcode = '42501', message = 'Google ile doğrulanmış kullanıcı oturumu gerekli'; end if;
  if length(v_name) < 2 or length(v_name) > 120 then raise exception using errcode = '22023', message = 'Geçerli ad soyad gerekli'; end if;

  insert into public.mesaha_user_access(
    user_id, email, requested_name, requested_seflik, canonical_name, canonical_seflik,
    user_key, status, reason, requested_at, approved_at, last_seen_at, device_id, device_info, metadata, avatar_url
  ) values(
    v_uid, nullif(v_email,''), v_name, v_seflik, v_name, v_seflik,
    nullif(v_key,''), 'approved', null, now(), now(), now(), nullif(v_device_id,''), coalesce(p_device_info,'{}'::jsonb),
    jsonb_build_object('app_version', nullif(btrim(coalesce(p_app_version,'')), ''), 'provider', 'google', 'google_full_name', v_google_name, 'avatar_url', v_avatar, 'google_avatar_url', v_avatar, 'request_source', 'rpc-v564-auto-approved'),
    v_avatar
  ) on conflict (user_id) do update
    set email = coalesce(excluded.email, public.mesaha_user_access.email),
        requested_name = excluded.requested_name,
        requested_seflik = coalesce(nullif(excluded.requested_seflik,''), public.mesaha_user_access.requested_seflik, 'Dosya'),
        canonical_name = excluded.canonical_name,
        canonical_seflik = coalesce(nullif(public.mesaha_user_access.canonical_seflik,''), excluded.canonical_seflik, 'Dosya'),
        user_key = coalesce(nullif(public.mesaha_user_access.user_key,''), excluded.user_key),
        status = case when public.mesaha_user_access.status in ('rejected','revoked') then public.mesaha_user_access.status else 'approved' end,
        reason = case when public.mesaha_user_access.status in ('rejected','revoked') then public.mesaha_user_access.reason else null end,
        approved_at = case when public.mesaha_user_access.status in ('rejected','revoked') then public.mesaha_user_access.approved_at else coalesce(public.mesaha_user_access.approved_at, now()) end,
        requested_at = coalesce(public.mesaha_user_access.requested_at, now()), last_seen_at = now(),
        device_id = coalesce(excluded.device_id, public.mesaha_user_access.device_id),
        device_info = coalesce(public.mesaha_user_access.device_info, '{}'::jsonb) || coalesce(excluded.device_info, '{}'::jsonb),
        avatar_url = coalesce(excluded.avatar_url, public.mesaha_user_access.avatar_url),
        metadata = coalesce(public.mesaha_user_access.metadata, '{}'::jsonb) || coalesce(excluded.metadata, '{}'::jsonb)
  returning * into v_row;

  insert into public.mesaha_user_auth_events(user_id, email, event_type, success, device_id, metadata, created_at)
  values(v_uid, nullif(v_email,''), 'google_access_auto_approved_rpc_v564', v_row.status = 'approved', nullif(v_device_id,''), jsonb_build_object('name', v_name, 'seflik', v_seflik, 'google_full_name', v_google_name, 'avatar_url', v_avatar, 'status', v_row.status), now());

  return jsonb_build_object('ok', true, 'access', jsonb_build_object(
    'user_id', v_uid, 'email', coalesce(nullif(v_row.email,''), v_email), 'status', coalesce(nullif(v_row.status,''), 'approved'),
    'name', coalesce(v_row.canonical_name, v_google_name, ''), 'google_full_name', coalesce(v_google_name, v_row.metadata->>'google_full_name', ''),
    'avatar_url', coalesce(v_avatar, v_row.avatar_url, v_row.metadata->>'avatar_url', ''),
    'seflik', coalesce(v_row.canonical_seflik, 'Dosya'), 'user_key', coalesce(v_row.user_key, ''), 'bolme_no', coalesce(v_row.bolme_no, ''),
    'requested_name', coalesce(v_row.requested_name, v_google_name, ''), 'requested_seflik', coalesce(v_row.requested_seflik, ''),
    'reason', coalesce(v_row.reason, ''), 'requested_at', v_row.requested_at, 'approved_at', v_row.approved_at, 'updated_at', v_row.updated_at));
end;
$$;

alter table public.mesaha_seflik_folders enable row level security;
alter table public.mesaha_seflik_members enable row level security;
revoke all on table public.mesaha_seflik_folders from public, anon, authenticated;
revoke all on table public.mesaha_seflik_members from public, anon, authenticated;
grant all on table public.mesaha_seflik_folders to service_role;
grant all on table public.mesaha_seflik_members to service_role;

revoke all on function public.mesaha_google_avatar_from_claims_v564(jsonb) from public, anon, authenticated;
grant execute on function public.mesaha_google_avatar_from_claims_v564(jsonb) to service_role;
grant execute on function public.mesaha_google_access_status_v560(jsonb, text, text) to authenticated, service_role;
grant execute on function public.mesaha_google_access_request_v560(text, text, jsonb, text, text) to authenticated, service_role;

commit;
