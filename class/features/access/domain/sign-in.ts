/**
 * The decisions behind signing in, kept away from the vendor.
 *
 * Sign-up and sign-in are the same act (01 §3): a clicked link is proof
 * of inbox control, so there is no separate verification step and no
 * "account already exists" branch. Nothing here knows that Supabase is
 * on the other side, and nothing here should.
 */

/** Where a signed-in user lands when they asked for nothing in particular. */
export const DEFAULT_RETURN_TO = "/";

/**
 * Lowercased and trimmed.
 *
 * Not because the local part is case-insensitive — by the RFC it is not
 * — but because every mail provider a student will plausibly use treats
 * it as though it were, and a profile per capitalisation is a worse
 * failure than a pedantic one. Email is an attribute here rather than a
 * key (01 §3), so this only decides which inbox is written to.
 */
export function normaliseEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

/**
 * Deliberately shallow.
 *
 * The real test of an address is whether the message arrives, and this
 * runs before that. Its whole job is to reject what is obviously not an
 * attempt — an empty box, a pasted sentence — so the user is told
 * immediately instead of waiting for mail that was never going to come.
 * Anything stricter starts rejecting valid addresses, which is the
 * classic way to lock a real person out.
 */
export function isPlausibleEmail(email: string): boolean {
  if (email.length === 0 || email.length > 254) return false;
  if (/\s/.test(email)) return false;

  const parts = email.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts as [string, string];
  return local.length > 0 && domain.includes(".") && !domain.startsWith(".") &&
    !domain.endsWith(".");
}

/**
 * An open redirect is the classic hole in a sign-in flow: the return-to
 * parameter is attacker-controlled and arrives on a page the user has
 * just been told to trust.
 *
 * So only an app-relative path survives, and the awkward cases are the
 * point rather than paranoia. `//evil.example` is a protocol-relative
 * URL that browsers treat as absolute; a backslash is read as a slash by
 * some parsers and not others, which is enough to disagree with whatever
 * checked it; and a scheme gets out of the site entirely.
 */
export function safeReturnTo(
  raw: unknown,
  fallback: string = DEFAULT_RETURN_TO,
): string {
  if (typeof raw !== "string" || raw === "") return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  if (raw.includes("://")) return fallback;
  return raw;
}

/** Why a magic link did not sign someone in. */
export const SIGN_IN_FAILURE = {
  /** No token in the URL at all — a truncated or hand-edited link. */
  MALFORMED: "malformed",
  /** The link was valid once. Links are single-use and time-boxed. */
  EXPIRED: "expired",
  /** Everything else, including the provider being unreachable. */
  UNAVAILABLE: "unavailable",
} as const;

export type SignInFailure =
  (typeof SIGN_IN_FAILURE)[keyof typeof SIGN_IN_FAILURE];

/**
 * What a provider's refusal means, as data.
 *
 * The distinction worth drawing for a reader is expired-versus-broken:
 * one is "ask for another link", the other is "this is not your fault
 * and trying again will not help". Everything else collapses into
 * unavailable on purpose — a sign-in screen that enumerates provider
 * error codes tells an attacker more than it tells a student.
 */
export function classifySignInFailure(message: unknown): SignInFailure {
  if (typeof message !== "string") return SIGN_IN_FAILURE.UNAVAILABLE;

  const text = message.toLowerCase();
  if (text.includes("expired") || text.includes("invalid")) {
    return SIGN_IN_FAILURE.EXPIRED;
  }
  return SIGN_IN_FAILURE.UNAVAILABLE;
}

/**
 * The link Supabase should send the user back to.
 *
 * Built here rather than in the adapter because it encodes an
 * application decision — that the return-to survives the round trip
 * through the user's inbox — and because getting it wrong is an open
 * redirect with extra steps. `origin` is the site's own origin, never
 * the request's: /class is reached through the microfrontends routing,
 * so a URL built from this app's deployment would bypass it.
 */
export function callbackUrl(origin: string, returnTo: unknown): string {
  const url = new URL("/class/auth/callback", origin);
  url.searchParams.set("return_to", safeReturnTo(returnTo));
  return url.toString();
}

/**
 * The kinds of email link this app will verify.
 *
 * Supabase sends a *different template* depending on why the mail went
 * out — a first-time address gets "Confirm signup", a known one gets
 * "Magic Link" — and the link carries which in its `type`. Hard-coding
 * one of them works right up until the first new user, which is exactly
 * how this was found.
 *
 * `email` is the generic that covers signup and sign-in both, and is
 * what the templates should carry. The others are accepted because the
 * same callback will serve password recovery and email changes when
 * those exist, and because refusing an unknown type is better than
 * passing it through to the provider.
 */
export const VERIFICATION_TYPES = [
  "email",
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
] as const;

export type VerificationType = (typeof VERIFICATION_TYPES)[number];

/** The default is the generic one, not the one this app happens to send. */
export const DEFAULT_VERIFICATION_TYPE: VerificationType = "email";

export function verificationType(raw: unknown): VerificationType {
  return VERIFICATION_TYPES.includes(raw as VerificationType)
    ? (raw as VerificationType)
    : DEFAULT_VERIFICATION_TYPE;
}
