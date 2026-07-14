-- Mesaha İO V5.60 — Google ad-soyad kimliği + eski sürüm ban ekranı engeli
-- V5.57 ve V5.59 migration'larının üstüne çalıştırılır.

begin;

create or replace function public.mesaha_clean_google_name_v560(p_name text)
returns text
language sql
immutable
as $$
  select nullif(left(regexp_replace(btrim(coalesce(p_name,'')), '\s+', ' ', 'g'), 120), '')
$$;

create or replace function public.mesaha_google_name_from_claims_v560(p_claims jsonb, p_supplied text default null)
returns text
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := public.mesaha_clean_google_name_v560(p_supplied);
  if v is null then v := public.mesaha_clean_google_name_v560(p_claims->'user_metadata'->>'full_name'); end if;
  if v is null then v := public.mesaha_clean_google_name_v560(p_claims->'user_metadata'->>'name'); end if;
  if v is null then v := public.mesaha_clean_google_name_v560(p_claims->'user_metadata'->>'display_name'); end if;
  if v is null then v := public.mesaha_clean_google_name_v560(p_claims->'app_metadata'->>'name'); end if;
  if v is null or length(v) < 2 or position('@' in v) > 0 or lower(v) in ('google','user','kullanıcı','kullanici') then
    return null;
  end if;
  return v;
end;
$$;

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
    update public.mesaha_user_access
       set last_seen_at = now(),
           email = coalesce(nullif(v_email,''), email),
           canonical_name = case
             when v_google_name is not null and status = 'approved' then v_google_name
             when v_google_name is not null and status = 'pending' and length(coalesce(canonical_seflik, requested_seflik, '')) >= 2 then v_google_name
             else canonical_name
           end,
           requested_name = case
             when v_google_name is not null then v_google_name
             else requested_name
           end,
           status = case
             when status = 'pending'
              and length(coalesce(nullif(canonical_name,''), nullif(requested_name,''), v_google_name, '')) >= 2
              and length(coalesce(nullif(canonical_seflik,''), nullif(requested_seflik,''), '')) >= 2
             then 'approved'
             else status
           end,
           reason = case
             when status = 'pending'
              and length(coalesce(nullif(canonical_name,''), nullif(requested_name,''), v_google_name, '')) >= 2
              and length(coalesce(nullif(canonical_seflik,''), nullif(requested_seflik,''), '')) >= 2
             then null
             else reason
           end,
           canonical_seflik = coalesce(nullif(canonical_seflik,''), requested_seflik),
           user_key = coalesce(nullif(user_key,''), public.mesaha_user_key_v557(coalesce(v_google_name, nullif(canonical_name,''), requested_name), coalesce(nullif(canonical_seflik,''), requested_seflik))),
           approved_at = case when status = 'pending' then coalesce(approved_at, now()) else approved_at end,
           device_info = case
             when p_device_info is null or p_device_info = '{}'::jsonb then device_info
             else coalesce(device_info, '{}'::jsonb) || p_device_info
           end,
           metadata = coalesce(metadata, '{}'::jsonb)
             || jsonb_build_object('app_version', nullif(btrim(coalesce(p_app_version,'')), ''), 'google_full_name', v_google_name, 'status_source', 'rpc-v560')
     where user_id = v_uid
     returning * into v_row;
  end if;

  return jsonb_build_object(
    'ok', true,
    'access', jsonb_build_object(
      'user_id', v_uid,
      'email', coalesce(nullif(v_row.email,''), v_email),
      'status', coalesce(nullif(v_row.status,''), 'unregistered'),
      'name', coalesce(v_row.canonical_name, v_google_name, ''),
      'google_full_name', coalesce(v_google_name, v_row.metadata->>'google_full_name', ''),
      'seflik', coalesce(v_row.canonical_seflik, ''),
      'user_key', coalesce(v_row.user_key, ''),
      'bolme_no', coalesce(v_row.bolme_no, ''),
      'requested_name', coalesce(v_row.requested_name, v_google_name, ''),
      'requested_seflik', coalesce(v_row.requested_seflik, ''),
      'reason', coalesce(v_row.reason, ''),
      'requested_at', v_row.requested_at,
      'approved_at', v_row.approved_at,
      'updated_at', v_row.updated_at
    )
  );
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
  v_name text := regexp_replace(btrim(coalesce(v_google_name, p_name, '')), '\s+', ' ', 'g');
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
    return jsonb_build_object('ok', true, 'access', jsonb_build_object(
      'user_id', v_uid,
      'email', coalesce(nullif(v_row.email,''), v_email),
      'status', v_row.status,
      'name', coalesce(v_row.canonical_name, v_google_name, ''),
      'google_full_name', coalesce(v_google_name, v_row.metadata->>'google_full_name', ''),
      'seflik', coalesce(v_row.canonical_seflik,''),
      'user_key', coalesce(v_row.user_key,''),
      'bolme_no', coalesce(v_row.bolme_no,''),
      'requested_name', coalesce(v_row.requested_name, v_google_name, ''),
      'requested_seflik', coalesce(v_row.requested_seflik,''),
      'reason', coalesce(v_row.reason,''),
      'requested_at', v_row.requested_at,
      'approved_at', v_row.approved_at,
      'updated_at', v_row.updated_at
    ));
  end if;

  insert into public.mesaha_user_access(
    user_id, email, requested_name, requested_seflik, canonical_name, canonical_seflik,
    user_key, status, reason, requested_at, approved_at, last_seen_at, device_id, device_info, metadata
  ) values(
    v_uid, nullif(v_email,''), v_name, v_seflik, v_name, v_seflik,
    nullif(v_key,''), 'approved', null, now(), now(), now(), nullif(v_device_id,''),
    coalesce(p_device_info,'{}'::jsonb),
    jsonb_build_object('app_version', nullif(btrim(coalesce(p_app_version,'')), ''), 'provider', 'google', 'google_full_name', v_google_name, 'request_source', 'rpc-v560-auto-approved')
  )
  on conflict (user_id) do update
    set email = coalesce(excluded.email, public.mesaha_user_access.email),
        requested_name = excluded.requested_name,
        requested_seflik = excluded.requested_seflik,
        canonical_name = excluded.canonical_name,
        canonical_seflik = excluded.canonical_seflik,
        user_key = coalesce(nullif(public.mesaha_user_access.user_key,''), excluded.user_key),
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
  values(v_uid, nullif(v_email,''), 'google_access_auto_approved_rpc_v560', v_row.status = 'approved', nullif(v_device_id,''), jsonb_build_object('name', v_name, 'seflik', v_seflik, 'google_full_name', v_google_name, 'status', v_row.status), now());

  return jsonb_build_object('ok', true, 'access', jsonb_build_object(
    'user_id', v_uid,
    'email', coalesce(nullif(v_row.email,''), v_email),
    'status', coalesce(nullif(v_row.status,''), 'approved'),
    'name', coalesce(v_row.canonical_name, v_google_name, ''),
    'google_full_name', coalesce(v_google_name, v_row.metadata->>'google_full_name', ''),
    'seflik', coalesce(v_row.canonical_seflik, ''),
    'user_key', coalesce(v_row.user_key, ''),
    'bolme_no', coalesce(v_row.bolme_no, ''),
    'requested_name', coalesce(v_row.requested_name, v_google_name, ''),
    'requested_seflik', coalesce(v_row.requested_seflik, ''),
    'reason', coalesce(v_row.reason, ''),
    'requested_at', v_row.requested_at,
    'approved_at', v_row.approved_at,
    'updated_at', v_row.updated_at
  ));
end;
$$;

revoke all on function public.mesaha_clean_google_name_v560(text) from public, anon, authenticated;
revoke all on function public.mesaha_google_name_from_claims_v560(jsonb, text) from public, anon, authenticated;
revoke all on function public.mesaha_google_access_status_v560(jsonb, text, text) from public, anon;
revoke all on function public.mesaha_google_access_request_v560(text, text, jsonb, text, text) from public, anon;

grant execute on function public.mesaha_clean_google_name_v560(text) to service_role;
grant execute on function public.mesaha_google_name_from_claims_v560(jsonb, text) to service_role;
grant execute on function public.mesaha_google_access_status_v560(jsonb, text, text) to authenticated, service_role;
grant execute on function public.mesaha_google_access_request_v560(text, text, jsonb, text, text) to authenticated, service_role;

commit;
