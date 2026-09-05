/**
 * The only file in this application that constructs a Supabase client.
 *
 * The counterpart to features/call/adapters/daily.ts, which calls itself
 * "the only place in the app that talks to Daily over the network", and
 * kept as thin for the same reason: an adapter that decides things is a
 * domain module hiding in the wrong directory, and it cannot be tested
 * without mocking the thing under test.
 *
 * Two clients, because they act as different people:
 *
 * - `serviceClient()` acts as the application. It bypasses every RLS
 *   policy, which is safe only because authorisation is decided in
 *   server code before anything here is called
 *   (research/accounts-and-scheduling/02 §3c). RLS is the second line.
 *   If a caller reaches this without having checked who is asking, the
 *   database will not catch the mistake.
 * - `anonClient()` acts as the visitor, for the magic-link exchange,
 *   where acting as the application would be wrong.
 *
 * Constructed per call rather than held in a module-level constant: the
 * keys come from server/config.ts, which reads the environment at
 * request time on purpose, and caching a client here would bake a build
 * -time value back in and undo that.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "@/server/config";

/** Acts as the application. Bypasses RLS — see the note above. */
export function serviceClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Acts as the visitor, for sign-in. */
export function anonClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * One trivial read, to prove the project is reachable and the keys work.
 *
 * Deliberately asks the auth schema rather than a table of ours: it
 * answers before any migration has run, so it separates "the project is
 * reachable" from "the schema is what I expected" — which are different
 * failures with different fixes, and are easily confused on day one.
 *
 * Returns a result rather than throwing, and interprets nothing: what a
 * failure *means* is a decision, and decisions do not live in adapters.
 */
export async function checkConnectivity(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const { error } = await serviceClient().auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (cause) {
    return {
      ok: false,
      error: cause instanceof Error ? cause.message : String(cause),
    };
  }
}
