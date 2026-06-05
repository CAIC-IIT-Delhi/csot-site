-- Track-lead Google Drive OAuth (refresh token for client-side uploads).

create table public.csot_track_google_drive (
  track_slug text primary key,
  connected_email text not null,
  refresh_token_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.csot_track_google_drive enable row level security;
