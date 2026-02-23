import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Types ────────────────────────────────────────────────────────────────────
export interface Team {
  id: string
  name: string
  grade: string
  total_points: number
  color: string
}

export interface Station {
  id: string
  name: string
  icon: string
  location: string | null
}

export interface Result {
  id: string
  team_id: string
  station_id: string
  opponent_id: string | null
  is_winner: boolean
  points_earned: number
  recorded_by: string | null
  created_at: string
  teams?: Team
  stations?: Station
  opponents?: Team
}

export interface ScheduleEntry {
  id: string
  team_id: string
  station_id: string
  opponent_id: string | null
  start_time: string
  teams?: Team
  stations?: Station
  opponents?: Team
}

export interface LeaderboardRow {
  rank: number
  id: string
  name: string
  grade: string
  total_points: number
  color: string
}
