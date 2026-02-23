-- ============================================================
-- School Sports Hub - Schedule & Locations Migration
-- ============================================================

-- 1. Update Stations with Locations
alter table public.stations add column if not exists location text;

update public.stations set location = 'מגרש מרכזי' where name = 'מחניים';
update public.stations set location = 'דשא מזרחי' where name = 'מרוץ קנגרו';
update public.stations set location = 'רחבת כניסה' where name = 'משיכה בחבל';
update public.stations set location = 'שביל היקפי' where name = 'מרוץ אלונקות';
update public.stations set location = 'מגרש פתוח' where name = 'כדורעף';
update public.stations set location = 'אולם ספורט' where name = 'כדורסל';

-- 2. Clear and Populate Schedule
-- We use a CTE to map names to actual IDs for accuracy
truncate table public.schedule;

with match_data (round_num, start_time_str, station_name, team_a_name, team_b_name) as (
  values
    -- Round 1: 10:30 - 10:50
    (1, '2026-02-23 10:30:00+02', 'מחניים', 'ז1', 'ז2'),
    (1, '2026-02-23 10:30:00+02', 'מרוץ קנגרו', 'ח1', 'ח3'),
    (1, '2026-02-23 10:30:00+02', 'משיכה בחבל', 'ט1', 'ט3'),
    (1, '2026-02-23 10:30:00+02', 'מרוץ אלונקות', 'ז2', 'ט2'),
    (1, '2026-02-23 10:30:00+02', 'כדורעף', 'ז1', 'ז2'),
    (1, '2026-02-23 10:30:00+02', 'כדורסל', 'ח1', 'ח3'),
    
    -- Round 2: 10:55 - 11:15
    (2, '2026-02-23 10:55:00+02', 'מחניים', 'ח1', 'ח3'),
    (2, '2026-02-23 10:55:00+02', 'מרוץ קנגרו', 'ז1', 'ז2'),
    (2, '2026-02-23 10:55:00+02', 'משיכה בחבל', 'ז2', 'ט2'),
    (2, '2026-02-23 10:55:00+02', 'מרוץ אלונקות', 'ט1', 'ט3'),
    (2, '2026-02-23 10:55:00+02', 'כדורעף', 'ח1', 'ח3'),
    (2, '2026-02-23 10:55:00+02', 'כדורסל', 'ט1', 'ט3'),

    -- Round 3: 11:20 - 11:40
    (3, '2026-02-23 11:20:00+02', 'מחניים', 'ט1', 'ט3'),
    (3, '2026-02-23 11:20:00+02', 'מרוץ קנגרו', 'ז2', 'ט2'),
    (3, '2026-02-23 11:20:00+02', 'משיכה בחבל', 'ז1', 'ז2'),
    (3, '2026-02-23 11:20:00+02', 'מרוץ אלונקות', 'ח1', 'ח3'),
    (3, '2026-02-23 11:20:00+02', 'כדורעף', 'ט1', 'ט3'),
    (3, '2026-02-23 11:20:00+02', 'כדורסל', 'ז1', 'ז2'),

    -- Round 4: 11:45 - 12:05
    (4, '2026-02-23 11:45:00+02', 'מחניים', 'ז2', 'ט2'),
    (4, '2026-02-23 11:45:00+02', 'מרוץ קנגרו', 'ט1', 'ט3'),
    (4, '2026-02-23 11:45:00+02', 'משיכה בחבל', 'ח1', 'ח3'),
    (4, '2026-02-23 11:45:00+02', 'מרוץ אלונקות', 'ז1', 'ז2'),

    -- Round 5: 12:10 - 12:30
    (5, '2026-02-23 12:10:00+02', 'כדורעף', 'ז2', 'ט2'),
    (5, '2026-02-23 12:10:00+02', 'כדורסל', 'ז2', 'ט2')
)
insert into public.schedule (team_id, station_id, opponent_id, start_time)
select 
  t1.id as team_id,
  s.id as station_id,
  t2.id as opponent_id,
  m.start_time_str::timestamptz
from match_data m
join public.stations s on s.name = m.station_name
join public.teams t1 on t1.name = m.team_a_name
left join public.teams t2 on t2.name = m.team_b_name;
