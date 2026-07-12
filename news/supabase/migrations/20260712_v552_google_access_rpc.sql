-- Mesaha İO V5.52 — Google erişim durumu ve erişim talebini
-- Edge Function yerine doğrudan doğrulanmış Supabase oturumu üzerinden RPC ile yürütür.
-- Amaç: bazı mobil ağlarda /functions/v1 çağrısında görülen "Failed to fetch" sorununu aşmak.
-- V5.47 ve V5.48 migration'ları çalıştırılmış olmalıdır.

begin;

create or replace function public.mesaha_google_access_status_v552(
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

  select *
    into v_row
    from public.mesaha_user_access
   where user_id = v_uid;

  if found then
    update public.mesaha_user_access
       set last_seen_at = now(),
           email = coalesce(nullif(v_email, ''), email),
           device_info = case
             when p_device_info is null or p_device_info = '{}'::jsonb then device_info
             else coalesce(device_info, '{}'::jsonb) || p_device_info
           end,
           metadata = coalesce(metadata, '{}'::jsonb)
             || jsonb_build_object(
                  'app_version', nullif(btrim(coalesce(p_app_version, '')), ''),
                  'status_source', 'rpc-v552'
                )
     where user_id = v_uid
     returning * into v_row;
  end if;

  return jsonb_build_object(
    'ok', true,
    'access', jsonb_build_object(
      'user_id', v_uid,
      'email', coalesce(nullif(v_row.email, ''), v_email),
      'status', coalesce(nullif(v_row.status, ''), 'unregistered'),
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

create or replace function public.mesaha_google_access_request_v552(
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
  v_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_seflik text := regexp_replace(btrim(coalesce(p_seflik, '')), '\s+', ' ', 'g');
  v_device_id text := left(coalesce(
    p_device_info->>'deviceId',
    p_device_info->>'device_id',
    ''
  ), 120);
  v_rate jsonb;
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

  select public.mesaha_take_rate_limit(
    'google-access-request:' || v_uid::text,
    5,
    3600,
    3600
  ) into v_rate;

  if coalesce((v_rate->>'allowed')::boolean, false) is not true then
    return jsonb_build_object(
      'ok', false,
      'error', 'Çok fazla erişim talebi gönderildi',
      'retry_after', coalesce((v_rate->>'retry_after')::integer, 3600)
    );
  end if;

  select *
    into v_row
    from public.mesaha_user_access
   where user_id = v_uid;

  if found and v_row.status = 'approved' then
    return jsonb_build_object(
      'ok', true,
      'already_approved', true,
      'access', jsonb_build_object(
        'user_id', v_uid,
        'email', coalesce(nullif(v_row.email, ''), v_email),
        'status', 'approved',
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
  end if;

  insert into public.mesaha_user_access(
    user_id,
    email,
    requested_name,
    requested_seflik,
    status,
    reason,
    requested_at,
    last_seen_at,
    device_id,
    device_info,
    metadata
  )
  values(
    v_uid,
    nullif(v_email, ''),
    v_name,
    v_seflik,
    'pending',
    null,
    now(),
    now(),
    nullif(v_device_id, ''),
    coalesce(p_device_info, '{}'::jsonb),
    jsonb_build_object(
      'app_version', nullif(btrim(coalesce(p_app_version, '')), ''),
      'provider', 'google',
      'request_source', 'rpc-v552'
    )
  )
  on conflict (user_id) do update
    set email = coalesce(excluded.email, public.mesaha_user_access.email),
        requested_name = excluded.requested_name,
        requested_seflik = excluded.requested_seflik,
        status = case
          when public.mesaha_user_access.status = 'approved'
            then public.mesaha_user_access.status
          else 'pending'
        end,
        reason = case
          when public.mesaha_user_access.status = 'approved'
            then public.mesaha_user_access.reason
          else null
        end,
        requested_at = case
          when public.mesaha_user_access.status = 'approved'
            then public.mesaha_user_access.requested_at
          else now()
        end,
        last_seen_at = now(),
        device_id = coalesce(excluded.device_id, public.mesaha_user_access.device_id),
        device_info = coalesce(public.mesaha_user_access.device_info, '{}'::jsonb)
          || coalesce(excluded.device_info, '{}'::jsonb),
        metadata = coalesce(public.mesaha_user_access.metadata, '{}'::jsonb)
          || coalesce(excluded.metadata, '{}'::jsonb)
  returning * into v_row;

  insert into public.mesaha_user_auth_events(
    user_id,
    email,
    event_type,
    success,
    device_id,
    metadata,
    created_at
  )
  values(
    v_uid,
    nullif(v_email, ''),
    'google_access_requested_rpc_v552',
    true,
    nullif(v_device_id, ''),
    jsonb_build_object('name', v_name, 'seflik', v_seflik),
    now()
  );

  return jsonb_build_object(
    'ok', true,
    'access', jsonb_build_object(
      'user_id', v_uid,
      'email', coalesce(nullif(v_row.email, ''), v_email),
      'status', coalesce(nullif(v_row.status, ''), 'pending'),
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

revoke all on function public.mesaha_google_access_status_v552(jsonb, text)
  from public, anon;
revoke all on function public.mesaha_google_access_request_v552(text, text, jsonb, text)
  from public, anon;

grant execute on function public.mesaha_google_access_status_v552(jsonb, text)
  to authenticated, service_role;
grant execute on function public.mesaha_google_access_request_v552(text, text, jsonb, text)
  to authenticated, service_role;

commit;
