-- Mesaha Suite V6 — şeflik adını ilişkili tüm ortak verilerle atomik güncelle
begin;

create or replace function public.mesaha_suite_rename_seflik_v600(
  p_old_key text,
  p_new_key text,
  p_new_name text,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_folder public.mesaha_seflik_folders%rowtype;
  v_now timestamptz := now();
begin
  p_old_key := btrim(coalesce(p_old_key,''));
  p_new_key := btrim(coalesce(p_new_key,''));
  p_new_name := left(btrim(coalesce(p_new_name,'')),120);
  if p_old_key = '' or p_new_key = '' or length(p_new_name) < 2 or p_user_id is null then
    raise exception 'Geçerli eski/yeni şeflik bilgisi gerekli';
  end if;

  select * into v_folder
  from public.mesaha_seflik_folders
  where seflik_key = p_old_key and status = 'active'
  for update;

  if not found then raise exception 'Düzenlenecek şeflik bulunamadı'; end if;
  if v_folder.created_by_user_id <> p_user_id then raise exception 'Şeflik ismini yalnızca kurucu değiştirebilir'; end if;
  if p_old_key = p_new_key then
    update public.mesaha_seflik_folders set seflik=p_new_name,updated_at=v_now where seflik_key=p_old_key;
    update public.mesaha_seflik_divisions set seflik=p_new_name,updated_at=v_now where seflik_key=p_old_key;
    update public.mesaha_seflik_records set seflik=p_new_name,record_data=coalesce(record_data,'{}'::jsonb)||jsonb_build_object('seflik',p_new_name),updated_at=v_now where seflik_key=p_old_key;
    update public.mesaha_seflik_syncs set seflik=p_new_name where seflik_key=p_old_key;
    return jsonb_build_object('ok',true,'old_key',p_old_key,'new_key',p_new_key,'seflik',p_new_name);
  end if;

  if exists(select 1 from public.mesaha_seflik_folders where id=p_new_key or seflik_key=p_new_key) then
    raise exception 'Bu isimle bir şeflik kaydı zaten var';
  end if;
  if exists(select 1 from public.mesaha_seflik_members where seflik_key=p_new_key)
     or exists(select 1 from public.mesaha_seflik_divisions where seflik_key=p_new_key)
     or exists(select 1 from public.mesaha_seflik_records where seflik_key=p_new_key)
     or exists(select 1 from public.mesaha_seflik_syncs where seflik_key=p_new_key) then
    raise exception 'Yeni şeflik anahtarı başka ortak kayıtlarla çakışıyor';
  end if;

  update public.mesaha_seflik_records
     set id=left(p_new_key||'__'||bolme_key||'__'||uploaded_by_user_id::text||'__'||record_key,480),
         seflik_key=p_new_key,seflik=p_new_name,
         record_data=coalesce(record_data,'{}'::jsonb)||jsonb_build_object('seflik',p_new_name),updated_at=v_now
   where seflik_key=p_old_key;
  update public.mesaha_seflik_syncs set seflik_key=p_new_key,seflik=p_new_name where seflik_key=p_old_key;
  update public.mesaha_seflik_divisions
     set id=left(p_new_key||'__'||bolme_key,360),seflik_key=p_new_key,seflik=p_new_name,updated_at=v_now,last_activity_at=v_now
   where seflik_key=p_old_key;
  update public.mesaha_seflik_members
     set id=left(p_new_key||'__'||user_id::text,360),seflik_key=p_new_key,updated_at=v_now
   where seflik_key=p_old_key;
  update public.mesaha_seflik_folders
     set id=p_new_key,seflik_key=p_new_key,seflik=p_new_name,updated_at=v_now
   where seflik_key=p_old_key;

  return jsonb_build_object('ok',true,'old_key',p_old_key,'new_key',p_new_key,'seflik',p_new_name,'updated_at',v_now);
end;
$$;

revoke all on function public.mesaha_suite_rename_seflik_v600(text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.mesaha_suite_rename_seflik_v600(text,text,text,uuid) to service_role;

commit;
