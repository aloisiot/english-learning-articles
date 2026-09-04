-- Slots and bookings.
--
-- 03 §3 keeps them apart because their lifecycles differ: a slot can be
-- opened and withdrawn with nobody involved, and a booking can be
-- declined without the slot ceasing to exist.
--
-- Concrete slots, no recurrence (04 §1). That one choice removes the
-- hardest problem in calendar software: a recurring "Tuesdays at 19:00"
-- is a wall-clock intention in the tutor's zone and cannot be stored as
-- an instant without a DST change silently moving it. With concrete
-- slots there is nothing to re-interpret, so **every stored time is a
-- UTC instant** and timezone is an input and display concern only.

create table if not exists public.slot (
  id               uuid primary key default gen_random_uuid(),
  tutor_id         uuid not null references public.profile (id) on delete cascade,

  -- timestamptz, and always written as UTC. The tutor's zone is on their
  -- profile and is used to render this, never to store it.
  starts_at        timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes > 0),

  status           text not null default 'open'
                   check (status in ('open', 'held', 'booked', 'cancelled')),

  created_at       timestamptz not null default now(),

  -- One slot per tutor per instant. Opening the same time twice is a
  -- mistake rather than an intention, and it is cheaper to forbid than
  -- to explain in a list of duplicates.
  unique (tutor_id, starts_at)
);

create index if not exists slot_open_idx
  on public.slot (starts_at)
  where status = 'open';

create table if not exists public.booking (
  id           uuid primary key default gen_random_uuid(),
  slot_id      uuid not null references public.slot (id) on delete cascade,
  student_id   uuid not null references public.profile (id) on delete cascade,

  status       text not null default 'pending'
               check (status in ('pending', 'confirmed', 'declined', 'cancelled')),

  requested_at timestamptz not null default now(),
  decided_at   timestamptz,

  -- Either both or neither: a decided booking with no decision time
  -- cannot answer how long the student waited.
  constraint booking_decision_complete
    check ((status in ('pending', 'cancelled')) or (decided_at is not null))
);

-- 04 §4: the first student to request a slot locks it, and nobody else
-- may request it while the tutor decides. This index is that rule —
-- at most one live claim per slot, enforced by the database rather than
-- by a read-then-write that two requests can interleave.
create unique index if not exists booking_one_live_claim_per_slot
  on public.booking (slot_id)
  where status in ('pending', 'confirmed');

create index if not exists booking_student_idx on public.booking (student_id);

alter table public.slot    enable row level security;
alter table public.booking enable row level security;

-- Students see open slots; everyone sees their own bookings. Writes go
-- through server code, so there are deliberately no write policies.
create policy slot_open_read on public.slot
  for select
  using (status = 'open');

create policy slot_own_read on public.slot
  for select
  using (
    exists (
      select 1 from public.profile p
      where p.id = slot.tutor_id and p.auth_user_id = auth.uid()
    )
  );

create policy booking_own_read on public.booking
  for select
  using (
    exists (
      select 1 from public.profile p
      where p.id = booking.student_id and p.auth_user_id = auth.uid()
    )
  );
