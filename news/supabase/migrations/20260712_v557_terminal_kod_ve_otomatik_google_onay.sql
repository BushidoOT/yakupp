-- Mesaha İO V5.57 — Terminal kod eşleştirme + Google otomatik onay
-- V5.48/V5.52 migration'ları çalıştırılmış olmalıdır.

begin;

create table if not exists public.mesaha_terminal_pairing_codes (
  code text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  owner_email text,
  name text not null,
  seflik text not null,
  bolme_no text,
  status text not null default 'active' check (status in ('active','used','expired','revoked')),
  label text,
  used_by_device_id text,
  used_device_info jsonb not null default '{}'::jsonb,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mesaha_terminal_pair_owner
  on public.mesaha_terminal_pairing_codes(owner_user_id, created_at desc);
create index if not exists idx_mesaha_terminal_pair_status
  on public.mesaha_terminal_pairing_codes(status, expires_at);

alter table public.mesaha_terminal_pairing_codes enable row level security;
revoke all on table public.mesaha_terminal_pairing_codes from public, anon, authenticated;
grant all on table public.mesaha_terminal_pairing_codes to service_role;

create or replace function public.mesaha_user_key_v557(p_name text, p_seflik text)
returns text
language sql
immutable
as $$
  select left(
    regexp_replace(
      lower(
        regexp_replace(
          translate(coalesce(p_name,'') || '__' || coalesce(p_seflik,''),
                    'ÇĞİÖŞÜçğıöşü',
                    'CGIOSUcgiosu'),
          '\s+', '_', 'g'
        )
      ),
      '[^a-z0-9_\-]+', '_', 'g'
    ),
    140
  )
$$;

create or replace function public.mesaha_google_access_status_v557(
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null
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
  v_row public.mesaha_user_access%rowtype;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Google oturumu bulunamadı';
  end if;

  if v_provider <> 'google' and not (v_providers ? 'google') then
    raise exception using errcode = '42501', message = 'Google ile doğrulanmış kullanıcı oturumu gerekli';
  end if;

  select * into v_row from public.mesaha_user_access where user_id = v_uid;

  if found then
    if v_row.status = 'pending'
       and length(coalesce(nullif(v_row.canonical_name,''), nullif(v_row.requested_name,''), '')) >= 2
       and length(coalesce(nullif(v_row.canonical_seflik,''), nullif(v_row.requested_seflik,''), '')) >= 2 then
      update public.mesaha_user_access
         set status = 'approved',
             reason = null,
             canonical_name = coalesce(nullif(canonical_name,''), requested_name),
             canonical_seflik = coalesce(nullif(canonical_seflik,''), requested_seflik),
             user_key = coalesce(nullif(user_key,''), public.mesaha_user_key_v557(coalesce(nullif(canonical_name,''), requested_name), coalesce(nullif(canonical_seflik,''), requested_seflik))),
             approved_at = coalesce(approved_at, now()),
             last_seen_at = now(),
             email = coalesce(nullif(v_email,''), email),
             device_info = case
               when p_device_info is null or p_device_info = '{}'::jsonb then device_info
               else coalesce(device_info, '{}'::jsonb) || p_device_info
             end,
             metadata = coalesce(metadata, '{}'::jsonb)
               || jsonb_build_object('app_version', nullif(btrim(coalesce(p_app_version,'')), ''), 'status_source', 'rpc-v557-auto-approved')
       where user_id = v_uid
       returning * into v_row;
    else
      update public.mesaha_user_access
         set last_seen_at = now(),
             email = coalesce(nullif(v_email,''), email),
             device_info = case
               when p_device_info is null or p_device_info = '{}'::jsonb then device_info
               else coalesce(device_info, '{}'::jsonb) || p_device_info
             end,
             metadata = coalesce(metadata, '{}'::jsonb)
               || jsonb_build_object('app_version', nullif(btrim(coalesce(p_app_version,'')), ''), 'status_source', 'rpc-v557')
       where user_id = v_uid
       returning * into v_row;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'access', jsonb_build_object(
      'user_id', v_uid,
      'email', coalesce(nullif(v_row.email,''), v_email),
      'status', coalesce(nullif(v_row.status,''), 'unregistered'),
      'name', coalesce(v_row.canonical_name, ''),
      'seflik', coalesce(v_row.canonical_seflik, ''),
      'user_key', coalesce(v_row.user_key, ''),
      'bolme_no', coalesce(v_row.bolme_no, ''),
      'requested_name', coalesce(v_row.requested_name, ''),
      'requested_seflik', coalesce(v_row.requested_seflik, ''),
      'reason', coalesce(v_row.reason, ''),
      'requested_at', v_row.requested_at,
      'approved_at', v_row.approved_at,
      'updated_at', v_row.updated_at
    )
  );
end;
$$;

create or replace function public.mesaha_google_access_request_v557(
  p_name text,
  p_seflik text,
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null
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
  v_name text := regexp_replace(btrim(coalesce(p_name,'')), '\s+', ' ', 'g');
  v_seflik text := regexp_replace(btrim(coalesce(p_seflik,'')), '\s+', ' ', 'g');
  v_key text := public.mesaha_user_key_v557(v_name, v_seflik);
  v_device_id text := left(coalesce(p_device_info->>'deviceId', p_device_info->>'device_id', ''), 120);
  v_row public.mesaha_user_access%rowtype;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Google oturumu bulunamadı';
  end if;

  if v_provider <> 'google' and not (v_providers ? 'google') then
    raise exception using errcode = '42501', message = 'Google ile doğrulanmış kullanıcı oturumu gerekli';
  end if;

  if length(v_name) < 2 or length(v_name) > 120
     or length(v_seflik) < 2 or length(v_seflik) > 120 then
    raise exception using errcode = '22023', message = 'Geçerli kullanıcı adı ve şeflik girin';
  end if;

  if lower(v_name) in ('kullanıcı','kullanici','user','guest','misafir','boş','bos','-')
     or lower(v_seflik) in ('şeflik','seflik','unknown','bilinmiyor','boş','bos','-') then
    raise exception using errcode = '22023', message = 'Geçerli kullanıcı adı ve şeflik girin';
  end if;

  select * into v_row from public.mesaha_user_access where user_id = v_uid;

  if found and v_row.status in ('rejected','revoked') then
    return jsonb_build_object(
      'ok', true,
      'access', jsonb_build_object(
        'user_id', v_uid,
        'email', coalesce(nullif(v_row.email,''), v_email),
        'status', v_row.status,
        'name', coalesce(v_row.canonical_name,''),
        'seflik', coalesce(v_row.canonical_seflik,''),
        'user_key', coalesce(v_row.user_key,''),
        'bolme_no', coalesce(v_row.bolme_no,''),
        'requested_name', coalesce(v_row.requested_name,''),
        'requested_seflik', coalesce(v_row.requested_seflik,''),
        'reason', coalesce(v_row.reason,''),
        'requested_at', v_row.requested_at,
        'approved_at', v_row.approved_at,
        'updated_at', v_row.updated_at
      )
    );
  end if;

  insert into public.mesaha_user_access(
    user_id, email, requested_name, requested_seflik, canonical_name, canonical_seflik,
    user_key, status, reason, requested_at, approved_at, last_seen_at, device_id, device_info, metadata
  )
  values(
    v_uid, nullif(v_email,''), v_name, v_seflik, v_name, v_seflik,
    nullif(v_key,''), 'approved', null, now(), now(), now(), nullif(v_device_id,''),
    coalesce(p_device_info,'{}'::jsonb),
    jsonb_build_object('app_version', nullif(btrim(coalesce(p_app_version,'')), ''), 'provider', 'google', 'request_source', 'rpc-v557-auto-approved')
  )
  on conflict (user_id) do update
    set email = coalesce(excluded.email, public.mesaha_user_access.email),
        requested_name = excluded.requested_name,
        requested_seflik = excluded.requested_seflik,
        canonical_name = excluded.canonical_name,
        canonical_seflik = excluded.canonical_seflik,
        user_key = excluded.user_key,
        status = case
          when public.mesaha_user_access.status in ('rejected','revoked') then public.mesaha_user_access.status
          else 'approved'
        end,
        reason = case
          when public.mesaha_user_access.status in ('rejected','revoked') then public.mesaha_user_access.reason
          else null
        end,
        approved_at = case
          when public.mesaha_user_access.status in ('rejected','revoked') then public.mesaha_user_access.approved_at
          else coalesce(public.mesaha_user_access.approved_at, now())
        end,
        requested_at = coalesce(public.mesaha_user_access.requested_at, now()),
        last_seen_at = now(),
        device_id = coalesce(excluded.device_id, public.mesaha_user_access.device_id),
        device_info = coalesce(public.mesaha_user_access.device_info, '{}'::jsonb) || coalesce(excluded.device_info, '{}'::jsonb),
        metadata = coalesce(public.mesaha_user_access.metadata, '{}'::jsonb) || coalesce(excluded.metadata, '{}'::jsonb)
  returning * into v_row;

  insert into public.mesaha_user_auth_events(user_id, email, event_type, success, device_id, metadata, created_at)
  values(v_uid, nullif(v_email,''), 'google_access_auto_approved_rpc_v557', v_row.status = 'approved', nullif(v_device_id,''), jsonb_build_object('name', v_name, 'seflik', v_seflik, 'status', v_row.status), now());

  return jsonb_build_object(
    'ok', true,
    'access', jsonb_build_object(
      'user_id', v_uid,
      'email', coalesce(nullif(v_row.email,''), v_email),
      'status', coalesce(nullif(v_row.status,''), 'approved'),
      'name', coalesce(v_row.canonical_name, ''),
      'seflik', coalesce(v_row.canonical_seflik, ''),
      'user_key', coalesce(v_row.user_key, ''),
      'bolme_no', coalesce(v_row.bolme_no, ''),
      'requested_name', coalesce(v_row.requested_name, ''),
      'requested_seflik', coalesce(v_row.requested_seflik, ''),
      'reason', coalesce(v_row.reason, ''),
      'requested_at', v_row.requested_at,
      'approved_at', v_row.approved_at,
      'updated_at', v_row.updated_at
    )
  );
end;
$$;

create or replace function public.mesaha_create_terminal_code_v557(
  p_label text default null,
  p_app_version text default null
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
  v_row public.mesaha_user_access%rowtype;
  v_code text;
  v_raw text;
  v_i int := 0;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Google oturumu bulunamadı';
  end if;

  if v_provider <> 'google' and not (v_providers ? 'google') then
    raise exception using errcode = '42501', message = 'Google ile doğrulanmış kullanıcı oturumu gerekli';
  end if;

  select * into v_row from public.mesaha_user_access where user_id = v_uid and status = 'approved';
  if not found then
    raise exception using errcode = '42501', message = 'Terminal kodu için Google kullanıcısı otomatik onaylı olmalıdır';
  end if;

  if length(coalesce(v_row.canonical_name,'')) < 2 or length(coalesce(v_row.canonical_seflik,'')) < 2 then
    raise exception using errcode = '22023', message = 'Kullanıcı adı ve şeflik bilgisi eksik';
  end if;

  update public.mesaha_terminal_pairing_codes
     set status = 'expired'
   where owner_user_id = v_uid
     and status = 'active'
     and expires_at < now();

  loop
    v_i := v_i + 1;
    v_raw := upper(substr(md5(random()::text || clock_timestamp()::text || v_uid::text), 1, 8));
    v_code := substr(v_raw, 1, 4) || '-' || substr(v_raw, 5, 4);
    begin
      insert into public.mesaha_terminal_pairing_codes(
        code, owner_user_id, owner_email, name, seflik, bolme_no, label, expires_at, metadata
      ) values(
        v_code, v_uid, coalesce(nullif(v_row.email,''), nullif(v_email,'')), v_row.canonical_name, v_row.canonical_seflik,
        v_row.bolme_no, nullif(btrim(coalesce(p_label,'')), ''), now() + interval '24 hours',
        jsonb_build_object('app_version', nullif(btrim(coalesce(p_app_version,'')), ''), 'source', 'rpc-v557')
      );
      exit;
    exception when unique_violation then
      if v_i > 8 then
        raise exception using message = 'Terminal kodu üretilemedi, tekrar deneyin';
      end if;
    end;
  end loop;

  return jsonb_build_object('ok', true, 'terminal', jsonb_build_object(
    'code', v_code,
    'owner_user_id', v_uid,
    'owner_email', coalesce(nullif(v_row.email,''), nullif(v_email,'')),
    'name', v_row.canonical_name,
    'seflik', v_row.canonical_seflik,
    'bolme_no', coalesce(v_row.bolme_no,''),
    'expires_at', now() + interval '24 hours'
  ));
end;
$$;

create or replace function public.mesaha_claim_terminal_code_v557(
  p_code text,
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code,''), '[^A-Za-z0-9]', '', 'g'));
  v_code_fmt text;
  v_device_id text := left(coalesce(p_device_info->>'deviceId', p_device_info->>'device_id', ''), 120);
  v_row public.mesaha_terminal_pairing_codes%rowtype;
begin
  if length(v_code) <> 8 then
    raise exception using errcode = '22023', message = 'Terminal kodu geçersiz';
  end if;
  v_code_fmt := substr(v_code, 1, 4) || '-' || substr(v_code, 5, 4);

  select * into v_row from public.mesaha_terminal_pairing_codes where code = v_code_fmt for update;
  if not found then
    raise exception using errcode = '22023', message = 'Terminal kodu bulunamadı';
  end if;

  if v_row.status <> 'active' then
    raise exception using errcode = '22023', message = 'Terminal kodu daha önce kullanılmış veya kapatılmış';
  end if;

  if v_row.expires_at < now() then
    update public.mesaha_terminal_pairing_codes set status = 'expired' where code = v_code_fmt;
    raise exception using errcode = '22023', message = 'Terminal kodunun süresi dolmuş';
  end if;

  update public.mesaha_terminal_pairing_codes
     set status = 'used',
         used_by_device_id = nullif(v_device_id,''),
         used_device_info = coalesce(p_device_info,'{}'::jsonb),
         used_at = now(),
         metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('claimed_app_version', nullif(btrim(coalesce(p_app_version,'')), ''))
   where code = v_code_fmt
   returning * into v_row;

  insert into public.mesaha_user_auth_events(user_id, email, event_type, success, device_id, metadata, created_at)
  values(v_row.owner_user_id, v_row.owner_email, 'terminal_code_claimed_rpc_v557', true, nullif(v_device_id,''), jsonb_build_object('code', v_code_fmt, 'name', v_row.name, 'seflik', v_row.seflik), now());

  return jsonb_build_object('ok', true, 'terminal', jsonb_build_object(
    'code', v_code_fmt,
    'owner_user_id', v_row.owner_user_id,
    'owner_email', coalesce(v_row.owner_email,''),
    'name', v_row.name,
    'seflik', v_row.seflik,
    'bolme_no', coalesce(v_row.bolme_no,''),
    'expires_at', v_row.expires_at,
    'used_at', v_row.used_at
  ));
end;
$$;

-- Eski istemci çağrıları da otomatik onaylı yeni akışa düşsün.
create or replace function public.mesaha_google_access_status_v552(
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null
)
returns jsonb
language sql
security definer
set search_path = public, auth
as $$
  select public.mesaha_google_access_status_v557(p_device_info, p_app_version);
$$;

create or replace function public.mesaha_google_access_request_v552(
  p_name text,
  p_seflik text,
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null
)
returns jsonb
language sql
security definer
set search_path = public, auth
as $$
  select public.mesaha_google_access_request_v557(p_name, p_seflik, p_device_info, p_app_version);
$$;

revoke all on function public.mesaha_google_access_status_v557(jsonb, text) from public, anon;
revoke all on function public.mesaha_google_access_request_v557(text, text, jsonb, text) from public, anon;
revoke all on function public.mesaha_create_terminal_code_v557(text, text) from public, anon;
revoke all on function public.mesaha_claim_terminal_code_v557(text, jsonb, text) from public;
revoke all on function public.mesaha_google_access_status_v552(jsonb, text) from public, anon;
revoke all on function public.mesaha_google_access_request_v552(text, text, jsonb, text) from public, anon;

grant execute on function public.mesaha_google_access_status_v557(jsonb, text) to authenticated, service_role;
grant execute on function public.mesaha_google_access_request_v557(text, text, jsonb, text) to authenticated, service_role;
grant execute on function public.mesaha_create_terminal_code_v557(text, text) to authenticated, service_role;
grant execute on function public.mesaha_claim_terminal_code_v557(text, jsonb, text) to anon, authenticated, service_role;
grant execute on function public.mesaha_google_access_status_v552(jsonb, text) to authenticated, service_role;
grant execute on function public.mesaha_google_access_request_v552(text, text, jsonb, text) to authenticated, service_role;

commit;
