# Database

Migrations for the Supabase project behind the class app. Plain SQL, run
in filename order, and each one is written to be re-runnable — every
`create` is guarded, and the policies are dropped before being recreated
because Postgres has no `create policy if not exists`.

## Applying them

Either works. The SQL editor is fine for the first few; the CLI is worth
it once there is a second environment.

**Supabase dashboard** — SQL Editor, paste the file, run. Do them in
order and do not skip one.

**Supabase CLI**, from this directory's parent (`class/`):

```bash
supabase link --project-ref <ref>
supabase db push
```

## What is here

| | |
|---|---|
| `0001_profiles_and_roles.sql` | `profile` and `profile_role` |
| `0002_tutor_settings.sql` | the tutor's vetting preference, and the owner's approval |
| `0003_owner_bootstrap.sql` | **run last, by hand, after signing in once** |
| `0004_slots_and_bookings.sql` | `slot` and `booking` |
| `0005_sessions.sql` | `session`, append-only |

`0003` is the odd one and the order matters: it grants the owner role by
looking up a profile by email, and no profile exists until somebody has
signed in. Run `0001`, `0002`, `0004`, `0005`, sign in, then edit `0003`
to your own address and run it.

## Two things that look wrong and are not

**`profile.email` is not unique.** A profile is not keyed by email
(`01` §3), because magic link is explicitly temporary and the same human
must survive arriving later through Google. A unique constraint is how a
codebase starts keying on it by accident.

**The RLS policies do not protect anything on their own.** The
application connects with the service-role key, which bypasses them. That
is deliberate and is stated in `02` §3c: authorisation is decided in
server code, and RLS is defence in depth behind it. Reading these
policies as the security model is the misunderstanding that would make
leaving Supabase mean rewriting the security model.
