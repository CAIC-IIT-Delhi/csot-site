-- Per-track leaderboard rows edited by track leads at /tracks/<slug>/leaderboard/edit.
-- Only rank + entry_number are stored; name and hostel are resolved from csot_users at read time.

create table if not exists public.csot_leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  track_slug text not null,
  rank integer not null check (rank >= 1),
  entry_number text not null,
  updated_at timestamptz not null default now(),
  unique (track_slug, rank),
  unique (track_slug, entry_number)
);

create index if not exists csot_leaderboard_entries_track_idx
  on public.csot_leaderboard_entries (track_slug);

alter table public.csot_leaderboard_entries enable row level security;

-- No policies: anon/authenticated have no direct access. All reads/writes
-- go through Server Actions using the service-role key (which bypasses RLS).
