-- Mesaha İO V5.62 — Terminal kodu SQL düzeltmesi + eski sürüm sahte ban temizliği
-- V5.57 ve V5.59 migration'larının üstüne çalıştırılır.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table if exists public.mesaha_terminal_pairing_codes
  add column if not exists terminal_token_hash text,
  add column if not exists terminal_token_issued_at timestamptz,
  add column if not exists last_cloud_at timestamptz;

create or replace function public.mesaha_crypto_random_hex_v562(p_bytes integer default 24)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  return encode(extensions.gen_random_bytes(greatest(1, least(coalesce(p_bytes,24), 64))), 'hex');
exception when undefined_function or invalid_schema_name then
  return substr(md5(random()::text || clock_timestamp()::text || txid_current()::text) || md5(clock_timestamp()::text || random()::text), 1, greatest(2, least(coalesce(p_bytes,24),64))*2);
end;
$$;

create or replace function public.mesaha_terminal_hash_v559(p_value text)
returns text
language plpgsql
immutable
security definer
set search_path = public, extensions
as $$
begin
  return encode(extensions.digest(coalesce(p_value,''), 'sha256'), 'hex');
exception when undefined_function or invalid_schema_name then
  return md5(coalesce(p_value,''));
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
set search_path = public, auth, extensions
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code,''), '[^A-Za-z0-9]', '', 'g'));
  v_code_fmt text;
  v_device_id text := left(coalesce(p_device_info->>'deviceId', p_device_info->>'device_id', ''), 120);
  v_row public.mesaha_terminal_pairing_codes%rowtype;
  v_token text := public.mesaha_crypto_random_hex_v562(24);
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
         terminal_token_hash = public.mesaha_terminal_hash_v559(v_token),
         terminal_token_issued_at = now(),
         metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('claimed_app_version', nullif(btrim(coalesce(p_app_version,'')), ''), 'cloud_enabled', true, 'sql_fix', 'v562')
   where code = v_code_fmt
   returning * into v_row;

  insert into public.mesaha_user_auth_events(user_id, email, event_type, success, device_id, metadata, created_at)
  values(v_row.owner_user_id, v_row.owner_email, 'terminal_code_claimed_rpc_v562_cloud_enabled', true, nullif(v_device_id,''), jsonb_build_object('code', v_code_fmt, 'name', v_row.name, 'seflik', v_row.seflik), now())
  on conflict do nothing;

  return jsonb_build_object('ok', true, 'terminal', jsonb_build_object(
    'code', v_code_fmt,
    'terminal_token', v_token,
    'owner_user_id', v_row.owner_user_id,
    'owner_email', coalesce(v_row.owner_email,''),
    'name', v_row.name,
    'seflik', v_row.seflik,
    'bolme_no', coalesce(v_row.bolme_no,''),
    'expires_at', v_row.expires_at,
    'used_at', v_row.used_at,
    'cloud_enabled', true
  ));
end;
$$;

create or replace function public.mesaha_terminal_owner_v559(
  p_terminal_code text,
  p_terminal_token text default null,
  p_device_info jsonb default '{}'::jsonb
)
returns table(
  owner_user_id uuid,
  owner_email text,
  name text,
  seflik text,
  bolme_no text,
  user_key text,
  code text
)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_terminal_code,''), '[^A-Za-z0-9]', '', 'g'));
  v_code_fmt text;
  v_device_id text := left(coalesce(p_device_info->>'deviceId', p_device_info->>'device_id', ''), 120);
  v_row public.mesaha_terminal_pairing_codes%rowtype;
  v_access public.mesaha_user_access%rowtype;
begin
  if length(v_code) <> 8 then
    raise exception using errcode = '28000', message = 'Terminal kimliği eksik';
  end if;
  v_code_fmt := substr(v_code, 1, 4) || '-' || substr(v_code, 5, 4);

  select * into v_row from public.mesaha_terminal_pairing_codes where code = v_code_fmt;
  if not found or v_row.status <> 'used' then
    raise exception using errcode = '28000', message = 'Terminal eşleştirmesi bulunamadı';
  end if;

  if coalesce(v_row.terminal_token_hash,'') <> '' then
    if public.mesaha_terminal_hash_v559(coalesce(p_terminal_token,'')) <> v_row.terminal_token_hash then
      raise exception using errcode = '28000', message = 'Terminal güvenlik anahtarı geçersiz';
    end if;
  elsif coalesce(v_row.used_by_device_id,'') <> '' and coalesce(v_device_id,'') <> v_row.used_by_device_id then
    raise exception using errcode = '28000', message = 'Terminal farklı cihazdan kullanılamaz';
  end if;

  select * into v_access from public.mesaha_user_access where user_id = v_row.owner_user_id;
  if not found or v_access.status <> 'approved' then
    raise exception using errcode = '42501', message = 'Terminal sahibinin Google erişimi kapalı';
  end if;

  update public.mesaha_terminal_pairing_codes set last_cloud_at = now() where code = v_code_fmt;

  return query select
    v_row.owner_user_id,
    coalesce(v_row.owner_email, v_access.email, ''),
    v_row.name,
    v_row.seflik,
    coalesce(v_row.bolme_no,''),
    coalesce(nullif(v_access.user_key,''), public.mesaha_user_key_v557(v_row.name, v_row.seflik)),
    v_code_fmt;
end;
$$;

-- V5.59'da bazı projelerde eksik kalan terminal bulut fonksiyonlarını güvenli şekilde tekrar oluştur.
create or replace function public.mesaha_terminal_backup_slot_upsert_v559(
  p_terminal_code text,
  p_terminal_token text default null,
  p_slot_id text default 'latest',
  p_meta jsonb default '{}'::jsonb,
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_owner record;
  v_slot text := coalesce(nullif(btrim(p_slot_id),''),'latest');
  v_payload jsonb := coalesce(p_meta->'payload', p_meta, '{}'::jsonb);
  v_name text;
  v_count integer;
  v_total numeric;
begin
  if v_slot not in ('latest','slot_0','slot_1','slot_2','slot_3','slot_4') then
    raise exception using errcode='22023', message='Yedek slotu geçersiz';
  end if;
  select * into v_owner from public.mesaha_terminal_owner_v559(p_terminal_code, p_terminal_token, p_device_info) limit 1;
  v_payload := coalesce(v_payload,'{}'::jsonb) - 'records';
  v_name := left(coalesce(p_meta->>'fileName', p_meta->>'backupName', p_meta->>'backup_name', 'Mesaha_Terminal_Bulut_' || v_slot || '.json'), 180);
  v_count := greatest(0, coalesce(nullif(p_meta->>'recordCount','')::integer, nullif(p_meta->>'count','')::integer, 0));
  v_total := coalesce(nullif(p_meta->>'totalVolume','')::numeric, nullif(p_meta->>'m3','')::numeric, 0);

  insert into public.mesaha_backup_slots(user_id, slot_id, user_key, name, seflik, backup_name, record_count, total_volume, payload, archived, source)
  values(v_owner.owner_user_id, v_slot, v_owner.user_key, v_owner.name, v_owner.seflik, v_name, v_count, v_total, v_payload, false, 'terminal-cloud-v562')
  on conflict (user_id, slot_id) do update
    set user_key=excluded.user_key,
        name=excluded.name,
        seflik=excluded.seflik,
        backup_name=excluded.backup_name,
        record_count=excluded.record_count,
        total_volume=excluded.total_volume,
        payload=excluded.payload,
        archived=false,
        source=excluded.source,
        updated_at=now();

  return jsonb_build_object('ok', true, 'slot_id', v_slot, 'count', v_count, 'total_volume', v_total);
end;
$$;

create or replace function public.mesaha_terminal_backup_chunk_upsert_v559(
  p_terminal_code text,
  p_terminal_token text default null,
  p_slot_id text default 'latest',
  p_chunk_index integer default 0,
  p_records jsonb default '[]'::jsonb,
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_owner record;
  v_slot text := coalesce(nullif(btrim(p_slot_id),''),'latest');
  v_index integer := coalesce(p_chunk_index,0);
begin
  if v_slot not in ('latest','slot_0','slot_1','slot_2','slot_3','slot_4') then
    raise exception using errcode='22023', message='Yedek slotu geçersiz';
  end if;
  if v_index < 0 or v_index > 199 then
    raise exception using errcode='22023', message='Yedek parça numarası geçersiz';
  end if;
  if jsonb_typeof(coalesce(p_records,'[]'::jsonb)) <> 'array' then
    raise exception using errcode='22023', message='Yedek parçası kayıt listesi olmalıdır';
  end if;
  select * into v_owner from public.mesaha_terminal_owner_v559(p_terminal_code, p_terminal_token, p_device_info) limit 1;

  insert into public.mesaha_backup_chunks(user_id, slot_id, chunk_index, user_key, records, updated_at)
  values(v_owner.owner_user_id, v_slot, v_index, v_owner.user_key, coalesce(p_records,'[]'::jsonb), now())
  on conflict (user_id, slot_id, chunk_index) do update
    set user_key=excluded.user_key,
        records=excluded.records,
        updated_at=now();

  return jsonb_build_object('ok', true, 'slot_id', v_slot, 'chunk_index', v_index, 'count', jsonb_array_length(coalesce(p_records,'[]'::jsonb)));
end;
$$;

create or replace function public.mesaha_terminal_backup_list_v559(
  p_terminal_code text,
  p_terminal_token text default null,
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_owner record;
  v_items jsonb;
begin
  select * into v_owner from public.mesaha_terminal_owner_v559(p_terminal_code, p_terminal_token, p_device_info) limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'source','supabase',
    'id', s.slot_id,
    'slotId', s.slot_id,
    'name', coalesce(s.backup_name, s.payload->>'fileName', 'Terminal bulut yedeği'),
    'createdAt', coalesce(s.payload->>'createdAt', s.created_at::text),
    'createdAtMs', floor(extract(epoch from coalesce(s.created_at, now()))*1000),
    'count', coalesce(s.record_count,0),
    'totalVolume', coalesce(s.total_volume,0),
    'chunkCount', coalesce(nullif(s.payload->>'chunkCount','')::integer, 1),
    'raw', s.payload
  ) order by coalesce(s.updated_at, s.created_at) desc), '[]'::jsonb)
  into v_items
  from public.mesaha_backup_slots s
  where s.user_id = v_owner.owner_user_id
    and coalesce(s.archived,false) is false;

  return jsonb_build_object('ok', true, 'items', v_items);
end;
$$;

create or replace function public.mesaha_terminal_backup_read_v559(
  p_terminal_code text,
  p_terminal_token text default null,
  p_slot_id text default 'latest',
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_owner record;
  v_slot text := coalesce(nullif(btrim(p_slot_id),''),'latest');
  v_slot_row public.mesaha_backup_slots%rowtype;
  v_records jsonb;
  v_payload jsonb;
begin
  if v_slot not in ('latest','slot_0','slot_1','slot_2','slot_3','slot_4') then
    raise exception using errcode='22023', message='Yedek slotu geçersiz';
  end if;
  select * into v_owner from public.mesaha_terminal_owner_v559(p_terminal_code, p_terminal_token, p_device_info) limit 1;
  select * into v_slot_row from public.mesaha_backup_slots where user_id = v_owner.owner_user_id and slot_id = v_slot and coalesce(archived,false) is false;
  if not found then
    raise exception using errcode='P0002', message='Terminal bulut yedeği bulunamadı';
  end if;

  select coalesce(jsonb_agg(e.value order by c.chunk_index, e.ordinality), '[]'::jsonb)
    into v_records
    from public.mesaha_backup_chunks c
    cross join lateral jsonb_array_elements(coalesce(c.records,'[]'::jsonb)) with ordinality as e(value, ordinality)
   where c.user_id = v_owner.owner_user_id
     and c.slot_id = v_slot;

  v_payload := coalesce(v_slot_row.payload,'{}'::jsonb) || jsonb_build_object('records', coalesce(v_records,'[]'::jsonb));
  return jsonb_build_object('ok', true, 'payload', v_payload);
end;
$$;

create or replace function public.mesaha_terminal_backup_hide_v559(
  p_terminal_code text,
  p_terminal_token text default null,
  p_slot_id text default 'latest',
  p_device_info jsonb default '{}'::jsonb,
  p_app_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_owner record;
  v_slot text := coalesce(nullif(btrim(p_slot_id),''),'latest');
begin
  if v_slot not in ('latest','slot_0','slot_1','slot_2','slot_3','slot_4') then
    raise exception using errcode='22023', message='Yedek slotu geçersiz';
  end if;
  select * into v_owner from public.mesaha_terminal_owner_v559(p_terminal_code, p_terminal_token, p_device_info) limit 1;
  update public.mesaha_backup_slots set archived=true, updated_at=now() where user_id = v_owner.owner_user_id and slot_id = v_slot;
  return jsonb_build_object('ok', true, 'slot_id', v_slot, 'hidden', true);
end;
$$;

-- Eski sürüm/cache/oturum hatalarıyla yanlış oluşmuş ban kayıtlarını kapatır; adminin manuel engeline dokunmaz.
update public.mesaha_security_blocks
   set active=false, updated_at=now(), reason=coalesce(reason,'') || ' | v562 sahte eski-sürüm engeli temizlendi'
 where active=true
   and lower(coalesce(reason,'')) not like '%admin%'
   and lower(coalesce(reason,'')) not like '%manuel%'
   and (
     lower(coalesce(reason,'')) like '%eski%'
     or lower(coalesce(reason,'')) like '%old%'
     or lower(coalesce(reason,'')) like '%version%'
     or lower(coalesce(reason,'')) like '%güncelle%'
     or lower(coalesce(reason,'')) like '%guncelle%'
     or lower(coalesce(reason,'')) like '%cache%'
     or lower(coalesce(reason,'')) like '%service worker%'
     or lower(coalesce(reason,'')) like '%google_required%'
     or lower(coalesce(reason,'')) like '%oturum%'
     or lower(coalesce(reason,'')) like '%anon%'
   );

revoke all on function public.mesaha_crypto_random_hex_v562(integer) from public, anon, authenticated;
revoke all on function public.mesaha_terminal_hash_v559(text) from public, anon, authenticated;
revoke all on function public.mesaha_claim_terminal_code_v557(text, jsonb, text) from public;
revoke all on function public.mesaha_terminal_owner_v559(text, text, jsonb) from public;
revoke all on function public.mesaha_terminal_backup_slot_upsert_v559(text, text, text, jsonb, jsonb, text) from public;
revoke all on function public.mesaha_terminal_backup_chunk_upsert_v559(text, text, text, integer, jsonb, jsonb, text) from public;
revoke all on function public.mesaha_terminal_backup_list_v559(text, text, jsonb, text) from public;
revoke all on function public.mesaha_terminal_backup_read_v559(text, text, text, jsonb, text) from public;
revoke all on function public.mesaha_terminal_backup_hide_v559(text, text, text, jsonb, text) from public;

grant execute on function public.mesaha_crypto_random_hex_v562(integer) to service_role;
grant execute on function public.mesaha_terminal_hash_v559(text) to service_role;
grant execute on function public.mesaha_claim_terminal_code_v557(text, jsonb, text) to anon, authenticated, service_role;
grant execute on function public.mesaha_terminal_owner_v559(text, text, jsonb) to anon, authenticated, service_role;
grant execute on function public.mesaha_terminal_backup_slot_upsert_v559(text, text, text, jsonb, jsonb, text) to anon, authenticated, service_role;
grant execute on function public.mesaha_terminal_backup_chunk_upsert_v559(text, text, text, integer, jsonb, jsonb, text) to anon, authenticated, service_role;
grant execute on function public.mesaha_terminal_backup_list_v559(text, text, jsonb, text) to anon, authenticated, service_role;
grant execute on function public.mesaha_terminal_backup_read_v559(text, text, text, jsonb, text) to anon, authenticated, service_role;
grant execute on function public.mesaha_terminal_backup_hide_v559(text, text, text, jsonb, text) to anon, authenticated, service_role;

commit;
