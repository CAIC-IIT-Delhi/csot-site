-- Weekly project submissions (GitHub notebook links, etc.) per registered user.

create table if not exists public.csot_track_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.csot_users(id) on delete cascade,
  track_slug text not null,
  week smallint not null check (week >= 1),
  part1_github_url text not null,
  part2_github_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, track_slug, week)
);

create index if not exists csot_track_submissions_track_week_idx
  on public.csot_track_submissions (track_slug, week);

create index if not exists csot_track_submissions_user_idx
  on public.csot_track_submissions (user_id);

drop trigger if exists csot_track_submissions_updated_at on public.csot_track_submissions;
create trigger csot_track_submissions_updated_at
  before update on public.csot_track_submissions
  for each row execute function public.csot_set_updated_at();

alter table public.csot_track_submissions enable row level security;

-- No policies: anon/authenticated have no direct access. All reads/writes
-- go through Server Actions using the service-role key (which bypasses RLS).
