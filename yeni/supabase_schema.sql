-- Mesaha İO v426 Supabase şeması
-- Supabase SQL Editor içine tamamını yapıştırıp çalıştır.

create table if not exists public.users (
  id text primary key,
  user_key text,
  name text,
  seflik text,
  bolme_no text,
  payload jsonb not null default '{}'::jsonb,
  created_at_ms bigint,
  updated_at_ms bigint,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_stats (
  id text primary key,
  user_key text,
  name text,
  seflik text,
  bolme_no text,
  payload jsonb not null default '{}'::jsonb,
  created_at_ms bigint,
  updated_at_ms bigint,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.backups (
  id text primary key,
  user_key text,
  name text,
  seflik text,
  bolme_no text,
  payload jsonb not null default '{}'::jsonb,
  created_at_ms bigint,
  updated_at_ms bigint,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.backup_chunks (
  id text primary key,
  backup_id text not null,
  chunk_index integer not null default 0,
  records jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  inserted_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id text primary key,
  user_key text,
  name text,
  seflik text,
  bolme_no text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  created_at_ms bigint,
  updated_at_ms bigint,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.export_logs (
  id text primary key,
  user_key text,
  name text,
  seflik text,
  bolme_no text,
  payload jsonb not null default '{}'::jsonb,
  created_at_ms bigint,
  updated_at_ms bigint,
  inserted_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at_ms bigint,
  updated_at_ms bigint,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_broadcasts (
  id text primary key,
  user_key text,
  name text,
  seflik text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  created_at_ms bigint,
  updated_at_ms bigint,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.health_checks (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at_ms bigint,
  updated_at_ms bigint,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_user_key_idx on public.users(user_key);
create index if not exists users_updated_at_ms_idx on public.users(updated_at_ms desc);
create index if not exists usage_stats_user_key_idx on public.usage_stats(user_key);
create index if not exists backups_user_key_idx on public.backups(user_key);
create index if not exists backups_created_at_ms_idx on public.backups(created_at_ms desc);
create index if not exists backup_chunks_backup_id_idx on public.backup_chunks(backup_id, chunk_index);
create index if not exists support_tickets_user_key_idx on public.support_tickets(user_key);
create index if not exists export_logs_user_key_idx on public.export_logs(user_key);

alter table public.users enable row level security;
alter table public.usage_stats enable row level security;
alter table public.backups enable row level security;
alter table public.backup_chunks enable row level security;
alter table public.support_tickets enable row level security;
alter table public.export_logs enable row level security;
alter table public.admin_settings enable row level security;
alter table public.admin_broadcasts enable row level security;
alter table public.health_checks enable row level security;

-- Mesaha mevcut PWA yapısı anonim/public client ile çalıştığı için geçiş aşamasında anon okuma/yazma açıktır.
-- Daha güvenli final sistemde bunu Edge Function + admin token yapısına çeviririz.
do $$
declare t text;
begin
  foreach t in array array['users','usage_stats','backups','backup_chunks','support_tickets','export_logs','admin_settings','admin_broadcasts','health_checks'] loop
    execute format('drop policy if exists mesaha_anon_all on public.%I', t);
    execute format('create policy mesaha_anon_all on public.%I for all to anon using (true) with check (true)', t);
  end loop;
end $$;
