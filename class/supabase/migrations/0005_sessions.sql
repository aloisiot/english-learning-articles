-- The session record.
--
-- 03 §4: the only thing in this system that cannot be reconstructed
-- after the day has passed, and the reason accounts and the record
-- belong in one phase — only a logged-in join can know who attended.
--
-- Append-only. There is no update path in the application and there is
-- deliberately no policy granting one. Money is absent from this model on
-- the condition that sessions are written from the very first real class
-- (03 §5), and a record that can be edited later is not the record that
-- condition assumes.

create table if not exists public.session (
  id               uuid primary key default gen_random_uuid(),

  -- Nullable, and null on delete. The booking is how the class came to
  -- exist; the session is what happened. One is a plan and the other is
  -- history, and history does not disappear when the plan is tidied up.
  booking_id       uuid references public.booking (id) on delete set null,

  -- Copied onto the row rather than reached through booking (03 §4). A
  -- session is a historical fact and must survive a booking being deleted
  -- or a profile anonymised — which is exactly what these being nullable
  -- references plus their own copied names is for.
  tutor_id         uuid references public.profile (id) on delete set null,
  student_id       uuid references public.profile (id) on delete set null,
  tutor_name       text not null,
  student_name     text not null,

  scheduled_start  timestamptz not null,
  actual_start     timestamptz,
  actual_end       timestamptz,

  outcome          text not null check (outcome in (
                     'completed',
                     'student_cancelled',
                     'student_no_show',
                     'tutor_cancelled',
                     'technical_failure'
                   )),

  created_at       timestamptz not null default now()
);

create index if not exists session_student_idx
  on public.session (student_id, scheduled_start desc);

create index if not exists session_tutor_idx
  on public.session (tutor_id, scheduled_start desc);

-- One session per booking. A class happened once, however many times the
-- endpoint that records it is called.
--
-- Not a partial index, deliberately, even though booking_id is nullable.
-- The adapter records with ON CONFLICT (booking_id), and Postgres refuses
-- to match that against a partial index unless the predicate is restated
-- in the statement too. A plain unique index behaves identically here,
-- because Postgres already treats NULLs as distinct — a session whose
-- booking has been deleted does not collide with another.
create unique index if not exists session_one_per_booking
  on public.session (booking_id);

alter table public.session enable row level security;

-- Read your own history. No insert, update or delete policy exists: the
-- record is written by server code and never amended.
drop policy if exists session_own_read on public.session;
create policy session_own_read on public.session
  for select
  using (
    exists (
      select 1 from public.profile p
      where (p.id = session.student_id or p.id = session.tutor_id)
        and p.auth_user_id = auth.uid()
    )
  );
