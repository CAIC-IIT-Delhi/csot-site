-- Allow multiple leaderboard rows to share the same rank (e.g. tied scores).

alter table public.csot_leaderboard_entries
  drop constraint if exists csot_leaderboard_entries_track_slug_rank_key;
