-- LUMÉA — Shared booth session log for Laptop 1 and Laptop 2.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Only numbers, the season and an optional nickname are stored. Never photos.

create table if not exists public.booth_sessions (
  id            uuid primary key,
  session_date  date        not null,
  session_time  text        not null,
  created_at    timestamptz not null default now(),
  passport_id   text        not null,
  nickname      text,
  season_id     text        not null,
  confidence    integer,
  device_code   text        not null,
  device_label  text        not null,
  package_code  text        not null default 'solo',
  price         integer     not null default 15000
);

-- Already ran an older version of this script? These two lines bring the table up to date.
alter table public.booth_sessions add column if not exists package_code text not null default 'solo';
alter table public.booth_sessions alter column price set default 15000;

create index if not exists booth_sessions_session_date_idx on public.booth_sessions (session_date);

-- Row Level Security: the website uses the public anon key, so it may only add
-- sessions and read them. Updating and deleting is done from the dashboard.
alter table public.booth_sessions enable row level security;

drop policy if exists "booth insert" on public.booth_sessions;
create policy "booth insert" on public.booth_sessions
  for insert to anon with check (price >= 0 and device_code in ('L1', 'L2') and package_code in ('solo', 'bundle'));

drop policy if exists "booth read" on public.booth_sessions;
create policy "booth read" on public.booth_sessions
  for select to anon using (true);

-- Realtime: the recap on one laptop updates as soon as the other adds a session.
alter publication supabase_realtime add table public.booth_sessions;
