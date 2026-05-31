-- Store the OIDC subject separately from kerberos so we can match returning
-- users when kerberos was previously absent and their sub was stored in
-- csot_users.kerberos instead.

alter table public.csot_users
  add column if not exists oidc_sub text;

create unique index if not exists csot_users_oidc_sub_idx
  on public.csot_users (oidc_sub)
  where oidc_sub is not null;
