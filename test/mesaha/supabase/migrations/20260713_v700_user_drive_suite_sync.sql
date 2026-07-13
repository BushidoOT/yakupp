-- Mesaha Suite V8 • kullanıcıya özel Drive, yedek metadata ve ortak İstif senkronu
create extension if not exists pgcrypto;

create table if not exists public.mesaha_user_drive_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  last_seflik_key text,
  last_seflik text,
  refresh_token_cipher text not null,
  refresh_token_iv text not null,
  folder_id text not null,
  folder_name text,
  folder_url text,
  scopes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mesaha_user_drive_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  seflik_key text,
  seflik text,
  redirect_uri text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists mesaha_user_drive_oauth_states_user_idx on public.mesaha_user_drive_oauth_states(user_id, expires_at desc);

create table if not exists public.mesaha_user_drive_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_key text,
  email text,
  name text,
  seflik_key text,
  seflik text,
  app_id text not null default 'suite',
  drive_file_id text not null unique,
  file_name text not null,
  web_view_link text,
  record_count integer not null default 0,
  total_volume numeric(18,3) not null default 0,
  version text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mesaha_user_drive_backups_user_idx on public.mesaha_user_drive_backups(user_id, created_at desc);
create index if not exists mesaha_user_drive_backups_admin_idx on public.mesaha_user_drive_backups(seflik_key, created_at desc);

-- İstif kayıt tablosu eski kurulumda yoksa ortak senkron için oluşturulur.
create table if not exists public.mesaha_istif_records (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  seflik_key text not null,
  seflik text not null,
  ormanci text,
  record_date date,
  bolme_no text not null,
  istif_no text,
  wood_type text,
  ster numeric(18,3) not null default 0,
  coordinates text,
  mevki text,
  description text,
  barcode_no text,
  photo_count integer not null default 0,
  drive_folder_id text,
  drive_files jsonb not null default '[]'::jsonb,
  sync_status text not null default 'synced',
  is_sent boolean not null default false,
  sent_at timestamptz,
  sent_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mesaha_istif_records_seflik_idx on public.mesaha_istif_records(seflik_key, bolme_no, updated_at desc);
create index if not exists mesaha_istif_records_user_idx on public.mesaha_istif_records(user_id, updated_at desc);

alter table public.mesaha_user_drive_connections enable row level security;
alter table public.mesaha_user_drive_oauth_states enable row level security;
alter table public.mesaha_user_drive_backups enable row level security;
alter table public.mesaha_istif_records enable row level security;

-- Edge Functions service_role ile çalışır. Kullanıcıların REST üzerinden token veya başkasının yedeğini okuması engellenir.
revoke all on public.mesaha_user_drive_connections from anon, authenticated;
revoke all on public.mesaha_user_drive_oauth_states from anon, authenticated;
revoke all on public.mesaha_user_drive_backups from anon, authenticated;
revoke all on public.mesaha_istif_records from anon;

grant select, insert, update, delete on public.mesaha_istif_records to authenticated;

-- Aynı şeflik/bölme daha önce sunucuda varsa create_division idempotent kalır;
-- offline oluşturulan aynı numara yeni bir bölme üretmek yerine mevcut satırla birleşir.
