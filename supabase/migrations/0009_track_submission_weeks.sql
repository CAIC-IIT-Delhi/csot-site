-- Configurable week-wise submission forms (managed by track admins).

create table if not exists public.csot_track_submission_weeks (
  id uuid primary key default gen_random_uuid(),
  track_slug text not null,
  week smallint not null check (week >= 1),
  title text not null,
  description text,
  instructions_url text,
  part1_label text not null default 'Part 1 — GitHub link',
  part2_label text not null default 'Part 2 — GitHub link',
  part1_hint text,
  part2_hint text,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (track_slug, week)
);

create index if not exists csot_track_submission_weeks_track_idx
  on public.csot_track_submission_weeks (track_slug);

drop trigger if exists csot_track_submission_weeks_updated_at on public.csot_track_submission_weeks;
create trigger csot_track_submission_weeks_updated_at
  before update on public.csot_track_submission_weeks
  for each row execute function public.csot_set_updated_at();

alter table public.csot_track_submission_weeks enable row level security;

-- Seed ML in Astronomy Week 1 (migrated from hardcoded page).
insert into public.csot_track_submission_weeks (
  track_slug,
  week,
  title,
  description,
  instructions_url,
  part1_label,
  part2_label,
  part1_hint,
  part2_hint,
  is_open
) values (
  'ml-astronomy',
  1,
  'Setup, Tensors & Your First Data Pipeline',
  'Submit GitHub links to both completed notebooks — Part 1 (foundations / GPU smoke test) and Part 2 (Galaxy Zoo data pipeline). Each should run top-to-bottom in a fresh Colab session before you submit.',
  'https://github.com/itxprashant/csot-ml-astronomy/blob/main/ML-Astronomy/Week-1/09-project-task.md',
  'Part 1 — Foundations notebook (GitHub link)',
  'Part 2 — Data pipeline notebook (GitHub link)',
  'GPU smoke test notebook — Colab saved to your fork counts if the link is on GitHub.',
  'Galaxy Zoo loader and batch plot — push both notebooks under submissions/<your-name>/week1/ in your fork.',
  true
) on conflict (track_slug, week) do nothing;
