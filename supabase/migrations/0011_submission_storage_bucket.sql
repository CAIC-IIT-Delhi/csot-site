-- Public bucket for track submission media (organized as entrynumber_name/…).

insert into storage.buckets (id, name, public, file_size_limit)
values ('csot-submissions', 'csot-submissions', true, 52428800)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;
