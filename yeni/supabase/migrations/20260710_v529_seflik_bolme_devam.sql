-- Mesaha İO V5.29 — Şeflik Klasörü açık bölmeler ve Mesahaya Devam Et
-- Supabase SQL Editor içinde V5.28 migration sonrasında bir kez çalıştırılır.

begin;

create extension if not exists pgcrypto;

create table if not exists public.mesaha_seflik_divisions (
  id text primary key,
  seflik_key text not null,
  seflik text not null,
  bolme_key text not null,
  bolme_no text not null,
  status text not null default 'open',
  created_by_user_id uuid,
  created_by_user_key text,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

alter table public.mesaha_seflik_divisions
  add column if not exists seflik_key text,
  add column if not exists seflik text,
  add column if not exists bolme_key text,
  add column if not exists bolme_no text,
  add column if not exists status text default 'open',
  add column if not exists created_by_user_id uuid,
  add column if not exists created_by_user_key text,
  add column if not exists created_by_name text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists last_activity_at timestamptz default now();

update public.mesaha_seflik_divisions
set status = 'open'
where status is null or btrim(status) = '';

create unique index if not exists ux_mesaha_seflik_divisions_folder
  on public.mesaha_seflik_divisions(seflik_key, bolme_key);

create index if not exists idx_mesaha_seflik_divisions_open
  on public.mesaha_seflik_divisions(seflik_key, status, updated_at desc);

create or replace function public.mesaha_touch_seflik_division_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mesaha_seflik_divisions_touch on public.mesaha_seflik_divisions;
create trigger mesaha_seflik_divisions_touch
before update on public.mesaha_seflik_divisions
for each row execute function public.mesaha_touch_seflik_division_updated_at();

-- V5.28 ile daha önce veri gönderilmiş bölmeleri açık bölme olarak içeri al.
do $$
begin
  if to_regclass('public.mesaha_seflik_records') is not null then
    execute $sql$
      insert into public.mesaha_seflik_divisions (
        id, seflik_key, seflik, bolme_key, bolme_no, status,
        created_by_user_id, created_by_user_key, created_by_name,
        created_at, updated_at, last_activity_at
      )
      select distinct on (seflik_key, bolme_key)
        left(seflik_key || '__' || bolme_key, 360),
        seflik_key,
        seflik,
        bolme_key,
        bolme_no,
        'open',
        uploaded_by_user_id,
        uploaded_by_user_key,
        uploaded_by_name,
        coalesce(created_at, now()),
        coalesce(updated_at, now()),
        coalesce(updated_at, created_at, now())
      from public.mesaha_seflik_records
      where seflik_key is not null and bolme_key is not null
      order by seflik_key, bolme_key, updated_at desc
      on conflict (seflik_key, bolme_key) do nothing
    $sql$;
  end if;

  if to_regclass('public.mesaha_seflik_syncs') is not null then
    execute $sql$
      insert into public.mesaha_seflik_divisions (
        id, seflik_key, seflik, bolme_key, bolme_no, status,
        created_by_user_id, created_by_user_key, created_by_name,
        created_at, updated_at, last_activity_at
      )
      select distinct on (seflik_key, bolme_key)
        left(seflik_key || '__' || bolme_key, 360),
        seflik_key,
        seflik,
        bolme_key,
        bolme_no,
        'open',
        user_id,
        user_key,
        user_name,
        coalesce(created_at, now()),
        coalesce(created_at, now()),
        coalesce(created_at, now())
      from public.mesaha_seflik_syncs
      where seflik_key is not null and bolme_key is not null
      order by seflik_key, bolme_key, created_at desc
      on conflict (seflik_key, bolme_key) do nothing
    $sql$;
  end if;
end;
$$;

-- İstemci tabloları doğrudan okuyamaz; tüm erişim Edge Function üzerinden yapılır.
alter table public.mesaha_seflik_divisions enable row level security;
revoke all on table public.mesaha_seflik_divisions from anon, authenticated;
grant all on table public.mesaha_seflik_divisions to service_role;

commit;
