-- ============================================================
-- School Sports Hub - Database Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- TEAMS
-- ============================================================
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  grade       text not null,
  total_points integer not null default 0,
  color       text not null default '#06b6d4',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- STATIONS
-- ============================================================
create table if not exists public.stations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  icon       text not null default '🏆',
  created_at timestamptz not null default now()
);

-- ============================================================
-- RESULTS
-- ============================================================
create table if not exists public.results (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams(id) on delete cascade,
  station_id    uuid not null references public.stations(id) on delete cascade,
  opponent_id   uuid references public.teams(id) on delete set null,
  is_winner     boolean not null,
  points_earned integer not null default 0,
  recorded_by   text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- SCHEDULE
-- ============================================================
create table if not exists public.schedule (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  station_id  uuid not null references public.stations(id) on delete cascade,
  opponent_id uuid references public.teams(id) on delete set null,
  start_time  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.results;
alter publication supabase_realtime add table public.schedule;

-- ============================================================
-- SEED DATA - Teams
-- ============================================================
insert into public.teams (name, grade, color) values
  ('ז1', 'ז', '#06b6d4'),
  ('ז2', 'ז', '#0891b2'),
  ('ח1', 'ח', '#8b5cf6'),
  ('ח3', 'ח', '#7c3aed'),
  ('ט1', 'ט', '#ec4899'),
  ('ט2', 'ט', '#db2777'),
  ('ט3', 'ט', '#be185d')
on conflict (name) do nothing;

-- ============================================================
-- SEED DATA - Stations
-- ============================================================
insert into public.stations (name, icon) values
  ('מחניים', '🔴'),
  ('מרוץ קנגרו', '🦘'),
  ('משיכה בחבל', '🪢'),
  ('מרוץ אלונקות', '🚑'),
  ('כדורעף', '🏐'),
  ('כדורסל', '🏀')
on conflict (name) do nothing;
