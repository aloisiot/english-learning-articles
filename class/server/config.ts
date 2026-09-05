/**
 * Environment the class app needs, read at request time.
 *
 * Deliberately functions rather than module-level constants: reading
 * `process.env` while a module is being evaluated bakes the value in at
 * build time, and these are secrets that must come from the running
 * deployment. Each getter throws rather than returning undefined, so a
 * missing variable fails as a 500 on the route that needed it instead of
 * silently becoming the string "undefined" inside an HMAC.
 */

function required(name: string): string {
  const value = process.env[name];
  if (typeof value !== "string" || value === "") {
    throw new Error(`${name} is not set`);
  }
  return value;
}

/** HMAC key for signing and verifying class links. */
export const linkSecret = (): string => required("CLASS_LINK_SECRET");

/** Shared secret the admin page re-checks on every submission. */
export const adminSecret = (): string => required("CLASS_ADMIN_SECRET");

/** The unguessable path segment the admin page lives behind. */
export const adminPath = (): string => required("CLASS_ADMIN_PATH");

/** Daily REST API key. Server-side only — never sent to a browser. */
export const dailyApiKey = (): string => required("DAILY_API_KEY");

/** Daily subdomain, i.e. the `x` in `https://x.daily.co/<room>`. */
export const dailyDomain = (): string => required("DAILY_DOMAIN");

/**
 * The origin students actually visit — the articles site's domain, not
 * this app's own Vercel URL.
 *
 * `/class` is reached through the microfrontends group declared in
 * site/microfrontends.json, so a link
 * built from this app's request origin would point at the class
 * project's deployment URL and bypass the arrangement entirely. It has
 * to be stated rather than inferred.
 */
export const publicOrigin = (): string =>
  required("CLASS_PUBLIC_ORIGIN").replace(/\/+$/, "");

/**
 * Supabase project URL. Not a secret, but read through the same gate as
 * everything else so that a half-configured deployment fails loudly on
 * the first request rather than assembling a URL containing "undefined".
 */
export const supabaseUrl = (): string => required("SUPABASE_URL");

/**
 * The service-role key.
 *
 * It bypasses every RLS policy, so it is the one credential in this file
 * whose leak is total rather than partial. Server-side only, never
 * NEXT_PUBLIC_, and never handed to a browser: authorisation is decided
 * in server code and RLS is defence in depth behind it
 * (research/accounts-and-scheduling/02 §3c). That ordering is what makes
 * this key dangerous — the database will not second-guess it.
 */
export const supabaseServiceRoleKey = (): string =>
  required("SUPABASE_SERVICE_ROLE_KEY");

/**
 * The anon key, for the sign-in flow.
 *
 * Used where the request should act as the visitor rather than as the
 * application — sending a magic link, and exchanging it for a session.
 */
export const supabaseAnonKey = (): string => required("SUPABASE_ANON_KEY");
