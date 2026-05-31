-- "Year of study" was ambiguous (drifts with the calendar). Replace it with
-- entry_year (the academic year the student joined IIT Delhi), which is
-- stable and matches the way batches are referred to on campus.

alter table public.csot_users drop column if exists year;

alter table public.csot_users
  add column entry_year smallint
  check (entry_year between 2021 and 2025);
