-- Onboarding model: hostel, year, and phone are captured once during a
-- mandatory onboarding step after first sign-in, then reused across every
-- track registration the user makes. The per-registration columns for
-- hostel/year are no longer authoritative and are removed.

-- 1) Promote user-level fields. phone already exists from 0001.
alter table public.csot_users
  add column if not exists hostel text,
  add column if not exists year smallint check (year between 1 and 6),
  add column if not exists onboarded_at timestamptz;

-- 2) Per-registration columns dropped (the new product model carries
--    these on the user). Safe here because there is no real production
--    data yet; new registrations created post-migration will only ask
--    the track-specific questions.
alter table public.csot_registrations
  drop column if exists hostel,
  drop column if exists year;
