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
