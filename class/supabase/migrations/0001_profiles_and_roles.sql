-- Profiles and roles.
--
-- research/accounts-and-scheduling/03-the-data-model.md §1 and §2, and
-- 02 §3b for why the identity provider is referenced exactly once.
--
-- Row-level security is enabled on every table here, and it is NOT the
-- security model. Authorisation is decided in server code before any
-- query is issued (02 §3c); these policies are the second line. The
-- application connects with the service-role key, which bypasses them
-- entirely — so a policy that looks protective here protects nothing if
-- the server code forgot to check. They exist so that a future direct
-- client connection is not catastrophic, and so that a mistake is
-- contained rather than total.

create extension if not exists "pgcrypto";

-- profile ------------------------------------------------------------
--
-- `id` is ours and `auth_user_id` is theirs, and keeping them separate is
-- the whole of 03 §6: every foreign key in this model points at our id,
-- so replacing the identity provider touches one column rather than
-- every table.
create table if not exists public.profile (
  id            uuid primary key default gen_random_uuid(),

  -- The only reference to Supabase's own schema in this database.
  --
  -- Nullable, and null on delete rather than cascade: a profile is
  -- referenced by bookings and sessions, which are historical facts. A
  -- person deleting their login should not take a class that happened
  -- out of the record with it. The profile survives, orphaned from any
  -- means of signing in, which is exactly what "the account is gone but
  -- the class happened" should look like.
  auth_user_id  uuid unique references auth.users (id) on delete set null,

  display_name  text not null,

  -- Deliberately NOT unique, and deliberately not the key.
  --
  -- 01 §3: a profile is not keyed by email, because magic link is
  -- explicitly temporary and a user who later signs in with Google must
  -- be the same person. Making this unique would be the first step
  -- towards keying on it by accident.
  email         text not null,

  -- IANA zone, e.g. "America/Sao_Paulo". Every stored instant is UTC;
  -- this exists only to render one and to read one back (04 §1).
  timezone      text not null default 'UTC',

  created_at    timestamptz not null default now()
);

-- profile_role -------------------------------------------------------
--
-- A set, not a column. The author is owner and student simultaneously
-- from day one (01 §1), so `profile.role text` is wrong on the first
-- day, by the founder. The composite primary key is what makes it a set:
-- holding a role twice is not a state that exists.
create table if not exists public.profile_role (
  profile_id  uuid not null references public.profile (id) on delete cascade,
  role        text not null check (role in ('owner', 'tutor', 'student')),
  granted_at  timestamptz not null default now(),

  primary key (profile_id, role)
);

-- The role gate asks this question on every request from a signed-in
-- user who has not chosen yet, so it is worth an index even at this size.
create index if not exists profile_role_profile_id_idx
  on public.profile_role (profile_id);

-- RLS ----------------------------------------------------------------

alter table public.profile      enable row level security;
alter table public.profile_role enable row level security;

-- A person may read their own profile and their own roles. Nothing here
-- grants a write: every write goes through server code holding the
-- service-role key, which is where the authorisation decision is made.
drop policy if exists profile_self_read on public.profile;
create policy profile_self_read on public.profile
  for select
  using (auth_user_id = auth.uid());

drop policy if exists profile_role_self_read on public.profile_role;
create policy profile_role_self_read on public.profile_role
  for select
  using (
    exists (
      select 1
      from public.profile p
      where p.id = profile_role.profile_id
        and p.auth_user_id = auth.uid()
    )
  );
