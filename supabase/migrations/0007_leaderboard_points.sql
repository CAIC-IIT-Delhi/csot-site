-- Optional per-row points for DB-backed leaderboards; track-level toggle in settings.

alter table public.csot_leaderboard_entries
  add column if not exists points numeric;

create table if not exists public.csot_leaderboard_settings (
  track_slug text primary key,
  uses_points boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.csot_leaderboard_settings enable row level security;

-- No policies: service-role only (same pattern as csot_leaderboard_entries).
