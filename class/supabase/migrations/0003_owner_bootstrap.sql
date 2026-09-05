-- Make the first person the owner.
--
-- The owner role is the one thing nobody can give themselves (01 §2 —
-- otherwise a stranger approves themselves as a tutor), so it has to
-- come from outside the application. This is that outside.
--
-- Run it once, after signing in for the first time, with your own
-- address. Re-running it is harmless: the insert is idempotent and the
-- select simply finds nothing if the address is unknown.
--
-- Replace the address before running. It is not a placeholder that
-- something else fills in — leaving it will grant nothing, which is the
-- intended failure.

insert into public.profile_role (profile_id, role)
select p.id, 'owner'
from public.profile p
where p.email = 'you@example.com'
on conflict (profile_id, role) do nothing;
