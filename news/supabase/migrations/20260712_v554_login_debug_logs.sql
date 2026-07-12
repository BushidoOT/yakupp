-- Mesaha İO V5.54 giriş teşhis logları
-- Bu tablo Google/Supabase giriş akışında hatanın tam adımını görmek için kullanılır.

create extension if not exists pgcrypto;

create table if not exists public.mesaha_login_debug_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text,
  event_name text not null,
  level text not null default 'info',
  app_version text,
  build integer,
  page_url text,
  device_id text,
  user_id uuid,
  email text,
  user_name text,
  seflik text,
  user_agent text,
  detail jsonb not null default '{}'::jsonb
);

create index if not exists mesaha_login_debug_logs_created_at_idx on public.mesaha_login_debug_logs (created_at desc);
create index if not exists mesaha_login_debug_logs_session_idx on public.mesaha_login_debug_logs (session_id, created_at desc);
create index if not exists mesaha_login_debug_logs_event_idx on public.mesaha_login_debug_logs (event_name, created_at desc);
create index if not exists mesaha_login_debug_logs_email_idx on public.mesaha_login_debug_logs (email, created_at desc);

alter table public.mesaha_login_debug_logs enable row level security;

drop policy if exists mesaha_login_debug_logs_insert_any on public.mesaha_login_debug_logs;
drop policy if exists mesaha_login_debug_logs_select_authenticated on public.mesaha_login_debug_logs;

drop policy if exists "mesaha_login_debug_logs_insert_any" on public.mesaha_login_debug_logs;
drop policy if exists "mesaha_login_debug_logs_select_authenticated" on public.mesaha_login_debug_logs;

create policy "mesaha_login_debug_logs_insert_any"
on public.mesaha_login_debug_logs
for insert
to anon, authenticated
with check (true);

create policy "mesaha_login_debug_logs_select_authenticated"
on public.mesaha_login_debug_logs
for select
to authenticated
using (true);

grant insert on public.mesaha_login_debug_logs to anon, authenticated;
grant select on public.mesaha_login_debug_logs to authenticated;
