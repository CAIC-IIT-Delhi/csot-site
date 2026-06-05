-- Custom submission fields + media uploads (Supabase Storage).

alter table public.csot_track_submission_weeks
  add column if not exists fields jsonb not null default '[]'::jsonb,
  add column if not exists media_enabled boolean not null default false,
  add column if not exists media_folder_url text;

-- Migrate legacy Part 1 / Part 2 columns into fields JSON.
update public.csot_track_submission_weeks
set fields = jsonb_build_array(
  jsonb_build_object(
    'id', 'part1',
    'type', 'url',
    'label', part1_label,
    'hint', part1_hint,
    'required', true,
    'githubOnly', true
  ),
  jsonb_build_object(
    'id', 'part2',
    'type', 'url',
    'label', part2_label,
    'hint', part2_hint,
    'required', true,
    'githubOnly', true
  )
)
where fields = '[]'::jsonb
  and part1_label is not null;

alter table public.csot_track_submissions
  add column if not exists responses jsonb not null default '{}'::jsonb;

update public.csot_track_submissions
set responses = jsonb_build_object(
  'part1', part1_github_url,
  'part2', part2_github_url
)
where responses = '{}'::jsonb
  and part1_github_url is not null;

alter table public.csot_track_submission_weeks
  drop column if exists part1_label,
  drop column if exists part2_label,
  drop column if exists part1_hint,
  drop column if exists part2_hint;

alter table public.csot_track_submissions
  drop column if exists part1_github_url,
  drop column if exists part2_github_url;
