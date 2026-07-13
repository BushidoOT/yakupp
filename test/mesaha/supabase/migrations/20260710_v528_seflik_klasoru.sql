-- Mesaha İO V5.28 — Ortak Şeflik Klasörü
-- Supabase SQL Editor içinde bir kez çalıştırılır.

begin;

create extension if not exists pgcrypto;

create table if not exists public.mesaha_seflik_records (
  id text primary key,
  seflik_key text not null,
  seflik text not null,
  bolme_key text not null,
  bolme_no text not null,
  record_key text not null,
  barcode text,
  record_data jsonb not null default '{}'::jsonb,
  quantity integer not null default 1,
  volume numeric not null default 0,
  tree_type text,
  product_type text,
  cutter text,
  production_date date,
  uploaded_by_user_id uuid not null,
  uploaded_by_user_key text,
  uploaded_by_name text not null,
  sync_token text not null,
  app_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mesaha_seflik_records
  add column if not exists seflik_key text,
  add column if not exists seflik text,
  add column if not exists bolme_key text,
  add column if not exists bolme_no text,
  add column if not exists record_key text,
  add column if not exists barcode text,
  add column if not exists record_data jsonb default '{}'::jsonb,
  add column if not exists quantity integer default 1,
  add column if not exists volume numeric default 0,
  add column if not exists tree_type text,
  add column if not exists product_type text,
  add column if not exists cutter text,
  add column if not exists production_date date,
  add column if not exists uploaded_by_user_id uuid,
  add column if not exists uploaded_by_user_key text,
  add column if not exists uploaded_by_name text,
  add column if not exists sync_token text,
  add column if not exists app_version text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.mesaha_seflik_syncs (
  id uuid primary key default gen_random_uuid(),
  seflik_key text not null,
  seflik text not null,
  bolme_key text not null,
  bolme_no text not null,
  user_id uuid not null,
  user_key text,
  user_name text not null,
  sync_token text not null,
  record_count integer not null default 0,
  total_volume numeric not null default 0,
  drive_file_id text,
  drive_file_name text,
  drive_status text not null default 'pending',
  drive_error text,
  app_version text,
  created_at timestamptz not null default now()
);

alter table public.mesaha_seflik_syncs
  add column if not exists seflik_key text,
  add column if not exists seflik text,
  add column if not exists bolme_key text,
  add column if not exists bolme_no text,
  add column if not exists user_id uuid,
  add column if not exists user_key text,
  add column if not exists user_name text,
  add column if not exists sync_token text,
  add column if not exists record_count integer default 0,
  add column if not exists total_volume numeric default 0,
  add column if not exists drive_file_id text,
  add column if not exists drive_file_name text,
  add column if not exists drive_status text default 'pending',
  add column if not exists drive_error text,
  add column if not exists app_version text,
  add column if not exists created_at timestamptz default now();

create unique index if not exists ux_mesaha_seflik_record_owner_key
  on public.mesaha_seflik_records(seflik_key, bolme_key, uploaded_by_user_id, record_key);

create index if not exists idx_mesaha_seflik_records_folder
  on public.mesaha_seflik_records(seflik_key, bolme_key, updated_at desc);

create index if not exists idx_mesaha_seflik_records_owner
  on public.mesaha_seflik_records(uploaded_by_user_id, seflik_key, bolme_key);

create unique index if not exists ux_mesaha_seflik_sync_token
  on public.mesaha_seflik_syncs(user_id, seflik_key, bolme_key, sync_token);

create index if not exists idx_mesaha_seflik_syncs_folder
  on public.mesaha_seflik_syncs(seflik_key, bolme_key, created_at desc);

create index if not exists idx_mesaha_seflik_syncs_user
  on public.mesaha_seflik_syncs(user_id, created_at desc);

create or replace function public.mesaha_touch_seflik_record_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mesaha_seflik_records_touch on public.mesaha_seflik_records;
create trigger mesaha_seflik_records_touch
before update on public.mesaha_seflik_records
for each row execute function public.mesaha_touch_seflik_record_updated_at();

-- Veriler doğrudan istemciden okunmaz. Tüm erişim Edge Function + service role üzerinden yapılır.
alter table public.mesaha_seflik_records enable row level security;
alter table public.mesaha_seflik_syncs enable row level security;

revoke all on table public.mesaha_seflik_records from anon, authenticated;
revoke all on table public.mesaha_seflik_syncs from anon, authenticated;

grant all on table public.mesaha_seflik_records to service_role;
grant all on table public.mesaha_seflik_syncs to service_role;

commit;
