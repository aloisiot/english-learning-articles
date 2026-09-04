-- Tutor settings, and the owner's gate on a tutor.
--
-- 03 §2 and 04 §2/§3. The two flags here are easy to confuse and mean
-- opposite kinds of thing, which is why the longer name exists:
--
--   requires_booking_approval  the TUTOR's preference about vetting who
--                              books their time
--   approved_at                the OWNER's decision about whether this
--                              tutor may be booked at all
--
-- One is a preference, the other is a gate. Reading one for the other
-- either exposes an unvetted stranger to students, or silently stops a
-- vetted tutor from being booked.

create table if not exists public.tutor_settings (
  profile_id uuid primary key
    references public.profile (id) on delete cascade,

  -- The tutor's own choice. Default true: a new tutor sees who wants
  -- their time before it is taken, and can turn the vetting off once
  -- they would rather any open slot simply filled.
  requires_booking_approval boolean not null default true,

  -- The owner's gate. A timestamp and an approver rather than a boolean,
  -- because "who let this tutor in, and when" is the question asked once
  -- something has gone wrong, and a boolean cannot answer it (03 §2).
  -- Null means not yet approved.
  approved_at timestamptz,
  approved_by uuid references public.profile (id) on delete set null,

  created_at  timestamptz not null default now(),

  -- Either both or neither. An approval with no approver is the state
  -- that makes the audit trail worthless, and it is cheap to forbid.
  constraint tutor_settings_approval_complete
    check ((approved_at is null) = (approved_by is null))
);

-- Every query that lists bookable slots joins through this, so the
-- approved set is the one worth indexing.
create index if not exists tutor_settings_approved_idx
  on public.tutor_settings (profile_id)
  where approved_at is not null;

alter table public.tutor_settings enable row level security;

-- A tutor may read their own settings. Approving is a server-side act
-- with the service-role key; there is deliberately no policy granting it.
drop policy if exists tutor_settings_self_read on public.tutor_settings;
create policy tutor_settings_self_read on public.tutor_settings
  for select
  using (
    exists (
      select 1 from public.profile p
      where p.id = tutor_settings.profile_id
        and p.auth_user_id = auth.uid()
    )
  );
