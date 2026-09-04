/**
 * How a signed-in session is carried between requests.
 *
 * The tokens themselves come from the identity provider; everything
 * about *how they are stored* is this application's decision, and it is
 * the half that gets security wrong. So it lives here, tested, rather
 * than inline in a route handler.
 */

/**
 * Two cookies rather than one.
 *
 * The access token is short-lived and is what every request checks; the
 * refresh token is long-lived and is only ever sent to the provider.
 * Keeping them apart means the common path reads the cheap one, and a
 * bug that leaks one does not automatically leak the other.
 */
export const ACCESS_COOKIE = "class_at";
export const REFRESH_COOKIE = "class_rt";

/**
 * One month, matching the project's session lifetime (01 §4).
 *
 * Long on purpose: a class must never be delayed by a login. The answer
 * to sensitive actions is fresh re-authentication for those actions, not
 * a short session for everyone — and none exist yet.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
}

/**
 * `sameSite: "lax"` rather than `"strict"`, and the reason is the whole
 * flow: a magic link is a top-level navigation *from the user's mail
 * client*, and `strict` withholds cookies on exactly that, so the user
 * would arrive back at the app signed out. `lax` sends them on a
 * top-level GET, which is what a clicked link is.
 *
 * `path: "/class"` because that is where this app lives behind the
 * microfrontends routing. The articles site shares the domain and has no
 * business receiving these.
 *
 * `secure` is off only when there is no HTTPS to be had, which in
 * practice is localhost — a secure cookie is simply dropped there, and
 * the failure looks like a login that silently does nothing.
 */
export function sessionCookie(
  isSecure: boolean,
  maxAge: number = SESSION_MAX_AGE_SECONDS,
): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/class",
    maxAge,
  };
}

/** The same cookie, expired — which is how a cookie is deleted. */
export function clearedCookie(isSecure: boolean): CookieOptions {
  return sessionCookie(isSecure, 0);
}

/**
 * Whether the deployment is served over HTTPS.
 *
 * Derived from the configured public origin rather than from the request,
 * because a request's own scheme is whatever a proxy said it was.
 */
export function isSecureOrigin(origin: string): boolean {
  return origin.startsWith("https://");
}

/**
 * Refresh a little before the token actually dies.
 *
 * Without the margin, a request that arrives in the last moments of a
 * token's life passes this check and then fails against the provider,
 * which is a race that only shows up under load and looks like a random
 * logout.
 */
export const REFRESH_SKEW_SECONDS = 60;

/**
 * When an access token expires, read out of the token itself.
 *
 * The signature is deliberately **not** checked here, and that is safe
 * because nothing is trusted on the strength of it: the answer is only
 * used to decide whether to ask the provider for a new token, and the
 * provider verifies for real. Forging an early expiry buys an attacker
 * one wasted refresh call.
 *
 * Reading it locally is the point. The alternative is asking the
 * provider "is this still good?" on every single request, which is a
 * network round trip in front of every page.
 */
export function accessTokenExpiry(token: string | undefined): number | null {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = parts[1] as string;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const claims: unknown = JSON.parse(atob(padded));

    if (typeof claims !== "object" || claims === null) return null;
    const exp = (claims as { exp?: unknown }).exp;

    return typeof exp === "number" && Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
}

/**
 * Whether this request should refresh before doing anything else.
 *
 * A token we cannot read at all counts as needing refresh: it is either
 * absent, truncated or from another era, and in every one of those cases
 * asking for a new one is the right move.
 */
export function needsRefresh(
  accessToken: string | undefined,
  now: Date,
  skewSeconds: number = REFRESH_SKEW_SECONDS,
): boolean {
  const exp = accessTokenExpiry(accessToken);
  if (exp === null) return true;

  return exp - skewSeconds <= Math.floor(now.getTime() / 1000);
}
