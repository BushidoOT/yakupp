-- Mesaha İO V5.77 — Terminal oturum yönetimi + Şeflik Klasörü terminal erişimi
-- V5.57/V5.59 terminal migration'ları çalıştırılmış olmalıdır.

begin;

alter table if exists public.mesaha_terminal_pairing_codes
  add column if not exists terminal_token_hash text,
  add column if not exists terminal_token_issued_at timestamptz,
  add column if not exists last_cloud_at timestamptz;

create or replace function public.mesaha_normalize_terminal_code_v577(p_code text)
returns text
language sql
immutable
as $$
  select case
    when length(regexp_replace(upper(coalesce(p_code,'')), '[^A-Z0-9]', '', 'g')) = 8 then
      substr(regexp_replace(upper(coalesce(p_code,'')), '[^A-Z0-9]', '', 'g'), 1, 4)
      || '-' ||
      substr(regexp_replace(upper(coalesce(p_code,'')), '[^A-Z0-9]', '', 'g'), 5, 4)
    else ''
  end
$$;

create or replace function public.mesaha_list_terminal_sessions_v577()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_access public.mesaha_user_access%rowtype;
  v_items jsonb;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Google oturumu bulunamadı';
  end if;

  select * into v_access from public.mesaha_user_access where user_id = v_uid;
  if not found or v_access.status <> 'approved' then
    raise exception using errcode = '42501', message = 'Google erişimi onaylı değil';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'code', code,
    'label', coalesce(nullif(label,''), 'Terminal cihaz'),
    'used_at', used_at,
    'last_cloud_at', last_cloud_at,
    'expires_at', expires_at,
    'used_device_info', coalesce(used_device_info, '{}'::jsonb),
    'created_at', created_at
  ) order by coalesce(last_cloud_at, used_at, created_at) desc), '[]'::jsonb)
    into v_items
    from public.mesaha_terminal_pairing_codes
   where owner_user_id = v_uid
     and status = 'used';

  return jsonb_build_object('ok', true, 'terminals', v_items);
end;
$$;

create or replace function public.mesaha_revoke_terminal_session_v577(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := public.mesaha_normalize_terminal_code_v577(p_code);
  v_row public.mesaha_terminal_pairing_codes%rowtype;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Google oturumu bulunamadı';
  end if;
  if v_code = '' then
    raise exception using errcode = '22023', message = 'Terminal kodu geçersiz';
  end if;

  update public.mesaha_terminal_pairing_codes
     set status = 'revoked',
         metadata = coalesce(metadata, '{}'::jsonb)
                    || jsonb_build_object('revoked_at', now(), 'revoked_by_owner', true)
   where owner_user_id = v_uid
     and code = v_code
     and status = 'used'
   returning * into v_row;

  if not found then
    return jsonb_build_object('ok', true, 'revoked', false, 'code', v_code, 'message', 'Aktif terminal oturumu bulunamadı');
  end if;

  insert into public.mesaha_user_auth_events(user_id, email, event_type, success, metadata, created_at)
  values(v_uid, v_row.owner_email, 'terminal_session_revoked_v577', true, jsonb_build_object('code', v_code), now())
  on conflict do nothing;

  return jsonb_build_object('ok', true, 'revoked', true, 'code', v_code);
end;
$$;

revoke all on function public.mesaha_normalize_terminal_code_v577(text) from public, anon, authenticated;
revoke all on function public.mesaha_list_terminal_sessions_v577() from public, anon;
revoke all on function public.mesaha_revoke_terminal_session_v577(text) from public, anon;

grant execute on function public.mesaha_normalize_terminal_code_v577(text) to service_role;
grant execute on function public.mesaha_list_terminal_sessions_v577() to authenticated, service_role;
grant execute on function public.mesaha_revoke_terminal_session_v577(text) to authenticated, service_role;

commit;
