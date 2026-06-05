-- Per-field Google Drive folders; drop week-level media settings.

alter table public.csot_track_submission_weeks
  drop column if exists media_enabled,
  drop column if exists media_folder_url;
