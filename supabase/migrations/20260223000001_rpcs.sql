-- ============================================================
-- School Sports Hub - RPC Functions
-- ============================================================

-- ============================================================
-- record_match_result
-- Atomically records a match result and updates team total_points.
-- ============================================================
create or replace function public.record_match_result(
  p_team_id     uuid,
  p_station_id  uuid,
  p_opponent_id uuid,
  p_is_winner   boolean,
  p_points      integer,
  p_recorded_by text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_result_id uuid;
begin
  -- Insert the result
  insert into public.results (team_id, station_id, opponent_id, is_winner, points_earned, recorded_by)
  values (p_team_id, p_station_id, p_opponent_id, p_is_winner, p_points, p_recorded_by)
  returning id into v_result_id;

  -- Update total_points for the team
  update public.teams
  set total_points = total_points + p_points
  where id = p_team_id;

  return v_result_id;
end;
$$;

-- ============================================================
-- update_match_result
-- Corrects a previously recorded match result with point compensation.
-- ============================================================
create or replace function public.update_match_result(
  p_result_id   uuid,
  p_is_winner   boolean,
  p_points      integer
)
returns void
language plpgsql
security definer
as $$
declare
  v_old_points  integer;
  v_team_id     uuid;
begin
  -- Get old data
  select points_earned, team_id
  into v_old_points, v_team_id
  from public.results
  where id = p_result_id;

  if not found then
    raise exception 'Result % not found', p_result_id;
  end if;

  -- Update the result row
  update public.results
  set is_winner = p_is_winner,
      points_earned = p_points
  where id = p_result_id;

  -- Compensate: subtract old points, add new points
  update public.teams
  set total_points = total_points - v_old_points + p_points
  where id = v_team_id;
end;
$$;

-- ============================================================
-- delete_match_result
-- Deletes a result and removes its points from the team.
-- ============================================================
create or replace function public.delete_match_result(
  p_result_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_old_points integer;
  v_team_id    uuid;
begin
  select points_earned, team_id
  into v_old_points, v_team_id
  from public.results
  where id = p_result_id;

  if not found then
    raise exception 'Result % not found', p_result_id;
  end if;

  delete from public.results where id = p_result_id;

  update public.teams
  set total_points = total_points - v_old_points
  where id = v_team_id;
end;
$$;

-- ============================================================
-- get_leaderboard
-- Returns teams sorted by total_points descending.
-- ============================================================
create or replace function public.get_leaderboard()
returns table (
  rank         bigint,
  id           uuid,
  name         text,
  grade        text,
  total_points integer,
  color        text
)
language sql
security definer
as $$
  select
    row_number() over (order by total_points desc) as rank,
    id, name, grade, total_points, color
  from public.teams
  order by total_points desc;
$$;
