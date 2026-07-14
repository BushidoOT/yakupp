-- Mesaha Suite V13: eski İstif kök klasörü bağlantılarını yeniden oluşturulmaya hazırlar.
-- Edge Function deploy edildikten sonra çalıştırılabilir. Drive dosyaları silinmez.
update public.mesaha_user_drive_connections
set folder_id = null,
    folder_name = null,
    folder_url = null,
    updated_at = now()
where coalesce(folder_name, '') <> ''
  and lower(folder_name) not like 'mesaha suite%';
