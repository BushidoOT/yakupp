-- Mesaha İO V5.18 - Admin panel + IP + günlük istatistik Supabase şeması
-- Supabase SQL Editor içinde bir kez çalıştırılacak.

create extension if not exists pgcrypto;

alter table if exists public.mesaha_user_profiles
  add column if not exists user_key text,
  add column if not exists name text,
  add column if not exists seflik text,
  add column if not exists bolme_no text,
  add column if not exists app_version text,
  add column if not exists device_id text,
  add column if not exists last_ip text,
  add column if not exists last_seen_at timestamptz,
  add column if not exists platform text,
  add column if not exists browser text,
  add column if not exists browser_version text,
  add column if not exists device_info jsonb default '{}'::jsonb,
  add column if not exists payload jsonb default '{}'::jsonb;

alter table if exists public.mesaha_usage_current
  add column if not exists user_key text,
  add column if not exists name text,
  add column if not exists seflik text,
  add column if not exists app_version text,
  add column if not exists device_id text,
  add column if not exists last_ip text,
  add column if not exists last_seen_at timestamptz,
  add column if not exists payload jsonb default '{}'::jsonb;

alter table if exists public.mesaha_backup_slots
  add column if not exists user_key text,
  add column if not exists name text,
  add column if not exists seflik text,
  add column if not exists drive_file_id text,
  add column if not exists file_id text,
  add column if not exists source text,
  add column if not exists archived boolean default false,
  add column if not exists payload jsonb default '{}'::jsonb;

alter table if exists public.mesaha_backup_chunks
  add column if not exists user_key text,
  add column if not exists drive_file_id text,
  add column if not exists file_id text;

create table if not exists public.mesaha_usage_daily (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  user_key text,
  name text,
  seflik text,
  date date not null default (now() at time zone 'Europe/Istanbul')::date,
  week_key text,
  month_key text,
  record_count integer not null default 0,
  total_volume numeric not null default 0,
  tree_totals jsonb not null default '{}'::jsonb,
  product_totals jsonb not null default '{}'::jsonb,
  app_version text,
  device_id text,
  last_ip text,
  payload jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mesaha_security_blocks (
  id uuid primary key default gen_random_uuid(),
  block_type text not null,
  block_value text not null,
  reason text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(block_type, block_value)
);

create table if not exists public.mesaha_security_events (
  id bigint generated always as identity primary key,
  user_id uuid,
  ip_address text,
  user_key text,
  name text,
  seflik text,
  device_id text,
  app_version text,
  event_type text,
  blocked boolean default false,
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mesaha_user_profiles_user_key on public.mesaha_user_profiles(user_key);
create index if not exists idx_mesaha_user_profiles_last_seen on public.mesaha_user_profiles(last_seen_at desc);
create index if not exists idx_mesaha_user_profiles_last_ip on public.mesaha_user_profiles(last_ip);
create index if not exists idx_mesaha_usage_current_user_key on public.mesaha_usage_current(user_key);
create index if not exists idx_mesaha_usage_daily_user_key_date on public.mesaha_usage_daily(user_key, date desc);
create index if not exists idx_mesaha_usage_daily_date on public.mesaha_usage_daily(date desc);
create index if not exists idx_mesaha_backup_slots_drive_file_id on public.mesaha_backup_slots(drive_file_id);
create index if not exists idx_mesaha_security_blocks_lookup on public.mesaha_security_blocks(block_type, block_value, active);
create index if not exists idx_mesaha_security_events_created on public.mesaha_security_events(created_at desc);
create index if not exists idx_mesaha_security_events_ip on public.mesaha_security_events(ip_address);

create or replace function public.mesaha_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists mesaha_usage_daily_touch on public.mesaha_usage_daily;
create trigger mesaha_usage_daily_touch before update on public.mesaha_usage_daily for each row execute function public.mesaha_touch_updated_at();

drop trigger if exists mesaha_security_blocks_touch on public.mesaha_security_blocks;
create trigger mesaha_security_blocks_touch before update on public.mesaha_security_blocks for each row execute function public.mesaha_touch_updated_at();

alter table public.mesaha_usage_daily enable row level security;

drop policy if exists "Mesaha usage daily select own" on public.mesaha_usage_daily;
create policy "Mesaha usage daily select own" on public.mesaha_usage_daily
  for select using (auth.uid() = user_id);

drop policy if exists "Mesaha usage daily insert own" on public.mesaha_usage_daily;
create policy "Mesaha usage daily insert own" on public.mesaha_usage_daily
  for insert with check (auth.uid() = user_id);

drop policy if exists "Mesaha usage daily update own" on public.mesaha_usage_daily;
create policy "Mesaha usage daily update own" on public.mesaha_usage_daily
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Not: Admin panel işlemleri Edge Function service role ile çalışır; service role RLS'i bypass eder.
