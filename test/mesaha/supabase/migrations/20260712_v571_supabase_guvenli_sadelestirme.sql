-- Mesaha İO V5.71 - Supabase güvenli sadeleştirme / bakım
-- Amaç: Uygulamanın ihtiyaç duyduğu tabloları DROP etmeden gereksiz log, debug,
-- rate-limit ve geçici kayıtları sıfırlamak. Ana veriler, kullanıcılar, yedekler,
-- şeflik klasörleri ve gerçek admin engelleri korunur.

begin;

-- 1) Geçici/debug tablolarını boşalt
truncate table if exists public.mesaha_login_debug_logs restart identity;
truncate table if exists public.mesaha_log_current restart identity;
truncate table if exists public.mesaha_admin_audit_logs restart identity;
truncate table if exists public.mesaha_user_auth_events restart identity;
truncate table if exists public.mesaha_security_events restart identity;
truncate table if exists public.mesaha_rate_limits restart identity;
truncate table if exists public.mesaha_request_dedup restart identity;

-- 2) Kullanım sayaçlarını sıfırla; kayıt/yedek silmez
truncate table if exists public.mesaha_usage_current restart identity;
truncate table if exists public.mesaha_usage_daily restart identity;

-- 3) Süresi dolmuş terminal kodlarını temizle
update public.mesaha_terminal_pairing_codes
   set status = 'expired', updated_at = now()
 where status = 'active'
   and expires_at is not null
   and expires_at < now();

delete from public.mesaha_terminal_pairing_codes
 where status in ('expired','used','revoked')
   and coalesce(updated_at, created_at, now()) < now() - interval '7 days';

-- 4) Eski/inaktif sahte ban kayıtlarını temizle; gerçek aktif admin engeli korunur
update public.mesaha_security_blocks
   set active = false,
       reason = coalesce(reason, '') || ' | V5.71 güvenli sadeleştirme: eski/geçici engel pasifleştirildi'
 where active = true
   and lower(coalesce(reason,'')) similar to '%(eski sürüm|eski surum|old version|cache|service worker|güncelleme|guncelleme|anon|google_required|session|oturum|update_required)%'
   and lower(coalesce(reason,'')) not like '%admin%';

delete from public.mesaha_security_blocks
 where active = false
   and coalesce(created_at, updated_at, now()) < now() - interval '30 days';

-- 5) Google profil fotoğraflarını profillere geri doldur
update public.mesaha_user_profiles p
   set avatar_url = coalesce(nullif(p.avatar_url,''), a.avatar_url, a.metadata->>'avatar_url', a.metadata->>'google_avatar_url', a.metadata->>'picture'),
       payload = coalesce(p.payload, '{}'::jsonb) || jsonb_build_object(
         'avatar_url', coalesce(nullif(p.avatar_url,''), a.avatar_url, a.metadata->>'avatar_url', a.metadata->>'google_avatar_url', a.metadata->>'picture')
       )
  from public.mesaha_user_access a
 where p.user_id = a.user_id
   and a.status = 'approved'
   and coalesce(nullif(p.avatar_url,''), a.avatar_url, a.metadata->>'avatar_url', a.metadata->>'google_avatar_url', a.metadata->>'picture') is not null;

commit;

-- Tam fabrika sıfırlama istersen aşağıdaki blok ayrıca çalıştırılabilir.
-- DİKKAT: Kullanıcı, yedek, şeflik klasörü ve tüm kayıtları siler. Normal bakımda çalıştırma.
-- begin;
-- truncate table if exists public.mesaha_backup_chunks restart identity cascade;
-- truncate table if exists public.mesaha_backup_slots restart identity cascade;
-- truncate table if exists public.mesaha_seflik_records restart identity cascade;
-- truncate table if exists public.mesaha_seflik_syncs restart identity cascade;
-- truncate table if exists public.mesaha_seflik_divisions restart identity cascade;
-- truncate table if exists public.mesaha_seflik_members restart identity cascade;
-- truncate table if exists public.mesaha_seflik_folders restart identity cascade;
-- truncate table if exists public.mesaha_terminal_pairing_codes restart identity cascade;
-- truncate table if exists public.mesaha_user_access restart identity cascade;
-- truncate table if exists public.mesaha_user_profiles restart identity cascade;
-- truncate table if exists public.mesaha_security_blocks restart identity cascade;
-- commit;
