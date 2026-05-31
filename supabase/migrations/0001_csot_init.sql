-- CSoT'26 — initial schema
-- Run this in the Supabase SQL Editor for the target project.
-- It is idempotent (uses "if not exists") and creates only namespaced tables.

create table if not exists public.csot_users (
  id uuid primary key default gen_random_uuid(),
  kerberos text unique not null,
  entry_number text,
  name text,
  email text,
  department text,
  phone text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists csot_users_email_idx on public.csot_users (email);

create table if not exists public.csot_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.csot_users(id) on delete cascade,
  track_slug text not null,
  hostel text not null,
  year smallint not null check (year between 1 and 6),
  past_experience text not null,
  why_track text not null,
  commitment_hours smallint not null check (commitment_hours between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, track_slug)
);

create index if not exists csot_registrations_user_idx on public.csot_registrations (user_id);
create index if not exists csot_registrations_track_idx on public.csot_registrations (track_slug);

create or replace function public.csot_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists csot_registrations_updated_at on public.csot_registrations;
create trigger csot_registrations_updated_at
  before update on public.csot_registrations
  for each row execute function public.csot_set_updated_at();

alter table public.csot_users enable row level security;
alter table public.csot_registrations enable row level security;

-- No policies: anon/authenticated have no direct access. All reads/writes
-- go through Server Actions using the service-role key (which bypasses RLS).
