-- Mesaha İO V5.50
-- Eski admin giriş süreli kilit kovalarını temizler.
-- Genel anti-spam / yedek / Şeflik rate-limit sistemi korunur.

delete from public.mesaha_rate_limits
where bucket_key like 'admin-login-email:%'
   or bucket_key like 'admin-login-ip:%';
